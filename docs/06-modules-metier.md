# 06 - Modules métier

## Authentification

### Objectif métier
Permettre aux utilisateurs autorisés de se connecter au portail ERP et de maintenir une session basée sur token.

### Interfaces associées
- `/auth/login` : `src/views/auth/Login.vue`
- `/auth/register` : `src/views/auth/Register.vue`
- `/auth/new-password` : redirige vers le composant de login

### Données manipulées
- Identifiants : `email` / `username`
- Mot de passe
- Token JWT
- Objet `user` renvoyé par le backend

### Actions disponibles
- Connexion
- Déconnexion
- Signup (page présente mais non pleinement connectée)

### Stores / API
- Store : `useAuthStore`
- API : `src/api/auth/authApi.js`

### Composants impliqués
- `src/views/auth/Login.vue`
- `src/views/auth/Register.vue`

### État et validation
- `authStore.token` : token JWT
- `authStore.user` : profil utilisateur
- `authStore.status` : `idle` / `loading` / `success` / `error`
- La page login vérifie la présence du token après la requête.

### Points à confirmer
- La page de registre est principalement statique et n’utilise pas encore `authStore.signupUser`.
- Les gardes de route ne sont pas visibles.

---

## Structure Académique

### Objectif métier
Gérer le référentiel académique : années, cycles, filières, classes, niveaux et semestres.

### Utilisateurs concernés
- Administrateurs académiques
- Responsable de cycle
- Responsable pédagogique
- Agent de scolarité

### Pages associées
- `/annees-academiques` : `AnneeAcademique.vue`
- `/cycles-academiques` : `Cycle.vue`
- `/filieres-academiques` : `Filiere.vue`
- `/classes-niveaux` : `Classes.vue`
- `/semestres` : `Semestre.vue`

### Données manipulées
- Années académiques (périodes d’enseignement)
- Cycles d’études et filières associées
- Niveaux LMD et classes (groupes étudiants)
- Semestres et leur statut actif/inactif
- Organisation pédagogique et indicateurs de remplissage

### Actions visibles dans le code
- Créer / modifier / supprimer des années académiques, des cycles, des filières, des classes et des semestres
- Activer une année académique
- Changer le statut d’un semestre
- Assigner des modules ou UE à une classe via `moduleStore.assignModule`
- Charger l’organisation des cycles, filières, classes et semestres
- Consulter des statistiques et indicateurs de répartition
- Importer des étudiants, des réinscriptions et des tuteurs (API prévue)

### API et Stores
- Stores : `useAnneeStore`, `useCycleStore`, `useFiliereStore`, `useClasseStore`, `useSemestreStore`, `useModuleStore`
- API : `src/api/academique/academiqueApi.js`, `src/api/academique/moduleApi.js`

### Composants impliqués
- `src/views/stracad/anneeac/AnneeAcademique.vue`
- `src/views/stracad/cycles/Cycle.vue`
- `src/views/stracad/filieres/Filiere.vue`
- `src/views/stracad/classes/Classes.vue`
- `src/views/stracad/semestres/Semestre.vue`

### Observations spécifiques
- Les stores académiques utilisent un cache local `localStorage` pour réduire les appels réseaux sur les listes de cycles, classes, filières et semestres.
- `Classe.vue` présente des onglets d’organisation et des actions d’affectation de modules.
- `AnneeAcademique.vue` est structuré avec un header et un onglet principal, mais l’interface ne révèle pas toutes les actions détaillées dans les stores.

### États possibles
- `loading`
- données chargées
- message d’erreur sur chargement
- succès de création / modification / suppression

---

## Scolarité

### Objectif métier
Gérer la population étudiante, les dossiers scolaires, les absences et le suivi académique individuel.

### Utilisateurs concernés
- Agent de scolarité
- Responsable pédagogique
- Enseignant (consultation de présence et notes)

