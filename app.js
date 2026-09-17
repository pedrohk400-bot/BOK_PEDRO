const API = "/api";


const searchBtn =
document.getElementById("searchBtn");

const renewBtn =
document.getElementById("renewBtn");


let uid = null;
let account = null;


function formatDate(v){

if(!v)return "-";

const d =
new Date(Number(v));

return isNaN(d.getTime())
? "-"
: d.toLocaleString("ar");

}


/* =========================
   البحث
========================= */

searchBtn.onclick =
async function(){

const number =
document.getElementById("account")
.value.trim();

const msg =
document.getElementById("msg");


if(!/^[0-9]{7}$/.test(number)){

msg.textContent =
"أدخل رقم حساب مكون من 7 أرقام";

return;

}


searchBtn.disabled = true;
searchBtn.textContent =
"جاري البحث...";


try{

const res =
await fetch(
API + "/account/" + number
);

const result =
await res.json();


if(!res.ok){

throw new Error(
result.error || "فشل البحث"
);

}


uid =
result.uid;

account =
number;


document.getElementById(
"rAccount"
).textContent =
account;


document.getElementById(
"rName"
).textContent =
result.username || "-";


document.getElementById(
"rActive"
).textContent =
result.active
? "مفعل"
: "غير مفعل";


document.getElementById(
"rSub"
).textContent =
result.subscriptionName || "-";


document.getElementById(
"rStart"
).textContent =
formatDate(
result.subscriptionStart
);


document.getElementById(
"rEnd"
).textContent =
formatDate(
result.subscriptionEnd
);


document.getElementById(
"result"
).classList.remove("hidden");


msg.textContent =
"تم العثور على الحساب";


}catch(e){

msg.textContent =
e.message;

}finally{

searchBtn.disabled=false;
searchBtn.textContent="بحث";

}

};


/* =========================
   التجديد
========================= */

renewBtn.onclick =
async function(){

if(!uid){

alert(
"ابحث عن الحساب أولاً"
);

return;

}


const period =
document.getElementById(
"period"
).value;


renewBtn.disabled=true;

renewBtn.textContent =
"جاري التجديد...";


try{

const res =
await fetch(
API + "/renew",
{
method:"POST",

headers:{
"Content-Type":
"application/json"
},

body:JSON.stringify({

uid:uid,

account:account,

period:period

})

});


const result =
await res.json();


if(!res.ok){

throw new Error(
result.error || "فشل التجديد"
);

}


document.getElementById(
"rActive"
).textContent =
"مفعل";


document.getElementById(
"rSub"
).textContent =
result.subscriptionName;


document.getElementById(
"rStart"
).textContent =
formatDate(
result.subscriptionStart
);


document.getElementById(
"rEnd"
).textContent =
formatDate(
result.subscriptionEnd
);


alert(
"تم تجديد الاشتراك بنجاح\n\n"+
"رقم الحساب: "+account+
"\nالمدة: "+
result.subscriptionName+
"\nينتهي: "+
formatDate(result.subscriptionEnd)
);


}catch(e){

alert(
"خطأ\n\n"+e.message
);

}finally{

renewBtn.disabled=false;

renewBtn.textContent =
"تجديد الاشتراك";

}

};
