/* Configuration publique (aucun secret ici). Laissez supabaseUrl vide pour une app 100 % locale. */
window.FRANKO_CONFIG = {
  supabaseUrl: 'https://mqcnkqprrvvgtyupwwqs.supabase.co', // projet « franko », Zurich
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xY25rcXBycnZ2Z3R5dXB3d3FzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTU2OTM4NTgsImV4cCI6MjExMTI2OTg1OH0.2LoeLiTr2mvfZUTCfXeA7yyC-33gTSvhpjCl9rKpO3Y', // clé publique (anon), faite pour être visible
  // lien iCloud du raccourci Apple Pay SANS clé personnelle (le champ Authorization contient « Bearer COLLEZ-VOTRE-CLE »)
  shortcutUrl: '',
  billing: false, // false = bêta : toutes les fonctions Pro sont incluses
  priceMonth: '4.90',
  priceYear: '49',
};