### Pages associées
- `/etudiants` : `Etudiants.vue`
- `/etudiants/:id` : `DetailEtudiant.vue`
- `/dossiers-scolaires` : `DossierView.vue`
- `/dossiers-scolaires/:id/global-informations` : `DossierAcademique.vue`
- `/absences` : `AbscenceView.vue`
- `/inscriptions` : `Inscription.vue`
- `/notes` : `NotesView.vue`
- `/notes/:classeId/:semestre/:type/edit` : `EditNotes.vue`
- `/deliberations` : `deliberation.vue`

### Données manipulées
- Étudiants, matricules et contacts
- Filières, classes, niveaux et années académiques
- Dossiers scolaires et parcours individuels
- Présences et absences
- Notes, bulletins et décisions de délibération
- Statuts d’inscription et financiers

### Actions disponibles
- Afficher et filtrer la liste des étudiants
- Consulter le dossier académique complet d’un étudiant
- Imprimer/exporter un dossier étudiant
- Enregistrer une fiche d’émargement par classe, cours et créneau
- Gérer les inscriptions, réinscriptions et paiements via l’interface tabulaire
- Consulter et éditer des notes via les écrans dédiés

### API et Stores
- Stores : `useEtudiantStore`, `useNoteStore`, `useResultatStore`, `useSessionStore`, `useInscriptionStore`
- API : `src/api/academique/etudiantApi.js`, `src/api/academique/academiqueApi.js`, `src/api/evaluations/notesApi.js`, `src/api/evaluations/resultatApi.js`

### Observations spécifiques
- `Etudiants.vue` charge actuellement des données fictives avec `setTimeout`, alors que le store `useEtudiantStore` existe pour appeler `getEtudiantsByClasseFiliereAnnee`.
- Le dossier académique utilise un composant `DossierTab` avec 5 onglets : `Profil & Informations`, `Parcours & Notes`, `Assiduité & Discipline`, `Situation Financière`, `Documents & Archives`.
- `AbscenceView.vue` propose un workflow d’émargement avec sélection de date, classe, cours et créneau, mais il n’appelle pas d’API backend visible. La validation actuelle est simulée par `alert`.
- La page `/inscriptions` est structurée en onglets et inclut des composants pour inscriptions, réinscriptions, gestions de classes, paiements et rapports.

### États possibles
- `loading`
- `notes` à publier
- `dossier étudiant chargé`
- `présence définie` (`present`, `retard`, `absent`)
- `inscription validée / en attente / modifiable`
- erreurs backend

---

## Examens

### Objectif métier
Planifier des examens, gérer le calendrier, les salles et produire des rapports.

### Pages associées
- `/examens` : `Examens.vue`
- `/planification-examens` : `Planification.vue`
- `/planification-examens/:id/evaluations` : `PlanExamen.vue`
- `/calendrier-examens` : `Calendrier.vue`
- `/salles-horaires` : `Salles.vue`
- `/rapport-examens` : `RapportExamens.vue`

### Données manipulées
- Sessions d’évaluation
- Évaluations et notes
- Calendrier et dates d’examen
- Salles, horaires et capacité
- Résultats / rapports d’examen

### Actions disponibles
- Charger les sessions d’examen
- Filtrer la planification par groupe de semestre
- Importer des listes d’étudiants via Excel/CSV
- Configurer le nombre de salles et la capacité
- Lancer la répartition automatique des salles
- Exporter les résultats en Excel

### API et Stores
- `useSessionStore` pour les sessions d’examen
- API : `src/api/evaluations/evaluationApi.js`

### Observations
- La page `Salles.vue` contient un cas d’utilisation avancé de traitement Excel côté frontend.
- La planification utilise `useSessionStore` pour charger les sessions.

### États possibles
- `activeSemesterGroup` (Tout, Semestres 1, Semestres 2)
- `distributionResults`
- `hasCapacityOverflow`

---

## Concours

### Objectif métier
Gérer l’édition, la configuration et les résultats des concours.

### Pages associées
- `/edition-concours` : `Edition.vue`
- `/edition-concours/:id/configurations` : `configDetails.vue`
- `/rapport-concours` : `RapportConcours.vue`

