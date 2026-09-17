// ======================================================
// BOK - Firebase
// ======================================================

const firebaseConfig = {
    apiKey: "AIzaSyDnvmRTgZl1p325V3TmCjIH-PnPfjJPPpk",
    authDomain: "bok-ped.firebaseapp.com",
    databaseURL: "https://bok-ped-default-rtdb.firebaseio.com",
    projectId: "bok-ped",
    storageBucket: "bok-ped.firebasestorage.app",
    messagingSenderId: "812838230843",
    appId: "1:812838230843:web:f3bd5f59343db42b52b51e",
    measurementId: "G-26SMZR0QCC"
};


// ======================================================
// تشغيل Firebase
// ======================================================

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.database();


// ======================================================
// عناصر الصفحة
// ======================================================

const loginSection = document.getElementById("loginSection");
const searchSection = document.getElementById("searchSection");

const loginButton = document.getElementById("loginBtn");

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

const accountInput = document.getElementById("accountNumber");
const searchButton = document.getElementById("searchBtn");

const searchMessage = document.getElementById("searchMessage");


// ======================================================
// بيانات الحساب الحالي
// ======================================================

let currentUid = null;
let currentAccountNumber = null;
let currentUserData = null;

let selectedRenewal = null;


// ======================================================
// رسالة للمستخدم
// ======================================================

function showMessage(message, type = "") {

    if (!searchMessage) {
        return;
    }

    searchMessage.textContent = message;
    searchMessage.className = "message";

    if (type) {
        searchMessage.classList.add(type);
    }
}


// ======================================================
// إخفاء رسالة البحث
// ======================================================

function clearMessage() {

    if (!searchMessage) {
        return;
    }

    searchMessage.textContent = "";
    searchMessage.className = "message";
}


// ======================================================
// تسجيل الدخول
// ======================================================

async function login() {

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {

        alert("يرجى إدخال البريد الإلكتروني وكلمة المرور");

        return;
    }


    loginButton.disabled = true;

    const oldText = loginButton.textContent;

    loginButton.textContent = "جاري تسجيل الدخول...";


    try {

        await auth.signInWithEmailAndPassword(
            email,
            password
        );

    } catch (error) {

        console.error("Login error:", error);

        let message = "فشل تسجيل الدخول";

        switch (error.code) {

            case "auth/invalid-email":
                message = "البريد الإلكتروني غير صحيح";
                break;

            case "auth/user-not-found":
                message = "الحساب غير موجود";
                break;

            case "auth/wrong-password":
            case "auth/invalid-credential":
                message = "كلمة المرور غير صحيحة";
                break;

            case "auth/too-many-requests":
                message = "تمت محاولات كثيرة، حاول لاحقاً";
                break;

            case "auth/network-request-failed":
                message = "تحقق من اتصال الإنترنت";
                break;

            default:
                message = error.message || "تعذر تسجيل الدخول";
                break;
        }

        alert(message);

    } finally {

        loginButton.disabled = false;

        loginButton.textContent = oldText;
    }
}


// ======================================================
// ربط زر تسجيل الدخول
// ======================================================

if (loginButton) {

    loginButton.addEventListener(
        "click",
        function (event) {

            event.preventDefault();

            login();

        }
    );
}


// ======================================================
// السماح بالضغط على Enter
// ======================================================

if (passwordInput) {

    passwordInput.addEventListener(
        "keydown",
        function (event) {

            if (event.key === "Enter") {

                event.preventDefault();

                login();
            }
        }
    );
}


// ======================================================
// مراقبة حالة تسجيل الدخول
// ======================================================

auth.onAuthStateChanged(
    function (user) {

        if (user) {

            console.log(
                "Logged in:",
                user.email
            );


            if (loginSection) {
                loginSection.classList.add("hidden");
            }

            if (searchSection) {
                searchSection.classList.remove("hidden");
            }

            clearMessage();

        } else {

            currentUid = null;
            currentAccountNumber = null;
            currentUserData = null;


            if (loginSection) {
                loginSection.classList.remove("hidden");
            }

            if (searchSection) {
                searchSection.classList.add("hidden");
            }
        }
    }
);


// ======================================================
// البحث عن الحساب
// ======================================================

