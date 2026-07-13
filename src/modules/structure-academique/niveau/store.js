import { createCrudStore } from '@/core/store/createCrudStore';
import { niveauxResource, getNiveauEffectifs, getNiveauxByFiliere } from './api';

/** Store des niveaux. (Ancien `niveauStore.js` : 161 lignes.) */
export const useNiveauStore = createCrudStore({
  id: 'niveaux',
  resource: niveauxResource,
  label: 'Niveau',
  cacheKey: 'niveaux',

  state: () => ({
    /** @type {any|null} Effectifs du niveau consulté. */
    effectifs: null,
  }),

  getters: {
    /** @deprecated Utiliser `items`. Alias pour les vues non encore migrées. */
    niveaux: (state) => state.items,
  },

  actions: {
    /** @deprecated Utiliser `fetchAll()`. */
    fetchNiveaux() {
      return this.fetchAll();
    },

    /** @param {string|number} filiereId */
    async fetchByFiliere(filiereId) {
      return this.run(() => getNiveauxByFiliere(filiereId), {
        failure: 'Échec du chargement des niveaux de la filière.',
        onSuccess: (response) => {
          this.items = response.data ?? [];
        },
      });
    },

    /** @param {string|number} id */
    async fetchEffectifs(id) {
      return this.run(() => getNiveauEffectifs(id), {
        failure: 'Échec du chargement des effectifs.',
        onSuccess: (response) => {
          this.effectifs = response.data ?? null;
        },
      });
    },
  },
});
