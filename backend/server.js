const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");


// =========================
// Firebase Admin
// =========================
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://bok-ped-default-rtdb.firebaseio.com"
});

const db = admin.database();

const app = express();

app.use(cors());
app.use(express.json());


// =========================
// البحث عن الحساب
// =========================
app.get("/api/account/:number", async function(req, res) {
  try {

    const number = req.params.number;

    if (!/^[0-9]{7}$/.test(number)) {
      return res.status(400).json({
        error: "رقم الحساب يجب أن يكون 7 أرقام"
      });
    }

    const accountSnap = await db
      .ref("accountNumbers/" + number)
      .once("value");

    if (!accountSnap.exists()) {
      return res.status(404).json({
        error: "رقم الحساب غير موجود"
      });
    }

    const accountData = accountSnap.val();

    if (!accountData.uid) {
      return res.status(400).json({
        error: "الحساب غير مرتبط بمستخدم"
      });
    }

    const uid = accountData.uid;

    const userSnap = await db
      .ref("users/" + uid)
      .once("value");

    if (!userSnap.exists()) {
      return res.status(404).json({
        error: "المستخدم غير موجود"
      });
    }

    const user = userSnap.val();

    res.json({
      uid: uid,
      username: user.username || "",
      active: !!user.active,
      subscriptionName: user.subscriptionName || "",
      subscriptionType: user.subscriptionType || "",
      subscriptionStart: user.subscriptionStart || 0,
      subscriptionEnd: user.subscriptionEnd || 0
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: "حدث خطأ في الخادم"
    });
  }
});


// =========================
// تجديد الاشتراك
// =========================
app.post("/api/renew", async function(req, res) {
  try {

    const uid = req.body.uid;
    const period = String(req.body.period);

    if (!uid) {
      return res.status(400).json({
        error: "UID غير موجود"
      });
    }

    const allowed = ["1", "7", "30", "90", "365"];

    if (!allowed.includes(period)) {
      return res.status(400).json({
        error: "مدة الاشتراك غير صحيحة"
      });
    }

    const userRef = db.ref("users/" + uid);

    const snap = await userRef.once("value");

    if (!snap.exists()) {
      return res.status(404).json({
        error: "المستخدم غير موجود"
      });
    }

    const user = snap.val();

    const now = Date.now();

    const oldEnd = Number(user.subscriptionEnd) || 0;

    // إذا الاشتراك ما زال ساريًا:
    // نمدد من تاريخ نهايته.
    // وإذا انتهى:
    // نبدأ من الوقت الحالي.
    const start = oldEnd > now ? oldEnd : now;

    const date = new Date(start);

    let type = "";
    let name = "";

    if (period === "1") {

      date.setDate(date.getDate() + 1);

      type = "day";
      name = "يوم واحد";

    } else if (period === "7") {

      date.setDate(date.getDate() + 7);

      type = "week";
      name = "أسبوع واحد";

    } else if (period === "30") {

      date.setMonth(date.getMonth() + 1);

      type = "month";
      name = "شهر واحد";

    } else if (period === "90") {

      date.setMonth(date.getMonth() + 3);

      type = "3months";
      name = "3 شهور";

    } else if (period === "365") {

      date.setFullYear(date.getFullYear() + 1);

      type = "12months";
      name = "12 شهر";
    }

    const end = date.getTime();

    await userRef.update({
      active: true,
      subscriptionStart: start,
      subscriptionEnd: end,
      subscriptionType: type,
      subscriptionName: name
    });

    res.json({
      success: true,
      subscriptionName: name,
      subscriptionType: type,
      subscriptionStart: start,
      subscriptionEnd: end
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: "فشل تجديد الاشتراك"
    });
  }
});


// =========================
// تشغيل السيرفر
// =========================
const PORT = process.env.PORT || 3000;

app.listen(PORT, function() {
  console.log("BOK Backend running on port " + PORT);
});
