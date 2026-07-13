# État de la refactorisation — point de reprise

Document de passation. Il dit **où en est le chantier**, **ce qui reste**, et **comment reprendre**.
À tenir à jour à chaque module migré.

- Branche : `refactor-main` (5 commits, dernier : `9ac0ec6 finish structure academique`)
- Écart cumulé vs `main` : **177 fichiers, +9 698 / −35 389 lignes**
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

### 1.4 L'optimisation d'API principale

Les conteneurs d'onglets Bootstrap (`data-bs-toggle="tab"`) **montent tous les panneaux d'un
coup** et se contentent d'en masquer certains en CSS. Chaque onglet exécutait donc son
`onMounted` — et ses requêtes — au chargement de la page, même sans être ouvert. Une page à
5 onglets déclenchait **5 séries d'appels pour n'en afficher qu'une**.

`AppTabs` ne monte que l'onglet actif, et `KeepAlive` évite de recharger ceux déjà visités.
**C'est le gain le plus important à propager sur les 23 conteneurs restants.**

### 1.5 Bugs corrigés (tous étaient en production)

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

### 1.6 Code mort et duplication supprimés

- `routes/main.js` (copie **octet pour octet** de `routes/index.js`), `style1.css` (**520 Ko** jamais référencé), 5 fichiers `sample*.vue`, `result.js` → **25 493 lignes**.
- Le **même tableau de niveaux existait en 3 exemplaires** (filières, classes, semestres) et celui des filières en 2 → **776 lignes**.
- Les helpers `setCache`/`getCache` étaient copiés **à l'identique dans 9 stores**.
- `ItemActions` existait en **8 exemplaires divergents** (84 à 620 lignes), certains émettant l'objet, d'autres l'`id`.

---

## 2. Ce qui reste

### 2.1 Modules à migrer (par ordre conseillé)

| # | Module | Fichiers | Lignes | Pourquoi cet ordre |
|---|---|---|---|---|
| 1 | **etudiants** | 16 | 3 634 | Consomme déjà les stores de `structure-academique` via alias. Contient 4 bugs bloquants connus (voir §2.3). |
| 2 | **inscriptions** | 18 | 4 344 | Très couplé à `etudiants` et aux classes/niveaux. |
| 3 | **matieres** | 9 | 908 | Petit, CRUD simple — bon échauffement. |
| 4 | **pedagogies** | 34 | 8 040 | Le plus gros. 4 conteneurs d'onglets (dont deux à 6 onglets). |
| 5 | **examens** | 29 | 4 201 | 3 conteneurs d'onglets. |
| 6 | **concours** | 21 | 5 198 | Contient l'`ItemActions` de 620 lignes. |
| 7 | **finances** | 24 | 4 382 | 3 conteneurs d'onglets. |
| 8 | **notes** + **deliberation** | 23 | 3 143 | Liés (délibération consomme les notes). |
| 9 | **dashboard**, **parcours**, **stats** | 29 | 4 126 | Surtout de l'affichage. |
| 10 | Résidus | ~12 | ~1 500 | `admin`, `schedule`, `absence`, `prompt`, `docf`, `support`, `settings`, `notifications`, `structure` (vide). |

### 2.2 Dette technique transverse

- **23 conteneurs d'onglets Bootstrap** encore en montage eager → à passer sur `AppTabs`. C'est le principal gisement d'optimisation d'API restant. Liste : `grep -rl 'data-bs-toggle="tab"' src/views --include=*.vue`
- **20 stores legacy** dans `src/stores/` → à réécrire avec `createCrudStore`.
- **14 fichiers d'API legacy** dans `src/api/` → à répartir dans les modules.
- **31 fichiers** portent encore le bloc `<style scoped>` copié-collé (`.drag-drop-area`, `body {}`, `.card`) — dont 34 avec `body {}` **dans un style scoped, donc sans aucun effet**.

### 2.3 Bugs connus, non corrigés (hors périmètre migré)

Détail complet dans **`docs/DETTE-TECHNIQUE.md`**. Les bloquants :

| Fichier | Bug |
|---|---|
| `views/etudiants/components/data-io/ExportData.vue:146-150` | `XLSX` utilisé **sans import** → l'export Excel des étudiants **plante au clic**. |
| `views/admin/DataTable.vue:40` | **Erreur de syntaxe** — le fichier ne parse pas. |
| `views/examens/calendrier/components/HeaderView.vue:42` | `fetchCalendarEvents` **jamais définie** → plantage au clic. |
| `views/examens/salles/components/HeaderView.vue:40` | Idem. |
| `views/etudiants/.../ExportData.vue:127-131` | `ref()` lue sans `.value` → condition toujours vraie. |
| 9 composants | `<template>` sans élément racine → **ne rendent rien**. |

### 2.4 Ponts de compatibilité à retirer en fin de migration

Chacun disparaît avec son dernier appelant.

| Élément | Remplacé par |
|---|---|
| `src/api/config/serviceApi.js`, `axiosClient.js`, `apiClients.js` | `core/api/httpClient` + `core/api/clients` |
| `src/stores/messages/*` (5 fichiers) | `shared/stores/notificationStore` |
| `src/utils/{exportExcel,exportPDF,toast}.js` | ré-exports vers `shared/utils/*` |
| Alias `@deprecated` dans les 6 stores de `structure-academique` (`items`↔`cycles`/`filieres`/`niveaux`/`classes`/`semestres`, `fetchAll()`↔`fetchXxx()`) | noms canoniques |

**11 vues legacy** consomment encore les stores de `structure-academique` par ces alias :
`notes/` (5 fichiers), `etudiants/` (3), `examens/planification/.../AddSession.vue`,
`concours/.../AddConcour.vue`, `inscriptions/.../ClasseNiveau.vue`.

### 2.5 Question ouverte pour le backend

L'API expose **deux vocabulaires de statut** pour les années académiques :
- `/annees`, `/annees/{id}` → `OUVERTE` | `PLANIFIEE` | `CLOTUREE`
- `/annees/history` → `active` | `en_preparation` | `terminee` | `archivee`

Le frontend absorbe l'écart dans `structure-academique/annee/constants.js`, mais l'harmonisation
gagnerait à se faire côté backend.

---

## 3. Comment reprendre

1. Lire **`docs/ARCHITECTURE.md`** (structure et règle de dépendance), puis
   **`docs/GUIDE-MODULE.md`** (recette pas à pas).
2. Ouvrir `src/modules/structure-academique/cycle/` comme **modèle de référence** : c'est le
   sous-domaine le plus représentatif (CRUD + onglets + modale + export).
3. Appliquer la recette au module suivant (`etudiants`).
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

- Un `@edit` câblé sur une fonction inexistante ou un `console.log` — **c'est arrivé 4 fois**. Vérifier systématiquement que chaque handler fait vraiment quelque chose.
- Les `ItemActions` locaux n'émettent pas tous la même chose (objet vs `id`). Le partagé émet toujours `{ key, item }`.
- Un store legacy peut appeler une action **qui n'existe pas** (`getNiveauByCycle`). Vérifier chaque appel.
- `window` n'est pas accessible depuis un template Vue 3 : passer par une fonction.
- Ne jamais laisser une réponse backend non déballée : la charge utile est **toujours** dans `data`.
