import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getFirestore, collection, getDocs, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { firebaseConfig, WHATSAPP_NUMBER } from "./config.js";

const demoProducts = [
  {id:"demo1",name:"T-shirt essentiel",category:"Vêtements",price:2500,tag:"Indispensable",style:"Streetwear",description:"Un basique facile à associer.",imageUrl:"",emoji:"👕",tone:"#e8d7b6",active:true},
  {id:"demo2",name:"Chemise campus",category:"Vêtements",price:4500,tag:"Look chic",style:"Chic & soigné",description:"Pour un look soigné en cours.",imageUrl:"",emoji:"👔",tone:"#d8e0d4",active:true},
  {id:"demo3",name:"Jean décontracté",category:"Vêtements",price:6000,tag:"Facile à porter",style:"Streetwear",description:"Un jean pour tous les jours.",imageUrl:"",emoji:"👖",tone:"#cbd6e6",active:true},
  {id:"demo4",name:"Baskets urbaines",category:"Chaussures",price:8500,tag:"Style du jour",style:"Streetwear",description:"Des baskets pour compléter ton outfit.",imageUrl:"",emoji:"👟",tone:"#e8d6d0",active:true},
  {id:"demo5",name:"Sac pratique",category:"Accessoires",price:5000,tag:"Campus",style:"Minimal & confortable",description:"Pratique pour les journées de cours.",imageUrl:"",emoji:"🎒",tone:"#e7c7a0",active:true},
  {id:"demo6",name:"Lunettes tendance",category:"Accessoires",price:2000,tag:"Petit détail",style:"Chic & soigné",description:"La touche finale du look.",imageUrl:"",emoji:"🕶️",tone:"#ded8e8",active:true},
  {id:"demo7",name:"Mèches à tresser",category:"Beauté & mèches",price:3000,tag:"Beauté",style:"Beauté & coiffure",description:"Mèches à confirmer selon la longueur et la couleur.",imageUrl:"",emoji:"✨",tone:"#dfc2a7",active:true},
  {id:"demo8",name:"Accessoires cheveux",category:"Beauté & mèches",price:1500,tag:"À découvrir",style:"Beauté & coiffure",description:"Accessoires pour compléter ta coiffure.",imageUrl:"",emoji:"🎀",tone:"#ead3dd",active:true}
];

