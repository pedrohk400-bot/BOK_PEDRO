const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");

// =========================
// Firebase Admin
// =========================

if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    console.error("FIREBASE_SERVICE_ACCOUNT is missing");
    process.exit(1);
}

let serviceAccount;

try {
    serviceAccount =
        JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} catch (error) {
    console.error("Invalid FIREBASE_SERVICE_ACCOUNT");
    process.exit(1);
}

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL:
        "https://bok-ped-default-rtdb.firebaseio.com"
});

const db = admin.database();

const app = express();

app.use(cors());
app.use(express.json());


// =========================
// الصفحة الرئيسية / فحص السيرفر
// =========================

app.get("/api", function(req, res) {
    res.json({
        success: true,
        message: "BOK Backend is running"
    });
});


// =========================
// البحث عن الحساب
// =========================

app.get(
    "/api/account/:number",
    async function(req, res) {

        try {

            const number =
                String(req.params.number).trim();

            if (!/^[0-9]{7}$/.test(number)) {

                return res.status(400).json({
                    error:
                        "رقم الحساب يجب أن يكون 7 أرقام"
                });
            }


            // البحث في accountNumbers

            const accountSnap =
                await db
                    .ref("accountNumbers/" + number)
                    .once("value");


            if (!accountSnap.exists()) {

                return res.status(404).json({
                    error:
                        "رقم الحساب غير موجود"
                });
            }


            const accountData =
                accountSnap.val();


            if (!accountData ||
                !accountData.uid) {

                return res.status(400).json({
                    error:
                        "الحساب غير مرتبط بمستخدم"
                });
            }


            const uid =
                String(accountData.uid);


            // جلب بيانات المستخدم

            const userSnap =
                await db
                    .ref("users/" + uid)
                    .once("value");


            if (!userSnap.exists()) {

                return res.status(404).json({
                    error:
                        "المستخدم غير موجود"
                });
            }


            const user =
                userSnap.val() || {};


            res.json({

                success: true,

                uid: uid,

                accountNumber: number,

                username:
                    user.username || "",

                active:
                    !!user.active,

                subscriptionName:
                    user.subscriptionName || "",

                subscriptionType:
                    user.subscriptionType || "",

                subscriptionStart:
                    Number(
                        user.subscriptionStart
                    ) || 0,

                subscriptionEnd:
                    Number(
                        user.subscriptionEnd
                    ) || 0

            });

        } catch (error) {

            console.error(
                "Account search error:",
                error
            );

            res.status(500).json({
                error:
                    "حدث خطأ في الخادم"
            });
        }
    }
);


// =========================
// تجديد الاشتراك
// =========================

app.post(
    "/api/renew",
    async function(req, res) {

        try {

            const account =
                String(
                    req.body.account || ""
                ).trim();

            const period =
                String(
                    req.body.period || ""
                );


            // التحقق من رقم الحساب

            if (!/^[0-9]{7}$/.test(account)) {

                return res.status(400).json({
                    error:
                        "رقم الحساب يجب أن يكون 7 أرقام"
                });
            }


            // المدد المسموحة

            const allowed = [
                "1",
                "7",
                "30",
                "90",
                "365"
            ];


            if (!allowed.includes(period)) {

                return res.status(400).json({
                    error:
                        "مدة الاشتراك غير صحيحة"
                });
            }


            // =========================
            // استخراج UID من Firebase
            // =========================

            const accountSnap =
                await db
                    .ref("accountNumbers/" + account)
                    .once("value");


            if (!accountSnap.exists()) {

                return res.status(404).json({
                    error:
                        "رقم الحساب غير موجود"
                });
            }


            const accountData =
                accountSnap.val();


            if (!accountData ||
                !accountData.uid) {

                return res.status(400).json({
                    error:
                        "الحساب غير مرتبط بمستخدم"
                });
            }


            const uid =
                String(accountData.uid);


            const userRef =
                db.ref("users/" + uid);


            const snap =
                await userRef.once("value");


            if (!snap.exists()) {

                return res.status(404).json({
                    error:
                        "المستخدم غير موجود"
                });
            }


            const user =
                snap.val() || {};


            // =========================
            // حساب تاريخ البداية
            // =========================

            const now =
                Date.now();


            const oldEnd =
                Number(
                    user.subscriptionEnd
                ) || 0;


            /*
             إذا الاشتراك الحالي ما زال ساريًا:
             نبدأ من تاريخ النهاية القديمة.

             إذا كان منتهيًا:
             نبدأ من الوقت الحالي.
            */

            const start =
                oldEnd > now
                    ? oldEnd
                    : now;


            let end;


            // =========================
            // حساب تاريخ النهاية
            // =========================

            if (period === "1") {

                end =
                    start +
                    (1 * 24 * 60 * 60 * 1000);

            } else if (period === "7") {

                end =
                    start +
                    (7 * 24 * 60 * 60 * 1000);

            } else if (period === "30") {

                end =
                    start +
                    (30 * 24 * 60 * 60 * 1000);

            } else if (period === "90") {

                end =
                    start +
                    (90 * 24 * 60 * 60 * 1000);

            } else if (period === "365") {

                end =
                    start +
                    (365 * 24 * 60 * 60 * 1000);
            }


            let type = "";
            let name = "";


            if (period === "1") {

                type = "day";
                name = "يوم واحد";

            } else if (period === "7") {

                type = "week";
                name = "أسبوع واحد";

            } else if (period === "30") {

                type = "month";
                name = "شهر واحد";

            } else if (period === "90") {

                type = "3months";
                name = "3 شهور";

            } else if (period === "365") {

                type = "12months";
                name = "12 شهر";
            }


            // =========================
            // تحديث Firebase
            // =========================

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


            // =========================
            // الرد
            // =========================

            res.json({

                success: true,

                accountNumber:
                    account,

                uid:
                    uid,

                subscriptionName:
                    name,

                subscriptionType:
                    type,

                subscriptionStart:
                    start,

                subscriptionEnd:
                    end

            });

        } catch (error) {

            console.error(
                "Renew error:",
                error
            );

            res.status(500).json({
                error:
                    "فشل تجديد الاشتراك"
            });
        }
    }
);


// =========================
// تشغيل السيرفر
// =========================

const PORT =
    process.env.PORT || 3000;


app.listen(
    PORT,
    function() {

        console.log(
            "BOK Backend running on port " +
            PORT
        );

    }
);
