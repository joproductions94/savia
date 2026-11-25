/* Franko — page publique : textes FR / DE / IT, sélecteur mensuel/annuel, comparatif et FAQ.
   Tous les textes sont écrits ici même (aucune donnée externe) : leur insertion en HTML est sans risque. */
(function () {
  'use strict';
  const cfg = window.FRANKO_CONFIG || {};
  const PM = cfg.priceMonth || '4.90', PY = cfg.priceYear || '49';
  const L = {
    fr: {
      'nav.features': 'Fonctionnalités', 'nav.pricing': 'Prix', 'nav.faq': 'Questions', 'nav.signin': 'Ouvrir l’app', 'nav.cta': 'Essai gratuit',
      'hero.eyebrow': 'Budget familial · Suisse', 'hero.h1': 'Combien il vous reste, <em>une fois tout payé.</em>',
      'hero.lead': 'Franko suit votre mois du salaire au salaire suivant. Il ne compte que ce qui est vraiment payé, garde à part ce qui reste à payer, et vous dit ce que vous pouvez dépenser chaque jour.',
      'hero.cta': 'Commencer gratuitement', 'hero.cta2': 'Voir comment ça marche', 'hero.c1': 'Sans carte bancaire', 'hero.c2': 'Français · Deutsch · Italiano', 'hero.c3': 'Données en Europe',
      'ui.month': 'novembre · J-25', 'ui.available': 'Après tout payé', 'ui.ok': 'Dans le budget', 'ui.perday': 'Environ 88 CHF par jour jusqu’au 20 déc.', 'ui.notpaid': 'Pas encore payé ce mois',
      'ui.rent': 'Loyer', 'ui.health': 'Assurance maladie', 'ui.tax': 'Impôts', 'ui.phone': 'Téléphone', 'ui.paid': 'Payé', 'ui.pay': 'Payé ?',
      'fl.1t': 'Loyer payé', 'fl.1s': 'confirmé par le relevé', 'fl.2t': 'Impôts : 598 CHF / mois', 'fl.2s': 'estimation Fribourg + IFD',
      banks: 'Lit les relevés CSV de', 'truth.kicker': 'Le problème', 'truth.h2': 'Votre solde bancaire ne dit pas ce qui vous reste.',
      'truth.lead': 'Le loyer, l’assurance maladie et les impôts arrivent plus tard dans le mois. L’argent est sur le compte, mais il est déjà promis.',
      'truth.1': '<b>Franko déduit ce qui est payé</b>, au moment où vous le marquez ou où votre relevé le confirme.',
      'truth.2': '<b>Il garde à part ce qui reste à payer</b> : vous voyez votre solde après toutes les factures du mois.',
      'truth.3': '<b>Il vous alerte tôt</b> quand le salaire ne suffira pas, avant que le compte passe dans le rouge.',
      'led.bank': 'Sur le compte aujourd’hui', 'led.bankS': 'ce que montre l’app de la banque', 'led.bills': 'Factures pas encore payées', 'led.billsS': 'impôts, assurance, téléphone, électricité', 'led.real': 'Ce qui vous reste vraiment',
      'feat.kicker': 'Fonctionnalités', 'feat.h2': 'Tout ce qu’un budget suisse demande', 'feat.lead': 'Conçu autour de la vie réelle d’un ménage : salaire le 20, loyer le 1er, LAMal, crèche, pension alimentaire, acomptes d’impôts.',
      'f1.t': 'Un calcul du mois que vous comprenez', 'f1.p': 'Chaque franc est expliqué, du salaire reçu à ce qui reste après toutes les factures. Les paiements faits sont déduits, les autres restent à part.',
      'f1.l': ['Mois du salaire au salaire suivant, détecté automatiquement', 'Acomptes d’impôts et d’assurance sans double comptage', 'Épargne et investissement comptés une fois faits'],
      'v1.salary': 'Salaire reçu', 'v1.fixed': 'Charges payées', 'v1.fixedS': '4/8 payées', 'v1.after': 'Reste après charges payées', 'v1.daily': 'Dépensé au quotidien', 'v1.dailyS': 'depuis le 20 nov.', 'v1.now': 'Disponible maintenant', 'v1.pending': 'Pas encore payé', 'v1.pendingS': 'Impôts, téléphone, électricité', 'v1.all': 'Après tout payé',
      'f2.t': 'Vos relevés, sans doublons', 'f2.p': 'Exportez le CSV de votre e-banking : Franko reconnaît les dépenses déjà saisies, les charges payées, les virements entre vos comptes et les dépenses à exclure.',
      'f2.l': ['PostFinance, UBS, Raiffeisen, banques cantonales, Neon, Revolut', 'Catégories automatiques, qui apprennent de vos corrections', 'Aucune connexion à votre banque : le fichier est lu sur votre appareil'],
      'v2.title': 'Relevé Neon · novembre', 'v2.read': '24 lus', 'v2.dup': '✓ déjà saisi', 'v2.cat': 'Courses', 'v2.transfer': 'virement',
      'f3.t': 'Vos impôts, mois par mois', 'f3.p': 'Impôt fédéral exact et estimation cantonale avec vos déductions. Vous savez quoi mettre de côté chaque mois, au lieu de découvrir la facture en avril.',
      'f3.l': ['Pension alimentaire, frais de garde, 3e pilier déduits', 'Coefficient de votre commune', 'Un toucher pour en faire une charge du mois'],
      'v3.title': 'Impôts 2026', 'v3.income': 'Revenu net annuel', 'v3.ded': 'Déductions', 'v3.taxable': 'Revenu imposable', 'v3.canton': 'Impôt cantonal', 'v3.commune': 'Impôt communal', 'v3.ifd': 'Impôt fédéral direct', 'v3.month': 'Par mois',
      'f4.t': 'Le mois prochain, déjà sous contrôle', 'f4.p': 'Notez maintenant les dépenses qui viennent : cadeaux, garage, facture annuelle. Franko vous dit ce qu’il vous restera avec le prochain salaire.',
      'f4.l': ['Rattachées au bon mois de salaire', 'Comptées une seule fois, comme une charge', 'Le manque du mois en cours est signalé'],
      'v4.title': 'Décembre', 'v4.when': 'salaire vers le 20', 'v4.salary': 'Salaire prévu', 'v4.fixed': 'Charges fixes', 'v4.gift': 'Cadeaux de Noël', 'v4.giftS': 'dépense prévue', 'v4.garage': 'Garage', 'v4.after': 'Reste après charges', 'v4.daily': 'Pour le quotidien', 'v4.dailyS': 'environ 54 CHF par jour',
      'm1.t': 'Saisie en une phrase', 'm1.p': '« couches 24.90 coop », « hier 45 Migros » : montant, date et catégorie sont compris, en trois langues.',
      'm2.t': 'Diviser un paiement', 'm2.p': 'Un virement de 1’075 = loyer + crèche + remboursement. Franko s’en souvient pour les mois suivants.',
      'm3.t': 'Mois par mois', 'm3.p': 'Revenus, dépenses et solde de chaque mois de salaire, en graphique et en tableau.',
      'm4.t': 'Tous vos appareils', 'm4.p': 'Le même budget sur votre téléphone et celui de votre partenaire, sans écraser les changements.',
      'm5.t': 'Rappels utiles', 'm5.p': 'Charges en retard, rythme de dépense trop rapide, grosses dépenses : signalés au bon moment.',
      'm6.t': 'Hors ligne et privé', 'm6.p': 'L’app fonctionne sans réseau. Sans compte, vos chiffres ne quittent jamais votre téléphone.',
      'how.kicker': 'Démarrage', 'how.h2': 'Prêt en trois minutes', 'how.1t': 'Votre salaire et votre canton', 'how.1p': 'Franko repère ensuite seul le jour où le salaire arrive et nomme vos mois en conséquence.',
      'how.2t': 'Vos charges fixes', 'how.2p': 'Loyer, LAMal, crèche, leasing, téléphone. Vous touchez « Payé » quand c’est fait, ou votre relevé le confirme.', 'how.3t': 'Votre quotidien', 'how.3p': 'Tapez ou dictez vos dépenses. Franko met à jour ce qui vous reste et ce que vous pouvez dépenser par jour.',
      'cmp.kicker': 'Comparatif', 'cmp.h2': 'Pourquoi pas un tableur ou l’app de votre banque ?', 'cmp.sheet': 'Tableur', 'cmp.bank': 'App bancaire',
      cmp: [['Ne compte que ce qui est payé', 'yes', 'part:À la main', 'no'], ['Montre le solde après les factures à venir', 'yes', 'part:À la main', 'no'], ['Mois du salaire au salaire', 'yes', 'part:À la main', 'no'], ['Relevés de plusieurs banques', 'yes', 'part:Copier-coller', 'no'], ['Impôts suisses estimés', 'yes', 'no', 'no'], ['Français, allemand, italien', 'yes', 'part:Selon le fichier', 'part:Selon la banque'], ['Sur le téléphone, en une phrase', 'yes', 'no', 'part:Lecture seule']],
      'price.kicker': 'Prix', 'price.h2': 'Simple, transparent, sans engagement', 'price.lead': 'Commencez gratuitement. Passez à Pro quand vous voulez l’import des relevés et les impôts.',
      'price.monthly': 'Mensuel', 'price.yearly': 'Annuel', 'price.save': '−16 %', 'price.free': 'Gratuit', 'price.forever': 'Pour toujours', 'price.freeCta': 'Commencer', 'price.badge': '30 jours offerts', 'price.proCta': 'Essayer Pro gratuitement',
      'price.freeL': ['Calcul du mois et charges fixes', 'Saisie rapide et dictée', 'Prévoir le mois prochain', 'Les 3 derniers mois'],
      'price.proL': ['Tout le plan gratuit', 'Import des relevés de toutes les banques', 'Estimation des impôts', 'Historique complet', 'Synchronisation sur tous vos appareils'],
      'price.perMonth': 'CHF / mois', 'price.perYear': 'CHF / an', 'price.billedMonth': 'Facturé chaque mois, résiliable à tout moment', 'price.billedYear': 'Soit {m} CHF par mois, facturé une fois par an',
      'price.fine': 'Prix TTC en francs suisses. Résiliation en deux clics. Paiement sécurisé par Stripe.',
      'faq.h2': 'Questions fréquentes',
      faq: [['Où sont stockées mes données ?', 'Sans compte, uniquement dans votre navigateur. Avec un compte, dans une base de données chiffrée en Europe, accessible à vous seul. Franko ne se connecte jamais à votre banque : vous importez vous-même vos relevés.'],
        ['Mon canton est-il pris en charge ?', 'L’impôt fédéral est calculé pour toute la Suisse. L’estimation cantonale couvre Fribourg et s’étend canton par canton ; ailleurs, vous indiquez le montant de votre bordereau et Franko le répartit par mois.'],
        ['Quelles banques sont compatibles ?', 'Toutes celles qui exportent un relevé CSV : PostFinance, UBS, Raiffeisen, banques cantonales, Migros Bank, Neon, Revolut, Yuh… Franko reconnaît les colonnes de date, de montant et de libellé.'],
        ['Puis-je partager le budget avec mon ou ma partenaire ?', 'Oui. Connectez-vous avec le même compte sur vos deux téléphones : les changements se fusionnent sans s’écraser.'],
        ['Que se passe-t-il après l’essai ?', 'Si vous ne résiliez pas, l’abonnement Pro commence au prix choisi. Sinon vous gardez vos données et le plan gratuit.'],
        ['Comment résilier ?', 'En deux clics depuis Réglages › Compte et abonnement. Aucun courrier, aucun délai.']],
      'final.h2': 'Sachez enfin ce qu’il vous reste.', 'final.p': 'Gratuit, sans carte bancaire, prêt en trois minutes.', 'final.cta': 'Commencer gratuitement', 'final.cta2': 'Voir les prix',
      'foot.about': 'Le budget familial pensé pour la Suisse : du salaire au salaire, en CHF, dans votre langue.', 'foot.product': 'Produit', 'foot.help': 'Aide', 'foot.how': 'Comment ça marche', 'foot.legal': 'Légal', 'foot.terms': 'Conditions d’utilisation', 'foot.privacy': 'Protection des données', 'foot.made': 'Conçu à Fribourg',
    },
    de: {
      'nav.features': 'Funktionen', 'nav.pricing': 'Preise', 'nav.faq': 'Fragen', 'nav.signin': 'App öffnen', 'nav.cta': 'Gratis testen',
      'hero.eyebrow': 'Familienbudget · Schweiz', 'hero.h1': 'Was Ihnen bleibt, <em>wenn alles bezahlt ist.</em>',
      'hero.lead': 'Franko begleitet Ihren Monat von Lohn zu Lohn. Es zählt nur, was wirklich bezahlt ist, hält Offenes getrennt und sagt Ihnen, was Sie pro Tag ausgeben können.',
      'hero.cta': 'Gratis starten', 'hero.cta2': 'So funktioniert’s', 'hero.c1': 'Ohne Kreditkarte', 'hero.c2': 'Deutsch · Français · Italiano', 'hero.c3': 'Daten in Europa',
      'ui.month': 'November · noch 25 T.', 'ui.available': 'Wenn alles bezahlt ist', 'ui.ok': 'Im Budget', 'ui.perday': 'Etwa 88 CHF pro Tag bis zum 20. Dez.', 'ui.notpaid': 'Diesen Monat noch offen',
      'ui.rent': 'Miete', 'ui.health': 'Krankenkasse', 'ui.tax': 'Steuern', 'ui.phone': 'Telefon', 'ui.paid': 'Bezahlt', 'ui.pay': 'Bezahlt?',
      'fl.1t': 'Miete bezahlt', 'fl.1s': 'vom Kontoauszug bestätigt', 'fl.2t': 'Steuern: 598 CHF / Monat', 'fl.2s': 'Schätzung Freiburg + DBSt',
      banks: 'Liest CSV-Auszüge von', 'truth.kicker': 'Das Problem', 'truth.h2': 'Ihr Kontostand sagt nicht, was Ihnen bleibt.',
      'truth.lead': 'Miete, Krankenkasse und Steuern kommen später im Monat. Das Geld ist auf dem Konto, aber schon verplant.',
      'truth.1': '<b>Franko zieht ab, was bezahlt ist</b>, sobald Sie es markieren oder der Kontoauszug es bestätigt.',
      'truth.2': '<b>Offenes bleibt getrennt</b>: Sie sehen Ihren Stand nach allen Rechnungen des Monats.',
      'truth.3': '<b>Es warnt früh</b>, wenn der Lohn nicht reicht, bevor das Konto ins Minus rutscht.',
      'led.bank': 'Heute auf dem Konto', 'led.bankS': 'was die Bank-App zeigt', 'led.bills': 'Noch offene Rechnungen', 'led.billsS': 'Steuern, Krankenkasse, Telefon, Strom', 'led.real': 'Was Ihnen wirklich bleibt',
      'feat.kicker': 'Funktionen', 'feat.h2': 'Alles, was ein Schweizer Budget braucht', 'feat.lead': 'Gebaut um den echten Alltag eines Haushalts: Lohn am 20., Miete am 1., Krankenkasse, Kita, Unterhalt, Steuerakonto.',
      'f1.t': 'Eine Monatsrechnung, die Sie verstehen', 'f1.p': 'Jeder Franken ist erklärt, vom erhaltenen Lohn bis zum Rest nach allen Rechnungen. Bezahltes wird abgezogen, Offenes bleibt separat.',
      'f1.l': ['Monat von Lohn zu Lohn, automatisch erkannt', 'Steuer- und Versicherungsakonti ohne Doppelzählung', 'Sparen und Anlegen zählen, sobald erledigt'],
      'v1.salary': 'Erhaltener Lohn', 'v1.fixed': 'Bezahlte Fixkosten', 'v1.fixedS': '4/8 bezahlt', 'v1.after': 'Rest nach bezahlten Fixkosten', 'v1.daily': 'Im Alltag ausgegeben', 'v1.dailyS': 'seit dem 20. Nov.', 'v1.now': 'Jetzt verfügbar', 'v1.pending': 'Noch nicht bezahlt', 'v1.pendingS': 'Steuern, Telefon, Strom', 'v1.all': 'Wenn alles bezahlt ist',
      'f2.t': 'Ihre Kontoauszüge, ohne Doppelte', 'f2.p': 'Exportieren Sie das CSV aus dem E-Banking: Franko erkennt bereits erfasste Ausgaben, bezahlte Fixkosten, Überträge zwischen Ihren Konten und auszuschliessende Ausgaben.',
      'f2.l': ['PostFinance, UBS, Raiffeisen, Kantonalbanken, Neon, Revolut', 'Automatische Kategorien, die aus Ihren Korrekturen lernen', 'Keine Verbindung zur Bank: die Datei wird auf Ihrem Gerät gelesen'],
      'v2.title': 'Auszug Neon · November', 'v2.read': '24 gelesen', 'v2.dup': '✓ bereits erfasst', 'v2.cat': 'Einkauf', 'v2.transfer': 'Übertrag',
      'f3.t': 'Ihre Steuern, Monat für Monat', 'f3.p': 'Exakte Bundessteuer und Kantonsschätzung mit Ihren Abzügen. Sie wissen, was Sie jeden Monat zurücklegen müssen, statt im April überrascht zu werden.',
      'f3.l': ['Unterhalt, Betreuungskosten, Säule 3a abgezogen', 'Steuerfuss Ihrer Gemeinde', 'Mit einem Tipp als Monatsposten übernehmen'],
      'v3.title': 'Steuern 2026', 'v3.income': 'Jährliches Nettoeinkommen', 'v3.ded': 'Abzüge', 'v3.taxable': 'Steuerbares Einkommen', 'v3.canton': 'Kantonssteuer', 'v3.commune': 'Gemeindesteuer', 'v3.ifd': 'Direkte Bundessteuer', 'v3.month': 'Pro Monat',
      'f4.t': 'Der nächste Monat, schon im Griff', 'f4.p': 'Erfassen Sie jetzt, was kommt: Geschenke, Garage, Jahresrechnung. Franko zeigt Ihnen, was mit dem nächsten Lohn bleibt.',
      'f4.l': ['Dem richtigen Lohnmonat zugeordnet', 'Einmal gezählt, wie eine Rechnung', 'Ein Minus des laufenden Monats wird angezeigt'],
      'v4.title': 'Dezember', 'v4.when': 'Lohn um den 20.', 'v4.salary': 'Erwarteter Lohn', 'v4.fixed': 'Fixkosten', 'v4.gift': 'Weihnachtsgeschenke', 'v4.giftS': 'geplante Ausgabe', 'v4.garage': 'Garage', 'v4.after': 'Rest nach Fixkosten', 'v4.daily': 'Für den Alltag', 'v4.dailyS': 'etwa 54 CHF pro Tag',
      'm1.t': 'Erfassen in einem Satz', 'm1.p': '«Windeln 24.90 Coop», «gestern 45 Migros»: Betrag, Datum und Kategorie werden erkannt, in drei Sprachen.',
      'm2.t': 'Zahlung aufteilen', 'm2.p': 'Eine Überweisung von 1’075 = Miete + Kita + Rückzahlung. Franko merkt es sich für die nächsten Monate.',
      'm3.t': 'Monat für Monat', 'm3.p': 'Einnahmen, Ausgaben und Saldo jedes Lohnmonats, als Grafik und Tabelle.',
      'm4.t': 'Alle Ihre Geräte', 'm4.p': 'Dasselbe Budget auf Ihrem Telefon und dem Ihres Partners, ohne Änderungen zu überschreiben.',
      'm5.t': 'Hilfreiche Hinweise', 'm5.p': 'Verspätete Rechnungen, zu schnelles Ausgabetempo, grosse Ausgaben: im richtigen Moment gemeldet.',
      'm6.t': 'Offline und privat', 'm6.p': 'Die App funktioniert ohne Netz. Ohne Konto verlassen Ihre Zahlen nie Ihr Telefon.',
      'how.kicker': 'Start', 'how.h2': 'In drei Minuten bereit', 'how.1t': 'Ihr Lohn und Ihr Kanton', 'how.1p': 'Franko erkennt danach selbst, wann der Lohn eintrifft, und benennt Ihre Monate entsprechend.',
      'how.2t': 'Ihre Fixkosten', 'how.2p': 'Miete, Krankenkasse, Kita, Leasing, Telefon. Sie tippen «Bezahlt», sobald es erledigt ist, oder der Kontoauszug bestätigt es.', 'how.3t': 'Ihr Alltag', 'how.3p': 'Tippen oder diktieren Sie Ihre Ausgaben. Franko aktualisiert, was Ihnen bleibt und was Sie pro Tag ausgeben können.',
      'cmp.kicker': 'Vergleich', 'cmp.h2': 'Warum nicht eine Tabelle oder die Bank-App?', 'cmp.sheet': 'Tabelle', 'cmp.bank': 'Bank-App',
      cmp: [['Zählt nur Bezahltes', 'yes', 'part:Von Hand', 'no'], ['Zeigt den Stand nach offenen Rechnungen', 'yes', 'part:Von Hand', 'no'], ['Monat von Lohn zu Lohn', 'yes', 'part:Von Hand', 'no'], ['Auszüge mehrerer Banken', 'yes', 'part:Kopieren', 'no'], ['Schweizer Steuern geschätzt', 'yes', 'no', 'no'], ['Deutsch, Französisch, Italienisch', 'yes', 'part:Je nach Datei', 'part:Je nach Bank'], ['Auf dem Telefon, in einem Satz', 'yes', 'no', 'part:Nur lesen']],
      'price.kicker': 'Preise', 'price.h2': 'Einfach, transparent, ohne Bindung', 'price.lead': 'Starten Sie gratis. Wechseln Sie zu Pro, wenn Sie Kontoauszüge importieren und Steuern schätzen möchten.',
      'price.monthly': 'Monatlich', 'price.yearly': 'Jährlich', 'price.save': '−16 %', 'price.free': 'Gratis', 'price.forever': 'Für immer', 'price.freeCta': 'Starten', 'price.badge': '30 Tage geschenkt', 'price.proCta': 'Pro gratis testen',
      'price.freeL': ['Monatsrechnung und Fixkosten', 'Schnelle Erfassung und Diktat', 'Den nächsten Monat planen', 'Die letzten 3 Monate'],
      'price.proL': ['Alles aus dem Gratisplan', 'Import von Auszügen aller Banken', 'Steuerschätzung', 'Ganzer Verlauf', 'Synchronisation auf allen Geräten'],
      'price.perMonth': 'CHF / Monat', 'price.perYear': 'CHF / Jahr', 'price.billedMonth': 'Monatlich verrechnet, jederzeit kündbar', 'price.billedYear': 'Also {m} CHF pro Monat, einmal jährlich verrechnet',
      'price.fine': 'Preise inkl. MWST in Schweizer Franken. Kündigung mit zwei Klicks. Sichere Zahlung über Stripe.',
      'faq.h2': 'Häufige Fragen',
      faq: [['Wo werden meine Daten gespeichert?', 'Ohne Konto nur in Ihrem Browser. Mit Konto in einer verschlüsselten Datenbank in Europa, nur für Sie zugänglich. Franko verbindet sich nie mit Ihrer Bank: Sie importieren Ihre Auszüge selbst.'],
        ['Wird mein Kanton unterstützt?', 'Die Bundessteuer wird für die ganze Schweiz berechnet. Die Kantonsschätzung deckt Freiburg ab und wird Kanton für Kanton erweitert; andernorts geben Sie den Betrag Ihrer Steuerrechnung ein und Franko verteilt ihn auf die Monate.'],
        ['Welche Banken sind kompatibel?', 'Alle, die einen CSV-Auszug exportieren: PostFinance, UBS, Raiffeisen, Kantonalbanken, Migros Bank, Neon, Revolut, Yuh… Franko erkennt Datums-, Betrags- und Textspalten.'],
        ['Kann ich das Budget mit meinem Partner teilen?', 'Ja. Melden Sie sich auf beiden Telefonen mit demselben Konto an: Änderungen werden zusammengeführt, ohne sich zu überschreiben.'],
        ['Was passiert nach dem Test?', 'Wenn Sie nicht kündigen, beginnt das Pro-Abo zum gewählten Preis. Sonst behalten Sie Ihre Daten und den Gratisplan.'],
        ['Wie kündige ich?', 'Mit zwei Klicks unter Einstellungen › Konto und Abo. Kein Brief, keine Frist.']],
      'final.h2': 'Wissen Sie endlich, was Ihnen bleibt.', 'final.p': 'Gratis, ohne Kreditkarte, in drei Minuten bereit.', 'final.cta': 'Gratis starten', 'final.cta2': 'Preise ansehen',
      'foot.about': 'Das Familienbudget für die Schweiz: von Lohn zu Lohn, in CHF, in Ihrer Sprache.', 'foot.product': 'Produkt', 'foot.help': 'Hilfe', 'foot.how': 'So funktioniert’s', 'foot.legal': 'Rechtliches', 'foot.terms': 'Nutzungsbedingungen', 'foot.privacy': 'Datenschutz', 'foot.made': 'Entwickelt in Freiburg',
    },
    it: {
      'nav.features': 'Funzioni', 'nav.pricing': 'Prezzi', 'nav.faq': 'Domande', 'nav.signin': 'Apri l’app', 'nav.cta': 'Prova gratuita',
      'hero.eyebrow': 'Budget familiare · Svizzera', 'hero.h1': 'Quanto le resta, <em>dopo aver pagato tutto.</em>',
      'hero.lead': 'Franko segue il suo mese da un salario all’altro. Conta solo ciò che è davvero pagato, tiene a parte ciò che resta da pagare e le dice quanto può spendere ogni giorno.',
      'hero.cta': 'Iniziare gratis', 'hero.cta2': 'Come funziona', 'hero.c1': 'Senza carta di credito', 'hero.c2': 'Italiano · Deutsch · Français', 'hero.c3': 'Dati in Europa',
      'ui.month': 'novembre · −25 g.', 'ui.available': 'Dopo aver pagato tutto', 'ui.ok': 'Nel budget', 'ui.perday': 'Circa 88 CHF al giorno fino al 20 dic.', 'ui.notpaid': 'Non ancora pagato questo mese',
      'ui.rent': 'Affitto', 'ui.health': 'Cassa malati', 'ui.tax': 'Imposte', 'ui.phone': 'Telefono', 'ui.paid': 'Pagato', 'ui.pay': 'Pagato?',
      'fl.1t': 'Affitto pagato', 'fl.1s': 'confermato dall’estratto', 'fl.2t': 'Imposte: 598 CHF / mese', 'fl.2s': 'stima Friburgo + IFD',
      banks: 'Legge gli estratti CSV di', 'truth.kicker': 'Il problema', 'truth.h2': 'Il saldo del conto non dice quanto le resta.',
      'truth.lead': 'Affitto, cassa malati e imposte arrivano più tardi nel mese. I soldi sono sul conto, ma sono già promessi.',
      'truth.1': '<b>Franko deduce ciò che è pagato</b>, quando lo segna o quando l’estratto lo conferma.',
      'truth.2': '<b>Tiene a parte ciò che resta da pagare</b>: vede il saldo dopo tutte le fatture del mese.',
      'truth.3': '<b>L’avvisa presto</b> quando il salario non basterà, prima che il conto vada in rosso.',
      'led.bank': 'Oggi sul conto', 'led.bankS': 'ciò che mostra l’app della banca', 'led.bills': 'Fatture non ancora pagate', 'led.billsS': 'imposte, cassa malati, telefono, elettricità', 'led.real': 'Ciò che le resta davvero',
      'feat.kicker': 'Funzioni', 'feat.h2': 'Tutto ciò che serve a un budget svizzero', 'feat.lead': 'Costruito sulla vita reale di una famiglia: salario il 20, affitto il 1°, cassa malati, asilo nido, alimenti, acconti d’imposta.',
      'f1.t': 'Un calcolo del mese che capisce', 'f1.p': 'Ogni franco è spiegato, dal salario ricevuto a ciò che resta dopo tutte le fatture. I pagamenti fatti sono dedotti, gli altri restano a parte.',
      'f1.l': ['Mese da salario a salario, riconosciuto automaticamente', 'Acconti d’imposta e assicurazione senza doppio conteggio', 'Risparmio e investimento contati quando fatti'],
      'v1.salary': 'Salario ricevuto', 'v1.fixed': 'Spese pagate', 'v1.fixedS': '4/8 pagate', 'v1.after': 'Resta dopo le spese pagate', 'v1.daily': 'Speso nel quotidiano', 'v1.dailyS': 'dal 20 nov.', 'v1.now': 'Disponibile ora', 'v1.pending': 'Non ancora pagato', 'v1.pendingS': 'Imposte, telefono, elettricità', 'v1.all': 'Dopo aver pagato tutto',
      'f2.t': 'I suoi estratti, senza doppioni', 'f2.p': 'Esporti il CSV dall’e-banking: Franko riconosce le spese già inserite, le spese fisse pagate, i giroconti tra i suoi conti e le spese da escludere.',
      'f2.l': ['PostFinance, UBS, Raiffeisen, BancaStato, Neon, Revolut', 'Categorie automatiche che imparano dalle sue correzioni', 'Nessun collegamento alla banca: il file è letto sul suo dispositivo'],
      'v2.title': 'Estratto Neon · novembre', 'v2.read': '24 letti', 'v2.dup': '✓ già inserito', 'v2.cat': 'Spesa', 'v2.transfer': 'giroconto',
      'f3.t': 'Le sue imposte, mese per mese', 'f3.p': 'Imposta federale esatta e stima cantonale con le sue deduzioni. Sa quanto mettere da parte ogni mese, invece di scoprire la fattura in aprile.',
      'f3.l': ['Alimenti, spese di custodia, 3° pilastro dedotti', 'Moltiplicatore del suo comune', 'Con un tocco diventa una spesa del mese'],
      'v3.title': 'Imposte 2026', 'v3.income': 'Reddito netto annuo', 'v3.ded': 'Deduzioni', 'v3.taxable': 'Reddito imponibile', 'v3.canton': 'Imposta cantonale', 'v3.commune': 'Imposta comunale', 'v3.ifd': 'Imposta federale diretta', 'v3.month': 'Al mese',
      'f4.t': 'Il mese prossimo, già sotto controllo', 'f4.p': 'Annoti ora le spese in arrivo: regali, garage, fattura annuale. Franko le dice quanto le resterà con il prossimo salario.',
      'f4.l': ['Collegate al giusto mese di salario', 'Contate una sola volta, come una spesa fissa', 'L’ammanco del mese in corso è segnalato'],
      'v4.title': 'Dicembre', 'v4.when': 'salario verso il 20', 'v4.salary': 'Salario previsto', 'v4.fixed': 'Spese fisse', 'v4.gift': 'Regali di Natale', 'v4.giftS': 'spesa prevista', 'v4.garage': 'Garage', 'v4.after': 'Resta dopo le spese', 'v4.daily': 'Per il quotidiano', 'v4.dailyS': 'circa 54 CHF al giorno',
      'm1.t': 'Inserimento in una frase', 'm1.p': '«pannolini 24.90 coop», «ieri 45 Migros»: importo, data e categoria vengono capiti, in tre lingue.',
      'm2.t': 'Dividere un pagamento', 'm2.p': 'Un bonifico di 1’075 = affitto + asilo nido + rimborso. Franko se lo ricorda per i mesi seguenti.',
      'm3.t': 'Mese per mese', 'm3.p': 'Entrate, uscite e saldo di ogni mese di salario, in grafico e in tabella.',
      'm4.t': 'Tutti i suoi dispositivi', 'm4.p': 'Lo stesso budget sul suo telefono e su quello del partner, senza sovrascrivere le modifiche.',
      'm5.t': 'Promemoria utili', 'm5.p': 'Spese in ritardo, ritmo di spesa troppo rapido, spese importanti: segnalati al momento giusto.',
      'm6.t': 'Offline e privato', 'm6.p': 'L’app funziona senza rete. Senza account, le sue cifre non lasciano mai il telefono.',
      'how.kicker': 'Avvio', 'how.h2': 'Pronto in tre minuti', 'how.1t': 'Salario e cantone', 'how.1p': 'Franko riconosce poi da solo il giorno in cui arriva il salario e nomina i mesi di conseguenza.',
      'how.2t': 'Le spese fisse', 'how.2p': 'Affitto, cassa malati, asilo nido, leasing, telefono. Tocca «Pagato» quando è fatto, oppure lo conferma l’estratto.', 'how.3t': 'Il quotidiano', 'how.3p': 'Scriva o detti le spese. Franko aggiorna quanto le resta e quanto può spendere al giorno.',
      'cmp.kicker': 'Confronto', 'cmp.h2': 'Perché non un foglio di calcolo o l’app della banca?', 'cmp.sheet': 'Foglio di calcolo', 'cmp.bank': 'App bancaria',
      cmp: [['Conta solo ciò che è pagato', 'yes', 'part:A mano', 'no'], ['Mostra il saldo dopo le fatture in arrivo', 'yes', 'part:A mano', 'no'], ['Mese da salario a salario', 'yes', 'part:A mano', 'no'], ['Estratti di più banche', 'yes', 'part:Copia-incolla', 'no'], ['Imposte svizzere stimate', 'yes', 'no', 'no'], ['Italiano, tedesco, francese', 'yes', 'part:Secondo il file', 'part:Secondo la banca'], ['Sul telefono, in una frase', 'yes', 'no', 'part:Sola lettura']],
      'price.kicker': 'Prezzi', 'price.h2': 'Semplice, trasparente, senza impegno', 'price.lead': 'Inizi gratis. Passi a Pro quando vuole importare gli estratti e stimare le imposte.',
      'price.monthly': 'Mensile', 'price.yearly': 'Annuale', 'price.save': '−16 %', 'price.free': 'Gratuito', 'price.forever': 'Per sempre', 'price.freeCta': 'Iniziare', 'price.badge': '30 giorni offerti', 'price.proCta': 'Provare Pro gratis',
      'price.freeL': ['Calcolo del mese e spese fisse', 'Inserimento rapido e dettatura', 'Pianificare il mese prossimo', 'Gli ultimi 3 mesi'],
      'price.proL': ['Tutto il piano gratuito', 'Importazione degli estratti di tutte le banche', 'Stima delle imposte', 'Storico completo', 'Sincronizzazione su tutti i dispositivi'],
      'price.perMonth': 'CHF / mese', 'price.perYear': 'CHF / anno', 'price.billedMonth': 'Fatturato ogni mese, disdicibile in ogni momento', 'price.billedYear': 'Cioè {m} CHF al mese, fatturato una volta all’anno',
      'price.fine': 'Prezzi IVA inclusa in franchi svizzeri. Disdetta in due clic. Pagamento sicuro con Stripe.',
      'faq.h2': 'Domande frequenti',
      faq: [['Dove sono salvati i miei dati?', 'Senza account, solo nel suo browser. Con un account, in una banca dati cifrata in Europa, accessibile solo a lei. Franko non si collega mai alla sua banca: importa lei stessa gli estratti.'],
        ['Il mio cantone è supportato?', 'L’imposta federale è calcolata per tutta la Svizzera. La stima cantonale copre Friburgo e si estende cantone per cantone; altrove indica l’importo della sua fattura e Franko lo ripartisce sui mesi.'],
        ['Quali banche sono compatibili?', 'Tutte quelle che esportano un estratto CSV: PostFinance, UBS, Raiffeisen, BancaStato, Banca Migros, Neon, Revolut, Yuh… Franko riconosce le colonne di data, importo e descrizione.'],
        ['Posso condividere il budget con il mio partner?', 'Sì. Acceda con lo stesso account sui due telefoni: le modifiche si uniscono senza sovrascriversi.'],
        ['Cosa succede dopo la prova?', 'Se non disdice, l’abbonamento Pro inizia al prezzo scelto. Altrimenti conserva i dati e il piano gratuito.'],
        ['Come disdire?', 'In due clic da Impostazioni › Account e abbonamento. Nessuna lettera, nessun termine.']],
      'final.h2': 'Sappia finalmente quanto le resta.', 'final.p': 'Gratis, senza carta di credito, pronto in tre minuti.', 'final.cta': 'Iniziare gratis', 'final.cta2': 'Vedere i prezzi',
      'foot.about': 'Il budget familiare pensato per la Svizzera: da salario a salario, in CHF, nella sua lingua.', 'foot.product': 'Prodotto', 'foot.help': 'Aiuto', 'foot.how': 'Come funziona', 'foot.legal': 'Note legali', 'foot.terms': 'Condizioni d’uso', 'foot.privacy': 'Protezione dei dati', 'foot.made': 'Progettato a Friburgo',
    },
  };
  const ICON = (id) => `<svg aria-hidden="true"><use href="#i-${id}"/></svg>`;
  let lang = 'fr', bill = 'month';

  function price() {
    const d = L[lang];
    const year = bill === 'year';
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
    document.querySelectorAll('[data-list]').forEach((el) => { el.innerHTML = (d[el.dataset.list] || []).map((x) => `<li>${ICON('check')}<span>${x}</span></li>`).join(''); });
    const mark = (v) => (v === 'yes' ? `<span class="yes">${ICON('check')}</span>` : v === 'no' ? `<span class="no">${ICON('x')}</span>` : `<span class="part">${v.slice(5)}</span>`);
    document.getElementById('cmpBody').innerHTML = d.cmp.map((r) => `<tr><th scope="row">${r[0]}</th><td class="us">${mark(r[1])}</td><td>${mark(r[2])}</td><td>${mark(r[3])}</td></tr>`).join('');
    document.getElementById('faqList').innerHTML = d.faq.map(([q, a]) => `<details><summary>${q}</summary><p>${a}</p></details>`).join('');
    document.querySelectorAll('[data-lang]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.lang === lang));
    price();
    try { const st = JSON.parse(localStorage.getItem('franko.ui.state') || '{}'); st.lang = lang; localStorage.setItem('franko.ui.state', JSON.stringify(st)); } catch (e) { /* préférence non retenue */ }
  }
  let start = 'fr';
  try { start = JSON.parse(localStorage.getItem('franko.ui.state') || '{}').lang || navigator.language.slice(0, 2); } catch (e) { start = (navigator.language || 'fr').slice(0, 2); }
  apply(start);
  document.addEventListener('click', (e) => {
    const lb = e.target.closest('[data-lang]'); if (lb) { apply(lb.dataset.lang); return; }
    const bb = e.target.closest('[data-bill]'); if (bb) { bill = bb.dataset.bill; price(); }
  });
  const nav = document.getElementById('nav');
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
})();
