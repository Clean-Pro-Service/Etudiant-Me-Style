
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getFirestore, collection, onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { firebaseConfig, WHATSAPP_NUMBER } from "./config.js";

const demoProducts = [
  {id:"demo1",name:"T-shirt essentiel",category:"Vêtements",price:2500,tag:"Indispensable",style:"Streetwear",description:"Un basique facile à associer.",emoji:"👕",tone:"#e8d7b6",active:true},
  {id:"demo2",name:"Chemise campus",category:"Vêtements",price:4500,tag:"Look chic",style:"Chic & soigné",description:"Pour un look soigné en cours.",emoji:"👔",tone:"#d8e0d4",active:true},
  {id:"demo3",name:"Jean décontracté",category:"Vêtements",price:6000,tag:"Facile à porter",style:"Streetwear",description:"Un jean pour tous les jours.",emoji:"👖",tone:"#cbd6e6",active:true},
  {id:"demo4",name:"Baskets urbaines",category:"Chaussures",price:8500,tag:"Style du jour",style:"Streetwear",description:"Des baskets pour compléter ton outfit.",emoji:"👟",tone:"#e8d6d0",active:true},
  {id:"demo5",name:"Sac pratique",category:"Accessoires",price:5000,tag:"Campus",style:"Minimal & confortable",description:"Pratique pour les journées de cours.",emoji:"🎒",tone:"#e7c7a0",active:true},
  {id:"demo6",name:"Lunettes tendance",category:"Accessoires",price:2000,tag:"Petit détail",style:"Chic & soigné",description:"La touche finale du look.",emoji:"🕶️",tone:"#ded8e8",active:true},
  {id:"demo7",name:"Mèches à tresser",category:"Beauté & mèches",price:3000,tag:"Beauté",style:"Beauté & coiffure",description:"À confirmer selon longueur et couleur.",emoji:"✨",tone:"#dfc2a7",active:true},
  {id:"demo8",name:"Accessoires cheveux",category:"Beauté & mèches",price:1500,tag:"À découvrir",style:"Beauté & coiffure",description:"Accessoires pour compléter ta coiffure.",emoji:"🎀",tone:"#ead3dd",active:true}
];

const grid = document.getElementById("product-grid");

