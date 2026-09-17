import { initializeApp }
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";


import {
    getAuth,
    signInWithEmailAndPassword,
    onAuthStateChanged
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


import {
    getDatabase,
    ref,
    get,
    update
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";


/* =========================================
   FIREBASE CONFIG
========================================= */

const firebaseConfig = {

    apiKey:
        "AIzaSyDnvmRTgZl1p325V3TmCjIH-PnPfjJPPpk",

    authDomain:
        "bok-ped.firebaseapp.com",

    databaseURL:
        "https://bok-ped-default-rtdb.firebaseio.com",

    projectId:
        "bok-ped",

    storageBucket:
        "bok-ped.firebasestorage.app",

    messagingSenderId:
        "812838230843",

    appId:
        "1:812838230843:web:f3bd5f59343db42b52b51e",

    measurementId:
        "G-26SMZR0QCC"
};


/* =========================================
   INITIALIZE
========================================= */

const app =
    initializeApp(firebaseConfig);

const auth =
    getAuth(app);

const db =
    getDatabase(app);


/* =========================================
   ELEMENTS
========================================= */

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

const searchButton =
    document.getElementById("searchButton");

const accountInput =
    document.getElementById("accountNumber");

const message =
    document.getElementById("message");

const searchMessage =
    document.getElementById("searchMessage");

const result =
    document.getElementById("result");

const userEmail =
    document.getElementById("userEmail");

const renewButton =
    document.getElementById("renewButton");

const renewMessage =
    document.getElementById("renewMessage");

const successOverlay =
    document.getElementById("successOverlay");

const successAccount =
    document.getElementById("successAccount");

const closeSuccess =
    document.getElementById("closeSuccess");


/* =========================================
   VARIABLES
========================================= */

let selectedRenewal = null;

let currentAccountNumber = null;

let currentUid = null;

let currentUserData = null;


/* =========================================
   LOGIN
========================================= */

loginButton.addEventListener(
    "click",
    async function () {

        const email =
            emailInput.value.trim();

        const password =
            passwordInput.value;


        if (
            email === "" ||
            password === ""
        ) {

            message.textContent =
                "أدخل البريد الإلكتروني وكلمة المرور";

            return;
        }


        message.textContent =
            "جاري تسجيل الدخول...";


        try {

            const loginResult =
                await signInWithEmailAndPassword(
                    auth,
                    email,
                    password
                );


            if (loginResult.user) {

                userEmail.textContent =
                    loginResult.user.email || "-";

                message.textContent = "";
            }


        } catch (error) {

            console.log(error);

            message.textContent =
                "البريد الإلكتروني أو كلمة المرور غير صحيحة";
        }

    }
);


/* =========================================
   AUTH STATE
========================================= */

onAuthStateChanged(
    auth,
    function (user) {

        if (user) {

            loginBox.classList.add("hidden");

            searchBox.classList.remove("hidden");

            userEmail.textContent =
                user.email || "-";

        } else {

            loginBox.classList.remove("hidden");

            searchBox.classList.add("hidden");

            result.classList.add("hidden");
        }

    }
);


/* =========================================
   SEARCH
========================================= */

searchButton.addEventListener(
    "click",
    async function () {

        const loggedUser =
            auth.currentUser;


        if (!loggedUser) {

            searchMessage.textContent =
                "يجب تسجيل الدخول أولاً";

            return;
        }


        const accountNumber =
            accountInput.value.trim();


        if (
            !/^\d{7}$/.test(accountNumber)
        ) {

            searchMessage.textContent =
                "أدخل رقم حساب صحيح مكوّن من 7 أرقام";

            result.classList.add("hidden");

            return;
        }


        searchMessage.textContent =
            "جاري البحث...";


        result.classList.add("hidden");

        renewButton.disabled = true;

        selectedRenewal = null;

        currentAccountNumber = null;

        currentUid = null;

        currentUserData = null;


        try {

            /* ==============================
               accountNumbers
            ============================== */

            const accountRef =
                ref(
                    db,
                    "accountNumbers/" + accountNumber
                );


            const accountSnapshot =
                await get(accountRef);


            if (!accountSnapshot.exists()) {

                searchMessage.textContent =
                    "رقم الحساب غير موجود في Firebase";

                return;
            }


            const accountData =
                accountSnapshot.val();


            const uid =
                accountData.uid;


            if (!uid) {

                searchMessage.textContent =
                    "هذا الحساب لا يحتوي على UID";

                return;
            }


            /* ==============================
               users
            ============================== */

            const userRef =
                ref(
                    db,
                    "users/" + uid
                );


            const userSnapshot =
                await get(userRef);


            if (!userSnapshot.exists()) {

                searchMessage.textContent =
                    "بيانات هذا الحساب غير موجودة";

                return;
            }


            const data =
                userSnapshot.val();


            /* ==============================
               SAVE CURRENT ACCOUNT
            ============================== */

            currentAccountNumber =
                accountNumber;

            currentUid =
                uid;

            currentUserData =
                data;


            /* ==============================
               DISPLAY
            ============================== */

            document.getElementById(
                "resultAccount"
            ).textContent =
                accountNumber;


            document.getElementById(
                "resultName"
            ).textContent =
                data.username || "-";


            document.getElementById(
                "resultStatus"
            ).textContent =
                data.active === true
                    ? "نشط"
                    : "غير نشط";


            document.getElementById(
                "resultSubscription"
            ).textContent =
                data.subscriptionName || "-";


            document.getElementById(
                "resultSubscriptionStart"
            ).textContent =
                formatDate(
                    data.subscriptionStart
                );


            document.getElementById(
                "resultSubscriptionEnd"
            ).textContent =
                formatDate(
                    data.subscriptionEnd
                );


            result.classList.remove(
                "hidden"
            );


            searchMessage.textContent = "";


        } catch (error) {

            console.log(error);

            searchMessage.textContent =
                "حدث خطأ أثناء قراءة بيانات الحساب";
        }

    }
);


/* =========================================
   RENEWAL OPTION
========================================= */

const renewOptions =
    document.querySelectorAll(
        ".renewOption"
    );


renewOptions.forEach(
    function (button) {

        button.addEventListener(
            "click",
            function () {

                renewOptions.forEach(
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

                    days:
                        button.dataset.days
                            ? Number(button.dataset.days)
                            : 0,

                    months:
                        button.dataset.months
                            ? Number(button.dataset.months)
                            : 0,

                    name:
                        button.dataset.name

                };


                renewButton.disabled = false;

                renewMessage.textContent =
                    "";

            }
        );

    }
);


/* =========================================
   RENEW
========================================= */

renewButton.addEventListener(
    "click",
    async function () {

        if (
            !currentUid ||
            !currentAccountNumber ||
            !currentUserData
        ) {

            renewMessage.textContent =
                "ابحث عن حساب أولاً";

            return;
        }


        if (!selectedRenewal) {

            renewMessage.textContent =
                "اختر مدة التجديد أولاً";

            return;
        }


        const loggedUser =
            auth.currentUser;


        if (!loggedUser) {

            renewMessage.textContent =
                "يجب تسجيل الدخول أولاً";

            return;
        }


        renewButton.disabled = true;

        renewMessage.textContent =
            "جاري تجديد الاشتراك...";


        try {

            const now =
                Date.now();


            const oldEnd =
                Number(
                    currentUserData.subscriptionEnd
                ) || 0;


            /*
             إذا الاشتراك ما زال ساريًا:
             نبدأ من subscriptionEnd

             إذا انتهى:
             نبدأ من الآن
            */

            let startTime;


            if (oldEnd > now) {

                startTime =
                    oldEnd;

            } else {

                startTime =
                    now;
            }


            /* ==============================
               CALCULATE END
            ============================== */

            let endTime =
                startTime;


            /* يوم */

            if (
                selectedRenewal.days > 0
            ) {

                endTime +=
                    selectedRenewal.days *
                    24 *
                    60 *
                    60 *
                    1000;
            }


            /* شهر / 3 شهور / 12 شهر */

            if (
                selectedRenewal.months > 0
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


            /* ==============================
               UPDATE FIREBASE
            ============================== */

            const updateData = {

                active:
                    true,

                subscriptionName:
                    selectedRenewal.name,

                subscriptionStart:
                    startTime,

                subscriptionEnd:
                    endTime

            };


            await update(
                ref(
                    db,
                    "users/" + currentUid
                ),
                updateData
            );


            /* ==============================
               UPDATE LOCAL DATA
            ============================== */

            currentUserData.active =
                true;

            currentUserData.subscriptionName =
                selectedRenewal.name;

            currentUserData.subscriptionStart =
                startTime;

            currentUserData.subscriptionEnd =
                endTime;


            /* ==============================
               UPDATE SCREEN
            ============================== */

            document.getElementById(
                "resultStatus"
            ).textContent =
                "نشط";


            document.getElementById(
                "resultSubscription"
            ).textContent =
                selectedRenewal.name;


            document.getElementById(
                "resultSubscriptionStart"
            ).textContent =
                formatDate(startTime);


            document.getElementById(
                "resultSubscriptionEnd"
            ).textContent =
                formatDate(endTime);


            renewMessage.textContent =
                "";


            /* ==============================
               SUCCESS
            ============================== */

            successAccount.textContent =
                currentAccountNumber;


            successOverlay.classList.remove(
                "hidden"
            );


            renewOptions.forEach(
                function (item) {

                    item.classList.remove(
                        "selected"
                    );

                }
            );


            selectedRenewal = null;

            renewButton.disabled = true;


        } catch (error) {

            console.log(
                "RENEW ERROR:",
                error
            );


            renewButton.disabled = false;


            if (
                error &&
                (
                    error.code ===
                    "PERMISSION_DENIED" ||

                    (
                        error.message &&
                        error.message.includes(
                            "Permission denied"
                        )
                    )
                )
            ) {

                renewMessage.textContent =
                    "لا تملك صلاحية تجديد الاشتراك بهذا الحساب";

            } else {

                renewMessage.textContent =
                    "حدث خطأ أثناء تجديد الاشتراك";
            }

        }

    }
);


/* =========================================
   CLOSE SUCCESS
========================================= */

closeSuccess.addEventListener(
    "click",
    function () {

        successOverlay.classList.add(
            "hidden"
        );

    }
);


/* =========================================
   ENTER
========================================= */

accountInput.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key === "Enter"
        ) {

            searchButton.click();

        }

    }
);


