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

const auth=firebase.auth();
const db=firebase.database();

const loginBox=document.getElementById("login");
const appBox=document.getElementById("app");
const loginBtn=document.getElementById("loginBtn");
const searchBtn=document.getElementById("searchBtn");
const renewBtn=document.getElementById("renewBtn");

let currentUid=null;
let currentAccount=null;
let currentData=null;

loginBtn.onclick=function(){

const e=document.getElementById("email").value.trim();
const p=document.getElementById("password").value;
const m=document.getElementById("loginMsg");

if(!e||!p){
m.textContent="أدخل البريد وكلمة المرور";
return;
}

loginBtn.disabled=true;
loginBtn.textContent="جاري الدخول...";

auth.signInWithEmailAndPassword(e,p)
.then(function(){
m.textContent="";
})
.catch(function(error){
m.textContent="بيانات الدخول غير صحيحة";
console.log(error);
})
.finally(function(){
loginBtn.disabled=false;
loginBtn.textContent="دخول";
});
};

auth.onAuthStateChanged(function(user){

if(user){
loginBox.classList.add("hidden");
appBox.classList.remove("hidden");
}else{
loginBox.classList.remove("hidden");
appBox.classList.add("hidden");
}
});


searchBtn.onclick=function(){

const number=document.getElementById("account").value.trim();
const message=document.getElementById("msg");

if(!/^[0-9]{7}$/.test(number)){
message.textContent="أدخل رقم حساب مكون من 7 أرقام";
return;
}

searchBtn.disabled=true;
searchBtn.textContent="جاري البحث...";
message.textContent="";

db.ref("accountNumbers/"+number).once("value")
.then(function(a){

if(!a.exists())
throw new Error("رقم الحساب غير موجود");

const uid=a.val().uid;

if(!uid)
throw new Error("الحساب غير مرتبط بمستخدم");

currentUid=uid;
currentAccount=number;

return db.ref("users/"+uid).once("value");

})
.then(function(u){

if(!u.exists())
throw new Error("بيانات الحساب غير موجودة");

currentData=u.val();

document.getElementById("rAccount").textContent=currentAccount;
document.getElementById("rName").textContent=currentData.username||"-";
document.getElementById("rActive").textContent=currentData.active?"مفعل":"غير مفعل";
document.getElementById("rSub").textContent=currentData.subscriptionName||"-";
document.getElementById("rStart").textContent=formatDate(currentData.subscriptionStart);
document.getElementById("rEnd").textContent=formatDate(currentData.subscriptionEnd);

document.getElementById("result").classList.remove("hidden");

message.textContent="تم العثور على الحساب";

})
.catch(function(error){

message.textContent=error.message;

})
.finally(function(){

searchBtn.disabled=false;
searchBtn.textContent="بحث";

});
};


renewBtn.onclick=function(){

if(!currentUid||!currentData){
alert("ابحث عن الحساب أولاً");
return;
}

const days=Number(document.getElementById("period").value);

const now=Date.now();

const oldEnd=Number(currentData.subscriptionEnd)||0;

const start=oldEnd>now?oldEnd:now;

const end=start+(days*86400000);

renewBtn.disabled=true;
renewBtn.textContent="جاري التجديد...";

db.ref("users/"+currentUid).update({

active:true,
subscriptionStart:start,
subscriptionEnd:end,
subscriptionName:document.getElementById("period").selectedOptions[0].text

})
.then(function(){

currentData.active=true;
currentData.subscriptionStart=start;
currentData.subscriptionEnd=end;

document.getElementById("rActive").textContent="مفعل";
document.getElementById("rSub").textContent=currentData.subscriptionName;
document.getElementById("rStart").textContent=formatDate(start);
document.getElementById("rEnd").textContent=formatDate(end);

alert("تم تجديد الاشتراك بنجاح\nحساب رقم: "+currentAccount);

})
.catch(function(error){

alert("تعذر التجديد: "+error.message);

})
.finally(function(){

renewBtn.disabled=false;
renewBtn.textContent="تجديد الاشتراك";

});
};


function formatDate(timestamp){

if(!timestamp)
return "-";

return new Date(Number(timestamp)).toLocaleString("ar");

}
