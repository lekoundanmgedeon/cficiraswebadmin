# État de la refactorisation — point de reprise

Document de passation. Il dit **où en est le chantier**, **ce qui reste**, et **comment reprendre**.
À tenir à jour à chaque module migré.

- Branche : `refactor-main` (6 commits, dernier : migration du module `etudiants`)
- Écart cumulé vs `main` : **212 fichiers, +12 579 / −39 139 lignes**
- État de santé : `npm run lint` **0 problème** sur le code migré · `npm test` **49 tests** · `npm run build` **OK**

---

## 1. Ce qui est fait

### 1.1 Le noyau `src/core/` — terminé

| Fichier | Rôle |
|---|---|
| `api/httpClient.js` | Client Axios par domaine. Injecte le jeton, **déballe la réponse**, **normalise les erreurs**, expose `onUnauthorized()`. Toutes les méthodes acceptent une config Axios. |
| `api/apiError.js` | `ApiError` : forme unique d'erreur (`message`, `status`, `fieldErrors`, `isUnauthorized`, `isNetworkError`, `isValidationError`). Seul endroit qui connaît les 4 formats d'erreur du backend. |
| `api/createResource.js` | Fabrique REST : `list`, `getById`, `create`, `update`, `patch`, `remove`. |
| `api/clients.js` | Un client par domaine : `authClient`, `academiqueClient`, `gestionClient`, `pedagogieClient`, `financeClient`, `evaluationClient`. |
| `store/createCrudStore.js` | **Pièce maîtresse.** Fabrique de store Pinia : state (`items`, `item`, `meta`, `loading`, `error`), getters (`isEmpty`, `count`, `getById`), actions (`fetchAll`, `fetchById`, `create`, `update`, `remove`, `invalidate`, `run`). |
| `router/index.js` | Assemble les routes des modules + celles restées en `src/routes/`. Branche la redirection sur 401. |
| `router/guards.js` | Guard `beforeEach`. **Tout est protégé par défaut** ; une route publique doit porter `meta: { public: true }`. |
| `auth/authStore.js` | Session : login, logout, profil, rôles. |
| `auth/tokenStorage.js` | Source unique de vérité pour le jeton. |

**Contrat central à connaître** : `run()` renvoie **`undefined` en cas d'échec**. L'UI s'y fie :

