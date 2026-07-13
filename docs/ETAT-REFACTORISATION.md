# État de la refactorisation — point de reprise

Document de passation. Il dit **où en est le chantier**, **ce qui reste**, et **comment reprendre**.
À tenir à jour à chaque module migré.

- Branche : `refactor-main` (12 commits, dernier : migration du module `notes` et de la délibération)
- État de santé : `npm run lint` **0 erreur** sur le code migré · `npm test` **64 tests** · `npm run build` **OK**
- ⚠️ **`matieres`, `examens` et `concours` ont nécessité des corrections dans `cfibackend`.**
  Voir §1.6, §1.9, §1.10 — le dépôt backend porte un commit par module.
- **Endpoints vérifiés contre le backend local** (`localhost:3500`) : toutes les routes appelées par
  les modules migrés répondent, et les flux d'écriture sont exercés pour de vrai (base restaurée
  ensuite). Voir §2.5 — c'est ce contrôle qui manquait et qui avait laissé passer un module entier
  bâti sur des routes inexistantes.

---

## 1. Ce qui est fait

### 1.1 Le noyau `src/core/` — terminé

| Fichier                    | Rôle                                                                                                                                                                                                                               |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api/httpClient.js`        | Client Axios par domaine. Injecte le jeton, **déballe la réponse**, **normalise les erreurs**, expose `onUnauthorized()`. Toutes les méthodes acceptent une config Axios.                                                          |
| `api/apiError.js`          | `ApiError` : forme unique d'erreur (`message`, `status`, `fieldErrors`, `isUnauthorized`, `isNetworkError`, `isValidationError`). Seul endroit qui connaît les 4 formats d'erreur du backend.                                      |
| `api/createResource.js`    | Fabrique REST : `list`, `getById`, `create`, `update`, `patch`, `remove`.                                                                                                                                                          |
| `api/clients.js`           | Un client par domaine : `authClient`, `academiqueClient`, `gestionClient`, `pedagogieClient`, `financeClient`, `evaluationClient`.                                                                                                 |
| `store/createCrudStore.js` | **Pièce maîtresse.** Fabrique de store Pinia : state (`items`, `item`, `meta`, `loading`, `error`), getters (`isEmpty`, `count`, `getById`), actions (`fetchAll`, `fetchById`, `create`, `update`, `remove`, `invalidate`, `run`). |
| `router/index.js`          | Assemble les routes des modules + celles restées en `src/routes/`. Branche la redirection sur 401.                                                                                                                                 |
| `router/guards.js`         | Guard `beforeEach`. **Tout est protégé par défaut** ; une route publique doit porter `meta: { public: true }`.                                                                                                                     |
| `auth/authStore.js`        | Session : login, logout, profil, rôles.                                                                                                                                                                                            |
| `auth/tokenStorage.js`     | Source unique de vérité pour le jeton.                                                                                                                                                                                             |

**Contrat central à connaître** : `run()` renvoie **`undefined` en cas d'échec**. L'UI s'y fie :

```js
const result = await store.create(form.value);
if (result !== undefined) close(); // la modale ne se ferme que si ça a vraiment marché
```

### 1.2 Les partagés `src/shared/` — terminé

**Composants** — `AppTabs` (⚠️ le plus important, voir §1.4), `ItemActions`, `ConfirmModal`,
`EmptyState`, `LoadingSpinner`, `PageHeader`, `PageCard`, `ExportMenu`.

**Composable** — `useTableExport` : remplace le triplet export répété dans 11 fichiers. Les
colonnes sont **dérivées des lignes**, elles ne peuvent plus se désynchroniser.

**Utils** — `cache.js` (TTL + purge), `date.js`, `text.js` (`escapeHtml`, `escapeRegExp`,
`highlight`), `modal.js`, `exportExcel.js`, `exportPDF.js`, `toast.js`.

**Store** — `notificationStore.js` : unifie les 5 fichiers de `stores/messages/`.

### 1.3 Le module `structure-academique` — terminé (6 sous-domaines)

```
src/modules/structure-academique/
├── routes.js       ← les 5 écrans
├── annee/     api.js · store.js · constants.js · composables/ · components/ · views/
├── cycle/     idem
├── filiere/   idem
├── niveau/    idem  (pas de vue propre : onglet des écrans filières / classes / semestres)
├── classe/    idem
└── semestre/  idem
```

Stores : **1 145 lignes → 400**. Écrans : **1 requête au chargement au lieu de 4–5**.

### 1.4 Le module `etudiants` — terminé

```
src/modules/etudiants/
├── routes.js · api.js · store.js · constants.js
├── composables/  useEtudiantForm.js · useEtudiantFilters.js
├── components/   EtudiantTabs · EtudiantFormModal · EtudiantInfosTab · EtudiantParcoursTab
│   └── tabs/     Liste · ParClasse · Repartition · Statistiques · Import · Export
└── views/        EtudiantsView.vue · EtudiantDetailView.vue
```

**Ce module n'avait jamais affiché un seul vrai étudiant.** Quatre de ses six onglets, ainsi que
la vue racine, servaient des tableaux codés en dur ; le store n'exposait ni `items` ni `fetchAll`,
donc aucun écran ne _pouvait_ charger de liste. 3 634 lignes → 2 631, et tout est branché sur l'API.

| Onglet       | Avant                                                                                                                                                         | Après                                                                                                                         |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Liste        | 20 étudiants en dur, `@edit` → `console.log`                                                                                                                  | annuaire projeté depuis `GET /inscriptions` (voir l'encadré)                                                                  |
| Par classe   | appelait `fetchEtudiantsByClasseFiliereAnnee` et lisait `filteredEtudiants` — **ni l'un ni l'autre n'existait** dans le store → `TypeError` au premier filtre | `fetchAll({ params })`                                                                                                        |
| Organisation | groupes pédagogiques inventés, `setTimeout`, aucun backend                                                                                                    | **remplacé** par « Répartition » : effectifs et taux de remplissage réels (`nb_etudiants` / `capacite_max` de `GET /classes`) |
| Statistiques | 4 étudiants en dur, `Chart` jamais détruit                                                                                                                    | dérivées de l'annuaire réel ; instances détruites au démontage                                                                |
| Import       | fichier **vide**, et son onglet n'avait aucun lien de nav → inatteignable                                                                                     | `POST /imports/etudiants`                                                                                                     |
| Export       | 3 étudiants en dur ; `data-io/ExportData.vue` appelait `XLSX` **sans l'importer** → plantait au clic                                                          | Excel / PDF / CSV via `useTableExport`                                                                                        |

> ### ⚠️ La ressource `/etudiants` reste incomplète
>
> **Cet encadré a changé en cours de chantier.** Au moment de la migration, `GET /etudiants`
> n'existait pas (404) : l'annuaire était projeté depuis `GET /inscriptions`, faute de mieux. La
> route a **depuis été ajoutée côté backend** (commit `2a39cdd`), et le module a été recâblé —
> voir **§1.8**.
>
> Ce qui manque **toujours**, vérifié par curl :
>
> | Route                   | État                                                                        |
> | ----------------------- | --------------------------------------------------------------------------- |
> | `GET /etudiants`        | ✅ existe (identité complète : sexe, téléphone, filière, statut de dossier) |
> | `GET /etudiants/:id`    | ❌ **404** — le détail passe par `/:id/complet`                             |
> | `PUT /etudiants/:id`    | ❌ **404** — on ne peut pas modifier un étudiant                            |
> | `DELETE /etudiants/:id` | ❌ **404** — ni le supprimer                                                |
>
> Les boutons « Modifier » et « Supprimer » ont donc été retirés : mieux vaut pas de bouton qu'un
> bouton qui ment. `GET /etudiants` ne porte par ailleurs **ni classe ni année académique** — un
> étudiant appartient à une _filière_, sa _classe_ vient de son _inscription_.

La fiche détail déclarait **4 onglets pour 2 panneaux** (« Tuteur » et « Dossier complet »
pointaient sur un `#sales2` inexistant), trois `<li>` partageaient le même `id`, et
`etudiant.value = response` ne déballait pas l'enveloppe `{ success, data }` — la fiche lisait donc
`enveloppe.nom`, toujours `undefined`. Son onglet « Fiche académique » affichait enfin des champs
d'agent (grade, fonction, unité de service) étrangers au modèle étudiant : il cède la place au
**parcours académique**, dont l'endpoint (`GET /etudiants/:id/parcours`) existait depuis toujours
sans qu'aucune vue ne l'appelle.

