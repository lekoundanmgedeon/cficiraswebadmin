import { createCrudStore } from '@/core/store/createCrudStore';
import {
  classesResource,
  assignModuleToClasse,
  getClasseModules,
  getClasseOccupancyRate,
  getClasseStudents,
  getClassesByFiliere,
  getClassesByNiveau,
  getClassesOrganisationTree,
  getGlobalInfrastructureKPIs,
} from './api';

/** Store des classes. (Ancien `classeStore.js` : 270 lignes.) */
export const useClasseStore = createCrudStore({
  id: 'classes',
  resource: classesResource,
  label: 'Classe',
  cacheKey: 'classes',

  state: () => ({
    /** @type {any|null} Arborescence d'organisation. */
    organisationTree: null,
    /** @type {any|null} Indicateurs globaux d'infrastructure. */
    analytics: null,
    /** @type {any[]} Étudiants de la classe consultée. */
    etudiants: [],
    /** @type {any[]} Modules de la classe consultée. */
    modules: [],
    /** @type {any|null} Taux de remplissage de la classe consultée. */
    occupancyRate: null,
  }),

  getters: {
    /** @deprecated Utiliser `items`. Alias pour les vues non encore migrées. */
    classes: (state) => state.items,
  },

  actions: {
    /** @deprecated Utiliser `fetchAll()`. */
    fetchClasses() {
      return this.fetchAll();
    },

    async fetchOrganisationTree() {
      return this.run(() => getClassesOrganisationTree(), {
        failure: "Échec du chargement de l'organisation des classes.",
        onSuccess: (response) => {
          this.organisationTree = response.data ?? null;
        },
      });
    },

    async fetchAnalytics() {
      return this.run(() => getGlobalInfrastructureKPIs(), {
        failure: 'Échec du chargement des indicateurs.',
        onSuccess: (response) => {
          this.analytics = response.data ?? null;
        },
      });
    },

    /** @param {string|number} niveauId */
    async fetchByNiveau(niveauId) {
      return this.run(() => getClassesByNiveau(niveauId), {
        failure: 'Échec du chargement des classes du niveau.',
        onSuccess: (response) => {
          this.items = response.data ?? [];
        },
      });
    },

    /** @param {string|number} filiereId */
    async fetchByFiliere(filiereId) {
      return this.run(() => getClassesByFiliere(filiereId), {
        failure: 'Échec du chargement des classes de la filière.',
        onSuccess: (response) => {
          this.items = response.data ?? [];
        },
      });
    },

    /** @param {string|number} id */
    async fetchStudents(id) {
      return this.run(() => getClasseStudents(id), {
        failure: 'Échec du chargement des étudiants de la classe.',
        onSuccess: (response) => {
          this.etudiants = response.data ?? [];
        },
      });
    },

    /** @param {string|number} id */
    async fetchModules(id) {
      return this.run(() => getClasseModules(id), {
        failure: 'Échec du chargement des modules de la classe.',
        onSuccess: (response) => {
          this.modules = response.data ?? [];
        },
      });
    },

    /** @param {string|number} id @param {object} data */
    async assignModule(id, data) {
      return this.run(() => assignModuleToClasse(id, data), {
        success: 'Module rattaché à la classe.',
        failure: 'Échec du rattachement du module.',
        onSuccess: () => this.fetchModules(id),
      });
    },

    /** @param {string|number} id */
    async fetchOccupancyRate(id) {
      return this.run(() => getClasseOccupancyRate(id), {
        failure: 'Échec du chargement du taux de remplissage.',
        onSuccess: (response) => {
          this.occupancyRate = response.data ?? null;
        },
      });
    },
  },
});
