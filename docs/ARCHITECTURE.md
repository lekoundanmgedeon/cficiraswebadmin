# Architecture frontend

Ce document décrit la structure cible du frontend et les règles qui la maintiennent cohérente.
Il fait autorité sur les fichiers `01` à `13`, qui décrivent l'application telle qu'elle était
avant la refonte.

## Principe directeur : découpage par module, non par couche

L'ancienne arborescence séparait le code par **nature technique** — toutes les vues dans `views/`,
tous les stores dans `stores/`, toutes les API dans `api/`. Travailler sur « les années
académiques » imposait d'ouvrir trois branches éloignées de l'arbre, et rien n'empêchait un
module d'aller lire le store d'un autre.

La structure cible regroupe le code par **module métier**. Tout ce qui concerne la structure
académique vit sous `src/modules/structure-academique/`. On supprime un module en supprimant
son dossier.

```
src/
├── core/                 # Le noyau : ce dont tous les modules dépendent
│   ├── api/              #   client HTTP, normalisation d'erreurs, fabrique de ressource REST
│   ├── auth/             #   session, jeton, store d'authentification
│   ├── router/           #   assemblage des routes + guard de navigation
│   └── store/            #   fabrique de store CRUD
│
├── shared/               # Réutilisable, sans logique métier
│   ├── components/       #   AppTabs, ItemActions, ConfirmModal, EmptyState, PageHeader…
│   ├── composables/      #   useTableExport
│   ├── stores/           #   notifications
│   └── utils/            #   dates, cache, texte, export Excel/PDF, modales
│
├── modules/              # Un dossier par module métier
│   └── structure-academique/
│       ├── routes.js     #   routes du module
│       └── <sous-domaine>/
│           ├── api.js        #  endpoints
│           ├── store.js      #  store Pinia
│           ├── constants.js  #  statuts, libellés, identifiants DOM
│           ├── composables/  #  pilotage des modales, logique d'écran
│           ├── components/   #  composants (dont tabs/)
│           └── views/        #  écrans montés par le router
│
├── layouts/              # DefaultLayout + Header / Sidebar / Footer
├── assets/               # CSS et images
├── App.vue               # Racine
└── main.js               # Point d'entrée Vite
```

Un module simple (une seule entité) se passe du niveau « sous-domaine » : `api.js`, `store.js`
et `components/` vivent alors directement à sa racine.

`App.vue` et `main.js` restent à la racine de `src/` : c'est la convention Vue/Vite (celle de
`create-vue`), et `index.html` y pointe directement.

## Règle de dépendance

> **`modules/` dépend de `core/` et `shared/`. Jamais l'inverse.**
>
> **Entre modules, les dépendances sont dirigées et déclarées — jamais circulaires.**

```
modules/  ──►  shared/  ──►  core/
   │
   └──►  modules amont (structure-academique, inscriptions)
```

Concrètement :

- ✅ `modules/structure-academique/cycle/store.js` importe `core/store/createCrudStore`
- ✅ `modules/structure-academique/cycle/components/` importe `shared/utils/date`
- ✅ `structure-academique/filiere/` importe `structure-academique/cycle/store` — **même module**
- ✅ `modules/etudiants/` importe `modules/inscriptions/store` — **dépendance amont déclarée**
- ❌ `core/` ou `shared/` importe quoi que ce soit de `modules/`
- ❌ deux modules qui s'importent **mutuellement**

### Pourquoi la règle a changé

La première version interdisait toute dépendance entre modules : « si deux modules ont besoin de
la même chose, elle remonte dans `shared/` ». Deux constats l'ont invalidée.

**1. `shared/` ne peut pas accueillir du métier.** Années, cycles, filières, niveaux, classes et
semestres sont de la **donnée de référence** : presque tous les modules les affichent en listes
déroulantes. Les remonter dans `shared/` y ferait entrer des stores Pinia et des appels API
métier, c'est-à-dire y déplacer le problème plutôt que le résoudre — `shared/` cesserait d'être
un socle technique.

