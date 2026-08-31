# Guide : ajouter ou faire évoluer un module

Marche à suivre **dans ce dépôt**. Pour reconstruire ailleurs, voir
[RECONSTRUCTION.md](./RECONSTRUCTION.md).

Le module `structure-academique` sert de référence : en cas de doute sur une convention, l'ouvrir.
Pour un module à une seule entité, `bibliotheque` est le plus court à lire.

Prenons l'exemple d'un module **Stages**.

## 1. Vérifier avant de coder

**Avant tout code**, savoir ce que le serveur expose. Lint, tests et build ne parlent pas au
backend : ils passent au vert sur un module bâti sur des routes inexistantes.

```bash
cat ~/cfiprojects/cfibackend/src/routes/<domaine>/<entité>.routes.js
docker exec erp-db-demo psql -U erp_user -d erp_academique -c "\sv v_<vue>"
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3500/api/<domaine>/<chemin>
```

`404` = la route n'existe pas · `400` = elle existe et attend autre chose · `403` = elle existe et
votre rôle ne suffit pas.

Relever aussi les **contraintes `CHECK`** des tables touchées : ce sont elles qui donnent les
énumérations du `constants.js`. Aucune migration n'est versionnée pour la partie ancienne du
schéma — les deviner n'est pas une option.

## 2. Créer l'arborescence

Module à une entité :

```
src/modules/stages/
├── routes.js
├── api.js
├── store.js
├── constants.js
├── composables/useStageForm.js
├── components/
│   ├── StageTabs.vue
│   ├── StageFormModal.vue
│   └── tabs/ListeStagesTab.vue
└── views/StagesView.vue
```

Module à sous-domaines (plusieurs entités imbriquées, qui évoluent ensemble) :

```
src/modules/stages/
├── routes.js          ← les routes des deux écrans
├── constants.js       ← ce qui est commun aux deux
├── offre/    api.js · store.js · composables/ · components/ · views/
└── convention/ idem
```

**Conventions de nommage** — l'ancien code mélangeait `Tab/`, `tab/` et `tabs/`, `Modal/` et
`modal/`, `details/` et `Details/`. On s'en tient à :

- dossiers en **kebab-case**, au pluriel : `components/`, `tabs/`, `composables/`
- composants Vue en **PascalCase**, préfixés du nom du module : `StageTabs.vue`
- l'écran monté par le router est suffixé `View` : `StagesView.vue`

## 3. Déclarer les endpoints

Le CRUD vient de `createResource`. **N'écrire à la main que ce qui lui échappe.**

```js
// src/modules/stages/api.js
import { academiqueClient } from '@/core/api/clients';
import { createResource } from '@/core/api/createResource';

/** Endpoints des stages. */

const BASE_PATH = '/stages';

/** CRUD standard : list, getById, create, update, patch, remove. */
export const stagesResource = createResource(academiqueClient, BASE_PATH);

/** Conventions signées d'un stage. @param {string} id */
export const getConventions = (id) => academiqueClient.get(`${BASE_PATH}/${id}/conventions`);
```

Les méthodes renvoient **le corps déjà déballé** : pas de `response.data` à extraire. Les erreurs
remontent en `ApiError` — **ne pas les capturer ici**.

**Documenter le piège là où il mord.** Si le chemin est doublé, si un paramètre est obligatoire, si
un 200 peut cacher un échec : le commentaire va dans `api.js`, pas dans un document à part.

## 4. Créer le store

```js
// src/modules/stages/store.js
import { createCrudStore } from '@/core/store/createCrudStore';
import { stagesResource, getConventions } from './api';

export const useStageStore = createCrudStore({
  id: 'stages',
  resource: stagesResource,
  label: 'Stage',        // compose les messages : « Stage créé avec succès. »
  cacheKey: 'stages',    // optionnel : met la liste **non filtrée** en cache

  state: () => ({
    conventions: [],
  }),

  actions: {
    async fetchConventions(id) {
      return this.run(() => getConventions(id), {
        failure: 'Erreur lors de la récupération des conventions.',
        onSuccess: (response) => {
          this.conventions = response.data ?? [];
        },
      });
    },
  },
});
```

Vous obtenez `fetchAll`, `fetchById`, `create`, `update`, `remove`, `invalidate`, `run`, `loading`,
`error`, `isEmpty`, `count`, `getById`, le cache et les notifications.

**N'écrivez jamais ceci** — c'est exactement ce que la fabrique remplace :

```js
// ❌ À ne pas faire
async fetchStages() {
  this.loading = true;
  try {
    const response = await getStages();
    this.stages = response.data;
  } catch (error) {
    messageStore.notifyError('Erreur…');
  } finally {
    this.loading = false;
  }
}
```

### Quand la fabrique ne convient pas

