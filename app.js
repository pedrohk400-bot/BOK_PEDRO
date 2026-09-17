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

    const email =
        document.getElementById("email").value.trim();

    const password =
        document.getElementById("password").value;

    const message =
        document.getElementById("loginMsg");


    if (!email || !password) {

        message.textContent =
            "أدخل البريد وكلمة المرور";

        return;
    }


    loginBtn.disabled = true;

    loginBtn.textContent =
        "جاري الدخول...";

    message.textContent = "";


    auth.signInWithEmailAndPassword(
        email,
        password
    )

    .then(function () {

        message.textContent = "";

    })

    .catch(function (error) {

        console.log(
            "Login Error:",
            error
        );

        message.textContent =
            "بيانات الدخول غير صحيحة";

    })

    .finally(function () {

        loginBtn.disabled = false;

        loginBtn.textContent =
            "دخول";

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

        currentUid = null;

        currentAccount = null;

        currentData = null;
    }

});


// ======================================================
// البحث عن الحساب
// ======================================================

searchBtn.onclick = function () {

    const number =
        document
            .getElementById("account")
            .value
            .trim();


    const message =
        document.getElementById("msg");


    if (!/^[0-9]{7}$/.test(number)) {

        message.textContent =
            "أدخل رقم حساب مكون من 7 أرقام";

        return;
    }


    searchBtn.disabled = true;

    searchBtn.textContent =
        "جاري البحث...";

    message.textContent = "";


    currentUid = null;

    currentAccount = null;

    currentData = null;


    db.ref(
        "accountNumbers/" + number
    )

    .once("value")

    .then(function (accountSnapshot) {

        if (!accountSnapshot.exists()) {

            throw new Error(
                "رقم الحساب غير موجود"
            );
        }


        const accountData =
            accountSnapshot.val();


        const uid =
            accountData.uid;


        if (!uid) {

            throw new Error(
                "الحساب غير مرتبط بمستخدم"
            );
        }


        currentUid =
            uid;


        currentAccount =
            number;


        return db.ref(
            "users/" + uid
        ).once("value");

    })

    .then(function (userSnapshot) {

        if (!userSnapshot.exists()) {

            currentUid = null;

            currentAccount = null;

            currentData = null;


            throw new Error(
                "بيانات الحساب غير موجودة — الحساب محذوف"
            );
        }


        currentData =
            userSnapshot.val();


        document.getElementById(
            "rAccount"
        ).textContent =
            currentAccount;


        document.getElementById(
            "rName"
        ).textContent =
            currentData.username || "-";


        document.getElementById(
            "rActive"
        ).textContent =
            currentData.active
                ? "مفعل"
                : "غير مفعل";


        document.getElementById(
            "rSub"
        ).textContent =
            currentData.subscriptionName || "-";


        document.getElementById(
            "rStart"
        ).textContent =
            formatDate(
                currentData.subscriptionStart
            );


        document.getElementById(
            "rEnd"
        ).textContent =
            formatDate(
                currentData.subscriptionEnd
            );


        document.getElementById(
            "result"
        ).classList.remove("hidden");


        message.textContent =
            "تم العثور على الحساب";

    })

    .catch(function (error) {

        console.log(
            "Search Error:",
            error
        );


        message.textContent =
            error.message ||
            "حدث خطأ أثناء البحث";

    })

    .finally(function () {

        searchBtn.disabled = false;

        searchBtn.textContent =
            "بحث";

    });

};


// ======================================================
// تجديد الاشتراك
// ======================================================

