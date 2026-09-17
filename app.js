import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
    getAuth,
    signInWithEmailAndPassword,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    getDatabase,
    ref,
    get
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";


// ========================================
// Firebase Configuration
// ========================================

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


// ========================================
// Initialize Firebase
// ========================================

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getDatabase(app);


// ========================================
// Get HTML Elements
// ========================================

const loginBox = document.getElementById("loginBox");
const searchBox = document.getElementById("searchBox");

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

const accountInput = document.getElementById("accountNumber");

const loginButton = document.getElementById("loginButton");
const searchButton = document.getElementById("searchButton");

const message = document.getElementById("message");

const result = document.getElementById("result");


// ========================================
// Login
// ========================================

if (loginButton) {

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

            await signInWithEmailAndPassword(
                auth,
                email,
                password
            );

            message.textContent = "";

        } catch (error) {

            console.log(error);

            message.textContent =
                "البريد الإلكتروني أو كلمة المرور غير صحيحة";

        }

    });

}


// ========================================
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