const grid = document.getElementById("product-grid");
if (grid) {
  let products = demoProducts;
  let activeCategory = "Tout";
  let activeStyle = "";
  let cart = [];
  const search = document.getElementById("search");
  const count = document.getElementById("cart-count");
  const cartItems = document.getElementById("cart-items");
  const total = document.getElementById("cart-total");
  const toast = document.getElementById("toast");
  const catalogueNote = document.getElementById("catalogue-note");
  const formatMoney = n => new Intl.NumberFormat("fr-FR").format(n) + " FCFA";
  function showToast(msg) {
    toast.textContent = msg; toast.classList.add("show");
    clearTimeout(showToast.timer); showToast.timer = setTimeout(() => toast.classList.remove("show"), 2500);
  }
  function visibleProducts() {
    const q = search.value.trim().toLocaleLowerCase("fr");
    return products.filter(p => p.active !== false &&
      (activeCategory === "Tout" || p.category === activeCategory) &&
      (!activeStyle || p.style === activeStyle) &&
      (!q || `${p.name} ${p.category} ${p.style} ${p.description||""}`.toLocaleLowerCase("fr").includes(q)));
  }
  function renderProducts() {
    const list = visibleProducts();
    if (!list.length) { grid.innerHTML = '<p class="muted">Aucun article trouvé pour le moment.</p>'; return; }
    grid.innerHTML = list.map(p => `<article class="product-card">
      <div class="product-image" style="background:${p.tone||"#eee7dc"}">
        ${p.imageUrl ? `<img src="${escapeHtml(p.imageUrl)}" alt="${escapeHtml(p.name)}" loading="lazy" onerror="this.style.display='none'">` : ""}
        <div class="product-placeholder" aria-hidden="true">${escapeHtml(p.emoji||"🛍️")}</div>
        <span class="product-tag">${escapeHtml(p.tag||p.category)}</span>
      </div>
      <div class="product-info"><span class="product-category">${escapeHtml(p.category)}</span>
      <h3>${escapeHtml(p.name)}</h3><p class="muted">${escapeHtml(p.description||"")}</p>
      <div class="product-bottom"><span class="price">${formatMoney(Number(p.price)||0)}</span><button class="add-button" data-add="${escapeHtml(p.id)}" aria-label="Ajouter ${escapeHtml(p.name)} au panier">+</button></div></div>
      </article>`).join("");
    grid.querySelectorAll("[data-add]").forEach(b=>b.addEventListener("click",()=>addToCart(b.dataset.add)));
  }
  function escapeHtml(v) { return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
  function addToCart(id) {
    const p = products.find(x=>String(x.id)===String(id)); if(!p)return;
    const item=cart.find(x=>String(x.id)===String(id)); if(item)item.qty++;else cart.push({id,qty:1});
    renderCart();showToast("Article ajouté au panier.");
  }
  function changeQty(id,d) { const x=cart.find(i=>String(i.id)===String(id));if(!x)return;x.qty+=d;if(x.qty<1)cart=cart.filter(i=>String(i.id)!==String(id));renderCart(); }
  function renderCart() {
    count.textContent=cart.reduce((s,x)=>s+x.qty,0);
    const sum=cart.reduce((s,x)=>{const p=products.find(y=>String(y.id)===String(x.id));return s+(p?Number(p.price)*x.qty:0)},0);
    total.textContent=formatMoney(sum);
    if(!cart.length){cartItems.innerHTML='<p class="empty-cart">Ton panier est vide pour le moment.</p>';return;}
    cartItems.innerHTML=cart.map(x=>{const p=products.find(y=>String(y.id)===String(x.id));if(!p)return "";return `<div class="cart-item"><div><strong>${escapeHtml(p.name)}</strong><small>${formatMoney(p.price)} l'unité</small><small>Sous-total : ${formatMoney(p.price*x.qty)}</small></div><div class="quantity-controls"><button data-qty="${escapeHtml(p.id)}" data-delta="-1">−</button><span>${x.qty}</span><button data-qty="${escapeHtml(p.id)}" data-delta="1">+</button></div></div>`}).join("");
    cartItems.querySelectorAll("[data-qty]").forEach(b=>b.addEventListener("click",()=>changeQty(b.dataset.qty,Number(b.dataset.delta))));
  }
  function openCart(){document.body.classList.add("cart-open");document.getElementById("cart-drawer").setAttribute("aria-hidden","false")}
  function closeCart(){document.body.classList.remove("cart-open");document.getElementById("cart-drawer").setAttribute("aria-hidden","true")}
  document.getElementById("open-cart").addEventListener("click",openCart);
  document.getElementById("close-cart").addEventListener("click",closeCart);
  document.getElementById("cart-backdrop").addEventListener("click",closeCart);
  search.addEventListener("input",renderProducts);
  document.querySelectorAll("[data-category]").forEach(b=>b.addEventListener("click",()=>{activeCategory=b.dataset.category;activeStyle="";document.querySelectorAll("[data-category]").forEach(x=>x.classList.toggle("active",x===b));renderProducts()}));
  document.querySelectorAll("[data-look]").forEach(b=>b.addEventListener("click",()=>{activeStyle=b.dataset.look;activeCategory="Tout";document.querySelectorAll("[data-category]").forEach(x=>x.classList.toggle("active",x.dataset.category==="Tout"));search.value="";document.getElementById("boutique").scrollIntoView({behavior:"smooth"});renderProducts()}));
  document.getElementById("whatsapp-order").addEventListener("click",()=>{
    if(!cart.length){showToast("Ajoute au moins un article avant de commander.");return;}
    const lines=cart.map(x=>{const p=products.find(y=>String(y.id)===String(x.id));return `• ${p.name} x${x.qty} — ${formatMoney(p.price*x.qty)}`});
    const sum=cart.reduce((s,x)=>s+Number(products.find(y=>String(y.id)===String(x.id)).price)*x.qty,0);
    const msg=`Bonjour Étudiant Mé Style ! Je souhaite commander :\n\n${lines.join("\n")}\n\nTotal estimé : ${formatMoney(sum)}\n\nMerci de confirmer la disponibilité, les tailles/couleurs et les frais de livraison.`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`,"_blank","noopener");
  });
  document.getElementById("year").textContent=new Date().getFullYear();
  renderProducts();renderCart();

  const configLooksSet = !Object.values((await import("./config.js")).firebaseConfig).some(v=>String(v).includes("COLLE_ICI")||String(v).includes("TON-PROJET"));
  if (configLooksSet) {
    try {
      const {firebaseConfig}=await import("./config.js");
      const {initializeApp}=await import("https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js");
      const {getFirestore,collection,onSnapshot}=await import("https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js");
      const app=initializeApp(firebaseConfig);const db=getFirestore(app);
      onSnapshot(collection(db,"products"),snap=>{
        const remote=snap.docs.map(d=>({id:d.id,...d.data()}));
        if(remote.length){products=remote.filter(p=>p.active!==false);catalogueNote.textContent="Produits publiés par Étudiant Mé Style. Disponibilité à confirmer lors de la commande.";renderProducts();renderCart();}
      },err=>console.warn("Catalogue Firebase non disponible; affichage de démonstration.",err));
    } catch(e) { console.warn("Firebase pas encore configuré; catalogue de démonstration affiché.",e); }
  }
}