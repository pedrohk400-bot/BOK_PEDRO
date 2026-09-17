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


/* =========================================
   تسجيل الدخول
========================================= */

if (loginBtn) {

    loginBtn.onclick = function () {

        const emailElement =
            document.getElementById("email");

        const passwordElement =
            document.getElementById("password");

        const loginMsg =
            document.getElementById("loginMsg");

        const email =
            emailElement.value.trim();

        const password =
            passwordElement.value;


        if (!email || !password) {

            loginMsg.textContent =
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

        .then(function () {

            loginMsg.textContent = "";

        })

        .catch(function (error) {

            console.log(
                "LOGIN ERROR:",
                error
            );

            loginMsg.textContent =
                "بيانات الدخول غير صحيحة";

        })

        .finally(function () {

            loginBtn.disabled = false;

            loginBtn.textContent =
                "دخول";

        });

    };

}


/* =========================================
   حالة تسجيل الدخول
========================================= */

auth.onAuthStateChanged(function (user) {

    if (user) {

        console.log(
            "تم تسجيل الدخول:",
            user.email
        );

        if (loginBox) {
            loginBox.classList.add("hidden");
        }

        if (appBox) {
            appBox.classList.remove("hidden");
        }

    } else {

        if (loginBox) {
            loginBox.classList.remove("hidden");
        }

        if (appBox) {
            appBox.classList.add("hidden");
        }

        uid = null;
        account = null;
        data = null;
    }

});


/* =========================================
   البحث عن الحساب
========================================= */

if (searchBtn) {

    searchBtn.onclick = function () {

        const accountElement =
            document.getElementById("account");

        const msg =
            document.getElementById("msg");


        if (!accountElement) {

            alert(
                "حقل رقم الحساب غير موجود"
            );

            return;
        }


        const number =
            accountElement.value.trim();


        if (!/^[0-9]{7}$/.test(number)) {

            msg.textContent =
                "أدخل رقم حساب مكون من 7 أرقام";

            return;
        }


        searchBtn.disabled = true;

        searchBtn.textContent =
            "جاري البحث...";

        msg.textContent = "";


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

        .then(function (userSnapshot) {

            if (!userSnapshot.exists()) {

                throw new Error(
                    "الحساب محذوف ولا يمكن تجديده"
                );
            }


            data =
                userSnapshot.val();


            const rAccount =
                document.getElementById(
                    "rAccount"
                );

            const rName =
                document.getElementById(
                    "rName"
                );

            const rActive =
                document.getElementById(
                    "rActive"
                );

            const rSub =
                document.getElementById(
                    "rSub"
                );

            const rStart =
                document.getElementById(
                    "rStart"
                );

            const rEnd =
                document.getElementById(
                    "rEnd"
                );

            const result =
                document.getElementById(
                    "result"
                );


            if (rAccount) {

                rAccount.textContent =
                    account;

            }


            if (rName) {

                rName.textContent =
                    data.username || "-";

            }


            if (rActive) {

                rActive.textContent =
                    data.active
                        ? "مفعل"
                        : "غير مفعل";

            }


            if (rSub) {

                rSub.textContent =
                    data.subscriptionName || "-";

            }


            if (rStart) {

                rStart.textContent =
                    formatDate(
                        data.subscriptionStart
                    );

            }


            if (rEnd) {

                rEnd.textContent =
                    formatDate(
                        data.subscriptionEnd
                    );

            }


            if (result) {

                result.classList.remove(
                    "hidden"
                );

            }


            msg.textContent =
                "تم العثور على الحساب";

        })

        .catch(function (error) {

            console.log(
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

}


/* =========================================
   زر التجديد
========================================= */

if (renewBtn) {

    renewBtn.onclick = function () {

        renewSubscription();

    };

} else {

    console.error(
        "renewBtn غير موجود"
    );

}


/* =========================================
   تجديد الاشتراك
========================================= */

async function renewSubscription() {

    console.log(
        "تم الضغط على زر التجديد"
    );


    /* ---------------------------------------
       التأكد من الحساب
    --------------------------------------- */

    if (!uid) {

        showErrorDialog(
            "تنبيه",
            "ابحث عن الحساب أولاً"
        );

        return;
    }


    /* ---------------------------------------
       التأكد من تسجيل الدخول
    --------------------------------------- */

    if (!auth.currentUser) {

        showErrorDialog(
            "خطأ",
            "يجب تسجيل الدخول أولاً"
        );

        return;
    }


    /* ---------------------------------------
       الحصول على القائمة
    --------------------------------------- */

    const period =
        document.getElementById(
            "period"
        );


    if (!period) {

        showErrorDialog(
            "خطأ",
            "قائمة الاشتراك غير موجودة"
        );

        return;
    }


    /* ---------------------------------------
       الخيار المختار
    --------------------------------------- */

    const selectedOption =
        period.options[
            period.selectedIndex
        ];


    if (!selectedOption) {

        showErrorDialog(
            "خطأ",
            "اختر مدة الاشتراك"
        );

        return;
    }


    /*
       نأخذ النص الظاهر في القائمة
       وليس value
    */

    const selectedText =
        selectedOption.textContent
        .trim();


    console.log(
        "المدة المختارة:",
        selectedText
    );


    let type = "";
    let name = "";


    /* =====================================
       تحديد المدة
    ===================================== */

    if (
        selectedText.includes(
            "يوم"
        )
    ) {

        type = "day";

        name = "يوم واحد";

    }

    else if (
        selectedText.includes(
            "أسبوع"
        )
        ||
        selectedText.includes(
            "اسبوع"
        )
    ) {

        type = "week";

        name = "أسبوع واحد";

    }

    else if (
        selectedText.includes(
            "12"
        )
        &&
        selectedText.includes(
            "شهر"
        )
    ) {

        type = "12months";

        name = "12 شهر";

    }

    else if (
        selectedText.includes(
            "3"
        )
        &&
        selectedText.includes(
            "شهر"
        )
    ) {

        type = "3months";

        name = "3 شهور";

    }

    else if (
        selectedText.includes(
            "شهر"
        )
    ) {

        type = "month";

        name = "شهر واحد";

    }

    else {

        showErrorDialog(
            "خطأ",
            "مدة الاشتراك غير صحيحة\n\n" +
            "القيمة المختارة: " +
            selectedText
        );

        return;
    }


    /* =====================================
       تعطيل الزر
    ===================================== */

    renewBtn.disabled = true;

    renewBtn.textContent =
        "جاري التجديد...";


    try {

        /* -----------------------------------
           مرجع المستخدم
        ----------------------------------- */

        const userRef =
            db.ref(
                "users/" + uid
            );


        /* -----------------------------------
           قراءة بيانات المستخدم
        ----------------------------------- */

        const snapshot =
            await userRef.once(
                "value"
            );


        /* -----------------------------------
           الحساب محذوف
        ----------------------------------- */

        if (!snapshot.exists()) {

            showErrorDialog(
                "الحساب محذوف",
                "هذا الحساب محذوف ولا يمكن تجديده"
            );

            return;
        }


        const user =
            snapshot.val();


        /* -----------------------------------
           الوقت الحالي
        ----------------------------------- */

        const now =
            Date.now();


        /* -----------------------------------
           نهاية الاشتراك القديم
        ----------------------------------- */

        const oldEnd =
            Number(
                user.subscriptionEnd
            ) || 0;


        /* -----------------------------------
           تحديد بداية التجديد
        ----------------------------------- */

        let start;


        if (oldEnd > now) {

            /*
               الاشتراك ما زال ساريًا
               نكمل من النهاية القديمة
            */

            start = oldEnd;

        } else {

            /*
               الاشتراك منتهي
               نبدأ من الوقت الحالي
            */

            start = now;

        }


        /* -----------------------------------
           إنشاء تاريخ البداية
        ----------------------------------- */

        const endDate =
            new Date(start);


        /* =====================================
           حساب تاريخ النهاية
        ===================================== */

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


        /* -----------------------------------
           Timestamp النهاية
        ----------------------------------- */

        const end =
            endDate.getTime();


        console.log(
            "======================"
        );

        console.log(
            "الحساب:",
            account
        );

        console.log(
            "UID:",
            uid
        );

        console.log(
            "المدة:",
            name
        );

        console.log(
            "النوع:",
            type
        );

        console.log(
            "البداية:",
            start
        );

        console.log(
            "النهاية:",
            end
        );

        console.log(
            "======================"
        );


        /* =====================================
           تحديث Firebase
        ===================================== */

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


        /* =====================================
           تحديث البيانات المحلية
        ===================================== */

        if (!data) {

            data = {};

        }


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


        /* =====================================
           تحديث الشاشة
        ===================================== */

        const rActive =
            document.getElementById(
                "rActive"
            );

        const rSub =
            document.getElementById(
                "rSub"
            );

        const rStart =
            document.getElementById(
                "rStart"
            );

        const rEnd =
            document.getElementById(
                "rEnd"
            );


        if (rActive) {

            rActive.textContent =
                "مفعل";

        }


        if (rSub) {

            rSub.textContent =
                name;

        }


        if (rStart) {

            rStart.textContent =
                formatDate(start);

        }


        if (rEnd) {

            rEnd.textContent =
                formatDate(end);

        }


        /* =====================================
           رسالة النجاح
        ===================================== */

        showSuccessDialog(
            account,
            name,
            formatDate(end)
        );

    }

    catch (error) {

        console.error(
            "RENEW ERROR:",
            error
        );


        const errorMessage =
            String(
                error.message || ""
            ).toLowerCase();


        /* =====================================
           خطأ الصلاحيات
        ===================================== */

        if (
            error.code ===
            "PERMISSION_DENIED"
            ||
            errorMessage.includes(
                "permission denied"
            )
        ) {

            showErrorDialog(
                "خطأ في الصلاحيات",
                "ليس لديك صلاحية لتجديد هذا الحساب"
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


/* =========================================
   تنسيق التاريخ
========================================= */

function formatDate(timestamp) {

    if (
        timestamp === null ||
        timestamp === undefined ||
        timestamp === ""
    ) {

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


/* =========================================
   رسالة نجاح
========================================= */

function showSuccessDialog(
    accountNumber,
    periodName,
    endDate
) {

    alert(

        "تم تجديد الاشتراك بنجاح" +

        "\n\n" +

        "رقم الحساب: " +
        accountNumber +

        "\n\n" +

        "المدة: " +
        periodName +

        "\n\n" +

        "ينتهي في: " +
        endDate

    );

}


/* =========================================
   رسالة خطأ
========================================= */

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
