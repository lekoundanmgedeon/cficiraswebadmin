# Architecture du frontend

Structure du code, règles qui la maintiennent cohérente, et contrats sur lesquels tous les
modules s'appuient. Pour reconstruire ailleurs, lire plutôt [RECONSTRUCTION.md](./RECONSTRUCTION.md) ;
ce document décrit **l'implémentation Vue existante**.

## 1. Principe directeur : découpage par module, non par couche

L'arborescence d'origine séparait le code par **nature technique** — toutes les vues dans
`views/`, tous les stores dans `stores/`, toutes les API dans `api/`. Travailler sur « les années
académiques » imposait d'ouvrir trois branches éloignées de l'arbre, et rien n'empêchait un module
d'aller lire le store d'un autre.

Le code est aujourd'hui regroupé par **module métier**. Tout ce qui concerne la structure
académique vit sous `src/modules/structure-academique/`. On supprime un module en supprimant son
dossier.

```
src/
├── core/                 # Le noyau : ce dont tous les modules dépendent
│   ├── api/              #   httpClient · clients par domaine · createResource · ApiError
│   ├── auth/             #   authStore · tokenStorage (deux portées de jeton)
│   ├── router/           #   assemblage des routes · garde de navigation
│   └── store/            #   createCrudStore
│
├── shared/               # Réutilisable, sans logique métier
│   ├── components/       #   AppTabs · ItemActions · ConfirmModal · EmptyState ·
│   │                     #   LoadingSpinner · PageHeader · PageCard · ExportMenu
│   ├── composables/      #   usePagination · useTableExport · useImportFile · useSidebarRepli
│   ├── stores/           #   notificationStore
│   └── utils/            #   date · text · cache · modal · remplissage · parametres ·
│                         #   exportExcel · exportPDF · toast
│
├── modules/              # 20 modules métier — voir §3
│   └── <module>/
│       ├── routes.js         #  routes du module
│       ├── api.js            #  endpoints          ┐
│       ├── store.js          #  store Pinia        │ à la racine si le module
│       ├── constants.js      #  énumérations       │ n'a qu'une entité,
│       ├── composables/      #  pilotage de modale │ sous <sous-domaine>/ sinon
│       ├── components/       #  dont tabs/         │
│       └── views/            #  écrans montés par le router
│
├── layouts/              # DefaultLayout (en-tête + barre latérale + pied)
├── components/           # Legacy : sidebar, header, footer, Pagination.vue
├── views/                # Legacy : auth/ et errors/ uniquement
├── routes/               # Legacy : auth.routes.js uniquement
├── stores/messages/      # Legacy : pont vers shared/stores/notificationStore
├── utils/                # Legacy : ré-exports vers shared/utils
├── assets/               # CSS et images
├── App.vue               # Racine
└── main.js               # Point d'entrée Vite
```

`App.vue` et `main.js` restent à la racine de `src/` : c'est la convention `create-vue`, et
`index.html` y pointe directement.

⚠️ `src/components/shared/Pagination.vue` est **le** composant de pagination du projet, malgré son
chemin historique hors de `shared/`. Il fonctionne avec `shared/composables/usePagination`.

## 2. Règle de dépendance

> **`modules/` dépend de `core/` et `shared/`. Jamais l'inverse.**
>
> **Entre modules, les dépendances sont dirigées et déclarées — jamais circulaires.**

```
modules/  ──►  shared/  ──►  core/
   │
   └──►  modules amont (structure-academique, inscriptions, examens, finances)
```

- ✅ `modules/structure-academique/cycle/store.js` importe `core/store/createCrudStore`
- ✅ `structure-academique/filiere/` importe `structure-academique/cycle/store` — **même module**
- ✅ `modules/etudiants/` importe `modules/inscriptions/store` — **dépendance amont déclarée**
- ❌ `core/` ou `shared/` importe quoi que ce soit de `modules/`
- ❌ deux modules qui s'importent **mutuellement**

### Pourquoi « pas de cycle » plutôt que « pas de dépendance »

