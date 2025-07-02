// بيانات وهمية للخدمات في الأقصر (ستأتي من الواجهة الخلفية لاحقًا)
// الإحداثيات هنا تقريبية لمناطق في الأقصر
let services = []; // الآن، هذا المتغير سيكون فارغًا في البداية وسيتم ملؤه من ملف JSON

// دالة جديدة لجلب البيانات وتشغيل التطبيق
async function fetchServicesAndInitialize() {
    try {
        const response = await fetch('services.json'); // اسم ملف JSON الخاص بك
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        services = await response.json(); // قم بتعيين البيانات للمتغير 'services'
        console.log('Services loaded successfully:', services);
        getUserLocation(); // بعد تحميل الخدمات، ابدأ في الحصول على موقع المستخدم
    } catch (error) {
        console.error('Failed to load services:', error);
        alert("تعذر تحميل بيانات الخدمات. يرجى التأكد من وجود ملف services.json وتشغيل خادم محلي.");
        // لا يزال من الممكن محاولة تحديد موقع المستخدم، ولكن لن تظهر الخدمات
        getUserLocation();
    }
}

// تهيئة الخريطة باستخدام Leaflet
let map = L.map('map').setView([25.6900, 32.6390], 13); // مركز الخريطة الأولي (قرب وسط الأقصر) ومستوى التكبير

// إضافة طبقة خرائط OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

let userMarker; // لتخزين علامة موقع المستخدم
let serviceMarkers = L.layerGroup().addTo(map); // لتخزين علامات الخدمات

// **********************************************
// وظائف تحديد الموقع
// **********************************************

// وظيفة الحصول على موقع المستخدم
function getUserLocation() {
    if (navigator.geolocation) {
        // هذا هو السطر الذي تم تصحيحه!
        // نستخدم getCurrentPosition للحصول على الموقع لمرة واحدة
        navigator.geolocation.getCurrentPosition(onLocationFound, onLocationError, {
            enableHighAccuracy: true, // محاولة الحصول على أدق موقع ممكن
            timeout: 10000,           // مهلة 10 ثوانٍ قبل الإبلاغ عن خطأ
            maximumAge: 0             // لا نستخدم نتائج سابقة مخبأة
        });
    } else {
        alert("متصفحك لا يدعم تحديد الموقع الجغرافي. يرجى استخدام متصفح أحدث.");
        displayServices(services); // عرض الخدمات بدون موقع المستخدم إذا كان التحديد غير مدعوم
    }
}

// عند العثور على موقع المستخدم
function onLocationFound(position) {
    const latlng = L.latLng(position.coords.latitude, position.coords.longitude);
    if (userMarker) {
        map.removeLayer(userMarker); // إزالة العلامة القديمة إذا كانت موجودة
    }
    userMarker = L.marker(latlng).addTo(map)
        .bindPopup("موقعك الحالي").openPopup();
    map.setView(latlng, 15); // تكبير الخريطة على موقع المستخدم

    displayServices(services); // عرض كل الخدمات بعد تحديد موقع المستخدم
}

// عند حدوث خطأ في تحديد الموقع
function onLocationError(error) {
    let errorMessage = "تعذر تحديد موقعك. سيتم عرض الخدمات في الأقصر بشكل عام.";
    switch(error.code) {
        case error.PERMISSION_DENIED:
            errorMessage = "تم رفض إذن تحديد الموقع. يرجى السماح بالوصول لموقعك.";
            break;
        case error.POSITION_UNAVAILABLE:
            errorMessage = "معلومات الموقع غير متوفرة حالياً.";
            break;
        case error.TIMEOUT:
            errorMessage = "انتهت مهلة طلب تحديد الموقع.";
            break;
        case error.UNKNOWN_ERROR:
            errorMessage = "حدث خطأ غير معروف أثناء تحديد الموقع.";
            break;
    }
    alert(errorMessage);
    displayServices(services); // عرض الخدمات بدون موقع المستخدم
}

// **********************************************
// وظائف عرض الخدمات والتصفية
// **********************************************

// وظيفة عرض الخدمات على الخريطة
function displayServices(servicesToShow) {
    serviceMarkers.clearLayers(); // مسح العلامات الموجودة
    servicesToShow.forEach(service => {
        const marker = L.marker([service.lat, service.lng]).addTo(serviceMarkers);
        marker.bindPopup(`<b>${service.name}</b><br>${service.address}<br><a href="#" data-id="${service.id}" class="show-details">المزيد من التفاصيل</a>`);
        // عند النقر على الرابط في الـ popup، نعرض المودال
        marker.on('popupopen', function (e) {
            const link = e.popup.getElement().querySelector('.show-details');
            if (link) {
                link.onclick = (event) => {
                    event.preventDefault();
                    showServiceDetails(service.id);
                };
            }
        });
    });
}

