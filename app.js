import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
    getAuth,
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    getDatabase,
    ref,
    get
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";


/* =========================================
   Firebase
========================================= */

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


const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getDatabase(app);


/* =========================================
   عناصر الصفحة
========================================= */

const loginBox = document.getElementById("loginBox");
const searchBox = document.getElementById("searchBox");

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

const loginButton = document.getElementById("loginButton");
const searchButton = document.getElementById("searchButton");

const accountInput = document.getElementById("accountNumber");

const message = document.getElementById("message");
const searchMessage = document.getElementById("searchMessage");

const result = document.getElementById("result");

const userEmail = document.getElementById("userEmail");


/* =========================================
   تسجيل الدخول
========================================= */

loginButton.addEventListener("click", async function () {

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (email === "" || password === "") {

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

});


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