async function searchAccount() {

    clearMessage();


    const accountNumber =
        accountInput.value.trim();


    // --------------------------------------------------
    // التحقق من 7 أرقام
    // --------------------------------------------------

    if (!/^[0-9]{7}$/.test(accountNumber)) {

        showMessage(
            "أدخل رقم حساب مكون من 7 أرقام",
            "error"
        );

        return;
    }


    searchButton.disabled = true;

    const oldText =
        searchButton.textContent;

    searchButton.textContent =
        "جاري البحث...";


    try {

        // --------------------------------------------------
        // accountNumbers/{accountNumber}
        // --------------------------------------------------

        const accountSnapshot =
            await db.ref(
                "accountNumbers/" + accountNumber
            ).once("value");


        if (!accountSnapshot.exists()) {

            showMessage(
                "رقم الحساب غير موجود",
                "error"
            );

            return;
        }


        const accountData =
            accountSnapshot.val();


        const uid =
            accountData.uid;


        if (!uid) {

            showMessage(
                "لا يوجد مستخدم مرتبط بهذا الحساب",
                "error"
            );

            return;
        }


        // --------------------------------------------------
        // users/{uid}
        // --------------------------------------------------

        const userSnapshot =
            await db.ref(
                "users/" + uid
            ).once("value");


        if (!userSnapshot.exists()) {

            showMessage(
                "بيانات الحساب غير موجودة",
                "error"
            );

            return;
        }


        const userData =
            userSnapshot.val();


        // --------------------------------------------------
        // حفظ البيانات الحالية
        // --------------------------------------------------

        currentUid = uid;

        currentAccountNumber =
            accountNumber;

        currentUserData =
            userData;


        // --------------------------------------------------
        // عرض البيانات
        // --------------------------------------------------

        setText(
            "resultAccount",
            accountNumber
        );

        setText(
            "resultName",
            userData.username || "—"
        );


        setText(
            "resultStatus",
            userData.active === true
                ? "مفعل"
                : "غير مفعل"
        );


        setText(
            "resultSubscription",
            userData.subscriptionName || "—"
        );


        setText(
            "resultStart",
            formatDate(
                userData.subscriptionStart
            )
        );


        setText(
            "resultEnd",
            formatDate(
                userData.subscriptionEnd
            )
        );


        // --------------------------------------------------
        // إظهار النتيجة
        // --------------------------------------------------

        const resultBox =
            document.getElementById("resultBox");

        if (resultBox) {
            resultBox.classList.remove("hidden");
        }


        // --------------------------------------------------
        // إعادة اختيار التجديد
        // --------------------------------------------------

        selectedRenewal = null;

        document
            .querySelectorAll(".renewOption")
            .forEach(function (button) {

                button.classList.remove("selected");

            });


        const renewButton =
            document.getElementById("renewBtn");

        if (renewButton) {
            renewButton.disabled = true;
        }


        showMessage(
            "تم العثور على بيانات الحساب",
            "success"
        );

    } catch (error) {

        console.error(
            "Search error:",
            error
        );

        showMessage(
            "تعذر قراءة بيانات الحساب",
            "error"
        );

    } finally {

        searchButton.disabled = false;

        searchButton.textContent =
            oldText;
    }
}


// ======================================================
// ربط زر البحث
// ======================================================

if (searchButton) {

    searchButton.addEventListener(
        "click",
        function (event) {

            event.preventDefault();

            searchAccount();

        }
    );
}


// ======================================================
// Enter في رقم الحساب
// ======================================================

if (accountInput) {

    accountInput.addEventListener(
        "keydown",
        function (event) {

            if (event.key === "Enter") {

                event.preventDefault();

                searchAccount();
            }
        }
    );
}


// ======================================================
// اختيار مدة التجديد
// ======================================================

document
    .querySelectorAll(".renewOption")
    .forEach(function (button) {

        button.addEventListener(
            "click",
            function () {

                if (!currentUid) {
                    return;
                }


                document
                    .querySelectorAll(".renewOption")
                    .forEach(function (item) {

                        item.classList.remove(
                            "selected"
                        );

                    });


                button.classList.add(
                    "selected"
                );


                selectedRenewal = {

                    name:
                        button.dataset.name,

                    type:
                        button.dataset.type,

                    days:
                        button.dataset.days
                            ? Number(button.dataset.days)
                            : null,

                    months:
                        button.dataset.months
                            ? Number(button.dataset.months)
                            : null
                };


                const renewButton =
                    document.getElementById(
                        "renewBtn"
                    );


                if (renewButton) {
                    renewButton.disabled = false;
                }
            }
        );
    });


// ======================================================
// تجديد الاشتراك
// ======================================================

const renewButton =
    document.getElementById("renewBtn");


