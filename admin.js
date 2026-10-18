
<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="theme-color" content="#171717">
  <title>Administration — Étudiant Mé Style</title>
  <link rel="stylesheet" href="style.css">
</head>
<body class="admin-page">
<header class="site-header">
  <a class="brand" href="index.html">
    <span class="brand-mark">ÉM</span>
    <span><strong>Étudiant Mé Style</strong><small>ESPACE ADMINISTRATEUR</small></span>
  </a>
  <a class="admin-link" href="index.html">Voir la boutique ↗</a>
</header>

<main class="admin-main">
  <div class="admin-top">
    <div>
      <p class="eyebrow">GESTION DE LA BOUTIQUE</p>
      <h1 style="font-size:clamp(30px,5vw,42px);margin:0">Ton espace admin</h1>
      <p class="admin-subtitle">Gère les articles, les kits, les prix et les stocks.</p>
    </div>
    <button id="logout" class="button button-light hidden">Déconnexion</button>
  </div>

  <div id="notice" class="admin-message">
    Connecte-toi pour gérer le catalogue.
  </div>

  <section id="login-card" class="admin-card admin-login">
    <h2>Connexion administrateur</h2>
    <p class="admin-subtitle">Utilise l'adresse autorisée dans la configuration Firebase.</p>
    <form id="login-form" class="admin-form">
      <label>E-mail administrateur
        <input id="email" type="email" required autocomplete="username">
      </label>
      <label>Mot de passe
        <input id="password" type="password" required minlength="6" autocomplete="current-password">
      </label>
      <button class="button button-dark full" type="submit">Se connecter</button>
    </form>
  </section>

  <div id="admin-content" class="hidden">
    <section class="admin-card">
      <h2 id="form-title">Ajouter un produit</h2>

      <form id="product-form" class="admin-form">
        <label>Nom du produit *
          <input id="p-name" required maxlength="90" placeholder="Ex. Kit campus chic">
        </label>

        <label>Type de produit *
          <select id="p-type" required>
            <option value="simple">Article simple</option>
            <option value="kit">Kit complet à prix fixe</option>
            <option value="variant">Article à variantes</option>
          </select>
        </label>

        <label>Catégorie *
          <select id="p-category" required>
            <option>Vêtements</option>
            <option>Chaussures</option>
            <option>Accessoires</option>
            <option>Beauté & mèches</option>
          </select>
        </label>

        <label>Prix en FCFA *
          <input id="p-price" type="number" min="0" step="50" required placeholder="Ex. 12000">
        </label>

        <label>Style / collection
          <select id="p-style">
            <option>Chic & soigné</option>
            <option>Streetwear</option>
            <option>Minimal & confortable</option>
            <option>Beauté & coiffure</option>
          </select>
        </label>

        <label>Tailles / couleurs disponibles
          <input id="p-options" maxlength="300" placeholder="Ex. S, M, L — noir, blanc">
        </label>

        <label>Stock disponible
          <input id="p-stock" type="number" min="0" step="1" placeholder="Ex. 5">
        </label>

        <div id="kit-fields" class="wide hidden">
          <h3>Composition du kit</h3>
          <p class="admin-subtitle">
            Le prix saisi ci-dessus couvre le kit. Les chaussures et la montre sont facultatives.
          </p>

          <label style="flex-direction:row;align-items:center">
            <input id="kit-top" type="checkbox" checked style="width:auto">
            Le kit comprend un haut
          </label>

          <label style="flex-direction:row;align-items:center">
            <input id="kit-bottom" type="checkbox" checked style="width:auto">
            Le kit comprend un bas
          </label>

          <label style="flex-direction:row;align-items:center">
            <input id="kit-shoes" type="checkbox" style="width:auto">
            Proposer des chaussures en option
          </label>

          <label style="flex-direction:row;align-items:center">
            <input id="kit-watch" type="checkbox" style="width:auto">
            Proposer une montre en option
          </label>
        </div>

        <label class="wide">Description
          <textarea id="p-description" maxlength="800"
            placeholder="Description, matière, coupe et conseils d'association…"></textarea>
        </label>

        <label class="wide">Lien direct de la photo
          <input id="p-image" type="url" placeholder="https://...">
        </label>

        <label>Étiquette courte
          <input id="p-tag" maxlength="30" placeholder="Nouveau, populaire…">
        </label>

        <label>Emoji de secours
          <input id="p-emoji" maxlength="8" value="🛍️">
        </label>

        <label class="wide" style="flex-direction:row;align-items:center">
          <input id="p-active" type="checkbox" checked style="width:auto">
          Publier ce produit dans la boutique
        </label>

        <div class="wide admin-actions">
          <button class="button button-dark" type="submit" id="save-product">
            Enregistrer le produit
          </button>
          <button class="button button-light hidden" type="button" id="cancel-edit">
            Annuler la modification
          </button>
        </div>
      </form>
    </section>

    <section class="admin-card">
      <div class="admin-top">
        <h2>Mes produits</h2>
        <span id="product-count" class="muted">0 produit</span>
      </div>
      <div id="admin-products">
        <p class="muted">Chargement du catalogue…</p>
      </div>
    </section>
  </div>
</main>

<script type="module" src="admin.js"></script>
</body>
</html>
