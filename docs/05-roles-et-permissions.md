# 05 - Rôles et permissions

## Rôles identifiés dans le code

Le store `src/stores/authStore/authStore.js` définit les rôles suivants :

- `admin`
- `scolarite`
- `pedagogie`
- `c_cycle`
- `finances`
- `directeur`
- `enseignant`
- `gestionnaire`

Ces rôles sont disponibles via les getters :

- `isAdmin`
- `isScolarite`
- `isPedagogie`
- `isCCycle`
- `isFinances`
- `isDirecteur`
- `isEnseignant`
- `isGestionnaire`

## Permissions visibles

- Le code frontend ne définit pas de permissions explicites par route.
- Le routeur ne contient pas de gardes de route (`router.beforeEach`) pour limiter l’accès en fonction du rôle.
- `DefaultLayout` est protégé uniquement par `meta.requiresAuth` dans le routeur, mais cette méta-donnée n’est pas utilisée par un guard dans le code analysé.
- L’authentification repose sur le token stocké dans `localStorage` et l’état `authStore.token`.

## Accès par module

| Module | Permission présente dans le code | Commentaire |
| --- | --- | --- |
| Authentification | Non | Le code gère l’authentification, mais pas le rôle par route |
| Structure académique | Non | Pas de contrôle d’accès frontend visible |
| Scolarité | Non | Pas de contrôle d’accès frontend visible |
| Examens | Non | Pas de contrôle d’accès frontend visible |
| Concours | Non | Pas de contrôle d’accès frontend visible |
| Finances | Non | Pas de contrôle d’accès frontend visible |
| Pédagogie | Non | Pas de contrôle d’accès frontend visible |

## Guards ou middlewares frontend

- Aucun guard global n’a été détecté pour vérifier `meta.requiresAuth`.
- La validation de la présence du token se fait localement dans `authStore`.
- La déconnexion supprime le token et redirige vers `/auth/login`.

## Points clés

- La présence des rôles indique une architecture prévue pour un contrôle d’accès fin.
- L’implémentation actuelle du routeur est incomplète pour tirer parti de ces rôles.
- Une évolution recommandée est d’ajouter un `router.beforeEach` global et des conditions d’affichage du menu.