Le bouton « Générer un rapport » de l'en-tête a été retiré : sa modale attendait 1,8 s
(`setTimeout`) puis notifiait « Rapport généré et téléchargé avec succès » **sans appeler la moindre
API ni produire de fichier**. L'onglet Export fait désormais réellement ce qu'elle prétendait faire.

`useEtudiantFilters` unifie le triplet année/filière/classe recopié dans 4 fichiers. Les trois
d'entre eux qui appelaient `classeStore.fetchClassesByFiliere()` à chaque changement de filière
**écrasaient `items` du store des classes**, un état partagé par toute l'application ; les classes
sont maintenant chargées une fois (depuis le cache) puis filtrées en mémoire. Attention :
`listerInscriptions` ne lit que `annee_academique_id`, `classe_id` et `statut` dans la query
string — **la filière n'est pas un filtre serveur** et s'applique côté client.

### 1.5 Le module `inscriptions` — terminé

```
src/modules/inscriptions/
├── routes.js · api.js · store.js · constants.js · constants.test.js
├── composables/  useImportFile.js
├── components/   InscriptionTabs · ImportModal · PaiementModal · ReinscrireModal
│                 InscriptionDetailsModal · ClasseEtudiantsModal
│   └── tabs/     Liste · Classes · Reinscriptions · Paiements · Statistiques
└── views/        InscriptionsView.vue
```

`GET /inscriptions` est la **source de vérité des étudiants** de toute l'application : c'est de là
que `modules/etudiants` tire son annuaire. 4 344 lignes → 3 040.

| Onglet           | Avant                                                                                                                                                                                                                     | Après                                                                                                                                                         |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Inscriptions     | « Détails » posait un état **sans monter la moindre modale** ; « Supprimer » appelait `store.removeInscription` — action absente du store _et_ sans endpoint                                                              | détail réel ; sortie de dossier par **changement de statut** (`PATCH /:id/statut`)                                                                            |
| Gestion classes  | « Importer des étudiants » → `openImport()`, **fonction jamais définie** ; « Imprimer » et « + Nouvelle classe » sans `@click`                                                                                            | capacité, taux de remplissage, étudiants d'une classe                                                                                                         |
| Réinscriptions   | lisait `candidatsPourReinscription` et appelait `fetchCandidatsReinscription()` — **ni l'un ni l'autre n'existait** ; un garde `typeof === 'function'` masquait l'appel manquant, la liste restait vide **en permanence** | candidats = étudiants sans inscription sur l'année cible, dérivés de `GET /inscriptions` ; réinscription **unitaire** réelle (`POST /inscriptions`) et en lot |
| Frais paiements  | `validerInscription` et `imprimerRecu` définies mais **appelées par aucun bouton**                                                                                                                                        | validation / rejet via la modale de dossier                                                                                                                   |
| Rapports & Stats | **100 % maquette** : « 1 284 inscriptions », « 12.5M FCFA », barres figées `[40, 60, 45, …]`, « Générer PDF » → `console.log`                                                                                             | KPI, graphiques et export **dérivés des données réelles**                                                                                                     |

Les deux modales d'import (500 + 429 lignes) ne différaient que par leurs colonnes obligatoires :
elles fusionnent en un `ImportModal` piloté par `IMPORT_SCHEMAS`. Celle des réinscriptions était de
toute façon inopérante — elle appelait `bulkImportReinscriptions()`, **action absente du store**.

**Quatre composants orphelins** supprimés (`Etudiants.vue`, `candidats.vue`, `concours.vue`,
`details/ItemActions.vue`) : données simulées, importés par aucun fichier.

#### Le piège des deux vocabulaires de statut

`GET /inscriptions` et `GET /inscriptions/finances` ne parlent pas la même langue — et l'écart ne
se limite pas à la casse. Relevé **en croisant les deux endpoints sur les mêmes identifiants** :

| `/inscriptions` | `/inscriptions/finances`             |
| --------------- | ------------------------------------ |
| `EN_ATTENTE`    | `"en attente"`                       |
| `VALIDEE`       | `"validée"`                          |
| `ACTIVE`        | `"active"`                           |
| `REJETEE`       | **`"annulée"`** ← et non « rejetée » |

L'ancien code absorbait l'écart par des `includes('VALI')` disséminés dans quatre composants.
Tout passe désormais par `normalizeStatut()`, **couvert par un test** (`constants.test.js`) : sans
l'alias `ANNULEE → REJETEE`, un dossier rejeté s'affiche « Inconnu » et son filtre ne le remonte
jamais. Les statuts acceptés **en écriture** sont `EN_ATTENTE`, `VALIDEE`, `REJETEE`, `ACTIVE`,
`ABANDON`, `DIPLOME`, `EXCLU` (`inscription.controller.js` → `statutsValides`).

### 1.6 Le module `matieres` — terminé (et son backend réparé)

```
src/modules/matieres/
├── routes.js · api.js · store.js · constants.js
├── composables/  useModuleForm.js
├── components/   ModuleTabs · ModuleFormModal · AssignationModal
│   └── tabs/     ListeModules · Configuration
└── views/        ModulesView.vue
```

