"use strict";

// ================================================
// BOK-PED | Firebase: bok-pedro-new
// ================================================

const WEBSITE_EMAIL = "website-reader@bok-ped.com";
const WEBSITE_UID = "gL1GGUJ7FWS4zRZmzdaf60qqHMD3";

// ================================================
// عناصر الصفحة
// ================================================

const searchBtn = document.getElementById("searchBtn");
const renewBtn = document.getElementById("renewBtn");
const accountInput = document.getElementById("account");
const msg = document.getElementById("msg");
const resultBox = document.getElementById("result");

let currentAccount = null;
let currentUid = null;
let currentUserData = null;

let searchInProgress = false;
let renewInProgress = false;
let websiteAuthenticated = false;

// ================================================
// الرسائل
// ================================================

function setMessage(message) {
    if (msg) {
        msg.textContent = message || "";
    }
}

// ================================================
// التحقق من حساب الإدارة
// ================================================

function isWebsiteUser(user) {
    return !!(
        user &&
        user.uid === WEBSITE_UID &&
        user.email === WEBSITE_EMAIL
    );
}

async function checkWebsiteLogin() {
    const user = auth.currentUser;

    if (!user) {
        websiteAuthenticated = false;
        setMessage("يرجى تسجيل الدخول بحساب الموقع أولاً.");
        return false;
    }

    if (!isWebsiteUser(user)) {
        websiteAuthenticated = false;
        setMessage("الحساب الحالي غير مصرح له بإدارة الاشتراكات.");
        return false;
    }

    websiteAuthenticated = true;
    return true;
}

// ================================================
// التاريخ
// ================================================

