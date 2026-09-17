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


/* =========================
   تسجيل الدخول
========================= */

loginBtn.onclick = function () {

    const email =
        document.getElementById("email").value.trim();

    const password =
        document.getElementById("password").value;

    const loginMsg =
        document.getElementById("loginMsg");

    if (!email || !password) {

        loginMsg.textContent =
            "أدخل البريد وكلمة المرور";

        return;
    }

    loginBtn.disabled = true;
    loginBtn.textContent = "جاري الدخول...";

    auth.signInWithEmailAndPassword(
        email,
        password
    )

    .then(function () {

        loginMsg.textContent = "";

    })

    .catch(function (error) {

        console.log(error);

        loginMsg.textContent =
            "بيانات الدخول غير صحيحة";

    })

    .finally(function () {

        loginBtn.disabled = false;
        loginBtn.textContent = "دخول";

    });

};


/* =========================
   حالة تسجيل الدخول
========================= */

auth.onAuthStateChanged(function (user) {

    if (user) {

        console.log(
            "تم تسجيل الدخول:",
            user.email
        );

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


/* =========================
   البحث عن الحساب
========================= */

searchBtn.onclick = function () {

    const number =
        document.getElementById("account")
        .value.trim();

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

    db.ref("accountNumbers/" + number)
        .once("value")

        .then(function (a) {

            if (!a.exists()) {

                throw new Error(
                    "رقم الحساب غير موجود"
                );
            }

            const accountData =
                a.val();

            if (
                !accountData ||
                !accountData.uid
            ) {

                throw new Error(
                    "الحساب غير مرتبط بمستخدم"
                );
            }

            uid =
                accountData.uid;

            account =
                number;

            return db.ref(
                "users/" + uid
            ).once("value");

        })

        .then(function (u) {

            if (!u.exists()) {

                throw new Error(
                    "الحساب محذوف ولا يمكن تجديده"
                );
            }

            data = u.val();

            document.getElementById(
                "rAccount"
            ).textContent = account;

            document.getElementById(
                "rName"
            ).textContent =
                data.username || "-";

            document.getElementById(
                "rActive"
            ).textContent =
                data.active
                    ? "مفعل"
                    : "غير مفعل";

            document.getElementById(
                "rSub"
            ).textContent =
                data.subscriptionName || "-";

            document.getElementById(
                "rStart"
            ).textContent =
                formatDate(
                    data.subscriptionStart
                );

            document.getElementById(
                "rEnd"
            ).textContent =
                formatDate(
                    data.subscriptionEnd
                );

            document.getElementById(
                "result"
            ).classList.remove("hidden");

            msg.textContent =
                "تم العثور على الحساب";

        })

        .catch(function (error) {

            console.log(error);

            msg.textContent =
                error.message;

        })

        .finally(function () {

            searchBtn.disabled = false;
            searchBtn.textContent = "بحث";

        });

};


/* =========================
   زر التجديد
========================= */

renewBtn.onclick = function () {

    renewSubscription();

};


/* =========================
   التجديد
========================= */

async function renewSubscription() {

    console.log(
        "تم الضغط على زر التجديد"
    );


    /* التأكد من وجود حساب */

    if (!uid) {

        showErrorDialog(
            "تنبيه",
            "ابحث عن الحساب أولاً"
        );

        return;
    }


    /* التأكد من تسجيل الدخول */

    if (!auth.currentUser) {

        showErrorDialog(
            "خطأ",
            "يجب تسجيل الدخول أولاً"
        );

        return;
    }


    /* قائمة المدة */

    const period =
        document.getElementById("period");

    if (!period) {

        showErrorDialog(
            "خطأ",
            "قائمة الاشتراك غير موجودة"
        );

        return;
    }


    /* القيمة الموجودة في HTML */

    const value =
        period.value;


    console.log(
        "قيمة المدة:",
        value
    );


    let type = "";
    let name = "";


    /*
       HTML عندك:

       1   = يوم
       7   = أسبوع
       30  = شهر
       90  = 3 شهور
       365 = 12 شهر
    */


    if (value === "1") {

        type = "day";
        name = "يوم واحد";

    }

    else if (value === "7") {

        type = "week";
        name = "أسبوع واحد";

    }

    else if (value === "30") {

        type = "month";
        name = "شهر واحد";

    }

    else if (value === "90") {

        type = "3months";
        name = "3 شهور";

    }

    else if (value === "365") {

        type = "12months";
        name = "12 شهر";

    }

    else {

        showErrorDialog(
            "خطأ",
            "مدة الاشتراك غير صحيحة"
        );

        return;
    }


    renewBtn.disabled = true;
    renewBtn.textContent =
        "جاري التجديد...";


    try {

        /* =========================
           قراءة المستخدم من Firebase
        ========================= */

        const userRef =
            db.ref("users/" + uid);

        const snapshot =
            await userRef.once("value");


        /* الحساب محذوف */

        if (!snapshot.exists()) {

            showErrorDialog(
                "الحساب محذوف",
                "هذا الحساب محذوف ولا يمكن تجديده"
            );

            return;
        }


        const user =
            snapshot.val();


        /* =========================
           الوقت الحالي
        ========================= */

        const now =
            Date.now();


        /* الاشتراك القديم */

        const oldEnd =
            Number(
                user.subscriptionEnd
            ) || 0;


        /*
           إذا الاشتراك ما زال فعالًا
           نبدأ من تاريخ نهايته.

           إذا انتهى
           نبدأ من الآن.
        */

        let start;

        if (oldEnd > now) {

            start = oldEnd;

        } else {

            start = now;

        }


        /* =========================
           حساب تاريخ النهاية
        ========================= */

        const endDate =
            new Date(start);


        if (type === "day") {

            endDate.setDate(
                endDate.getDate() + 1
            );

        }

        else if (type === "week") {

            endDate.setDate(
                endDate.getDate() + 7
            );

        }

        else if (type === "month") {

            endDate.setMonth(
                endDate.getMonth() + 1
            );

        }

        else if (type === "3months") {

            endDate.setMonth(
                endDate.getMonth() + 3
            );

        }

        else if (type === "12months") {

            endDate.setFullYear(
                endDate.getFullYear() + 1
            );

        }


        const end =
            endDate.getTime();


        console.log(
            "UID:",
            uid
        );

        console.log(
            "الحساب:",
            account
        );

        console.log(
            "المدة:",
            name
        );

        console.log(
            "البداية:",
            start
        );

        console.log(
            "النهاية:",
            end
        );


        /* =========================
           تحديث Firebase
        ========================= */

        await userRef.update({

            active: true,

            subscriptionStart:
                start,

            subscriptionEnd:
                end,

            subscriptionType:
                type,

            subscriptionName:
                name

        });


        /* =========================
           تحديث البيانات المحلية
        ========================= */

        if (!data) {
            data = {};
        }

        data.active = true;

        data.subscriptionStart =
            start;

        data.subscriptionEnd =
            end;

        data.subscriptionType =
            type;

        data.subscriptionName =
            name;


        /* =========================
           تحديث الشاشة
        ========================= */

        document.getElementById(
            "rActive"
        ).textContent = "مفعل";

        document.getElementById(
            "rSub"
        ).textContent = name;

        document.getElementById(
            "rStart"
        ).textContent =
            formatDate(start);

        document.getElementById(
            "rEnd"
        ).textContent =
            formatDate(end);


        /* =========================
           نجاح
        ========================= */

        showSuccessDialog(
            account,
            name,
            formatDate(end)
        );

    }

    catch (error) {

        console.error(
            "خطأ التجديد:",
            error
        );


        const message =
            String(
                error.message || ""
            ).toLowerCase();


        if (
            error.code ===
            "PERMISSION_DENIED"
            ||
            message.includes(
                "permission denied"
            )
        ) {

            showErrorDialog(
                "خطأ في الصلاحيات",
                "حساب تسجيل الدخول لا يملك صلاحية تعديل هذا المستخدم"
            );

        }

        else {

            showErrorDialog(
                "خطأ",
                error.message ||
                "تعذر تجديد الاشتراك"
            );

        }

    }

    finally {

        renewBtn.disabled = false;

        renewBtn.textContent =
            "تجديد الاشتراك";

    }

}


/* =========================
   تنسيق التاريخ
========================= */

function formatDate(timestamp) {

    if (!timestamp) {
        return "-";
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

        return "-";
    }

    return date.toLocaleString("ar");
}


/* =========================
   رسالة النجاح
========================= */

function showSuccessDialog(
    accountNumber,
    periodName,
    endDate
) {

    alert(
        "تم تجديد الاشتراك بنجاح\n\n" +

        "رقم الحساب: " +
        accountNumber +

        "\n\nالمدة: " +
        periodName +

        "\n\nينتهي في: " +
        endDate
    );

}


/* =========================
   رسالة الخطأ
========================= */

function showErrorDialog(
    title,
    message
) {

    alert(
        title +
        "\n\n" +
        message
    );

}