908 lignes → 1 351 (le module fait beaucoup plus qu'avant : il fonctionne).

**L'écran n'existait pas, en pratique.** `views/matieres/` n'était référencé par **aucune route ni
aucun lien de menu** : strictement inaccessible. Et s'il l'avait été, il aurait **planté au
montage** — `ModuleList.vue` lisait `moduleStore.modules` et appelait `fetchModules()`, **ni l'un
ni l'autre n'existant** dans le store : `filteredModules` valait `undefined`, puis `.slice()` levait
un `TypeError`. Il est désormais routé (`/modules`) et présent dans la barre latérale.

Autres défauts : `AModuleList.vue` était une copie quasi identique de `ModuleList.vue` (148 lignes
contre 155) ; les 4 boutons d'export étaient des `console.log` + `// TODO` ; le bouton « + Ajouter »
ouvrait une modale `#exampleModal` **jamais montée** ; `DetailItem.vue` importait `getModuleById`,
**fonction absente** de `moduleApi.js` ; la vue déclarait **deux blocs `<style scoped>`**, dont un
redéfinissant `body` (sans effet en _scoped_).

> #### ⚠️ Le CRUD backend des modules était entièrement cassé
>
> Découvert en lisant `cfibackend/src/routes/academique/module.routes.js`, puis confirmé par curl :
>
> | Route              | État trouvé                                                                                                                                                                              |
> | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
> | `GET /modules`     | **404** — la route n'existait pas. Six modules en base, aucun moyen de les lire.                                                                                                         |
> | `POST /modules`    | **cassé** — SQL 42702 (`RETURNING id` ambigu dans `creer_module`). De plus, son `INSERT … SELECT … FROM enseignants` **n'insérait rien** quand le responsable était absent — en silence. |
> | `PUT /modules/:id` | **cassé** — écrivait `SET credits` et `SET responsable_code`, **colonnes inexistantes** (la table a `credit` et `responsable_id`). Et une MàJ partielle levait un `TypeError`.           |
> | `llm_summary`      | lisait `data.credits` → « crédité de **0** crédits » pour tous les modules.                                                                                                              |
>
> Réparé dans `cfibackend` (commit dédié) : ajout de `GET /modules`, `createModule` réécrit en
> `INSERT` clair — abandonnant la fonction Postgres cassée, et rendant le responsable **réellement**
> facultatif —, `updateModule` sur liste blanche de colonnes. **+3 tests**. Les 11 échecs de la suite
> backend préexistaient et sont inchangés.

#### Deux pièges d'API à connaître

**1. `POST /modules/assigner` répond `200 / success: true` même quand il échoue.** Le vrai verdict
est dans le corps, et il compte **trois** valeurs :

| `data.statut`   | Sens                                                   |
| --------------- | ------------------------------------------------------ |
| `SUCCES`        | l'affectation est créée                                |
| `AVERTISSEMENT` | elle existait déjà — **rien n'est inséré**             |
| `ERREUR`        | module, classe, semestre **ou enseignant** introuvable |

L'ancien store notifiait « Module assigné avec succès » dans les trois cas.
`readAssignationResult()` (`constants.js`) lit le corps.

**2. L'enseignant est obligatoire pour rattacher un module** — rien ne le laisse deviner : le
paramètre est accepté à `null` et la requête répond 200. Mais la fonction Postgres refuse
l'affectation sans matricule, et son message d'erreur, construit par concaténation SQL avec ce
paramètre nul, **remonte vide** (`message: null`). Le formulaire l'exige donc côté client.

Il est saisi au **matricule** plutôt que choisi dans une liste, car aucun endpoint ne permet de
lister les enseignants : voir §2.5, point 6.

### 1.7 Le module `scolarite` — terminé

```
src/modules/scolarite/
├── routes.js · api.js · store.js · constants.js
├── components/   AjoutPieceModal
│   └── tabs/     Profil · Parcours · SituationFinanciere · Pieces
└── views/        DossiersView.vue · DossierDetailView.vue
```

2 279 lignes (12 fichiers `parcours/` + `absence/`) → 1 594, et **tout est branché sur l'API** —
ce qui n'était le cas d'aucune ligne auparavant.

**Les douze fichiers étaient simulés, sans exception.** `DossierView` affichait trois étudiants
codés en dur avec des filtres alimentés par des tableaux littéraux ; `DossierAcademique` fabriquait
son étudiant après un `setTimeout(800)` — « _Faux délai_ », disait le commentaire ; les cinq
onglets servaient des `ref([...])`. `Parcours.vue` était orphelin.

| Onglet                     | Avant                             | Après                                                                             |
| -------------------------- | --------------------------------- | --------------------------------------------------------------------------------- |
| Profil                     | `ref({...})` en dur               | `GET /etudiants/:id/complet` — identité **et tuteurs**                            |
| Parcours académique        | `historique` en dur               | `GET /etudiants/:id/parcours` — l'endpoint existait, **aucune vue ne l'appelait** |
| Situation financière       | `paiements` + `echeancier` en dur | projeté depuis `GET /inscriptions/finances`                                       |
| Pièces justificatives      | `documents` en dur                | `pieces[]` + dépôt + validation / rejet                                           |
| ~~Assiduité & Discipline~~ | `absences` + `sanctions` en dur   | **retiré** — aucun backend (voir ci-dessous)                                      |

#### L'écran Absences a été supprimé

`AbscenceView.vue` (353 lignes) prétendait enregistrer une feuille d'émargement. En réalité :

```js
console.log('Données envoyées :', payload);
setTimeout(() => {
  alert("Fiche d'émargement enregistrée avec succès !");
}, 1000);
```

Un `console.log`, une seconde d'attente, et un message de succès — **sans rien envoyer**. Et pour
cause : **aucune route d'absence n'existe dans le backend**, dans aucun domaine. L'écran et son
onglet ont été retirés plutôt que d'entretenir l'illusion d'un suivi d'assiduité. Le besoin est
consigné en §2.5.

#### Les énumérations viennent des contraintes SQL

Aucun script de migration n'est versionné dans le dépôt backend : les valeurs autorisées ne vivent
que dans les contraintes `CHECK` de la base. Elles ont été relevées là, et non devinées :

| Champ                       | Valeurs                                                                      |
| --------------------------- | ---------------------------------------------------------------------------- |
| `dossiers.statut_dossier`   | `INCOMPLET`, `COMPLET`, `VERIFIE`, `REJETE`                                  |
| `pieces_dossier.statut`     | `EN_ATTENTE`, `VALIDE`, `REJETE`                                             |
| `pieces_dossier.type_piece` | `DIPLOME`, `ATTESTATION_REUSSITE`, `ACTE_NAISSANCE`, `RELEVE_NOTES`, `AUTRE` |
| `pieces_dossier.chemin`     | doit vérifier `^/uploads/.*\.(pdf\|jpg\|jpeg\|png)$`                         |

Cette dernière contrainte est portée par la **base**, pas par le contrôleur : un chemin mal formé
remonte donc en erreur SQL brute (« _new row violates check constraint_ »), illisible pour
l'utilisateur. Le formulaire valide en amont. Deux autres pièges : le dépôt d'une pièce **n'est pas
un envoi de fichier** (l'endpoint attend un _chemin_ vers un fichier déjà présent sur le serveur),
et le **rejet exige un motif** — 400 sans lui.

### 1.8 Le module `etudiants`, recâblé sur `GET /etudiants`

`GET /etudiants` **existe désormais** (commit backend `2a39cdd`), et renvoie l'identité complète :
`sexe`, `telephone`, `date_naissance`, `ville`, `filiere_nom`, `dossier_id`, `statut_dossier`.
Le contournement mis en place faute de mieux — projeter l'annuaire depuis `GET /inscriptions` — a
donc été retiré, et ce qu'il avait fallu abandonner est rétabli : **colonne Genre, filtre par sexe,
répartition Hommes/Femmes**.

Ce qui reste vrai :

- **ni `PUT` ni `DELETE /etudiants/:id`** (404) : toujours pas de modification ni de suppression.
  Le store échoue explicitement plutôt que d'émettre une requête vouée au 404 ;
- **pas de `GET /etudiants/:id`** non plus : le détail passe par `/:id/complet` ;
- `GET /etudiants` ne porte **ni classe ni année académique**. Un étudiant appartient à une
  _filière_ ; sa _classe_ est un fait d'**inscription**. L'onglet « Par classe » interroge donc les
  inscriptions — ce n'est pas un contournement, c'est le bon modèle.

La **fiche étudiant a été supprimée** : elle affichait la même chose que le dossier scolaire, en
moins riche. `/etudiants/:id` **redirige** vers `/dossiers-scolaires/:id`, ce qui ne casse aucun
lien.

### 1.9 Le module `examens` — terminé (et son backend réparé)

```
src/modules/examens/
├── routes.js · constants.js
├── components/   ExamenHeader.vue
├── session/      api.js · store.js · composables/ · components/ · views/PlanificationView
├── epreuve/      api.js · store.js · composables/ · components/ · views/PlanExamenView
├── salle/        api.js · store.js · composables/ · components/ · views/SallesView
├── bulletin/     api.js · store.js · views/RapportsView
└── calendrier/   components/ · views/CalendrierView
```

4 201 lignes → 2 965. **Le design a été préservé** : les templates, la mise en page et les
composants visuels sont ceux de l'original. Ce qui change, c'est ce qu'il y a dessous.

| Écran                   | Avant                                                                                                                                 | Après                                                          |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Planification           | **réel** (seul du module)                                                                                                             | + édition d'une session, + changement d'état                   |
| Épreuves (`PlanExamen`) | **593 lignes, tout simulé** : session, filières, classes, modules codés en dur ; les épreuves composées n'étaient envoyées nulle part | `GET/POST/PUT/DELETE /evaluation`                              |
| Calendrier              | 7 fichiers simulés ; l'onglet « Rattrapage » rendait **rien** (`CalendrierRappel.vue` était vide)                                     | épreuves réelles, triées sur `date_prevue`                     |
| Salles                  | « 5 salles de 20 places » **inventées** ; la table `salles` existait sans qu'aucune route ne l'expose                                 | vraies salles, chacune avec **sa** capacité                    |
| Rapports                | affichait des **formateurs** codés en dur dans un « rapport d'examens », après un `setTimeout(3000)`                                  | palmarès d'une classe (`GET /resultats/classes/:id/bulletins`) |

> #### ⚠️ Le CRUD des épreuves n'avait jamais fonctionné
>
> `evaluation.controller.js` appelait **cinq méthodes absentes de son modèle** :
>
> | Le contrôleur appelait         | Le modèle expose               | Conséquence                                                                            |
> | ------------------------------ | ------------------------------ | -------------------------------------------------------------------------------------- |
> | `createEvaluation`             | `create`                       | **`POST` échouait toujours**                                                           |
> | `getEvaluationById`            | `findById`                     | **`GET /:id` échouait toujours**                                                       |
> | `updateEvaluation`             | `update`                       | **`PUT` échouait toujours**                                                            |
> | `deleteEvaluation`             | `delete`                       | **`DELETE` échouait toujours**                                                         |
> | `findAll(anneeId, semestreId)` | `findAll(sessionId, moduleId)` | les filtres **mentaient** : un `?anneeId=…` était lu comme un identifiant de _session_ |
>
> Quatre routes sur cinq levaient un `TypeError`, masqué en 500 générique. Seul `GET /evaluation`
> répondait — en filtrant sur autre chose que ce qu'il annonçait.
>
> #### Deux autres bugs backend
>
> - **La route de changement d'état des sessions était doublée.** Déclarée
>   `router.patch('/sessions-evaluations/:id/etat')` dans un routeur _déjà_ monté sur
>   `/sessions-evaluations`, elle vivait en réalité à
>   `/evaluations/sessions-evaluations/sessions-evaluations/:id/etat`. Le frontend appelait la
>   version simple et recevait un **404** : le changement d'état n'a jamais pu aboutir.
> - **La table `salles` n'était exposée par aucune route.** Seul `pedagogie/schedule.controller.js`
>   la lisait, et `/pedagogie` est désactivé. D'où l'écran qui inventait ses salles. CRUD ajouté
>   (`/api/academique/salles`), **+8 tests**.
>
> Les 11 échecs de la suite backend préexistaient et sont inchangés (73 passent, +8).

#### Les énumérations viennent des contraintes SQL

| Champ                     | Valeurs                              |
| ------------------------- | ------------------------------------ |
| `evaluations.type_eval`   | `CC`, `TP`, `EXAMEN`, `PROJET`       |
| `evaluations.ponderation` | `> 0` et `<= 100`                    |
| `sessions.etat`           | `INACTIVE`, `ACTIVE`, `ARCHIVE`      |
| `salles.type`             | `Amphi`, `Cours`, `TD`, `TP`, `Labo` |

L'ancien `PlanExamen.vue` proposait `CC`, **`NORMAL`** et **`RATTRAPAGE`** comme types d'épreuve :
les deux derniers sont des types de _session_, et les enregistrer aurait violé la contrainte. Le
formulaire de session offrait de son côté un état **« Brouillon »**, qui n'a jamais existé.

#### Autres défauts corrigés

- Les deux `HeaderView.vue` (calendrier et salles) étaient **deux copies du même fichier**, et
  toutes deux appelaient `fetchCalendarEvents()` — **jamais définie, jamais importée**. Cliquer
  « Actualiser » levait un `ReferenceError` sur les deux écrans.
- `ExamenList` : `@edit` visait `#editExamModal`, **une modale inexistante**, et se contentait d'un
  `fetchSessionById()` sans rien afficher. `exam.etat.toLowerCase()` était appelé sans garde : un
  état nul faisait planter le rendu de la ligne.
- `AddSession` fermait sa modale **même en cas d'échec** (l'ancien store avalait ses erreurs, donc
  l'`await` réussissait toujours).
- `Examens.vue` empilait la planification et le calendrier dans une page dotée d'un « + Ajouter »
  visant `#exampleModal` — **inexistante**. La route redirige désormais vers la planification.

### 1.10 Le module `concours` — terminé

```
src/modules/concours/
├── routes.js · constants.js
├── concours/   api.js · store.js · composables/ · components/ · views/
├── epreuve/    api.js · store.js · components/TabEpreuves
└── candidat/   api.js · store.js · components/{TabCandidats, TabNotes}
```

5 198 lignes → 3 146. **Le design est préservé.** C'est le module **le plus sain** rencontré
jusqu'ici : la plupart de ses écrans étaient réellement branchés. Mais ce qui était cassé l'était
profondément.

> #### ⚠️ Deux routes inatteignables depuis toujours
>
> L'ancien `gestionApi.js` appelait :
>
> ```js
> updateEpreuve → gestionService.put(`/gestions/concours/epreuves/${id}`)     // ← « /gestions/ » en trop
> deleteEpreuve → gestionService.delete(`/gestions/concours/epreuves/${id}`)  // ← idem
> ```
>
> Le client est **déjà** monté sur `/gestion` : l'URL réelle devenait
> `/api/gestion/gestions/concours/epreuves/:id` — **404**. **Modifier ou supprimer une épreuve de
> concours n'a jamais fonctionné.** Les trois autres routes d'épreuve avaient, elles, le bon chemin.

#### Les boutons morts

| Bouton                    | Ce qu'il faisait vraiment                                                                                                                                                                 |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| « Modifier » un concours  | `console.log('Modifier :', item)` — et son `editModalTarget` visait `#editModuleModal`, **inexistante**                                                                                   |
| Changer le statut         | appelait `concoursStore.updateConcoursStatus(...)` — l'action s'appelle **`changeStatut`** → `TypeError` au clic                                                                          |
| « Supprimer » un candidat | retirait la ligne du **tableau local** et annonçait « Candidat masqué de la liste locale ». Elle revenait au rechargement — **il n'existe aucun `DELETE /candidats/:id`**. Bouton retiré. |
| Import de candidats       | `POST /candidats/import` → **404** : la route était **commentée** côté backend, alors que son contrôleur était implémenté. Rétablie.                                                      |

#### Les écrans simulés

- **`TabDeliberation`** cumulait trois défauts : `Number(route.params.id)` sur un **UUID** (donc
  `NaN`) ; trois candidats codés en dur ; et un test `statut === 'PROCLAMÉ'`, **un statut qui
  n'existe pas** (`PLANIFIE`, `OUVERT`, `CLOTURE`, `ANNULE`) — la condition était toujours fausse.
  Or `GET /concours/:id/classement` renvoie les vraies moyennes et les vrais rangs : la simulation
  au seuil se calcule dessus, sans endpoint supplémentaire.
- **`RapportConcours`** affichait des **formateurs** codés en dur après un `setTimeout(3000)` —
  **le même copier-coller que `RapportExamens`**. Ni l'un ni l'autre n'avait de rapport avec des
  résultats.
- **`ConcoursTab`** déclarait **trois onglets pour quatre panneaux**, et le quatrième rendait
  `<StatistiquesContent />` — **un composant jamais importé**.
- L'onglet **Historique** a été retiré : `logs = ref([])`, table `historique_concours` **vide**, et
  **aucune route ne l'expose**.

#### Trois bugs backend corrigés

- **`GET /concours/:id/moyennes-rangs` répondait 404 « Impossible de calculer »… alors que le calcul
  réussissait.** La fonction Postgres `calculer_moyennes_et_rangs` est déclarée `RETURNS void` : le
  modèle en tirait `undefined`, que le contrôleur prenait pour un échec. Un `void` n'est pas une
  erreur. Elle renvoie désormais le classement à jour.
- **`POST /candidats/import` était commenté**, son contrôleur ne l'était pas. Route rétablie.
- **`POST /candidats/import/notes` était déclarée deux fois** — la seconde sans son `multer`, donc
  morte.

#### Les énumérations viennent des contraintes SQL

| Champ                              | Valeurs                                                                                   |
| ---------------------------------- | ----------------------------------------------------------------------------------------- |
| `concours.statut`                  | `PLANIFIE`, `OUVERT`, `CLOTURE`, `ANNULE`                                                 |
| `concours.type_concours`           | FK vers `types_concours` — **7 types**, le formulaire n'en proposait que **4**            |
| `epreuves_concours.type_epreuve`   | `ECRIT`, `ORAL`, `PRATIQUE` — le formulaire envoyait `écrit` en **minuscules accentuées** |
| `candidats.sexe` / `email` / `tel` | `M`/`F`, plus deux expressions régulières                                                 |

Éditer le « Concours Ingénieur 2025 » — de type `CONCOURS_INGE` — lui aurait fait **perdre son
type**, celui-ci n'étant pas dans la liste proposée.

### 1.11 Le module `notes` et la délibération — terminé

```
src/modules/notes/
├── routes.js · constants.js
├── note/          api.js · store.js · views/NotesView
└── deliberation/  views/DeliberationView
```

3 018 lignes → 754. **Le design est préservé.** C'est le module qui **n'avait jamais rien
envoyé au serveur** : rien, nulle part.

> #### ⚠️ Les quatre routes de notes répondaient 404 — depuis toujours
>
> `api/evaluations/notesApi.js` appelait :
>
> ```js
> getNotesByEvaluation → evaluationService.get(`/evaluations/${id}/notes`)   // ← il manque « /notes »
> ```
>
> Le client est monté sur `/api/evaluations` ; les routes de notes sont montées **sous
> `/notes`** (`router.use('/notes', noteRoutes)`). Le vrai chemin est donc
> `/api/evaluations/**notes**/evaluations/:id/notes`. **Les quatre appels — lecture par
> évaluation, lecture par étudiant, modification, publication — étaient inatteignables.**
> Corrigé côté **frontend** (`note/api.js`) : le segment doublé est laid, mais c'est ce que le
> serveur expose, et il fonctionne. Aucune modification backend.

#### L'écran de saisie n'enregistrait rien, et son modèle de données était faux

`Notes.vue` servait **quatre étudiants codés en dur** (« Ndiaye Fatou », « Camara Ibrahima »…) et
trois matières inventées. Son bouton « Valider le PV » :

```js
const saveAllNotes = () => {
  alert(`Validation du PV pour la classe […]`);
};
```

Un `alert()`. Et l'URL — `/notes/:classeId/:semestre/:type/edit` — supposait qu'une note appartienne
au triplet (classe, semestre, type d'évaluation). **Ce n'est pas le modèle du serveur** : une note
appartient au couple **(étudiant, évaluation)** — une _épreuve_ précise d'une _session_. La route a
été supprimée ; l'écran suit désormais la cascade **session → épreuve → grille**, qui est la réalité.
Il n'existe par ailleurs **pas de `POST /notes`** : les notes préexistent, l'écran les corrige.

#### Les quatre écrans de délibération étaient simulés, sans exception

`DeliberationsContent`, `ProclamationContent`, `RapportContents` et `AssistantIAContent` servaient
tous des `ref([...])` codés en dur — jusqu'à `mockClasses = ref(['Master 1 Info', …])`.
`RapportsTab.vue` et `semestre2/{devoir,rappel,session}-s2.vue` étaient **vides**
(`<template></template>`) : leurs onglets ne rendaient rien. L'onglet « Assistant IA » — une
conversation aux messages codés en dur — a été retiré : **aucun backend ne l'alimente**.

Or les quatre routes de résultats existaient depuis toujours, ainsi que leur store
(`resultStore.js`) : **aucune vue ne les appelait**.

> #### ⚠️ Un bulletin appartient au triplet (classe, semestre, année) — correction dans `examens`
>
> `GET /resultats/classes/:id/bulletins` **exige** `semestreId` **et** `anneeId` en query, et la
> publication les exige **dans le corps**. Le module `examens` (§1.9) ne passait que la classe :
> `RapportsView` prenait donc un **`400` à chaque requête**. Le store lisait de surcroît
> `bulletin.moyenne` et `bulletin.publie` — colonnes qui **n'existent pas** (`moyenne_generale`,
> `statut_publication`, `rang_etudiant`). Corrigé : `bulletin/api.js`, `bulletin/store.js`
> (contexte `{classeId, semestreId, anneeId}`), et un sélecteur partagé `BulletinContexte.vue`
> qu'utilisent les deux écrans. Vérifié de bout en bout contre `localhost:3500` (lecture,
> décision du jury, publication), base restaurée.

**La délibération réutilise le store des bulletins d'`examens`** plutôt que de le dupliquer :
la dépendance `notes → examens` est dirigée, et déclarée. C'est aussi pourquoi les constantes du
bulletin (décision, mention, publication) vivent dans `examens/bulletin/constants.js` : les mettre
dans `notes` aurait refermé le cycle.

#### Les énumérations viennent des contraintes SQL

| Champ                                      | Valeurs                                                    |
| ------------------------------------------ | ---------------------------------------------------------- |
| `notes.statut`                             | `SAISIE`, `VALIDEE`, `PUBLIEE`                             |
| `notes.valeur`                             | `CHECK (valeur >= 0 AND valeur <= 20)` — 400 sinon         |
| `bulletins_semestriels.decision`           | `EN_ATTENTE`, `VALIDE`, `AJOURNE`, `RATTRAPAGE`            |
| `bulletins_semestriels.mention`            | `PASSABLE`, `ASSEZ_BIEN`, `BIEN`, `TRES_BIEN`, `EXCELLENT` |
| `bulletins_semestriels.statut_publication` | `BROUILLON`, `PUBLIE`, `VERROUILLE`                        |

### 1.12 Le bug `AppTabs` — les onglets n'affichaient plus rien

Signalé en cours de chantier, et il touchait **tous les modules migrés** : cliquer sur un onglet
ne rendait pas son contenu, et la console crachait

```
TypeError: parentComponent.ctx.deactivate is not a function
    at unmount → patch → sharedContext.activate
```

Deux défauts cumulés dans `shared/components/AppTabs.vue`, tous deux corrigés :

**1. Les définitions de composants transitaient par un proxy réactif.** Dès qu'une vue construit sa
liste d'onglets dans un `computed` — ce que fait toute vue de détail — Vue enveloppe les composants
qu'elle contient et proteste :

> _[Vue warn] Vue received a Component that was made a reactive object […] should be avoided by
> marking the component with `markRaw`._

Ce n'est pas qu'un avertissement de performance : le composant proxifié casse le cache de
`KeepAlive`. `AppTabs` applique désormais `toRaw` + `markRaw` **lui-même**, si bien qu'aucun
appelant n'a à y penser.

**2. Le `v-if` était posé sur le `<component>` _à l'intérieur_ du `KeepAlive`.** Condition fausse →
`KeepAlive` reçoit un vnode _Comment_ en enfant → son `activate` appelle
`parentComponent.ctx.deactivate()` sur un parent qui n'est pas lui. D'où le `TypeError`. La
condition porte maintenant sur le `KeepAlive` lui-même.

**7 tests** figent le contrat (`AppTabs.test.js`) : rendu initial, bascule au clic, transmission des
props, `defaultTab`, onglet à plusieurs nœuds racines, liste d'onglets en `computed`, et **absence
de tout avertissement Vue**. Le troisième et le sixième échouaient avant le correctif.

**Leçon** : lint, tests et build étaient au vert pendant que **tous les onglets de l'application
étaient cassés**. Aucun des trois ne monte un composant. Un test de montage sur un composant
partagé aussi central aurait dû exister dès le départ.

### 1.13 L'optimisation d'API principale

Les conteneurs d'onglets Bootstrap (`data-bs-toggle="tab"`) **montent tous les panneaux d'un
coup** et se contentent d'en masquer certains en CSS. Chaque onglet exécutait donc son
`onMounted` — et ses requêtes — au chargement de la page, même sans être ouvert. Une page à
5 onglets déclenchait **5 séries d'appels pour n'en afficher qu'une**.

`AppTabs` ne monte que l'onglet actif, et `KeepAlive` évite de recharger ceux déjà visités.
**C'est le gain le plus important à propager sur les 23 conteneurs restants.**

### 1.14 Bugs corrigés (tous étaient en production)

**Authentification — la connexion ne pouvait pas aboutir**

1. Le backend enveloppe sa charge utile dans `data` (`{ success, data: { token, user } }`) ; `authStore` lisait `response.token`, un cran trop haut → le login **échouait même sur un 200 valide**.
2. Le formulaire envoyait `email`, alors que `POST /api/auth/login` recherche l'utilisateur **uniquement par `username`** (vérifié contre le backend) → « Identifiants incorrects » systématique.
3. Le rôle arrive en majuscules (`"ADMIN"`), les getters comparaient à `'admin'` → `isAdmin` **toujours faux**, y compris pour un administrateur.
4. `logoutUser` appelait `$reset()` **avant** `clearToken()` ; `$reset()` réexécute `state()`, qui relit le jeton → le jeton **ressuscitait**.
5. `signupUser` appelait `notifyError()` sans l'avoir déclaré → `ReferenceError`.
6. `fetchCurrentUser` appelait `useRouter()` dans une action Pinia (hors `setup()`) → `undefined`, la redirection plantait **précisément à l'expiration du jeton**.

**Sécurité** 7. **Aucun `router.beforeEach`** malgré les `meta.requiresAuth` : toute URL interne s'ouvrait sans session. 8. **XSS** dans l'onglet Organisation des semestres : donnée backend réinjectée dans un `v-html` sans échappement. La regex de recherche était aussi construite depuis la saisie sans échapper → chercher `(` cassait le filtre. 9. Le cache local n'était pas purgé à la déconnexion : données lisibles par l'utilisateur suivant.

**Le bug le plus répandu — 4 occurrences : les boutons ne faisaient rien**

| Écran     | Défaut                                              |
| --------- | --------------------------------------------------- |
| Cycles    | `@edit="editCycle"` → fonction **jamais définie**   |
| Filières  | `editFiliere` → `console.log`                       |
| Classes   | `editClasse` **et** `confirmDelete` → `console.log` |
| Semestres | `editSemestre` → `console.log`                      |

→ On ne pouvait **modifier ni cycle, ni filière, ni classe, ni semestre**, ni supprimer une classe.

**Autres** 10. Édition d'une année : la modale lisait `anneeToEdit` du header, la liste écrivait dans sa propre variable → **le formulaire ne se pré-remplissait jamais**. 11. Les modales annonçaient « créé avec succès » puis se fermaient après un `setTimeout`, **sans vérifier le résultat** de l'appel. 12. `serviceApi.post(url, data)` ignorait silencieusement le 3ᵉ argument de config → les en-têtes `multipart/form-data` des 4 endpoints d'import n'étaient jamais transmis. 13. `handleApiError()` défini mais **jamais appelé** → `errorStore` toujours vide. 14. Filtrer les niveaux par cycle appelait `niveauStore.getNiveauByCycle()`, **action inexistante** → `TypeError`. 15. Formulaire cycle : `est_actif` vs `statut` incohérents → la case « actif » se désynchronisait dès la première édition. 16. `messageStore.addMessage()` / `.error()` appelés sur `useNotifier()`, qui n'expose ni l'un ni l'autre → `TypeError`. 17. `v-if` + `v-for` sur le même élément → le `v-else` associé était **structurellement inatteignable**.

**Étudiants** (voir §1.4 pour le détail) 18. Le store n'exposait **ni `items` ni `fetchAll`** : aucun écran ne _pouvait_ charger de liste. D'où les tableaux codés en dur dans 4 onglets sur 6, plus la vue racine. 19. `fetchEtudiantsByClasseFiliereAnnee` et `filteredEtudiants` étaient consommés par l'onglet « Classes » mais **n'existaient pas** dans le store → `TypeError` au premier filtre. 20. `XLSX.utils.json_to_sheet` appelé **sans importer `XLSX`** → l'export Excel plantait au clic. 21. La fiche détail déclarait 4 onglets pour 2 panneaux ; deux d'entre eux pointaient sur un `#sales2` **inexistant** et trois `<li>` partageaient le même `id`. 22. La fiche détail affectait `etudiant.value = response` sans déballer `{ success, data }` → tous ses champs étaient `undefined`. 23. Ses `v-if` portaient sur les **mauvais champs** : le lieu de naissance était conditionné à `lieunaissance` (inexistant), le sexe à `genre`, l'adresse au _téléphone_. 24. `ajouterAuGroupe(e, g.id)` était appelé avec deux arguments mais n'en déclarait qu'un → « Assigner » affectait **le premier étudiant de la liste**, pas celui sur lequel on cliquait. 25. « Générer un rapport » : un `setTimeout(1800)` puis « Rapport généré et téléchargé avec succès » — **aucun appel API, aucun fichier**. 26. Le panneau d'onglet « Import » n'avait **aucun lien de navigation** : monté à chaque chargement, et inatteignable. Son composant était de toute façon vide, et le `DropData.vue` de secours n'avait aucun gestionnaire sur son bouton « Upload ». 27. La photo de la fiche détail était servie depuis `http://localhost:3500` **codé en dur**.

### 1.15 Code mort et duplication supprimés

- `routes/main.js` (copie **octet pour octet** de `routes/index.js`), `style1.css` (**520 Ko** jamais référencé), 5 fichiers `sample*.vue`, `result.js` → **25 493 lignes**.
- Le **même tableau de niveaux existait en 3 exemplaires** (filières, classes, semestres) et celui des filières en 2 → **776 lignes**.
- Les helpers `setCache`/`getCache` étaient copiés **à l'identique dans 9 stores**.
- `ItemActions` existait en **8 exemplaires divergents** (84 à 620 lignes), certains émettant l'objet, d'autres l'`id`.

---

## 2. Ce qui reste

### 2.1 Modules à migrer (par ordre conseillé)

**Migrés** : `structure-academique`, `etudiants`, `inscriptions`, `matieres`, `scolarite`, `examens`,
`concours`, `notes` + `deliberation`.

| #   | Module                                 | Fichiers | Lignes | Pourquoi cet ordre                                                                                            |
| --- | -------------------------------------- | -------- | ------ | ------------------------------------------------------------------------------------------------------------- |
| 1   | **pedagogies**                         | 34       | 8 040  | Le plus gros. 4 conteneurs d'onglets (dont deux à 6 onglets). ⚠️ **`/pedagogie` est commenté** côté backend.  |
| 2   | **finances**                           | 24       | 4 382  | 3 conteneurs d'onglets. ⚠️ **`/finance` est commenté** côté backend.                                          |
| 3   | **dashboard**, **parcours**, **stats** | 29       | 4 126  | Surtout de l'affichage. ⚠️ **`/statistiques` est commenté** côté backend.                                     |
| 4   | Résidus                                | ~12      | ~1 500 | `admin`, `schedule`, `absence`, `prompt`, `docf`, `support`, `settings`, `notifications`, `structure` (vide). |

> ⚠️ **Les trois prochains modules sont bloqués par le backend.** `/pedagogie`, `/finance` et
> `/statistiques` sont **commentés** dans `src/routes/index.routes.js` : leurs routes ne sont pas
> montées, tout appel répond 404. Il faut trancher module par module — les rétablir (et vérifier
> leurs contrôleurs, comme pour `matieres` et `concours`) ou migrer sans eux.

### 2.2 Dette technique transverse

- **14 conteneurs d'onglets Bootstrap** encore en montage eager → à passer sur `AppTabs`. C'est le principal gisement d'optimisation d'API restant. Liste : `grep -rl 'data-bs-toggle="tab"' src/views --include=*.vue`
- **13 stores legacy** dans `src/stores/` → à réécrire avec `createCrudStore`.
- **12 fichiers d'API legacy** dans `src/api/` → à répartir dans les modules.
- **31 fichiers** portent encore le bloc `<style scoped>` copié-collé (`.drag-drop-area`, `body {}`, `.card`) — dont 34 avec `body {}` **dans un style scoped, donc sans aucun effet**.

### 2.3 Bugs connus, non corrigés (hors périmètre migré)

Détail complet dans **`docs/DETTE-TECHNIQUE.md`**. Les bloquants :

| Fichier                                                 | Bug                                                          |
| ------------------------------------------------------- | ------------------------------------------------------------ |
| `views/admin/DataTable.vue:40`                          | **Erreur de syntaxe** — le fichier ne parse pas.             |
| `views/examens/calendrier/components/HeaderView.vue:42` | `fetchCalendarEvents` **jamais définie** → plantage au clic. |
| `views/examens/salles/components/HeaderView.vue:40`     | Idem.                                                        |
| 9 composants                                            | `<template>` sans élément racine → **ne rendent rien**.      |

_(Les deux entrées `views/etudiants/.../ExportData.vue` ont disparu avec la migration du module.)_

### 2.4 Ponts de compatibilité à retirer en fin de migration

Chacun disparaît avec son dernier appelant.

| Élément                                                                                                                                                    | Remplacé par                               |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| `src/api/config/serviceApi.js`, `axiosClient.js`, `apiClients.js`                                                                                          | `core/api/httpClient` + `core/api/clients` |
| `src/stores/messages/*` (5 fichiers)                                                                                                                       | `shared/stores/notificationStore`          |
| `src/utils/{exportExcel,exportPDF,toast}.js`                                                                                                               | ré-exports vers `shared/utils/*`           |
| Alias `@deprecated` dans les 6 stores de `structure-academique` (`items`↔`cycles`/`filieres`/`niveaux`/`classes`/`semestres`, `fetchAll()`↔`fetchXxx()`) | noms canoniques                            |

_(Les vues `etudiants/`, `inscriptions/`, `examens/` et `notes/` ont été migrées et n'utilisent plus
que les noms canoniques. Les alias `@deprecated` n'ont donc plus, à ce stade, d'appelant connu :
à supprimer au prochain passage.)_

### 2.5 Questions ouvertes pour le backend

**1. Deux vocabulaires de statut** pour les années académiques :

- `/annees`, `/annees/{id}` → `OUVERTE` | `PLANIFIEE` | `CLOTUREE`
- `/annees/history` → `active` | `en_preparation` | `terminee` | `archivee`

Le frontend absorbe l'écart dans `structure-academique/annee/constants.js`, mais l'harmonisation
gagnerait à se faire côté backend.

**2. Le modèle `etudiant` mélange deux entités.** `GET /etudiants/{id}` renvoie, à côté des champs
d'identité, des champs manifestement empruntés à une fiche d'agent — `grade`, `fonction`,
`unite_service`, `departement`, `specialisation`, `diplome` — ainsi que des doublons : `sexe` **et**
`genre`, `lieu_naissance` **et** `lieunaissance`. La fiche migrée n'affiche que les champs
étudiants sans ambiguïté ; les autres restent à trancher côté backend.

**3. Il manque une ressource REST `/etudiants`.** Le backend n'expose ni liste, ni détail, ni
`PUT`, ni `DELETE` (voir l'encadré du §1.4). L'application s'en accommode — l'annuaire est projeté
depuis `GET /inscriptions` — mais au prix de trois renoncements : on ne peut **ni modifier ni
supprimer** un étudiant, et l'état civil saisi à la création (sexe, naissance, adresse, téléphone)
**n'est jamais relu**, aucun endpoint ne le renvoyant. Quatre routes à ajouter côté backend
lèveraient les trois d'un coup : `GET /etudiants`, `GET /etudiants/:id`, `PUT`, `DELETE`.

**4. Deux vocabulaires de statut** pour les inscriptions, et l'un **traduit** l'autre :
`GET /inscriptions` renvoie `REJETEE` là où `GET /inscriptions/finances` renvoie `"annulée"`.
Le frontend absorbe l'écart dans `inscriptions/constants.js` (alias `ANNULEE → REJETEE`, testé),
mais c'est un piège : sans l'alias, un dossier rejeté s'affiche « Inconnu ».

**5. Trois domaines backend sont désactivés.** Dans `cfibackend/src/routes/index.routes.js`, ces
lignes sont **commentées** :

```js
// router.use('/pedagogie', pedagogieRoutes);
// router.use('/statistiques', StatistiqueRoutes);
// router.use('/finance', financeRoutes);
```

Conséquence directe : **aucun endpoint n'expose les enseignants**, alors qu'ils sont obligatoires
pour rattacher un module à une classe (§1.6). Et trois modules à migrer — `pedagogies`, `finances`,
`stats` — n'ont aujourd'hui **aucun backend joignable**. À rétablir (ou à confirmer comme
volontaire) avant de les entreprendre.

**6. La fonction Postgres `assigner_module_a_classe` a deux défauts** (elle n'est dans aucun script
de migration versionné, seulement en base) : l'enseignant y est **obligatoire** alors que rien ne
l'annonce, et son message d'erreur est construit par concaténation SQL avec le paramètre — qui,
étant `NULL`, rend **tout le message `NULL`**. L'échec remonte donc sans explication. Le frontend
compense, mais la fonction gagnerait à être corrigée.

**7. Il n'existe aucun backend d'absences.** Rien, dans aucun domaine, ne parle d'absence,
d'assiduité ou de feuille d'émargement. L'écran `/absences` et l'onglet « Assiduité & Discipline »
du dossier scolaire ont donc été **retirés** (§1.7) : ils affichaient « Fiche enregistrée avec
succès » sans rien envoyer. À rétablir le jour où le serveur expose la ressource — le besoin est
réel (feuille d'appel par classe / date / créneau, historique par étudiant).

**8. Aucun endpoint n'expose `types_concours` ni `historique_concours`.** Le premier est une table
de référence (7 types) dont dépend `concours.type_concours` par clé étrangère : faute de route, la
liste est **figée dans le frontend** (`concours/constants.js`) et se désynchronisera dès qu'un type
sera ajouté. Le second est vide et n'est écrit par rien — l'onglet Historique a été retiré (§1.10).

**9. Quatre routes de concours exigent le rôle `ADMIN`** (`PUT /concours/:id`,
`PATCH /:id/statut`, `DELETE /:id`, `DELETE /concours/epreuves/:id`), alors que toutes les autres
ont leur `verifierRole` commenté. L'incohérence est peut-être volontaire, mais elle mérite d'être
confirmée : un utilisateur `SCOLARITE` peut créer un concours mais pas le modifier.

**10. Deux endpoints pour l'import de réinscriptions** — `POST /inscriptions/import-reinscription`
(champ `fichier`) et `POST /academique/imports/reinscriptions` (champ `file`). Le frontend retient
le premier. Les conventions de nom de champ divergent aussi entre les imports (`fichier` pour les
inscriptions, `file` pour les étudiants) : à harmoniser.

**11. Les routes de notes sont montées sous un segment doublé.**
`router.use('/notes', noteRoutes)` alors que `note.routes.js` déclare lui-même
`/evaluations/:id/notes` et `/notes/:id` : le chemin réel est
`/api/evaluations/**notes**/evaluations/:id/notes`, et modifier une note passe par
`/api/evaluations/notes/**notes**/:id`. C'est fonctionnel — le frontend s'y conforme (§1.11) — mais
c'est précisément ce qui a fait échouer l'ancien `notesApi.js` (404 sur les quatre routes).
À simplifier si l'occasion se présente ; ce serait une rupture de contrat.

**12. `PUT /notes/:id` ne remet pas le statut à `SAISIE`.** Une note **publiée** peut être corrigée
en silence : elle reste `PUBLIEE`, avec une valeur différente de celle que l'étudiant a vue. Vérifié
en base. Soit la modification d'une note publiée doit être refusée, soit elle doit repasser la note
en `SAISIE` (et forcer une nouvelle publication). À trancher — c'est une décision métier.

**13. Aucun endpoint ne génère les bulletins.** `bulletins_semestriels` est **vide**, et les quatre
routes de résultats ne font que lire, décider et publier. Il manque le calcul — l'équivalent du
`calculer_moyennes_et_rangs` des concours, mais pour les bulletins semestriels. Tant qu'il n'existe
pas, l'écran de délibération restera vide en production, quoique parfaitement fonctionnel (vérifié
avec un bulletin inséré à la main, puis retiré).

### 2.6 Vérifier avant de coder — la leçon des modules `etudiants` et `matieres`

Le module `etudiants` a d'abord été livré **entièrement cassé** : bâti sur `GET /etudiants`, `PUT`
et `DELETE`, qui **n'existent pas** (404). Lint, tests et build étaient pourtant au vert — aucun
d'eux ne parle au backend.

`matieres` a confirmé la leçon : `GET /modules` manquait, `POST` et `PUT` étaient cassés, et
`POST /assigner` **répond 200 en cas d'échec**. Rien de tout cela n'est visible depuis le frontend.
Un code HTTP 200 ne veut pas dire que l'opération a réussi : **lire le corps**.

Le backend est dans `~/cfiprojects/cfibackend`. **Lire ses routes est plus fiable que n'importe
quelle documentation** (celle de `09-api-et-integration-backend.md` a été reconstituée _depuis le
frontend_ : elle décrit ce que le front appelle, pas ce que le serveur offre).

```bash
# Ce que le serveur expose réellement
cat ~/cfiprojects/cfibackend/src/routes/academique/<entité>.routes.js

# Et le vérifier en marche (404 = la route n'existe pas ; 400 = elle existe)
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3500/api/academique/<chemin>
```

---

## 3. Comment reprendre

0. **Ouvrir les routes du backend** (`~/cfiprojects/cfibackend/src/routes/`) et lister ce qui
   existe vraiment pour l'entité visée. Ne pas se fier à `09-api-et-integration-backend.md`, qui a
   été reconstitué depuis le frontend. Voir §2.6 — cette étape a coûté un module entier.
1. Lire **`docs/ARCHITECTURE.md`** (structure et règle de dépendance), puis
   **`docs/GUIDE-MODULE.md`** (recette pas à pas).
2. Ouvrir `src/modules/structure-academique/cycle/` comme **modèle de référence** : c'est le
   sous-domaine le plus représentatif (CRUD + onglets + modale + export). Pour un module qui filtre
   ses listes, `src/modules/etudiants/` montre le couple `fetchAll({ params })` + composable de
   filtres partagé ; pour les imports de fichiers, `src/modules/inscriptions/` montre
   `useImportFile` + `ImportModal` piloté par un schéma.
3. Appliquer la recette au module suivant (`notes` + `deliberation`).
4. Vérifier : `npm run lint && npm test && npm run build`, **puis exercer les endpoints réellement
   appelés** contre `localhost:3500` (§2.6).

### Recette, en bref

```
1. mkdir src/modules/<module>/{components/tabs,composables,views}
2. api.js       → createResource() pour le CRUD, + les endpoints spécifiques à la main
3. store.js     → createCrudStore({ id, resource, label, cacheKey, state, actions })
4. git mv les composants (préserve le balisage), puis réécrire les <script setup>
5. Remplacer les onglets Bootstrap par AppTabs        ← le gain API
6. Remplacer les ItemActions locaux par le partagé
7. Remplacer les blocs d'export par useTableExport + ExportMenu
8. Un composable use<X>Form pour la modale            ← corrige les boutons morts
9. routes.js → brancher dans core/router/index.js, retirer de src/routes/
10. Supprimer les anciens fichiers, recâbler les imports (grep -rn "ancien/chemin" src/)
11. npm run lint && npm test && npm run build
```

### Pièges rencontrés, à surveiller

- **Ne jamais croire un écran qui affiche des données.** Dans `etudiants`, quatre onglets sur six
  paraissaient fonctionner : ils servaient des tableaux codés en dur, parfois derrière un
  `setTimeout` imitant une latence réseau. Avant de migrer un écran, chercher
  `grep -n "setTimeout\|ref(\[" ` dans ses composants et vérifier que le store expose bien une
  action de lecture. Le premier réflexe est de croire que « ça marche déjà » ; c'est faux plus
  souvent qu'on ne le pense.
- Un `@edit` câblé sur une fonction inexistante ou un `console.log` — **c'est arrivé 4 fois**. Vérifier systématiquement que chaque handler fait vraiment quelque chose.
- Une action de store appelée par une vue mais **jamais définie** — `fetchEtudiantsByClasseFiliereAnnee`, `getNiveauByCycle`, `removeInscription`, `fetchCandidatsReinscription`, `bulkImportReinscriptions`. **C'est le bug le plus fréquent du dépôt.** Il passe souvent inaperçu derrière un garde `if (typeof store.x === 'function')`, qui transforme l'absence en silence. Lire la vue _et_ le store, jamais l'un sans l'autre.
- Un endpoint que le frontend appelle mais que **le serveur n'expose pas** : `GET /etudiants` et ses variantes. Rien dans la chaîne lint/test/build ne le détecte. Voir §2.6.
- Deux endpoints d'un même domaine qui **ne parlent pas le même dialecte** : `REJETEE` d'un côté, `"annulée"` de l'autre. Croiser les réponses sur les mêmes identifiants avant de croire à une simple différence de casse.
- Un `<script setup>` ne peut pas contenir la chaîne `</` suivie de `script>`, même dans un commentaire : le parseur SFC ferme le bloc là.
- Une action qui écrit dans `items` d'un store partagé (`classeStore.fetchByFiliere`) rend ce store dépendant de qui l'a appelé en dernier. Préférer charger une fois puis filtrer en mémoire.
- Les `ItemActions` locaux n'émettent pas tous la même chose (objet vs `id`). Le partagé émet toujours `{ key, item }`.
- Un store legacy peut appeler une action **qui n'existe pas** (`getNiveauByCycle`). Vérifier chaque appel.
- `window` n'est pas accessible depuis un template Vue 3 : passer par une fonction.
- Ne jamais laisser une réponse backend non déballée : la charge utile est **toujours** dans `data`.
