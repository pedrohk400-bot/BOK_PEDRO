/* ======================================================
   FIREBASE CONFIG
====================================================== */

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


/* ======================================================
   UID حساب الإدارة
====================================================== */

const ADMIN_UID =
    "s78AZc7ginWouJcYLI3cIRs1lAZ2";


/* ======================================================
   عناصر الصفحة
====================================================== */

const loginBox =
    document.getElementById("login");

const appBox =
    document.getElementById("app");

const loginBtn =
    document.getElementById("loginBtn");

const searchBtn =
    document.getElementById("searchBtn");

const renewBtn =
    document.getElementById("renewBtn");


/* ======================================================
   متغيرات
====================================================== */

let uid = null;
let account = null;
let data = null;


/*
   مهم جدًا:

   هذا المتغير يمنع Firebase من إظهار
   صفحة البحث تلقائيًا بسبب جلسة قديمة.

   لا يصبح true إلا بعد الضغط على دخول
   ونجاح تسجيل الدخول.
*/

let loginApproved = false;


/* ======================================================
   بداية الموقع
====================================================== */

/*
   دائمًا نبدأ بصفحة تسجيل الدخول
*/

loginBox.classList.remove("hidden");
appBox.classList.add("hidden");


/* ======================================================
   مراقبة Firebase Auth
====================================================== */

auth.onAuthStateChanged(function (user) {

    /*
       لا يوجد مستخدم
    */

    if (!user) {

        uid = null;
        account = null;
        data = null;

        loginBox.classList.remove("hidden");
        appBox.classList.add("hidden");

        return;
    }


    /*
       يوجد مستخدم ولكن لم تتم الموافقة
       من زر تسجيل الدخول في هذه الصفحة.
       
       لذلك لا نعرض التطبيق.
    */

    if (!loginApproved) {

        loginBox.classList.remove("hidden");
        appBox.classList.add("hidden");

        return;
    }


    /*
       التأكد من UID الإدارة
    */

    if (user.uid !== ADMIN_UID) {

        loginApproved = false;

        auth.signOut();

        loginBox.classList.remove("hidden");
        appBox.classList.add("hidden");

        return;
    }


    /*
       حساب الإدارة صحيح
    */

    uid = user.uid;

    loginBox.classList.add("hidden");
    appBox.classList.remove("hidden");

});


/* ======================================================
   تسجيل الدخول
====================================================== */

loginBtn.onclick = function () {

    const email =
        document.getElementById("email")
        .value
        .trim();

    const password =
        document.getElementById("password")
        .value;

    const msg =
        document.getElementById("loginMsg");


    /* التحقق من الحقول */

    if (!email || !password) {

        msg.textContent =
            "أدخل البريد وكلمة المرور";

        return;
    }


    /* تعطيل الزر */

    loginBtn.disabled = true;

    loginBtn.textContent =
        "جاري الدخول...";

    msg.textContent = "";


    /*
       تسجيل الدخول
    */

    auth.signInWithEmailAndPassword(
        email,
        password
    )

    .then(function (result) {

        const user =
            result.user;


        /*
           التأكد أن الحساب هو حساب الإدارة
        */

        if (user.uid !== ADMIN_UID) {

            loginApproved = false;

            return auth.signOut()

            .then(function () {

                throw new Error(
                    "هذا الحساب ليس حساب الإدارة"
                );

            });

        }


        /*
           تمت الموافقة
        */

        loginApproved = true;

        uid = user.uid;


        /*
           إخفاء تسجيل الدخول
           وإظهار لوحة الإدارة
        */

        loginBox.classList.add("hidden");

        appBox.classList.remove("hidden");

        msg.textContent = "";

    })

    .catch(function (error) {

        console.error(
            "LOGIN ERROR:",
            error
        );


        if (
            error.message ===
            "هذا الحساب ليس حساب الإدارة"
        ) {

            msg.textContent =
                "هذا الحساب ليس حساب الإدارة";

        } else {

            msg.textContent =
                "بيانات الدخول غير صحيحة";

        }

    })

    .finally(function () {

        loginBtn.disabled = false;

        loginBtn.textContent =
            "دخول";

    });

};


/* ======================================================
   البحث عن الحساب
====================================================== */

