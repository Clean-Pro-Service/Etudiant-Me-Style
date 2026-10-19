
import { firebaseConfig, ADMIN_EMAIL } from "./config.js";

import {
  initializeApp,
  getApps
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";

import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
  getFirestore,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const $ = id => document.getElementById(id);

const notice = $("notice");
const loginCard = $("login-card");
const adminContent = $("admin-content");
const logoutBtn = $("logout");
const form = $("product-form");
const list = $("admin-products");

let auth = null;
let db = null;
let currentUser = null;
let editingId = null;
let unsubscribe = null;
let products = [];
let adminMode = "product";

function message(text, type = "") {
  if (!notice) return;
  notice.className = "admin-message" + (type ? " " + type : "");
  notice.textContent = text;
}

function readyConfig() {
  return (
    firebaseConfig &&
    !Object.values(firebaseConfig).some(v =>
      String(v).includes("COLLE_ICI") ||
      String(v).includes("TON-PROJET")
    ) &&
    ADMIN_EMAIL &&
    !ADMIN_EMAIL.includes("TON_EMAIL")
  );
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[c]));
}

function money(value) {
  return new Intl.NumberFormat("fr-FR").format(
    Number(value) || 0
  ) + " FCFA";
}

function isAdmin() {
  return Boolean(
    currentUser &&
    currentUser.email?.toLowerCase() ===
      ADMIN_EMAIL.toLowerCase()
  );
}

if (!readyConfig()) {
  message(
    "Vérifie la configuration Firebase et l'adresse ADMIN_EMAIL dans config.js.",
    "error"
  );
} else {
  try {
    const app = getApps().length
      ? getApps()[0]
      : initializeApp(firebaseConfig);

    auth = getAuth(app);
    db = getFirestore(app);

    onAuthStateChanged(auth, user => {
      currentUser = user;

      if (isAdmin()) {
        loginCard?.classList.add("hidden");
        adminContent?.classList.remove("hidden");
        logoutBtn?.classList.remove("hidden");

        message(
          "Connecté comme administrateur. Tu peux gérer les produits, kits et outfits.",
          "success"
        );

        watchProducts();
      } else {
        if (unsubscribe) {
          unsubscribe();
          unsubscribe = null;
        }

        if (user) signOut(auth);

        loginCard?.classList.remove("hidden");
        adminContent?.classList.add("hidden");
        logoutBtn?.classList.add("hidden");

        if (user) {
          message(
            "Cette adresse n'est pas autorisée comme administrateur.",
            "error"
          );
        }
      }
    });
  } catch (error) {
    console.error(error);
    message(
      "Connexion Firebase impossible. Vérifie config.js.",
      "error"
    );
  }
}

$("login-form")?.addEventListener("submit", async event => {
  event.preventDefault();

  if (!auth) {
    message("Vérifie d'abord la configuration Firebase.", "error");
    return;
  }

  try {
    await signInWithEmailAndPassword(
      auth,
      $("email").value.trim(),
      $("password").value
    );
  } catch (error) {
    console.error(error);
    message(
      "Connexion impossible. Vérifie ton e-mail, ton mot de passe et Firebase Authentication.",
      "error"
    );
  }
});

logoutBtn?.addEventListener("click", async () => {
  if (auth) await signOut(auth);

  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
});

function watchProducts() {
  if (!db || !isAdmin()) return;

  if (unsubscribe) unsubscribe();

  unsubscribe = onSnapshot(
    collection(db, "products"),
    snapshot => {
      products = snapshot.docs.map(item => ({
        id: item.id,
        ...item.data()
      }));

      renderProducts();
    },
    error => {
      console.error(error);
      message(
        "Lecture impossible. Vérifie les règles Firestore.",
        "error"
      );
    }
  );
}

/*
  Les trois catégories utilisent la collection products.
  Les anciens produits sans type restent des produits classiques.
*/
function productType(product) {
  return product.type || "product";
}

function typeLabel(product) {
  const type = productType(product);

  if (type === "kit") return "Kit étudiant";
  if (type === "outfit") return "Outfit publié";

  return "Produit";
}

