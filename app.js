// ==================================================
// BOK PEDRO
// البحث عن الحساب + تجديد الاشتراك
// Firebase: BOK-PEDRO-NEW
// ==================================================

"use strict";

// ==================================================
// بيانات حساب الموقع الجديد
// ==================================================

const WEBSITE_EMAIL = "website-reader@bok-ped.com";
const WEBSITE_UID = "gL1GGUJ7FWS4zRZmzdaf60qqHMD3";

// ==================================================
// عناصر الصفحة
// ==================================================

const searchBtn = document.getElementById("searchBtn");
const renewBtn = document.getElementById("renewBtn");
const accountInput = document.getElementById("account");
const msg = document.getElementById("msg");
const resultBox = document.getElementById("result");

// ==================================================
// المتغيرات
// ==================================================

let currentAccount = null;
let currentUid = null;
let currentUserData = null;

let firebaseReady = false;
let loginInProgress = false;
let searchInProgress = false;
let renewInProgress = false;

// ==================================================
// الرسائل
// ==================================================

function setMessage(message) {
    if (msg) {
        msg.textContent = message || "";
    }
}

// ==================================================
// التحقق من حساب الموقع
// ==================================================

function isWebsiteUser(user) {
    return !!(
        user &&
        user.uid === WEBSITE_UID &&
        user.email === WEBSITE_EMAIL
    );
}

// ==================================================
// التأكد من تسجيل الدخول
// ==================================================

