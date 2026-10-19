"use strict";

const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");

// ==================================================
// BOK PEDRO
// Firebase Project: BOK-PEDRO-NEW
// ==================================================

const DATABASE_URL =
    "https://bok-pedro-new-default-rtdb.firebaseio.com";

const WEBSITE_UID =
    "gL1GGUJ7FWS4zRZmzdaf60qqHMD3";

// ==================================================
// التحقق من إعدادات Firebase
// ==================================================

if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    console.error(
        "FIREBASE_SERVICE_ACCOUNT is missing"
    );

    process.exit(1);
}

let serviceAccount;

try {
    serviceAccount = JSON.parse(
        process.env.FIREBASE_SERVICE_ACCOUNT
    );
} catch (error) {
    console.error(
        "Invalid FIREBASE_SERVICE_ACCOUNT JSON"
    );

    process.exit(1);
}

// ==================================================
// التأكد من أن ملف الخدمة تابع للمشروع الجديد
// ==================================================

if (
    serviceAccount.project_id !== "bok-pedro-new"
) {
    console.error(
        "Firebase service account does not belong to bok-pedro-new"
    );

    process.exit(1);
}

// ==================================================
// تهيئة Firebase Admin
// ==================================================

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: DATABASE_URL
});

const db = admin.database();

const app = express();

app.disable("x-powered-by");

app.use(cors());

app.use(express.json({
    limit: "20kb"
}));

// ==================================================
// أدوات مساعدة
// ==================================================

function sendError(res, status, message) {
    return res.status(status).json({
        success: false,
        error: message
    });
}

function validAccount(number) {
    return /^[0-9]{7}$/.test(number);
}

function getSubscription(period) {

    const periods = {
        "1": {
            days: 1,
            name: "يوم واحد",
            type: "day"
        },

        "7": {
            days: 7,
            name: "أسبوع واحد",
            type: "week"
        },

        "30": {
            days: 30,
            name: "شهر واحد",
            type: "month"
        },

        "90": {
            days: 90,
            name: "3 شهور",
            type: "3months"
        },

        "365": {
            days: 365,
            name: "12 شهر",
            type: "12months"
        }
    };

    return periods[period] || null;
}

// ==================================================
// التحقق من هوية المستخدم
// ==================================================

async function authenticateWebsite(req, res, next) {

    try {

        const authorization =
            req.headers.authorization || "";

        const match = authorization.match(
            /^Bearer\s+(.+)$/i
        );

        if (!match) {
            return sendError(
                res,
                401,
                "يجب تسجيل الدخول أولاً."
            );
        }

        const idToken = match[1];

        const decodedToken =
            await admin.auth().verifyIdToken(idToken);

        // السماح لحساب الموقع المحدد فقط
        if (decodedToken.uid !== WEBSITE_UID) {

            return sendError(
                res,
                403,
                "ليس لديك صلاحية لتنفيذ هذه العملية."
            );
        }

        req.websiteUser = decodedToken;

        next();

    } catch (error) {

        console.error(
            "Authentication error:",
            error.message
        );

        return sendError(
            res,
            401,
            "جلسة الدخول غير صالحة. سجّل الدخول مجددًا."
        );
    }
}

// ==================================================
// الصفحة الرئيسية وفحص الخادم
// ==================================================

app.get("/api", function(req, res) {

    res.json({
        success: true,
        message: "BOK PEDRO Backend is running",
        project: "bok-pedro-new"
    });
});

// ==================================================
// البحث عن حساب
// ==================================================

