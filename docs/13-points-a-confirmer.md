# 13 - Points à confirmer

## Mismatch entre menu et routes

- Plusieurs éléments de la sidebar ne correspondent à aucune route définie :
  - `/schedule`, `/salles`, `/reservation`, `/disponibilites`
  - `/conges-replacement`
  - `/bibliotheque`
  - `/themes-memoires`, `/soutenances`, `/statut`
  - `/demande-diplome`, `/edition-diplome`, `/historique-diplome`
  - `/courriers`, `/notes-admin`, `/archivage`
  - `/notification`, `/settings`

## Authentification

- Le routeur marque `DefaultLayout` comme `requiresAuth` mais aucun `router.beforeEach` de protection n’est implémenté.
- La page `/auth/register` contient un formulaire statique non connecté au store.
- `/auth/new-password` redirige vers `Login.vue` sans écran dédié.
- La page `/inscriptions` est structurée en onglets, mais la connexion aux stores backend n’est pas clairement visible.

## Données simulées

- Plusieurs pages utilisent des listes et des chronos `setTimeout` pour simuler des réponses (`Etudiants.vue`, `Paiements.vue`, `Facturation.vue`, `RapportFinances.vue`, `Enseignants.vue`).
- Le module `Scolarité` est partiellement simulé : `/etudiants` et `/dossiers-scolaires` n’appellent pas encore les stores backend correspondants.
- La page `/absences` construit un payload de présence mais n’envoie pas d’appel API réel.
- Il faut confirmer quelles pages sont des maquettes et lesquelles doivent être connectées au backend.

## Fonctionnalités implémentées côté API sans page correspondante

- L’API `src/api/userApi.js` n’est pas utilisée.
- Plusieurs endpoints académiques, pédagogiques et de gestion semblent prêts mais manquent d’écrans dédiés.

## Permissions et rôles

- Le store définit des rôles, mais aucune logique de filtrage des routes ou du menu ne les exploite.
- Confirmer si le backend applique des restrictions supplémentaires.

## Imports et fichiers

- Le code supporte l’import Excel/CSV côté frontend dans `Salles.vue` et des imports backend dans `academiqueApi.js` / `gestionApi.js`.
- Confirmer la structure attendue des fichiers d’import.

## Règles métier manquantes

- Les conditions de validation des formulaires ne sont pas toutes explicites dans le frontend.
- Les états cibles (validation, rejet, archivage, export, import) sont implémentés partiellement.

## Fichiers et pages à clarifier

- `src/views/admin/Administration.vue` : statut réel et données consommées.
- `src/views/prompt/AssistantAi.vue` : intégration du service AI.
- `src/views/docf/Document.vue` : contenu de documentation interne.

## Recommandations

- Faire le lien entre le menu sidebar et le routeur afin de supprimer ou implémenter les liens orphelins.
- Ajouter un guard global pour `meta.requiresAuth`.
- Connecter les pages simulées aux stores existants.

---

# Checklist de qualité

- Routes analysées : authentification, structure, étudiants, examens, finances, pédagogie, concours, autres.
- Menus analysés : sidebar, routes réelles, points de mismatch.
- Composants analysés : layout, partials, pages, composants de tabulation.
- Stores analysés : auth, académique, étudiants, évaluations, finances, concours, pédagogie, messages.
- API analysées : auth, académique, évaluations, finances, gestion, pédagogie, uploads.
- Workflows documentés : connexion, année académique, classes, dossier étudiant, examens, salles, concours, inscriptions.
- Cas d’utilisation rédigés : 8 cas.
- Points à confirmer listés : mismatch menu-routes, authentification, simulated data, permissions, imports.
