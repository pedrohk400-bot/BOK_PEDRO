const firebaseConfig = {
    apiKey: "AIzaSyDnvmRTgZl1p325V3TmCjIH-PnPfjJPPpk",
    authDomain: "bok-ped.firebaseapp.com",
    databaseURL: "https://bok-ped-default-rtdb.firebaseio.com",
    projectId: "bok-ped",
    storageBucket: "bok-ped.firebasestorage.app",
    messagingSenderId: "812838230843",
    appId: "1:812838230843:web:f3bd5f59343db42b52b51e"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.database();

const loginBox = document.getElementById("login");
const appBox = document.getElementById("app");
const loginBtn = document.getElementById("loginBtn");
const searchBtn = document.getElementById("searchBtn");
const renewBtn = document.getElementById("renewBtn");

let currentUid = null;
let currentAccount = null;
let currentData = null;


// ======================================================
// تسجيل الدخول
// ======================================================

loginBtn.onclick = function () {

    const e = document.getElementById("email").value.trim();
    const p = document.getElementById("password").value;
    const m = document.getElementById("loginMsg");

    if (!e || !p) {
        m.textContent = "أدخل البريد وكلمة المرور";
        return;
    }

    loginBtn.disabled = true;
    loginBtn.textContent = "جاري الدخول...";
    m.textContent = "";

    auth.signInWithEmailAndPassword(e, p)

        .then(function () {
            m.textContent = "";
        })

        .catch(function (error) {

            m.textContent = "بيانات الدخول غير صحيحة";

            console.log(error);
        })

        .finally(function () {

            loginBtn.disabled = false;
            loginBtn.textContent = "دخول";

        });
};


// ======================================================
// حالة تسجيل الدخول
// ======================================================

auth.onAuthStateChanged(function (user) {

    if (user) {

        loginBox.classList.add("hidden");
        appBox.classList.remove("hidden");

    } else {

        loginBox.classList.remove("hidden");
        appBox.classList.add("hidden");

    }

});


// ======================================================
// البحث عن الحساب
// ======================================================

searchBtn.onclick = function () {

    const number =
        document.getElementById("account").value.trim();

    const message =
        document.getElementById("msg");

    if (!/^[0-9]{7}$/.test(number)) {

        message.textContent =
            "أدخل رقم حساب مكون من 7 أرقام";

        return;
    }

    searchBtn.disabled = true;
    searchBtn.textContent = "جاري البحث...";
    message.textContent = "";

    db.ref("accountNumbers/" + number)
        .once("value")

        .then(function (a) {

            if (!a.exists()) {
                throw new Error("رقم الحساب غير موجود");
            }

            const uid = a.val().uid;

            if (!uid) {
                throw new Error("الحساب غير مرتبط بمستخدم");
            }

            currentUid = uid;
            currentAccount = number;

            return db.ref("users/" + uid)
                .once("value");

        })

        .then(function (u) {

            if (!u.exists()) {
                throw new Error("بيانات الحساب غير موجودة");
            }

            currentData = u.val();

            document.getElementById("rAccount").textContent =
                currentAccount;

            document.getElementById("rName").textContent =
                currentData.username || "-";

            document.getElementById("rActive").textContent =
                currentData.active ? "مفعل" : "غير مفعل";

            document.getElementById("rSub").textContent =
                currentData.subscriptionName || "-";

            document.getElementById("rStart").textContent =
                formatDate(currentData.subscriptionStart);

            document.getElementById("rEnd").textContent =
                formatDate(currentData.subscriptionEnd);

            document.getElementById("result")
                .classList.remove("hidden");

            message.textContent =
                "تم العثور على الحساب";

        })

        .catch(function (error) {

            message.textContent =
                error.message;

        })

        .finally(function () {

            searchBtn.disabled = false;
            searchBtn.textContent = "بحث";

        });

};


// ======================================================
// تجديد الاشتراك
// ======================================================

renewBtn.onclick = function () {

    if (!currentUid || !currentData) {

        showErrorDialog(
            "ابحث عن الحساب أولاً"
        );

        return;
    }

    const periodSelect =
        document.getElementById("period");

    const days =
        Number(periodSelect.value);

    const periodText =
        periodSelect.selectedOptions[0].text;

    const now =
        Date.now();

    const oldEnd =
        Number(currentData.subscriptionEnd) || 0;

    const start =
        oldEnd > now ? oldEnd : now;

    const end =
        start + (days * 86400000);

    renewBtn.disabled = true;
    renewBtn.textContent = "جاري التجديد...";


    db.ref("users/" + currentUid)
        .update({

            active: true,

            subscriptionStart: start,

            subscriptionEnd: end,

            subscriptionName: periodText

        })

        .then(function () {

            currentData.active = true;

            currentData.subscriptionStart = start;

            currentData.subscriptionEnd = end;

            currentData.subscriptionName = periodText;


            document.getElementById("rActive").textContent =
                "مفعل";

            document.getElementById("rSub").textContent =
                periodText;

            document.getElementById("rStart").textContent =
                formatDate(start);

            document.getElementById("rEnd").textContent =
                formatDate(end);


            // ==================================================
            // Dialog نجاح iOS
            // ==================================================

            showSuccessDialog(
                currentAccount,
                periodText,
                formatDate(end)
            );

        })

        .catch(function (error) {

            showErrorDialog(
                "تعذر التجديد",
                error.message
            );

        })

        .finally(function () {

            renewBtn.disabled = false;

            renewBtn.textContent =
                "تجديد الاشتراك";

        });

};


// ======================================================
// تنسيق التاريخ
// ======================================================

function formatDate(timestamp) {

    if (!timestamp) {
        return "-";
    }

    return new Date(
        Number(timestamp)
    ).toLocaleString("ar");

}


// ======================================================
// Dialog نجاح iOS
// ======================================================

function showSuccessDialog(
    account,
    period,
    endDate
) {

    const old =
        document.getElementById(
            "iosSuccessDialog"
        );

    if (old) {
        old.remove();
    }


    const overlay =
        document.createElement("div");

    overlay.id =
        "iosSuccessDialog";


    overlay.innerHTML =

        '<div class="ios-dialog">' +

            '<div class="ios-success-icon">' +

                '<span>✓</span>' +

            '</div>' +


            '<div class="ios-dialog-title">' +

                'تم التجديد بنجاح' +

            '</div>' +


            '<div class="ios-dialog-message">' +

                'تم تمديد اشتراك الحساب بنجاح' +

            '</div>' +


            '<div class="ios-info">' +


                '<div class="ios-row">' +

                    '<span>رقم الحساب</span>' +

                    '<strong>' +
                        escapeHtml(account) +
                    '</strong>' +

                '</div>' +


                '<div class="ios-row">' +

                    '<span>مدة الاشتراك</span>' +

                    '<strong>' +
                        escapeHtml(period) +
                    '</strong>' +

                '</div>' +


                '<div class="ios-row">' +

                    '<span>ينتهي في</span>' +

                    '<strong>' +
                        escapeHtml(endDate) +
                    '</strong>' +

                '</div>' +


            '</div>' +


            '<button class="ios-ok" id="iosSuccessOk">' +

                'تم' +

            '</button>' +


        '</div>';


    document.body.appendChild(overlay);


    setTimeout(function () {

        overlay.classList.add("show");

    }, 10);


    document.getElementById(
        "iosSuccessOk"
    ).onclick = function () {

        overlay.classList.remove("show");

        setTimeout(function () {

            overlay.remove();

        }, 250);

    };

}


// ======================================================
// Dialog خطأ
// ======================================================

function showErrorDialog(
    title,
    message
) {

    const old =
        document.getElementById(
            "iosErrorDialog"
        );

    if (old) {
        old.remove();
    }


    const overlay =
        document.createElement("div");

    overlay.id =
        "iosErrorDialog";


    overlay.innerHTML =

        '<div class="ios-dialog">' +

            '<div class="ios-error-icon">' +

                '<span>!</span>' +

            '</div>' +


            '<div class="ios-dialog-title">' +

                escapeHtml(title) +

            '</div>' +


            '<div class="ios-dialog-message">' +

                escapeHtml(message || "") +

            '</div>' +


            '<button class="ios-ok" id="iosErrorOk">' +

                'تم' +

            '</button>' +


        '</div>';


    document.body.appendChild(overlay);


    setTimeout(function () {

        overlay.classList.add("show");

    }, 10);


    document.getElementById(
        "iosErrorOk"
    ).onclick = function () {

        overlay.classList.remove("show");

        setTimeout(function () {

            overlay.remove();

        }, 250);

    };

}


// ======================================================
// حماية النصوص داخل Dialog
// ======================================================

function escapeHtml(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

              }