async function loginToFirebase() {

    if (loginInProgress) {
        return false;
    }

    loginInProgress = true;

    try {

        const user = auth.currentUser;

        if (!user) {
            firebaseReady = false;

            setMessage(
                "سجّل الدخول أولاً بحساب الموقع في Firebase Authentication."
            );

            return false;
        }

        if (!isWebsiteUser(user)) {

            firebaseReady = false;

            setMessage(
                "الحساب المسجل ليس حساب الموقع المصرح به."
            );

            return false;
        }

        firebaseReady = true;

        return true;

    } catch (error) {

        console.error("Authentication error:", error);

        firebaseReady = false;

        setMessage("تعذر التحقق من تسجيل الدخول.");

        return false;

    } finally {

        loginInProgress = false;
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
        !Number.isFinite(Number(value)) ||
        Number(value) <= 0
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

// ==================================================
// إغلاق النوافذ
// ==================================================

function closeDialog(id) {

    const dialog = document.getElementById(id);

    if (!dialog) {
        return;
    }

    dialog.classList.remove("show");
    dialog.setAttribute("aria-hidden", "true");
}

// ==================================================
// عرض نافذة نجاح أو خطأ
// ==================================================

function showDialog(
    type,
    title,
    message,
    accountNumber,
    subscriptionName,
    endDate
) {

    const success = type === "success";

    const dialog = document.getElementById(
        success ? "iosSuccessDialog" : "iosErrorDialog"
    );

    if (!dialog) {

        alert(
            (title || "تنبيه") +
            "\n\n" +
            (message || "")
        );

        return;
    }

    if (success) {

        const fields = {
            successTitle: title || "تمت العملية",
            successMessage: message || "",
            successAccount: accountNumber || "-",
            successSubscription: subscriptionName || "-",
            successEnd: endDate || "-"
        };

        Object.keys(fields).forEach(function (id) {

            const element = document.getElementById(id);

            if (element) {
                element.textContent = fields[id];
            }
        });

    } else {

        const errorTitle = document.getElementById("errorTitle");
        const errorMessage = document.getElementById("errorMessage");

        if (errorTitle) {
            errorTitle.textContent = title || "تنبيه";
        }

        if (errorMessage) {
            errorMessage.textContent = message || "";
        }
    }

    dialog.classList.add("show");
    dialog.setAttribute("aria-hidden", "false");
}

// ==================================================
// أزرار النوافذ
// ==================================================

const successOk = document.getElementById("successOk");
const errorOk = document.getElementById("errorOk");

if (successOk) {
    successOk.onclick = function () {
        closeDialog("iosSuccessDialog");
    };
}

if (errorOk) {
    errorOk.onclick = function () {
        closeDialog("iosErrorDialog");
    };
}

// ==================================================
// معالجة أخطاء Firebase
// ==================================================

function firebaseErrorMessage(error, defaultMessage) {

    console.error(error);

    const code = error && error.code
        ? String(error.code)
        : "";

    const message = error && error.message
        ? String(error.message)
        : "";

    if (
        code === "PERMISSION_DENIED" ||
        message.toLowerCase().includes("permission_denied") ||
        message.toLowerCase().includes("permission denied")
    ) {
        return "رفضت قواعد Firebase العملية. تحقق من صلاحيات الحساب.";
    }

    if (code === "NETWORK_ERROR" ||
        code === "auth/network-request-failed") {
        return "تحقق من اتصال الإنترنت.";
    }

    if (message) {
        return message;
    }

    return defaultMessage;
}

// ==================================================
// البحث عن حساب
// ==================================================

async function findAccount(number) {

    const accountSnapshot = await database
        .ref("accountNumbers/" + number)
        .once("value");

    if (!accountSnapshot.exists()) {
        throw new Error("رقم الحساب غير موجود.");
    }

    const accountData = accountSnapshot.val();

    if (!accountData || !accountData.uid) {
        throw new Error("الحساب غير مرتبط بمستخدم.");
    }

    const uid = String(accountData.uid);

    const userSnapshot = await database
        .ref("users/" + uid)
        .once("value");

    if (!userSnapshot.exists()) {
        throw new Error("بيانات المستخدم غير موجودة.");
    }

    return {
        uid: uid,
        user: userSnapshot.val() || {}
    };
}

// ==================================================
// عرض بيانات الحساب
// ==================================================

function displayAccount(number, user) {

    const fields = {
        rAccount: number,
        rName: user.username || "-",
        rActive: user.active === true ? "مفعل" : "غير مفعل",
        rSub: user.subscriptionName || "-",
        rStart: formatDate(user.subscriptionStart),
        rEnd: formatDate(user.subscriptionEnd)
    };

    Object.keys(fields).forEach(function (id) {

        const element = document.getElementById(id);

        if (element) {
            element.textContent = fields[id];
        }
    });

    if (resultBox) {
        resultBox.classList.remove("hidden");
    }
}

// ==================================================
// زر البحث
// ==================================================

if (searchBtn) {

    searchBtn.onclick = async function () {

        if (searchInProgress) {
            return;
        }

        const number = accountInput
            ? accountInput.value.trim()
            : "";

        if (!/^[0-9]{7}$/.test(number)) {

            setMessage("أدخل رقم حساب مكونًا من 7 أرقام.");

            if (resultBox) {
                resultBox.classList.add("hidden");
            }

            currentAccount = null;
            currentUid = null;
            currentUserData = null;

            return;
        }

        searchInProgress = true;

        searchBtn.disabled = true;
        searchBtn.textContent = "جاري البحث...";

        try {

            const loggedIn = await loginToFirebase();

            if (!loggedIn) {
                return;
            }

            setMessage("");

            if (resultBox) {
                resultBox.classList.add("hidden");
            }

            currentAccount = null;
            currentUid = null;
            currentUserData = null;

            const result = await findAccount(number);

            currentAccount = number;
            currentUid = result.uid;
            currentUserData = result.user;

            displayAccount(number, result.user);

            setMessage("تم العثور على الحساب بنجاح.");

        } catch (error) {

            currentAccount = null;
            currentUid = null;
            currentUserData = null;

            if (resultBox) {
                resultBox.classList.add("hidden");
            }

            setMessage(
                firebaseErrorMessage(
                    error,
                    "حدث خطأ أثناء البحث عن الحساب."
                )
            );

        } finally {

            searchInProgress = false;

            searchBtn.disabled = false;
            searchBtn.textContent = "بحث";
        }
    };
}

// ==================================================
// البحث عند الضغط على Enter
// ==================================================

if (accountInput) {

    accountInput.addEventListener("keydown", function (event) {

        if (event.key === "Enter") {

            event.preventDefault();

            if (searchBtn) {
                searchBtn.click();
            }
        }
    });

    accountInput.addEventListener("input", function () {

        this.value = this.value
            .replace(/[^0-9]/g, "")
            .slice(0, 7);
    });
}

// ==================================================
// مدد الاشتراك
// ==================================================

const subscriptionPeriods = {

    "1": {
        days: 1,
        name: "يوم واحد",
        type: "1"
    },

    "7": {
        days: 7,
        name: "7 أيام",
        type: "7"
    },

    "30": {
        days: 30,
        name: "30 يوم",
        type: "30"
    },

    "90": {
        days: 90,
        name: "90 يوم",
        type: "90"
    },

    "365": {
        days: 365,
        name: "12 شهر",
        type: "365"
    }
};

// ==================================================
// تحديث واجهة الاشتراك
// ==================================================

function updateSubscriptionDisplay(
    accountNumber,
    user,
    startTime,
    endTime,
    subscriptionName
) {

    user.subscriptionStart = startTime;
    user.subscriptionEnd = endTime;
    user.subscriptionName = subscriptionName;
    user.active = true;

    displayAccount(accountNumber, user);
}

// ==================================================
// زر تجديد الاشتراك
// ==================================================

if (renewBtn) {

    renewBtn.onclick = async function () {

        if (renewInProgress) {
            return;
        }

        if (!currentAccount || !currentUid) {

            showDialog(
                "error",
                "تنبيه",
                "ابحث عن الحساب أولاً."
            );

            return;
        }

        renewInProgress = true;

        renewBtn.disabled = true;

        const oldText = renewBtn.textContent;

        renewBtn.textContent = "جاري التجديد...";

        try {

            const loggedIn = await loginToFirebase();

            if (!loggedIn) {

                throw new Error(
                    "سجّل الدخول بحساب الموقع المصرح به أولاً."
                );
            }

            const periodElement = document.getElementById("period");

            const period = periodElement
                ? periodElement.value
                : "1";

            const selected = subscriptionPeriods[period];

            if (!selected) {
                throw new Error("مدة الاشتراك غير صحيحة.");
            }

            // إعادة قراءة بيانات الحساب قبل التجديد
            const userRef = database.ref("users/" + currentUid);

            const snapshot = await userRef.once("value");

            if (!snapshot.exists()) {
                throw new Error("بيانات المستخدم غير موجودة.");
            }

            const user = snapshot.val() || {};

            const now = Date.now();

            const oldEnd = Number(user.subscriptionEnd || 0);

            // إذا كان الاشتراك فعالاً، تُضاف المدة بعد نهايته.
            // وإذا انتهى، يبدأ الاشتراك من الوقت الحالي.
            const startTime = oldEnd > now ? oldEnd : now;

            const duration =
                selected.days * 24 * 60 * 60 * 1000;

            const newEnd = startTime + duration;

            if (!Number.isFinite(newEnd)) {
                throw new Error("تعذر حساب نهاية الاشتراك.");
            }

            // تحديث بيانات الاشتراك
            await userRef.update({

                subscriptionStart: startTime,
                subscriptionEnd: newEnd,
                subscriptionName: selected.name,
                subscriptionType: selected.type,
                active: true

            });

            // تحديث بيانات الشاشة
            updateSubscriptionDisplay(
                currentAccount,
                user,
                startTime,
                newEnd,
                selected.name
            );

            currentUserData = user;

            showDialog(
                "success",
                "تم التجديد",
                "تم تجديد الاشتراك بنجاح.",
                currentAccount,
                selected.name,
                formatDate(newEnd)
            );

            setMessage("تم تجديد الاشتراك بنجاح.");

        } catch (error) {

            showDialog(
                "error",
                "تعذر التجديد",
                firebaseErrorMessage(
                    error,
                    "تعذر تجديد الاشتراك."
                )
            );

        } finally {

            renewInProgress = false;

            renewBtn.disabled = false;
            renewBtn.textContent = oldText;
        }
    };
}

// ==================================================
// مراقبة تسجيل الدخول
// ==================================================

auth.onAuthStateChanged(function (user) {

    firebaseReady = isWebsiteUser(user);

    if (firebaseReady) {

        setMessage("");

    } else if (user) {

        setMessage(
            "الحساب المسجل لا يطابق حساب الموقع المصرح به."
        );

    } else {

        setMessage(
            "يرجى تسجيل الدخول بحساب الموقع قبل البحث."
        );
    }
});

// ==================================================
// نهاية app.js
// ==================================================
