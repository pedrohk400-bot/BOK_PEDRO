const API = "/api";

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

const period =
    document.getElementById("period");

let uid = null;
let account = null;


// =========================
// تنسيق التاريخ
// =========================

function formatDate(value) {

    if (!value) {
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


// =========================
// قراءة رد السيرفر بأمان
// =========================

async function readResponse(response) {

    const text =
        await response.text();

    if (!text) {

        throw new Error(
            "الخادم لم يرجع أي بيانات"
        );
    }


    try {

        return JSON.parse(text);

    } catch (error) {

        console.error(
            "Server response:",
            text
        );

        throw new Error(
            "تعذر الاتصال بالـBackend. تأكد أن رابط API صحيح وأن الخادم يعمل."
        );
    }
}


// =========================
// إظهار Dialog
// =========================

function showDialog(
    type,
    title,
    message,
    accountNumber,
    subscriptionName,
    endDate
) {

    const dialog =
        document.getElementById(
            type === "success"
                ? "iosSuccessDialog"
                : "iosErrorDialog"
        );


    if (!dialog) {

        alert(
            title +
            "\n\n" +
            message
        );

        return;
    }


    if (type === "success") {

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

        document.getElementById(
            "errorMessage"
        ).textContent =
            message || "";
    }


    dialog.classList.add("show");

    dialog.setAttribute(
        "aria-hidden",
        "false"
    );
}


// =========================
// إغلاق Dialog
// =========================

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


// =========================
// أزرار إغلاق Dialog
// =========================

document.getElementById(
    "successOk"
).onclick = function() {

    closeDialog(
        "iosSuccessDialog"
    );
};


document.getElementById(
    "errorOk"
).onclick = function() {

    closeDialog(
        "iosErrorDialog"
    );
};


// =========================
// البحث عن الحساب
// =========================

searchBtn.onclick =
    async function() {

        const number =
            accountInput.value.trim();


        if (!/^[0-9]{7}$/.test(number)) {

            msg.textContent =
                "أدخل رقم حساب مكون من 7 أرقام";

            resultBox.classList.add(
                "hidden"
            );

            uid = null;
            account = null;

            return;
        }


        searchBtn.disabled = true;

        searchBtn.textContent =
            "جاري البحث...";

        msg.textContent = "";


        try {

            const response =
                await fetch(
                    API +
                    "/account/" +
                    encodeURIComponent(number),
                    {
                        method: "GET",
                        headers: {
                            "Accept":
                                "application/json"
                        }
                    }
                );


            const data =
                await readResponse(
                    response
                );


            if (!response.ok) {

                throw new Error(
                    data.error ||
                    "فشل البحث"
                );
            }


            uid =
                data.uid;

            account =
                number;


            document.getElementById(
                "rAccount"
            ).textContent =
                number;


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
                data.subscriptionName ||
                "-";


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


            resultBox.classList.remove(
                "hidden"
            );


            msg.textContent =
                "تم العثور على الحساب";

        } catch (error) {

            console.error(error);

            msg.textContent =
                error.message ||
                "حدث خطأ أثناء البحث";


            resultBox.classList.add(
                "hidden"
            );


            uid = null;
            account = null;

        } finally {

            searchBtn.disabled = false;

            searchBtn.textContent =
                "بحث";
        }
    };


// =========================
// التجديد
// =========================

renewBtn.onclick =
    async function() {

        if (!account) {

            showDialog(
                "error",
                "تنبيه",
                "ابحث عن الحساب أولاً"
            );

            return;
        }


        const selectedPeriod =
            period.value;


        renewBtn.disabled = true;

        renewBtn.textContent =
            "جاري التجديد...";


        try {

            const response =
                await fetch(
                    API + "/renew",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",

                            "Accept":
                                "application/json"
                        },

                        body:
                            JSON.stringify({
                                account:
                                    account,

                                period:
                                    selectedPeriod
                            })
                    }
                );


            const data =
                await readResponse(
                    response
                );


            if (!response.ok) {

                throw new Error(
                    data.error ||
                    "فشل التجديد"
                );
            }


            // تحديث UID من السيرفر

            uid =
                data.uid;


            // تحديث البيانات

            document.getElementById(
                "rActive"
            ).textContent =
                "مفعل";


            document.getElementById(
                "rSub"
            ).textContent =
                data.subscriptionName ||
                "-";


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


            // Dialog النجاح

            showDialog(
                "success",
                "تم التجديد",
                "تم تجديد اشتراك الحساب بنجاح",
                account,
                data.subscriptionName,
                formatDate(
                    data.subscriptionEnd
                )
            );


        } catch (error) {

            console.error(error);


            showDialog(
                "error",
                "فشل التجديد",
                error.message ||
                "حدث خطأ أثناء تجديد الاشتراك"
            );


        } finally {

            renewBtn.disabled = false;

            renewBtn.textContent =
                "تجديد الاشتراك";
        }
    };


// =========================
// Enter للبحث
// =========================

accountInput.addEventListener(
    "keydown",
    function(event) {

        if (event.key === "Enter") {

            event.preventDefault();

            searchBtn.click();
        }
    }
);