/* =========================================
   FORMAT DATE
========================================= */

function formatDate(timestamp) {

    if (
        timestamp === undefined ||
        timestamp === null ||
        timestamp === ""
    ) {

        return "-";
    }


    const number =
        Number(timestamp);


    if (
        isNaN(number)
    ) {

        return String(timestamp);
    }


    const date =
        new Date(number);


    if (
        isNaN(date.getTime())
    ) {

        return String(timestamp);
    }


    return date.toLocaleString(
        "ar",
        {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        }
    );
                }const result =
    document.getElementById("result");


const userEmail =
    document.getElementById("userEmail");


/* =========================================
   LOGIN
========================================= */

loginButton.addEventListener(
    "click",
    async function () {

        const email =
            emailInput.value.trim();


        const password =
            passwordInput.value;


        if (
            email === "" ||
            password === ""
        ) {

            message.textContent =
                "أدخل البريد الإلكتروني وكلمة المرور";

            return;
        }


        message.textContent =
            "جاري تسجيل الدخول...";


        try {

            const loginResult =
                await signInWithEmailAndPassword(
                    auth,
                    email,
                    password
                );


            if (loginResult.user) {

                userEmail.textContent =
                    loginResult.user.email || "-";

                message.textContent = "";

            }


        } catch (error) {

            console.log(error);

            message.textContent =
                "البريد الإلكتروني أو كلمة المرور غير صحيحة";

        }

    }
);


