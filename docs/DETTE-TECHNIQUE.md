# Dette technique identifiée

Anomalies relevées dans le code **non encore migré**, à traiter lors du passage de chaque module
vers `src/modules/`. Elles n'ont pas été corrigées à la volée : chacune touche un module qui sera
réécrit, et les corriger isolément aurait produit du travail à jeter.

Les bugs situés dans le périmètre déjà migré (années académiques, authentification, couche API)
ont, eux, été corrigés — voir la section « Corrigés » en bas.

## Bugs bloquants — plantage à l'exécution

| Fichier | Anomalie |
|---|---|
| `views/etudiants/components/data-io/ExportData.vue:146-150` | `XLSX` est utilisé sans être importé. **L'export Excel des étudiants plante** dès qu'on clique dessus. Corriger en important depuis `@/shared/utils/exportExcel`. |
| `views/examens/calendrier/components/HeaderView.vue:42` | `fetchCalendarEvents` appelée mais jamais définie → plantage au clic. |
| `views/examens/salles/components/HeaderView.vue:40` | Idem. |
| `views/admin/DataTable.vue:40` | Erreur de syntaxe (`Unexpected token :`) — le fichier ne parse pas. Vérifier s'il est encore utilisé, sinon le supprimer. |

## Bugs de logique

| Fichier | Anomalie |
|---|---|
| `views/etudiants/components/data-io/ExportData.vue:127-131` | Une `ref()` est lue sans `.value` : la condition porte sur l'objet ref (toujours truthy) et non sur sa valeur. |
| `views/stracad/cycles/components/Tab/FilieresContent.vue:65` | `v-if` et `v-for` sur le même élément : le `v-if` est évalué à chaque itération et masque des lignes de façon imprévisible. |

## Composants vides

Neuf composants ont un `<template>` sans élément racine, donc ne rendent rien :
`deliberation/components/RapportsTab.vue`, `etudiants/components/Tab/ImportEtudiantsContent.vue`,
`examens/calendrier/components/tab/CalendrierRappel.vue`,
`finances/facturations/components/Tab/PaiementForm.vue` et `PaiementList.vue`,
`notes/components/semestre2/{devoir,rappel,session}-s2.vue`,
`notifications/notification.vue`,
`pedagogies/attributions/components/Tab/PresencesContent.vue`.

À trancher au cas par cas : écran réellement à implémenter, ou coquille à supprimer ?

## Duplication restante

- **`ItemActions.vue` existe en 8 exemplaires** (`components/ItemActions.vue`,
  `components/shared/itemAction.vue`, plus un par module). Ils divergent déjà. À factoriser dans
  `shared/components/` lors de la migration des modules concernés.
- **Les helpers `setCache`/`getCache` sont encore copiés dans 8 stores**
  (`academiqueStore/*`, `evaluationStore/*`). Remplacer par `shared/utils/cache`.
- **`formatDate` est redéfini dans une dizaine de composants.** Remplacer par
  `shared/utils/date`.

## Incohérence côté backend

L'API expose **deux vocabulaires de statut** pour les années académiques :

- `/annees`, `/annees/{id}` → `OUVERTE` | `PLANIFIEE` | `CLOTUREE`
- `/annees/history` → `active` | `en_preparation` | `terminee` | `archivee`

Le frontend absorbe l'écart dans `modules/annee-academique/constants.js`, mais l'harmonisation
gagnerait à se faire côté backend. À confirmer avec l'équipe API.

## Corrigés pendant la refonte

| Anomalie | Où |
|---|---|
| `serviceApi.post(url, data)` ignorait silencieusement le 3ᵉ argument de configuration : les en-têtes `multipart/form-data` des 4 endpoints d'import de fichiers n'étaient jamais transmis. | `api/config/serviceApi.js`, `core/api/httpClient.js` |
| `handleApiError()` défini mais jamais appelé — `errorStore` n'a donc jamais rien enregistré. | `api/config/serviceApi.js` |
| Aucun `router.beforeEach` : le `meta.requiresAuth` des routes n'était lu par personne, toute URL interne s'ouvrait sans session. | `core/router/guards.js` |
| `authStore.signupUser` appelait `notifyError(...)` sans l'avoir déclaré → `ReferenceError` à chaque échec d'inscription. | `core/auth/authStore.js` |
| `authStore.fetchCurrentUser` appelait `useRouter()` dans une action Pinia (hors `setup()`) → `undefined`, la redirection plantait précisément à l'expiration du jeton. | `core/auth/authStore.js` |
| Le cache local n'était pas purgé à la déconnexion : les données d'un utilisateur restaient lisibles par le suivant sur le même poste. | `core/auth/authStore.js` |
| L'édition d'une année n'a **jamais pré-rempli le formulaire** : la modale lisait `anneeToEdit` du header, tandis que la liste écrivait dans sa propre variable locale. Cliquer « Modifier » ouvrait un formulaire de création. | `modules/annee-academique/composables/useAnneeForm.js` |
| La modale de formulaire affichait « créée avec succès » puis se fermait après 1,2 s **sans vérifier que l'enregistrement avait réussi**. | `modules/annee-academique/components/AnneeFormModal.vue` |
| `AnneeItemActions` émettait `edit` et `add` sans les déclarer dans `defineEmits`. | `modules/annee-academique/components/AnneeItemActions.vue` |
| `messageStore.error(...)` appelé sur un objet `useNotifier()`, qui n'expose pas de méthode `error` → `TypeError` au lieu du message attendu. | `modules/annee-academique/components/tabs/StatistiquesTab.vue` |
| `JSON.parse` sans garde dans les helpers de cache : une entrée corrompue faisait remonter une `SyntaxError` jusqu'au composant. | `shared/utils/cache.js` |
| Code mort : `routes/main.js` (copie exacte de `routes/index.js`), `style1.css` (520 Ko jamais référencé), 5 fichiers `sample*.vue`, `result.js`. **25 493 lignes supprimées.** | — |
