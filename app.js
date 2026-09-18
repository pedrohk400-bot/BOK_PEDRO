// ==================================================
// BOK-PED
// البحث عن الحساب + تجديد الاشتراك
// ==================================================

const searchBtn =
    document.getElementById("searchBtn");

const renewBtn =
    document.getElementById("renewBtn");

const accountInput =
    document.getElementById("account");

const msg =
    document.getElementById("msg");

const resultBox =
    document.getElementById("result");


// ==================================================
// المتغيرات الحالية
// ==================================================

let currentAccount = null;
let currentUid = null;
let firebaseReady = false;


// ==================================================
// حساب Firebase الخاص بالموقع
// ==================================================

const WEBSITE_EMAIL =
    "website-reader@bok-ped.com";

const WEBSITE_PASSWORD =
    "ضع_كلمة_مرور_حساب_الموقع_هنا";


// UID الخاص بحساب الموقع
const WEBSITE_UID =
    "zuwXPgS4TPYF5GyAYEPEOrsYV0z1";


// ==================================================
// عرض الرسالة
// ==================================================

function setMessage(message) {

    if (msg) {
        msg.textContent =
            message || "";
    }
}


// ==================================================
// تسجيل الدخول إلى Firebase
// ==================================================

async function loginToFirebase() {

    try {

        setMessage(
            "جاري الاتصال بـ Firebase..."
        );


        // إذا كان مسجل بالفعل
        if (auth.currentUser) {

            if (
                auth.currentUser.uid ===
                WEBSITE_UID
            ) {

                firebaseReady = true;

                setMessage("");

                return true;
            }

            await auth.signOut();
        }


        // تسجيل الدخول
        const result =
            await auth.signInWithEmailAndPassword(
                WEBSITE_EMAIL,
                WEBSITE_PASSWORD
            );


        // التأكد من UID
        if (
            result.user.uid !==
            WEBSITE_UID
        ) {

            firebaseReady = false;

            await auth.signOut();

            setMessage(
                "حساب الموقع غير صحيح"
            );

            return false;
        }


        firebaseReady = true;

        setMessage("");

        console.log(
            "Firebase Login OK"
        );

        console.log(
            "UID:",
            result.user.uid
        );

        return true;


    } catch (error) {

        firebaseReady = false;

        console.error(
            "Firebase Login Error:",
            error
        );


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
        new Date(
            Number(value)
        );


    if (
        isNaN(
            date.getTime()
        )
    ) {

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


    // ==============================================
    // نجاح
    // ==============================================

    if (
        type === "success"
    ) {

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
                title ||
                "تمت العملية";
        }


        if (successMessage) {

            successMessage.textContent =
                message ||
                "";
        }


        if (successAccount) {

            successAccount.textContent =
                accountNumber ||
                "-";
        }


        if (successSubscription) {

            successSubscription.textContent =
                subscriptionName ||
                "-";
        }


        if (successEnd) {

            successEnd.textContent =
                endDate ||
                "-";
        }


    } else {

        // ==========================================
        // خطأ
        // ==========================================

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
                title ||
                "تنبيه";
        }


        if (errorMessage) {

            errorMessage.textContent =
                message ||
                "";
        }
    }


    // ==============================================
    // إذا لم يوجد Dialog
    // ==============================================

    if (!dialog) {

        alert(
            (title || "تنبيه") +
            "\n\n" +
            (message || "")
        );

        return;
    }


    dialog.classList.add(
        "show"
    );


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
        function () {

            closeDialog(
                "iosSuccessDialog"
            );
        };
}


if (errorOk) {

    errorOk.onclick =
        function () {

            closeDialog(
                "iosErrorDialog"
            );
        };
}


// ==================================================
// البحث عن الحساب
// ==================================================

