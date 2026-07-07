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
Créer, modifier, supprimer ou activer une année académique dans le référentiel.

Acteur principal :
Administrateur académique.

Préconditions :
1. L’utilisateur est connecté.
2. L’utilisateur a un rôle autorisé (par exemple `admin` ou `directeur`).

Étapes :
1. L’utilisateur accède au menu `Structure Académique > Années académiques`.
2. Il sélectionne l’option `Ajouter` ou l’icône d’édition sur une année existante.
3. Il renseigne les informations de la nouvelle année ou modifie les champs existants.
4. Il valide le formulaire.
5. Le store appelle `createAnneeAcademique(data)` ou `editAnneeAcademique(id, data)`.
6. Le backend retourne le résultat de création ou de mise à jour.
7. Le store rafraîchit la liste via `fetchAnneesAcademiques()`.
8. L’interface affiche un message de succès ou d’erreur.

Résultat final :
La liste des années académiques est mise à jour avec la nouvelle donnée et le cache local est invalidé.

## WF-03 — Gestion des classes et des modules assignés

Objectif :
Gérer les classes, consulter leur organisation et affecter des modules.

Acteur principal :
Responsable pédagogique ou chargé de scolarité.

Étapes :
1. L’utilisateur se rend sur `/classes-niveaux`.
2. Il navigue entre les onglets disponibles dans `Classes.vue`.
3. Il crée, modifie ou supprime une classe.
4. Il ouvre la vue de détail d’une classe pour voir son organisation.
5. Il assigne un module à une classe via l’action `classeStore.assignModule(id, data)` ou `moduleStore.assignModule(data)`.
6. Le store met à jour la classe et recharge les données de modules ou d’effectifs.

Résultat final :
La classe est actualisée et la relation module/classe est enregistrée.

## WF-04 — Consultation du dossier scolaire d’un étudiant

Objectif :
Accéder au parcours académique détaillé d’un étudiant depuis la liste des étudiants.

Acteur principal :
Agent de scolarité.

Préconditions :
1. L’utilisateur est connecté.
2. L’étudiant figure dans la liste de la page `/etudiants`.

Étapes :
1. L’utilisateur ouvre `/etudiants`.
2. Il applique des filtres sur l’année, la filière, le niveau ou la classe.
3. Il sélectionne un étudiant dans la liste.
4. Il clique sur le bouton `Détails` de l’étudiant.
5. Le navigateur charge `/dossiers-scolaires/:id/global-informations`.
6. La page affiche un header étudiant et le composant `DossierTab` avec 5 onglets.

Résultat final :
Le dossier académique de l’étudiant est visible avec ses informations personnelles, son parcours, son état de présence, sa situation financière et ses documents.

## WF-05 — Gestion de la présence / absences

Objectif :
Enregistrer une feuille d’émargement pour une classe de cours.

Acteur principal :
Enseignant ou agent de scolarité.

Préconditions :
1. L’utilisateur est connecté.
2. Une classe et un cours sont sélectionnés.

Étapes :
1. L’utilisateur ouvre `/absences`.
2. Il choisit la date, la classe, le cours et le créneau horaire.
3. La liste des étudiants de la classe est affichée.
4. Il indique le statut de chaque étudiant : `Présent`, `Retard` ou `Absent`.
5. Il saisit un commentaire lorsque l’étudiant est en retard ou absent.
6. Il clique sur `Enregistrer l'émergement`.
7. Le formulaire est transformé en payload et une alerte de succès est affichée.

Résultat final :
La fiche d’émargement est enregistrée localement et l’utilisateur reçoit une confirmation.

## WF-06 — Gestion des inscriptions et suivi financier

Objectif :
Piloter les inscriptions académiques à partir d’un écran tabulaire multi-onglets.

Acteur principal :
Agent des inscriptions.

Préconditions :
1. L’utilisateur est connecté.
2. Les données de base des inscriptions sont disponibles en backend.

Étapes :
1. L’utilisateur ouvre `/inscriptions`.
2. Il consulte l’onglet `Inscriptions` pour voir les dossiers d’inscription.
3. Il passe à l’onglet `Gestions classes` pour voir la relation classe/étudiant.
4. Il utilise `Reinscriptions` pour rechercher des étudiants à réinscrire.
5. Il consulte `Frais paiements` pour vérifier le suivi financier.
6. Il ouvre `Rapports & Stats` pour une vue analytique.

Résultat final :
Les inscriptions et le suivi financier sont accessibles depuis une interface à onglets.

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