Si l'objet **n'est pas une ressource REST** — il ne se liste que dans un contexte, il ne se crée
pas, il avance dans un circuit — écrire un `defineStore` classique **avec le même contrat `run`** :
`undefined` en cas d'échec, `loading`, `error`, notification. Six stores du dépôt sont dans ce cas
(`bulletin`, `note`, `scolarite`, `candidat`, `epreuve` de concours, `documents`) : les lire avant
d'en écrire un septième.

## 5. Écrire les composants

**Trois règles :**

1. **Un composant n'appelle jamais l'API directement.** Il passe par le store.
2. **Pas de `try/catch` autour d'une action de store** : elle a déjà notifié l'utilisateur. On
   teste sa valeur de retour — `undefined` signifie échec.
3. **Le formatage et les libellés ne vivent pas dans le composant** : dates via
   `shared/utils/date`, statuts via le `constants.js` du module.

```vue
<script setup>
import { onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { formatDate } from '@/shared/utils/date';
import { useStageStore } from '../../store';

const stageStore = useStageStore();
const { items: stages, loading } = storeToRefs(stageStore);

onMounted(() => stageStore.fetchAll());
</script>
```

**Onglets** : utiliser `AppTabs`, jamais les attributs `data-bs-toggle` de Bootstrap — ces derniers
montent **tous** les panneaux d'un coup, si bien que chaque onglet déclenche ses appels API au
chargement de la page, même sans être consulté.

**Pagination** : `usePagination` + `@/components/shared/Pagination.vue`. Tout tableau susceptible
de dépasser une trentaine de lignes.

**Export** : `useTableExport` — les colonnes se dérivent des lignes.

**Import** : `useImportFile`, avec le schéma déclaré dans le `constants.js` du module.

**Formulaire** : un `composables/use<Entité>Form.js` qui détient le formulaire, le mode et
l'ouverture de la modale. C'est ce qui évite le bug historique — une modale qui lisait une variable
et une liste qui écrivait dans une autre, si bien que « Modifier » ouvrait un formulaire de
création.

## 6. Déclarer les routes

```js
// src/modules/stages/routes.js
/** Routes du module Stages. */
export default [
  {
    path: '/stages',
    name: 'Stages',
    component: () => import('./views/StagesView.vue'),
    meta: { title: 'Stages' },
  },
];
```

Puis les brancher dans `core/router/index.js`, section « Routes des modules ». **C'est le seul
point du noyau à toucher.**

⚠️ N'ajouter `meta: { public: true }` que sur une route réellement accessible sans connexion : tout
le reste est protégé par défaut.

Si une URL disparaît, **la conserver en redirection** : un signet ou un lien envoyé par courriel
continue de fonctionner. Voir `documents/routes.js` et `etudiants/routes.js`.

## 7. Écrire les tests

Les tests **verrouillent les pièges, pas les évidences**. Colocalisés (`*.test.js`), à côté de ce
qu'ils couvrent.

Ce qui mérite un test :

- une normalisation de vocabulaire (deux dialectes ramenés à un) ;
- une conversion (chaîne servie par `pg`, date de classeur) ;
- une transition d'état interdite ;
- une projection dérivée non triviale (un getter d'agrégat) ;
- un comportement de pagination qui préserve une saisie en cours.

Ce qui n'en mérite pas : qu'un `computed` renvoie ce qu'on vient de lui donner.

## 8. Vérifier

```bash
npm run lint    # aucun avertissement ne doit provenir de votre module
npm test
npm run build   # valide que tous les imports se résolvent
```

**Puis exercer les endpoints pour de vrai** contre `localhost:3500`, avec un jeton. Les trois
commandes ci-dessus ne le font pas.

## 9. Consigner

- Écrire la **fiche du module** dans `docs/modules/<module>.md`, sur le même plan que les autres.
- L'ajouter à l'index `docs/modules/README.md` et au tableau de `docs/ARCHITECTURE.md` §3.
- Consigner l'évolution dans `docs/ETAT-REFACTORISATION.md`.
- Si le backend a dû être corrigé, l'ajouter au §10 de `docs/CONTRAT-API.md`.

## Checklist

- [ ] Routes du serveur lues, contraintes `CHECK` relevées, endpoints exercés avec un jeton
- [ ] Arborescence conforme, nommage conforme
- [ ] `createResource` pour le CRUD ; seuls les endpoints spécifiques écrits à la main
- [ ] `createCrudStore` — ou un store à contrat `run` équivalent si l'objet n'est pas REST
- [ ] Énumérations dans `constants.js`, avec la contrainte citée en commentaire
- [ ] Composants sans appel API, sans `try/catch`, sans formatage local
- [ ] `AppTabs`, `usePagination`, `useTableExport`, `useImportFile` — rien de recopié
- [ ] Routes branchées dans `core/router/index.js` ; anciennes URL redirigées
- [ ] Tests sur les pièges
- [ ] `npm run lint && npm test && npm run build`, **puis** vérification contre le backend
- [ ] Fiche de module écrite, index et documents de suivi à jour