if (grid) {
  let products = demoProducts;
  let usingDemo = true;
  let activeCategory = "Tout";
  let activeStyle = "";
  let cart = [];

  const $ = id => document.getElementById(id);
  const search = $("search");
  const count = $("cart-count");
  const cartItems = $("cart-items");
  const total = $("cart-total");
  const toast = $("toast");
  const catalogueNote = $("catalogue-note");

  const formatMoney = n =>
    new Intl.NumberFormat("fr-FR").format(Number(n) || 0) + " FCFA";

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, c => ({
      "&":"&amp;", "<":"&lt;", ">":"&gt;",
      '"':"&quot;", "'":"&#39;"
    }[c]));
  }

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove("show"), 2500);
  }

  function visibleProducts() {
    const q = (search?.value || "").trim().toLocaleLowerCase("fr");

    return products.filter(p =>
      p.active !== false &&
      (activeCategory === "Tout" || p.category === activeCategory) &&
      (!activeStyle || p.style === activeStyle) &&
      (!q || `${p.name} ${p.category} ${p.style || ""} ${p.description || ""}`
        .toLocaleLowerCase("fr").includes(q))
    );
  }

  function stockOf(product) {
    if (product.stock === null || product.stock === undefined || product.stock === "") {
      return null;
    }
    const n = Number(product.stock);
    return Number.isFinite(n) && n >= 0 ? n : null;
  }

  function renderProducts() {
    const list = visibleProducts();

    if (!list.length) {
      grid.innerHTML = '<p class="muted">Aucun article trouvé pour le moment.</p>';
      return;
    }

    grid.innerHTML = list.map(p => {
      const isKit = p.type === "kit";
      const stock = stockOf(p);
      const unavailable = stock === 0;

      return `
        <article class="product-card">
          <div class="product-image" style="background:${escapeHtml(p.tone || "#eee7dc")}">
            ${p.imageUrl ? `<img src="${escapeHtml(p.imageUrl)}" alt="${escapeHtml(p.name)}" loading="lazy" onerror="this.style.display='none'">` : ""}
            <div class="product-placeholder" aria-hidden="true">${escapeHtml(p.emoji || "🛍️")}</div>
            <span class="product-tag">${escapeHtml(p.tag || (isKit ? "Kit complet" : p.category))}</span>
          </div>
          <div class="product-info">
            <span class="product-category">${escapeHtml(p.category || "")}</span>
            <h3>${escapeHtml(p.name)}</h3>
            <p class="muted">${escapeHtml(p.description || "")}</p>
            ${isKit ? '<p class="muted">Kit à prix fixe · Options selon disponibilité</p>' : ""}
            ${stock === 0 ? '<p class="muted">Rupture de stock</p>' : ""}
            <div class="product-bottom">
              <span class="price">${formatMoney(p.price)}</span>
              <button class="add-button" data-add="${escapeHtml(p.id)}"
                ${unavailable ? "disabled" : ""}
                aria-label="Choisir ${escapeHtml(p.name)}">+</button>
            </div>
          </div>
        </article>`;
    }).join("");

    grid.querySelectorAll("[data-add]").forEach(button => {
      button.addEventListener("click", () => addToCart(button.dataset.add));
    });
  }

  // Demande les choix dans des fenêtres simples, compatibles avec un téléphone.
  function askChoice(label, placeholder, required = false) {
    const value = window.prompt(label + (placeholder ? `\nExemple : ${placeholder}` : ""));
    if (value === null) return { cancelled: true };
    const clean = value.trim();
    if (required && !clean) {
      showToast("Ce choix est obligatoire.");
      return { cancelled: true };
    }
    return { value: clean };
  }

  function getOptions(product) {
    const choices = {};
    const kit = product.kit || {};

    if (product.type === "kit") {
      if (kit.top) {
        const answer = askChoice("Taille du haut :", "S, M, L ou XL", true);
        if (answer.cancelled) return null;
        choices["Taille du haut"] = answer.value;
      }

      if (kit.bottom) {
        const answer = askChoice("Taille du bas :", "38, 40, 42 ou 44", true);
        if (answer.cancelled) return null;
        choices["Taille du bas"] = answer.value;
      }

      if (kit.shoes) {
        const answer = askChoice(
          "Ajouter des chaussures ? Écris oui ou non :",
          "oui / non",
          true
        );
        if (answer.cancelled) return null;

        if (/^(oui|o|yes)$/i.test(answer.value)) {
          const size = askChoice("Pointure des chaussures :", "39, 40, 41, 42 ou 43", true);
          if (size.cancelled) return null;
          choices["Chaussures"] = "Oui, pointure " + size.value;
        } else if (/^(non|n|no)$/i.test(answer.value)) {
          choices["Chaussures"] = "Non";
        } else {
          showToast("Réponds par oui ou non pour les chaussures.");
          return null;
        }
      }

      if (kit.watch) {
        const answer = askChoice("Ajouter une montre ? Écris oui ou non :", "oui / non", true);
        if (answer.cancelled) return null;

        if (/^(oui|o|yes)$/i.test(answer.value)) {
          choices["Montre"] = "Oui";
        } else if (/^(non|n|no)$/i.test(answer.value)) {
          choices["Montre"] = "Non";
        } else {
          showToast("Réponds par oui ou non pour la montre.");
          return null;
        }
      }
    } else if (product.options) {
      const answer = askChoice(
        "Choisis la taille, la couleur ou la variante pour " + product.name + " :",
        product.options,
        true
      );
      if (answer.cancelled) return null;
      choices["Option choisie"] = answer.value;
    }

    return choices;
  }

  function addToCart(id) {
    const product = products.find(p => String(p.id) === String(id));
    if (!product || product.active === false) return;

    const stock = stockOf(product);
    const alreadyInCart = cart
      .filter(item => String(item.id) === String(id))
      .reduce((sum, item) => sum + item.qty, 0);

    if (stock !== null && alreadyInCart >= stock) {
      showToast("Stock insuffisant pour cet article.");
      return;
    }

    const choices = getOptions(product);
    if (choices === null) return;

    const key = JSON.stringify([String(id), choices]);
    const existing = cart.find(item => item.key === key);

    if (existing) {
      if (stock !== null && alreadyInCart + 1 > stock) {
        showToast("Stock insuffisant pour cette quantité.");
        return;
      }
      existing.qty++;
    } else {
      cart.push({
        key,
        id: String(id),
        qty: 1,
        choices
      });
    }

    renderCart();
    showToast("Article ajouté au panier.");
  }

  function changeQty(key, delta) {
    const item = cart.find(x => x.key === key);
    if (!item) return;

    const product = products.find(p => String(p.id) === item.id);
    if (!product) return;

    const nextQty = item.qty + delta;
    const stock = stockOf(product);
    const totalSameProduct = cart
      .filter(x => x.id === item.id)
      .reduce((sum, x) => sum + x.qty, 0);

    if (delta > 0 && stock !== null && totalSameProduct >= stock) {
      showToast("Stock insuffisant.");
      return;
    }

    if (nextQty < 1) {
      cart = cart.filter(x => x.key !== key);
    } else {
      item.qty = nextQty;
    }

    renderCart();
  }

  function renderCart() {
    if (!count || !cartItems || !total) return;

    count.textContent = cart.reduce((sum, item) => sum + item.qty, 0);

    const sum = cart.reduce((acc, item) => {
      const product = products.find(p => String(p.id) === item.id);
      return acc + (product ? (Number(product.price) || 0) * item.qty : 0);
    }, 0);

    total.textContent = formatMoney(sum);

    if (!cart.length) {
      cartItems.innerHTML = '<p class="empty-cart">Ton panier est vide pour le moment.</p>';
      return;
    }

    cartItems.innerHTML = cart.map(item => {
      const product = products.find(p => String(p.id) === item.id);
      if (!product) return "";

      const choices = Object.entries(item.choices || {})
        .map(([name, value]) => `<small>${escapeHtml(name)} : ${escapeHtml(value)}</small>`)
        .join("");

      return `
        <div class="cart-item">
          <div>
            <strong>${escapeHtml(product.name)}</strong>
            ${choices}
            <small>${formatMoney(product.price)} l'unité</small>
            <small>Sous-total : ${formatMoney(Number(product.price) * item.qty)}</small>
          </div>
          <div class="quantity-controls">
            <button data-qty="${escapeHtml(item.key)}" data-delta="-1" aria-label="Retirer un article">−</button>
            <span>${item.qty}</span>
            <button data-qty="${escapeHtml(item.key)}" data-delta="1" aria-label="Ajouter un article">+</button>
          </div>
        </div>`;
    }).join("");

    cartItems.querySelectorAll("[data-qty]").forEach(button => {
      button.addEventListener("click", () =>
        changeQty(button.dataset.qty, Number(button.dataset.delta))
      );
    });
  }

  function openCart() {
    document.body.classList.add("cart-open");
    $("cart-drawer")?.setAttribute("aria-hidden", "false");
  }

  function closeCart() {
    document.body.classList.remove("cart-open");
    $("cart-drawer")?.setAttribute("aria-hidden", "true");
  }

  $("open-cart")?.addEventListener("click", openCart);
  $("close-cart")?.addEventListener("click", closeCart);
  $("cart-backdrop")?.addEventListener("click", closeCart);

  search?.addEventListener("input", renderProducts);

  document.querySelectorAll("[data-category]").forEach(button => {
    button.addEventListener("click", () => {
      activeCategory = button.dataset.category;
      activeStyle = "";

      document.querySelectorAll("[data-category]").forEach(element =>
        element.classList.toggle("active", element === button)
      );

      renderProducts();
    });
  });

  document.querySelectorAll("[data-look]").forEach(button => {
    button.addEventListener("click", () => {
      activeStyle = button.dataset.look;
      activeCategory = "Tout";

      document.querySelectorAll("[data-category]").forEach(element =>
        element.classList.toggle("active", element.dataset.category === "Tout")
      );

      if (search) search.value = "";
      $("boutique")?.scrollIntoView({ behavior: "smooth" });
      renderProducts();
    });
  });

  $("whatsapp-order")?.addEventListener("click", () => {
    if (!cart.length) {
      showToast("Ajoute au moins un article avant de commander.");
      return;
    }

    const lines = [];

    for (const item of cart) {
      const product = products.find(p => String(p.id) === item.id);
      if (!product) continue;

      const stock = stockOf(product);
      if (product.active === false || (stock !== null && item.qty > stock)) {
        showToast(`Disponibilité à vérifier : ${product.name}.`);
        return;
      }

      lines.push(
        `• ${product.name} x${item.qty} — ${formatMoney(Number(product.price) * item.qty)}`,
        ...Object.entries(item.choices || {}).map(([name, value]) => `   - ${name} : ${value}`)
      );
    }

    const sum = cart.reduce((acc, item) => {
      const product = products.find(p => String(p.id) === item.id);
      return acc + (product ? (Number(product.price) || 0) * item.qty : 0);
    }, 0);

    const message = [
      "Bonjour Étudiant Mé Style ! Je souhaite commander :",
      "",
      ...lines,
      "",
      `Total estimé : ${formatMoney(sum)}`,
      "",
      "Merci de confirmer la disponibilité, les tailles et les frais de livraison."
    ].join("\n");

    window.open(
      `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`,
      "_blank"
    );
  });

  if ($("year")) $("year").textContent = new Date().getFullYear();

  renderProducts();
  renderCart();

  // Synchronisation avec le catalogue Firebase.
  try {
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    onSnapshot(collection(db, "products"), snapshot => {
      const remoteProducts = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));

      usingDemo = remoteProducts.length === 0;
      products = usingDemo ? demoProducts : remoteProducts;

      if (catalogueNote) {
        catalogueNote.textContent = usingDemo
          ? "Catalogue de démonstration : ajoute tes vrais produits dans l'espace administrateur."
          : "Catalogue synchronisé avec Étudiant Mé Style. Disponibilité à confirmer avant validation.";
      }

      // Retire du panier les articles supprimés ou masqués.
      cart = cart.filter(item =>
        products.some(p => String(p.id) === item.id && p.active !== false)
      );

      renderProducts();
      renderCart();
    }, error => {
      console.error("Erreur de lecture Firebase :", error);
      if (catalogueNote) {
        catalogueNote.textContent = "Impossible de charger le catalogue en direct. Vérifie la connexion et les règles Firestore.";
      }
    });
  } catch (error) {
    console.error("Initialisation Firebase impossible :", error);
    if (catalogueNote) {
      catalogueNote.textContent = "Catalogue de démonstration : vérifie la configuration Firebase.";
    }
  }
}