renewBtn.onclick = async function () {

    if (
        !currentUid ||
        !currentAccount ||
        !currentData
    ) {

        showErrorDialog(
            "تنبيه",
            "ابحث عن الحساب أولاً"
        );

        return;
    }


    const periodSelect =
        document.getElementById("period");


    if (!periodSelect) {

        showErrorDialog(
            "خطأ",
            "قائمة مدة الاشتراك غير موجودة"
        );

        return;
    }


    const value =
        String(
            periodSelect.value || ""
        )
        .trim()
        .toLowerCase();


    const periodText =
        periodSelect.selectedOptions &&
        periodSelect.selectedOptions[0]
            ? periodSelect.selectedOptions[0].text.trim()
            : "";


    // ==================================================
    // تحديد نوع الاشتراك
    // ==================================================

    let periodType = "";


    // يوم واحد
    if (
        value === "1" ||
        value === "day" ||
        periodText.includes("يوم")
    ) {

        periodType = "day";

    }


    // أسبوع واحد
    else if (
        value === "7" ||
        value === "week" ||
        periodText.includes("أسبوع") ||
        periodText.includes("اسبوع")
    ) {

        periodType = "week";

    }


    // شهر واحد
    else if (
        value === "30" ||
        value === "month" ||
        (
            periodText.includes("شهر") &&
            !periodText.includes("3") &&
            !periodText.includes("12")
        )
    ) {

        periodType = "month";

    }


    // 3 شهور
    else if (
        value === "90" ||
        value === "3months" ||
        periodText.includes("3 شهور") ||
        periodText.includes("3شهور")
    ) {

        periodType = "3months";

    }


    // 12 شهر
    else if (
        value === "365" ||
        value === "12months" ||
        periodText.includes("12 شهر") ||
        periodText.includes("12شهر")
    ) {

        periodType = "12months";

    }


    else {

        showErrorDialog(
            "خطأ",
            "مدة الاشتراك غير معروفة"
        );

        return;
    }


    // ==================================================
    // التأكد من تسجيل الدخول
    // ==================================================

    if (!auth.currentUser) {

        showErrorDialog(
            "انتهت الجلسة",
            "يجب تسجيل الدخول أولاً"
        );

        return;
    }


    renewBtn.disabled = true;

    renewBtn.textContent =
        "جاري التجديد...";


    try {

        // ==============================================
        // قراءة الحساب مرة أخرى
        // ==============================================

        const userRef =
            db.ref(
                "users/" + currentUid
            );


        const snapshot =
            await userRef.once("value");


        // ==============================================
        // الحساب محذوف
        // ==============================================

        if (!snapshot.exists()) {

            currentUid = null;

            currentAccount = null;

            currentData = null;


            throw new Error(
                "الحساب محذوف ولا يمكن تجديده"
            );
        }


        const data =
            snapshot.val();


        // ==============================================
        // الوقت الحالي
        // ==============================================

        const now =
            Date.now();


        // ==============================================
        // نهاية الاشتراك القديم
        // ==============================================

        const oldEnd =
            Number(
                data.subscriptionEnd
            ) || 0;


        // ==============================================
        // بداية الاشتراك الجديد
        // ==============================================

        const start =
            oldEnd > now
                ? oldEnd
                : now;


        // ==============================================
        // حساب تاريخ النهاية
        // ==============================================

        const endDate =
            new Date(start);


        if (periodType === "day") {

            endDate.setDate(
                endDate.getDate() + 1
            );

        }

        else if (periodType === "week") {

            endDate.setDate(
                endDate.getDate() + 7
            );

        }

        else if (periodType === "month") {

            endDate.setMonth(
                endDate.getMonth() + 1
            );

        }

        else if (periodType === "3months") {

            endDate.setMonth(
                endDate.getMonth() + 3
            );

        }

        else if (periodType === "12months") {

            endDate.setFullYear(
                endDate.getFullYear() + 1
            );

        }


        const end =
            endDate.getTime();


        // ==============================================
        // تحديث Firebase
        // ==============================================

        await userRef.update({

            active: true,

            subscriptionStart: start,

            subscriptionEnd: end,

            subscriptionType: periodType,

            subscriptionName: periodText

        });


        // ==============================================
        // تحديث البيانات المحلية
        // ==============================================

        currentData.active =
            true;


        currentData.subscriptionStart =
            start;


        currentData.subscriptionEnd =
            end;


        currentData.subscriptionType =
            periodType;


        currentData.subscriptionName =
            periodText;


        // ==============================================
        // تحديث الشاشة
        // ==============================================

        document.getElementById(
            "rActive"
        ).textContent =
            "مفعل";


        document.getElementById(
            "rSub"
        ).textContent =
            periodText;


        document.getElementById(
            "rStart"
        ).textContent =
            formatDate(start);


        document.getElementById(
            "rEnd"
        ).textContent =
            formatDate(end);


        // ==============================================
        // رسالة النجاح
        // ==============================================

        showSuccessDialog(
            currentAccount,
            periodText,
            formatDate(end)
        );

    }


    catch (error) {

        console.log(
            "Renew Error:",
            error
        );


        let errorMessage =
            "تعذر تجديد الاشتراك";


        if (
            error.message &&
            error.message.includes(
                "الحساب محذوف"
            )
        ) {

            errorMessage =
                "الحساب محذوف ولا يمكن تجديده";

        }


        else if (
            error.code === "PERMISSION_DENIED" ||
            String(error.message || "")
                .toLowerCase()
                .includes("permission denied")
        ) {

            errorMessage =
                "ليس لديك صلاحية لتجديد هذا الحساب";

        }


        else if (error.message) {

            errorMessage =
                error.message;

        }


        showErrorDialog(
            "خطأ",
            errorMessage
        );

    }


    finally {

        renewBtn.disabled = false;

        renewBtn.textContent =
            "تجديد الاشتراك";

    }

};


