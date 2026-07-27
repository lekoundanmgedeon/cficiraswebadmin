import { defineStore } from 'pinia';
import { useNotificationStore } from '@/shared/stores/notificationStore';
import {
  getAttributions,
  getDistributionCycles,
  getEnseignants,
  getInfrastructureKpi,
  getOrganisationFilieres,
} from './api';

/** `pg` sert ses `COUNT`, `SUM` et `NUMERIC` en chaînes. Sans conversion, une
 * addition produit une concaténation et Chart.js reçoit un axe vide. */
const nombre = (valeur) => Number(valeur ?? 0) || 0;

/**
 * Store du tableau de bord.
 *
 * Lecture seule : le dashboard n'écrit rien. Il ne porte pas non plus les
 * agrégats financiers — ceux-ci vivent dans `finances/stores/rapports.js`, que
 * les onglets consomment directement. La dépendance `dashboard → finances` est
 * dirigée et déclarée ; l'inverse n'existe pas.
 */
export const useDashboardStore = defineStore('dashboard', {
  state: () => ({
    infrastructure: {
      total_classes: 0,
      capacite_totale_etablissement: 0,
      total_etudiants_inscrits: 0,
      places_disponibles_globales: 0,
    },
    /** @type {Array<{cycle_id: string, cycle_code: string, diplome: string, nb_etudiants: number}>} */
    cycles: [],
    /** @type {Array<{id: string, filiere: string, responsable: string, effectif: number, capacite: number, taux: number, statut: string}>} */
    filieres: [],
    /** @type {any[]} */
    enseignants: [],
    /** @type {any[]} */
    attributions: [],
    loading: false,
    /** @type {import('@/core/api/apiError').ApiError|null} */
    error: null,
  }),

  getters: {
    /** Taux de remplissage de l'établissement, en pourcentage. */
    tauxRemplissage: (state) => {
      const { capacite_totale_etablissement: capacite, total_etudiants_inscrits: inscrits } =
        state.infrastructure;
      return capacite > 0 ? (inscrits / capacite) * 100 : 0;
    },

    /** Cycles réellement peuplés — un cycle vide n'a rien à dire sur un graphique. */
    cyclesPeuples: (state) => state.cycles.filter((cycle) => cycle.nb_etudiants > 0),

    /** Filières triées par effectif décroissant. */
    filieresParEffectif: (state) => [...state.filieres].sort((a, b) => b.effectif - a.effectif),

    /** Nombre de formateurs au répertoire. */
    nbEnseignants: (state) => state.enseignants.length,
  },

  actions: {
    /**
     * @template T
     * @param {() => Promise<T>} call
     * @param {{failure?: string, onSuccess?: (r: T) => void}} [options]
     */
    async run(call, { failure, onSuccess } = {}) {
      const notifications = useNotificationStore();
      this.loading = true;
      this.error = null;

      try {
        const result = await call();
        await onSuccess?.(result);
        return result;
      } catch (error) {
        this.error = error;
        notifications.notifyError(error, failure);
        return undefined;
      } finally {
        this.loading = false;
      }
    },

    async fetchInfrastructure() {
      return this.run(() => getInfrastructureKpi(), {
        failure: "Erreur lors du chargement des indicateurs d'établissement.",
        onSuccess: (result) => {
          const kpi = result.data ?? {};
          this.infrastructure = {
            total_classes: nombre(kpi.total_classes),
            capacite_totale_etablissement: nombre(kpi.capacite_totale_etablissement),
            total_etudiants_inscrits: nombre(kpi.total_etudiants_inscrits),
            places_disponibles_globales: nombre(kpi.places_disponibles_globales),
          };
        },
      });
    },

    async fetchCycles() {
      return this.run(() => getDistributionCycles(), {
        failure: 'Erreur lors du chargement de la répartition par cycle.',
        onSuccess: (result) => {
          this.cycles = (result.data ?? []).map((cycle) => ({
            ...cycle,
            nb_etudiants: nombre(cycle.nb_etudiants),
          }));
        },
      });
    },

    async fetchFilieres() {
      return this.run(() => getOrganisationFilieres(), {
        failure: 'Erreur lors du chargement des filières.',
        onSuccess: (result) => {
          this.filieres = (result.data ?? []).map((filiere) => ({
            ...filiere,
            effectif: nombre(filiere.effectif),
            capacite: nombre(filiere.capacite),
            taux: nombre(filiere.taux),
          }));
        },
      });
    },

    async fetchEnseignants() {
      return this.run(() => getEnseignants(), {
        failure: 'Erreur lors du chargement des formateurs.',
        onSuccess: (result) => {
          this.enseignants = result.data ?? [];
        },
      });
    },

    async fetchAttributions() {
      return this.run(() => getAttributions(), {
        failure: 'Erreur lors du chargement des attributions de cours.',
        onSuccess: (result) => {
          this.attributions = (result.data ?? []).map((ligne) => ({
            ...ligne,
            heures: nombre(ligne.heures),
          }));
        },
      });
    },

    /** Les deux lectures dont dépend l'accueil, en parallèle. */
    async fetchVueEnsemble() {
      await Promise.all([this.fetchInfrastructure(), this.fetchCycles()]);
    },
  },
});
