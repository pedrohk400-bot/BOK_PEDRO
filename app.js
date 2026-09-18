// ==========================================
// BOK-PED
// البحث المباشر من Firebase
// لا يوجد Backend
// ==========================================


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


let currentAccount = null;

let currentUid = null;


// ==========================================
// تنسيق التاريخ
// ==========================================

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


// ==========================================
// إظهار Dialog
// ==========================================

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

        document.getElementById(
            "successMessage"
        ).textContent =
            message || "";


        document.getElementById(
            "successAccount"
        ).textContent =
            accountNumber || "-";


        document.getElementById(
            "successSubscription"
        ).textContent =
            subscriptionName || "-";


        document.getElementById(
            "successEnd"
        ).textContent =
            endDate || "-";

    } else {

        dialog =
            document.getElementById(
                "iosErrorDialog"
            );


        document.getElementById(
            "errorMessage"
        ).textContent =
            message || "";

    }


    if (!dialog) {

        alert(
            title +
            "\n\n" +
            message
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


// ==========================================
// إغلاق Dialog
// ==========================================

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


// ==========================================
// أزرار Dialog
// ==========================================

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


// ==========================================
// البحث عن الحساب
// ==========================================

searchBtn.onclick =
    async function () {


        const number =
            accountInput.value.trim();


        // ------------------------------
        // التحقق من الرقم
        // ------------------------------

        if (
            !/^[0-9]{7}$/.test(
                number
            )
        ) {

            msg.textContent =
                "أدخل رقم حساب مكون من 7 أرقام";


            resultBox.classList.add(
                "hidden"
            );


            currentAccount = null;

            currentUid = null;


            return;
        }


        // ------------------------------
        // حالة البحث
        // ------------------------------

        searchBtn.disabled =
            true;


        searchBtn.textContent =
            "جاري البحث...";


        msg.textContent =
            "";


        resultBox.classList.add(
            "hidden"
        );


        try {


            // ==================================
            // قراءة:
            // accountNumbers/{account}
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


            // ==================================
            // استخراج UID
            // ==================================

            if (
                !accountData ||
                !accountData.uid
            ) {

                throw new Error(
                    "الحساب غير مرتبط بمستخدم"
                );

            }


            currentUid =
                String(
                    accountData.uid
                );


            currentAccount =
                number;


            // ==================================
            // قراءة:
            // users/{uid}
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
                userSnapshot.val() || {};


            // ==================================
            // رقم الحساب
            // ==================================

            document.getElementById(
                "rAccount"
            ).textContent =
                number;


            // ==================================
            // الاسم
            // ==================================

            document.getElementById(
                "rName"
            ).textContent =
                user.username || "-";


            // ==================================
            // الحالة
            // ==================================

            document.getElementById(
                "rActive"
            ).textContent =
                user.active === true
                    ? "مفعل"
                    : "غير مفعل";


            // ==================================
            // الاشتراك
            // ==================================

            document.getElementById(
                "rSub"
            ).textContent =
                user.subscriptionName ||
                "-";


            // ==================================
            // البداية
            // ==================================

            document.getElementById(
                "rStart"
            ).textContent =
                formatDate(
                    user.subscriptionStart
                );


            // ==================================
            // النهاية
            // ==================================

            document.getElementById(
                "rEnd"
            ).textContent =
                formatDate(
                    user.subscriptionEnd
                );


            // ==================================
            // إظهار النتيجة
            // ==================================

            resultBox.classList.remove(
                "hidden"
            );


            msg.textContent =
                "تم العثور على الحساب";


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


            // ==================================
            // Firebase Permission
            // ==================================

            if (
                error &&
                error.message &&
                error.message
                    .toLowerCase()
                    .includes(
                        "permission"
                    )
            ) {

                msg.textContent =
                    "Firebase رفض قراءة البيانات";

            } else {

                msg.textContent =
                    error.message ||
                    "حدث خطأ أثناء البحث";

            }


        } finally {


            searchBtn.disabled =
                false;


            searchBtn.textContent =
                "بحث";

        }

    };


// ==========================================
// الضغط على Enter
// ==========================================

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


// ==========================================
// التجديد
// ==========================================
//
// التجديد متوقف في هذه النسخة.
// لا نعطي الموقع صلاحية كتابة مباشرة
// في users حتى لا يستطيع أي شخص تعديل
// الاشتراكات.
//

if (renewBtn) {

    renewBtn.onclick =
        function () {

            showDialog(
                "error",
                "التجديد",
                "التجديد غير متاح من هذه الصفحة حالياً."
            );

        };

}
