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

let currentUid=null;
let currentAccountNumber=null;
let currentUserData=null;
let selectedRenewal=null;

const emailInput=document.getElementById("email");
const passwordInput=document.getElementById("password");
const loginBox=document.getElementById("login");
const searchBox=document.getElementById("app");
const loginMsg=document.getElementById("loginMsg");
const accountInput=document.getElementById("account");
const msg=document.getElementById("msg");
const result=document.getElementById("result");

function login(){
const e=emailInput.value.trim();
const p=passwordInput.value;

if(!e||!p){
loginMsg.textContent="أدخل البريد الإلكتروني وكلمة المرور";
return;
}

loginMsg.textContent="جاري التحقق...";

auth.signInWithEmailAndPassword(e,p)
.then(()=>{
loginBox.style.display="none";
searchBox.style.display="block";
loginMsg.textContent="";
})
.catch(error=>{
loginMsg.textContent="بيانات الدخول غير صحيحة";
console.error(error);
});
}

auth.onAuthStateChanged(user=>{
if(user){
currentUid=user.uid;
loginBox.style.display="none";
searchBox.style.display="block";
}else{
currentUid=null;
loginBox.style.display="block";
searchBox.style.display="none";
}
});

function search(){
const n=accountInput.value.trim();

if(!/^[0-9]{7}$/.test(n)){
msg.textContent="أدخل رقم حساب مكون من 7 أرقام";
return;
}

msg.textContent="جاري البحث...";

db.ref("accountNumbers/"+n).once("value")
.then(a=>{
if(!a.exists())throw new Error("رقم الحساب غير موجود");

const uid=a.val().uid;
if(!uid)throw new Error("لا يوجد مستخدم مرتبط بالحساب");

currentUid=uid;
currentAccountNumber=n;

return db.ref("users/"+uid).once("value");
})
.then(u=>{
if(!u.exists())throw new Error("بيانات الحساب غير موجودة");

currentUserData=u.val();

set("rAccount",currentAccountNumber);
set("rName",currentUserData.username);
set("rActive",currentUserData.active?"مفعل":"غير مفعل");
set("rSub",currentUserData.subscriptionName);
set("rStart",date(currentUserData.subscriptionStart));
set("rEnd",date(currentUserData.subscriptionEnd));

result.style.display="block";
msg.textContent="تم العثور على الحساب";
})
.catch(e=>msg.textContent=e.message);
}

function renew(){
if(!currentUid||!currentUserData)return;

const days=Number(document.getElementById("period").value);
const now=Date.now();
const old=Number(currentUserData.subscriptionEnd)||0;
const start=old>now?old:now;
const end=start+days*86400000;

db.ref("users/"+currentUid).update({
active:true,
subscriptionStart:start,
subscriptionEnd:end,
subscriptionName:document.getElementById("period").selectedOptions[0].text
})
.then(()=>{
currentUserData.subscriptionEnd=end;
currentUserData.subscriptionStart=start;
currentUserData.active=true;

set("rActive","مفعل");
set("rSub",currentUserData.subscriptionName);
set("rStart",date(start));
set("rEnd",date(end));

alert("تم تجديد الاشتراك بنجاح");
})
.catch(e=>alert("تعذر التجديد: "+e.message));
}

function set(id,value){
document.getElementById(id).textContent=value||"—";
}

function date(x){
return x?new Date(x).toLocaleString("ar"):"—";
}
