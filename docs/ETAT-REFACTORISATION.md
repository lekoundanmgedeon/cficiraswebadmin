# État de la refactorisation — point de reprise

Document de passation. Il dit **où en est le chantier**, **ce qui reste**, et **comment reprendre**.
À tenir à jour à chaque module migré.

- Branche : `refactor-main` (8 commits, dernier : migration du module `matieres`)
- Écart cumulé vs `main` : **272 fichiers, +17 149 / −44 799 lignes**
- État de santé : `npm run lint` **0 problème** sur le code migré · `npm test` **57 tests** · `npm run build` **OK**
- ⚠️ **`matieres` a nécessité des corrections dans `cfibackend`** (CRUD des modules entièrement
  cassé). Voir §1.6 — le dépôt backend porte un commit dédié.
- **Endpoints vérifiés contre le backend local** (`localhost:3500`) : les 14 routes appelées par les
  modules migrés répondent. Voir §2.5 — c'est ce contrôle qui manquait et qui avait laissé passer
  un module entier bâti sur des routes inexistantes.

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

> ### ⚠️ Il n'y a pas de ressource REST `/etudiants`
>
> Le backend (`cfibackend/src/routes/academique/etudiant.routes.js`) n'expose que **quatre**
> routes :
>
> ```
> POST /etudiants                 créer un étudiant seul
> POST /etudiants/:id/tuteurs
> POST /etudiants/:id/photo
> GET  /etudiants/:id/parcours
> ```
>
> **Ni `GET /etudiants` (liste), ni `GET /etudiants/:id`, ni `PUT`, ni `DELETE`** — les quatre
> répondent **404**, vérifié par curl. La première version de ce module s'appuyait dessus et était
> donc entièrement cassée ; c'est corrigé.
>
> L'annuaire est une **projection de `GET /inscriptions`**, dont chaque ligne porte l'identité de
> l'étudiant (`etudiant_id`, `etudiant_matricule`, `etudiant_nom`…) — voir le getter `etudiants`
> de `modules/inscriptions/store`. Conséquences assumées :
>
> - **pas de « Modifier » ni « Supprimer »** sur un étudiant : aucun endpoint. Les boutons ont été
>   retirés plutôt que laissés à cliquer dans le vide ;
> - `GET /inscriptions` ne renvoie **ni `sexe` ni `telephone`** : la colonne « Genre », son filtre
>   et la répartition Hommes/Femmes n'ont aucune source et ont disparu ;
> - un étudiant créé par `POST /etudiants` n'apparaît dans l'annuaire **qu'une fois inscrit**. Le
>   formulaire de création le dit explicitement.

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

### 1.7 L'optimisation d'API principale

Les conteneurs d'onglets Bootstrap (`data-bs-toggle="tab"`) **montent tous les panneaux d'un
coup** et se contentent d'en masquer certains en CSS. Chaque onglet exécutait donc son
`onMounted` — et ses requêtes — au chargement de la page, même sans être ouvert. Une page à
5 onglets déclenchait **5 séries d'appels pour n'en afficher qu'une**.

`AppTabs` ne monte que l'onglet actif, et `KeepAlive` évite de recharger ceux déjà visités.
**C'est le gain le plus important à propager sur les 23 conteneurs restants.**

### 1.8 Bugs corrigés (tous étaient en production)

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

### 1.9 Code mort et duplication supprimés

- `routes/main.js` (copie **octet pour octet** de `routes/index.js`), `style1.css` (**520 Ko** jamais référencé), 5 fichiers `sample*.vue`, `result.js` → **25 493 lignes**.
- Le **même tableau de niveaux existait en 3 exemplaires** (filières, classes, semestres) et celui des filières en 2 → **776 lignes**.
- Les helpers `setCache`/`getCache` étaient copiés **à l'identique dans 9 stores**.
- `ItemActions` existait en **8 exemplaires divergents** (84 à 620 lignes), certains émettant l'objet, d'autres l'`id`.

---

## 2. Ce qui reste

### 2.1 Modules à migrer (par ordre conseillé)

| #   | Module                                 | Fichiers | Lignes | Pourquoi cet ordre                                                                                            |
| --- | -------------------------------------- | -------- | ------ | ------------------------------------------------------------------------------------------------------------- |
| 1   | **matieres**                           | 9        | 908    | Petit, CRUD simple. Le prochain — bon rythme après deux gros modules.                                         |
| 2   | **pedagogies**                         | 34       | 8 040  | Le plus gros. 4 conteneurs d'onglets (dont deux à 6 onglets).                                                 |
| 3   | **examens**                            | 29       | 4 201  | 3 conteneurs d'onglets.                                                                                       |
| 4   | **concours**                           | 21       | 5 198  | Contient l'`ItemActions` de 620 lignes.                                                                       |
| 5   | **finances**                           | 24       | 4 382  | 3 conteneurs d'onglets. Recoupe `/inscriptions/finances`, déjà migré.                                         |
| 6   | **notes** + **deliberation**           | 23       | 3 143  | Liés (délibération consomme les notes).                                                                       |
| 7   | **dashboard**, **parcours**, **stats** | 29       | 4 126  | Surtout de l'affichage.                                                                                       |
| 8   | Résidus                                | ~12      | ~1 500 | `admin`, `schedule`, `absence`, `prompt`, `docf`, `support`, `settings`, `notifications`, `structure` (vide). |

### 2.2 Dette technique transverse

- **20 conteneurs d'onglets Bootstrap** encore en montage eager → à passer sur `AppTabs`. C'est le principal gisement d'optimisation d'API restant. Liste : `grep -rl 'data-bs-toggle="tab"' src/views --include=*.vue`
- **17 stores legacy** dans `src/stores/` → à réécrire avec `createCrudStore`.
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

**6 vues legacy** consomment encore les stores de `structure-academique` par ces alias :
`notes/` (5 fichiers) et `examens/planification/.../AddSession.vue`. _(Les vues `etudiants/` et
`inscriptions/` ont été migrées et n'utilisent plus que les noms canoniques.)_

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

**7. Deux endpoints pour l'import de réinscriptions** — `POST /inscriptions/import-reinscription`
(champ `fichier`) et `POST /academique/imports/reinscriptions` (champ `file`). Le frontend retient
le premier. Les conventions de nom de champ divergent aussi entre les imports (`fichier` pour les
inscriptions, `file` pour les étudiants) : à harmoniser.

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
3. Appliquer la recette au module suivant (`examens`).
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
