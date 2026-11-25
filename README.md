# Franko

Budget familial suisse : ce qu'il vous reste **une fois tout payé**, du salaire au salaire suivant.
Français, allemand et italien. Fonctionne sans compte (données dans le navigateur) ou avec un compte synchronisé.

## Structure

| Fichier | Rôle |
|---|---|
| `index.html`, `css/site.css` | Page publique (FR/DE/IT) et prix |
| `app.html`, `css/app.css`, `js/app.js` | Application |
| `js/logic.js` | Logique métier pure : mois de salaire, charges, paiements comptés une fois faits, relevés CSV, fusion |
| `js/tax.js` | Impôt fédéral 2026 exact ; barèmes cantonaux (Fribourg approché pour l'instant) |
| `js/i18n.js` | Textes FR / DE / IT |
| `js/store.js` | Stockage local + synchronisation Supabase (sans bibliothèque) |
| `supabase/migrations` | Tables `budget_docs` et `subscriptions`, sécurité par utilisateur (RLS) |
| `supabase/functions/billing` | Stripe : paiement, portail client, webhook |
| `legal.html` | Conditions et protection des données (nLPD / RGPD) |

Aucune étape de build : les fichiers sont servis tels quels.

## Développement

```bash
npm test                 # tests de la logique et des impôts (node:test)
node scripts/serve.js    # http://localhost:8080
```

## Mise en ligne

1. **Supabase** : créer un projet (région `eu-central-2` Zurich), puis `supabase db push` pour les migrations.
   Dans Authentication › URL Configuration, ajouter l'adresse du site aux redirections autorisées.
2. **Stripe** : créer le produit « Franko Pro » avec deux prix récurrents en CHF (4.90 / mois, 49 / an).
   Activer le portail client. Créer un webhook vers `https://<projet>.supabase.co/functions/v1/billing`
   pour `checkout.session.completed` et `customer.subscription.*`.
3. **Secrets de la fonction** : `supabase secrets set STRIPE_SECRET_KEY=… STRIPE_WEBHOOK_SECRET=… STRIPE_PRICE_MONTH=price_… STRIPE_PRICE_YEAR=price_… SITE_URL=https://…`
   puis `supabase functions deploy billing --no-verify-jwt`.
4. **config.js** : renseigner `supabaseUrl`, `supabaseAnonKey` (clé publique), et passer `billing: true` à la fin de la bêta.
5. **Hébergement** : Cloudflare Pages, dossier racine du dépôt, sans commande de build.
6. **Légal** : compléter l'adresse, le contact et le for dans `legal.html`, puis faire relire.

## Principes de calcul

- Le mois commence le jour où le salaire arrive (sinon au jour de paie) et porte le nom du mois de ce salaire.
- Seuls les paiements faits sont déduits ; ce qui n'est pas payé est affiché à part (« pas encore payé », « après tout payé »).
- Un contrat d'investissement ou d'épargne (3e pilier, ordre permanent) compte quand il est payé.
- Les acomptes d'une même catégorie (impôts, assurance) réduisent la charge correspondante sans double comptage.
- Les dépenses prévues sont rattachées au mois de salaire choisi et comptent une seule fois.

## Compte propriétaire, tableau de bord et Pro offert

1. Appliquer les migrations (dont `20261127000000_comp.sql`) et déployer les fonctions `admin` et `billing`.
2. Dans Supabase › Edge Functions › Secrets, ajouter `ADMIN_EMAILS` avec votre adresse (plusieurs adresses : séparées par des virgules). L'adresse n'est jamais écrite dans le code.
3. Ouvrez l'app, connectez-vous avec cette adresse (lien magique). Réglages affiche « Compte propriétaire » : toutes les fonctions Pro sans abonnement, et le bouton **Tableau de bord administrateur** (`admin.html`).
4. Dans le tableau de bord, la colonne « Pro offert » permet d'offrir ou de retirer Pro à un client (famille, testeurs). Le serveur l'enregistre dans `subscriptions.comp` ; un utilisateur ne peut jamais se l'accorder lui-même. Les Pro offerts ne comptent ni dans le MRR ni parmi les payants.