### Données manipulées
- Concours et épreuves
- Candidats
- Notes des candidats
- Admissions et listes des admis

### Actions disponibles
- Charger les concours
- Créer, modifier, supprimer un concours
- Changer le statut du concours
- Calculer moyennes et rangs
- Proclamer admissions
- Télécharger la liste des admis
- Créer une épreuve et gérer ses détails

### API et Stores
- Store : `useConcoursStore`
- API : `src/api/gestions/gestionApi.js`

### Observations
- `useConcoursStore` contient un workflow complet pour concours, épreuves, calculs et export.
- Plusieurs pages sont des wrappers de composants sans logique visible au premier niveau.

---

## Inscriptions

### Objectif métier
Gérer les inscriptions académiques et leur suivi financier.

### Pages associées
- `/inscriptions` : `Inscription.vue`

### Données manipulées
- Inscriptions
- Totaux financiers des inscriptions
- Statuts des inscriptions
- Import de réinscriptions, d’inscriptions et de tuteurs

### Actions disponibles
- Charger les inscriptions
- Charger le suivi financier des inscriptions
- Créer/mettre à jour une inscription
- Changer le statut d’une inscription
- Importer par lot des inscriptions, réinscriptions, tuteurs

### API et Stores
- Store : `useInscriptionStore`
- API : `src/api/academique/academiqueApi.js`

### Observations
- Le store inclut une logique de cache local par `localStorage`.

---

## Finances

### Objectif métier
Gérer les paiements, factures et rapports financiers.

### Pages associées
- `/paiements-finances` : `Paiements.vue`
- `/factures-finances` : `Facturation.vue`
- `/rapports-financiers` : `RapportFinances.vue`

### Données manipulées
- Paiements
- Factures
- Frais d’inscription

### Actions disponibles
- Charger, créer, modifier et supprimer des finances
- Charger, créer, modifier et supprimer des factures
- Charger, créer, modifier et supprimer des paiements
- Gérer les frais d’inscription

### API et Stores
- Store : `useFinanceStore`, `useFactureStore`
- API : `src/api/finances/financeApi.js`

### Observations
- Les pages utilisent actuellement des maquettes de chargement et des données simulées.

---

## Pédagogie

### Objectif métier
Gérer les enseignants, les attributions et les programmes de formation.

### Pages associées
- `/enseignants` : `Enseignants.vue`
- `/attribution-cours` : `AttributionCours.vue`
- `/crenaux-horaires` : `CrenauHoraire.vue`
- `/programmes-credits` : `ProgrammeCredit.vue`

### Données manipulées
- Enseignants
- Contrats
- Diplômes
- Attributions de cours
- Créneaux horaires

### Actions disponibles
- Charger, créer, modifier, supprimer des enseignants
- Charger, créer, modifier, supprimer des contrats
- Charger, créer, modifier, supprimer des diplômes
- Assignations enseignants / modules / classes
- Gestion des créneaux

### API et Stores
- Store : `useEnseignantStore`, `useContratStore`, `useDiplomeStore`
- API : `src/api/pedagogies/pedagogieApi.js`

### Observations
- Les composants de page sont principalement des wrappers, certains utilisent des données de démonstration.

---

## Tableaux de bord et Statistiques

### Objectif métier
Fournir une vue globale de l’activité académique, financière et opérationnelle.

### Pages associées
- `/dashboard` : `Dashboard.vue`
- `/statistiques` : `Statistiques.vue`
- `/documentation` : `Document.vue`
- `/assistant-ai` : `AssistantAi.vue`

### Données manipulées
- Indicateurs de performance
- Données synthétiques de démonstration
- Messages et notifications

### Observations
- Le dashboard contient des jeux de données de démonstration.
- La page assistant AI est présente mais sa logique n’est pas détaillée dans l’analyse.

## Modules présents sans routes complètes

- Plusieurs éléments de menu sont définis dans la sidebar sans être présents dans le routeur.
- Cette situation indique des modules prévus mais non encore entièrement implémentés.
