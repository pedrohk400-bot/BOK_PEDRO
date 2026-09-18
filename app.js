const searchBtn = document.getElementById("searchBtn");
const renewBtn = document.getElementById("renewBtn");
const accountInput = document.getElementById("account");
const msg = document.getElementById("msg");
const resultBox = document.getElementById("result");

let currentAccount = null;
let currentUid = null;
let firebaseReady = false;


// ==================================================
// حساب القراءة الخاص بالموقع
// ==================================================

const WEBSITE_EMAIL = "website-reader@bok-ped.com";

// ضع كلمة مرور حساب website-reader هنا
const WEBSITE_PASSWORD = "Pedro@123@";


// ==================================================
// عرض رسالة
// ==================================================

function setMessage(message) {

    if (msg) {
        msg.textContent = message || "";
    }
}


// ==================================================
// تسجيل الدخول إلى Firebase تلقائيًا
// ==================================================

async function loginToFirebase() {

    try {

        setMessage("جاري الاتصال بـ Firebase...");

        /*
         * إذا كان المستخدم مسجل الدخول بالفعل
         * لا نعيد تسجيل الدخول
         */

        if (auth.currentUser) {

            firebaseReady = true;

            console.log(
                "Firebase already logged in"
            );

            console.log(
                "UID:",
                auth.currentUser.uid
            );

            setMessage("");

            return true;
        }


        /*
         * تسجيل الدخول بحساب الموقع
         */

        const result =
            await auth.signInWithEmailAndPassword(
                WEBSITE_EMAIL,
                WEBSITE_PASSWORD
            );


        firebaseReady = true;


        console.log(
            "Firebase Login OK"
        );

        console.log(
            "UID:",
            result.user.uid
        );


        /*
         * التأكد من أن UID هو الحساب الصحيح
         */

        if (
            result.user.uid !==
            "zuwXPgS4TPYF5GyAYEPEOrsYV0z1"
        ) {

            console.error(
                "Wrong website account UID:",
                result.user.uid
            );

            firebaseReady = false;

            await auth.signOut();

            setMessage(
                "حساب الموقع غير صحيح"
            );

            return false;
        }


        setMessage("");

        return true;


    } catch (error) {

        firebaseReady = false;


        console.error(
            "Firebase Login Error:",
            error
        );

        console.error(
            "Firebase Error Code:",
            error.code
        );

        console.error(
            "Firebase Error Message:",
            error.message
        );


        /*
         * أخطاء تسجيل الدخول
         */

        if (
            error.code ===
            "auth/invalid-credential"
        ) {

            setMessage(
                "إيميل أو كلمة مرور حساب الموقع غير صحيحة"
            );

        } else if (
            error.code ===
            "auth/wrong-password"
        ) {

            setMessage(
                "كلمة مرور حساب الموقع غير صحيحة"
            );

        } else if (
            error.code ===
            "auth/user-not-found"
        ) {

            setMessage(
                "حساب الموقع غير موجود"
            );

        } else if (
            error.code ===
            "auth/invalid-email"
        ) {

            setMessage(
                "إيميل حساب الموقع غير صحيح"
            );

        } else if (
            error.code ===
            "auth/operation-not-allowed"
        ) {

            setMessage(
                "Email/Password غير مفعّل في Firebase"
            );

        } else if (
            error.code ===
            "auth/network-request-failed"
        ) {

            setMessage(
                "مشكلة في اتصال الإنترنت"
            );

        } else {

            setMessage(
                "خطأ Firebase: " +
                (
                    error.code ||
                    error.message ||
                    "خطأ غير معروف"
                )
            );
        }


        return false;
    }
}


// ==================================================
// تنسيق التاريخ
// ==================================================

function formatDate(value) {

    if (
        value === null ||
        value === undefined ||
        value === "" ||
        Number(value) === 0
    ) {

        return "-";
    }


    const date =
        new Date(Number(value));


    if (isNaN(date.getTime())) {

        return "-";
    }


    return date.toLocaleString(
        "ar",
        {
            year: "numeric",
            month: "numeric",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit"
        }
    );
}


// ==================================================
// Dialog
// ==================================================

