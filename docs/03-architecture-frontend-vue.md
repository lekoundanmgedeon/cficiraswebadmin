# 03 - Architecture frontend Vue.js 3

## Structure générale des dossiers

- `src/routes` : définition des routes Vue Router par domaine.
- `src/views` : pages principales et écrans par module.
- `src/components` : composants réutilisables, maquettes et éléments d’interface.
- `src/layouts` : disposition globale de l’application.
- `src/stores` : stores Pinia, répartis par domaine métier.
- `src/api` : clients Axios et wrappers de services API.
- `src/assets` : ressources statiques et images.
- `src/utils` : utilitaires transverses (export PDF, Excel, toast).

## Flux frontend général

1. `src/main.js` initialise l’application Vue 3.
2. Le routeur Vue Router est chargé depuis `src/routes/index.js`.
3. Tous les chemins protégés sont regroupés sous `DefaultLayout`.
4. Pinia est utilisé comme store central.
5. `App.vue` encapsule l’application dans un `a-config-provider` Ant Design FR.
6. Les composants de layout (`Header`, `Sidebar`, `Footer`) gèrent la navigation et les actions globales.

## Rôle des vues, composants, stores, services et routes

- **Vues** (`src/views`) composent des écrans d’application.
- **Stores** (`src/stores`) portent l’état, les appels API et la logique métier côté client.
- **Services API** (`src/api`) centralisent les appels vers le backend via Axios.
- **Routes** (`src/routes`) définissent les points d’entrée URL et les composants associés.
- **Composants** (`src/components`) factorisent des éléments d’interface transverses.

## Routeur

- `src/routes/index.js` assemble les modules de routes et applique `DefaultLayout` pour toutes les routes internes.
- Les routes publiques sont définies dans `auth.routes.js`.
- Les routes métiers sont réparties en modules : `structure`, `etudiants`, `examens`, `concours`, `finances`, `pedagogie`, `others`.
- La route racine `/` et `/home` redirigent vers le dashboard.

## Gestion de l’authentification

- Le store `authStore` stocke : `user`, `token`, `status`, `error`.
- Le token est conservé dans `localStorage` pour la persistance.
- Axios ajoute automatiquement le token dans l’en-tête `Authorization: Bearer`.
- `authStore` propose des actions : `loginUser`, `logoutUser`, `signupUser`, `fetchCurrentUser`.
- La route `DefaultLayout` est marquée `meta.requiresAuth`, mais aucun guard `router.beforeEach` n’est présent dans le code analysé.

## Gestion des permissions

- `authStore` expose des getters de rôle : `isAdmin`, `isScolarite`, `isPedagogie`, `isCCycle`, `isFinances`, `isDirecteur`, `isEnseignant`, `isGestionnaire`.
- Aucune restriction de route par rôle n’a été observée dans le routeur.
- Aucune condition d’affichage de menu basée sur ces getters n’a été détectée dans le code existant.

## Observations de l’architecture frontend

- La mise en page est basée sur une architecture maître/acteur : `DefaultLayout` + `router-view`.
- Les écrans utilisent des composants de type `Header`, `Tab`, `Content`, `Modal`.
- Plusieurs pages utilisent des chargements simulés (`setTimeout`) et des données de démonstration.
- Les services API utilisent une couche de « service builder » (`serviceApi.js`) identique pour `get`, `post`, `put`, `patch`, `delete`.
- Le fichier `axiosClient.js` gère l’URL de base via `VITE_API_URL` et les headers JSON.