function renderProducts() {
  const count = $("product-count");

  if (count) {
    count.textContent =
      `${products.length} élément${products.length === 1 ? "" : "s"}`;
  }

  if (!list) return;

  if (!products.length) {
    list.innerHTML =
      '<p class="muted">Aucun élément enregistré pour le moment.</p>';
    return;
  }

  const filtered = products.filter(product => {
    if (adminMode === "kit") {
      return productType(product) === "kit";
    }

    if (adminMode === "outfit") {
      return productType(product) === "outfit";
    }

    return productType(product) === "product";
  });

  if (!filtered.length) {
    list.innerHTML =
      '<p class="muted">Aucun élément dans cette catégorie pour le moment.</p>';
    return;
  }

  list.innerHTML = filtered.map(product => {
    const images = Array.isArray(product.images)
      ? product.images.length
      : (product.imageUrl ? 1 : 0);

    const outfitItems = Array.isArray(product.itemIds)
      ? product.itemIds.length
      : 0;

    return `
      <article class="admin-product">
        <div>
          <strong>
            ${escapeHtml(product.name)} —
            ${money(product.price)}
          </strong>

          <p>
            ${escapeHtml(typeLabel(product))} ·
            ${escapeHtml(product.category || "Sans catégorie")} ·
            ${product.active === false ? "Masqué" : "Publié"}
          </p>

          <p>${escapeHtml(product.description || "")}</p>

          <p>
            Tailles/couleurs :
            ${escapeHtml(product.options || "Non précisées")}
            · Stock :
            ${escapeHtml(product.stock ?? "Non précisé")}
          </p>

          <p>
            Photos : ${images}
            ${productType(product) === "outfit"
              ? ` · Articles associés : ${outfitItems}`
              : ""}
          </p>
        </div>

        <div class="admin-product-actions">
          <button
            class="small-btn"
            type="button"
            data-edit="${escapeHtml(product.id)}">
            Modifier
          </button>

          <button
            class="small-btn danger"
            type="button"
            data-delete="${escapeHtml(product.id)}">
            Supprimer
          </button>
        </div>
      </article>
    `;
  }).join("");

  list.querySelectorAll("[data-edit]").forEach(button => {
    button.addEventListener("click", () => {
      editProduct(button.dataset.edit);
    });
  });

  list.querySelectorAll("[data-delete]").forEach(button => {
    button.addEventListener("click", () => {
      removeProduct(button.dataset.delete);
    });
  });
}

/*
  Création et modification : les champs existants sont conservés.
  Les champs supplémentaires sont utilisés s'ils sont ajoutés
  ensuite dans admin.html.
*/
function fieldValue(id, fallback = "") {
  const element = $(id);
  return element ? element.value : fallback;
}

function checkboxValue(id, fallback = true) {
  const element = $(id);
  return element ? element.checked : fallback;
}

function setValue(id, value) {
  const element = $(id);
  if (element) element.value = value ?? "";
}

function setChecked(id, value) {
  const element = $(id);
  if (element) element.checked = Boolean(value);
}

function resetForm() {
  editingId = null;
  form?.reset();

  setChecked("p-active", true);
  setValue("p-emoji", "🛍️");
  setValue("p-type", adminMode);

  if ($("form-title")) {
    $("form-title").textContent = "Ajouter un élément";
  }

  if ($("save-product")) {
    $("save-product").textContent = "Enregistrer";
  }

  $("cancel-edit")?.classList.add("hidden");
}

function editProduct(id) {
  const product = products.find(item => item.id === id);
  if (!product) return;

  editingId = id;
  adminMode = productType(product);

  setValue("p-name", product.name);
  setValue("p-category", product.category || "Vêtements");
  setValue("p-price", product.price);
  setValue("p-style", product.style || "Streetwear");
  setValue("p-options", product.options);
  setValue("p-stock", product.stock);
  setValue("p-description", product.description);
  setValue("p-image", product.imageUrl);
  setValue(
    "p-images",
    Array.isArray(product.images) ? product.images.join("\n") : ""
  );
  setValue("p-tag", product.tag);
  setValue("p-emoji", product.emoji || "🛍️");
  setValue("p-type", adminMode);
  setValue(
    "p-item-ids",
    Array.isArray(product.itemIds) ? product.itemIds.join(", ") : ""
  );

  setChecked("p-active", product.active !== false);

  if ($("form-title")) {
    $("form-title").textContent = "Modifier : " + product.name;
  }

  if ($("save-product")) {
    $("save-product").textContent = "Enregistrer les modifications";
  }

  $("cancel-edit")?.classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });

  renderProducts();
}

