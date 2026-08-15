import { createCrudStore } from '@/core/store/createCrudStore';
import {
  cyclesResource,
  getCycleArchitecture,
  getCycleDistributionStats,
  getCycleFilieres,
} from './api';

/**
 * Store des cycles académiques.
 *
 * L'ancien `stores/academiqueStore/cycleStore.js` faisait 200 lignes, dont une
 * copie locale des helpers de cache et sept fois la même séquence
 * `loading`/`try`/`notifyError`/`finally`.
 */
export const useCycleStore = createCrudStore({
  id: 'cycles',
  resource: cyclesResource,
  label: 'Cycle',
  cacheKey: 'cycles',

  state: () => ({
    /** @type {any[]} Filières du cycle consulté. */
    filieres: [],
    /** @type {any|null} Arborescence cycles → filières. */
    architecture: null,
    /** @type {any[]} Répartition des effectifs par cycle (`v_distribution_cycle`). */
    stats: [],
  }),

  getters: {
    /**
     * @deprecated Utiliser `items`. Alias de compatibilité pour les vues
     * `filieres` non encore migrées ; à retirer avec leur migration.
     */
    cycles: (state) => state.items,
  },

  actions: {
    /** @deprecated Utiliser `fetchAll()`. */
    fetchCycles() {
      return this.fetchAll();
    },

    /** @param {string|number} id */
    async fetchFilieres(id) {
      return this.run(() => getCycleFilieres(id), {
        failure: 'Échec du chargement des filières du cycle.',
        onSuccess: (response) => {
          this.filieres = response.data ?? [];
        },
      });
    },

    async fetchArchitecture() {
      return this.run(() => getCycleArchitecture(), {
        failure: "Échec du chargement de l'architecture des cycles.",
        onSuccess: (response) => {
          this.architecture = response.data ?? null;
        },
      });
    },

    /**
     * Répartition des effectifs par cycle.
     *
     * `v_distribution_cycle` compte des étudiants **distincts** ; la somme des
     * effectifs de classes, elle, compte des inscriptions. Les deux chiffres
     * cohabitent dans l'onglet « Statistiques » : ils ne répondent pas à la
     * même question.
     *
     * L'action `fetchOrganisation()` a été retirée : sa vue
     * (`v_organisation_cycles`) sert une capacité gonflée par un fan-out de
     * jointure — voir `useCycleStatistiques` et la note dans `api.js`.
     */
    async fetchDistributionStats() {
      return this.run(() => getCycleDistributionStats(), {
        failure: 'Échec du chargement des statistiques.',
        onSuccess: (response) => {
          this.stats = response.data ?? [];
        },
      });
    },
  },
});
