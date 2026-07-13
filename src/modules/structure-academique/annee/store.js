import { createCrudStore } from '@/core/store/createCrudStore';
import {
  anneesResource,
  activateAnnee,
  exportAnneeData,
  getAnneeStats,
  getAnneesHistory,
  getCurrentAnnee,
} from './api';

/**
 * Store des années académiques.
 *
 * Le CRUD, le cache, l'état `loading` et les notifications viennent de
 * `createCrudStore`. Ce fichier ne décrit que ce qui est propre au métier :
 * l'historique, l'année courante, les statistiques et l'activation.
 *
 * (L'ancien `stores/academiqueStore/anneStore.js` faisait 190 lignes pour le
 * même périmètre, dont ~130 de try/catch/loading répétés.)
 */
export const useAnneeStore = createCrudStore({
  id: 'annees',
  resource: anneesResource,
  label: 'Année académique',
  cacheKey: 'annees',

  state: () => ({
    /** @type {any[]} Années enrichies d'effectifs, renvoyées par /history. */
    history: [],
    /** @type {any|null} Année académique en cours. */
    current: null,
    /** @type {any|null} Statistiques de l'année consultée. */
    stats: null,
  }),

  getters: {
    /** L'année marquée active dans la liste, si elle est chargée. */
    activeAnnee: (state) => state.items.find((annee) => annee.est_active) ?? null,

    // ── Alias de compatibilité ────────────────────────────────────────────
    // Six vues non encore migrées (semestres, sessions d'examen, concours,
    // étudiants) consomment ce store sous ses anciens noms. Ces alias les
    // gardent fonctionnelles pendant la migration et disparaîtront avec le
    // dernier de leurs appelants.

    /** @deprecated Utiliser `items`. */
    anneesAcademiques: (state) => state.items,

    /** @deprecated Utiliser `current`. */
    anneeAcademique: (state) => state.current,
  },

  actions: {
    async fetchHistory() {
      return this.run(() => getAnneesHistory(), {
        failure: "Erreur lors de la récupération de l'historique.",
        onSuccess: (response) => {
          this.history = response.data ?? [];
        },
      });
    },

    async fetchCurrent() {
      return this.run(() => getCurrentAnnee(), {
        failure: "Erreur lors de la récupération de l'année courante.",
        onSuccess: (response) => {
          this.current = response.data ?? null;
        },
      });
    },

    /** @param {string|number} id */
    async fetchStats(id) {
      return this.run(() => getAnneeStats(id), {
        failure: 'Erreur lors de la récupération des statistiques.',
        onSuccess: (response) => {
          this.stats = response.data ?? null;
        },
      });
    },

    /**
     * Charge les statistiques de l'année courante.
     *
     * Les statistiques ne sont accessibles que par identifiant d'année : il faut
     * donc connaître l'année courante avant de les demander. L'onglet
     * Statistiques enchaînait ces deux appels à chaque montage. On réutilise ici
     * l'année déjà en mémoire quand elle est connue, ce qui ramène le second
     * affichage de l'onglet de deux requêtes à une seule.
     */
    async loadCurrentStats() {
      if (!this.current) {
        await this.fetchCurrent();
      }
      if (!this.current?.id) {
        // Pas d'année active : l'utilisateur doit en ouvrir une. Ce n'est pas
        // une erreur technique, d'où l'avertissement plutôt qu'une erreur.
        this.error = null;
        return undefined;
      }
      return this.fetchStats(this.current.id);
    },

    /** @param {string|number} id */
    async activate(id) {
      return this.run(() => activateAnnee(id), {
        success: 'Année académique activée avec succès.',
        failure: "Erreur lors de l'activation.",
        onSuccess: async () => {
          // L'activation change `est_active` sur deux années (l'ancienne et la
          // nouvelle) : la liste en cache est périmée.
          await this.invalidate();
          this.current = null;
        },
      });
    },

    /** @param {string|number} id */
    async exportData(id) {
      return this.run(() => exportAnneeData(id), {
        success: 'Exportation réussie.',
        failure: "Erreur lors de l'exportation.",
      });
    },

    // ── Alias de compatibilité (voir la note dans `getters`) ──────────────

    /** @deprecated Utiliser `fetchAll()`. */
    fetchAnneesAcademiques() {
      return this.fetchAll();
    },

    /** @deprecated Utiliser `fetchCurrent()`. */
    fetchCurrentAnnee() {
      return this.fetchCurrent();
    },
  },
});