searchBtn.onclick = function () {

    const number =
        document.getElementById("account")
        .value
        .trim();

    const msg =
        document.getElementById("msg");


    /* التأكد من تسجيل الإدارة */

    if (
        !auth.currentUser ||
        auth.currentUser.uid !== ADMIN_UID
    ) {

        loginApproved = false;

        loginBox.classList.remove("hidden");
        appBox.classList.add("hidden");

        msg.textContent =
            "يجب تسجيل الدخول بحساب الإدارة";

        return;
    }


    /* التحقق من رقم الحساب */

    if (!/^[0-9]{7}$/.test(number)) {

        msg.textContent =
            "أدخل رقم حساب مكون من 7 أرقام";

        return;
    }


    /* بداية البحث */

    searchBtn.disabled = true;

    searchBtn.textContent =
        "جاري البحث...";

    msg.textContent = "";


    /*
       البحث في accountNumbers
    */

    db.ref(
        "accountNumbers/" + number
    )

    .once("value")

    .then(function (snap) {

        /*
           الحساب غير موجود
        */

        if (!snap.exists()) {

            throw new Error(
                "رقم الحساب غير موجود"
            );
        }


        const accountData =
            snap.val();


        /*
           التأكد من وجود UID
        */

        if (!accountData.uid) {

            throw new Error(
                "الحساب غير مرتبط بمستخدم"
            );
        }


        uid =
            accountData.uid;

        account =
            number;


        /*
           جلب بيانات المستخدم
        */

        return db.ref(
            "users/" + uid
        )

        .once("value");

    })

    .then(function (snap) {

        /*
           المستخدم غير موجود
        */

        if (!snap.exists()) {

            throw new Error(
                "الحساب محذوف ولا يمكن تجديده"
            );
        }


        data =
            snap.val();


        /*
           رقم الحساب
        */

        document.getElementById(
            "rAccount"
        ).textContent =
            account;


        /*
           الاسم
        */

        document.getElementById(
            "rName"
        ).textContent =
            data.username || "-";


        /*
           الحالة
        */

        document.getElementById(
            "rActive"
        ).textContent =
            data.active
            ? "مفعل"
            : "غير مفعل";


        /*
           الاشتراك
        */

        document.getElementById(
            "rSub"
        ).textContent =
            data.subscriptionName || "-";


        /*
           البداية
        */

        document.getElementById(
            "rStart"
        ).textContent =
            formatDate(
                data.subscriptionStart
            );


        /*
           النهاية
        */

        document.getElementById(
            "rEnd"
        ).textContent =
            formatDate(
                data.subscriptionEnd
            );


        /*
           إظهار النتيجة
        */

        document.getElementById(
            "result"
        ).classList.remove("hidden");


        msg.textContent =
            "تم العثور على الحساب";

    })

    .catch(function (error) {

        console.error(
            "SEARCH ERROR:",
            error
        );

        msg.textContent =
            error.message;

    })

    .finally(function () {

        searchBtn.disabled = false;

        searchBtn.textContent =
            "بحث";

    });

};


/* ======================================================
   تجديد الاشتراك
====================================================== */

