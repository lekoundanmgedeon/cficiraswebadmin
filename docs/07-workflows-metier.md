# 07 - Workflows métier

## WF-01 — Connexion d’un utilisateur

Objectif :
Permettre à un utilisateur de se connecter au portail et d’accéder à l’espace interne.

Acteur principal :
Utilisateur authentifié (tous rôles).

Préconditions :
1. L’utilisateur a un compte existant.
2. Le backend API est accessible.

Étapes :
1. L’utilisateur ouvre `/auth/login`.
2. Il saisit son email / username et son mot de passe.
3. Il clique sur le bouton `Connexion`.
4. Le composant appelle `authStore.loginUser(credentials)`.
5. Le store envoie `POST /api/auth/login` via `authApi`.
6. Si la réponse contient `success` et `token`, le token est stocké dans `localStorage` et `authStore.user` est affecté.
7. L’utilisateur est redirigé vers `/dashboard`.

Résultat final :
Session active avec token JWT et accès au layout protégé.

Exceptions :
- Identifiants invalides.
- Erreur serveur.
- Absence de réponse réseau.

## WF-02 — Gestion d’une année académique

Objectif :
Créer, modifier, supprimer ou activer une année académique.

Acteur principal :
Administrateur académique.

Préconditions :
1. L’utilisateur est connecté.
2. L’année existe ou est créée.

Étapes :
1. L’utilisateur accède au menu `Structure Académique > Années académiques`.
2. Il utilise le bouton `+ Ajouter un nouveau` pour ouvrir le formulaire modal.
3. Il saisit les champs obligatoires.
4. Il valide le formulaire.
5. Le store appelle `createAnneeAcademique(data)` ou `updateAnneeAcademique(id, data)`.
6. Le backend retourne un résultat de création / modification.
7. Le store recharge la liste via `fetchAnneesAcademiques()`.
8. L’interface affiche un message de succès ou d’erreur.

Résultat final :
La liste des années académiques est mise à jour.

## WF-03 — Gestion des classes et des modules assignés

Objectif :
Gérer les classes, consulter leur organisation et affecter des modules.

Acteur principal :
Responsable pédagogique ou scolarité.

Étapes :
1. L’utilisateur se rend sur `/classes-niveaux`.
2. Il navigue entre les onglets `Classes`, `Niveaux`, `Filières`, `Organisation`, `Statistiques`.
3. Il crée ou modifie une classe.
4. Il consulte les statistiques ou l’organisation des classes.
5. Il assigne un module à une classe via le store `classeStore.assignModule(id, data)`.

Résultat final :
La classe est mise à jour et le module est lié.

## WF-04 — Consultation du dossier scolaire d’un étudiant

Objectif :
Accéder au parcours académique détaillé d’un étudiant.

Acteur principal :
Agent de scolarité.

Préconditions :
1. L’utilisateur est connecté.
2. L’étudiant est présent dans la liste.

Étapes :
1. L’utilisateur ouvre `/etudiants`.
2. Il filtre la liste par année, filière, niveau ou classe.
3. Il clique sur `Détails` pour accéder à `/dossiers-scolaires/:id/global-informations`.
4. L’écran affiche les informations du dossier académique.

Résultat final :
Accès au détail du parcours scolaire.

## WF-05 — Planification des examens

Objectif :
Organiser la planification des examens par semestre et sessions.

Acteur principal :
Responsable des examens.

Étapes :
1. L’utilisateur ouvre `/planification-examens`.
2. Il choisit un groupe de semestres (`Tout`, `Semestres 1`, `Semestres 2`).
3. Le composant charge les sessions avec `useSessionStore.fetchSessions()`.
4. Il accède aux évaluations d’une session via `/planification-examens/:id/evaluations`.

Résultat final :
La session d’examen est visible et prête à être affinée.

## WF-06 — Répartition des salles d’examen

Objectif :
Générer une répartition de salles à partir de listes d’étudiants importées.

Acteur principal :
Responsable logistique des examens.

Étapes :
1. L’utilisateur ouvre `/salles-horaires`.
2. Il fixe le nombre de salles et la capacité par salle.
3. Il importe un ou plusieurs fichiers Excel / CSV.
4. Le frontend parse les fichiers et calcule `totalStudents`, `totalCapacity`.
5. Il clique sur `Lancer la Répartition Automatique`.
6. L’algorithme distribue les étudiants selon la configuration sélectionnée.
7. Il peut exporter le résultat en Excel.

Résultat final :
Un plan de répartition des salles est généré localement.

## WF-07 — Gestion des concours et publication des admissions

Objectif :
Créer un concours, gérer ses épreuves et proclamer les admissions.

Acteur principal :
Gestionnaire concours.

Étapes :
1. L’utilisateur se rend sur `/edition-concours`.
2. Il crée ou modifie un concours.
3. Il ouvre les détails via `/edition-concours/:id/configurations`.
4. Il calcule les moyennes et rangs.
5. Il proclame les admissions.
6. Il télécharge la liste des admis.

Résultat final :
Le concours est configuré et les résultats sont diffusés.

## WF-08 — Suivi des inscriptions et finances associées

Objectif :
Lire l’état des inscriptions et des totaux financiers.

Acteur principal :
Gestionnaire des inscriptions.

Étapes :
1. L’utilisateur ouvre `/inscriptions`.
2. Le store charge les inscriptions et le suivi financier.
3. Il visualise les totaux collectés et en attente.
4. Il effectue un import par lot si nécessaire.

Résultat final :
Les inscriptions sont synchronisées avec le backend.