async function removeProduct(id) {
  if (!isAdmin()) {
    message("Connexion administrateur requise.", "error");
    return;
  }

  if (!confirm("Supprimer définitivement cet élément ?")) return;

  try {
    await deleteDoc(doc(db, "products", id));
    message("Élément supprimé.", "success");
  } catch (error) {
    console.error(error);
    message("Suppression impossible. Vérifie les règles Firestore.", "error");
  }
}

$("cancel-edit")?.addEventListener("click", resetForm);

/*
  Boutons de navigation facultatifs.
  Ils fonctionneront lorsque les boutons correspondants
  seront ajoutés à admin.html.
*/
function setAdminMode(mode) {
  if (!["product", "kit", "outfit"].includes(mode)) return;

  adminMode = mode;
  resetForm();

  const labels = {
    product: "Ajouter un produit",
    kit: "Créer un kit étudiant",
    outfit: "Créer un outfit"
  };

  if ($("form-title")) {
    $("form-title").textContent = labels[mode];
  }

  setValue("p-type", mode);
  renderProducts();
}

document.querySelectorAll("[data-admin-mode]").forEach(button => {
  button.addEventListener("click", () => {
    setAdminMode(button.dataset.adminMode);
  });
});

form?.addEventListener("submit", async event => {
  event.preventDefault();

  if (!isAdmin()) {
    message("Connexion administrateur requise.", "error");
    return;
  }

  const type = fieldValue("p-type", adminMode);

  if (!["product", "kit", "outfit"].includes(type)) {
    message("Type d'élément invalide.", "error");
    return;
  }

  const rawImages = fieldValue("p-images")
    .split(/\n|,/)
    .map(value => value.trim())
    .filter(Boolean);

  const primaryImage = fieldValue("p-image").trim();

  const images = [
    ...new Set([
      ...(primaryImage ? [primaryImage] : []),
      ...rawImages
    ])
  ];

  const rawItemIds = fieldValue("p-item-ids");

  const itemIds = rawItemIds
    .split(",")
    .map(value => value.trim())
    .filter(Boolean);

  const price = Number(fieldValue("p-price"));

  if (!fieldValue("p-name").trim()) {
    message("Saisis le nom de l'élément.", "error");
    return;
  }

  if (!Number.isFinite(price) || price < 0) {
    message("Saisis un prix valide.", "error");
    return;
  }

  if (type === "outfit" && itemIds.length === 0) {
    message(
      "Pour un outfit composé d'articles, ajoute leurs identifiants dans le champ prévu. Ce champ sera remplacé par un sélecteur visuel dans la prochaine étape.",
      "error"
    );
    return;
  }

  const data = {
    name: fieldValue("p-name").trim(),
    category: fieldValue("p-category", "Vêtements"),
    price,
    style: fieldValue("p-style", "Streetwear"),
    options: fieldValue("p-options").trim(),
    stock: fieldValue("p-stock") === ""
      ? null
      : Number(fieldValue("p-stock")),
    description: fieldValue("p-description").trim(),
    imageUrl: primaryImage || images[0] || "",
    images,
    itemIds: type === "outfit" ? itemIds : [],
    type,
    tag: fieldValue("p-tag").trim() || (
      type === "kit"
        ? "Kit étudiant"
        : type === "outfit"
          ? "Outfit"
          : "À découvrir"
    ),
    emoji: fieldValue("p-emoji").trim() || "🛍️",
    tone: "#eee7dc",
    active: checkboxValue("p-active", true),
    updatedAt: serverTimestamp()
  };

  try {
    if (editingId) {
      await updateDoc(doc(db, "products", editingId), data);
      message("Élément mis à jour dans Firebase.", "success");
    } else {
      await addDoc(collection(db, "products"), {
        ...data,
        createdAt: serverTimestamp()
      });
      message("Élément enregistré dans Firebase.", "success");
    }

    resetForm();
  } catch (error) {
    console.error(error);
    message(
      "Enregistrement impossible. Vérifie Firestore et ses règles de sécurité.",
      "error"
    );
  }
});
