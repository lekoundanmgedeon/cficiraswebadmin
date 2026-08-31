# Module `notes`

> La saisie des notes et la délibération. Deux écrans, deux moments : on saisit une grille par
> **épreuve**, on délibère par **classe**.

| | |
| --- | --- |
| **Écrans** | 2 |
| **Sous-domaines** | `note` · `deliberation` |
| **Domaine backend** | `/api/evaluations` |
| **Dépendances** | `examens` (sessions, épreuves, bulletins) · `assistant` (onglet embarqué) · `espace-notes` (le bouton d'ouverture et `STATUTS_PUBLIABLES`) — **cycle avec `espace-notes`**, voir [ARCHITECTURE.md](../ARCHITECTURE.md) §2 |

## 1. Écrans et routes

| Chemin | Nom | Titre |
| ------ | --- | ----- |
| `/notes` | `Notes` | Saisie des notes |
| `/deliberations` | `Deliberations` | Délibération |

### La route `/notes/:classeId/:semestre/:type/edit` a disparu

Elle reposait sur un **modèle de données faux** : une note y appartenait à un triplet (classe,
semestre, type d'évaluation). **Le serveur ne connaît pas ce modèle.** Une note appartient à un
couple **(étudiant, évaluation)**, c'est-à-dire à une *épreuve* précise d'une *session*.

L'écran de saisie procède donc par **cascade session → épreuve**.

## 2. Écrans, en détail

### Saisie des notes
Cascade de sélection, puis la grille de l'épreuve choisie : une ligne par étudiant, la valeur, un
commentaire. Enregistrement en lot. Changement de statut de la grille.

### Délibération
| Onglet | Contenu |
| ------ | ------- |
| Procès-verbal | les bulletins de la classe, la décision du jury, la publication |
| Assistant IA | cadrage `examens` |

## 3. Endpoints

⚠️ **Le routeur des notes est monté sur `/notes`, et ses chemins internes répètent le segment.**
Les URL réelles sont donc :

```
GET   /evaluations/notes/evaluations/:evaluationId/notes
PATCH /evaluations/notes/evaluations/:evaluationId/notes/publier
GET   /evaluations/notes/etudiants/:etudiantId/notes?semestreId=…
PUT   /evaluations/notes/notes/:id
POST  /evaluations/notes/evaluations/:evaluationId/notes/saisie
PATCH /evaluations/notes/evaluations/:evaluationId/notes/statut
```

L'ancien code appelait `/evaluations/:id/notes`, `/etudiants/:id/notes` et `/notes/:id` — **sans le
préfixe `/notes`**. Les quatre répondaient **404**, vérifié par curl : **l'API des notes n'a jamais
fonctionné**.

Le doublement du segment est inélégant, mais c'est ce que le serveur expose ; le corriger côté
backend casserait l'API sans nécessité.

| Appel | Rôle |
| ----- | ---- |
| `GET …/evaluations/:id/notes` | la grille d'une évaluation |
| `GET …/etudiants/:id/notes?semestreId` | notes d'un étudiant — `semestreId` **obligatoire** (400 sinon) |
| `PUT …/notes/:id` | met à jour une note |
| `POST …/evaluations/:id/notes/saisie` | **saisie en lot, par matricule** |
| `PATCH …/evaluations/:id/notes/statut` | fait avancer — ou reculer — le statut |
| `PATCH …/evaluations/:id/notes/publier` | publie toutes les notes de l'évaluation |

### Une note ne se crée pas

Il n'existe **pas de `POST /notes`** : les notes préexistent (une ligne par couple étudiant /
évaluation) et l'application ne fait que les **mettre à jour**.

D'où le besoin de la saisie en lot, qui manquait et dont l'absence était **bloquante** : une
évaluation dont les notes n'avaient jamais été saisies ne pouvait pas être notée du tout. Elle
s'appuie sur `importer_notes_batch`, fonction Postgres présente depuis le début mais qu'aucun
appelant n'utilisait.

Sa réponse est un **rapport**, pas une liste de notes :

```json
{ "total_traite": 42, "total_succes": 40, "total_echecs": 2,
  "erreurs": [{ "matricule": "ETU-…", "erreur": "…" }] }
```

Un matricule inconnu **ne fait pas échouer le lot** — il ressort dans `erreurs`.

## 4. Vocabulaire

### Statuts d'une note
`CHECK (statut IN ('SAISIE', 'VALIDEE', 'PUBLIEE'))`.

| Code | Libellé |
| ---- | ------- |
| `SAISIE` | Saisie |
| `VALIDEE` | Validée |
| `PUBLIEE` | Publiée |

### Bornes
`CHECK (valeur >= 0.00 AND valeur <= 20.00)`.

### Transitions acceptées, et par qui

| Transition | Rôle |
| ---------- | ---- |
| `SAISIE → VALIDEE` | scolarité |
| `VALIDEE → PUBLIEE` | directeur |
| `VALIDEE → SAISIE` (renvoi en correction) | scolarité ou gestionnaire |

Une transition qui **ne déplace aucune note** répond **409** avec la répartition réelle des
statuts : **c'est une information, pas une panne**. L'écran doit la présenter comme telle.

### Les constantes du bulletin ne sont pas ici

Décision du jury, mention et publication vivent dans `examens/bulletin/constants.js` — là où vivent
son store et son API. La délibération les importe de là ; l'inverse refermerait un cycle.

## 5. État et règles

Store **non bâti** sur `createCrudStore` : les notes ne forment pas une ressource REST. Il
réimplémente `run` avec le même contrat.

| Membre | Rôle |
| ------ | ---- |
| `items`, `evaluationId` | la grille chargée et son épreuve |
| `saisies` | les notes réellement renseignées |
| `moyenne` | dérivée des saisies |
| `estPubliee`, `parStatut`, `statutGlobal` | l'état de la grille |
| `fetchByEvaluation`, `fetchByEtudiant`, `update`, `saisirLot`, `changerStatut`, `publier` | actions |

## 6. Pièges à reproduire

1. **Le modèle de données** : une note appartient à (étudiant, évaluation). Ne pas reconstruire une
   route par (classe, semestre, type).
2. **Le segment `/notes` doublé** dans toutes les URL.
3. **Pas de `POST`** : passer par la saisie en lot pour créer les lignes manquantes.
4. **Corriger une note la repasse en `SAISIE`** côté serveur : une valeur corrigée ne conserve pas
   la validation obtenue par la précédente. L'écran doit le dire.
5. **Le 409 d'une transition sans effet est informatif**, pas une erreur à afficher en rouge.
6. **`semestreId` obligatoire** sur les notes d'un étudiant.
7. L'ancien store existait et fonctionnait — mais **aucune vue ne l'appelait**, et ses quatre
   appels répondaient 404 de toute façon.

## 7. Checklist de reconstruction

- [ ] Cascade session → épreuve, puis grille
- [ ] La grille ne renvoie que les étudiants **déjà notés** : compléter l'effectif depuis la classe
      (voir la fiche [espace-notes](./espace-notes.md) §4)
- [ ] Enregistrement en lot par matricule, avec rapport `total_traite / succes / echecs / erreurs`
- [ ] Rapport de rejets paginé, matricule par matricule
- [ ] Transitions de statut, avec le rôle qui les autorise et le 409 informatif
- [ ] Bornes 0–20 appliquées à la saisie
- [ ] Délibération : bulletins de la classe, décision du jury, publication
- [ ] Les constantes de bulletin importées depuis le module `examens`, pas dupliquées
