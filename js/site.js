/* Page publique : textes FR / DE / IT, sélecteur mensuel/annuel, FAQ et animations d'arrivée.
   Les textes ci-dessous décrivent l'app d'exemple : remplacez-les par votre promesse, vos fonctions et vos questions.
   Ils sont écrits ici même (aucune donnée externe) : leur insertion en HTML est sans risque. */
(function () {
  'use strict';
  const cfg = (typeof window !== 'undefined' && window.APP_CONFIG) || {};
  const APP = cfg.appName || 'MonApp', SLUG = cfg.slug || 'monapp';
  const PM = cfg.priceMonth || '4.90', PY = cfg.priceYear || '49';
  const L = {
    fr: {
      'nav.features': 'Fonctionnalités', 'nav.pricing': 'Prix', 'nav.faq': 'Questions', 'nav.signin': 'Ouvrir l’app', 'nav.cta': 'Essayer',
      'hero.eyebrow': 'Fait en Suisse', 'hero.h1': 'Ce qui compte, <em>fait et rangé.</em>',
      'hero.lead': 'Une liste qui tient sur votre téléphone, en ligne ou non. Vous notez, vous cochez, et vous retrouvez tout sur vos autres appareils.',
      'hero.cta': 'Essayer gratuitement', 'hero.cta2': 'Voir comment ça marche', 'hero.c1': 'Sans carte bancaire', 'hero.c2': 'En français, en allemand et en italien',
      'hero.aria': 'Aperçu de l’application',
      'ui.today': 'Aujourd’hui', 'ui.progress': 'Avancement', 'ui.ok': 'En bonne voie', 'ui.of': ' sur 3', 'ui.done': 'Fait', 'ui.todo': 'À faire',
      'ui.r1': 'Acheter du pain', 'ui.r1s': 'Boulangerie du coin', 'ui.r2': 'Appeler la crèche', 'ui.r2s': 'avant 17 h', 'ui.r3': 'Payer Swisscom', 'ui.r3s': 'échéance le 30',
      'feat.kicker': 'Fonctionnalités', 'feat.h2': 'Simple au quotidien, solide en coulisse', 'feat.lead': 'Remplacez ces quatre blocs par ce que votre app fait de mieux.',
      'm1.t': 'Rapide', 'm1.p': 'Une entrée s’ajoute en deux secondes, même sans réseau.',
      'm2.t': 'Sur tous vos appareils', 'm2.p': 'Avec un compte, vos données se rejoignent sans jamais s’écraser.',
      'm3.t': 'Privé', 'm3.p': 'Sans compte, rien ne quitte votre téléphone. Avec un compte, vous seul y avez accès.',
      'm4.t': 'Trois langues', 'm4.p': 'Français, allemand et italien, avec les formats suisses.',
      'how.kicker': 'Pour commencer', 'how.h2': 'Trois étapes, et c’est prêt',
      'how.1t': 'Ouvrez l’app', 'how.1p': 'Rien à installer : elle s’ouvre dans le navigateur et s’ajoute à l’écran d’accueil.',
      'how.2t': 'Ajoutez vos entrées', 'how.2p': 'Un titre, une note si besoin. Cochez quand c’est fait.',
      'how.3t': 'Retrouvez-les partout', 'how.3p': 'Créez un compte pour synchroniser votre téléphone et votre ordinateur.',
      'price.kicker': 'Prix', 'price.h2': 'Gratuit pour commencer', 'price.lead': 'Passez à Pro quand vous en avez besoin.',
      'price.monthly': 'Mensuel', 'price.yearly': 'Annuel', 'price.save': '−16 %', 'price.free': 'Gratuit', 'price.forever': 'Sans limite de durée', 'price.freeCta': 'Commencer',
      'price.badge': '30 jours offerts', 'price.perMonth': 'CHF par mois', 'price.perYear': 'CHF par an', 'price.billedMonth': 'Facturé chaque mois. Vous arrêtez quand vous voulez.',
      'price.billedYear': 'Soit {m} CHF par mois, facturé une fois par an.', 'price.proCta': 'Essayer Pro 30 jours',
      'price.freeL': ['Entrées illimitées', 'Fonctionne hors ligne', 'Trois langues'], 'price.proL': ['Tout le plan gratuit', 'Synchronisation entre appareils', 'Export CSV', 'Historique complet'],
      'price.fine': 'Prix en francs suisses, TVA comprise si elle est due. Vous résiliez depuis l’app, sans préavis. Le paiement passe par Stripe.',
      'faq.h2': 'Questions fréquentes',
      faq: [['Où sont mes données ?', 'Sans compte, uniquement dans votre navigateur. Avec un compte, dans une base de données en Europe, accessible à vous seul.'],
        ['Faut-il installer quelque chose ?', 'Non. L’app s’ouvre dans le navigateur ; sur iPhone, « Partager › Sur l’écran d’accueil » l’ajoute comme une app.'],
        ['Que se passe-t-il après les 30 jours ?', 'L’essai devient un abonnement, sauf si vous l’arrêtez avant. Vous gardez de toute façon le plan gratuit.'],
        ['Comment résilier ?', 'Dans Réglages › Compte et abonnement, en deux clics. L’abonnement s’arrête à la fin de la période payée.']],
      'final.h2': 'Essayez-la aujourd’hui.', 'final.p': 'C’est gratuit et on ne vous demande pas de carte.', 'final.cta': 'Essayer gratuitement', 'final.cta2': 'Voir les prix',
      'foot.tag': 'Une app suisse, en français, allemand et italien.', 'foot.product': 'Produit', 'foot.help': 'Aide', 'foot.how': 'Comment ça marche', 'foot.legal': 'Légal',
      'foot.terms': 'Conditions d’utilisation', 'foot.privacy': 'Protection des données', 'foot.made': 'Fait en Suisse',
    },
    de: {
      'nav.features': 'Funktionen', 'nav.pricing': 'Preise', 'nav.faq': 'Fragen', 'nav.signin': 'App öffnen', 'nav.cta': 'Testen',
      'hero.eyebrow': 'Gemacht in der Schweiz', 'hero.h1': 'Was zählt, <em>erledigt und geordnet.</em>',
      'hero.lead': 'Eine Liste, die auf Ihr Telefon passt, online oder nicht. Sie notieren, haken ab und finden alles auf Ihren anderen Geräten wieder.',
      'hero.cta': 'Gratis testen', 'hero.cta2': 'So funktioniert es', 'hero.c1': 'Ohne Kreditkarte', 'hero.c2': 'Auf Deutsch, Französisch und Italienisch',
      'hero.aria': 'Vorschau der App',
      'ui.today': 'Heute', 'ui.progress': 'Fortschritt', 'ui.ok': 'Auf Kurs', 'ui.of': ' von 3', 'ui.done': 'Erledigt', 'ui.todo': 'Offen',
      'ui.r1': 'Brot kaufen', 'ui.r1s': 'Bäckerei um die Ecke', 'ui.r2': 'Kita anrufen', 'ui.r2s': 'vor 17 Uhr', 'ui.r3': 'Swisscom bezahlen', 'ui.r3s': 'fällig am 30.',
      'feat.kicker': 'Funktionen', 'feat.h2': 'Einfach im Alltag, solide im Hintergrund', 'feat.lead': 'Ersetzen Sie diese vier Blöcke durch das, was Ihre App am besten kann.',
      'm1.t': 'Schnell', 'm1.p': 'Ein Eintrag ist in zwei Sekunden erfasst, auch ohne Netz.',
      'm2.t': 'Auf allen Geräten', 'm2.p': 'Mit einem Konto werden Ihre Daten zusammengeführt, ohne sich zu überschreiben.',
      'm3.t': 'Privat', 'm3.p': 'Ohne Konto verlässt nichts Ihr Telefon. Mit Konto haben nur Sie Zugriff.',
      'm4.t': 'Drei Sprachen', 'm4.p': 'Deutsch, Französisch und Italienisch, mit Schweizer Formaten.',
      'how.kicker': 'Erste Schritte', 'how.h2': 'Drei Schritte, und es läuft',
      'how.1t': 'App öffnen', 'how.1p': 'Nichts zu installieren: Sie öffnet sich im Browser und lässt sich zum Startbildschirm hinzufügen.',
      'how.2t': 'Einträge erfassen', 'how.2p': 'Ein Titel, bei Bedarf eine Notiz. Abhaken, wenn es erledigt ist.',
      'how.3t': 'Überall wiederfinden', 'how.3p': 'Mit einem Konto synchronisieren Sie Telefon und Computer.',
      'price.kicker': 'Preise', 'price.h2': 'Gratis für den Anfang', 'price.lead': 'Wechseln Sie zu Pro, wenn Sie es brauchen.',
      'price.monthly': 'Monatlich', 'price.yearly': 'Jährlich', 'price.save': '−16 %', 'price.free': 'Gratis', 'price.forever': 'Ohne zeitliche Begrenzung', 'price.freeCta': 'Loslegen',
      'price.badge': '30 Tage gratis', 'price.perMonth': 'CHF pro Monat', 'price.perYear': 'CHF pro Jahr', 'price.billedMonth': 'Monatlich verrechnet. Jederzeit kündbar.',
      'price.billedYear': 'Also {m} CHF pro Monat, einmal jährlich verrechnet.', 'price.proCta': 'Pro 30 Tage testen',
      'price.freeL': ['Unbegrenzte Einträge', 'Funktioniert offline', 'Drei Sprachen'], 'price.proL': ['Alles aus dem Gratisplan', 'Synchronisation zwischen Geräten', 'CSV-Export', 'Ganzer Verlauf'],
      'price.fine': 'Preise in Schweizer Franken, inkl. MWST, falls geschuldet. Kündigung in der App, ohne Frist. Zahlung über Stripe.',
      'faq.h2': 'Häufige Fragen',
      faq: [['Wo sind meine Daten?', 'Ohne Konto nur in Ihrem Browser. Mit Konto in einer Datenbank in Europa, auf die nur Sie Zugriff haben.'],
        ['Muss ich etwas installieren?', 'Nein. Die App öffnet sich im Browser; auf dem iPhone fügt «Teilen › Zum Home-Bildschirm» sie wie eine App hinzu.'],
        ['Was passiert nach 30 Tagen?', 'Der Test wird zum Abo, ausser Sie beenden ihn vorher. Den Gratisplan behalten Sie in jedem Fall.'],
        ['Wie kündige ich?', 'In Einstellungen › Konto und Abo, mit zwei Klicks. Das Abo endet am Ende der bezahlten Periode.']],
      'final.h2': 'Probieren Sie sie heute aus.', 'final.p': 'Es ist gratis und wir fragen nach keiner Karte.', 'final.cta': 'Gratis testen', 'final.cta2': 'Preise ansehen',
      'foot.tag': 'Eine Schweizer App, auf Deutsch, Französisch und Italienisch.', 'foot.product': 'Produkt', 'foot.help': 'Hilfe', 'foot.how': 'So funktioniert es', 'foot.legal': 'Rechtliches',
      'foot.terms': 'Nutzungsbedingungen', 'foot.privacy': 'Datenschutz', 'foot.made': 'Gemacht in der Schweiz',
    },
    it: {
      'nav.features': 'Funzioni', 'nav.pricing': 'Prezzi', 'nav.faq': 'Domande', 'nav.signin': 'Apri l’app', 'nav.cta': 'Prova',
      'hero.eyebrow': 'Fatto in Svizzera', 'hero.h1': 'Ciò che conta, <em>fatto e in ordine.</em>',
      'hero.lead': 'Una lista che sta nel telefono, online o no. Annota, spunta e ritrova tutto sugli altri dispositivi.',
      'hero.cta': 'Prova gratis', 'hero.cta2': 'Come funziona', 'hero.c1': 'Senza carta di credito', 'hero.c2': 'In italiano, francese e tedesco',
      'hero.aria': 'Anteprima dell’app',
      'ui.today': 'Oggi', 'ui.progress': 'Avanzamento', 'ui.ok': 'In linea', 'ui.of': ' su 3', 'ui.done': 'Fatto', 'ui.todo': 'Da fare',
      'ui.r1': 'Comprare il pane', 'ui.r1s': 'Panetteria all’angolo', 'ui.r2': 'Chiamare l’asilo', 'ui.r2s': 'entro le 17', 'ui.r3': 'Pagare Swisscom', 'ui.r3s': 'scadenza il 30',
      'feat.kicker': 'Funzioni', 'feat.h2': 'Semplice ogni giorno, solida dietro le quinte', 'feat.lead': 'Sostituisca questi quattro blocchi con ciò che la sua app fa meglio.',
      'm1.t': 'Veloce', 'm1.p': 'Una voce si aggiunge in due secondi, anche senza rete.',
      'm2.t': 'Su tutti i dispositivi', 'm2.p': 'Con un account i dati si uniscono senza sovrascriversi.',
      'm3.t': 'Privata', 'm3.p': 'Senza account nulla lascia il telefono. Con un account solo lei vi accede.',
      'm4.t': 'Tre lingue', 'm4.p': 'Italiano, francese e tedesco, con i formati svizzeri.',
      'how.kicker': 'Per iniziare', 'how.h2': 'Tre passi, ed è pronta',
      'how.1t': 'Apra l’app', 'how.1p': 'Niente da installare: si apre nel browser e si aggiunge alla schermata Home.',
      'how.2t': 'Aggiunga le voci', 'how.2p': 'Un titolo, una nota se serve. Spunti quando è fatto.',
      'how.3t': 'Le ritrovi ovunque', 'how.3p': 'Crei un account per sincronizzare telefono e computer.',
      'price.kicker': 'Prezzi', 'price.h2': 'Gratis per iniziare', 'price.lead': 'Passi a Pro quando le serve.',
      'price.monthly': 'Mensile', 'price.yearly': 'Annuale', 'price.save': '−16 %', 'price.free': 'Gratuito', 'price.forever': 'Senza limiti di tempo', 'price.freeCta': 'Iniziare',
      'price.badge': '30 giorni gratis', 'price.perMonth': 'CHF al mese', 'price.perYear': 'CHF all’anno', 'price.billedMonth': 'Fatturato ogni mese. Disdice quando vuole.',
      'price.billedYear': 'Cioè {m} CHF al mese, fatturato una volta all’anno.', 'price.proCta': 'Prova Pro 30 giorni',
      'price.freeL': ['Voci illimitate', 'Funziona offline', 'Tre lingue'], 'price.proL': ['Tutto il piano gratuito', 'Sincronizzazione tra dispositivi', 'Esportazione CSV', 'Storico completo'],
      'price.fine': 'Prezzi in franchi svizzeri, IVA inclusa se dovuta. Disdetta dall’app, senza preavviso. Pagamento tramite Stripe.',
      'faq.h2': 'Domande frequenti',
      faq: [['Dove sono i miei dati?', 'Senza account solo nel browser. Con un account in un database in Europa, accessibile solo a lei.'],
        ['Devo installare qualcosa?', 'No. L’app si apre nel browser; su iPhone «Condividi › Aggiungi alla schermata Home» la aggiunge come un’app.'],
        ['Cosa succede dopo 30 giorni?', 'La prova diventa un abbonamento, a meno che la interrompa prima. Il piano gratuito resta in ogni caso.'],
        ['Come disdire?', 'In Impostazioni › Account e abbonamento, con due clic. L’abbonamento termina alla fine del periodo pagato.']],
      'final.h2': 'La provi oggi.', 'final.p': 'È gratis e non chiediamo una carta.', 'final.cta': 'Prova gratis', 'final.cta2': 'Vedi i prezzi',
      'foot.tag': 'Un’app svizzera, in italiano, francese e tedesco.', 'foot.product': 'Prodotto', 'foot.help': 'Aiuto', 'foot.how': 'Come funziona', 'foot.legal': 'Note legali',
      'foot.terms': 'Condizioni d’uso', 'foot.privacy': 'Protezione dei dati', 'foot.made': 'Fatto in Svizzera',
    },
  };
  if (typeof module === 'object' && module.exports) { module.exports = { L }; return; } // pour les tests
  const ICON = (id) => `<svg aria-hidden="true"><use href="#i-${id}"/></svg>`;
  const UIKEY = SLUG + '.ui.state'; // même préférence de langue que l'app
  let lang = 'fr', bill = 'month';

  document.querySelectorAll('.app-name').forEach((el) => { el.textContent = APP; });
  const y = document.getElementById('year'); if (y) y.textContent = new Date().getFullYear();
  function price() {
    const d = L[lang], year = bill === 'year';
    document.getElementById('pAmt').textContent = year ? PY : PM;
    document.getElementById('pUnit').textContent = year ? d['price.perYear'] : d['price.perMonth'];
    document.getElementById('pPer').textContent = year ? d['price.billedYear'].replace('{m}', (PY / 12).toFixed(2)) : d['price.billedMonth'];
    document.querySelectorAll('[data-bill]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.bill === bill));
  }
  function apply(l) {
    lang = L[l] ? l : 'fr';
    const d = L[lang];
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-i]').forEach((el) => { const v = d[el.dataset.i]; if (typeof v === 'string') el.innerHTML = v; });
    document.querySelectorAll('[data-i-aria]').forEach((el) => el.setAttribute('aria-label', d[el.dataset.iAria] || ''));
    document.querySelectorAll('[data-list]').forEach((el) => { el.innerHTML = (d[el.dataset.list] || []).map((x) => `<li>${ICON('check')}<span>${x}</span></li>`).join(''); });
    document.getElementById('faqList').innerHTML = d.faq.map(([q, a]) => `<details><summary>${q}</summary><p>${a}</p></details>`).join('');
    document.querySelectorAll('[data-lang]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.lang === lang));
    price();
    try { const st = JSON.parse(localStorage.getItem(UIKEY) || '{}'); st.lang = lang; localStorage.setItem(UIKEY, JSON.stringify(st)); } catch (e) { /* préférence non retenue */ }
  }
  let start = 'fr';
  try { start = JSON.parse(localStorage.getItem(UIKEY) || '{}').lang || navigator.language.slice(0, 2); } catch (e) { start = (navigator.language || 'fr').slice(0, 2); }
  apply(start);
  document.addEventListener('click', (e) => {
    const lb = e.target.closest('[data-lang]'); if (lb) { apply(lb.dataset.lang); return; }
    const bb = e.target.closest('[data-bill]'); if (bb) { bill = bb.dataset.bill; price(); }
  });

  // ---------- animations : une arrivée, puis chaque section se révèle une fois. Rien n'est caché au repos. ----------
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.documentElement.classList.add('intro');
  if (!reduce && 'IntersectionObserver' in window) {
    const below = (el) => el.getBoundingClientRect().top > innerHeight * 0.92;
    const io = new IntersectionObserver((es) => { for (const e of es) if (e.isIntersecting) { e.target.classList.remove('pre'); io.unobserve(e.target); } }, { rootMargin: '0px 0px -12% 0px' });
    document.querySelectorAll('.head, .prices, .faq, .final').forEach((el) => { if (below(el)) { el.classList.add('rv', 'pre'); io.observe(el); } });
    document.querySelectorAll('.grid6, .steps').forEach((el) => {
      if (!below(el)) return;
      [...el.children].forEach((c, i) => c.style.setProperty('--i', Math.round(i * 64 - i * i * 3) + 'ms'));
      el.classList.add('rv-kids', 'pre'); io.observe(el);
    });
  }
  const nav = document.getElementById('nav');
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
})();