// وظيفة تصفية الخدمات حسب الفئة
document.querySelectorAll('.category-btn').forEach(button => {
    button.addEventListener('click', function() {
        const category = this.dataset.category;
        document.querySelectorAll('.category-btn').forEach(btn => btn.classList.remove('active'));
        this.classList.add('active');

        if (category === 'all') { // إذا أردنا زر "كل الخدمات"
            displayServices(services);
        } else {
            const filteredServices = services.filter(service => service.type === category);
            displayServices(filteredServices);
        }
    });
});

// **********************************************
// وظائف المودال (تفاصيل الخدمة)
// **********************************************

const modal = document.getElementById('service-details-modal');
const closeButton = document.querySelector('.close-button');
const modalServiceName = document.getElementById('modal-service-name');
const modalServiceType = document.getElementById('modal-service-type');
const modalServiceAddress = document.getElementById('modal-service-address');
const modalServicePhone = document.getElementById('modal-service-phone');
const modalServiceHours = document.getElementById('modal-service-hours');
const modalDirectionsBtn = document.getElementById('modal-directions-btn');

function showServiceDetails(serviceId) {
    const service = services.find(s => s.id === serviceId);
    if (service) {
        modalServiceName.textContent = service.name;
        // تحويل أنواع الخدمات للعربية للعرض
        let serviceTypeArabic;
        switch(service.type) {
            case 'hospitals': serviceTypeArabic = 'مستشفى'; break;
            case 'pharmacies': serviceTypeArabic = 'صيدلية'; break;
            case 'police': serviceTypeArabic = 'شرطة'; break;
            case 'banks': serviceTypeArabic = 'بنك'; break;
            case 'post-offices': serviceTypeArabic = 'بريد'; break;
            default: serviceTypeArabic = service.type;
        }
        modalServiceType.textContent = `النوع: ${serviceTypeArabic}`;
        modalServiceAddress.textContent = `العنوان: ${service.address}`;
        modalServicePhone.textContent = `الهاتف: ${service.phone}`;
        modalServiceHours.textContent = `ساعات العمل: ${service.hours}`;

// إعداد زر "الانتقال إلى الموقع على الخريطة"
        // سنفترض أن زر التوجيه (modalDirectionsBtn) سيُستخدم لهذا الغرض الآن
        modalDirectionsBtn.textContent = 'الانتقال إلى الموقع على الخريطة'; // تغيير نص الزر ليكون واضحًا

        modalDirectionsBtn.onclick = () => {
            // إخفاء المودال أولاً
            modal.style.display = 'none';

            // الانتقال إلى إحداثيات الخدمة وتكبير الخريطة عليها
            map.setView([service.lat, service.lng], 16); // 16 هو مستوى تكبير جيد لرؤية تفاصيل الموقع
            
            // اختياري: فتح الـ popup الخاص بالخدمة تلقائيًا عند الانتقال إليها
            // للقيام بذلك، نحتاج لإيجاد العلامة الخاصة بالخدمة
            serviceMarkers.eachLayer(function(layer) {
                if (layer.options.id === service.id) { // إذا كان لديك معرف للعلامة
                    layer.openPopup();
                }
            });
            // ملاحظة: لكي تعمل ميزة فتح الـ popup التلقائية، يجب إضافة 'id' كخيار للماركر عند إنشائه
            // في دالة displayServices، قم بتعديل سطر إنشاء الماركر ليصبح:
            // const marker = L.marker([service.lat, service.lng], { id: service.id }).addTo(serviceMarkers);
        };
        modal.style.display = 'flex'; // إظهار المودال (نستخدم flex لجعلها تتوسط)
    }
}

closeButton.onclick = function() {
    modal.style.display = 'none'; // إخفاء المودال
}

// إخفاء المودال عند النقر خارج المحتوى
window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = 'none';
    }
}

// **********************************************
// وظائف البحث عن أقرب خدمة
// **********************************************

// **********************************************
// وظائف المودال الجديد لأقرب الخدمات (المعايير)
// **********************************************
const nearestServicesCriteriaModal = document.getElementById('nearest-services-criteria-modal');
const closeNearestModalButton = document.getElementById('close-nearest-modal');
const nearestServiceTypeSelect = document.getElementById('nearest-service-type-select');
const findNearestBtnInModal = document.getElementById('find-nearest-btn-in-modal');

// عند النقر على زر "أقرب الخدمات لي"
document.getElementById('nearest-services-btn').addEventListener('click', function() {
    if (!userMarker) {
        alert("يرجى السماح بتحديد موقعك أولاً للعثور على أقرب الخدمات.");
        getUserLocation(); // محاولة تحديد الموقع إذا لم يكن متاحًا
        return;
    }
    nearestServicesCriteriaModal.style.display = 'flex'; // إظهار المودال
});

// إغلاق المودال من زر الإغلاق
closeNearestModalButton.onclick = function() {
    nearestServicesCriteriaModal.style.display = 'none';
}