app.get(
    "/api/account/:number",
    authenticateWebsite,
    async function(req, res) {

        try {

            const number =
                String(req.params.number || "").trim();

            if (!validAccount(number)) {

                return sendError(
                    res,
                    400,
                    "رقم الحساب يجب أن يتكون من 7 أرقام."
                );
            }

            // قراءة ربط رقم الحساب بالمستخدم
            const accountSnap = await db
                .ref("accountNumbers/" + number)
                .once("value");

            if (!accountSnap.exists()) {

                return sendError(
                    res,
                    404,
                    "رقم الحساب غير موجود."
                );
            }

            const accountData =
                accountSnap.val();

            if (
                !accountData ||
                !accountData.uid
            ) {

                return sendError(
                    res,
                    400,
                    "الحساب غير مرتبط بمستخدم."
                );
            }

            const uid = String(accountData.uid);

            // قراءة بيانات المستخدم
            const userSnap = await db
                .ref("users/" + uid)
                .once("value");

            if (!userSnap.exists()) {

                return sendError(
                    res,
                    404,
                    "المستخدم غير موجود."
                );
            }

            const user = userSnap.val() || {};

            return res.json({

                success: true,

                uid: uid,

                accountNumber: number,

                username:
                    user.username || "",

                active:
                    user.active === true,

                subscriptionName:
                    user.subscriptionName || "",

                subscriptionType:
                    user.subscriptionType || "",

                subscriptionStart:
                    Number(user.subscriptionStart) || 0,

                subscriptionEnd:
                    Number(user.subscriptionEnd) || 0

            });

        } catch (error) {

            console.error(
                "Account search error:",
                error
            );

            return sendError(
                res,
                500,
                "حدث خطأ أثناء البحث عن الحساب."
            );
        }
    }
);

// ==================================================
// تجديد الاشتراك
// ==================================================

app.post(
    "/api/renew",
    authenticateWebsite,
    async function(req, res) {

        try {

            const account =
                String(req.body.account || "").trim();

            const period =
                String(req.body.period || "");

            if (!validAccount(account)) {

                return sendError(
                    res,
                    400,
                    "رقم الحساب يجب أن يتكون من 7 أرقام."
                );
            }

            const selected =
                getSubscription(period);

            if (!selected) {

                return sendError(
                    res,
                    400,
                    "مدة الاشتراك غير صحيحة."
                );
            }

            // البحث عن الحساب
            const accountSnap = await db
                .ref("accountNumbers/" + account)
                .once("value");

            if (!accountSnap.exists()) {

                return sendError(
                    res,
                    404,
                    "رقم الحساب غير موجود."
                );
            }

            const accountData =
                accountSnap.val();

            if (
                !accountData ||
                !accountData.uid
            ) {

                return sendError(
                    res,
                    400,
                    "الحساب غير مرتبط بمستخدم."
                );
            }

            const uid = String(accountData.uid);

            const userRef =
                db.ref("users/" + uid);

            // قراءة بيانات الاشتراك الحالية
            const userSnap =
                await userRef.once("value");

            if (!userSnap.exists()) {

                return sendError(
                    res,
                    404,
                    "المستخدم غير موجود."
                );
            }

            const user =
                userSnap.val() || {};

            const now = Date.now();

            const oldEnd =
                Number(user.subscriptionEnd) || 0;

            // المحافظة على المدة المتبقية
            const start =
                oldEnd > now ? oldEnd : now;

            const duration =
                selected.days *
                24 *
                60 *
                60 *
                1000;

            const end = start + duration;

            if (
                !Number.isFinite(start) ||
                !Number.isFinite(end) ||
                end <= now
            ) {

                return sendError(
                    res,
                    400,
                    "تعذر حساب تاريخ انتهاء الاشتراك."
                );
            }

            // تحديث بيانات المستخدم
            await userRef.update({

                active: true,

                subscriptionStart: start,

                subscriptionEnd: end,

                subscriptionType: selected.type,

                subscriptionName: selected.name,

                updatedAt: now

            });

            return res.json({

                success: true,

                accountNumber: account,

                uid: uid,

                subscriptionName:
                    selected.name,

                subscriptionType:
                    selected.type,

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

            return sendError(
                res,
                500,
                "فشل تجديد الاشتراك."
            );
        }
    }
);

// ==================================================
// معالجة المسارات غير الموجودة
// ==================================================

app.use(function(req, res) {

    return sendError(
        res,
        404,
        "المسار المطلوب غير موجود."
    );
});

// ==================================================
// معالجة أخطاء JSON
// ==================================================

app.use(function(error, req, res, next) {

    if (res.headersSent) {
        return next(error);
    }

    if (error instanceof SyntaxError && error.status === 400) {

        return sendError(
            res,
            400,
            "بيانات JSON المرسلة غير صحيحة."
        );
    }

    console.error("Server error:", error);

    return sendError(
        res,
        500,
        "حدث خطأ داخلي في الخادم."
    );
});

// ==================================================
// تشغيل الخادم
// ==================================================

const PORT =
    process.env.PORT || 3000;

app.listen(PORT, function() {

    console.log(
        "BOK PEDRO Backend running on port " + PORT
    );

    console.log(
        "Firebase project: bok-pedro-new"
    );
});
