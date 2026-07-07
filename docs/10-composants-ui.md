# 10 - Composants UI

## Composants de layout

- `src/layouts/DefaultLayout.vue`
  - Gère l’architecture globale de l’interface.
  - Inclut `Header`, `Sidebar`, `Footer`.
  - Contient le `router-view` principal.

- `src/components/partials/header.vue`
  - Affiche le logo, la barre de recherche et le menu utilisateur.
  - Gère la déconnexion via `authStore.logoutUser()`.

- `src/components/partials/sidebar.vue`
  - Définit le menu principal et les sous-menus.
  - Utilise `route.path` pour activer le menu.
  - Contient des routes non définies dans le routeur.

- `src/components/partials/footer.vue`
  - Composant bas de page global.

## Composants transverses

- `src/components/BasIcon.vue`
  - Icônes personnalisées utilisées dans l’interface.

- `src/components/ItemActions.vue`
  - Actions de liste / tableau.

- `src/components/SkeletonLoader.vue`
  - Loader utilisé pour simuler un chargement de données.

## Composants par module

### Structure Académique
- `AnneeHeader.vue`, `AnneeTab.vue`
- `ClasseHeader.vue`, `ClasseTab.vue`
- `Cycle.vue`, `Filiere.vue`, `Semestre.vue`

### Scolarité
- `EtudiantHeader.vue`, `EtudiantTab.vue`
- `DossierHeader.vue`

### Examens
- `HeaderView.vue` (planification)
- `ExamenList`, `PlanExamen.vue`

### Concours
- `ConcourHeader.vue`, `ConcoursTab.vue`

### Finances
- `PaiementHeader.vue`, `PaiementTab.vue`
- `FacturationHeader.vue`, `FacturationTab.vue`
- `RapportHeader.vue`, `RapportTab.vue`

### Pédagogie
- `FormateurHeader.vue`, `PedagogieTab.vue`

### Notes
- `NotesHeader.vue`, `NotesTabs.vue`, `EditNotes.vue`

## Composants d’interface remarquables

- `src/views/examens/salles/Salles.vue`
  - Implémente un dispositif d’import de fichiers Excel/CSV.
  - Gère un algorithme de distribution de salles.
  - Propose un export XLSX.

- `src/views/etudiants/Etudiants.vue` et `src/views/parcours/DossierView.vue`
  - Utilisent des données de démonstration et des filtres locaux.

- `src/views/auth/Login.vue`
  - Gère la connexion utilisateur.

- `src/views/dashboard/Dashboard.vue`
  - Page d’accueil avec composants de tableau de bord et données simulées.

## Observations UI

- Le frontend réutilise la structure `Header + Tab + Content` sur la majorité des pages.
- Plusieurs composants affichent des sections `button`, `select`, `table`, `modal` et `tabs`.
- Certains composants sont principalement des maquettes de données sans intégration API complète.