if (renewButton) {

    renewButton.addEventListener(
        "click",
        async function () {

            if (!currentUid) {

                alert(
                    "ابحث عن الحساب أولاً"
                );

                return;
            }


            if (!selectedRenewal) {

                alert(
                    "اختر مدة الاشتراك أولاً"
                );

                return;
            }


            renewButton.disabled = true;

            const oldText =
                renewButton.textContent;

            renewButton.textContent =
                "جاري التجديد...";


            try {

                const now =
                    Date.now();


                const oldEnd =
                    Number(
                        currentUserData.subscriptionEnd
                    ) || 0;


                // --------------------------------------------------
                // إذا الاشتراك الحالي ساري
                // يبدأ التجديد من نهايته
                // وإذا منتهي يبدأ من الآن
                // --------------------------------------------------

                const startTime =
                    oldEnd > now
                        ? oldEnd
                        : now;


                let endTime =
                    startTime;


                // --------------------------------------------------
                // أيام
                // --------------------------------------------------

                if (
                    selectedRenewal.days
                ) {

                    endTime +=
                        selectedRenewal.days *
                        24 *
                        60 *
                        60 *
                        1000;
                }


                // --------------------------------------------------
                // أشهر
                // --------------------------------------------------

                if (
                    selectedRenewal.months
                ) {

                    const date =
                        new Date(startTime);

                    date.setMonth(
                        date.getMonth() +
                        selectedRenewal.months
                    );

                    endTime =
                        date.getTime();
                }


                // --------------------------------------------------
                // تحديث Firebase
                // --------------------------------------------------

                await db
                    .ref(
                        "users/" + currentUid
                    )
                    .update({

                        active: true,

                        subscriptionStart:
                            startTime,

                        subscriptionEnd:
                            endTime,

                        subscriptionName:
                            selectedRenewal.name,

                        subscriptionType:
                            selectedRenewal.type
                    });


                // --------------------------------------------------
                // تحديث البيانات المحلية
                // --------------------------------------------------

                currentUserData.subscriptionStart =
                    startTime;

                currentUserData.subscriptionEnd =
                    endTime;

                currentUserData.subscriptionName =
                    selectedRenewal.name;

                currentUserData.subscriptionType =
                    selectedRenewal.type;

                currentUserData.active =
                    true;


                // --------------------------------------------------
                // تحديث الشاشة
                // --------------------------------------------------

                setText(
                    "resultStatus",
                    "مفعل"
                );

                setText(
                    "resultSubscription",
                    selectedRenewal.name
                );

                setText(
                    "resultStart",
                    formatDate(startTime)
                );

                setText(
                    "resultEnd",
                    formatDate(endTime)
                );


                // --------------------------------------------------
                // نافذة النجاح
                // --------------------------------------------------

                showSuccessModal(
                    currentAccountNumber
                );


            } catch (error) {

                console.error(
                    "Renew error:",
                    error
                );


                let message =
                    "تعذر تجديد الاشتراك";


                if (
                    error &&
                    error.code ===
                    "PERMISSION_DENIED"
                ) {

                    message =
                        "ليس لديك صلاحية لتجديد هذا الحساب";
                }


                alert(message);

            } finally {

                renewButton.disabled =
                    false;

                renewButton.textContent =
                    oldText;
            }
        }
    );
}


// ======================================================
// عرض نافذة نجاح التجديد
// ======================================================

function showSuccessModal(accountNumber) {

    const overlay =
        document.getElementById(
            "successOverlay"
        );


    if (!overlay) {

        alert(
            "تم تجديد الاشتراك بنجاح\nحساب رقم: " +
            accountNumber
        );

        return;
    }


    setText(
        "successAccount",
        accountNumber
    );


    overlay.classList.remove(
        "hidden"
    );
}


// ======================================================
// إغلاق نافذة النجاح
// ======================================================

const successButton =
    document.getElementById(
        "successButton"
    );


if (successButton) {

    successButton.addEventListener(
        "click",
        function () {

            const overlay =
                document.getElementById(
                    "successOverlay"
                );


            if (overlay) {

                overlay.classList.add(
                    "hidden"
                );
            }
        }
    );
}


// ======================================================
// تسجيل الخروج
// ======================================================

const logoutButton =
    document.getElementById(
        "logoutBtn"
    );


if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        async function () {

            try {

                await auth.signOut();

            } catch (error) {

                console.error(
                    "Logout error:",
                    error
                );
            }
        }
    );
}


// ======================================================
// وضع النص في عنصر
// ======================================================

function setText(id, value) {

    const element =
        document.getElementById(id);


    if (element) {

        element.textContent =
            value == null
                ? "—"
                : String(value);
    }
}


// ======================================================
// تنسيق التاريخ
// ======================================================

function formatDate(timestamp) {

    if (!timestamp) {
        return "—";
    }


    const date =
        new Date(
            Number(timestamp)
        );


    if (isNaN(date.getTime())) {
        return "—";
    }


    return date.toLocaleString(
        "ar",
        {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit"
        }
    );
}
