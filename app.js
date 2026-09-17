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

    const e =
        document.getElementById("email").value.trim();

    const p =
        document.getElementById("password").value;

    const m =
        document.getElementById("loginMsg");

    if (!e || !p) {

        m.textContent =
            "أدخل البريد وكلمة المرور";

        return;
    }

    loginBtn.disabled = true;

    loginBtn.textContent =
        "جاري الدخول...";

    m.textContent = "";

    auth.signInWithEmailAndPassword(e, p)

        .then(function () {

            m.textContent = "";

        })

        .catch(function (error) {

            console.log(error);

            m.textContent =
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
        document.getElementById("account").value.trim();

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


    // مسح الحساب السابق
    currentUid = null;
    currentAccount = null;
    currentData = null;


    db.ref("accountNumbers/" + number)
        .once("value")

        .then(function (a) {

            if (!a.exists()) {

                throw new Error(
                    "رقم الحساب غير موجود"
                );
            }


            const uid =
                a.val().uid;


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


        .then(function (u) {

            if (!u.exists()) {

                currentUid = null;
                currentAccount = null;
                currentData = null;

                throw new Error(
                    "بيانات الحساب غير موجودة — الحساب محذوف"
                );
            }


            currentData =
                u.val();


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

            console.log(error);


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
// حساب تاريخ التجديد
// ======================================================

function calculateRenewalEnd(
    startTimestamp,
    period
) {

    const date =
        new Date(
            Number(startTimestamp)
        );


    switch (period) {

        case "day":

            date.setDate(
                date.getDate() + 1
            );

            break;


        case "week":

            date.setDate(
                date.getDate() + 7
            );

            break;


        case "month":

            date.setMonth(
                date.getMonth() + 1
            );

            break;


        case "3months":

            date.setMonth(
                date.getMonth() + 3
            );

            break;


        case "12months":

            date.setFullYear(
                date.getFullYear() + 1
            );

            break;


        default:

            throw new Error(
                "مدة الاشتراك غير صحيحة"
            );
    }


    return date.getTime();
}


// ======================================================
// أسماء الاشتراكات
// ======================================================

function getPeriodName(period) {

    switch (period) {

        case "day":
            return "يوم واحد";

        case "week":
            return "أسبوع واحد";

        case "month":
            return "شهر واحد";

        case "3months":
            return "3 شهور";

        case "12months":
            return "12 شهر";

        default:
            return "";
    }
}


// ======================================================
// تجديد الاشتراك
// ======================================================

renewBtn.onclick = async function () {

    // ----------------------------------------------
    // التأكد من وجود حساب محدد
    // ----------------------------------------------

    if (!currentUid || !currentAccount) {

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


    const period =
        periodSelect.value;


    const periodText =
        getPeriodName(period);


    if (!periodText) {

        showErrorDialog(
            "خطأ",
            "مدة الاشتراك غير صحيحة"
        );

        return;
    }


    // ----------------------------------------------
    // التأكد من تسجيل الدخول
    // ----------------------------------------------

    const user =
        auth.currentUser;


    if (!user) {

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

        // ==========================================
        // قراءة بيانات الحساب مرة أخرى
        // ==========================================

        const userRef =
            db.ref(
                "users/" + currentUid
            );


        const snapshot =
            await userRef.once("value");


        // ==========================================
        // الحساب محذوف
        // ==========================================

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


        // ==========================================
        // التأكد أن رقم الحساب ما زال صحيحًا
        // ==========================================

        if (
            data.accountNumber &&
            String(data.accountNumber) !==
            String(currentAccount)
        ) {

            throw new Error(
                "بيانات الحساب لا تتطابق مع رقم الحساب"
            );
        }


        // ==========================================
        // الوقت الحالي
        // ==========================================

        const now =
            Date.now();


        // ==========================================
        // تاريخ الانتهاء القديم
        // ==========================================

        const oldEnd =
            Number(
                data.subscriptionEnd
            ) || 0;


        // ==========================================
        // تحديد بداية التجديد
        //
        // إذا كان الاشتراك ساريًا:
        // البداية = تاريخ الانتهاء القديم
        //
        // إذا كان منتهيًا:
        // البداية = الآن
        // ==========================================

        let renewalStart;


        if (oldEnd > now) {

            renewalStart =
                oldEnd;

        } else {

            renewalStart =
                now;
        }


        // ==========================================
        // حساب النهاية الجديدة
        // ==========================================

        const renewalEnd =
            calculateRenewalEnd(
                renewalStart,
                period
            );


        // ==========================================
        // الكتابة فقط إلى بيانات الاشتراك
        //
        // لا ننشئ حسابًا جديدًا
        // ولا نغير UID
        // ولا نغير رقم الحساب
        // ==========================================

        await userRef.update({

            active:
                true,

            subscriptionStart:
                renewalStart,

            subscriptionEnd:
                renewalEnd,

            subscriptionType:
                period,

            subscriptionName:
                periodText

        });


        // ==========================================
        // تحديث البيانات المحلية
        // ==========================================

        currentData =
            data;


        currentData.active =
            true;


        currentData.subscriptionStart =
            renewalStart;


        currentData.subscriptionEnd =
            renewalEnd;


        currentData.subscriptionType =
            period;


        currentData.subscriptionName =
            periodText;


        // ==========================================
        // تحديث الشاشة
        // ==========================================

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
            formatDate(
                renewalStart
            );


        document.getElementById(
            "rEnd"
        ).textContent =
            formatDate(
                renewalEnd
            );


        // ==========================================
        // Dialog النجاح
        // ==========================================

        showSuccessDialog(
            currentAccount,
            periodText,
            formatDate(renewalEnd)
        );

    }


    catch (error) {

        console.log(
            "Renew Error:",
            error
        );


        let errorMessage =
            "تعذر تجديد الاشتراك";


        // ==========================================
        // الحساب محذوف
        // ==========================================

        if (
            error.message &&
            (
                error.message.includes(
                    "الحساب محذوف"
                ) ||
                error.message.includes(
                    "بيانات الحساب غير موجودة"
                )
            )
        ) {

            errorMessage =
                "الحساب محذوف ولا يمكن تجديده";
        }


        // ==========================================
        // صلاحيات Firebase
        // ==========================================

        else if (
            error.code ===
            "PERMISSION_DENIED" ||
            error.code ===
            "PERMISSION_DENIED:"
        ) {

            errorMessage =
                "ليس لديك صلاحية لتجديد هذا الحساب";
        }


        else if (
            error.message &&
            error.message.toLowerCase()
                .includes("permission denied")
        ) {

            errorMessage =
                "ليس لديك صلاحية لتجديد هذا الحساب";
        }


        // ==========================================
        // الشبكة
        // ==========================================

        else if (
            error.code ===
            "NETWORK_ERROR"
        ) {

            errorMessage =
                "تأكد من اتصال الإنترنت";
        }


        showErrorDialog(
            "تعذر التجديد",
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
