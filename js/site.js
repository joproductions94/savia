/* Franko — page publique : textes FR / DE / IT, sélecteur mensuel/annuel, comparatif, FAQ et animations.
   Tous les textes sont écrits ici même (aucune donnée externe) : leur insertion en HTML est sans risque. */
(function () {
  'use strict';
  const cfg = window.FRANKO_CONFIG || {};
  const PM = cfg.priceMonth || '4.90', PY = cfg.priceYear || '49';
  const L = {
    fr: {
      'nav.features': 'Fonctionnalités', 'nav.pricing': 'Prix', 'nav.faq': 'Questions', 'nav.signin': 'Ouvrir l’app', 'nav.cta': 'Essayer',
      'hero.eyebrow': 'Budget familial pour la Suisse', 'hero.h1': 'Combien il vous reste, <em>une fois tout payé.</em>',
      'hero.lead': 'Franko ne déduit que ce que vous avez déjà payé. Le loyer et les impôts qui tombent plus tard restent à part, et vous voyez chaque jour combien vous pouvez encore dépenser.',
      'hero.cta': 'Essayer gratuitement', 'hero.cta2': 'Voir comment ça marche', 'hero.c1': 'Sans carte bancaire', 'hero.c2': 'En français, en allemand et en italien',
      'ui.month': 'novembre · J-25', 'ui.available': 'Après tout payé', 'ui.ok': 'Dans le budget', 'ui.perday': 'Environ 88 CHF par jour jusqu’au 20 déc.', 'ui.notpaid': 'Pas encore payé ce mois',
      'ui.rent': 'Loyer', 'ui.health': 'Assurance maladie', 'ui.tax': 'Impôts', 'ui.phone': 'Téléphone', 'ui.paid': 'Payé', 'ui.pay': 'Payé ?',
      'ui.pace': 'Rythme du mois', 'ui.paceNote': '96 CHF dépensés sur 2’299 disponibles', 'ui.next': 'Décembre', 'ui.nextSalary': 'Salaire prévu', 'ui.nextFixed': 'Charges fixes', 'ui.nextGift': 'Cadeaux de Noël', 'ui.nextDaily': 'Pour le quotidien', 'ui.where': 'Où part l’argent', 'ui.catFood': 'Courses', 'ui.catOut': 'Sorties', 'ui.catMove': 'Transports', 'ui.noted': 'noté le 25 novembre', 'ui.addPlanned': 'Noter une dépense de décembre',
      'fl.1t': 'Loyer payé', 'fl.1s': 'confirmé par le relevé', 'fl.2t': 'Impôts : 598 CHF par mois', 'fl.2s': 'estimés pour Fribourg',
      banks: 'Importe les relevés CSV de', 'truth.kicker': 'Pourquoi Franko', 'truth.h2': 'Le solde de votre compte vous rassure trop tôt.',
      'truth.lead': 'Le 22, il reste 929 francs sur le compte. L’assurance maladie, les impôts et l’électricité ne sont pas encore passés. Une fois payés, il manque 380 francs.',
      'truth.1': '<b>Franko déduit un paiement quand il est fait</b>, au moment où vous le cochez ou quand votre relevé le confirme.',
      'truth.2': '<b>Ce qui reste à payer est affiché à part.</b> Vous voyez votre vrai solde avant la fin du mois, pas après.',
      'led.bank': 'Sur le compte aujourd’hui', 'led.bankS': 'ce que montre l’app de la banque', 'led.bills': 'Factures pas encore payées', 'led.billsS': 'impôts, assurance, téléphone, électricité', 'led.real': 'Ce qui vous reste vraiment',
      'found.quote': '« J’ai écrit Franko pour le budget de ma famille, à Fribourg. Mon compte affichait un bon solde et je dépensais en conséquence. Je ne comptais pas les factures qui tombaient dix jours plus tard. »',
      'found.name': 'Jo', 'found.role': 'Fondateur · jo.productions, Fribourg',
      'feat.kicker': 'Fonctionnalités', 'feat.h2': 'Fait pour un mois suisse : le salaire le 20, le loyer le 1er.', 'feat.lead': 'LAMal, crèche, pension alimentaire, acomptes d’impôts. Franko traite ces charges au moment où elles passent vraiment.',
      'f1.t': 'Le calcul du mois, ligne par ligne', 'f1.p': 'Du salaire reçu au solde après toutes les factures, chaque montant a sa ligne. Un acompte d’impôts réduit la charge Impôts au lieu de s’y ajouter.',
      'f1.l': ['Le mois commence le jour où le salaire arrive', 'L’épargne compte quand le virement est fait'],
      'v1.salary': 'Salaire reçu', 'v1.fixed': 'Charges payées', 'v1.fixedS': '4 sur 8', 'v1.after': 'Reste après charges payées', 'v1.daily': 'Dépensé au quotidien', 'v1.dailyS': 'depuis le 20 nov.', 'v1.now': 'Disponible maintenant', 'v1.pending': 'Pas encore payé', 'v1.pendingS': 'impôts, téléphone, électricité', 'v1.all': 'Après tout payé',
      'f2.t': 'Vos relevés bancaires, sans doublons', 'f2.p': 'Exportez le CSV de votre e-banking et ouvrez-le dans Franko. Les dépenses déjà notées, les charges payées et les virements entre vos comptes sont reconnus.',
      'f2.l': ['PostFinance, UBS, Raiffeisen, banques cantonales, Neon, Revolut', 'Si vous corrigez une catégorie, Franko la retient pour la prochaine fois', 'Le fichier est lu sur votre téléphone. Franko ne se connecte pas à votre banque'],
      'v2.title': 'Relevé Neon · novembre', 'v2.read': '24 lignes', 'v2.dup': '✓ déjà noté', 'v2.cat': 'Courses', 'v2.transfer': 'virement',
      'f3.t': 'Vos impôts, mis de côté chaque mois', 'f3.p': 'Franko calcule l’impôt fédéral et estime l’impôt cantonal avec vos déductions. Vous mettez de côté le bon montant chaque mois, et la facture d’avril ne surprend plus personne.',
      'f3.l': ['Pension alimentaire, frais de garde et 3e pilier déduits', 'Le coefficient de votre commune est pris en compte'],
      'v3.title': 'Impôts 2026', 'v3.income': 'Revenu net annuel', 'v3.ded': 'Déductions', 'v3.taxable': 'Revenu imposable', 'v3.canton': 'Impôt cantonal', 'v3.commune': 'Impôt communal', 'v3.ifd': 'Impôt fédéral direct', 'v3.month': 'Par mois',
      'f4.t': 'Le mois prochain, avant qu’il commence', 'f4.p': 'Notez dès maintenant le garage de décembre ou les cadeaux de Noël. Franko les déduit du bon salaire et vous dit ce qui restera pour le quotidien.',
      'f4.l': ['Chaque dépense prévue compte une seule fois', 'Si le mois en cours finit dans le rouge, vous le voyez'],
      'v4.title': 'Décembre', 'v4.when': 'salaire vers le 20', 'v4.salary': 'Salaire prévu', 'v4.fixed': 'Charges fixes', 'v4.gift': 'Cadeaux de Noël', 'v4.giftS': 'dépense prévue', 'v4.garage': 'Garage', 'v4.after': 'Reste après charges', 'v4.daily': 'Pour le quotidien', 'v4.dailyS': 'environ 54 CHF par jour',
      'm1.t': 'Une phrase suffit', 'm1.p': 'Tapez ou dictez « couches 24.90 coop ». Franko trouve le montant, la date et la catégorie.',
      'm2.t': 'Un virement, plusieurs dépenses', 'm2.p': '1’075 francs envoyés à la même personne, c’est le loyer, la crèche et un remboursement. Vous le découpez une fois, Franko s’en souvient.',
      'm3.t': 'Le même budget à deux', 'm3.p': 'Connectez-vous sur deux téléphones. Les changements faits de chaque côté se rejoignent sans s’écraser.',
      'm4.t': 'Sans réseau, sans compte', 'm4.p': 'L’app marche hors ligne. Tant que vous ne créez pas de compte, vos chiffres restent sur votre téléphone.',
      'how.kicker': 'Pour commencer', 'how.h2': 'Trois minutes, et c’est prêt', 'how.1t': 'Votre salaire et votre canton', 'how.1p': 'Ensuite, Franko repère seul le jour où le salaire arrive.',
      'how.2t': 'Vos charges fixes', 'how.2p': 'Loyer, LAMal, crèche, leasing. Vous touchez « Payé » quand c’est fait, ou votre relevé s’en charge.', 'how.3t': 'Vos dépenses du jour', 'how.3p': 'Tapez ou dictez « courses 45 Migros ». Le solde se met à jour tout de suite.',
      'cmp.kicker': 'Comparatif', 'cmp.h2': 'Et pourquoi pas un tableur, ou l’app de la banque ?', 'cmp.sheet': 'Tableur', 'cmp.bank': 'App bancaire',
      cmp: [['Ne déduit que ce qui est payé', 'yes', 'part:À la main', 'no'], ['Solde après les factures à venir', 'yes', 'part:À la main', 'no'], ['Mois du salaire au salaire', 'yes', 'part:À la main', 'no'], ['Relevés de plusieurs banques', 'yes', 'part:Copier-coller', 'no'], ['Impôts suisses estimés', 'yes', 'no', 'no'], ['Français, allemand, italien', 'yes', 'part:Selon le fichier', 'part:Selon la banque'], ['Saisie en une phrase', 'yes', 'no', 'no']],
      'price.kicker': 'Prix', 'price.h2': 'Gratuit pour commencer', 'price.lead': 'Passez à Pro le jour où vous voulez importer vos relevés et estimer vos impôts.',
      'price.monthly': 'Mensuel', 'price.yearly': 'Annuel', 'price.save': '−16 %', 'price.free': 'Gratuit', 'price.forever': 'Sans limite de durée', 'price.freeCta': 'Commencer', 'price.badge': '30 jours offerts', 'price.proCta': 'Essayer Pro 30 jours',
      'price.freeL': ['Calcul du mois et charges fixes', 'Saisie rapide et dictée', 'Le mois prochain', 'Les 3 derniers mois'],
      'price.proL': ['Tout le plan gratuit', 'Import des relevés bancaires', 'Estimation des impôts', 'Historique complet', 'Synchronisation entre téléphones'],
      'price.perMonth': 'CHF par mois', 'price.perYear': 'CHF par an', 'price.billedMonth': 'Facturé chaque mois. Vous arrêtez quand vous voulez.', 'price.billedYear': 'Soit {m} CHF par mois, facturé une fois par an.',
      'price.fine': 'Prix en francs suisses, TVA comprise. Vous résiliez depuis l’app, sans préavis. Le paiement passe par Stripe.',
      'faq.h2': 'Questions fréquentes',
      faq: [['Où sont mes données ?', 'Sans compte, elles restent dans votre navigateur. Avec un compte, elles sont dans une base de données chiffrée en Europe, et vous êtes le seul à y avoir accès. Franko ne se connecte jamais à votre banque.'],
        ['Mon canton est-il pris en charge ?', 'L’impôt fédéral est calculé pour toute la Suisse. L’estimation cantonale existe pour Fribourg, les autres cantons suivent. En attendant, vous entrez le montant de votre bordereau et Franko le répartit sur les mois.'],
        ['Quelles banques marchent avec Franko ?', 'Toutes celles qui exportent un relevé en CSV : PostFinance, UBS, Raiffeisen, les banques cantonales, Migros Bank, Neon, Revolut ou Yuh. Franko reconnaît les colonnes de date, de montant et de libellé.'],
        ['Mon conjoint peut-il utiliser le même budget ?', 'Oui. Connectez-vous avec le même compte sur vos deux téléphones.'],
        ['Que se passe-t-il après les 30 jours ?', 'Si vous ne faites rien, l’abonnement Pro commence. Si vous résiliez, vous gardez vos données et le plan gratuit.'],
        ['Comment résilier ?', 'Dans Réglages, rubrique Compte et abonnement. Il n’y a ni courrier ni délai.']],
      'final.h2': 'Essayez-le sur votre prochain salaire.', 'final.p': 'C’est gratuit et on ne vous demande pas de carte.', 'final.cta': 'Essayer gratuitement', 'final.cta2': 'Voir les prix',
      'foot.about': 'Un budget familial pour la Suisse, en francs et dans votre langue.', 'foot.product': 'Produit', 'foot.help': 'Aide', 'foot.how': 'Comment ça marche', 'foot.legal': 'Légal', 'foot.terms': 'Conditions d’utilisation', 'foot.privacy': 'Protection des données', 'foot.made': 'Fait à Fribourg',
    },
    de: {
      'nav.features': 'Funktionen', 'nav.pricing': 'Preise', 'nav.faq': 'Fragen', 'nav.signin': 'App öffnen', 'nav.cta': 'Testen',
      'hero.eyebrow': 'Familienbudget für die Schweiz', 'hero.h1': 'Was Ihnen bleibt, <em>wenn alles bezahlt ist.</em>',
      'hero.lead': 'Franko zieht nur ab, was Sie schon bezahlt haben. Miete und Steuern, die später fällig werden, bleiben separat, und Sie sehen jeden Tag, wie viel Sie noch ausgeben können.',
      'hero.cta': 'Gratis testen', 'hero.cta2': 'So funktioniert’s', 'hero.c1': 'Ohne Kreditkarte', 'hero.c2': 'Auf Deutsch, Französisch und Italienisch',
      'ui.month': 'November · noch 25 T.', 'ui.available': 'Wenn alles bezahlt ist', 'ui.ok': 'Im Budget', 'ui.perday': 'Etwa 88 CHF pro Tag bis zum 20. Dez.', 'ui.notpaid': 'Diesen Monat noch offen',
      'ui.rent': 'Miete', 'ui.health': 'Krankenkasse', 'ui.tax': 'Steuern', 'ui.phone': 'Telefon', 'ui.paid': 'Bezahlt', 'ui.pay': 'Bezahlt?',
      'ui.pace': 'Ausgabentempo', 'ui.paceNote': '96 CHF von 2’299 ausgegeben', 'ui.next': 'Dezember', 'ui.nextSalary': 'Erwarteter Lohn', 'ui.nextFixed': 'Fixkosten', 'ui.nextGift': 'Weihnachtsgeschenke', 'ui.nextDaily': 'Für den Alltag', 'ui.where': 'Wohin das Geld geht', 'ui.catFood': 'Einkäufe', 'ui.catOut': 'Ausgang', 'ui.catMove': 'Verkehr', 'ui.noted': 'notiert am 25. November', 'ui.addPlanned': 'Ausgabe für Dezember notieren',
      'fl.1t': 'Miete bezahlt', 'fl.1s': 'vom Kontoauszug bestätigt', 'fl.2t': 'Steuern: 598 CHF pro Monat', 'fl.2s': 'geschätzt für Freiburg',
      banks: 'Importiert CSV-Auszüge von', 'truth.kicker': 'Warum Franko', 'truth.h2': 'Ihr Kontostand beruhigt Sie zu früh.',
      'truth.lead': 'Am 22. sind noch 929 Franken auf dem Konto. Krankenkasse, Steuern und Strom sind noch nicht abgebucht. Sind sie bezahlt, fehlen 380 Franken.',
      'truth.1': '<b>Franko zieht eine Zahlung ab, wenn sie erledigt ist</b>, sobald Sie sie abhaken oder der Kontoauszug sie bestätigt.',
      'truth.2': '<b>Was noch offen ist, steht separat.</b> Sie sehen Ihren echten Stand vor Monatsende, nicht danach.',
      'led.bank': 'Heute auf dem Konto', 'led.bankS': 'was die Bank-App zeigt', 'led.bills': 'Noch offene Rechnungen', 'led.billsS': 'Steuern, Krankenkasse, Telefon, Strom', 'led.real': 'Was Ihnen wirklich bleibt',
      'found.quote': '«Ich habe Franko für das Budget meiner Familie in Freiburg geschrieben. Mein Konto zeigte einen guten Stand, und ich habe entsprechend ausgegeben. Die Rechnungen, die zehn Tage später kamen, habe ich nicht mitgerechnet.»',
      'found.name': 'Jo', 'found.role': 'Gründer · jo.productions, Freiburg',
      'feat.kicker': 'Funktionen', 'feat.h2': 'Gemacht für einen Schweizer Monat: Lohn am 20., Miete am 1.', 'feat.lead': 'Krankenkasse, Kita, Unterhalt, Steuerakonto. Franko verbucht diese Posten dann, wenn sie wirklich abgehen.',
      'f1.t': 'Die Monatsrechnung, Zeile für Zeile', 'f1.p': 'Vom erhaltenen Lohn bis zum Stand nach allen Rechnungen hat jeder Betrag seine Zeile. Ein Steuerakonto verkleinert den Posten Steuern, statt dazuzukommen.',
      'f1.l': ['Der Monat beginnt, wenn der Lohn eintrifft', 'Sparen zählt, sobald die Überweisung gemacht ist'],
      'v1.salary': 'Erhaltener Lohn', 'v1.fixed': 'Bezahlte Fixkosten', 'v1.fixedS': '4 von 8', 'v1.after': 'Rest nach bezahlten Fixkosten', 'v1.daily': 'Im Alltag ausgegeben', 'v1.dailyS': 'seit dem 20. Nov.', 'v1.now': 'Jetzt verfügbar', 'v1.pending': 'Noch nicht bezahlt', 'v1.pendingS': 'Steuern, Telefon, Strom', 'v1.all': 'Wenn alles bezahlt ist',
      'f2.t': 'Ihre Kontoauszüge, ohne Doppelte', 'f2.p': 'Exportieren Sie das CSV aus dem E-Banking und öffnen Sie es in Franko. Bereits erfasste Ausgaben, bezahlte Fixkosten und Überträge zwischen Ihren Konten werden erkannt.',
      'f2.l': ['PostFinance, UBS, Raiffeisen, Kantonalbanken, Neon, Revolut', 'Korrigieren Sie eine Kategorie, merkt sich Franko das fürs nächste Mal', 'Die Datei wird auf Ihrem Telefon gelesen. Franko verbindet sich nicht mit Ihrer Bank'],
      'v2.title': 'Auszug Neon · November', 'v2.read': '24 Zeilen', 'v2.dup': '✓ bereits erfasst', 'v2.cat': 'Einkauf', 'v2.transfer': 'Übertrag',
      'f3.t': 'Ihre Steuern, jeden Monat zurückgelegt', 'f3.p': 'Franko berechnet die Bundessteuer und schätzt die Kantonssteuer mit Ihren Abzügen. Sie legen jeden Monat den richtigen Betrag zurück, und die Rechnung im April überrascht niemanden mehr.',
      'f3.l': ['Unterhalt, Betreuungskosten und Säule 3a abgezogen', 'Der Steuerfuss Ihrer Gemeinde wird berücksichtigt'],
      'v3.title': 'Steuern 2026', 'v3.income': 'Jährliches Nettoeinkommen', 'v3.ded': 'Abzüge', 'v3.taxable': 'Steuerbares Einkommen', 'v3.canton': 'Kantonssteuer', 'v3.commune': 'Gemeindesteuer', 'v3.ifd': 'Direkte Bundessteuer', 'v3.month': 'Pro Monat',
      'f4.t': 'Der nächste Monat, bevor er beginnt', 'f4.p': 'Erfassen Sie jetzt schon die Garage im Dezember oder die Weihnachtsgeschenke. Franko zieht sie vom richtigen Lohn ab und zeigt, was für den Alltag bleibt.',
      'f4.l': ['Jede geplante Ausgabe zählt nur einmal', 'Endet der laufende Monat im Minus, sehen Sie es'],
      'v4.title': 'Dezember', 'v4.when': 'Lohn um den 20.', 'v4.salary': 'Erwarteter Lohn', 'v4.fixed': 'Fixkosten', 'v4.gift': 'Weihnachtsgeschenke', 'v4.giftS': 'geplante Ausgabe', 'v4.garage': 'Garage', 'v4.after': 'Rest nach Fixkosten', 'v4.daily': 'Für den Alltag', 'v4.dailyS': 'etwa 54 CHF pro Tag',
      'm1.t': 'Ein Satz genügt', 'm1.p': 'Tippen oder sagen Sie «Windeln 24.90 Coop». Franko findet Betrag, Datum und Kategorie.',
      'm2.t': 'Eine Überweisung, mehrere Ausgaben', 'm2.p': '1’075 Franken an dieselbe Person sind Miete, Kita und eine Rückzahlung. Sie teilen es einmal auf, Franko merkt es sich.',
      'm3.t': 'Dasselbe Budget zu zweit', 'm3.p': 'Melden Sie sich auf zwei Telefonen an. Änderungen von beiden Seiten werden zusammengeführt, ohne sich zu überschreiben.',
      'm4.t': 'Ohne Netz, ohne Konto', 'm4.p': 'Die App läuft offline. Solange Sie kein Konto erstellen, bleiben Ihre Zahlen auf Ihrem Telefon.',
      'how.kicker': 'Start', 'how.h2': 'Drei Minuten, und es läuft', 'how.1t': 'Ihr Lohn und Ihr Kanton', 'how.1p': 'Danach erkennt Franko selbst, wann der Lohn eintrifft.',
      'how.2t': 'Ihre Fixkosten', 'how.2p': 'Miete, Krankenkasse, Kita, Leasing. Sie tippen «Bezahlt», wenn es erledigt ist, oder der Kontoauszug übernimmt das.', 'how.3t': 'Ihre Ausgaben des Tages', 'how.3p': 'Tippen oder sagen Sie «Einkauf 45 Migros». Der Stand ist sofort aktuell.',
      'cmp.kicker': 'Vergleich', 'cmp.h2': 'Und warum nicht eine Tabelle oder die Bank-App?', 'cmp.sheet': 'Tabelle', 'cmp.bank': 'Bank-App',
      cmp: [['Zieht nur Bezahltes ab', 'yes', 'part:Von Hand', 'no'], ['Stand nach offenen Rechnungen', 'yes', 'part:Von Hand', 'no'], ['Monat von Lohn zu Lohn', 'yes', 'part:Von Hand', 'no'], ['Auszüge mehrerer Banken', 'yes', 'part:Kopieren', 'no'], ['Schweizer Steuern geschätzt', 'yes', 'no', 'no'], ['Deutsch, Französisch, Italienisch', 'yes', 'part:Je nach Datei', 'part:Je nach Bank'], ['Erfassen in einem Satz', 'yes', 'no', 'no']],
      'price.kicker': 'Preise', 'price.h2': 'Gratis zum Start', 'price.lead': 'Wechseln Sie zu Pro, wenn Sie Kontoauszüge importieren und Steuern schätzen möchten.',
      'price.monthly': 'Monatlich', 'price.yearly': 'Jährlich', 'price.save': '−16 %', 'price.free': 'Gratis', 'price.forever': 'Ohne zeitliche Begrenzung', 'price.freeCta': 'Starten', 'price.badge': '30 Tage geschenkt', 'price.proCta': 'Pro 30 Tage testen',
      'price.freeL': ['Monatsrechnung und Fixkosten', 'Schnelle Erfassung und Diktat', 'Der nächste Monat', 'Die letzten 3 Monate'],
      'price.proL': ['Alles aus dem Gratisplan', 'Import von Kontoauszügen', 'Steuerschätzung', 'Ganzer Verlauf', 'Synchronisation zwischen Telefonen'],
      'price.perMonth': 'CHF pro Monat', 'price.perYear': 'CHF pro Jahr', 'price.billedMonth': 'Monatlich verrechnet. Sie hören auf, wann Sie wollen.', 'price.billedYear': 'Also {m} CHF pro Monat, einmal im Jahr verrechnet.',
      'price.fine': 'Preise in Schweizer Franken, inklusive MWST. Sie kündigen in der App, ohne Frist. Die Zahlung läuft über Stripe.',
      'faq.h2': 'Häufige Fragen',
      faq: [['Wo sind meine Daten?', 'Ohne Konto bleiben sie in Ihrem Browser. Mit Konto liegen sie verschlüsselt in einer Datenbank in Europa, und nur Sie haben Zugriff. Franko verbindet sich nie mit Ihrer Bank.'],
        ['Wird mein Kanton unterstützt?', 'Die Bundessteuer wird für die ganze Schweiz berechnet. Die Kantonsschätzung gibt es für Freiburg, weitere Kantone folgen. Bis dahin geben Sie den Betrag Ihrer Steuerrechnung ein, und Franko verteilt ihn auf die Monate.'],
        ['Welche Banken funktionieren mit Franko?', 'Alle, die einen Auszug als CSV exportieren: PostFinance, UBS, Raiffeisen, die Kantonalbanken, Migros Bank, Neon, Revolut oder Yuh. Franko erkennt die Spalten für Datum, Betrag und Text.'],
        ['Kann mein Partner dasselbe Budget nutzen?', 'Ja. Melden Sie sich auf beiden Telefonen mit demselben Konto an.'],
        ['Was passiert nach 30 Tagen?', 'Wenn Sie nichts tun, beginnt das Pro-Abo. Wenn Sie kündigen, behalten Sie Ihre Daten und den Gratisplan.'],
        ['Wie kündige ich?', 'In den Einstellungen unter Konto und Abo. Kein Brief, keine Frist.']],
      'final.h2': 'Testen Sie es mit Ihrem nächsten Lohn.', 'final.p': 'Es ist gratis, und Sie brauchen keine Kreditkarte.', 'final.cta': 'Gratis testen', 'final.cta2': 'Preise ansehen',
      'foot.about': 'Ein Familienbudget für die Schweiz, in Franken und in Ihrer Sprache.', 'foot.product': 'Produkt', 'foot.help': 'Hilfe', 'foot.how': 'So funktioniert’s', 'foot.legal': 'Rechtliches', 'foot.terms': 'Nutzungsbedingungen', 'foot.privacy': 'Datenschutz', 'foot.made': 'Gemacht in Freiburg',
    },
    it: {
      'nav.features': 'Funzioni', 'nav.pricing': 'Prezzi', 'nav.faq': 'Domande', 'nav.signin': 'Apri l’app', 'nav.cta': 'Provare',
      'hero.eyebrow': 'Budget familiare per la Svizzera', 'hero.h1': 'Quanto le resta, <em>dopo aver pagato tutto.</em>',
      'hero.lead': 'Franko deduce solo ciò che ha già pagato. Affitto e imposte che arrivano più tardi restano a parte, e ogni giorno vede quanto può ancora spendere.',
      'hero.cta': 'Provare gratis', 'hero.cta2': 'Come funziona', 'hero.c1': 'Senza carta di credito', 'hero.c2': 'In italiano, tedesco e francese',
      'ui.month': 'novembre · −25 g.', 'ui.available': 'Dopo aver pagato tutto', 'ui.ok': 'Nel budget', 'ui.perday': 'Circa 88 CHF al giorno fino al 20 dic.', 'ui.notpaid': 'Non ancora pagato questo mese',
      'ui.rent': 'Affitto', 'ui.health': 'Cassa malati', 'ui.tax': 'Imposte', 'ui.phone': 'Telefono', 'ui.paid': 'Pagato', 'ui.pay': 'Pagato?',
      'ui.pace': 'Ritmo del mese', 'ui.paceNote': '96 CHF spesi su 2’299 disponibili', 'ui.next': 'Dicembre', 'ui.nextSalary': 'Salario previsto', 'ui.nextFixed': 'Spese fisse', 'ui.nextGift': 'Regali di Natale', 'ui.nextDaily': 'Per il quotidiano', 'ui.where': 'Dove vanno i soldi', 'ui.catFood': 'Spesa', 'ui.catOut': 'Uscite', 'ui.catMove': 'Trasporti', 'ui.noted': 'annotato il 25 novembre', 'ui.addPlanned': 'Annota una spesa di dicembre',
      'fl.1t': 'Affitto pagato', 'fl.1s': 'confermato dall’estratto', 'fl.2t': 'Imposte: 598 CHF al mese', 'fl.2s': 'stimate per Friburgo',
      banks: 'Importa gli estratti CSV di', 'truth.kicker': 'Perché Franko', 'truth.h2': 'Il saldo del conto la rassicura troppo presto.',
      'truth.lead': 'Il 22 restano 929 franchi sul conto. Cassa malati, imposte ed elettricità non sono ancora addebitate. Una volta pagate, mancano 380 franchi.',
      'truth.1': '<b>Franko deduce un pagamento quando è fatto</b>, appena lo spunta o quando l’estratto lo conferma.',
      'truth.2': '<b>Ciò che resta da pagare è indicato a parte.</b> Vede il suo saldo reale prima della fine del mese, non dopo.',
      'led.bank': 'Oggi sul conto', 'led.bankS': 'ciò che mostra l’app della banca', 'led.bills': 'Fatture non ancora pagate', 'led.billsS': 'imposte, cassa malati, telefono, elettricità', 'led.real': 'Ciò che le resta davvero',
      'found.quote': '«Ho scritto Franko per il budget della mia famiglia, a Friburgo. Il conto mostrava un buon saldo e spendevo di conseguenza. Non contavo le fatture che arrivavano dieci giorni dopo.»',
      'found.name': 'Jo', 'found.role': 'Fondatore · jo.productions, Friburgo',
      'feat.kicker': 'Funzioni', 'feat.h2': 'Fatto per un mese svizzero: salario il 20, affitto il 1°.', 'feat.lead': 'Cassa malati, asilo nido, alimenti, acconti d’imposta. Franko registra queste spese quando escono davvero.',
      'f1.t': 'Il calcolo del mese, riga per riga', 'f1.p': 'Dal salario ricevuto al saldo dopo tutte le fatture, ogni importo ha la sua riga. Un acconto d’imposta riduce la voce Imposte invece di aggiungersi.',
      'f1.l': ['Il mese inizia il giorno in cui arriva il salario', 'Il risparmio conta quando il bonifico è fatto'],
      'v1.salary': 'Salario ricevuto', 'v1.fixed': 'Spese pagate', 'v1.fixedS': '4 su 8', 'v1.after': 'Resta dopo le spese pagate', 'v1.daily': 'Speso nel quotidiano', 'v1.dailyS': 'dal 20 nov.', 'v1.now': 'Disponibile ora', 'v1.pending': 'Non ancora pagato', 'v1.pendingS': 'imposte, telefono, elettricità', 'v1.all': 'Dopo aver pagato tutto',
      'f2.t': 'I suoi estratti, senza doppioni', 'f2.p': 'Esporti il CSV dall’e-banking e lo apra in Franko. Spese già annotate, spese fisse pagate e giroconti tra i suoi conti vengono riconosciuti.',
      'f2.l': ['PostFinance, UBS, Raiffeisen, BancaStato, Neon, Revolut', 'Se corregge una categoria, Franko se la ricorda per la volta dopo', 'Il file è letto sul suo telefono. Franko non si collega alla sua banca'],
      'v2.title': 'Estratto Neon · novembre', 'v2.read': '24 righe', 'v2.dup': '✓ già annotato', 'v2.cat': 'Spesa', 'v2.transfer': 'giroconto',
      'f3.t': 'Le imposte, messe da parte ogni mese', 'f3.p': 'Franko calcola l’imposta federale e stima quella cantonale con le sue deduzioni. Ogni mese mette da parte l’importo giusto, e la fattura di aprile non sorprende più nessuno.',
      'f3.l': ['Alimenti, spese di custodia e 3° pilastro dedotti', 'Il moltiplicatore del suo comune è considerato'],
      'v3.title': 'Imposte 2026', 'v3.income': 'Reddito netto annuo', 'v3.ded': 'Deduzioni', 'v3.taxable': 'Reddito imponibile', 'v3.canton': 'Imposta cantonale', 'v3.commune': 'Imposta comunale', 'v3.ifd': 'Imposta federale diretta', 'v3.month': 'Al mese',
      'f4.t': 'Il mese prossimo, prima che inizi', 'f4.p': 'Annoti già ora il garage di dicembre o i regali di Natale. Franko li deduce dal salario giusto e le dice cosa resterà per il quotidiano.',
      'f4.l': ['Ogni spesa prevista conta una sola volta', 'Se il mese in corso finisce in rosso, lo vede'],
      'v4.title': 'Dicembre', 'v4.when': 'salario verso il 20', 'v4.salary': 'Salario previsto', 'v4.fixed': 'Spese fisse', 'v4.gift': 'Regali di Natale', 'v4.giftS': 'spesa prevista', 'v4.garage': 'Garage', 'v4.after': 'Resta dopo le spese', 'v4.daily': 'Per il quotidiano', 'v4.dailyS': 'circa 54 CHF al giorno',
      'm1.t': 'Basta una frase', 'm1.p': 'Scriva o detti «pannolini 24.90 coop». Franko trova importo, data e categoria.',
      'm2.t': 'Un bonifico, più spese', 'm2.p': '1’075 franchi alla stessa persona sono affitto, asilo nido e un rimborso. Lo divide una volta, Franko se lo ricorda.',
      'm3.t': 'Lo stesso budget in due', 'm3.p': 'Acceda su due telefoni. Le modifiche fatte da entrambe le parti si uniscono senza sovrascriversi.',
      'm4.t': 'Senza rete, senza account', 'm4.p': 'L’app funziona offline. Finché non crea un account, le sue cifre restano sul telefono.',
      'how.kicker': 'Per iniziare', 'how.h2': 'Tre minuti, ed è pronto', 'how.1t': 'Salario e cantone', 'how.1p': 'Poi Franko riconosce da solo il giorno in cui arriva il salario.',
      'how.2t': 'Le spese fisse', 'how.2p': 'Affitto, cassa malati, asilo nido, leasing. Tocca «Pagato» quando è fatto, oppure ci pensa l’estratto.', 'how.3t': 'Le spese del giorno', 'how.3p': 'Scriva o detti «spesa 45 Migros». Il saldo si aggiorna subito.',
      'cmp.kicker': 'Confronto', 'cmp.h2': 'E perché non un foglio di calcolo, o l’app della banca?', 'cmp.sheet': 'Foglio di calcolo', 'cmp.bank': 'App bancaria',
      cmp: [['Deduce solo ciò che è pagato', 'yes', 'part:A mano', 'no'], ['Saldo dopo le fatture in arrivo', 'yes', 'part:A mano', 'no'], ['Mese da salario a salario', 'yes', 'part:A mano', 'no'], ['Estratti di più banche', 'yes', 'part:Copia-incolla', 'no'], ['Imposte svizzere stimate', 'yes', 'no', 'no'], ['Italiano, tedesco, francese', 'yes', 'part:Secondo il file', 'part:Secondo la banca'], ['Inserimento in una frase', 'yes', 'no', 'no']],
      'price.kicker': 'Prezzi', 'price.h2': 'Gratis per iniziare', 'price.lead': 'Passi a Pro quando vuole importare gli estratti e stimare le imposte.',
      'price.monthly': 'Mensile', 'price.yearly': 'Annuale', 'price.save': '−16 %', 'price.free': 'Gratuito', 'price.forever': 'Senza limite di tempo', 'price.freeCta': 'Iniziare', 'price.badge': '30 giorni offerti', 'price.proCta': 'Provare Pro 30 giorni',
      'price.freeL': ['Calcolo del mese e spese fisse', 'Inserimento rapido e dettatura', 'Il mese prossimo', 'Gli ultimi 3 mesi'],
      'price.proL': ['Tutto il piano gratuito', 'Importazione degli estratti', 'Stima delle imposte', 'Storico completo', 'Sincronizzazione tra telefoni'],
      'price.perMonth': 'CHF al mese', 'price.perYear': 'CHF all’anno', 'price.billedMonth': 'Fatturato ogni mese. Smette quando vuole.', 'price.billedYear': 'Cioè {m} CHF al mese, fatturato una volta all’anno.',
      'price.fine': 'Prezzi in franchi svizzeri, IVA inclusa. Disdice dall’app, senza preavviso. Il pagamento passa da Stripe.',
      'faq.h2': 'Domande frequenti',
      faq: [['Dove sono i miei dati?', 'Senza account restano nel suo browser. Con un account sono cifrati in una banca dati in Europa, e solo lei vi ha accesso. Franko non si collega mai alla sua banca.'],
        ['Il mio cantone è supportato?', 'L’imposta federale è calcolata per tutta la Svizzera. La stima cantonale esiste per Friburgo, gli altri cantoni seguiranno. Nel frattempo inserisce l’importo della sua fattura e Franko lo ripartisce sui mesi.'],
        ['Quali banche funzionano con Franko?', 'Tutte quelle che esportano un estratto in CSV: PostFinance, UBS, Raiffeisen, BancaStato, Banca Migros, Neon, Revolut o Yuh. Franko riconosce le colonne di data, importo e descrizione.'],
        ['Il mio partner può usare lo stesso budget?', 'Sì. Acceda con lo stesso account sui due telefoni.'],
        ['Cosa succede dopo 30 giorni?', 'Se non fa nulla, inizia l’abbonamento Pro. Se disdice, conserva i dati e il piano gratuito.'],
        ['Come disdire?', 'Nelle impostazioni, alla voce Account e abbonamento. Niente lettere, niente termini.']],
      'final.h2': 'Lo provi con il prossimo salario.', 'final.p': 'È gratis e non le chiediamo nessuna carta.', 'final.cta': 'Provare gratis', 'final.cta2': 'Vedere i prezzi',
      'foot.about': 'Un budget familiare per la Svizzera, in franchi e nella sua lingua.', 'foot.product': 'Prodotto', 'foot.help': 'Aiuto', 'foot.how': 'Come funziona', 'foot.legal': 'Note legali', 'foot.terms': 'Condizioni d’uso', 'foot.privacy': 'Protezione dei dati', 'foot.made': 'Fatto a Friburgo',
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
  // ---------- motion ----------
  // Héros : vague d'arrivée, puis le téléphone joue un prototype en trois écrans (comme un « Smart Animate »).
  // Sections : chaque illustration s'assemble une fois quand elle entre à l'écran. Rien n'est caché au repos.
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fmtChf = (v, dec) => (v < 0 ? '−' : '') + Math.abs(v).toFixed(dec == null ? 2 : dec).replace(/\B(?=(\d{3})+(?!\d))/g, '’');
  const num = (txt) => parseFloat(String(txt).replace(/[’'\s]/g, '').replace('−', '-'));
  function countTo(el, to, from, dur, dec) {
    if (!el) return;
    if (reduce) { el.textContent = fmtChf(to, dec); return; }
    const t0 = performance.now(), f = from == null ? 0 : from;
    const step = (t) => {
      const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      el.textContent = fmtChf(f + (to - f) * e, dec);
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  document.documentElement.classList.add('intro');
  const meter = document.querySelector('.ui-meter i');
  if (!reduce && meter) { meter.style.width = '0%'; setTimeout(() => { meter.style.width = ''; }, 420); }
  setTimeout(() => countTo(document.getElementById('heroBig'), 2202.6, 0, 1100), 360);

  // ----- prototype du téléphone -----
  const proto = document.getElementById('proto');
  const steps = proto ? [...proto.querySelectorAll('.proto-step')] : [];
  const dots = [...document.querySelectorAll('.proto-dots i')];
  const tap = document.getElementById('tap');
  const demo = document.getElementById('demoState'), pend = document.getElementById('heroPending');
  let heroVisible = true, current = 0, running = false;
  function setPaid(paid) {
    if (!demo) return;
    demo.classList.toggle('done', paid);
    const label = demo.querySelector('span');
    label.dataset.i = paid ? 'ui.paid' : 'ui.pay';
    label.textContent = L[lang][label.dataset.i];
  }
  // l'ancien écran sort pendant que le nouveau entre, dans le sens de la navigation
  function go(n) {
    if (n === current) return;
    proto.classList.add('played');
    const from = steps[current], to = steps[n], dir = n > current || (current === 2 && n === 0) ? 1 : -1;
    to.classList.add('is-on'); to.removeAttribute('aria-hidden');
    to.style.setProperty('--dir', dir);
    from.style.setProperty('--dir', dir);
    from.classList.add('is-leaving'); from.classList.remove('is-on'); from.setAttribute('aria-hidden', 'true');
    setTimeout(() => from.classList.remove('is-leaving'), 560);
    dots.forEach((d, i) => d.classList.toggle('on', i === n));
    current = n;
  }
  // le point de toucher glisse vers une cible et appuie
  async function press(target) {
    if (!tap || !target) return;
    const dev = tap.parentElement.getBoundingClientRect(), r = target.getBoundingClientRect();
    tap.style.transform = `translate(${r.left - dev.left + r.width / 2 - 22}px, ${r.top - dev.top + r.height / 2 - 22}px)`;
    tap.classList.add('show');
    await wait(620);
    tap.classList.add('press');
    await wait(180);
    tap.classList.remove('press');
  }
  async function loop() {
    if (running) return;
    running = true;
    while (true) {
      if (document.hidden || !heroVisible) { await wait(600); continue; }
      // 1. on touche « Payé ? » : la charge passe en payé, le montant à payer baisse
      await press(demo);
      setPaid(true);
      countTo(pend, 1286, 1436, 650);
      await wait(900);
      tap.classList.remove('show');
      await wait(900);
      // 2. le rythme du mois
      go(1);
      steps[1].classList.remove('drawn'); void steps[1].offsetWidth; steps[1].classList.add('drawn');
      await wait(2800);
      // 3. le mois prochain se prépare
      go(2);
      countTo(document.getElementById('nextDaily'), 2149, 2449, 700, 2);
      await wait(2800);
      // retour au début : la charge redevient à payer
      setPaid(false);
      if (pend) pend.textContent = fmtChf(1436);
      go(0);
      await wait(2200);
    }
  }
  if (proto && !reduce) {
    setTimeout(loop, 2400);
    if ('IntersectionObserver' in window) new IntersectionObserver(([e]) => { heroVisible = e.isIntersecting; }).observe(proto);
  }

  // ----- sections : une entrée par bloc, des illustrations qui s'assemblent -----
  const blocks = [...document.querySelectorAll('.head, .truth > div, .feature .copy, .compare, .prices, .faq, .final, .founder')];
  const groups = [...document.querySelectorAll('.grid6, .steps, .feature .visual .ui-card')];
  if (!reduce && 'IntersectionObserver' in window) {
    const below = (el) => el.getBoundingClientRect().top > innerHeight * 0.92;
    const onShow = (el) => {
      if (el.id === 'ledgerBox') countTo(document.getElementById('ledReal'), -379.92, 0, 1000);
      el.querySelectorAll('[data-count]').forEach((c) => countTo(c, num(c.dataset.count), 0, 900, c.dataset.dec ? +c.dataset.dec : 0));
      const ins = el.querySelector('#v4garage');
      if (ins) {
        setTimeout(() => {
          ins.classList.add('open');
          countTo(document.getElementById('v4after'), 1669, 2149, 600);
          countTo(document.getElementById('v4daily'), 1669, 2149, 600);
        }, 700);
      }
    };
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.classList.remove('pre');
        onShow(e.target);
        io.unobserve(e.target);
      }
    }, { rootMargin: '0px 0px -12% 0px' });
    blocks.forEach((el) => { if (below(el)) { el.classList.add('rv', 'pre'); io.observe(el); } });
    groups.forEach((el) => {
      if (!below(el)) return;
      // les écarts se resserrent : le groupe se lit comme une vague, pas comme un métronome
      [...el.children].forEach((c, i) => c.style.setProperty('--i', Math.round(i * 64 - i * i * 3) + 'ms'));
      el.classList.add('rv-kids', 'pre');
      const g = el.querySelector('#v4garage'); if (g) g.classList.add('collapse');
      io.observe(el);
    });
    const cmp = document.querySelector('.compare');
    if (cmp) [...cmp.querySelectorAll('tbody tr')].forEach((r, i) => r.querySelectorAll('.yes svg').forEach((s) => s.style.setProperty('--i', i * 60 + 'ms')));
    const ledger = document.querySelector('.ledger');
    if (ledger) { ledger.id = 'ledgerBox'; if (below(ledger)) io.observe(ledger); }
  }
  // prix : le montant glisse quand on change de formule
  document.addEventListener('click', (e) => {
    if (!e.target.closest('[data-bill]') || reduce) return;
    const a = document.getElementById('pAmt');
    if (a && a.animate) a.animate([{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: 320, easing: 'cubic-bezier(.2,.8,.2,1)' });
  });

  const nav = document.getElementById('nav');
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
})();
