/* Configuration publique de l'app (aucun secret ici : ce fichier est servi à tous les visiteurs).
   C'est le seul fichier à adapter pour une nouvelle app, avec les textes de js/i18n.js et js/site.js. */
window.APP_CONFIG = {
  appName: 'MonApp',          // nom affiché partout (onglet, en-tête, e-mails de l'app)
  slug: 'monapp',             // préfixe du stockage local ; ne plus le changer après le lancement
  lists: ['items'],           // listes du document de chaque utilisateur (voir js/core.js)
  supabaseUrl: '',            // vide = app 100 % locale, sans compte
  supabaseAnonKey: '',        // clé publique « anon » du projet Supabase (jamais la clé service_role)
  billing: false,             // false = bêta : toutes les fonctions Pro sont incluses
  priceMonth: '4.90',
  priceYear: '49',
};