// إغلاق المودال عند النقر خارج المحتوى
window.addEventListener('click', function(event) {
    if (event.target == nearestServicesCriteriaModal) {
        nearestServicesCriteriaModal.style.display = 'none';
    }
});

// عند النقر على زر "البحث" داخل مودال أقرب الخدمات
findNearestBtnInModal.addEventListener('click', function() {
    const selectedCategory = nearestServiceTypeSelect.value;
    const userLatLng = userMarker.getLatLng();

    let filteredServices = services;
    if (selectedCategory !== 'all') {
        filteredServices = services.filter(service => service.type === selectedCategory);
    }

    const distances = filteredServices.map(service => {
        const serviceLatLng = L.latLng(service.lat, service.lng);
        const distance = userLatLng.distanceTo(serviceLatLng);
        return { service: service, distance: distance };
    });

    distances.sort((a, b) => a.distance - b.distance);


    nearestServicesCriteriaModal.style.display = 'none'; // إخفاء المودال بعد البحث



if (distances.length > 0) {
        const nearestService = distances[0].service; // أقرب خدمة هي الأولى بعد الترتيب
        map.setView([nearestService.lat, nearestService.lng], 16); // تكبير الخريطة على أقرب خدمة، 16 هو مستوى زووم جيد

        // اختياري: فتح الـ popup الخاص بالخدمة تلقائيا بعد الانتقال إليها
        serviceMarkers.eachLayer(function(layer) {
            // للتأكد من فتح الـ popup الصحيح، يجب أن يكون الماركر لديه خاصية id مطابقة لـ service.id
            // تأكد أنك قمت بتعديل دالة displayServices لإضافة id للماركر
            if (layer.options && layer.options.id === nearestService.id) {
                layer.openPopup();
            }
        });
    }

    // عرض النتائج في تنبيه (يمكن تعديلها لاحقًا لعرضها بشكل أفضل)
    let nearestList = `أقرب ${selectedCategory === 'all' ? 'الخدمات' : nearestServiceTypeSelect.options[nearestServiceTypeSelect.selectedIndex].text} إليك:\n`;
    if (distances.length === 0) {
        nearestList += "لم يتم العثور على خدمات مطابقة في هذه الفئة.";
    } else {
        for (let i = 0; i < Math.min(5, distances.length); i++) {
            nearestList += `${distances[i].service.name} (${(distances[i].distance / 1000).toFixed(2)} كم)\n`;
        }
    }
    alert(nearestList);

    // اختياري: يمكنك هنا عرض هذه الخدمات على الخريطة فقط
    // displayServices(distances.map(d => d.service));
});


// **********************************************
// وظائف البحث العام
// **********************************************
document.getElementById('search-button').addEventListener('click', performSearch);
document.getElementById('search-input').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        e.preventDefault(); // منع الإرسال الافتراضي للنموذج إذا كان موجودا
        performSearch();
    }
});

function performSearch() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    if (searchTerm.trim() === '') {
        displayServices(services); // عرض كل الخدمات إذا كان البحث فارغًا
        return;
    }

    const searchResults = services.filter(service =>
        service.name.toLowerCase().includes(searchTerm) ||
        service.address.toLowerCase().includes(searchTerm) ||
        // يمكن توسيع البحث ليشمل الوصف أيضاً أو ترجمة أنواع الخدمات
        (service.type === 'hospitals' && 'مستشفى'.includes(searchTerm)) ||
        (service.type === 'pharmacies' && 'صيدلية'.includes(searchTerm)) ||
        (service.type === 'police' && 'شرطة'.includes(searchTerm)) ||
        (service.type === 'banks' && 'بنك'.includes(searchTerm)) ||
        (service.type === 'post-offices' && 'بريد'.includes(searchTerm))
    );
    displayServices(searchResults);
    if (searchResults.length === 0) {
        alert("لم يتم العثور على نتائج مطابقة لبحثك.");
    }
}


// **********************************************
// وظائف أخرى
// **********************************************

// زر إعادة تمركز الخريطة على موقع المستخدم
document.getElementById('recenter-btn').addEventListener('click', function() {
    if (userMarker) {
        map.setView(userMarker.getLatLng(), 15);
    } else {
        // إذا لم يكن موقع المستخدم متاحًا، نطلب تحديده أولاً
        getUserLocation();
    }
});


// استدعاء الدالة الجديدة لبدء تحميل البيانات وتشغيل التطبيق عند تحميل الصفحة لأول مرة
fetchServicesAndInitialize();

    // وظيفة لإظهار أو إخفاء النافذة المنبثقة
    function togglePopup() {
        const popup = document.getElementById("info-popup");
        const overlay = document.getElementById("info-overlay");
        if (popup.style.display === "block") {
            popup.style.display = "none";
            overlay.style.display = "none";
        } else {
            popup.style.display = "block";
            overlay.style.display = "block";
        }
    }