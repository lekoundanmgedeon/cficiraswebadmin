# 02 - Architecture fonctionnelle

## Découpage fonctionnel de l’ERP

La plateforme se structure autour des domaines fonctionnels suivants :

1. Authentification
2. Stratégie de structure académique
3. Scolarité et parcours étudiants
4. Examens
5. Concours
6. Inscriptions
7. Finances
8. Pédagogie
9. Tableaux de bord et statistiques
10. Administration / documentation / support

## Description des grands domaines métier

- **Authentification** : connexion, création de compte, stockage de token JWT dans localStorage.
- **Structure académique** : gestion des années académiques, cycles, filières, classes et semestres.
- **Scolarité** : gestion des étudiants, dossiers scolaires, absences et notes.
- **Examens** : planification d’examens, calendrier, gestion des salles et production de rapports.
- **Concours** : édition et configuration des concours, gestion des résultats et rapports.
- **Inscriptions** : importation et suivi des inscriptions, suivi financier associé.
- **Finances** : paiements, factures et rapports financiers.
- **Pédagogie** : enseignants, attribution des cours, créneaux horaires, programmes et crédits.
- **Tableaux de bord** : pages Dashboard et Statistiques.
- **Support / Documentation** : pages de documentation interne et assistant AI.

## Relations entre les modules

- Les **modules académiques** (années, cycles, filières, classes, semestres) servent de référentiel aux autres modules.
- Les **étudiants** se rattachent à des **classes**, des **filières** et des **semestres**.
- Les **examens** sont liés à des sessions et des salles.
- Les **concours** disposent d’épreuves, de notes et de résultats.
- Les **inscriptions** et le suivi financier restent connectés aux services financiers.
- La gestion des **enseignants** et des **crédits** alimente la planification pédagogique.
- Les **statistiques** sont des vues de synthèse transversales.

## Notes fonctionnelles

- Le code montre un découpage métier fort entre pages (views) et services API.
- La plupart des modules métiers sont supportés par des stores Pinia et des services API dédiés.
- Certains écrans présentent des données simulées plutôt que des appels API.
