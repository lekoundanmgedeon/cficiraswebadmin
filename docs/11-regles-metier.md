# 11 - Règles métier

## Règles métier détectées dans le code

- `RM-01` : Autorisation par token
  - Le token JWT est stocké dans `localStorage`.
  - Les requêtes API ajoutent `Authorization: Bearer {token}`.

- `RM-02` : Rôles utilisateurs
  - Les rôles sont définis dans le profil utilisateur.
  - Les rôles possibles sont : `admin`, `scolarite`, `pedagogie`, `c_cycle`, `finances`, `directeur`, `enseignant`, `gestionnaire`.

- `RM-03` : Publication des notes
  - L’action `publierNotesEvaluation` existe pour publier les notes d’une évaluation donnée.

- `RM-04` : Statut des sessions d’évaluation
  - L’action `changeSessionEtat` permet de modifier l’état d’une session d’évaluation.

- `RM-05` : Statut des concours
  - L’action `changeConcoursStatut` permet de modifier le statut d’un concours.

- `RM-06` : Statut des inscriptions
  - L’action `changeInscriptionStatus` permet d’actualiser le statut d’une inscription.

- `RM-07` : Activation d’une année académique
  - L’action `activateAnnee` active une année académique.

- `RM-08` : Gestion de l’organisation des classes
  - `getClassesOrganisationTree` et `getGlobalInfrastructureKPIs` offrent une vue organisationnelle des classes.

- `RM-09` : Gestion des présences
  - `AbscenceView.vue` propose trois statuts d’émargement : `present`, `retard`, `absent`.
  - Un commentaire est autorisé lorsque le statut est `retard` ou `absent`.

- `RM-10` : Calcul des moyennes et rangs concours
  - `calculerMoyennesEtRangs` prépare le calcul des classements pour un concours.

- `RM-11` : Répartition des salles
  - La page `Salles.vue` valide la capacité avant de lancer la répartition.
  - La répartition est bloquée si `totalStudents > totalCapacity`.

## Validations et restrictions identifiables

- Les stores utilisent `useMessageStore.notifyError` et `extractErrorMessage` pour centraliser les erreurs.
- Le frontend gère des messages d’erreur de type backend / réseau.
- Les validations de formulaire sont principalement visuelles et localement présentes dans les champs `input` / `select`.
- Les règles métiers détaillées (format de champs, obligations, conditions de statut) sont majoritairement backend.

## Observations

- La majeure partie de l’intelligence métier est implémentée dans les stores et les services API.
- Certaines pages de l’interface sont encore des prototypes qui ne déclenchent pas toutes les règles métier définies par les stores.
