const firebaseConfig={
apiKey:"AIzaSyDnvmRTgZl1p325V3TmCjIH-PnPfjJPPpk",
authDomain:"bok-ped.firebaseapp.com",
databaseURL:"https://bok-ped-default-rtdb.firebaseio.com",
projectId:"bok-ped",
storageBucket:"bok-ped.firebasestorage.app",
messagingSenderId:"812838230843",
appId:"1:812838230843:web:f3bd5f59343db42b52b51e"
};

firebase.initializeApp(firebaseConfig);

const db=firebase.database();

let uid=null;
let account=null;

const searchBtn=document.getElementById("searchBtn");
const renewBtn=document.getElementById("renewBtn");

function formatDate(v){
if(!v)return"-";
const d=new Date(Number(v));
return isNaN(d.getTime())?"-":d.toLocaleString("ar");
}

searchBtn.onclick=function(){

const n=document.getElementById("account").value.trim();
const msg=document.getElementById("msg");

if(!/^[0-9]{7}$/.test(n)){
msg.textContent="أدخل رقم حساب مكون من 7 أرقام";
return;
}

searchBtn.disabled=true;
searchBtn.textContent="جاري البحث...";
msg.textContent="";

db.ref("accountNumbers/"+n).once("value")
.then(function(s){

if(!s.exists())throw new Error("رقم الحساب غير موجود");

const a=s.val();

if(!a.uid)throw new Error("الحساب غير مرتبط بمستخدم");

uid=a.uid;
account=n;

return db.ref("users/"+uid).once("value");

})
.then(function(s){

if(!s.exists())throw new Error("الحساب غير موجود");

const d=s.val();

document.getElementById("rAccount").textContent=account;
document.getElementById("rName").textContent=d.username||"-";
document.getElementById("rActive").textContent=d.active?"مفعل":"غير مفعل";
document.getElementById("rSub").textContent=d.subscriptionName||"-";
document.getElementById("rStart").textContent=formatDate(d.subscriptionStart);
document.getElementById("rEnd").textContent=formatDate(d.subscriptionEnd);

document.getElementById("result").classList.remove("hidden");

msg.textContent="تم العثور على الحساب";

})
.catch(function(e){
msg.textContent=e.message;
})
.finally(function(){
searchBtn.disabled=false;
searchBtn.textContent="بحث";
});

};

renewBtn.onclick=function(){

if(!uid){
alert("ابحث عن الحساب أولاً");
return;
}

const p=document.getElementById("period").value;

let type,name;

if(p==="1"){type="day";name="يوم واحد";}
else if(p==="7"){type="week";name="أسبوع واحد";}
else if(p==="30"){type="month";name="شهر واحد";}
else if(p==="90"){type="3months";name="3 شهور";}
else{type="12months";name="12 شهر";}

renewBtn.disabled=true;
renewBtn.textContent="جاري التجديد...";

const ref=db.ref("users/"+uid);

ref.once("value")
.then(function(s){

if(!s.exists())throw new Error("الحساب غير موجود");

const u=s.val();
const now=Date.now();
const old=Number(u.subscriptionEnd)||0;
const start=old>now?old:now;

const d=new Date(start);

if(type==="day")d.setDate(d.getDate()+1);
else if(type==="week")d.setDate(d.getDate()+7);
else if(type==="month")d.setMonth(d.getMonth()+1);
else if(type==="3months")d.setMonth(d.getMonth()+3);
else d.setFullYear(d.getFullYear()+1);

const end=d.getTime();

return ref.update({
active:true,
subscriptionStart:start,
subscriptionEnd:end,
subscriptionType:type,
subscriptionName:name
})
.then(function(){

document.getElementById("rActive").textContent="مفعل";
document.getElementById("rSub").textContent=name;
document.getElementById("rStart").textContent=formatDate(start);
document.getElementById("rEnd").textContent=formatDate(end);

alert(
"تم تجديد الاشتراك بنجاح\n\n"+
"رقم الحساب: "+account+
"\nالمدة: "+name+
"\nينتهي: "+formatDate(end)
);

});

})
.catch(function(e){
alert("خطأ\n\n"+e.message);
})
.finally(function(){
renewBtn.disabled=false;
renewBtn.textContent="تجديد الاشتراك";
});

};
