const searchBtn = document.getElementById("searchBtn");
const renewBtn = document.getElementById("renewBtn");
const accountInput = document.getElementById("account");
const msg = document.getElementById("msg");
const resultBox = document.getElementById("result");

let currentAccount = null;
let currentUid = null;
let firebaseReady = false;


// ========================================
// حساب Firebase المخصص للموقع
// ========================================

const WEBSITE_EMAIL = "website-reader@bok-ped.com";
const WEBSITE_PASSWORD = "Pedro@123@";


// ========================================
// تسجيل الدخول إلى Firebase
// ========================================

async function loginToFirebase() {

    try {

        setMessage("جاري الاتصال...");

        await auth.signInWithEmailAndPassword(
            WEBSITE_EMAIL,
            WEBSITE_PASSWORD
        );

        firebaseReady = true;

        setMessage("");

        console.log("Firebase authentication successful");

    } catch (error) {

        firebaseReady = false;

        console.error(
            "Firebase authentication error:",
            error
        );

        if (error.code === "auth/invalid-credential") {

            setMessage("بيانات دخول الموقع غير صحيحة");

        } else if (error.code === "auth/invalid-email") {

            setMessage("إيميل حساب الموقع غير صحيح");

        } else if (error.code === "auth/network-request-failed") {

            setMessage("تحقق من اتصال الإنترنت");

        } else {

            setMessage("تعذر الاتصال بـ Firebase");
        }
    }
}


// ========================================
// الرسائل
// ========================================

function setMessage(message) {

    if (msg) {
        msg.textContent = message || "";
    }
}


// ========================================
// تنسيق التاريخ
// ========================================

function formatDate(value) {

    if (
        value === null ||
        value === undefined ||
        value === "" ||
        Number(value) === 0
    ) {
        return "-";
    }

    const date = new Date(Number(value));

    if (isNaN(date.getTime())) {
        return "-";
    }

    return date.toLocaleString("ar", {
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit"
    });
}


// ========================================
// Dialog
// ========================================

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

        dialog = document.getElementById(
            "iosSuccessDialog"
        );

        const successTitle =
            document.getElementById("successTitle");

        const successMessage =
            document.getElementById("successMessage");

        const successAccount =
            document.getElementById("successAccount");

        const successSubscription =
            document.getElementById("successSubscription");

        const successEnd =
            document.getElementById("successEnd");


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

        dialog = document.getElementById(
            "iosErrorDialog"
        );

        const errorTitle =
            document.getElementById("errorTitle");

        const errorMessage =
            document.getElementById("errorMessage");


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


// ========================================
// إغلاق Dialog
// ========================================

function closeDialog(id) {

    const dialog =
        document.getElementById(id);

    if (!dialog) {
        return;
    }

    dialog.classList.remove("show");

    dialog.setAttribute(
        "aria-hidden",
        "true"
    );
}


const successOk =
    document.getElementById("successOk");

const errorOk =
    document.getElementById("errorOk");


if (successOk) {

    successOk.onclick = function() {

        closeDialog(
            "iosSuccessDialog"
        );
    };
}


if (errorOk) {

    errorOk.onclick = function() {

        closeDialog(
            "iosErrorDialog"
        );
    };
}


// ========================================
// البحث عن الحساب
// ========================================

searchBtn.onclick = async function() {

    const number =
        accountInput.value.trim();


    // التأكد من تسجيل الدخول

    if (
        !firebaseReady ||
        !auth.currentUser
    ) {

        setMessage(
            "جاري الاتصال بـ Firebase..."
        );

        await loginToFirebase();


        if (
            !firebaseReady ||
            !auth.currentUser
        ) {

            return;
        }
    }


    // التأكد أن الرقم 7 أرقام

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

        // ====================================
        // قراءة accountNumbers
        // ====================================

        const accountRef =
            database.ref(
                "accountNumbers/" + number
            );


        const accountSnapshot =
            await accountRef.once("value");


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


        currentUid =
            String(accountData.uid);

        currentAccount =
            number;


        // ====================================
        // قراءة users
        // ====================================

        const userRef =
            database.ref(
                "users/" + currentUid
            );


        const userSnapshot =
            await userRef.once("value");


        if (!userSnapshot.exists()) {

            throw new Error(
                "المستخدم غير موجود"
            );
        }


        const user =
            userSnapshot.val() || {};


        // ====================================
        // عرض البيانات
        // ====================================

        document.getElementById(
            "rAccount"
        ).textContent = number;


        document.getElementById(
            "rName"
        ).textContent =
            user.username || "-";


        document.getElementById(
            "rActive"
        ).textContent =
            user.active === true
                ? "مفعل"
                : "غير مفعل";


        document.getElementById(
            "rSub"
        ).textContent =
            user.subscriptionName || "-";


        document.getElementById(
            "rStart"
        ).textContent =
            formatDate(
                user.subscriptionStart
            );


        document.getElementById(
            "rEnd"
        ).textContent =
            formatDate(
                user.subscriptionEnd
            );


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


        if (
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


// ========================================
// البحث بالضغط على Enter
// ========================================

accountInput.addEventListener(
    "keydown",
    function(event) {

        if (event.key === "Enter") {

            event.preventDefault();

            searchBtn.click();
        }
    }
);


// ========================================
// زر التجديد
// ========================================

if (renewBtn) {

    renewBtn.onclick = function() {

        showDialog(
            "error",
            "التجديد",
            "التجديد غير متاح من هذه الصفحة حالياً."
        );
    };
}


// ========================================
// تشغيل تسجيل الدخول تلقائياً
// ========================================

loginToFirebase();
