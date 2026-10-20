# Savia

Application web (PWA) en français pour organiser la maison à deux :

- **Agenda partagé** : tâches et événements, glisser-déposer d’un jour à l’autre, notification à l’autre personne.
- **Note vocale** : on dicte « Dentiste jeudi à 17 h 30 pour Sam » ou « Ajoute du lait et des œufs » ; Savia crée l’événement ou remplit la liste. Sans reconnaissance vocale, la note est enregistrée et jointe à la tâche.
- **Dîner du soir** : proposition à partir du frigo, vote des deux, motif du refus qui oriente l’idée suivante, portion adaptée aux calories de chacun.
- **Photo et portions** : photo de l’assiette, grammes par aliment, calories du repas et de la journée.
- **Courses et frigo** : liste par rayon avec prix estimés en CHF ; un article acheté passe au frigo.

## Développement

```bash
npm install
npm run dev        # serveur local
npm test           # tests (propositions, portions, dictée, dates)
npm run build      # build de production dans dist/
npm run build:demo # page autonome dist-demo/savia.html
```

Les données sont stockées sur l’appareil (localStorage, photos et notes vocales dans IndexedDB). La synchronisation entre deux téléphones est l’étape suivante (comptes en ligne).