function showDialog(
    type,
    title,
    message,
    accountNumber,
    subscriptionName,
    endDate
) {

    let dialog;


    if (type === "success") {

        dialog =
            document.getElementById(
                "iosSuccessDialog"
            );


        const successTitle =
            document.getElementById(
                "successTitle"
            );

        const successMessage =
            document.getElementById(
                "successMessage"
            );

        const successAccount =
            document.getElementById(
                "successAccount"
            );

        const successSubscription =
            document.getElementById(
                "successSubscription"
            );

        const successEnd =
            document.getElementById(
                "successEnd"
            );


        if (successTitle) {

            successTitle.textContent =
                title || "تمت العملية";
        }


        if (successMessage) {

            successMessage.textContent =
                message || "";
        }


        if (successAccount) {

            successAccount.textContent =
                accountNumber || "-";
        }


        if (successSubscription) {

            successSubscription.textContent =
                subscriptionName || "-";
        }


        if (successEnd) {

            successEnd.textContent =
                endDate || "-";
        }


    } else {

        dialog =
            document.getElementById(
                "iosErrorDialog"
            );


        const errorTitle =
            document.getElementById(
                "errorTitle"
            );

        const errorMessage =
            document.getElementById(
                "errorMessage"
            );


        if (errorTitle) {

            errorTitle.textContent =
                title || "تنبيه";
        }


        if (errorMessage) {

            errorMessage.textContent =
                message || "";
        }
    }


    if (!dialog) {

        alert(
            (title || "تنبيه") +
            "\n\n" +
            (message || "")
        );

        return;
    }


    dialog.classList.add("show");

    dialog.setAttribute(
        "aria-hidden",
        "false"
    );
}


// ==================================================
// إغلاق Dialog
// ==================================================

function closeDialog(id) {

    const dialog =
        document.getElementById(id);


    if (!dialog) {

        return;
    }


    dialog.classList.remove(
        "show"
    );


    dialog.setAttribute(
        "aria-hidden",
        "true"
    );
}


// ==================================================
// أزرار Dialog
// ==================================================

const successOk =
    document.getElementById(
        "successOk"
    );

const errorOk =
    document.getElementById(
        "errorOk"
    );


if (successOk) {

    successOk.onclick =
        function() {

            closeDialog(
                "iosSuccessDialog"
            );
        };
}


if (errorOk) {

    errorOk.onclick =
        function() {

            closeDialog(
                "iosErrorDialog"
            );
        };
}


// ==================================================
// البحث عن الحساب
// ==================================================

