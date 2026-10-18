import { firebaseConfig, ADMIN_EMAIL } from "./config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, updateDoc, deleteDoc, doc, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const notice=document.getElementById("notice"),loginCard=document.getElementById("login-card"),adminContent=document.getElementById("admin-content"),logoutBtn=document.getElementById("logout"),form=document.getElementById("product-form"),list=document.getElementById("admin-products");
let auth,db,currentUser=null,editingId=null,unsubscribe=null,products=[];
const $=id=>document.getElementById(id);
function message(text,type=""){notice.className="admin-message"+(type?" "+type:"");notice.textContent=text}
function readyConfig(){return !Object.values(firebaseConfig).some(v=>String(v).includes("COLLE_ICI")||String(v).includes("TON-PROJET"))&&!ADMIN_EMAIL.includes("TON_EMAIL")}
if(!readyConfig()){
  message("Configuration nécessaire : crée un projet Firebase gratuit, active Authentication par e-mail/mot de passe et Firestore, puis complète config.js. Consulte README.txt pour les étapes. Tant que ce n'est pas fait, les produits ne peuvent pas être partagés entre tous les visiteurs.","error");
}
try {
 if(readyConfig()){
  const app=initializeApp(firebaseConfig);auth=getAuth(app);db=getFirestore(app);
  onAuthStateChanged(auth,user=>{
   currentUser=user;
   if(user && user.email?.toLowerCase()===ADMIN_EMAIL.toLowerCase()){
    loginCard.classList.add("hidden");adminContent.classList.remove("hidden");logoutBtn.classList.remove("hidden");message("Connecté comme administrateur. Les produits enregistrés seront visibles sur la boutique.","success");watchProducts();
   }else{
    if(user) signOut(auth);
    loginCard.classList.remove("hidden");adminContent.classList.add("hidden");logoutBtn.classList.add("hidden");
    if(user)message("Cette adresse n'est pas autorisée comme administrateur.","error");
   }
  });
 }
}catch(e){message("Firebase n'est pas encore configuré. Vérifie config.js et les réglages du projet.","error")}
$("login-form").addEventListener("submit",async e=>{
 e.preventDefault();if(!auth){message("Configure d'abord Firebase en suivant README.txt.","error");return}
 try{await signInWithEmailAndPassword(auth,$("email").value.trim(),$("password").value);message("Connexion réussie.","success")}
 catch(err){message("Connexion impossible. Vérifie l'e-mail, le mot de passe et l'activation de la connexion par e-mail dans Firebase.","error")}
});
logoutBtn.addEventListener("click",async()=>{if(auth)await signOut(auth);if(unsubscribe)unsubscribe()});
function watchProducts(){if(unsubscribe)unsubscribe();unsubscribe=onSnapshot(collection(db,"products"),snap=>{products=snap.docs.map(d=>({id:d.id,...d.data()}));renderProducts()},err=>message("Impossible de lire les produits. Vérifie les règles Firestore indiquées dans README.txt.","error"))}
function escapeHtml(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function renderProducts(){
 $("product-count").textContent=`${products.length} produit${products.length>1?"s":""}`;
 if(!products.length){list.innerHTML='<p class="muted">Aucun produit pour le moment. Utilise le formulaire ci-dessus pour ajouter le premier.</p>';return}
 list.innerHTML=products.map(p=>`<div class="admin-product"><div><strong>${escapeHtml(p.name)} — ${new Intl.NumberFormat("fr-FR").format(Number(p.price)||0)} FCFA</strong><p>${escapeHtml(p.category)} · ${escapeHtml(p.style||"")} · ${p.active===false?"Masqué":"Publié"}</p><p>${escapeHtml(p.description||"")}</p><p>Tailles/couleurs : ${escapeHtml(p.options||"non précisé")} · Stock : ${escapeHtml(p.stock??"non précisé")}</p></div><div class="admin-product-actions"><button class="small-btn" data-edit="${p.id}">Modifier</button><button class="small-btn danger" data-delete="${p.id}">Supprimer</button></div></div>`).join("");
 list.querySelectorAll("[data-edit]").forEach(b=>b.addEventListener("click",()=>editProduct(b.dataset.edit)));
 list.querySelectorAll("[data-delete]").forEach(b=>b.addEventListener("click",()=>removeProduct(b.dataset.delete)));
}
function resetForm(){editingId=null;form.reset();$("p-active").checked=true;$("p-emoji").value="🛍️";$("form-title").textContent="Ajouter un produit";$("save-product").textContent="Enregistrer le produit";$("cancel-edit").classList.add("hidden")}
function editProduct(id){
 const p=products.find(x=>x.id===id);if(!p)return;editingId=id;
 $("p-name").value=p.name||"";$("p-category").value=p.category||"Vêtements";$("p-price").value=p.price??"";$("p-style").value=p.style||"Streetwear";$("p-options").value=p.options||"";$("p-stock").value=p.stock??"";$("p-description").value=p.description||"";$("p-image").value=p.imageUrl||"";$("p-tag").value=p.tag||"";$("p-emoji").value=p.emoji||"🛍️";$("p-active").checked=p.active!==false;
 $("form-title").textContent="Modifier un produit";$("save-product").textContent="Enregistrer les modifications";$("cancel-edit").classList.remove("hidden");window.scrollTo({top:0,behavior:"smooth"});
}
async function removeProduct(id){if(!confirm("Supprimer définitivement ce produit ?"))return;try{await deleteDoc(doc(db,"products",id));message("Produit supprimé.","success")}catch(e){message("Suppression impossible. Vérifie les règles Firestore.","error")}}
$("cancel-edit").addEventListener("click",resetForm);
form.addEventListener("submit",async e=>{
 e.preventDefault();if(!currentUser||currentUser.email?.toLowerCase()!==ADMIN_EMAIL.toLowerCase()){message("Connexion administrateur requise.","error");return}
 const data={name:$("p-name").value.trim(),category:$("p-category").value,price:Number($("p-price").value),style:$("p-style").value,options:$("p-options").value.trim(),stock:$("p-stock").value===""?null:Number($("p-stock").value),description:$("p-description").value.trim(),imageUrl:$("p-image").value.trim(),tag:$("p-tag").value.trim()||"À découvrir",emoji:$("p-emoji").value.trim()||"🛍️",tone:"#eee7dc",active:$("p-active").checked,updatedAt:serverTimestamp()};
 try{
  if(editingId){await updateDoc(doc(db,"products",editingId),data);message("Produit mis à jour. La boutique publique se synchronisera automatiquement.","success")}
  else{await addDoc(collection(db,"products"),{...data,createdAt:serverTimestamp()});message("Produit ajouté ! Il apparaîtra sur la boutique publique.","success")}
  resetForm();
 }catch(err){message("Enregistrement impossible. Vérifie que Firestore est créé et que ses règles autorisent uniquement ton compte administrateur à écrire.","error")}
});