function formatDate(value) {
    const number = Number(value);

    if (!Number.isFinite(number) || number <= 0) {
        return "-";
    }

    const date = new Date(number);

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

// ================================================
// النوافذ
// ================================================

function closeDialog(id) {
    const dialog = document.getElementById(id);

    if (dialog) {
        dialog.classList.remove("show");
        dialog.setAttribute("aria-hidden", "true");
    }
}

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
        alert((title || "تنبيه") + "\n\n" + (message || ""));
        return;
    }

    if (success) {
        const values = {
            successTitle: title || "تمت العملية",
            successMessage: message || "",
            successAccount: accountNumber || "-",
            successSubscription: subscriptionName || "-",
            successEnd: endDate || "-"
        };

        Object.keys(values).forEach(function (id) {
            const element = document.getElementById(id);

            if (element) {
                element.textContent = values[id];
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

// ================================================
// معالجة أخطاء Firebase
// ================================================

function firebaseErrorMessage(error, fallback) {
    console.error("Firebase error:", error);

    const code = error && error.code
        ? String(error.code)
        : "";

    if (
        code === "PERMISSION_DENIED" ||
        code === "database/permission-denied"
    ) {
        return "رفضت قواعد Firebase العملية. راجع صلاحيات حساب الإدارة.";
    }

    if (
        code === "auth/network-request-failed" ||
        code === "database/network-error"
    ) {
        return "تعذر الاتصال. تحقق من الإنترنت.";
    }

    if (
        code === "auth/user-not-found" ||
        code === "auth/wrong-password" ||
        code === "auth/invalid-credential"
    ) {
        return "تعذر التحقق من بيانات تسجيل الدخول.";
    }

    return fallback || "حدث خطأ غير متوقع.";
}

// ================================================
// البحث عن الحساب
// ================================================

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

// ================================================
// عرض بيانات الحساب
// ================================================

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

// ================================================
// مسح نتيجة البحث
// ================================================

function clearCurrentAccount() {
    currentAccount = null;
    currentUid = null;
    currentUserData = null;

    if (resultBox) {
        resultBox.classList.add("hidden");
    }
}

// ================================================
// زر البحث
// ================================================

if (searchBtn) {
    searchBtn.onclick = async function () {
        if (searchInProgress) {
            return;
        }

        const number = accountInput
            ? accountInput.value.trim()
            : "";

        if (!/^[0-9]{7}$/.test(number)) {
            clearCurrentAccount();
            setMessage("أدخل رقم حساب مكوّنًا من 7 أرقام.");
            return;
        }

        searchInProgress = true;
        searchBtn.disabled = true;
        searchBtn.textContent = "جاري البحث...";

        try {
            const loggedIn = await checkWebsiteLogin();

            if (!loggedIn) {
                clearCurrentAccount();
                return;
            }

            setMessage("");
            clearCurrentAccount();

            const result = await findAccount(number);

            currentAccount = number;
            currentUid = result.uid;
            currentUserData = result.user;

            displayAccount(number, result.user);

            setMessage("تم العثور على الحساب بنجاح.");
        } catch (error) {
            clearCurrentAccount();

            setMessage(
                firebaseErrorMessage(
                    error,
                    error.message || "حدث خطأ أثناء البحث."
                )
            );
        } finally {
            searchInProgress = false;
            searchBtn.disabled = false;
            searchBtn.textContent = "بحث";
        }
    };
}

// ================================================
// إدخال رقم الحساب
// ================================================

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

// ================================================
// مدد الاشتراك
// ================================================

const subscriptionPeriods = {
    "1": {
        days: 1,
        name: "يوم واحد",
        type: "day"
    },
    "7": {
        days: 7,
        name: "7 أيام",
        type: "week"
    },
    "30": {
        days: 30,
        name: "30 يوم",
        type: "month"
    },
    "90": {
        days: 90,
        name: "90 يوم",
        type: "3months"
    },
    "365": {
        days: 365,
        name: "12 شهر",
        type: "12months"
    }
};

// ================================================
// تجديد الاشتراك
// ================================================

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
            const loggedIn = await checkWebsiteLogin();

            if (!loggedIn) {
                throw new Error(
                    "يجب تسجيل الدخول بحساب الإدارة المصرح به."
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

            // قراءة أحدث بيانات المستخدم
            const userRef = database.ref("users/" + currentUid);
            const snapshot = await userRef.once("value");

            if (!snapshot.exists()) {
                throw new Error("بيانات المستخدم غير موجودة.");
            }

            const user = snapshot.val() || {};

            const now = Date.now();
            const oldEnd = Number(user.subscriptionEnd || 0);

            // تمديد الاشتراك من تاريخ نهايته إذا كان ما زال فعالاً
            const startTime = oldEnd > now ? oldEnd : now;

            const duration =
                selected.days * 24 * 60 * 60 * 1000;

            const newEnd = startTime + duration;

            if (!Number.isFinite(newEnd)) {
                throw new Error("تعذر حساب تاريخ نهاية الاشتراك.");
            }

            // كتابة بيانات الاشتراك
            await userRef.update({
                subscriptionStart: startTime,
                subscriptionEnd: newEnd,
                subscriptionName: selected.name,
                subscriptionType: selected.type,
                active: true,
                updatedAt: now
            });

            user.subscriptionStart = startTime;
            user.subscriptionEnd = newEnd;
            user.subscriptionName = selected.name;
            user.subscriptionType = selected.type;
            user.active = true;
            user.updatedAt = now;

            currentUserData = user;

            displayAccount(currentAccount, user);

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
                    error.message || "تعذر تجديد الاشتراك."
                )
            );
        } finally {
            renewInProgress = false;
            renewBtn.disabled = false;
            renewBtn.textContent = oldText;
        }
    };
}

// ================================================
// مراقبة تسجيل الدخول
// ================================================

auth.onAuthStateChanged(function (user) {
    websiteAuthenticated = isWebsiteUser(user);

    if (websiteAuthenticated) {
        setMessage("تم التحقق من حساب الإدارة.");
    } else {
        clearCurrentAccount();

        setMessage(
            user
                ? "الحساب المسجل غير مصرح له بإدارة الاشتراكات."
                : "يرجى تسجيل الدخول بحساب الموقع قبل البحث."
        );
    }
});
