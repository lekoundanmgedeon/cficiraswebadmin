# Module `examens`

> Les sessions d'évaluation, leurs épreuves, le calendrier, les salles et les bulletins.
> La chaîne complète est **session → épreuve → notes → bulletin → délibération → publication** ;
> ce module en porte les deux extrémités.

| | |
| --- | --- |
| **Écrans** | 5 |
| **Sous-domaines** | `session` · `epreuve` · `calendrier` · `salle` · `bulletin` |
| **Domaine backend** | `/api/evaluations` — sauf les salles, sur `/api/academique` |
| **Dépendances** | `structure-academique` (classes, semestres, années) · `matieres` (les modules d'une épreuve) · `assistant` (onglet embarqué) |
| **Dépendants** | `notes` (la délibération lit le store des bulletins) · `espace-notes` |

## 1. Écrans et routes

| Chemin | Nom | Titre |
| ------ | --- | ----- |
| `/examens` | `Examens` | **redirige** vers `PlanificationExamens` |
| `/planification-examens` | `PlanificationExamens` | Planification des examens |
| `/planification-examens/:id/evaluations` | `EvaluationsExamens` | Épreuves d'une session |
| `/calendrier-examens` | `CalendrierExamens` | Calendrier des examens |
| `/salles-horaires` | `SallesExamens` | Salles et horaires |
| `/rapport-examens` | `RapportExamens` | Rapports d'examens |

L'ancien écran `/examens` empilait la planification et le calendrier l'une sous l'autre, avec un
bouton « + Ajouter » visant `#exampleModal` — **une modale qui n'existait nulle part** — et un lien
« Importer fichier » pointant sur une ancre absente. Les deux écrans ont chacun leur route.

## 2. Écrans, en détail

### Planification
Liste des sessions d'évaluation, CRUD, changement d'état. Filtrage pairs / impairs par numéro de
semestre. Depuis une session, on ouvre ses épreuves.

### Épreuves d'une session
CRUD des épreuves, plus un **import de planning** par classeur. 675 à 1 800 lignes rendues d'un
bloc avant pagination.

### Calendrier
| Onglet | Contenu |
| ------ | ------- |
| Session normale | les épreuves de type `NORMALE` |
| Session rattrapage | celles de type `RATTRAPAGE` |

### Salles et horaires
CRUD des salles.

### Rapports
| Onglet | Contenu |
| ------ | ------- |
| Palmarès | les bulletins d'une classe, triés par rang ; décision du jury ; publication |
| Assistant IA | cadrage `examens` |

En tête de l'écran, **trois sélecteurs** : classe, semestre, année. Ils ne sont pas décoratifs —
voir §5.1.

## 3. Endpoints

### Sessions — `/evaluations/sessions-evaluations`
| Appel | Rôle |
| ----- | ---- |
| CRUD standard | |
| `PATCH /sessions-evaluations/:id/etat` | `INACTIVE` \| `ACTIVE` \| `ARCHIVE` |

> Le chemin de cette dernière était **doublé** côté serveur : déclarée
> `router.patch('/sessions-evaluations/:id/etat')` dans un routeur *déjà* monté sur
> `/sessions-evaluations`, la route réelle était
> `/evaluations/sessions-evaluations/sessions-evaluations/:id/etat`. Le front appelait la version
> simple — la seule qui ait du sens — et recevait un **404** : le changement d'état d'une session
> n'a jamais pu aboutir. Corrigé côté backend.

### Épreuves — `/evaluations/evaluation`
CRUD standard. ⚠️ **Le chemin est au singulier** (`/evaluation`) alors que le domaine est au
pluriel (`/evaluations`) : l'URL complète est `/api/evaluations/evaluation`.

> **Un CRUD qui n'a jamais fonctionné.** Le contrôleur appelait cinq méthodes absentes de son
> modèle (`createEvaluation`, `getEvaluationById`, `updateEvaluation`, `deleteEvaluation`) là où
> celui-ci expose `create`, `findById`, `update`, `delete` : **quatre routes sur cinq échouaient**,
> sur un `TypeError` masqué en 500 générique. Seul `GET /evaluation` répondait.
>
> Et ses filtres mentaient : le contrôleur lisait `anneeId` et `semestreId` dans la query string,
> puis les passait à un `findAll(sessionId, moduleId)`. Un `?anneeId=…` était donc interprété comme
> un identifiant de **session**. Le modèle ne sait pas filtrer par année ni par semestre.
>
> Corrigé : `GET /evaluation` accepte désormais `sessionId` et `moduleId` — ce qu'il fait
> réellement.

Le module charge malgré tout la liste complète et trie en mémoire : le calendrier a besoin de
toutes les épreuves, et la collection est petite. Une seule requête vaut mieux qu'une par onglet.

### Salles — `/academique/salles`
CRUD standard. La table `salles` existait, avec ses données, mais **aucune route ne l'exposait** :
seul un contrôleur d'un domaine désactivé la lisait. L'écran inventait donc ses salles
(« 5 salles de 20 places »). Le CRUD a été ajouté côté backend.

Contraintes portées par la base : `type ∈ {Amphi, Cours, TD, TP, Labo}` · `capacite > 0` ·
`code_salle` unique · les cinq colonnes sont **NOT NULL**.

### Bulletins — `/evaluations/resultats`
| Appel | Rôle |
| ----- | ---- |
| `GET /resultats/classes/:classeId/bulletins?semestreId&anneeId` | palmarès d'une classe |
| `GET /resultats/etudiants/:etudiantId/bulletins/:semestreId` | bulletin d'un étudiant |
| `PUT /resultats/bulletins/:id/decision` | décision du jury |
| `PATCH /resultats/classes/:classeId/bulletins/publier` | publication officielle |
| `POST /resultats/classes/:classeId/bulletins/generer` | **calcule et enregistre** les bulletins |

Les quatre premières existaient déjà, ainsi que leur store — mais **aucune vue ne les appelait**.
`RapportExamens.vue` affichait, dans un « rapport d'examens », une liste de **formateurs codés en
dur**, servie après un `setTimeout(3000)`.

`POST …/generer` est le geste qui remplit `bulletins_semestriels` : sans lui, les quatre autres
routes lisent une table vide. La fonction serveur est **idempotente** — relancer met à jour, ne
duplique pas — et ne touche **jamais un bulletin verrouillé**.

> ⚠️ Le module `stats` déclare **le même endpoint** pour son propre écran. Les deux consommateurs
> sont indépendants ; les fusionner créerait une dépendance entre deux modules qui n'en ont aucune
> autre.

## 4. Vocabulaire

### Types de session
`NORMALE` (Normal) · `RATTRAPAGE` (Rattrapage).

### États de session — machine à états du backend
`if (!['INACTIVE', 'ACTIVE', 'ARCHIVE'].includes(etat))` → 400.

| Code | Libellé |
| ---- | ------- |
| `INACTIVE` | Inactive |
| `ACTIVE` | Active |
| `ARCHIVE` | Archivée |

### Types d'épreuve
Relevés sur la contrainte `CHECK` de la table `evaluations` :
`CHECK (type_eval IN ('CC', 'TP', 'EXAMEN', 'PROJET'))`.

| Code | Libellé |
| ---- | ------- |
| `EXAMEN` | Examen |
| `CC` | Contrôle continu |
| `TP` | Travaux pratiques |
| `PROJET` | Projet |

⚠️ L'ancien écran en proposait trois **autres** — `CC`, `NORMAL`, `RATTRAPAGE` : seul le premier
existait. `NORMAL` et `RATTRAPAGE` sont des types de **session**, pas d'épreuve ; les enregistrer
aurait violé la contrainte.

### Pondération
`CHECK (ponderation > 0.00 AND ponderation <= 100.00)`. Bornes appliquées côté client : une valeur
hors bornes remonte sinon en erreur SQL brute.

### Types de salle
`CHECK (type IN ('Amphi', 'Cours', 'TD', 'TP', 'Labo'))`.

### Bulletin
| Champ | Valeurs (contrainte `CHECK`) |
| ----- | ---------------------------- |
| `decision` | `EN_ATTENTE` · `VALIDE` · `AJOURNE` · `RATTRAPAGE` |
| `mention` | `PASSABLE` · `ASSEZ_BIEN` · `BIEN` · `TRES_BIEN` · `EXCELLENT` (nullable) |
| `statut_publication` | `BROUILLON` · `PUBLIE` · `VERROUILLE` |
| `moyenne_generale` | `CHECK (>= 0 AND <= 20)` |

Ces constantes vivent dans `examens/bulletin/`, **pas** dans `notes` : `notes` dépend déjà
d'`examens`, les y placer refermerait le cycle.

### Schéma d'import de planning

```
code_session · code_module · type_eval · designation · ponderation · date_prevue
```

`date_prevue` est la **seule colonne facultative** — la seule nullable de la table. Les colonnes
désignent le module et la session par leur **code**, jamais par un identifiant.

Le schéma porte un `validate` qui vérifie **les deux contraintes `CHECK` avant l'envoi** : type
d'évaluation connu, pondération dans les bornes, date lisible.

## 5. Pièges à reproduire

### 5.1 Un bulletin est identifié par un triplet

**(classe, semestre, année)** — jamais par la seule classe. `semestreId` et `anneeId` sont
**obligatoires** : le contrôleur répond `400 « Les paramètres semestreId et anneeId sont
obligatoires »` s'ils manquent — **en query pour la lecture, dans le corps pour la publication**.
D'où les trois sélecteurs en tête de l'écran, et le `contexte` retenu dans le store.

### 5.2 Les dates de classeur ne se lisent pas avec `new Date()`

Son analyse de repli est trop permissive dans un sens et trop stricte dans l'autre. Relevé sur
Node 24 :

| Saisie | `new Date(…)` |
| ------ | ------------- |
| `15 janvier` | **2001-01-15** |
| `15/01/2026` | **Invalid** |

Un libellé français serait donc enregistré comme une date de 2001, en silence, tandis que la
notation JJ/MM/AAAA — la plus naturelle pour qui saisit le fichier — serait rejetée. Les deux
formats acceptés sont lus **par motif**, et leurs composantes vérifiées : le 31/02 n'est pas une
date, le 31 avril non plus.

Et pour une cellule déjà typée `Date` par SheetJS (`cellDates: true`), lire les composantes
**locales** : `toISOString()` bascule d'un jour sur les fuseaux négatifs, et une date d'examen ne
se décale pas.

### 5.3 Résoudre les codes à l'envoi, ligne par ligne

Le fichier d'import désigne module et session par leur code. La résolution code → identifiant se
fait à l'envoi : une correspondance introuvable devient un **rejet motivé** dans le rapport, pas un
400 opaque sur tout le lot.

### 5.4 Le calcul des bulletins précède tout le reste

Sans `POST …/bulletins/generer`, `bulletins_semestriels` reste vide et le palmarès, les
statistiques et la délibération n'ont rien à afficher. Prévoir le bouton, et dire qu'il est
idempotent.

### 5.5 Le même endpoint chez deux consommateurs

`genererBulletinsClasse` est déclaré ici **et** dans `stats`. C'est délibéré : une ligne unique de
chaque côté vaut mieux qu'une dépendance entre deux modules sans autre lien.

## 6. Checklist de reconstruction

- [ ] Cinq écrans, plus la redirection `/examens` → planification
- [ ] Sessions : CRUD + changement d'état (trois valeurs)
- [ ] Épreuves : CRUD + import de planning, avec `validate` avant envoi et rapport de rejets
- [ ] Lecture des épreuves en **une** requête, tri en mémoire
- [ ] Calendrier à deux onglets (normale / rattrapage), paginé
- [ ] Salles : CRUD, cinq types, capacité > 0, code unique
- [ ] Rapports : **trois sélecteurs obligatoires**, palmarès, décision du jury, publication
- [ ] Bouton « générer les bulletins », idempotent, jamais sur un bulletin verrouillé
- [ ] Normalisation des dates de classeur par motif, sans `new Date(chaîne)`
- [ ] Chemin des épreuves au **singulier** ; chemin des sessions **non doublé**
