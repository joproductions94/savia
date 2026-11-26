/* Textes de l'app en français, allemand et italien. t('clé', { param }) ; une clé absente retombe sur le français.
   Ajoutez vos clés dans les trois langues : le test test/i18n.test.js vérifie qu'aucune ne manque. */
(function (root) {
  'use strict';
  const fr = {
    'tab.home': 'Accueil', 'tab.stats': 'Suivi', 'tab.settings': 'Réglages',
    'sync.local': 'Sur cet appareil', 'sync.ok': 'Enregistré', 'sync.busy': 'Enregistrement…', 'sync.err': 'Hors ligne', 'sync.pending': 'Modifié',
    'home.title': 'Ma liste', 'home.empty': 'Rien pour l’instant. Ajoutez une première entrée avec le bouton +.', 'home.add': 'Ajouter', 'home.open': '{n} à faire', 'home.done': '{n} fait(s)',
    'item.new': 'Nouvelle entrée', 'item.edit': 'Modifier', 'item.title': 'Titre', 'item.note': 'Note (facultatif)', 'item.err': 'Donnez un titre.',
    'item.saved': 'Enregistré', 'item.deleted': '« {title} » supprimé', 'item.todo': 'À faire', 'item.doneState': 'Fait',
    'stats.title': 'Suivi', 'stats.total': 'Entrées', 'stats.done': 'Terminées', 'stats.rate': 'Taux de réussite', 'stats.week': 'Ajoutées cette semaine',
    'stats.pro': 'L’export et l’historique complet font partie de {app} Pro.',
    'set.lang': 'Langue', 'set.theme': 'Apparence', 'set.theme.auto': 'Auto', 'set.theme.light': 'Clair', 'set.theme.dark': 'Sombre',
    'set.data': 'Données', 'set.export': 'Exporter CSV', 'set.backup': 'Sauvegarde', 'set.restore': 'Restaurer', 'set.wipe': 'Tout effacer',
    'set.wipeConfirm': 'Effacer toutes vos données sur cet appareil et dans votre compte ? Faites d’abord une sauvegarde.', 'set.wiped': 'Données effacées',
    'set.restored': 'Sauvegarde restaurée', 'set.restoreErr': 'Fichier de sauvegarde illisible.', 'set.account': 'Compte et abonnement', 'set.legal': 'Conditions et confidentialité',
    'auth.local': 'Vos données restent sur cet appareil. Créez un compte pour les retrouver sur tous vos appareils.', 'auth.email': 'Adresse e-mail', 'auth.send': 'Recevoir le lien de connexion',
    'auth.sent': 'Lien envoyé à {email}. Ouvrez-le sur cet appareil.', 'auth.signedIn': 'Connecté : {email}', 'auth.signOut': 'Se déconnecter', 'auth.unavailable': 'La connexion sera disponible au lancement.',
    'plan.free': 'Gratuit', 'plan.pro': 'Pro', 'plan.beta': 'Bêta : tout est inclus gratuitement pendant le lancement.', 'plan.upgrade': 'Passer à Pro', 'plan.manage': 'Gérer l’abonnement',
    'plan.price': '{month} CHF / mois ou {year} CHF / an', 'plan.owner': 'Compte propriétaire : toutes les fonctions Pro, sans abonnement.', 'plan.comp': 'Pro offert : toutes les fonctions, sans abonnement.',
    'pro.title': 'Fonction Pro', 'pro.text': '{feature} fait partie de {app} Pro.', 'pro.export': 'L’export CSV',
    'admin.open': 'Tableau de bord administrateur',
    'dlg.close': 'Fermer', 'dlg.cancel': 'Annuler', 'dlg.save': 'Enregistrer', 'dlg.delete': 'Supprimer', 'dlg.confirm': 'Confirmer', 'undo': 'Annuler',
  };
  const de = {
    'tab.home': 'Start', 'tab.stats': 'Verlauf', 'tab.settings': 'Einstellungen',
    'sync.local': 'Auf diesem Gerät', 'sync.ok': 'Gespeichert', 'sync.busy': 'Speichern…', 'sync.err': 'Offline', 'sync.pending': 'Geändert',
    'home.title': 'Meine Liste', 'home.empty': 'Noch nichts da. Fügen Sie mit + einen ersten Eintrag hinzu.', 'home.add': 'Hinzufügen', 'home.open': '{n} offen', 'home.done': '{n} erledigt',
    'item.new': 'Neuer Eintrag', 'item.edit': 'Bearbeiten', 'item.title': 'Titel', 'item.note': 'Notiz (optional)', 'item.err': 'Geben Sie einen Titel ein.',
    'item.saved': 'Gespeichert', 'item.deleted': '«{title}» gelöscht', 'item.todo': 'Offen', 'item.doneState': 'Erledigt',
    'stats.title': 'Verlauf', 'stats.total': 'Einträge', 'stats.done': 'Erledigt', 'stats.rate': 'Erledigungsquote', 'stats.week': 'Diese Woche hinzugefügt',
    'stats.pro': 'Export und ganzer Verlauf gehören zu {app} Pro.',
    'set.lang': 'Sprache', 'set.theme': 'Darstellung', 'set.theme.auto': 'Automatisch', 'set.theme.light': 'Hell', 'set.theme.dark': 'Dunkel',
    'set.data': 'Daten', 'set.export': 'CSV exportieren', 'set.backup': 'Sicherung', 'set.restore': 'Wiederherstellen', 'set.wipe': 'Alles löschen',
    'set.wipeConfirm': 'Alle Daten auf diesem Gerät und in Ihrem Konto löschen? Erstellen Sie zuerst eine Sicherung.', 'set.wiped': 'Daten gelöscht',
    'set.restored': 'Sicherung wiederhergestellt', 'set.restoreErr': 'Sicherungsdatei unlesbar.', 'set.account': 'Konto und Abo', 'set.legal': 'Bedingungen und Datenschutz',
    'auth.local': 'Ihre Daten bleiben auf diesem Gerät. Mit einem Konto finden Sie sie auf allen Geräten.', 'auth.email': 'E-Mail-Adresse', 'auth.send': 'Anmeldelink erhalten',
    'auth.sent': 'Link an {email} gesendet. Öffnen Sie ihn auf diesem Gerät.', 'auth.signedIn': 'Angemeldet: {email}', 'auth.signOut': 'Abmelden', 'auth.unavailable': 'Die Anmeldung ist ab dem Start verfügbar.',
    'plan.free': 'Gratis', 'plan.pro': 'Pro', 'plan.beta': 'Beta: Während des Starts ist alles gratis inbegriffen.', 'plan.upgrade': 'Zu Pro wechseln', 'plan.manage': 'Abo verwalten',
    'plan.price': '{month} CHF / Monat oder {year} CHF / Jahr', 'plan.owner': 'Inhaberkonto: alle Pro-Funktionen, ohne Abo.', 'plan.comp': 'Pro geschenkt: alle Funktionen, ohne Abo.',
    'pro.title': 'Pro-Funktion', 'pro.text': '{feature} gehört zu {app} Pro.', 'pro.export': 'Der CSV-Export',
    'admin.open': 'Admin-Dashboard',
    'dlg.close': 'Schliessen', 'dlg.cancel': 'Abbrechen', 'dlg.save': 'Speichern', 'dlg.delete': 'Löschen', 'dlg.confirm': 'Bestätigen', 'undo': 'Rückgängig',
  };
  const it = {
    'tab.home': 'Home', 'tab.stats': 'Andamento', 'tab.settings': 'Impostazioni',
    'sync.local': 'Su questo dispositivo', 'sync.ok': 'Salvato', 'sync.busy': 'Salvataggio…', 'sync.err': 'Offline', 'sync.pending': 'Modificato',
    'home.title': 'La mia lista', 'home.empty': 'Ancora niente. Aggiunga una prima voce con il pulsante +.', 'home.add': 'Aggiungi', 'home.open': '{n} da fare', 'home.done': '{n} fatte',
    'item.new': 'Nuova voce', 'item.edit': 'Modifica', 'item.title': 'Titolo', 'item.note': 'Nota (facoltativa)', 'item.err': 'Indichi un titolo.',
    'item.saved': 'Salvato', 'item.deleted': '«{title}» eliminato', 'item.todo': 'Da fare', 'item.doneState': 'Fatto',
    'stats.title': 'Andamento', 'stats.total': 'Voci', 'stats.done': 'Completate', 'stats.rate': 'Tasso di completamento', 'stats.week': 'Aggiunte questa settimana',
    'stats.pro': 'L’esportazione e lo storico completo fanno parte di {app} Pro.',
    'set.lang': 'Lingua', 'set.theme': 'Aspetto', 'set.theme.auto': 'Automatico', 'set.theme.light': 'Chiaro', 'set.theme.dark': 'Scuro',
    'set.data': 'Dati', 'set.export': 'Esporta CSV', 'set.backup': 'Backup', 'set.restore': 'Ripristina', 'set.wipe': 'Cancella tutto',
    'set.wipeConfirm': 'Cancellare tutti i dati su questo dispositivo e nel suo account? Faccia prima un backup.', 'set.wiped': 'Dati cancellati',
    'set.restored': 'Backup ripristinato', 'set.restoreErr': 'File di backup illeggibile.', 'set.account': 'Account e abbonamento', 'set.legal': 'Condizioni e privacy',
    'auth.local': 'I suoi dati restano su questo dispositivo. Con un account li ritrova su tutti i dispositivi.', 'auth.email': 'Indirizzo e-mail', 'auth.send': 'Ricevere il link di accesso',
    'auth.sent': 'Link inviato a {email}. Lo apra su questo dispositivo.', 'auth.signedIn': 'Connesso: {email}', 'auth.signOut': 'Disconnettersi', 'auth.unavailable': 'L’accesso sarà disponibile al lancio.',
    'plan.free': 'Gratuito', 'plan.pro': 'Pro', 'plan.beta': 'Beta: durante il lancio tutto è incluso gratuitamente.', 'plan.upgrade': 'Passare a Pro', 'plan.manage': 'Gestire l’abbonamento',
    'plan.price': '{month} CHF / mese o {year} CHF / anno', 'plan.owner': 'Conto del titolare: tutte le funzioni Pro, senza abbonamento.', 'plan.comp': 'Pro offerto: tutte le funzioni, senza abbonamento.',
    'pro.title': 'Funzione Pro', 'pro.text': '{feature} fa parte di {app} Pro.', 'pro.export': 'L’esportazione CSV',
    'admin.open': 'Dashboard amministratore',
    'dlg.close': 'Chiudi', 'dlg.cancel': 'Annulla', 'dlg.save': 'Salva', 'dlg.delete': 'Elimina', 'dlg.confirm': 'Conferma', 'undo': 'Annulla',
  };

  const DICTS = { fr, de, it };
  const LOCALES = { fr: 'fr-CH', de: 'de-CH', it: 'it-CH' };
  let lang = 'fr';
  function pick(l) { const n = String(l || '').slice(0, 2).toLowerCase(); return DICTS[n] ? n : 'fr'; }
  function setLang(l) { lang = pick(l); if (root.document) root.document.documentElement.lang = lang; return lang; }
  function t(key, p) {
    let s = (DICTS[lang] && DICTS[lang][key]) || fr[key] || key;
    if (p) s = s.replace(/\{(\w+)\}/g, (m, k) => (p[k] == null ? m : String(p[k])));
    return s;
  }
  const I = { t, setLang, pick, get lang() { return lang; }, get locale() { return LOCALES[lang]; }, DICTS, LOCALES };
  if (typeof module === 'object' && module.exports) module.exports = I;
  else root.I18n = I;
})(typeof globalThis !== 'undefined' ? globalThis : this);
