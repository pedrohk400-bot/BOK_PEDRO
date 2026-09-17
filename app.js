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
// التأكد من تحميل Firebase
// ======================================================

if (typeof firebase === "undefined") {
    throw new Error("Firebase SDK لم يتم تحميله");
}


// ======================================================
// تشغيل Firebase
// ======================================================

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.database();


// ======================================================
// عناصر الصفحة
// ======================================================

const loginBox =
    document.getElementById("loginBox");

const searchBox =
    document.getElementById("searchBox");

const emailInput =
    document.getElementById("email");

const passwordInput =
    document.getElementById("password");

const loginButton =
    document.getElementById("loginButton");

const message =
    document.getElementById("message");

const userEmail =
    document.getElementById("userEmail");

const accountInput =
    document.getElementById("accountNumber");

const searchButton =
    document.getElementById("searchButton");

const searchMessage =
    document.getElementById("searchMessage");

const result =
    document.getElementById("result");

const renewButton =
    document.getElementById("renewButton");

const closeSuccess =
    document.getElementById("closeSuccess");


// ======================================================
// متغيرات النظام
// ======================================================

let currentUid = null;
let currentAccountNumber = null;
let currentUserData = null;
let selectedRenewal = null;


// ======================================================
// رسائل تسجيل الدخول
// ======================================================

function showLoginMessage(text, type) {

    if (!message) {
        return;
    }

    message.textContent = text;

    message.className = "message";

    if (type) {
        message.classList.add(type);
    }
}


// ======================================================
// تسجيل الدخول
// ======================================================

async function login() {

    const email =
        emailInput.value.trim();

    const password =
        passwordInput.value;


    // --------------------------------------------------
    // التأكد من البريد
    // --------------------------------------------------

    if (!email) {

        showLoginMessage(
            "أدخل البريد الإلكتروني",
            "error"
        );

        emailInput.focus();

        return;
    }


    // --------------------------------------------------
    // التأكد من كلمة المرور
    // --------------------------------------------------

    if (!password) {

        showLoginMessage(
            "أدخل كلمة المرور",
            "error"
        );

        passwordInput.focus();

        return;
    }


    // --------------------------------------------------
    // حالة التحميل
    // --------------------------------------------------

    loginButton.disabled = true;

    loginButton.textContent =
        "جاري تسجيل الدخول...";

    showLoginMessage(
        "جاري التحقق...",
        ""
    );


    try {

        // ------------------------------------------------
        // تسجيل الدخول عبر Firebase Auth
        // ------------------------------------------------

        const loginResult =
            await auth.signInWithEmailAndPassword(
                email,
                password
            );


        currentUid =
            loginResult.user.uid;


        showLoginMessage(
            "تم تسجيل الدخول بنجاح",
            "success"
        );


    } catch (error) {

        console.error(
            "LOGIN ERROR:",
            error
        );


        let errorText =
            "تعذر تسجيل الدخول";


        switch (error.code) {

            case "auth/invalid-email":

                errorText =
                    "البريد الإلكتروني غير صحيح";

                break;


            case "auth/user-not-found":

                errorText =
                    "الحساب غير موجود";

                break;


            case "auth/wrong-password":

                errorText =
                    "كلمة المرور غير صحيحة";

                break;


            case "auth/invalid-credential":

                errorText =
                    "البريد الإلكتروني أو كلمة المرور غير صحيحة";

                break;


            case "auth/too-many-requests":

                errorText =
                    "تمت محاولات كثيرة، حاول لاحقًا";

                break;


            case "auth/network-request-failed":

                errorText =
                    "تحقق من اتصال الإنترنت";

                break;


            case "auth/operation-not-allowed":

                errorText =
                    "تسجيل الدخول بالبريد وكلمة المرور غير مفعّل في Firebase";

                break;


            default:

                errorText =
                    error.message ||
                    "تعذر تسجيل الدخول";

                break;
        }


        showLoginMessage(
            errorText,
            "error"
        );


    } finally {

        loginButton.disabled = false;

        loginButton.textContent =
            "تسجيل الدخول";
    }
}


// ======================================================
// زر تسجيل الدخول
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
// Enter في كلمة المرور
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

            currentUid =
                user.uid;


            if (userEmail) {

                userEmail.textContent =
                    user.email || "-";
            }


            if (loginBox) {

                loginBox.classList.add(
                    "hidden"
                );
            }


            if (searchBox) {

                searchBox.classList.remove(
                    "hidden"
                );
            }


        } else {

            currentUid = null;

            currentAccountNumber = null;

            currentUserData = null;

            selectedRenewal = null;


            if (loginBox) {

                loginBox.classList.remove(
                    "hidden"
                );
            }


            if (searchBox) {

                searchBox.classList.add(
                    "hidden"
                );
            }


            if (result) {

                result.classList.add(
                    "hidden"
                );
            }
        }

    }
);


