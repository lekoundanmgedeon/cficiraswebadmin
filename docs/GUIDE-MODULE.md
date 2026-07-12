# Guide : ajouter ou migrer un module

Marche à suivre pour créer un module métier, ou faire migrer un module existant depuis l'ancienne
arborescence. Le module `annee-academique` sert de référence : en cas de doute, ouvrez-le.

Prenons l'exemple d'un module **Cycles**.

## 1. Créer l'arborescence

```
src/modules/cycle/
├── api/cycleApi.js
├── components/
│   ├── CycleHeader.vue
│   ├── CycleTabs.vue
│   ├── CycleFormModal.vue
│   └── tabs/ListeCyclesTab.vue
├── composables/          (si besoin)
├── store/cycleStore.js
├── views/CycleView.vue
├── constants.js
└── routes.js
```

**Conventions de nommage** — l'ancien code mélangeait `Tab/`, `tab/` et `tabs/`, `Modal/` et
`modal/`, `details/` et `Details/`. On s'en tient à :

- dossiers en **kebab-case** au pluriel : `components/`, `tabs/`, `composables/`
- composants Vue en **PascalCase**, préfixés du nom du module : `CycleHeader.vue`
- l'écran monté par le router est suffixé `View` : `CycleView.vue`

## 2. Déclarer les endpoints

Le CRUD vient de `createResource`. N'écrivez à la main que ce qui lui échappe.

```js
// src/modules/cycle/api/cycleApi.js
import { academiqueClient } from '@/core/api/clients';
import { createResource } from '@/core/api/createResource';

const BASE_PATH = '/cycles';

export const cyclesResource = createResource(academiqueClient, BASE_PATH);

// Uniquement les endpoints spécifiques :
export const getCycleFilieres = (id) => academiqueClient.get(`${BASE_PATH}/${id}/filieres`);
export const getCycleArchitecture = () => academiqueClient.get(`${BASE_PATH}/tree/filieres`);
```

Les méthodes renvoient **directement le corps de la réponse** : pas de `response.data` à
déballer. Les erreurs remontent en `ApiError` — ne les capturez pas ici.

## 3. Créer le store

```js
// src/modules/cycle/store/cycleStore.js
import { createCrudStore } from '@/core/store/createCrudStore';
import { cyclesResource, getCycleFilieres } from '../api/cycleApi';

export const useCycleStore = createCrudStore({
  id: 'cycles',
  resource: cyclesResource,
  label: 'Cycle',          // sert à composer les messages : « Cycle créé avec succès. »
  cacheKey: 'cycles',      // optionnel : met la liste en cache (TTL 5 min)

  state: () => ({
    filieres: [],
  }),

  actions: {
    async fetchFilieres(id) {
      return this.run(() => getCycleFilieres(id), {
        failure: 'Erreur lors de la récupération des filières.',
        onSuccess: (response) => {
          this.filieres = response.data ?? [];
        },
      });
    },
  },
});
```

Vous obtenez gratuitement `fetchAll`, `fetchById`, `create`, `update`, `remove`, `invalidate`,
`loading`, `error`, le cache et les notifications.

**N'écrivez jamais ceci** — c'est exactement ce que la fabrique remplace :

```js
// ❌ À ne pas faire
async fetchCycles() {
  this.loading = true;
  try {
    const response = await getCycles();
    this.cycles = response.data;
  } catch (error) {
    messageStore.notifyError('Erreur…');
  } finally {
    this.loading = false;
  }
}
```

## 4. Écrire les composants

Trois règles :

1. **Un composant n'appelle jamais l'API directement.** Il passe par le store. (Six vues de
   l'ancien code violaient cette règle ; elles sont dans la liste de migration.)
2. **Pas de `try/catch` autour d'une action de store** : elle a déjà notifié l'utilisateur.
   Testez sa valeur de retour — `undefined` signifie échec.
3. **Le formatage et les libellés ne vivent pas dans le composant.** Les dates passent par
   `shared/utils/date`, les statuts par le `constants.js` du module.

```vue
<script setup>
import { onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { formatDate } from '@/shared/utils/date';
import { useCycleStore } from '../../store/cycleStore';

const cycleStore = useCycleStore();
const { items: cycles, loading } = storeToRefs(cycleStore);

onMounted(() => cycleStore.fetchAll());
</script>
```

Pour les onglets, utilisez `<component :is>` plutôt que les attributs `data-bs-toggle` de
Bootstrap : ces derniers montent **tous** les panneaux d'un coup, si bien que chaque onglet
déclenche ses appels API au chargement de la page, même sans être consulté. Voir
`AnneeTabs.vue`.

## 5. Déclarer les routes

```js
// src/modules/cycle/routes.js
export default [
  {
    path: '/cycles-academiques',
    name: 'CyclesAcademiques',
    component: () => import('./views/CycleView.vue'),
    meta: { title: 'Cycles académiques' },
  },
];
```

Puis branchez-les dans `core/router/index.js` (section « Routes des modules migrés ») et retirez
l'entrée correspondante de l'ancien fichier `src/routes/*.routes.js`.

⚠️ N'ajoutez `meta: { public: true }` que sur une route réellement accessible sans connexion :
tout le reste est protégé par défaut.

## 6. Vérifier

```bash
npm run lint    # aucun avertissement ne doit provenir de votre module
npm test
npm run build   # valide que tous les imports se résolvent
```

## Checklist de migration d'un module existant

- [ ] Créer `src/modules/<module>/` selon l'arborescence ci-dessus
- [ ] Déplacer les endpoints ; remplacer le CRUD écrit à la main par `createResource`
- [ ] Réécrire le store avec `createCrudStore` ; supprimer les helpers `setCache`/`getCache`
      copiés localement (ils sont dans `shared/utils/cache`)
- [ ] Déplacer les composants ; supprimer les `formatDate` / `mapStatut` locaux
- [ ] Remplacer les onglets Bootstrap par `<component :is>`
- [ ] Déplacer les routes ; les retirer de l'ancien fichier `src/routes/`
- [ ] Recâbler les imports des consommateurs restants (`grep -rn "ancien/chemin" src/`)
- [ ] **Supprimer les anciens fichiers** — une migration qui laisse l'ancien code derrière elle
      double la dette au lieu de la réduire
- [ ] `npm run lint && npm test && npm run build`