La première version de la règle interdisait toute dépendance entre modules : « si deux modules ont
besoin de la même chose, elle remonte dans `shared/` ». Deux constats l'ont invalidée.

**1. `shared/` ne peut pas accueillir du métier.** Années, cycles, filières, niveaux, classes et
semestres sont de la **donnée de référence** : presque tous les modules les affichent en listes
déroulantes. Les remonter dans `shared/` y ferait entrer des stores Pinia et des appels API
métier — `shared/` cesserait d'être un socle technique.

**2. Certains modules sont la source d'autres.** Le backend n'expose **pas** de `GET /etudiants`
utilisable seul pour l'annuaire complet : la classe d'un étudiant vient de son *inscription*.
`modules/etudiants` ne peut pas ignorer `modules/inscriptions`.

### Les dépendances entre modules, mesurées

```bash
for d in src/modules/*/; do m=$(basename $d)
  grep -rhoE "@/modules/[a-z-]+" $d --include=*.vue --include=*.js | sort -u \
    | grep -v "@/modules/$m$" | sed "s|@/modules/|  → |" | sed "1i $m"
done
```

| Module                 | dépend de                                                    |
| ---------------------- | ------------------------------------------------------------ |
| `structure-academique` | `assistant`, `matieres`                                      |
| `inscriptions`         | `structure-academique`                                       |
| `etudiants`            | `inscriptions`, `scolarite`, `structure-academique`          |
| `scolarite`            | `etudiants`, `finances`, `inscriptions`, `structure-academique` |
| `matieres`             | `structure-academique`                                       |
| `examens`              | `assistant`, `matieres`, `structure-academique`              |
| `notes`                | `assistant`, `espace-notes`, `examens`, `structure-academique` |
| `espace-notes`         | `examens`, `notes`, `structure-academique`                   |
| `stats`                | `examens`                                                    |
| `finances`             | `assistant`, `etudiants`, `inscriptions`, `structure-academique` |
| `dashboard`            | `finances`                                                   |
| `pedagogies`           | `examens`, `matieres`, `structure-academique`                |
| `coordination`         | `examens`, `pedagogies`, `structure-academique`              |
| `documents`            | `etudiants`, `structure-academique`                          |
| `bibliotheque`         | `examens`                                                    |
| `concours`, `parametres` | `structure-academique`                                     |
| `assistant`, `plateforme` | — (aucune)                                                |

Les raisons des dépendances les moins évidentes :

| Arête | Pourquoi |
| ----- | -------- |
| `etudiants → inscriptions` | la classe d'un étudiant vient de son inscription |
| `scolarite → finances` | l'onglet « Situation financière » du dossier |
| `notes → examens` | la délibération lit le store des bulletins |
| `dashboard → finances` | les agrégats financiers ne sont pas dupliqués |
| `espace-notes → notes` | l'espace consomme la grille de notes |
| `structure-academique → matieres` | l'onglet « UE du semestre » monte la modale d'assignation |
| `* → assistant` | les onglets « Assistant IA » embarqués |

### ⚠️ Quatre cycles subsistent entre modules

La règle dit « jamais circulaires ». **Le code ne la respecte pas encore.** Relevé le 31 août 2026 :

| Cycle | Arête retour |
| ----- | ------------ |
| `structure-academique ↔ matieres` | `semestre/.../UesSemestreTab.vue` monte `matieres/components/AssignationModal.vue`, qui importe `structure-academique/classe/store` |
| `etudiants ↔ scolarite` | `etudiants` lit `scolarite/constants` ; `scolarite` lit `etudiants/store` et `etudiants/constants` |
| `notes ↔ espace-notes` | `notes` lit `espace-notes/constants` ; `espace-notes` lit `notes/note/store` et `notes/constants` |
| `etudiants → scolarite → finances → etudiants` | `finances/.../SuiviEtudiant.vue` importe `etudiants/store` |

