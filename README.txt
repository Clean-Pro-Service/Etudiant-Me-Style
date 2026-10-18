ÉTUDIANT MÉ STYLE — VERSION 2 AVEC ESPACE ADMIN

Cette version permet à l'administrateur d'ajouter, modifier, masquer et supprimer les produits depuis admin.html, sans modifier le code à chaque nouvel article. Les produits sont synchronisés entre la boutique publique et l'espace admin via Firebase (offre gratuite disponible sous limites).

IMPORTANT : Firebase doit être configuré une seule fois. Sans cette configuration, le site affiche seulement les produits de démonstration et l'espace admin ne peut pas enregistrer un catalogue partagé.

1) CRÉER LE PROJET FIREBASE
- Ouvre https://console.firebase.google.com/ et connecte-toi avec ton compte Google.
- Crée un projet nommé etudiant-me-style (ou un autre nom).
- Dans les paramètres du projet, ajoute une application Web (icône </>) et copie la configuration Firebase.
- Ouvre config.js et remplace les valeurs d'exemple par les valeurs exactes de Firebase.
- Mets l'adresse e-mail que tu veux utiliser comme administrateur dans ADMIN_EMAIL.

2) ACTIVER LA CONNEXION ADMIN
- Dans Firebase, ouvre Build > Authentication > Get started.
- Dans Sign-in method, active Email/Password.
- Dans Users, ajoute un utilisateur avec exactement la même adresse que ADMIN_EMAIL et choisis un mot de passe fort.
- Ne partage jamais ce mot de passe.

3) CRÉER FIRESTORE
- Ouvre Build > Firestore Database > Create database.
- Choisis un emplacement disponible proche de tes utilisateurs si possible.
- Une fois créé, ouvre l'onglet Rules et remplace les règles par celles ci-dessous.
- Remplace TON_EMAIL_ADMIN par l'adresse exacte du compte administrateur, en minuscules.
- Publie les règles.

RÈGLES FIRESTORE À UTILISER :
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAdmin() {
      return request.auth != null
        && request.auth.token.email == 'TON_EMAIL_ADMIN'
        && request.auth.token.email_verified == true;
    }
    match /products/{productId} {
      allow read: if true;
      allow create, update, delete: if isAdmin();
    }
  }
}

IMPORTANT : pour utiliser ces règles, vérifie l'adresse e-mail du compte admin dans Firebase Authentication. Les règles empêchent les visiteurs non connectés de modifier le catalogue. Elles rendent les produits publics en lecture seule.

4) METTRE LES FICHIERS SUR L'HÉBERGEMENT
- Téléverse index.html, style.css, script.js, admin.html, admin.js et config.js à la racine de ton site.
- Pour une démonstration gratuite, GitHub Pages peut servir des fichiers statiques. Active Settings > Pages > Deploy from branch > main > /(root).
- Les modules JavaScript Firebase doivent être servis via HTTPS ; ouvrir directement index.html comme fichier local ne suffit pas.
- Le lien de la boutique sera du type https://TON-NOM.github.io/etudiant-me-style/
- L'espace administrateur sera https://TON-NOM.github.io/etudiant-me-style/admin.html

5) WHATSAPP
Le numéro de commande configuré est 22898207231. Il est utilisé au format international sans le signe +.

6) AJOUTER UN PRODUIT
- Ouvre /admin.html sur le site publié.
- Connecte-toi avec l'e-mail et le mot de passe administrateur.
- Renseigne nom, catégorie, prix, style, tailles/couleurs, stock, description et lien photo HTTPS.
- Coche « Publier ce produit » puis enregistre.
- Les changements sont synchronisés automatiquement sur la boutique publique.
- Pour retirer temporairement un article, modifie-le et décoche « Publier ». Pour le supprimer définitivement, clique Supprimer.

PHOTOS
Le champ photo attend un lien direct https:// vers une image publiquement accessible. Les liens de partage de Google Drive ne sont pas toujours des liens directs d'image. Utilise des photos dont tu as les droits.

SÉCURITÉ ET LIMITES
- Ne mets jamais une clé privée de compte de service dans le site.
- La configuration Firebase Web (apiKey, projectId, etc.) est conçue pour être présente côté client ; la sécurité dépend des règles Firestore et des autorisations Auth.
- Le catalogue est public en lecture, mais seul l'administrateur authentifié peut le modifier.
- Les coûts Firebase sont soumis aux limites de l'offre gratuite et peuvent changer ; surveille l'utilisation dans la console.
- Le panier n'est pas sauvegardé dans un compte utilisateur ; les commandes partent vers WhatsApp.
- Le champ stock est informatif dans cette version : le stock ne se décrémente pas automatiquement.
- Les prix/produits de démonstration sont fictifs. Supprime-les ou remplace-les avant le lancement public.