```js
const result = await store.create(form.value);
if (result !== undefined) close();   // la modale ne se ferme que si ça a vraiment marché
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
donc aucun écran ne *pouvait* charger de liste. 3 634 lignes → 2 631, et tout est branché sur l'API.

| Onglet | Avant | Après |
|---|---|---|
| Liste | 20 étudiants en dur, `@edit` → `console.log` | `GET /etudiants` · CRUD complet |
| Par classe | appelait `fetchEtudiantsByClasseFiliereAnnee` et lisait `filteredEtudiants` — **ni l'un ni l'autre n'existait** dans le store → `TypeError` au premier filtre | `fetchAll({ params })` |
| Organisation | groupes pédagogiques inventés, `setTimeout`, aucun backend | **remplacé** par « Répartition » : effectifs et taux de remplissage réels (`nb_etudiants` / `capacite_max` de `GET /classes`) |
| Statistiques | 4 étudiants en dur, `Chart` jamais détruit | dérivées de la liste réelle ; instances détruites au démontage |
| Import | fichier **vide**, et son onglet n'avait aucun lien de nav → inatteignable | `POST /imports/etudiants` |
| Export | 3 étudiants en dur ; `data-io/ExportData.vue` appelait `XLSX` **sans l'importer** → plantait au clic | Excel / PDF / CSV via `useTableExport` |

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
sont maintenant chargées une fois (depuis le cache) puis filtrées en mémoire.

### 1.5 L'optimisation d'API principale

Les conteneurs d'onglets Bootstrap (`data-bs-toggle="tab"`) **montent tous les panneaux d'un
coup** et se contentent d'en masquer certains en CSS. Chaque onglet exécutait donc son
`onMounted` — et ses requêtes — au chargement de la page, même sans être ouvert. Une page à
5 onglets déclenchait **5 séries d'appels pour n'en afficher qu'une**.

`AppTabs` ne monte que l'onglet actif, et `KeepAlive` évite de recharger ceux déjà visités.
**C'est le gain le plus important à propager sur les 23 conteneurs restants.**

### 1.6 Bugs corrigés (tous étaient en production)

**Authentification — la connexion ne pouvait pas aboutir**
1. Le backend enveloppe sa charge utile dans `data` (`{ success, data: { token, user } }`) ; `authStore` lisait `response.token`, un cran trop haut → le login **échouait même sur un 200 valide**.
2. Le formulaire envoyait `email`, alors que `POST /api/auth/login` recherche l'utilisateur **uniquement par `username`** (vérifié contre le backend) → « Identifiants incorrects » systématique.
3. Le rôle arrive en majuscules (`"ADMIN"`), les getters comparaient à `'admin'` → `isAdmin` **toujours faux**, y compris pour un administrateur.
4. `logoutUser` appelait `$reset()` **avant** `clearToken()` ; `$reset()` réexécute `state()`, qui relit le jeton → le jeton **ressuscitait**.
5. `signupUser` appelait `notifyError()` sans l'avoir déclaré → `ReferenceError`.
6. `fetchCurrentUser` appelait `useRouter()` dans une action Pinia (hors `setup()`) → `undefined`, la redirection plantait **précisément à l'expiration du jeton**.

**Sécurité**
7. **Aucun `router.beforeEach`** malgré les `meta.requiresAuth` : toute URL interne s'ouvrait sans session.
8. **XSS** dans l'onglet Organisation des semestres : donnée backend réinjectée dans un `v-html` sans échappement. La regex de recherche était aussi construite depuis la saisie sans échapper → chercher `(` cassait le filtre.
9. Le cache local n'était pas purgé à la déconnexion : données lisibles par l'utilisateur suivant.

**Le bug le plus répandu — 4 occurrences : les boutons ne faisaient rien**

| Écran | Défaut |
|---|---|
| Cycles | `@edit="editCycle"` → fonction **jamais définie** |
| Filières | `editFiliere` → `console.log` |
| Classes | `editClasse` **et** `confirmDelete` → `console.log` |
| Semestres | `editSemestre` → `console.log` |

→ On ne pouvait **modifier ni cycle, ni filière, ni classe, ni semestre**, ni supprimer une classe.

**Autres**
10. Édition d'une année : la modale lisait `anneeToEdit` du header, la liste écrivait dans sa propre variable → **le formulaire ne se pré-remplissait jamais**.
11. Les modales annonçaient « créé avec succès » puis se fermaient après un `setTimeout`, **sans vérifier le résultat** de l'appel.
12. `serviceApi.post(url, data)` ignorait silencieusement le 3ᵉ argument de config → les en-têtes `multipart/form-data` des 4 endpoints d'import n'étaient jamais transmis.
13. `handleApiError()` défini mais **jamais appelé** → `errorStore` toujours vide.
14. Filtrer les niveaux par cycle appelait `niveauStore.getNiveauByCycle()`, **action inexistante** → `TypeError`.
15. Formulaire cycle : `est_actif` vs `statut` incohérents → la case « actif » se désynchronisait dès la première édition.
16. `messageStore.addMessage()` / `.error()` appelés sur `useNotifier()`, qui n'expose ni l'un ni l'autre → `TypeError`.
17. `v-if` + `v-for` sur le même élément → le `v-else` associé était **structurellement inatteignable**.

**Étudiants** (voir §1.4 pour le détail)
18. Le store n'exposait **ni `items` ni `fetchAll`** : aucun écran ne *pouvait* charger de liste. D'où les tableaux codés en dur dans 4 onglets sur 6, plus la vue racine.
19. `fetchEtudiantsByClasseFiliereAnnee` et `filteredEtudiants` étaient consommés par l'onglet « Classes » mais **n'existaient pas** dans le store → `TypeError` au premier filtre.
20. `XLSX.utils.json_to_sheet` appelé **sans importer `XLSX`** → l'export Excel plantait au clic.
21. La fiche détail déclarait 4 onglets pour 2 panneaux ; deux d'entre eux pointaient sur un `#sales2` **inexistant** et trois `<li>` partageaient le même `id`.
22. La fiche détail affectait `etudiant.value = response` sans déballer `{ success, data }` → tous ses champs étaient `undefined`.
23. Ses `v-if` portaient sur les **mauvais champs** : le lieu de naissance était conditionné à `lieunaissance` (inexistant), le sexe à `genre`, l'adresse au *téléphone*.
24. `ajouterAuGroupe(e, g.id)` était appelé avec deux arguments mais n'en déclarait qu'un → « Assigner » affectait **le premier étudiant de la liste**, pas celui sur lequel on cliquait.
25. « Générer un rapport » : un `setTimeout(1800)` puis « Rapport généré et téléchargé avec succès » — **aucun appel API, aucun fichier**.
26. Le panneau d'onglet « Import » n'avait **aucun lien de navigation** : monté à chaque chargement, et inatteignable. Son composant était de toute façon vide, et le `DropData.vue` de secours n'avait aucun gestionnaire sur son bouton « Upload ».
27. La photo de la fiche détail était servie depuis `http://localhost:3500` **codé en dur**.

### 1.7 Code mort et duplication supprimés

- `routes/main.js` (copie **octet pour octet** de `routes/index.js`), `style1.css` (**520 Ko** jamais référencé), 5 fichiers `sample*.vue`, `result.js` → **25 493 lignes**.
- Le **même tableau de niveaux existait en 3 exemplaires** (filières, classes, semestres) et celui des filières en 2 → **776 lignes**.
- Les helpers `setCache`/`getCache` étaient copiés **à l'identique dans 9 stores**.
- `ItemActions` existait en **8 exemplaires divergents** (84 à 620 lignes), certains émettant l'objet, d'autres l'`id`.

---

## 2. Ce qui reste

### 2.1 Modules à migrer (par ordre conseillé)

| # | Module | Fichiers | Lignes | Pourquoi cet ordre |
|---|---|---|---|---|
| 1 | **inscriptions** | 18 | 4 344 | Très couplé à `etudiants` (déjà migré) et aux classes/niveaux. Le prochain. |
| 2 | **matieres** | 9 | 908 | Petit, CRUD simple — bon échauffement. |
| 3 | **pedagogies** | 34 | 8 040 | Le plus gros. 4 conteneurs d'onglets (dont deux à 6 onglets). |
| 4 | **examens** | 29 | 4 201 | 3 conteneurs d'onglets. |
| 5 | **concours** | 21 | 5 198 | Contient l'`ItemActions` de 620 lignes. |
| 6 | **finances** | 24 | 4 382 | 3 conteneurs d'onglets. |
| 7 | **notes** + **deliberation** | 23 | 3 143 | Liés (délibération consomme les notes). |
| 8 | **dashboard**, **parcours**, **stats** | 29 | 4 126 | Surtout de l'affichage. |
| 9 | Résidus | ~12 | ~1 500 | `admin`, `schedule`, `absence`, `prompt`, `docf`, `support`, `settings`, `notifications`, `structure` (vide). |

### 2.2 Dette technique transverse

- **21 conteneurs d'onglets Bootstrap** encore en montage eager → à passer sur `AppTabs`. C'est le principal gisement d'optimisation d'API restant. Liste : `grep -rl 'data-bs-toggle="tab"' src/views --include=*.vue`
- **19 stores legacy** dans `src/stores/` → à réécrire avec `createCrudStore`.
- **13 fichiers d'API legacy** dans `src/api/` → à répartir dans les modules.
- **31 fichiers** portent encore le bloc `<style scoped>` copié-collé (`.drag-drop-area`, `body {}`, `.card`) — dont 34 avec `body {}` **dans un style scoped, donc sans aucun effet**.

### 2.3 Bugs connus, non corrigés (hors périmètre migré)

Détail complet dans **`docs/DETTE-TECHNIQUE.md`**. Les bloquants :

| Fichier | Bug |
|---|---|
| `views/admin/DataTable.vue:40` | **Erreur de syntaxe** — le fichier ne parse pas. |
| `views/examens/calendrier/components/HeaderView.vue:42` | `fetchCalendarEvents` **jamais définie** → plantage au clic. |
| `views/examens/salles/components/HeaderView.vue:40` | Idem. |
| 9 composants | `<template>` sans élément racine → **ne rendent rien**. |

*(Les deux entrées `views/etudiants/.../ExportData.vue` ont disparu avec la migration du module.)*

### 2.4 Ponts de compatibilité à retirer en fin de migration

Chacun disparaît avec son dernier appelant.

| Élément | Remplacé par |
|---|---|
| `src/api/config/serviceApi.js`, `axiosClient.js`, `apiClients.js` | `core/api/httpClient` + `core/api/clients` |
| `src/stores/messages/*` (5 fichiers) | `shared/stores/notificationStore` |
| `src/utils/{exportExcel,exportPDF,toast}.js` | ré-exports vers `shared/utils/*` |
| Alias `@deprecated` dans les 6 stores de `structure-academique` (`items`↔`cycles`/`filieres`/`niveaux`/`classes`/`semestres`, `fetchAll()`↔`fetchXxx()`) | noms canoniques |

**7 vues legacy** consomment encore les stores de `structure-academique` par ces alias :
`notes/` (5 fichiers), `examens/planification/.../AddSession.vue`,
`inscriptions/.../ClasseNiveau.vue`. *(Les 3 vues `etudiants/` ont été migrées et n'utilisent plus
que les noms canoniques.)*

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

**3. `PUT` / `DELETE /etudiants/{id}` ne sont pas documentés** dans `09-api-et-integration-backend.md`
— mais ce document a été reconstitué depuis le code frontend, qui ne les appelait pas. Leur
existence a été **confirmée oralement** et le module s'appuie dessus (boutons Modifier / Supprimer).
**À vérifier contre le serveur dès qu'il est joignable** : au moment de la migration, l'isoprod
Railway répondait « Application not found » et rien n'écoutait sur `localhost:3500`.

---

## 3. Comment reprendre

1. Lire **`docs/ARCHITECTURE.md`** (structure et règle de dépendance), puis
   **`docs/GUIDE-MODULE.md`** (recette pas à pas).
2. Ouvrir `src/modules/structure-academique/cycle/` comme **modèle de référence** : c'est le
   sous-domaine le plus représentatif (CRUD + onglets + modale + export). Pour un module qui filtre
   ses listes, `src/modules/etudiants/` montre en plus le couple `fetchAll({ params })` +
   composable de filtres partagé.
3. Appliquer la recette au module suivant (`inscriptions`).
4. Vérifier : `npm run lint && npm test && npm run build`.

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
- Une action de store appelée par une vue mais **jamais définie** (`fetchEtudiantsByClasseFiliereAnnee`, `getNiveauByCycle`) : lire la vue *et* le store, jamais l'un sans l'autre.
- Un `<script setup>` ne peut pas contenir la chaîne `</` suivie de `script>`, même dans un commentaire : le parseur SFC ferme le bloc là.
- Une action qui écrit dans `items` d'un store partagé (`classeStore.fetchByFiliere`) rend ce store dépendant de qui l'a appelé en dernier. Préférer charger une fois puis filtrer en mémoire.
- Les `ItemActions` locaux n'émettent pas tous la même chose (objet vs `id`). Le partagé émet toujours `{ key, item }`.
- Un store legacy peut appeler une action **qui n'existe pas** (`getNiveauByCycle`). Vérifier chaque appel.
- `window` n'est pas accessible depuis un template Vue 3 : passer par une fonction.
- Ne jamais laisser une réponse backend non déballée : la charge utile est **toujours** dans `data`.
