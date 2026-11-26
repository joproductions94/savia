# Modèle d'app suisse

Le socle commun de vos apps : tout ce qui ne change pas d'une app à l'autre est déjà fait et testé.
Vous n'écrivez que votre métier.

## Ce qui est déjà là

- **App web installable** (iPhone, Android, ordinateur), sans boutique d'applications. Fonctionne hors ligne.
- **Trois langues** : français, allemand, italien, avec les formats suisses. Un test vérifie qu'aucun texte ne manque.
- **Données sur l'appareil d'abord**, puis **compte en ligne** (Supabase, lien de connexion par e-mail, sans mot de passe).
  La synchronisation fusionne objet par objet : deux appareils ne s'écrasent jamais.
- **Abonnement Pro** (Stripe) : essai de 30 jours, mensuel ou annuel, portail client pour résilier.
  Tant que `billing: false`, tout est inclus (phase bêta).
- **Compte propriétaire** : votre adresse, déclarée côté serveur, a Pro sans payer et ouvre le tableau de bord.
- **Tableau de bord** (`admin.html`) : revenu mensuel récurrent, abonnés, essais, résiliations, inscriptions,
  liste des clients avec recherche et export, et « Offrir Pro » à la famille ou aux testeurs.
- **Page publique** avec prix, FAQ et animations, **conditions et confidentialité** à compléter.
- Thème clair et sombre, sauvegarde et restauration, export CSV, effacement complet, annulation des suppressions.

## Créer une nouvelle app

```
git checkout app-starter
git checkout -b mon-app
node scripts/new-app.js "Mon App" mon-app
npm test
npm run dev          # http://localhost:8080
```

Ensuite, dans cet ordre :

1. **Logo** : `icons/icon.svg`.
2. **Textes** : `js/i18n.js` pour l'app, `js/site.js` pour la page publique (FR, DE, IT).
3. **Métier** : `js/app.js`, les vues `VIEWS.home` et `VIEWS.stats` et la fonction `itemDialog`.
   Pour d'autres types d'objets, ajoutez une liste dans `config.js` (`lists: ['items', 'tags']`)
   et utilisez `Core.add / update / remove` : la synchronisation suit toute seule.
4. **Fonctions payantes** : entourez-les de `requirePro('nom', () => …)` et ajoutez `pro.nom` dans les trois langues.
5. **Conditions** : complétez `legal.html` (raison sociale, adresse, contact, prix, for).

## Mettre en ligne

1. **Supabase** : créez un projet (région Zurich, `eu-central-2`, pour des données en Suisse).
   - Appliquez les migrations de `supabase/migrations` dans l'ordre.
   - Déployez les fonctions : `supabase functions deploy admin --no-verify-jwt` et `supabase functions deploy billing --no-verify-jwt`.
   - Secrets des fonctions : `SITE_URL` (votre domaine), `ADMIN_EMAILS` (votre adresse ; plusieurs : séparées par des virgules).
   - Authentification › URL Configuration : ajoutez votre domaine aux adresses de redirection.
   - Dans `config.js` : `supabaseUrl` et la clé publique `supabaseAnonKey` (jamais la clé `service_role`).
2. **Stripe** (quand vous activez le paiement) : créez le produit et ses deux prix (mois, an), puis les secrets
   `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_MONTH`, `STRIPE_PRICE_YEAR`.
   Webhook vers `https://<projet>.supabase.co/functions/v1/billing` (événements `customer.subscription.*`
   et `checkout.session.completed`). Puis `billing: true` dans `config.js`.
3. **Hébergement** : Cloudflare Pages (gratuit), dossier racine, sans étape de compilation. `_headers` est déjà prêt
   (sécurité, cache). Branchez votre domaine dans Cloudflare.
4. Augmentez `CACHE` dans `sw.js` à chaque mise en ligne importante.

## Tests

`npm test` vérifie la fusion des données, les textes des trois langues, la page publique et les chiffres du tableau de bord.

## Structure

```
config.js            configuration publique (nom, listes, Supabase, prix)
index.html, js/site.js, css/site.css   page publique
app.html, js/app.js, css/app.css       l'app
js/core.js           document de données et fusion entre appareils
js/store.js          stockage local + synchronisation Supabase + abonnement + propriétaire
js/i18n.js           textes FR / DE / IT
admin.html, js/admin*.js, css/admin.css   tableau de bord
supabase/            base de données et fonctions serveur (admin, billing)
sw.js, _headers, manifest.webmanifest     hors ligne, sécurité, installation
```