**2. Certains modules sont la source d'autres.** Le backend n'expose **pas** de `GET /etudiants` :
l'annuaire des étudiants est une projection de `GET /inscriptions`. `modules/etudiants` ne _peut
pas_ ignorer `modules/inscriptions` — pas par confort, mais parce que c'est la seule source de la
donnée. Les fusionner en un module unique reviendrait à réunir deux écrans qui ont des
utilisateurs et des cycles de vie distincts.

La règle utile n'est donc pas « aucune dépendance », mais **« aucun cycle »**. Les dépendances
amont actuelles, à garder à l'esprit avant d'en ajouter :

| Module         | dépend de              | pourquoi                                                                |
| -------------- | ---------------------- | ----------------------------------------------------------------------- |
| `etudiants`    | `inscriptions`         | l'annuaire est projeté depuis `GET /inscriptions` — voir son `store.js` |
| `etudiants`    | `structure-academique` | filtres année / filière / classe                                        |
| `inscriptions` | `structure-academique` | filtres et capacité des classes                                         |

`structure-academique` ne dépend d'aucun module : c'est la racine. Un nouveau module importe
librement vers l'amont, jamais vers l'aval.

## Le noyau

### `core/api` — un seul chemin vers le backend

`createHttpClient(prefix)` produit un client Axios par domaine backend
(`/auth`, `/academique`, `/gestion`, …). Il se charge seul de trois choses :

1. **Le jeton** est injecté dans chaque requête depuis `core/auth/tokenStorage`.
2. **La réponse est déballée** : un appel renvoie directement le corps de la réponse, jamais
   l'enveloppe Axios. Les appelants ne manipulent plus `response.data.data`.
3. **Les erreurs sont normalisées** en `ApiError` — une forme unique, avec `message` lisible,
   `status`, et `fieldErrors`. Le backend renvoie ses erreurs sous quatre formes différentes
   (`data.message`, `data.error.message`, `data.errors[champ][]`, chaîne brute) ; `apiError.js`
   est le seul endroit du code qui connaît cette hétérogénéité.

Un **401** déclenche `onUnauthorized()`, branché par `core/router` sur la purge de session et la
redirection vers la connexion. Le client HTTP n'importe pas le router (cela créerait un cycle) :
il expose un point d'accroche que le router vient remplir.

Le CRUD lui-même n'est pas écrit à la main. `createResource(client, '/annees')` produit
`list`, `getById`, `create`, `update`, `patch`, `remove`. Un fichier d'API de module ne contient
donc plus que ses endpoints réellement spécifiques.

### `core/store` — la fabrique CRUD

`createCrudStore` est la pièce qui porte le plus de valeur. Elle produit un store Pinia complet :

|             |                                                                            |
| ----------- | -------------------------------------------------------------------------- |
| **state**   | `items`, `item`, `meta`, `loading`, `error`                                |
| **getters** | `isEmpty`, `count`, `getById(id)`                                          |
| **actions** | `fetchAll`, `fetchById`, `create`, `update`, `remove`, `invalidate`, `run` |

`run(call, { success, failure, onSuccess })` est la brique de base : elle gère `loading`,
capture l'erreur, notifie l'utilisateur, et **renvoie `undefined` en cas d'échec**. Ce dernier
point est un contrat sur lequel l'interface s'appuie :

```js
// Une modale ne se ferme que si l'enregistrement a réellement abouti.
const result = await store.create(form.value);
if (result !== undefined) close();
```

Les actions propres à un module s'écrivent avec `run`, et bénéficient donc du même traitement :

```js
async activate(id) {
  return this.run(() => activateAnnee(id), {
    success: 'Année académique activée avec succès.',
    failure: "Erreur lors de l'activation.",
    onSuccess: () => this.invalidate(),
  });
}
```

### `core/router` — protégé par défaut

Le guard applique une convention volontairement asymétrique :