**Aucun n'est un cycle d'imports ES** : les arêtes retour tombent sur des `constants.js` sans
import, ou sur des fichiers distincts qui ne referment pas la boucle. Le build se résout, et rien
ne casse aujourd'hui.

Mais ce sont bien des cycles **entre modules** : on ne peut plus retirer `scolarite` sans toucher
`etudiants`, ni l'inverse. Deux d'entre eux se dénoueraient en remontant les énumérations
partagées (`dossierInfo`, `sexeLabel`, `STATUTS_PUBLIABLES`) là où elles appartiennent, ou en
duplicant sciemment trois libellés. C'est consigné dans
[DETTE-TECHNIQUE.md](./DETTE-TECHNIQUE.md).

`structure-academique` n'est donc **plus tout à fait la racine** : elle dépend de `matieres` par un
seul onglet. Une dépendance amont se **déclare en commentaire** en tête du fichier qui l'introduit.

### L'inversion de `parametres`

`shared/utils/exportPDF.js` et le formatage des montants ont besoin des réglages de la plateforme,
mais `shared/` ne peut pas importer `modules/parametres/store.js`. D'où l'inversion :
`shared/utils/parametres.js` **détient** les valeurs (avec des replis alignés sur le semis de la
base), et le store des paramètres les y **dépose** après chaque lecture *et après chaque écriture*.
La flèche reste dans le bon sens, aucun cycle ne se forme.

## 3. Les vingt modules

| Module                 | Écrans | Domaine backend                    | Fiche                                                      |
| ---------------------- | ------ | ---------------------------------- | ---------------------------------------------------------- |
| `structure-academique` | 5      | `/academique`                      | [fiche](./modules/structure-academique.md)                 |
| `etudiants`            | 1      | `/academique`                      | [fiche](./modules/etudiants.md)                            |
| `inscriptions`         | 1      | `/academique`                      | [fiche](./modules/inscriptions.md)                         |
| `scolarite`            | 2      | `/academique`                      | [fiche](./modules/scolarite.md)                            |
| `matieres`             | 1      | `/academique`                      | [fiche](./modules/matieres.md)                             |
| `examens`              | 5      | `/evaluations` + `/academique`     | [fiche](./modules/examens.md)                              |
| `notes`                | 2      | `/evaluations`                     | [fiche](./modules/notes.md)                                |
| `concours`             | 3      | `/gestion`                         | [fiche](./modules/concours.md)                             |
| `finances`             | 3      | `/finance`                         | [fiche](./modules/finances.md)                             |
| `pedagogies`           | 5      | `/pedagogies`                      | [fiche](./modules/pedagogies.md)                           |
| `coordination`         | 3      | `/coordination`                    | [fiche](./modules/coordination.md)                         |
| `documents`            | 1      | `/documents`                       | [fiche](./modules/documents.md)                            |
| `bibliotheque`         | 1      | `/bibliotheque`                    | [fiche](./modules/bibliotheque.md)                         |
| `dashboard`            | 1      | `/academique` + `/pedagogies`      | [fiche](./modules/dashboard.md)                            |
| `stats`                | 1      | `/evaluations`                     | [fiche](./modules/stats.md)                                |
| `parametres`           | 1      | `/parametres`, `/utilisateurs`, …  | [fiche](./modules/parametres.md)                           |
| `assistant`            | 1 + espace | `/assistant`                   | [fiche](./modules/assistant.md)                            |
| `espace-notes`         | espace | `/evaluations` + `/academique`     | [fiche](./modules/espace-notes.md)                         |
| `plateforme`           | 4      | aucun                              | [fiche](./modules/plateforme.md)                           |
| *(hors module)* auth   | 3      | `/auth`                            | [fiche](./modules/auth-et-session.md)                      |

### Modules à sous-domaines

Un module regroupe plusieurs entités quand elles sont **fortement imbriquées et évoluent
ensemble**. C'est le cas de `structure-academique` (un cycle porte des filières, qui portent des
niveaux, qui portent des classes), d'`examens` (session → épreuve → salle → bulletin), de
`concours`, de `coordination`, de `finances` et de `pedagogies`.

