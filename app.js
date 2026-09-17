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

let uid = null;
let account = null;
let data = null;


/* تسجيل الدخول */
loginBtn.onclick = function () {

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const msg = document.getElementById("loginMsg");

    if (!email || !password) {
        msg.textContent = "أدخل البريد وكلمة المرور";
        return;
    }

    loginBtn.disabled = true;
    loginBtn.textContent = "جاري الدخول...";

    auth.signInWithEmailAndPassword(email, password)
    .catch(function () {
        msg.textContent = "بيانات الدخول غير صحيحة";
    })
    .finally(function () {
        loginBtn.disabled = false;
        loginBtn.textContent = "دخول";
    });
};


/* حالة تسجيل الدخول */
auth.onAuthStateChanged(function (user) {

    if (user) {
        loginBox.classList.add("hidden");
        appBox.classList.remove("hidden");
        console.log("تم الدخول:", user.email);
    } else {
        loginBox.classList.remove("hidden");
        appBox.classList.add("hidden");
        uid = null;
        account = null;
        data = null;
    }

});


/* البحث */
searchBtn.onclick = function () {

    const number = document.getElementById("account").value.trim();
    const msg = document.getElementById("msg");

    if (!/^[0-9]{7}$/.test(number)) {
        msg.textContent = "أدخل رقم حساب مكون من 7 أرقام";
        return;
    }

    searchBtn.disabled = true;
    searchBtn.textContent = "جاري البحث...";
    msg.textContent = "";

    db.ref("accountNumbers/" + number).once("value")
    .then(function (snap) {

        if (!snap.exists()) {
            throw new Error("رقم الحساب غير موجود");
        }

        const a = snap.val();

        if (!a || !a.uid) {
            throw new Error("الحساب غير مرتبط بمستخدم");
        }

        uid = a.uid;
        account = number;

        return db.ref("users/" + uid).once("value");
    })
    .then(function (snap) {

        if (!snap.exists()) {
            throw new Error("الحساب محذوف ولا يمكن تجديده");
        }

        data = snap.val();

        document.getElementById("rAccount").textContent = account;
        document.getElementById("rName").textContent = data.username || "-";
        document.getElementById("rActive").textContent =
            data.active ? "مفعل" : "غير مفعل";
        document.getElementById("rSub").textContent =
            data.subscriptionName || "-";
        document.getElementById("rStart").textContent =
            formatDate(data.subscriptionStart);
        document.getElementById("rEnd").textContent =
            formatDate(data.subscriptionEnd);

        document.getElementById("result").classList.remove("hidden");
        msg.textContent = "تم العثور على الحساب";
    })
    .catch(function (e) {
        msg.textContent = e.message;
        console.log(e);
    })
    .finally(function () {
        searchBtn.disabled = false;
        searchBtn.textContent = "بحث";
    });
};


/* التجديد */
renewBtn.onclick = function () {

    if (!uid) {
        showErrorDialog("تنبيه", "ابحث عن الحساب أولاً");
        return;
    }

    const period = document.getElementById("period");
    const text = period.options[period.selectedIndex].textContent.trim();

    let type, name;

    if (text.includes("يوم")) {
        type = "day";
        name = "يوم واحد";
    } else if (text.includes("أسبوع") || text.includes("اسبوع")) {
        type = "week";
        name = "أسبوع واحد";
    } else if (text.includes("12") && text.includes("شهر")) {
        type = "12months";
        name = "12 شهر";
    } else if (text.includes("3") && text.includes("شهر")) {
        type = "3months";
        name = "3 شهور";
    } else if (text.includes("شهر")) {
        type = "month";
        name = "شهر واحد";
    } else {
        showErrorDialog("خطأ", "مدة الاشتراك غير صحيحة");
        return;
    }

    renewBtn.disabled = true;
    renewBtn.textContent = "جاري التجديد...";

    const ref = db.ref("users/" + uid);

    ref.once("value")
    .then(function (snap) {

        if (!snap.exists()) {
            throw new Error("الحساب محذوف ولا يمكن تجديده");
        }

        const user = snap.val();
        const now = Date.now();
        const oldEnd = Number(user.subscriptionEnd) || 0;
        const start = oldEnd > now ? oldEnd : now;

        const endDate = new Date(start);

        if (type === "day")
            endDate.setDate(endDate.getDate() + 1);

        else if (type === "week")
            endDate.setDate(endDate.getDate() + 7);

        else if (type === "month")
            endDate.setMonth(endDate.getMonth() + 1);

        else if (type === "3months")
            endDate.setMonth(endDate.getMonth() + 3);

        else if (type === "12months")
            endDate.setFullYear(endDate.getFullYear() + 1);

        const end = endDate.getTime();

        return ref.update({
            active: true,
            subscriptionStart: start,
            subscriptionEnd: end,
            subscriptionType: type,
            subscriptionName: name
        })
        .then(function () {

            document.getElementById("rActive").textContent = "مفعل";
            document.getElementById("rSub").textContent = name;
            document.getElementById("rStart").textContent = formatDate(start);
            document.getElementById("rEnd").textContent = formatDate(end);

            showSuccessDialog(account, name, formatDate(end));
        });
    })
    .catch(function (e) {

        console.error("RENEW ERROR:", e);

        if (
            e.code === "PERMISSION_DENIED" ||
            String(e.message).toLowerCase().includes("permission denied")
        ) {
            showErrorDialog(
                "خطأ في الصلاحيات",
                "ليس لديك صلاحية لتجديد هذا الحساب"
            );
        } else {
            showErrorDialog("خطأ", e.message);
        }
    })
    .finally(function () {
        renewBtn.disabled = false;
        renewBtn.textContent = "تجديد الاشتراك";
    });
};


/* التاريخ */
function formatDate(timestamp) {

    if (!timestamp) return "-";

    const d = new Date(Number(timestamp));

    if (isNaN(d.getTime())) return "-";

    return d.toLocaleString("ar");
}


/* الرسائل */
function showSuccessDialog(account, period, end) {

    alert(
        "تم تجديد الاشتراك بنجاح\n\n" +
        "رقم الحساب: " + account +
        "\n\nالمدة: " + period +
        "\n\nينتهي في: " + end
    );
}

function showErrorDialog(title, message) {

    alert(title + "\n\n" + message);
}