> Toute route est protégée. Une route publique doit se déclarer avec `meta: { public: true }`.

Un oubli ferme donc la porte au lieu de l'ouvrir. Quand un visiteur non connecté demande une page,
le guard mémorise sa destination dans `?redirect=` et l'y ramène après connexion.

## Ajouter un module

Voir **[GUIDE-MODULE.md](./GUIDE-MODULE.md)** pour la marche à suivre pas à pas.

## Migration en cours

La refonte est **incrémentale** : le noyau est en place, un module a été migré et sert de
référence. Les autres suivent, un par un, l'application restant fonctionnelle entre chaque étape.

| État        | Module                                                                                                                             |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| ✅ Migré    | `structure-academique` (années, cycles, filières, niveaux, classes, semestres)                                                     |
| ⏳ À migrer | étudiants, inscriptions, matières, examens, concours, finances, pédagogie, notes, délibérations, dashboard, parcours, statistiques |

### Modules à sous-domaines

Un module peut regrouper plusieurs entités quand elles sont **fortement imbriquées
et évoluent ensemble**. C'est le cas de `structure-academique` : un cycle porte des
filières, qui portent des niveaux, qui portent des classes. Le formulaire d'une
classe a besoin des stores des filières **et** des niveaux ; celui d'une filière, du
store des cycles. Les séparer en modules distincts aurait imposé des imports
croisés permanents.

Chaque entité reste un sous-domaine autonome — son `api.js`, son `store.js`, ses
composants, sa vue — et seules les routes sont assemblées au niveau du module :

```
structure-academique/
├── routes.js          ← les 5 écrans du module
├── annee/    api.js · store.js · constants.js · composables/ · components/ · views/
├── cycle/    idem
├── filiere/  idem
├── niveau/   idem  (pas de vue propre : onglet des écrans filières/classes/semestres)
├── classe/   idem
└── semestre/ idem
```

À l'intérieur d'un module, les sous-domaines peuvent s'importer librement
(`import { useCycleStore } from '../../cycle/store'`). La règle de dépendance
continue de s'appliquer **entre** modules.

### Ponts de compatibilité, à retirer en fin de migration

Ces éléments n'existent que pour garder le code non migré fonctionnel. Chacun disparaît avec son
dernier appelant :

| Fichier                                                                                                                               | Remplacé par                                       |
| ------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| `src/api/config/serviceApi.js`                                                                                                        | `core/api/httpClient`                              |
| `src/api/config/axiosClient.js`, `apiClients.js`                                                                                      | `core/api/clients`                                 |
| `src/stores/messages/*`                                                                                                               | `shared/stores/notificationStore`                  |
| `src/utils/{exportExcel,exportPDF,toast}.js`                                                                                          | `shared/utils/*` (simples ré-exports)              |
| Alias `anneesAcademiques`, `anneeAcademique`, `fetchAnneesAcademiques()`, `fetchCurrentAnnee()` dans `modules/annee-academique/store` | `items`, `current`, `fetchAll()`, `fetchCurrent()` |

Ce dernier point est l'exception à la règle de dépendance : six vues non migrées
(semestres, sessions d'examen, concours, étudiants) consomment le store des années académiques.
Elles importent son store directement. Cette dépendance disparaîtra au fil de leur migration ;
en attendant, elle est **connue et localisée** plutôt que diffuse.

## Qualité

```bash
npm run lint      # ESLint — détecte imports morts, variables inutilisées, erreurs Vue
npm test          # Vitest — couvre core/ et shared/
npm run build     # Vérifie que tous les imports se résolvent
```

Les tests portent en priorité sur `core/` et `shared/` : c'est le code que tous les modules
partagent, donc celui dont une régression casserait tout à la fois.

`npm run lint` remonte aujourd'hui des avertissements sur le code non migré. C'est voulu : ils
constituent la liste de travail de la migration. Voir
[DETTE-TECHNIQUE.md](./DETTE-TECHNIQUE.md) pour les anomalies déjà identifiées.
