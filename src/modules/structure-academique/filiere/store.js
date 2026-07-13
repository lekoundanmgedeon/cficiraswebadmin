import { createCrudStore } from '@/core/store/createCrudStore';
import {
  filieresResource,
  getFiliereOrganisation,
  getFiliereStats,
  getFilieresByCycle,
} from './api';

/** Store des filières. (Ancien `filiereStore.js` : 179 lignes.) */
export const useFiliereStore = createCrudStore({
  id: 'filieres',
  resource: filieresResource,
  label: 'Filière',
  cacheKey: 'filieres',

  state: () => ({
    /** @type {any[]} */
    organisation: [],
    /** @type {any|null} Statistiques de la filière consultée. */
    stats: null,
  }),

  getters: {
    /**
     * @deprecated Utiliser `items`. Alias pour les vues `classes` et `etudiants`
     * non encore migrées ; à retirer avec leur migration.
     */
    filieres: (state) => state.items,
  },

  actions: {
    /** @deprecated Utiliser `fetchAll()`. */
    fetchFilieres() {
      return this.fetchAll();
    },

    async fetchOrganisation() {
      return this.run(() => getFiliereOrganisation(), {
        failure: "Échec du chargement de l'organisation des filières.",
        onSuccess: (response) => {
          this.organisation = response.data ?? [];
        },
      });
    },

    /**
     * Charge les filières d'un cycle. Le résultat remplace `items` : cet appel
     * est une vue filtrée de la même collection, pas une collection distincte.
     * @param {string|number} cycleId
     */
    async fetchByCycle(cycleId) {
      return this.run(() => getFilieresByCycle(cycleId), {
        failure: 'Échec du chargement des filières du cycle.',
        onSuccess: (response) => {
          this.items = response.data ?? [];
        },
      });
    },

    /** @param {string|number} id */
    async fetchStats(id) {
      return this.run(() => getFiliereStats(id), {
        failure: 'Échec du chargement des statistiques.',
        onSuccess: (response) => {
          this.stats = response.data ?? null;
        },
      });
    },
  },
});