if (searchBtn) {

    searchBtn.onclick =
        async function () {

            const number =
                accountInput.value.trim();


            // ======================================
            // التحقق من رقم الحساب
            // ======================================

            if (
                !/^[0-9]{7}$/.test(
                    number
                )
            ) {

                setMessage(
                    "أدخل رقم حساب مكون من 7 أرقام"
                );


                resultBox.classList.add(
                    "hidden"
                );


                currentAccount =
                    null;

                currentUid =
                    null;

                return;
            }


            // ======================================
            // تسجيل الدخول
            // ======================================

            if (
                !firebaseReady ||
                !auth.currentUser
            ) {

                searchBtn.disabled =
                    true;

                searchBtn.textContent =
                    "جاري الاتصال...";


                const loggedIn =
                    await loginToFirebase();


                if (!loggedIn) {

                    searchBtn.disabled =
                        false;

                    searchBtn.textContent =
                        "بحث";

                    return;
                }
            }


            // ======================================
            // بداية البحث
            // ======================================

            searchBtn.disabled =
                true;

            searchBtn.textContent =
                "جاري البحث...";


            setMessage("");


            resultBox.classList.add(
                "hidden"
            );


            currentAccount =
                null;

            currentUid =
                null;


            try {

                // ==================================
                // قراءة رقم الحساب
                // ==================================

                const accountRef =
                    database.ref(
                        "accountNumbers/" +
                        number
                    );


                const accountSnapshot =
                    await accountRef.once(
                        "value"
                    );


                if (
                    !accountSnapshot.exists()
                ) {

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


                // ==================================
                // حفظ بيانات الحساب
                // ==================================

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


                // ==================================
                // قراءة المستخدم
                // ==================================

                const userRef =
                    database.ref(
                        "users/" +
                        currentUid
                    );


                const userSnapshot =
                    await userRef.once(
                        "value"
                    );


                if (
                    !userSnapshot.exists()
                ) {

                    throw new Error(
                        "المستخدم غير موجود"
                    );
                }


                const user =
                    userSnapshot.val() ||
                    {};


                console.log(
                    "User data:",
                    user
                );


                // ==================================
                // رقم الحساب
                // ==================================

                const rAccount =
                    document.getElementById(
                        "rAccount"
                    );


                if (rAccount) {

                    rAccount.textContent =
                        number;
                }


                // ==================================
                // الاسم
                // ==================================

                const rName =
                    document.getElementById(
                        "rName"
                    );


                if (rName) {

                    rName.textContent =
                        user.username ||
                        "-";
                }


                // ==================================
                // الحالة
                // ==================================

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


                // ==================================
                // الاشتراك
                // ==================================

                const rSub =
                    document.getElementById(
                        "rSub"
                    );


                if (rSub) {

                    rSub.textContent =
                        user.subscriptionName ||
                        "-";
                }


                // ==================================
                // البداية
                // ==================================

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


                // ==================================
                // النهاية
                // ==================================

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


                // ==================================
                // إظهار النتيجة
                // ==================================

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


                currentAccount =
                    null;

                currentUid =
                    null;


                resultBox.classList.add(
                    "hidden"
                );


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
                        .includes(
                            "permission"
                        )
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

                searchBtn.disabled =
                    false;

                searchBtn.textContent =
                    "بحث";
            }
        };
}


// ==================================================
// البحث عند الضغط على Enter
// ==================================================

if (accountInput) {

    accountInput.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key ===
                "Enter"
            ) {

                event.preventDefault();

                searchBtn.click();
            }
        }
    );
}


// ==================================================
// السماح بالأرقام فقط
// ==================================================

if (accountInput) {

    accountInput.addEventListener(
        "input",
        function () {

            this.value =
                this.value
                    .replace(
                        /[^0-9]/g,
                        ""
                    )
                    .slice(
                        0,
                        7
                    );
        }
    );
}


// ==================================================
// تجديد الاشتراك
// ==================================================

