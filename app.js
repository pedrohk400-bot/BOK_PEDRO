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

const ADMIN_UID =
    "s78AZc7ginWouJcYLI3cIRs1lAZ2";

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

let uid = null;
let account = null;
let data = null;


/* =========================================
   بداية الموقع
========================================= */

loginBox.classList.remove("hidden");
appBox.classList.add("hidden");


/* =========================================
   تسجيل الدخول
========================================= */

loginBtn.onclick = function () {

    const email =
        document.getElementById("email")
        .value.trim();

    const password =
        document.getElementById("password")
        .value;

    const msg =
        document.getElementById("loginMsg");

    if (!email || !password) {
        msg.textContent =
            "أدخل البريد وكلمة المرور";
        return;
    }

    loginBtn.disabled = true;
    loginBtn.textContent =
        "جاري الدخول...";

    auth.signInWithEmailAndPassword(
        email,
        password
    )

    .then(function (result) {

        const user = result.user;

        /* التأكد أن هذا هو حساب الإدارة */

        if (user.uid !== ADMIN_UID) {

            return auth.signOut()
            .then(function () {

                throw new Error(
                    "هذا الحساب ليس حساب الإدارة"
                );

            });
        }

        loginBox.classList.add("hidden");
        appBox.classList.remove("hidden");

        msg.textContent = "";

    })

    .catch(function (error) {

        console.log(
            "LOGIN ERROR:",
            error
        );

        msg.textContent =
            error.message ===
            "هذا الحساب ليس حساب الإدارة"

            ? error.message

            : "بيانات الدخول غير صحيحة";

    })

    .finally(function () {

        loginBtn.disabled = false;
        loginBtn.textContent = "دخول";

    });
};


/* =========================================
   حالة Firebase
========================================= */

auth.onAuthStateChanged(function (user) {

    if (!user) {

        loginBox.classList.remove("hidden");
        appBox.classList.add("hidden");

        uid = null;
        account = null;
        data = null;

        return;
    }

    /* إذا كان حساب الإدارة */

    if (user.uid === ADMIN_UID) {

        loginBox.classList.add("hidden");
        appBox.classList.remove("hidden");

        return;
    }

    /* أي حساب آخر */

    auth.signOut();

    loginBox.classList.remove("hidden");
    appBox.classList.add("hidden");

});


/* =========================================
   البحث عن الحساب
========================================= */

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
    searchBtn.textContent =
        "جاري البحث...";

    db.ref(
        "accountNumbers/" + number
    )
    .once("value")

    .then(function (snap) {

        if (!snap.exists()) {
            throw new Error(
                "رقم الحساب غير موجود"
            );
        }

        const accountData =
            snap.val();

        if (!accountData.uid) {
            throw new Error(
                "الحساب غير مرتبط بمستخدم"
            );
        }

        uid = accountData.uid;
        account = number;

        return db.ref(
            "users/" + uid
        ).once("value");

    })

    .then(function (snap) {

        if (!snap.exists()) {
            throw new Error(
                "الحساب محذوف ولا يمكن تجديده"
            );
        }

        data = snap.val();

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

        msg.textContent =
            error.message;

    })

    .finally(function () {

        searchBtn.disabled = false;
        searchBtn.textContent = "بحث";

    });
};


/* =========================================
   التجديد
========================================= */

renewBtn.onclick = function () {

    if (!uid) {

        showErrorDialog(
            "تنبيه",
            "ابحث عن الحساب أولاً"
        );

        return;
    }

    /* التأكد من أن الإدارة هي التي تعمل */

    if (
        !auth.currentUser ||
        auth.currentUser.uid !== ADMIN_UID
    ) {

        showErrorDialog(
            "خطأ",
            "حساب الإدارة غير مصرح"
        );

        return;
    }

    const period =
        document.getElementById("period");

    const text =
        period.options[
            period.selectedIndex
        ].textContent.trim();

    let type;
    let name;

    if (text.includes("يوم")) {

        type = "day";
        name = "يوم واحد";

    } else if (
        text.includes("أسبوع") ||
        text.includes("اسبوع")
    ) {

        type = "week";
        name = "أسبوع واحد";

    } else if (
        text.includes("12") &&
        text.includes("شهر")
    ) {

        type = "12months";
        name = "12 شهر";

    } else if (
        text.includes("3") &&
        text.includes("شهر")
    ) {

        type = "3months";
        name = "3 شهور";

    } else if (
        text.includes("شهر")
    ) {

        type = "month";
        name = "شهر واحد";

    } else {

        showErrorDialog(
            "خطأ",
            "مدة الاشتراك غير صحيحة"
        );

        return;
    }

    renewBtn.disabled = true;
    renewBtn.textContent =
        "جاري التجديد...";

    const ref =
        db.ref("users/" + uid);

    ref.once("value")

    .then(function (snap) {

        if (!snap.exists()) {
            throw new Error(
                "الحساب محذوف ولا يمكن تجديده"
            );
        }

        const user = snap.val();

        const now = Date.now();

        const oldEnd =
            Number(
                user.subscriptionEnd
            ) || 0;

        const start =
            oldEnd > now
            ? oldEnd
            : now;

        const endDate =
            new Date(start);

        if (type === "day")
            endDate.setDate(
                endDate.getDate() + 1
            );

        else if (type === "week")
            endDate.setDate(
                endDate.getDate() + 7
            );

        else if (type === "month")
            endDate.setMonth(
                endDate.getMonth() + 1
            );

        else if (type === "3months")
            endDate.setMonth(
                endDate.getMonth() + 3
            );

        else if (type === "12months")
            endDate.setFullYear(
                endDate.getFullYear() + 1
            );

        const end =
            endDate.getTime();

        return ref.update({

            active: true,

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

        if (
            error.code ===
            "PERMISSION_DENIED"
        ) {

            showErrorDialog(
                "خطأ في الصلاحيات",
                "حساب الإدارة غير مصرح له"
            );

        } else {

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


/* =========================================
   التاريخ
========================================= */

function formatDate(timestamp) {

    if (!timestamp) return "-";

    const d =
        new Date(Number(timestamp));

    if (isNaN(d.getTime()))
        return "-";

    return d.toLocaleString("ar");
}


/* =========================================
   الرسائل
========================================= */

function showSuccessDialog(
    account,
    period,
    end
) {

    alert(
        "تم تجديد الاشتراك بنجاح\n\n" +
        "رقم الحساب: " + account +
        "\n\nالمدة: " + period +
        "\n\nينتهي في: " + end
    );
}


function showErrorDialog(
    title,
    message
) {

    alert(
        title + "\n\n" + message
    );
}