/* =========================================
   AUTH STATE
========================================= */

onAuthStateChanged(
    auth,
    function (user) {

        if (user) {

            loginBox.classList.add("hidden");

            searchBox.classList.remove("hidden");

            userEmail.textContent =
                user.email || "-";

        } else {

            loginBox.classList.remove("hidden");

            searchBox.classList.add("hidden");

            result.classList.add("hidden");

        }

    }
);


/* =========================================
   SEARCH
========================================= */

searchButton.addEventListener(
    "click",
    async function () {


        /* -------------------------------
           تأكد من تسجيل الدخول
        -------------------------------- */

        const loggedUser =
            auth.currentUser;


        if (!loggedUser) {

            searchMessage.textContent =
                "يجب تسجيل الدخول أولاً";

            return;
        }


        /* -------------------------------
           رقم الحساب
        -------------------------------- */

        const accountNumber =
            accountInput.value.trim();


        /* -------------------------------
           التحقق من 7 أرقام
        -------------------------------- */

        if (
            !/^\d{7}$/.test(accountNumber)
        ) {

            searchMessage.textContent =
                "أدخل رقم حساب صحيح مكوّن من 7 أرقام";

            result.classList.add("hidden");

            return;
        }


        searchMessage.textContent =
            "جاري البحث...";


        result.classList.add("hidden");


        try {


            /* =================================
               STEP 1
               accountNumbers
            ================================= */

            const accountRef =
                ref(
                    db,
                    "accountNumbers/" +
                    accountNumber
                );


            const accountSnapshot =
                await get(accountRef);


            /* -------------------------------
               الرقم غير موجود
            -------------------------------- */

            if (
                !accountSnapshot.exists()
            ) {

                searchMessage.textContent =
                    "رقم الحساب غير موجود في Firebase";

                return;
            }


            /* -------------------------------
               بيانات accountNumbers
            -------------------------------- */

            const accountData =
                accountSnapshot.val();


            console.log(
                "ACCOUNT DATA:",
                accountData
            );


            /* =================================
               STEP 2
               UID
            ================================= */

            const uid =
                accountData.uid;


            if (
                !uid ||
                String(uid).trim() === ""
            ) {

                searchMessage.textContent =
                    "هذا الحساب لا يحتوي على UID";

                return;
            }


            console.log(
                "UID:",
                uid
            );


            /* =================================
               عرض رقم الحساب
            ================================= */

            document.getElementById(
                "resultAccount"
            ).textContent =
                accountNumber;


            /* =================================
               عرض UID
            ================================= */

            document.getElementById(
                "resultUid"
            ).textContent =
                uid;


            /* =================================
               STEP 3
               users / UID
            ================================= */

            const userRef =
                ref(
                    db,
                    "users/" + uid
                );


            const userSnapshot =
                await get(userRef);


            console.log(
                "USER SNAPSHOT:",
                userSnapshot.exists()
            );


            /* -------------------------------
               users غير موجود
            -------------------------------- */

            if (
                !userSnapshot.exists()
            ) {

                result.classList.remove(
                    "hidden"
                );

                searchMessage.textContent =
                    "تم العثور على UID ولكن لا توجد بيانات في users لهذا UID";

                return;
            }


            /* =================================
               بيانات users
            ================================= */

            const data =
                userSnapshot.val();


            console.log(
                "USER DATA:",
                data
            );


            /* =================================
               NAME
            ================================= */

            document.getElementById(
                "resultName"
            ).textContent =
                data.username || "-";


            /* =================================
               ACTIVE
            ================================= */

            document.getElementById(
                "resultStatus"
            ).textContent =
                data.active === true
                    ? "نشط"
                    : "غير نشط";


            /* =================================
               SUBSCRIPTION NAME
            ================================= */

            document.getElementById(
                "resultSubscription"
            ).textContent =
                data.subscriptionName || "-";


            /* =================================
               SUBSCRIPTION TYPE
            ================================= */

            document.getElementById(
                "resultSubscriptionType"
            ).textContent =
                data.subscriptionType || "-";


            /* =================================
               START
            ================================= */

            document.getElementById(
                "resultSubscriptionStart"
            ).textContent =
                formatDate(
                    data.subscriptionStart
                );


            /* =================================
               END
            ================================= */

            document.getElementById(
                "resultSubscriptionEnd"
            ).textContent =
                formatDate(
                    data.subscriptionEnd
                );


            /* =================================
               DEVICE ID
            ================================= */

            document.getElementById(
                "resultDeviceId"
            ).textContent =
                data.deviceId || "-";


            /* =================================
               CREATED AT
            ================================= */

            document.getElementById(
                "resultCreatedAt"
            ).textContent =
                formatDate(
                    data.createdAt
                );


            /* =================================
               SHOW RESULT
            ================================= */

            result.classList.remove(
                "hidden"
            );


            searchMessage.textContent = "";


        } catch (error) {


            console.log(
                "SEARCH ERROR:",
                error
            );


            /* =================================
               Permission denied
            ================================= */

            if (
                error &&
                (
                    error.code ===
                    "PERMISSION_DENIED" ||

                    error.message.includes(
                        "Permission denied"
                    )
                )
            ) {

                searchMessage.textContent =
                    "Firebase رفض قراءة بيانات users. تأكد من حفظ Rules الجديدة.";

                return;
            }


            searchMessage.textContent =
                "حدث خطأ أثناء قراءة بيانات الحساب";

        }

    }
);