// ======================================================
// البحث عن الحساب
// ======================================================

async function searchAccount() {

    const accountNumber =
        accountInput.value.trim();


    if (searchMessage) {

        searchMessage.textContent =
            "";
    }


    if (!/^[0-9]{7}$/.test(accountNumber)) {

        if (searchMessage) {

            searchMessage.textContent =
                "أدخل رقم حساب مكون من 7 أرقام";
        }

        return;
    }


    searchButton.disabled = true;

    searchButton.textContent =
        "جاري البحث...";


    try {

        // ------------------------------------------------
        // البحث داخل accountNumbers
        // ------------------------------------------------

        const accountSnapshot =
            await db
                .ref(
                    "accountNumbers/" +
                    accountNumber
                )
                .once("value");


        if (!accountSnapshot.exists()) {

            searchMessage.textContent =
                "رقم الحساب غير موجود";

            return;
        }


        const accountData =
            accountSnapshot.val();


        const uid =
            accountData.uid;


        if (!uid) {

            searchMessage.textContent =
                "لا يوجد مستخدم مرتبط بهذا الحساب";

            return;
        }


        // ------------------------------------------------
        // جلب المستخدم من users
        // ------------------------------------------------

        const userSnapshot =
            await db
                .ref(
                    "users/" +
                    uid
                )
                .once("value");


        if (!userSnapshot.exists()) {

            searchMessage.textContent =
                "بيانات الحساب غير موجودة";

            return;
        }


        const userData =
            userSnapshot.val();


        // ------------------------------------------------
        // حفظ البيانات
        // ------------------------------------------------

        currentAccountNumber =
            accountNumber;

        currentUid =
            uid;

        currentUserData =
            userData;


        // ------------------------------------------------
        // عرض البيانات
        // ------------------------------------------------

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
            "resultSubscriptionStart",
            formatDate(
                userData.subscriptionStart
            )
        );


        setText(
            "resultSubscriptionEnd",
            formatDate(
                userData.subscriptionEnd
            )
        );


        if (result) {

            result.classList.remove(
                "hidden"
            );
        }


        searchMessage.textContent =
            "تم العثور على الحساب";


        // ------------------------------------------------
        // إعادة تحديد التجديد
        // ------------------------------------------------

        selectedRenewal = null;


        document
            .querySelectorAll(".renewOption")
            .forEach(
                function (button) {

                    button.classList.remove(
                        "selected"
                    );

                }
            );


        if (renewButton) {

            renewButton.disabled =
                true;
        }


    } catch (error) {

        console.error(
            "SEARCH ERROR:",
            error
        );


        searchMessage.textContent =
            "تعذر قراءة بيانات الحساب: " +
            (
                error.message ||
                "خطأ غير معروف"
            );


    } finally {

        searchButton.disabled =
            false;

        searchButton.textContent =
            "بحث";
    }
}


// ======================================================
// زر البحث
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
// خيارات التجديد
// ======================================================

document
    .querySelectorAll(".renewOption")
    .forEach(
        function (button) {

            button.addEventListener(
                "click",
                function () {

                    if (!currentUid) {
                        return;
                    }


                    // ------------------------------------
                    // إزالة الاختيار القديم
                    // ------------------------------------

                    document
                        .querySelectorAll(
                            ".renewOption"
                        )
                        .forEach(
                            function (item) {

                                item.classList.remove(
                                    "selected"
                                );

                            }
                        );


                    // ------------------------------------
                    // تحديد الخيار
                    // ------------------------------------

                    button.classList.add(
                        "selected"
                    );


                    // ------------------------------------
                    // حفظ مدة التجديد
                    // ------------------------------------

                    selectedRenewal = {

                        name:
                            button.dataset.name,

                        days:
                            button.dataset.days
                                ? Number(
                                    button.dataset.days
                                )
                                : null,

                        months:
                            button.dataset.months
                                ? Number(
                                    button.dataset.months
                                )
                                : null
                    };


                    if (renewButton) {

                        renewButton.disabled =
                            false;
                    }

                }
            );

        }
    );