if (renewBtn) {

    renewBtn.onclick =
        async function () {


            // =========================================
            // التأكد من وجود حساب
            // =========================================

            if (
                !currentAccount ||
                !currentUid
            ) {

                showDialog(
                    "error",
                    "تنبيه",
                    "ابحث عن الحساب أولاً."
                );

                return;
            }


            // =========================================
            // التأكد من تسجيل الدخول
            // =========================================

            if (
                !auth.currentUser ||
                auth.currentUser.uid !==
                WEBSITE_UID
            ) {

                const loggedIn =
                    await loginToFirebase();


                if (!loggedIn) {

                    showDialog(
                        "error",
                        "خطأ",
                        "تعذر الاتصال بحساب الموقع."
                    );

                    return;
                }
            }


            // =========================================
            // اختيار المدة
            // =========================================

            const periodElement =
                document.getElementById(
                    "period"
                );


            const period =
                periodElement
                    ? periodElement.value
                    : "1";


            // =========================================
            // مدد الاشتراك
            // =========================================

            const periods = {

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


            const selected =
                periods[period];


            if (!selected) {

                showDialog(
                    "error",
                    "خطأ",
                    "مدة الاشتراك غير صحيحة."
                );

                return;
            }


            // =========================================
            // منع الضغط المتكرر
            // =========================================

            renewBtn.disabled =
                true;


            const oldText =
                renewBtn.textContent;


            renewBtn.textContent =
                "جاري التجديد...";


            try {

                // ======================================
                // قراءة بيانات المستخدم
                // ======================================

                const userRef =
                    database.ref(
                        "users/" +
                        currentUid
                    );


                const snapshot =
                    await userRef.once(
                        "value"
                    );


                if (
                    !snapshot.exists()
                ) {

                    throw new Error(
                        "بيانات المستخدم غير موجودة."
                    );
                }


                const user =
                    snapshot.val() ||
                    {};


                // ======================================
                // الوقت الحالي
                // ======================================

                const now =
                    Date.now();


                // ======================================
                // نهاية الاشتراك الحالية
                // ======================================

                const oldEnd =
                    Number(
                        user.subscriptionEnd ||
                        0
                    );


                // ======================================
                // تحديد بداية التجديد
                // ======================================

                let startTime;


                if (
                    oldEnd > now
                ) {

                    // الاشتراك ما زال ساريًا
                    startTime =
                        oldEnd;

                } else {

                    // الاشتراك منتهي
                    startTime =
                        now;
                }


                // ======================================
                // حساب المدة
                // ======================================

                const duration =
                    selected.days *
                    24 *
                    60 *
                    60 *
                    1000;


                // ======================================
                // تاريخ النهاية الجديد
                // ======================================

                const newEnd =
                    startTime +
                    duration;


                // ======================================
                // تحديث Firebase
                // ======================================

                await userRef.update({

                    subscriptionStart:
                        startTime,

                    subscriptionEnd:
                        newEnd,

                    subscriptionName:
                        selected.name,

                    subscriptionType:
                        selected.type,

                    active:
                        true
                });


                // ======================================
                // تحديث الشاشة
                // ======================================

                const rSub =
                    document.getElementById(
                        "rSub"
                    );


                if (rSub) {

                    rSub.textContent =
                        selected.name;
                }


                const rStart =
                    document.getElementById(
                        "rStart"
                    );


                if (rStart) {

                    rStart.textContent =
                        formatDate(
                            startTime
                        );
                }


                const rEnd =
                    document.getElementById(
                        "rEnd"
                    );


                if (rEnd) {

                    rEnd.textContent =
                        formatDate(
                            newEnd
                        );
                }


                const rActive =
                    document.getElementById(
                        "rActive"
                    );


                if (rActive) {

                    rActive.textContent =
                        "مفعل";
                }


                // ======================================
                // رسالة النجاح
                // ======================================

                showDialog(

                    "success",

                    "تم التجديد",

                    "تم تجديد الاشتراك بنجاح.",

                    currentAccount,

                    selected.name,

                    formatDate(
                        newEnd
                    )
                );


            } catch (error) {

                console.error(
                    "Renew error:",
                    error
                );


                let message =
                    "تعذر تجديد الاشتراك.";


                // ======================================
                // خطأ الصلاحيات
                // ======================================

                if (
                    error &&
                    error.code ===
                    "PERMISSION_DENIED"
                ) {

                    message =
                        "ليس لديك صلاحية لتجديد الاشتراك.";

                } else if (
                    error &&
                    error.message
                ) {

                    message =
                        error.message;
                }


                showDialog(
                    "error",
                    "تعذر التجديد",
                    message
                );


            } finally {

                renewBtn.disabled =
                    false;

                renewBtn.textContent =
                    oldText;
            }
        };
}


// ==================================================
// مراقبة حالة تسجيل الدخول
// ==================================================

auth.onAuthStateChanged(
    function (user) {

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
                WEBSITE_UID
            ) {

                firebaseReady =
                    true;

                setMessage("");

            } else {

                firebaseReady =
                    false;

                console.error(
                    "Unexpected Firebase user UID:",
                    user.uid
                );
            }


        } else {

            firebaseReady =
                false;

            console.log(
                "No Firebase user logged in"
            );
        }
    }
);


// ==================================================
// تسجيل الدخول تلقائيًا
// ==================================================

loginToFirebase();