/* =========================================
   ENTER KEY
========================================= */

accountInput.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key === "Enter"
        ) {

            searchButton.click();

        }

    }
);


/* =========================================
   FORMAT DATE
========================================= */

function formatDate(timestamp) {


    if (
        timestamp === undefined ||
        timestamp === null ||
        timestamp === ""
    ) {

        return "-";

    }


    const number =
        Number(timestamp);


    if (
        isNaN(number)
    ) {

        return String(timestamp);

    }


    const date =
        new Date(number);


    if (
        isNaN(date.getTime())
    ) {

        return String(timestamp);

    }


    return date.toLocaleString(
        "ar",
        {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        }
    );

        }

/* =========================================
   حالة تسجيل الدخول
========================================= */

onAuthStateChanged(auth, function (user) {

    if (user) {

        loginBox.classList.add("hidden");

        searchBox.classList.remove("hidden");

        userEmail.textContent =
            user.email || "-";

    } else {

        loginBox.classList.remove("hidden");

        searchBox.classList.add("hidden");

        result.classList.add("hidden");

    }

});


/* =========================================
   البحث
========================================= */

searchButton.addEventListener("click", async function () {

    const user = auth.currentUser;

    if (!user) {

        searchMessage.textContent =
            "يجب تسجيل الدخول أولاً";

        return;
    }


    const accountNumber =
        accountInput.value.trim();


    /* التحقق من الرقم */

    if (!/^\d{7}$/.test(accountNumber)) {

        searchMessage.textContent =
            "أدخل رقم حساب صحيح مكوّن من 7 أرقام";

        result.classList.add("hidden");

        return;
    }


    searchMessage.textContent =
        "جاري البحث...";

    result.classList.add("hidden");


    try {

        /* =====================================
           أولاً:
           accountNumbers / رقم الحساب
        ===================================== */

        const accountRef =
            ref(
                db,
                "accountNumbers/" + accountNumber
            );


        const accountSnapshot =
            await get(accountRef);


        if (!accountSnapshot.exists()) {

            searchMessage.textContent =
                "رقم الحساب غير موجود في Firebase";

            return;
        }


        const accountData =
            accountSnapshot.val();


        /* =====================================
           الحصول على UID
        ===================================== */

        const uid =
            accountData.uid || "";


        if (uid === "") {

            searchMessage.textContent =
                "رقم الحساب موجود ولكن لا يوجد UID مرتبط به";

            return;
        }


        /* عرض رقم الحساب */

        document.getElementById(
            "resultAccount"
        ).textContent = accountNumber;


        /* عرض UID */

        document.getElementById(
            "resultUid"
        ).textContent = uid;


        /* =====================================
           ثانياً:
           users / UID
        ===================================== */

        const userRef =
            ref(
                db,
                "users/" + uid
            );


        const userSnapshot =
            await get(userRef);


        if (!userSnapshot.exists()) {

            searchMessage.textContent =
                "تم العثور على UID ولكن بيانات users غير موجودة";

            result.classList.remove("hidden");

            return;
        }


        const data =
            userSnapshot.val();


        /* =====================================
           بيانات المستخدم
        ===================================== */

        document.getElementById(
            "resultName"
        ).textContent =
            data.username || "-";


        document.getElementById(
            "resultStatus"
        ).textContent =
            data.active === true
                ? "نشط"
                : "غير نشط";


        document.getElementById(
            "resultSubscription"
        ).textContent =
            data.subscriptionName || "-";


        document.getElementById(
            "resultSubscriptionType"
        ).textContent =
            data.subscriptionType || "-";


        document.getElementById(
            "resultSubscriptionStart"
        ).textContent =
            formatDate(data.subscriptionStart);


        document.getElementById(
            "resultSubscriptionEnd"
        ).textContent =
            formatDate(data.subscriptionEnd);


        document.getElementById(
            "resultDeviceId"
        ).textContent =
            data.deviceId || "-";


        document.getElementById(
            "resultCreatedAt"
        ).textContent =
            formatDate(data.createdAt);


        /* إظهار النتيجة */

        result.classList.remove("hidden");

        searchMessage.textContent = "";


    } catch (error) {

        console.log(error);

        searchMessage.textContent =
            "حدث خطأ أثناء الاتصال بقاعدة البيانات";
    }

});