// ======================================================
// تجديد الاشتراك
// ======================================================

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


            if (!currentUserData) {

                alert(
                    "بيانات الحساب غير متوفرة"
                );

                return;
            }


            if (!selectedRenewal) {

                alert(
                    "اختر مدة الاشتراك أولاً"
                );

                return;
            }


            renewButton.disabled =
                true;

            renewButton.textContent =
                "جاري التجديد...";


            try {

                // ------------------------------------------------
                // الوقت الحالي
                // ------------------------------------------------

                const now =
                    Date.now();


                // ------------------------------------------------
                // نهاية الاشتراك القديمة
                // ------------------------------------------------

                const oldEnd =
                    Number(
                        currentUserData.subscriptionEnd
                    ) || 0;


                // ------------------------------------------------
                // بداية الاشتراك الجديد
                // إذا كان الاشتراك ما زال فعالًا:
                // يبدأ بعد النهاية القديمة
                // وإذا انتهى:
                // يبدأ الآن
                // ------------------------------------------------

                const startTime =
                    oldEnd > now
                        ? oldEnd
                        : now;


                let endTime =
                    startTime;


                // ------------------------------------------------
                // التجديد بالأيام
                // ------------------------------------------------

                if (selectedRenewal.days) {

                    endTime +=
                        selectedRenewal.days *
                        24 *
                        60 *
                        60 *
                        1000;
                }


                // ------------------------------------------------
                // التجديد بالشهور
                // ------------------------------------------------

                if (selectedRenewal.months) {

                    const date =
                        new Date(
                            startTime
                        );


                    date.setMonth(
                        date.getMonth() +
                        selectedRenewal.months
                    );


                    endTime =
                        date.getTime();
                }


                // ------------------------------------------------
                // تحديث Firebase
                // ------------------------------------------------

                await db
                    .ref(
                        "users/" +
                        currentUid
                    )
                    .update({

                        active:
                            true,

                        subscriptionStart:
                            startTime,

                        subscriptionEnd:
                            endTime,

                        subscriptionName:
                            selectedRenewal.name

                    });


                // ------------------------------------------------
                // تحديث البيانات المحلية
                // ------------------------------------------------

                currentUserData.active =
                    true;


                currentUserData.subscriptionStart =
                    startTime;


                currentUserData.subscriptionEnd =
                    endTime;


                currentUserData.subscriptionName =
                    selectedRenewal.name;


                // ------------------------------------------------
                // تحديث الشاشة
                // ------------------------------------------------

                setText(
                    "resultStatus",
                    "مفعل"
                );


                setText(
                    "resultSubscription",
                    selectedRenewal.name
                );


                setText(
                    "resultSubscriptionStart",
                    formatDate(
                        startTime
                    )
                );


                setText(
                    "resultSubscriptionEnd",
                    formatDate(
                        endTime
                    )
                );


                // ------------------------------------------------
                // نافذة النجاح
                // ------------------------------------------------

                showSuccessModal(
                    currentAccountNumber
                );


            } catch (error) {

                console.error(
                    "RENEW ERROR:",
                    error
                );


                alert(
                    "تعذر تجديد الاشتراك:\n" +
                    (
                        error.message ||
                        "خطأ غير معروف"
                    )
                );


            } finally {

                renewButton.disabled =
                    false;

                renewButton.textContent =
                    "تجديد الاشتراك";
            }

        }
    );
}


// ======================================================
// نافذة النجاح
// ======================================================

