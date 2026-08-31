# Documentation du frontend CFI/CIRAS

Front d'administration de l'ERP académique. Vue 3 (`<script setup>`) + Vite + Pinia,
Bootstrap 5, Chart.js / ECharts. Français partout : interface, commentaires, commits.

Cette documentation a **deux usages**, et deux points d'entrée :

| Vous voulez…                                                  | Ouvrez                                                                 |
| ------------------------------------------------------------- | ---------------------------------------------------------------------- |
| travailler **dans** ce dépôt                                  | [ARCHITECTURE.md](./ARCHITECTURE.md) puis [GUIDE-MODULE.md](./GUIDE-MODULE.md) |
| **reconstruire** ce front dans une autre technologie          | [RECONSTRUCTION.md](./RECONSTRUCTION.md) puis [modules/](./modules/)    |
| savoir **ce que le serveur expose vraiment**                  | [CONTRAT-API.md](./CONTRAT-API.md)                                     |
| savoir **où en est le chantier**                              | [ETAT-REFACTORISATION.md](./ETAT-REFACTORISATION.md)                   |

## Les documents

### Socle

| Fichier                                            | Contenu                                                                                                             |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| [ARCHITECTURE.md](./ARCHITECTURE.md)               | Découpage par module, noyau `core/`, socle `shared/`, règle de dépendance, contrats à connaître.                   |
| [CONTRAT-API.md](./CONTRAT-API.md)                 | Conventions HTTP : enveloppe de réponse, formes d'erreur, domaines backend, session, rôles, pièges de données.      |
| [UI-PARTAGEE.md](./UI-PARTAGEE.md)                 | Catalogue de `shared/` et des motifs d'écran répétés (en-tête, onglets, modale, pagination, export).                |
| [GUIDE-MODULE.md](./GUIDE-MODULE.md)               | Recette pas à pas pour créer un module **dans ce dépôt**.                                                           |

### Reconstruction

| Fichier                                            | Contenu                                                                                                             |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| [RECONSTRUCTION.md](./RECONSTRUCTION.md)           | Reconstruire le front dans une autre pile : invariants à respecter, équivalences de patterns, ordre des modules.    |
| [modules/](./modules/)                             | **Une fiche par module** — routes, écrans, onglets, endpoints, énumérations, règles, pièges, checklist.             |

### Suivi

| Fichier                                            | Contenu                                                                                                             |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| [ETAT-REFACTORISATION.md](./ETAT-REFACTORISATION.md) | Journal de la refonte : ce qui a été fait module par module, et pourquoi. Long, chronologique, tenu à jour.        |
| [DETTE-TECHNIQUE.md](./DETTE-TECHNIQUE.md)         | Ce qui reste à nettoyer, mesuré et daté.                                                                            |

## Le principe qui gouverne toute cette documentation

> **Rien n'y est affirmé qui n'ait été lu dans le code, dans le schéma de la base, ou vérifié
> contre le serveur.**

Le dépôt documente ses pièges à l'endroit où ils mordent : un `api.js` explique pourquoi un
chemin est doublé, un `constants.js` cite la contrainte `CHECK` dont il est le miroir. Les fiches
de `modules/` rassemblent ces observations ; **le code reste la source**, et une fiche qui le
contredit a tort.

Lint, tests et build **ne parlent pas au backend** : ils passent au vert sur un module bâti sur
des routes inexistantes — c'est arrivé. Avant d'écrire un écran, lire les routes réellement
exposées et interroger la base. La méthode est en tête de [CONTRAT-API.md](./CONTRAT-API.md).

## État mesuré

Relevé le **31 août 2026**, sur la branche `refactor-main` :

| Contrôle        | Résultat                                                    |
| --------------- | ------------------------------------------------------------- |
| `npm run lint`  | **0 erreur**, 234 avertissements (194 = ordre des attributs) |
| `npm test`      | **494 tests**, 68 fichiers, 1 ignoré                         |
| `npm run build` | OK                                                            |
| Modules         | **20** sous `src/modules/`                                    |
| Chemins déclarés | 55, dont 5 redirections d'anciennes URL                      |