/* =========================================
   تحويل التاريخ
========================================= */

function formatDate(timestamp) {

    if (
        timestamp === undefined ||
        timestamp === null ||
        timestamp === ""
    ) {
        return "-";
    }


    const number =
        Number(timestamp);


    if (isNaN(number)) {

        return String(timestamp);
    }


    const date =
        new Date(number);


    if (isNaN(date.getTime())) {

        return String(timestamp);
    }


    return date.toLocaleString(
        "ar",
        {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        }
    );

}


/* =========================================
   زر Enter
========================================= */

accountInput.addEventListener(
    "keydown",
    function (event) {

        if (event.key === "Enter") {

            searchButton.click();
        }

    }
);// ========================================

onAuthStateChanged(auth, function (user) {

    if (user) {

        loginBox.classList.add("hidden");

        searchBox.classList.remove("hidden");

        userEmail.textContent =
            user.email || "-";

    } else {

        loginBox.classList.remove("hidden");

        searchBox.classList.add("hidden");

        result.classList.add("hidden");

    }

});


// ========================================
// Search Account
// ========================================

searchButton.addEventListener("click", async function () {

    const user = auth.currentUser;

    if (!user) {

        searchMessage.textContent =
            "يجب تسجيل الدخول أولاً";

        return;
    }


    const accountNumber =
        accountInput.value.trim();


    // ========================================
    // Validate Account
    // ========================================

    if (!/^\d{7}$/.test(accountNumber)) {

        searchMessage.textContent =
            "أدخل رقم حساب صحيح مكوّن من 7 أرقام";

        result.classList.add("hidden");

        return;
    }


    searchMessage.textContent =
        "جاري البحث...";

    result.classList.add("hidden");


    try {

        // ========================================
        // Read Current User
        // ========================================

        const userRef =
            ref(db, "users/" + user.uid);

        const snapshot =
            await get(userRef);


        if (!snapshot.exists()) {

            searchMessage.textContent =
                "لا توجد بيانات لهذا المستخدم";

            return;
        }


        const data =
            snapshot.val();


        // ========================================
        // Compare Account Number
        // ========================================

        if (
            String(data.accountNumber) !==
            accountNumber
        ) {

            searchMessage.textContent =
                "رقم الحساب غير مطابق للحساب المسجل";

            return;
        }


        // ========================================
        // Show Account Data
        // ========================================

        document.getElementById("resultAccount").textContent =
            data.accountNumber || "-";

        document.getElementById("resultName").textContent =
            data.username || "-";

        document.getElementById("resultStatus").textContent =
            data.active ? "نشط" : "غير نشط";

        document.getElementById("resultSubscription").textContent =
            data.subscriptionName || "-";


        result.classList.remove("hidden");

        searchMessage.textContent = "";


    } catch (error) {

        console.log(error);

        searchMessage.textContent =
            "حدث خطأ أثناء الاتصال بقاعدة البيانات";

    }

});