function showSuccessModal(accountNumber) {

    const overlay =
        document.getElementById(
            "successOverlay"
        );


    if (!overlay) {

        alert(
            "تم تجديد الاشتراك بنجاح\n" +
            "حساب رقم: " +
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

if (closeSuccess) {

    closeSuccess.addEventListener(
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
// دالة تغيير النص
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
            }const userEmail =
    document.getElementById(
        "userEmail"
    );


const accountInput =
    document.getElementById(
        "accountNumber"
    );


const searchButton =
    document.getElementById(
        "searchButton"
    );


const searchMessage =
    document.getElementById(
        "searchMessage"
    );


const result =
    document.getElementById(
        "result"
    );


const renewButton =
    document.getElementById(
        "renewButton"
    );


const closeSuccess =
    document.getElementById(
        "closeSuccess"
    );


// ======================================================
// Variables
// ======================================================

let currentUid = null;

let currentAccountNumber = null;

let currentUserData = null;

let selectedRenewal = null;


// ======================================================
// Login Message
// ======================================================

function showLoginMessage(
    text,
    type
) {

    if (!message) {
        return;
    }


    message.textContent =
        text;


    message.className =
        "message";


    if (type) {

        message.classList.add(
            type
        );

    }

}


// ======================================================
// Login
// ======================================================

async function login() {

    const email =
        emailInput.value.trim();


    const password =
        passwordInput.value;


    if (!email) {

        showLoginMessage(
            "أدخل البريد الإلكتروني",
            "error"
        );

        emailInput.focus();

        return;

    }


    if (!password) {

        showLoginMessage(
            "أدخل كلمة المرور",
            "error"
        );

        passwordInput.focus();

        return;

    }


    loginButton.disabled =
        true;


    loginButton.textContent =
        "جاري تسجيل الدخول...";


    showLoginMessage(
        "جاري التحقق...",
        ""
    );


    try {

        const loginResult =
            await auth.signInWithEmailAndPassword(
                email,
                password
            );


        currentUid =
            loginResult.user.uid;


        showLoginMessage(
            "تم تسجيل الدخول بنجاح",
            "success"
        );


    } catch (error) {

        console.error(
            "LOGIN ERROR:",
            error
        );


        let errorText =
            "تعذر تسجيل الدخول";


        switch (error.code) {

            case "auth/invalid-email":

                errorText =
                    "البريد الإلكتروني غير صحيح";

                break;


            case "auth/user-not-found":

                errorText =
                    "الحساب غير موجود";

                break;


            case "auth/wrong-password":

                errorText =
                    "كلمة المرور غير صحيحة";

                break;


            case "auth/invalid-credential":

                errorText =
                    "البريد الإلكتروني أو كلمة المرور غير صحيحة";

                break;


            case "auth/too-many-requests":

                errorText =
                    "تمت محاولات كثيرة، حاول لاحقًا";

                break;


            case "auth/network-request-failed":

                errorText =
                    "تحقق من اتصال الإنترنت";

                break;


            case "auth/operation-not-allowed":

                errorText =
                    "تسجيل الدخول بالبريد وكلمة المرور غير مفعّل في Firebase";

                break;


            default:

                errorText =
                    error.message ||
                    "تعذر تسجيل الدخول";

                break;

        }


        showLoginMessage(
            errorText,
            "error"
        );


    } finally {

        loginButton.disabled =
            false;


        loginButton.textContent =
            "تسجيل الدخول";

    }

}


// ======================================================
// Login Button
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
// Enter Login
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
// Auth State
// ======================================================

auth.onAuthStateChanged(
    function (user) {

        if (user) {

            currentUid =
                user.uid;


            if (userEmail) {

                userEmail.textContent =
                    user.email || "-";

            }


            if (loginBox) {

                loginBox.classList.add(
                    "hidden"
                );

            }


            if (searchBox) {

                searchBox.classList.remove(
                    "hidden"
                );

            }

        } else {

            currentUid =
                null;


            currentAccountNumber =
                null;


            currentUserData =
                null;


            if (loginBox) {

                loginBox.classList.remove(
                    "hidden"
                );

            }


            if (searchBox) {

                searchBox.classList.add(
                    "hidden"
                );

            }

        }

    }
);


// ======================================================
// Search Account
// ======================================================

async function searchAccount() {

    const accountNumber =
        accountInput.value.trim();


    searchMessage.textContent =
        "";


    if (!/^[0-9]{7}$/.test(accountNumber)) {

        searchMessage.textContent =
            "أدخل رقم حساب مكون من 7 أرقام";

        return;

    }


    searchButton.disabled =
        true;


    searchButton.textContent =
        "جاري البحث...";


    try {

        const accountSnapshot =
            await db
                .ref(
                    "accountNumbers/" +
                    accountNumber
                )
                .once(
                    "value"
                );


        if (!accountSnapshot.exists()) {

            searchMessage.textContent =
                "رقم الحساب غير موجود";

            return;

        }


        const accountData =
            accountSnapshot.val();


        const uid =
            accountData.uid;


        if (!uid) {

            searchMessage.textContent =
                "لا يوجد مستخدم مرتبط بهذا الحساب";

            return;

        }


        const userSnapshot =
            await db
                .ref(
                    "users/" +
                    uid
                )
                .once(
                    "value"
                );


        if (!userSnapshot.exists()) {

            searchMessage.textContent =
                "بيانات الحساب غير موجودة";

            return;

        }


        const userData =
            userSnapshot.val();


        currentAccountNumber =
            accountNumber;


        currentUid =
            uid;


        currentUserData =
            userData;


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
            "resultSubscriptionStart",
            formatDate(
                userData.subscriptionStart
            )
        );


        setText(
            "resultSubscriptionEnd",
            formatDate(
                userData.subscriptionEnd
            )
        );


        result.classList.remove(
            "hidden"
        );


        searchMessage.textContent =
            "تم العثور على الحساب";


        selectedRenewal =
            null;


        document
            .querySelectorAll(
                ".renewOption"
            )
            .forEach(
                function (button) {

                    button.classList.remove(
                        "selected"
                    );

                }
            );


        renewButton.disabled =
            true;


    } catch (error) {

        console.error(
            "SEARCH ERROR:",
            error
        );


        searchMessage.textContent =
            "تعذر قراءة بيانات الحساب: " +
            (
                error.message ||
                "خطأ غير معروف"
            );


    } finally {

        searchButton.disabled =
            false;


        searchButton.textContent =
            "بحث";

    }

}


// ======================================================
// Search Button
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
// Enter Search
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
// Renewal Options
// ======================================================

document
    .querySelectorAll(
        ".renewOption"
    )
    .forEach(
        function (button) {

            button.addEventListener(
                "click",
                function () {

                    if (!currentUid) {

                        return;

                    }


                    document
                        .querySelectorAll(
                            ".renewOption"
                        )
                        .forEach(
                            function (item) {

                                item.classList.remove(
                                    "selected"
                                );

                            }
                        );


                    button.classList.add(
                        "selected"
                    );


                    selectedRenewal = {

                        name:
                            button.dataset.name,

                        days:
                            button.dataset.days
                                ? Number(
                                    button.dataset.days
                                )
                                : null,

                        months:
                            button.dataset.months
                                ? Number(
                                    button.dataset.months
                                )
                                : null

                    };


                    renewButton.disabled =
                        false;

                }
            );

        }
    );


// ======================================================
// Renew
// ======================================================

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


            renewButton.disabled =
                true;


            renewButton.textContent =
                "جاري التجديد...";


            try {

                const now =
                    Date.now();


                const oldEnd =
                    Number(
                        currentUserData.subscriptionEnd
                    ) || 0;


                const startTime =
                    oldEnd > now
                        ? oldEnd
                        : now;


                let endTime =
                    startTime;


                if (selectedRenewal.days) {

                    endTime +=
                        selectedRenewal.days *
                        24 *
                        60 *
                        60 *
                        1000;

                }


                if (selectedRenewal.months) {

                    const date =
                        new Date(
                            startTime
                        );


                    date.setMonth(
                        date.getMonth() +
                        selectedRenewal.months
                    );


                    endTime =
                        date.getTime();

                }


                await db
                    .ref(
                        "users/" +
                        currentUid
                    )
                    .update({

                        active:
                            true,

                        subscriptionStart:
                            startTime,

                        subscriptionEnd:
                            endTime,

                        subscriptionName:
                            selectedRenewal.name

                    });


                currentUserData.active =
                    true;


                currentUserData.subscriptionStart =
                    startTime;


                currentUserData.subscriptionEnd =
                    endTime;


                currentUserData.subscriptionName =
                    selectedRenewal.name;


                setText(
                    "resultStatus",
                    "مفعل"
                );


                setText(
                    "resultSubscription",
                    selectedRenewal.name
                );


                setText(
                    "resultSubscriptionStart",
                    formatDate(
                        startTime
                    )
                );


                setText(
                    "resultSubscriptionEnd",
                    formatDate(
                        endTime
                    )
                );


                showSuccessModal(
                    currentAccountNumber
                );


            } catch (error) {

                console.error(
                    "RENEW ERROR:",
                    error
                );


                alert(
                    "تعذر تجديد الاشتراك:\n" +
                    (
                        error.message ||
                        "خطأ غير معروف"
                    )
                );


            } finally {

                renewButton.disabled =
                    false;


                renewButton.textContent =
                    "تجديد الاشتراك";

            }

        }
    );

}


// ======================================================
// Success Modal
// ======================================================

function showSuccessModal(
    accountNumber
) {

    const overlay =
        document.getElementById(
            "successOverlay"
        );


    if (!overlay) {

        alert(
            "تم تجديد الاشتراك بنجاح\n" +
            "حساب رقم: " +
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
// Close Success
// ======================================================

if (closeSuccess) {

    closeSuccess.addEventListener(
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
// Set Text
// ======================================================

function setText(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (element) {

        element.textContent =
            value == null
                ? "—"
                : String(value);

    }

}


// ======================================================
// Format Date
// ======================================================

function formatDate(
    timestamp
) {

    if (!timestamp) {

        return "—";

    }


    const date =
        new Date(
            Number(timestamp)
        );


    if (
        isNaN(
            date.getTime()
        )
    ) {

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
