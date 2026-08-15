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
} from './api';

/** Store des classes. (Ancien `classeStore.js` : 270 lignes.) */
export const useClasseStore = createCrudStore({
  id: 'classes',
  resource: classesResource,
  label: 'Classe',
  cacheKey: 'classes',

  state: () => ({
    /** @type {any[]} Une ligne par classe (`v_organisation_classes`). */
    organisationTree: [],
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

    /**
     * Une ligne par classe, avec cycle, filière, niveau, effectif et capacité.
     *
     * C'est la lecture de référence des onglets « Organisation » et
     * « Statistiques », ici **et** dans l'écran des cycles : `v_organisation_classes`
     * est groupée par classe, donc sa capacité est juste. L'action
     * `fetchAnalytics()` a été retirée pour cette raison — sa vue
     * (`v_dashboard_global_classe`) sommait `capacite_max` après une jointure sur
     * `inscriptions`, voir la note dans `api.js`.
     */
    async fetchOrganisationTree() {
      return this.run(() => getClassesOrganisationTree(), {
        failure: "Échec du chargement de l'organisation des classes.",
        onSuccess: (response) => {
          this.organisationTree = response.data ?? [];
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