searchBtn.onclick =
    async function() {


        const number =
            accountInput.value.trim();


        // ------------------------------------------
        // التحقق من رقم الحساب
        // ------------------------------------------

        if (!/^[0-9]{7}$/.test(number)) {

            setMessage(
                "أدخل رقم حساب مكون من 7 أرقام"
            );


            resultBox.classList.add(
                "hidden"
            );


            currentAccount = null;
            currentUid = null;


            return;
        }


        // ------------------------------------------
        // تسجيل الدخول
        // ------------------------------------------

        if (
            !firebaseReady ||
            !auth.currentUser
        ) {

            searchBtn.disabled = true;

            searchBtn.textContent =
                "جاري الاتصال...";


            const loggedIn =
                await loginToFirebase();


            if (!loggedIn) {

                searchBtn.disabled = false;

                searchBtn.textContent =
                    "بحث";

                return;
            }
        }


        // ------------------------------------------
        // بدء البحث
        // ------------------------------------------

        searchBtn.disabled = true;

        searchBtn.textContent =
            "جاري البحث...";


        setMessage("");


        resultBox.classList.add(
            "hidden"
        );


        currentAccount = null;
        currentUid = null;


        try {


            // ======================================
            // قراءة رقم الحساب
            // ======================================

            const accountRef =
                database.ref(
                    "accountNumbers/" +
                    number
                );


            const accountSnapshot =
                await accountRef.once(
                    "value"
                );


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


            currentAccount =
                number;


            currentUid =
                String(
                    accountData.uid
                );


            console.log(
                "Account UID:",
                currentUid
            );


            // ======================================
            // قراءة بيانات المستخدم
            // ======================================

            const userRef =
                database.ref(
                    "users/" +
                    currentUid
                );


            const userSnapshot =
                await userRef.once(
                    "value"
                );


            if (!userSnapshot.exists()) {

                throw new Error(
                    "المستخدم غير موجود"
                );
            }


            const user =
                userSnapshot.val() || {};


            console.log(
                "User data:",
                user
            );


            // ======================================
            // عرض رقم الحساب
            // ======================================

            const rAccount =
                document.getElementById(
                    "rAccount"
                );


            if (rAccount) {

                rAccount.textContent =
                    number;
            }


            // ======================================
            // عرض الاسم
            // ======================================

            const rName =
                document.getElementById(
                    "rName"
                );


            if (rName) {

                rName.textContent =
                    user.username || "-";
            }


            // ======================================
            // عرض الحالة
            // ======================================

            const rActive =
                document.getElementById(
                    "rActive"
                );


            if (rActive) {

                rActive.textContent =
                    user.active === true
                        ? "مفعل"
                        : "غير مفعل";
            }


            // ======================================
            // عرض الاشتراك
            // ======================================

            const rSub =
                document.getElementById(
                    "rSub"
                );


            if (rSub) {

                rSub.textContent =
                    user.subscriptionName ||
                    "-";
            }


            // ======================================
            // تاريخ البداية
            // ======================================

            const rStart =
                document.getElementById(
                    "rStart"
                );


            if (rStart) {

                rStart.textContent =
                    formatDate(
                        user.subscriptionStart
                    );
            }


            // ======================================
            // تاريخ النهاية
            // ======================================

            const rEnd =
                document.getElementById(
                    "rEnd"
                );


            if (rEnd) {

                rEnd.textContent =
                    formatDate(
                        user.subscriptionEnd
                    );
            }


            // ======================================
            // إظهار النتيجة
            // ======================================

            resultBox.classList.remove(
                "hidden"
            );


            setMessage(
                "تم العثور على الحساب"
            );


        } catch (error) {


            console.error(
                "Firebase search error:",
                error
            );


            currentAccount = null;
            currentUid = null;


            resultBox.classList.add(
                "hidden"
            );


            // --------------------------------------
            // صلاحية القراءة
            // --------------------------------------

            if (
                error &&
                error.code ===
                "PERMISSION_DENIED"
            ) {

                setMessage(
                    "Firebase رفض قراءة البيانات"
                );


            } else if (
                error &&
                error.message &&
                error.message
                    .toLowerCase()
                    .includes("permission")
            ) {

                setMessage(
                    "Firebase رفض قراءة البيانات"
                );


            } else {

                setMessage(
                    error.message ||
                    "حدث خطأ أثناء البحث"
                );
            }


        } finally {


            searchBtn.disabled = false;

            searchBtn.textContent =
                "بحث";
        }
    };


// ==================================================
// البحث بالضغط على Enter
// ==================================================

accountInput.addEventListener(
    "keydown",
    function(event) {

        if (event.key === "Enter") {

            event.preventDefault();

            searchBtn.click();
        }
    }
);


// ==================================================
// السماح بالأرقام فقط
// ==================================================

accountInput.addEventListener(
    "input",
    function() {

        this.value =
            this.value
                .replace(/[^0-9]/g, "")
                .slice(0, 7);
    }
);


// ==================================================
// زر التجديد
// ==================================================

if (renewBtn) {

    renewBtn.onclick =
        function() {

            showDialog(
                "error",
                "التجديد",
                "التجديد غير متاح من هذه الصفحة حالياً."
            );
        };
}


// ==================================================
// مراقبة حالة Firebase Authentication
// ==================================================

auth.onAuthStateChanged(
    function(user) {

        if (user) {

            console.log(
                "Firebase Auth User:",
                user.email
            );

            console.log(
                "Firebase Auth UID:",
                user.uid
            );


            if (
                user.uid ===
                "zuwXPgS4TPYF5GyAYEPEOrsYV0z1"
            ) {

                firebaseReady = true;

                setMessage("");

            } else {

                firebaseReady = false;

                console.error(
                    "Unexpected Firebase user UID:",
                    user.uid
                );
            }

        } else {

            firebaseReady = false;

            console.log(
                "No Firebase user logged in"
            );
        }
    }
);


// ==================================================
// تسجيل الدخول تلقائيًا عند فتح الموقع
// ==================================================

loginToFirebase();