Chaque entité reste un sous-domaine autonome — son `api.js`, son `store.js`, ses composants, sa
vue — et seules les routes sont assemblées au niveau du module. À l'intérieur d'un module, les
sous-domaines s'importent librement ; la règle de dépendance continue de s'appliquer **entre**
modules.

## 4. Le noyau

### `core/api` — un seul chemin vers le backend

`createHttpClient(prefix)` produit un client Axios par domaine backend. Il se charge seul de
quatre choses :

1. **Le jeton** est injecté depuis `core/auth/tokenStorage`.
2. **Le `Content-Type` est retiré sur un `FormData`** — seul le navigateur connaît la
   « boundary » du multipart.
3. **La réponse est déballée** : un appel renvoie le corps, jamais l'enveloppe Axios. Les
   appelants ne manipulent plus `response.data.data`.
4. **Les erreurs sont normalisées** en `ApiError` (`message`, `status`, `fieldErrors`,
   `isUnauthorized`, `isNetworkError`, `isValidationError`). Le backend renvoie ses erreurs sous
   quatre formes ; `apiError.js` est le seul endroit du code qui connaît cette hétérogénéité.

Un **401** déclenche `onUnauthorized()`, branché par `core/router` sur la purge de session et la
redirection. Le client HTTP n'importe pas le router — cela créerait un cycle : il expose un point
d'accroche que le router vient remplir.

Le CRUD n'est pas écrit à la main. `createResource(client, '/annees')` produit `list`, `getById`,
`create`, `update`, `patch`, `remove`. Un `api.js` de module ne contient plus que ses endpoints
réellement spécifiques.

Les neuf clients : `authClient` `/auth` · `academiqueClient` `/academique` · `gestionClient`
`/gestion` · `pedagogieClient` `/pedagogies` · `financeClient` `/finance` · `evaluationClient`
`/evaluations` · `bibliothequeClient` `/bibliotheque` · `coordinationClient` `/coordination` ·
`documentClient` `/documents`. Plus `plateformeClient` (**sans préfixe** : le module backend sert
`/parametres`, `/utilisateurs`, `/notifications` et `/journaux`, qu'aucun préfixe commun ne
décrirait honnêtement) et le client local de l'assistant (`/assistant`).

### `core/store` — la fabrique CRUD

`createCrudStore` produit un store Pinia complet :

|             |                                                                            |
| ----------- | -------------------------------------------------------------------------- |
| **state**   | `items`, `item`, `meta`, `loading`, `error`                                |
| **getters** | `isEmpty`, `count`, `getById(id)`                                          |
| **actions** | `fetchAll`, `fetchById`, `create`, `update`, `remove`, `invalidate`, `run` |

`run(call, { success, failure, onSuccess })` est la brique de base : elle gère `loading`, capture
l'erreur, notifie l'utilisateur, et **renvoie `undefined` en cas d'échec**. Ce dernier point est
un contrat sur lequel l'interface s'appuie :

```js
// Une modale ne se ferme que si l'enregistrement a réellement abouti.
const result = await store.create(form.value);
if (result !== undefined) close();
```

Les actions propres à un module s'écrivent avec `run` et bénéficient du même traitement. Les
stores qui **ne** sont **pas** bâtis sur `createCrudStore` — parce que leur objet n'est pas une
ressource REST (bulletins, notes, dossier scolaire, candidats, épreuves de concours, demandes de
document) — réimplémentent `run` avec le **même contrat**.

`fetchAll({ params })` ne met en cache **que la liste non filtrée** : une liste filtrée dépend de
`params` et n'a pas la même clé.

### `core/router` — protégé par défaut

> Toute route est protégée. Une route publique doit se déclarer avec `meta: { public: true }`.

Un oubli ferme donc la porte au lieu de l'ouvrir. Quand un visiteur non connecté demande une page,
la garde mémorise sa destination dans `?redirect=` et l'y ramène après connexion.

### `core/auth` — deux sessions, deux jetons