renewBtn.onclick = function () {


    /*
       التأكد من وجود حساب محدد
    */

    if (!uid) {

        showErrorDialog(
            "تنبيه",
            "ابحث عن الحساب أولاً"
        );

        return;
    }


    /*
       التأكد من حساب الإدارة
    */

    if (
        !auth.currentUser ||
        auth.currentUser.uid !== ADMIN_UID
    ) {

        loginApproved = false;

        loginBox.classList.remove("hidden");
        appBox.classList.add("hidden");

        showErrorDialog(
            "خطأ",
            "حساب الإدارة غير مصرح"
        );

        return;
    }


    /*
       اختيار المدة
    */

    const period =
        document.getElementById("period");


    const text =
        period.options[
            period.selectedIndex
        ].textContent.trim();


    let type;
    let name;


    /*
       يوم
    */

    if (text.includes("يوم")) {

        type =
            "day";

        name =
            "يوم واحد";

    }


    /*
       أسبوع
    */

    else if (
        text.includes("أسبوع") ||
        text.includes("اسبوع")
    ) {

        type =
            "week";

        name =
            "أسبوع واحد";

    }


    /*
       12 شهر
    */

    else if (
        text.includes("12") &&
        text.includes("شهر")
    ) {

        type =
            "12months";

        name =
            "12 شهر";

    }


    /*
       3 شهور
    */

    else if (
        text.includes("3") &&
        text.includes("شهر")
    ) {

        type =
            "3months";

        name =
            "3 شهور";

    }


    /*
       شهر
    */

    else if (
        text.includes("شهر")
    ) {

        type =
            "month";

        name =
            "شهر واحد";

    }


    /*
       مدة غير صحيحة
    */

    else {

        showErrorDialog(
            "خطأ",
            "مدة الاشتراك غير صحيحة"
        );

        return;
    }


    /*
       تعطيل زر التجديد
    */

    renewBtn.disabled = true;

    renewBtn.textContent =
        "جاري التجديد...";


    /*
       مرجع المستخدم
    */

    const ref =
        db.ref(
            "users/" + uid
        );


    /*
       قراءة بيانات المستخدم مرة أخرى
    */

    ref.once("value")

    .then(function (snap) {

        /*
           المستخدم غير موجود
        */

        if (!snap.exists()) {

            throw new Error(
                "الحساب محذوف ولا يمكن تجديده"
            );
        }


        const user =
            snap.val();


        /*
           الوقت الحالي
        */

        const now =
            Date.now();


        /*
           نهاية الاشتراك القديم
        */

        const oldEnd =
            Number(
                user.subscriptionEnd
            ) || 0;


        /*
           إذا الاشتراك القديم ما زال ساريًا
           نضيف المدة فوق نهايته.

           إذا انتهى:
           نبدأ من الآن.
        */

        const start =
            oldEnd > now
            ? oldEnd
            : now;


        /*
           حساب تاريخ النهاية
        */

        const endDate =
            new Date(start);


        /*
           يوم
        */

        if (type === "day") {

            endDate.setDate(
                endDate.getDate() + 1
            );

        }


        /*
           أسبوع
        */

        else if (type === "week") {

            endDate.setDate(
                endDate.getDate() + 7
            );

        }


        /*
           شهر
        */

        else if (type === "month") {

            endDate.setMonth(
                endDate.getMonth() + 1
            );

        }


        /*
           3 شهور
        */

        else if (type === "3months") {

            endDate.setMonth(
                endDate.getMonth() + 3
            );

        }


        /*
           سنة
        */

        else if (type === "12months") {

            endDate.setFullYear(
                endDate.getFullYear() + 1
            );

        }


        /*
           Timestamp النهاية
        */

        const end =
            endDate.getTime();


        /*
           تحديث Firebase
        */

        return ref.update({

            active:
                true,

            subscriptionStart:
                start,

            subscriptionEnd:
                end,

            subscriptionType:
                type,

            subscriptionName:
                name

        })

        .then(function () {


            /*
               تحديث الواجهة
            */

            document.getElementById(
                "rActive"
            ).textContent =
                "مفعل";


            document.getElementById(
                "rSub"
            ).textContent =
                name;


            document.getElementById(
                "rStart"
            ).textContent =
                formatDate(start);


            document.getElementById(
                "rEnd"
            ).textContent =
                formatDate(end);


            /*
               تحديث البيانات المحلية
            */

            if (data) {

                data.active =
                    true;

                data.subscriptionStart =
                    start;

                data.subscriptionEnd =
                    end;

                data.subscriptionType =
                    type;

                data.subscriptionName =
                    name;

            }


            /*
               رسالة النجاح
            */

            showSuccessDialog(
                account,
                name,
                formatDate(end)
            );

        });

    })

    .catch(function (error) {

        console.error(
            "RENEW ERROR:",
            error
        );


        /*
           خطأ الصلاحيات
        */

        if (
            error.code ===
            "PERMISSION_DENIED"
        ) {

            showErrorDialog(
                "خطأ في الصلاحيات",
                "حساب الإدارة غير مصرح له بتعديل هذا الحساب"
            );

        }


        /*
           أي خطأ آخر
        */

        else {

            showErrorDialog(
                "خطأ",
                error.message
            );

        }

    })

    .finally(function () {

        renewBtn.disabled = false;

        renewBtn.textContent =
            "تجديد الاشتراك";

    });

};


/* ======================================================
   تنسيق التاريخ
====================================================== */

function formatDate(timestamp) {

    if (!timestamp) {

        return "-";
    }


    const d =
        new Date(
            Number(timestamp)
        );


    if (isNaN(d.getTime())) {

        return "-";
    }


    return d.toLocaleString("ar");
}


/* ======================================================
   رسالة النجاح
====================================================== */

function showSuccessDialog(
    account,
    period,
    end
) {

    alert(
        "تم تجديد الاشتراك بنجاح\n\n" +
        "رقم الحساب: " +
        account +
        "\n\n" +
        "المدة: " +
        period +
        "\n\n" +
        "ينتهي في: " +
        end
    );

}


/* ======================================================
   رسالة الخطأ
====================================================== */

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
