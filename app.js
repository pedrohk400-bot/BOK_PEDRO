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


// تسجيل الدخول
loginBtn.onclick = function () {

    const email =
        document.getElementById("email").value.trim();

    const password =
        document.getElementById("password").value;

    if (!email || !password) {
        document.getElementById("loginMsg").textContent =
            "أدخل البريد وكلمة المرور";
        return;
    }

    loginBtn.disabled = true;
    loginBtn.textContent = "جاري الدخول...";

    auth.signInWithEmailAndPassword(email, password)
        .catch(function () {
            document.getElementById("loginMsg").textContent =
                "بيانات الدخول غير صحيحة";
        })
        .finally(function () {
            loginBtn.disabled = false;
            loginBtn.textContent = "دخول";
        });
};


// حالة الدخول
auth.onAuthStateChanged(function (user) {

    if (user) {
        loginBox.classList.add("hidden");
        appBox.classList.remove("hidden");
    } else {
        loginBox.classList.remove("hidden");
        appBox.classList.add("hidden");
        uid = null;
        account = null;
        data = null;
    }

});


// البحث
searchBtn.onclick = function () {

    const number =
        document.getElementById("account").value.trim();

    const msg =
        document.getElementById("msg");

    if (!/^[0-9]{7}$/.test(number)) {
        msg.textContent =
            "أدخل رقم حساب مكون من 7 أرقام";
        return;
    }

    searchBtn.disabled = true;
    searchBtn.textContent = "جاري البحث...";
    msg.textContent = "";

    db.ref("accountNumbers/" + number).once("value")

        .then(function (a) {

            if (!a.exists())
                throw new Error("رقم الحساب غير موجود");

            if (!a.val().uid)
                throw new Error("الحساب غير مرتبط بمستخدم");

            uid = a.val().uid;
            account = number;

            return db.ref("users/" + uid).once("value");
        })

        .then(function (u) {

            if (!u.exists())
                throw new Error("الحساب محذوف ولا يمكن تجديده");

            data = u.val();

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
        })

        .finally(function () {
            searchBtn.disabled = false;
            searchBtn.textContent = "بحث";
        });
};


// التجديد
renewBtn.onclick = async function () {

    if (!uid) {
        showErrorDialog("تنبيه", "ابحث عن الحساب أولاً");
        return;
    }

    const select =
        document.getElementById("period");

    if (!select) {
        showErrorDialog("خطأ", "قائمة الاشتراك غير موجودة");
        return;
    }


    // الاعتماد على ترتيب الخيار
    const i = select.selectedIndex;


    const types = [
        ["day", "يوم واحد"],
        ["week", "أسبوع واحد"],
        ["month", "شهر واحد"],
        ["3months", "3 شهور"],
        ["12months", "12 شهر"]
    ];


    if (i < 0 || i > 4) {
        showErrorDialog("خطأ", "اختر مدة الاشتراك");
        return;
    }


    const type = types[i][0];
    const name = types[i][1];


    if (!auth.currentUser) {
        showErrorDialog("خطأ", "يجب تسجيل الدخول أولاً");
        return;
    }


    renewBtn.disabled = true;
    renewBtn.textContent = "جاري التجديد...";


    try {

        // قراءة الحساب من Firebase
        const ref =
            db.ref("users/" + uid);

        const snap =
            await ref.once("value");


        if (!snap.exists()) {
            showErrorDialog(
                "الحساب محذوف",
                "هذا الحساب محذوف ولا يمكن تجديده"
            );
            return;
        }


        const user =
            snap.val();


        const now =
            Date.now();


        const oldEnd =
            Number(user.subscriptionEnd) || 0;


        // الساري يكمل من نهايته
        const start =
            oldEnd > now ? oldEnd : now;


        const endDate =
            new Date(start);


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


        const end =
            endDate.getTime();


        await ref.update({

            active: true,

            subscriptionStart: start,

            subscriptionEnd: end,

            subscriptionType: type,

            subscriptionName: name

        });


        // تحديث الشاشة
        data.active = true;
        data.subscriptionStart = start;
        data.subscriptionEnd = end;
        data.subscriptionType = type;
        data.subscriptionName = name;


        document.getElementById("rActive").textContent =
            "مفعل";

        document.getElementById("rSub").textContent =
            name;

        document.getElementById("rStart").textContent =
            formatDate(start);

        document.getElementById("rEnd").textContent =
            formatDate(end);


        showSuccessDialog(
            account,
            name,
            formatDate(end)
        );

    }

    catch (e) {

        console.log(e);

        if (
            e.code === "PERMISSION_DENIED" ||
            String(e.message).toLowerCase().includes("permission denied")
        ) {

            showErrorDialog(
                "خطأ",
                "ليس لديك صلاحية لتجديد هذا الحساب"
            );

        } else {

            showErrorDialog(
                "خطأ",
                e.message || "تعذر التجديد"
            );

        }

    }

    finally {

        renewBtn.disabled = false;
        renewBtn.textContent = "تجديد الاشتراك";

    }

};


// التاريخ
function formatDate(t) {

    if (!t) return "-";

    const d = new Date(Number(t));

    if (isNaN(d.getTime()))
        return "-";

    return d.toLocaleString("ar");
}


// نجاح
function showSuccessDialog(account, period, end) {

    alert(
        "تم تجديد الاشتراك بنجاح\n\n" +
        "رقم الحساب: " + account +
        "\nالمدة: " + period +
        "\nينتهي في: " + end
    );

}


// خطأ
function showErrorDialog(title, message) {

    alert(
        title + "\n\n" + message
    );

}