`tokenStorage` range le jeton sous une clé qui dépend de la **portée**, fixée une fois au
démarrage d'après l'URL de la fenêtre (`main.js`) :

| Portée         | Clé                  | Qui                                                      |
| -------------- | -------------------- | -------------------------------------------------------- |
| `app`          | `token`              | l'application, et l'espace de chat                       |
| `espace-notes` | `token:espace-notes` | l'espace de gestion des notes, ouvert en fenêtre à part  |

C'est ce qui permet à un enseignant d'entrer dans l'espace de notes sans toucher à la session de
l'application ouverte dans l'autre fenêtre — même navigateur, donc même `localStorage`.
L'espace de chat, lui, **partage** la session : c'est ce qui lui permet d'afficher les
conversations de l'utilisateur sans le faire se reconnecter.

## 5. Trois coquilles, trois régimes de garde

| Espace                    | Layout                | Garde                                                                 |
| ------------------------- | --------------------- | --------------------------------------------------------------------- |
| Application               | `DefaultLayout`       | garde générale (« tout est protégé »)                                 |
| Espace de notes `/espace-notes` | `EspaceNotesLayout` | `meta.public` sur le parent **pour écarter la garde générale**, puis `beforeEnter` route par route vers *sa* connexion |
| Espace de chat `/espace-chat`   | `EspaceChatLayout`  | garde générale — il partage la session ; `beforeEnter` ADMIN sur `/audit` seulement |

L'espace de notes déclare ses routes publiques non pour les ouvrir, mais parce que la garde
générale renverrait vers `Login`, l'écran de connexion de l'*application* : dans cette fenêtre, ce
serait la mauvaise porte.

## 6. Contrats à connaître avant de toucher au code

- `run()` de `createCrudStore` renvoie **`undefined` en cas d'échec** ; l'UI s'y fie.
- Les méthodes d'`api.js` renvoient **le corps déjà déballé** : pas de `response.data` à extraire
  côté store, mais la charge utile métier est toujours dans `data`.
- `AppTabs` ne monte que l'onglet actif : **un onglet = une requête**, au moment où on l'ouvre.
  `KeepAlive` conserve ensuite les onglets déjà visités.
- Un `<script setup>` ne peut pas contenir `</` suivi de `script>`, même en commentaire.
- `pg` sert `COUNT`, `SUM` et `NUMERIC` en **chaînes** : convertir avant toute addition
  (`nombre()` dans `shared/utils/remplissage.js`).

## 7. Qualité

```bash
npm run lint      # ESLint — 0 erreur attendue
npm test          # Vitest — 494 tests
npm run build     # vérifie que tous les imports se résolvent
```

Les tests portent en priorité sur `core/`, `shared/` et les pièges de chaque module : c'est le
code dont une régression casserait tout à la fois, et les règles qu'un lecteur pressé casserait
sans le voir. Ils **ne parlent pas au backend** — voir [CONTRAT-API.md](./CONTRAT-API.md) pour la
vérification qui manque.

## 8. Ce qui reste de l'ancienne arborescence

| Chemin                  | Contenu                                                     | Sort                                        |
| ----------------------- | ----------------------------------------------------------- | ------------------------------------------- |
| `src/views/auth/`       | `Login.vue`, `Register.vue`                                 | à migrer vers un module `auth`              |
| `src/views/errors/`     | `NotFound.vue`                                              | idem                                        |
| `src/routes/auth.routes.js` | routes publiques + `NotFound`                           | idem                                        |
| `src/stores/messages/`  | 5 fichiers                                                  | pont vers `shared/stores/notificationStore` |
| `src/utils/`            | `exportExcel`, `exportPDF`, `toast`                         | ré-exports vers `shared/utils/*`            |
| `src/components/`       | `sidebar`, `header`, `footer`, `Pagination.vue`, 3 orphelins | `Pagination.vue` reste ; le reste à ranger |

Détail chiffré et daté dans [DETTE-TECHNIQUE.md](./DETTE-TECHNIQUE.md).
