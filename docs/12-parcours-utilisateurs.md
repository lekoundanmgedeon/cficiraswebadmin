# 12 - Parcours utilisateurs

## Parcours Administrateur

- Se connecte via `/auth/login`.
- Accède au tableau de bord `/dashboard`.
- Gère la structure académique (`/annees-academiques`, `/cycles-academiques`, `/filieres-academiques`, `/classes-niveaux`, `/semestres`).
- Peut consulter les statistiques et la documentation.
- Peut accéder aux pages d’administration générale.

## Parcours Agent académique / Scolarité

- Se connecte via `/auth/login`.
- Consulte la gestion des étudiants `/etudiants`.
- Filtre par année, filière, niveau et classe.
- Accède aux dossiers scolaires `/dossiers-scolaires`.
- Consulte les absences `/absences`.
- Utilise le module `Notes` et les délibérations `/deliberations`.
- Consulter les inscriptions `/inscriptions`.

## Parcours Enseignant

- Se connecte via `/auth/login`.
- Consulte le module `Enseignants` `/enseignants`.
- Vérifie les attributions de cours `/attribution-cours`.
- Consulte les créneaux horaires `/crenaux-horaires`.

## Parcours Responsable pédagogique

- Se connecte via `/auth/login`.
- Gère les classes et les modules assignés via `/classes-niveaux`.
- Gère les programmes et crédits `/programmes-credits`.
- Peut suivre la structure et les semestres.

## Parcours Gestionnaire concours

- Se connecte via `/auth/login`.
- Accède aux éditions de concours `/edition-concours`.
- Accède aux rapports de concours `/rapport-concours`.

## Parcours Finances

- Se connecte via `/auth/login`.
- Accède aux paiements `/paiements-finances`.
- Accède aux factures `/factures-finances`.
- Accède aux rapports financiers `/rapports-financiers`.

## Parcours Support et Documentation

- Accède à `/documentation` et `/assistant-ai`.
- Ces pages apparaissent comme du contenu de support ou de documentation interne.

## Remarque

- Le code définit des rôles clients, mais les parcours restent globalement accessibles sans contrôle fin.