// ======================================================
// تنسيق التاريخ
// ======================================================

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


    return date.toLocaleString(
        "ar"
    );
}


// ======================================================
// Dialog النجاح
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
        document.createElement(
            "div"
        );


    overlay.id =
        "iosSuccessDialog";


    overlay.innerHTML =

        '<div class="ios-dialog">' +

            '<div class="ios-success-icon">' +

                '<span>✓</span>' +

            '</div>' +

            '<div class="ios-dialog-title">' +

                'تم تجديد الاشتراك بنجاح' +

            '</div>' +

            '<div class="ios-dialog-message">' +

                'BOK PEDRO' +

            '</div>' +

            '<div class="ios-info">' +

                '<div class="ios-row">' +

                    '<span>رقم الحساب</span>' +

                    '<strong>' +

                        escapeHtml(
                            account
                        ) +

                    '</strong>' +

                '</div>' +

                '<div class="ios-row">' +

                    '<span>مدة الاشتراك</span>' +

                    '<strong>' +

                        escapeHtml(
                            period
                        ) +

                    '</strong>' +

                '</div>' +

                '<div class="ios-row">' +

                    '<span>ينتهي في</span>' +

                    '<strong>' +

                        escapeHtml(
                            endDate
                        ) +

                    '</strong>' +

                '</div>' +

            '</div>' +

            '<button class="ios-ok" id="iosSuccessOk">' +

                'تم' +

            '</button>' +

        '</div>';


    document.body.appendChild(
        overlay
    );


    setTimeout(function () {

        overlay.classList.add(
            "show"
        );

    }, 10);


    document.getElementById(
        "iosSuccessOk"
    ).onclick = function () {

        overlay.classList.remove(
            "show"
        );


        setTimeout(function () {

            overlay.remove();

        }, 250);

    };

}


// ======================================================
// Dialog الخطأ
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
        document.createElement(
            "div"
        );


    overlay.id =
        "iosErrorDialog";


    overlay.innerHTML =

        '<div class="ios-dialog">' +

            '<div class="ios-error-icon">' +

                '<span>!</span>' +

            '</div>' +

            '<div class="ios-dialog-title">' +

                escapeHtml(
                    title
                ) +

            '</div>' +

            '<div class="ios-dialog-message">' +

                escapeHtml(
                    message || ""
                ) +

            '</div>' +

            '<button class="ios-ok" id="iosErrorOk">' +

                'تم' +

            '</button>' +

        '</div>';


    document.body.appendChild(
        overlay
    );


    setTimeout(function () {

        overlay.classList.add(
            "show"
        );

    }, 10);


    document.getElementById(
        "iosErrorOk"
    ).onclick = function () {

        overlay.classList.remove(
            "show"
        );


        setTimeout(function () {

            overlay.remove();

        }, 250);

    };

}


// ======================================================
// حماية النصوص
// ======================================================

function escapeHtml(value) {

    return String(value)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}
