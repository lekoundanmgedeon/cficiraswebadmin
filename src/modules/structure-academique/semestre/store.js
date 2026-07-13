import { createCrudStore } from '@/core/store/createCrudStore';
import {
  semestresResource,
  changeSemestreStatus,
  getActiveSemestres,
  getSemestreAnalytics,
  getSemestresByAnnee,
  getSemestresOrganisation,
} from './api';

/** Store des semestres. (Ancien `semestreStore.js` : 215 lignes.) */
export const useSemestreStore = createCrudStore({
  id: 'semestres',
  resource: semestresResource,
  label: 'Semestre',
  cacheKey: 'semestres',

  state: () => ({
    /** @type {any[]} Semestres actuellement actifs. */
    actifs: [],
    /** @type {any[]} */
    organisation: [],
    /** @type {any|null} Tableau de bord analytique. */
    analytics: null,
  }),

  getters: {
    /** @deprecated Utiliser `items`. Alias pour les vues non encore migrées. */
    semestres: (state) => state.items,
  },

  actions: {
    /** @deprecated Utiliser `fetchAll()`. */
    fetchSemestres() {
      return this.fetchAll();
    },

    async fetchActifs() {
      return this.run(() => getActiveSemestres(), {
        failure: 'Échec du chargement des semestres actifs.',
        onSuccess: (response) => {
          this.actifs = response.data ?? [];
        },
      });
    },

    /** @param {string|number} anneeId */
    async fetchByAnnee(anneeId) {
      return this.run(() => getSemestresByAnnee(anneeId), {
        failure: "Échec du chargement des semestres de l'année.",
        onSuccess: (response) => {
          this.items = response.data ?? [];
        },
      });
    },

    async fetchOrganisation() {
      return this.run(() => getSemestresOrganisation(), {
        failure: "Échec du chargement de l'organisation des semestres.",
        onSuccess: (response) => {
          this.organisation = response.data ?? [];
        },
      });
    },

    /** @param {string} period */
    async fetchAnalytics(period) {
      return this.run(() => getSemestreAnalytics(period), {
        failure: 'Échec du chargement des analyses.',
        onSuccess: (response) => {
          this.analytics = response.data ?? null;
        },
      });
    },

    /** @param {string|number} id @param {object} data */
    async changeStatus(id, data) {
      return this.run(() => changeSemestreStatus(id, data), {
        success: 'Statut du semestre mis à jour.',
        failure: 'Échec de la mise à jour du statut.',
        onSuccess: () => this.invalidate(),
      });
    },
  },
});