// ========================================
// Enter Key Search
// ========================================

accountInput.addEventListener("keydown", function (event) {

    if (event.key === "Enter") {

        searchButton.click();

    }

});// ========================================
// Authentication State
// ========================================

onAuthStateChanged(auth, function (user) {

    if (user) {

        // المستخدم مسجل الدخول

        if (loginBox) {
            loginBox.classList.add("hidden");
        }

        if (searchBox) {
            searchBox.classList.remove("hidden");
        }

    } else {

        // المستخدم غير مسجل الدخول

        if (loginBox) {
            loginBox.classList.remove("hidden");
        }

        if (searchBox) {
            searchBox.classList.add("hidden");
        }

        if (result) {
            result.classList.add("hidden");
        }

    }

});


// ========================================
// Search Account
// ========================================

if (searchButton) {

    searchButton.addEventListener("click", async function () {

        const user = auth.currentUser;

        if (!user) {

            message.textContent =
                "يجب تسجيل الدخول أولاً";

            return;
        }


        // ========================================
        // Get Account Number
        // ========================================

        const accountNumber =
            accountInput.value.trim();


        // ========================================
        // Check 7 Digits
        // ========================================

        if (!/^\d{7}$/.test(accountNumber)) {

            message.textContent =
                "رقم الحساب يجب أن يكون 7 أرقام";

            return;
        }


        message.textContent =
            "جاري البحث...";


        if (result) {
            result.classList.add("hidden");
        }


        try {

            // ========================================
            // Read Current User
            // ========================================

            const userRef = ref(
                db,
                "users/" + user.uid
            );

            const snapshot =
                await get(userRef);


            // ========================================
            // Check Data
            // ========================================

            if (!snapshot.exists()) {

                message.textContent =
                    "لم يتم العثور على بيانات الحساب";

                return;
            }


            const data =
                snapshot.val();


            // ========================================
            // Compare Account Number
            // ========================================

            if (
                String(data.accountNumber) !==
                accountNumber
            ) {

                message.textContent =
                    "رقم الحساب غير مطابق للحساب المسجل";

                return;
            }


            // ========================================
            // Account Number
            // ========================================

            const resultAccount =
                document.getElementById("resultAccount");

            if (resultAccount) {

                resultAccount.textContent =
                    data.accountNumber || "-";
            }


            // ========================================
            // Name
            // ========================================

            const resultName =
                document.getElementById("resultName");

            if (resultName) {

                resultName.textContent =
                    data.username || "-";
            }


            // ========================================
            // Status
            // ========================================

            const resultStatus =
                document.getElementById("resultStatus");

            if (resultStatus) {

                resultStatus.textContent =
                    data.active ? "نشط" : "غير نشط";
            }


            // ========================================
            // Subscription
            // ========================================

            const resultSubscription =
                document.getElementById(
                    "resultSubscription"
                );

            if (resultSubscription) {

                resultSubscription.textContent =
                    data.subscriptionName || "-";
            }


            // ========================================
            // Show Result
            // ========================================

            if (result) {
                result.classList.remove("hidden");
            }

            message.textContent = "";


        } catch (error) {

            console.log(error);

            message.textContent =
                "حدث خطأ أثناء البحث";

        }

    });

              }
