import { defineStore } from 'pinia';
import { useNotificationStore } from '@/shared/stores/notificationStore';
import {
  addNoteEpreuve,
  addPieceCandidat,
  createCandidat,
  getCandidatsByConcours,
  getCandidatsByEpreuve,
  importCandidats,
  importNotes,
} from './api';

/**
 * Store des candidats.
 *
 * Pas de `createCrudStore` : il n'existe **pas de `GET /candidats`** — un
 * candidat n'a de sens que dans un concours. On les liste par concours.
 *
 * L'ancien `candidatStore.js` (153 lignes) appelait par ailleurs
 * `POST /candidats/import`, **une route commentée côté backend** : l'import par
 * lot répondait 404. Elle a été rétablie.
 */
export const useCandidatStore = defineStore('candidats', {
  state: () => ({
    /** @type {any[]} Candidats du concours consulté. */
    items: [],
    /** @type {string|null} */
    concoursId: null,
    /** @type {any|null} Compte rendu du dernier import. */
    importReport: null,
    loading: false,
    /** @type {import('@/core/api/apiError').ApiError|null} */
    error: null,
  }),

  getters: {
    /** @returns {(numTable: string) => any} */
    getByNumTable: (state) => (numTable) =>
      state.items.find((candidat) => candidat.num_table === numTable),
  },

  actions: {
    /**
     * Même contrat que `createCrudStore.run` : `undefined` en cas d'échec.
     *
     * @template T
     * @param {() => Promise<T>} call
     * @param {{success?: string, failure?: string, onSuccess?: (result: T) => void|Promise<void>}} [options]
     * @returns {Promise<T|undefined>}
     */
    async run(call, { success, failure, onSuccess } = {}) {
      const notifications = useNotificationStore();
      this.loading = true;
      this.error = null;

      try {
        const result = await call();
        await onSuccess?.(result);
        if (success) notifications.notifySuccess(success);
        return result;
      } catch (error) {
        this.error = error;
        notifications.notifyError(error, failure);
        return undefined;
      } finally {
        this.loading = false;
      }
    },

    /** @param {string} concoursId */
    async fetchByConcours(concoursId) {
      if (!concoursId) {
        this.items = [];
        this.concoursId = null;
        return undefined;
      }

      return this.run(() => getCandidatsByConcours(concoursId), {
        failure: 'Erreur lors du chargement des candidats.',
        onSuccess: (response) => {
          this.items = response.data ?? [];
          this.concoursId = concoursId;
        },
      });
    },

    /** @param {string} concoursId @param {string} epreuveCode */
    async fetchByEpreuve(concoursId, epreuveCode) {
      return this.run(() => getCandidatsByEpreuve(concoursId, epreuveCode), {
        failure: 'Erreur lors du chargement des candidats de l’épreuve.',
        onSuccess: (response) => {
          this.items = response.data ?? [];
          this.concoursId = concoursId;
        },
      });
    },

    /** @param {object} data */
    async create(data) {
      return this.run(() => createCandidat(data), {
        success: 'Candidat enregistré.',
        failure: 'Erreur lors de l’enregistrement du candidat.',
        onSuccess: () => this.fetchByConcours(data.concours_id ?? this.concoursId),
      });
    },

    /** @param {string} id @param {object} data */
    async addPiece(id, data) {
      return this.run(() => addPieceCandidat(id, data), {
        success: 'Pièce justificative ajoutée.',
        failure: 'Erreur lors de l’ajout de la pièce.',
      });
    },

    /**
     * Enregistre la note d'une épreuve.
     * Le candidat est désigné par son **numéro de table**, pas par son identifiant.
     * @param {string} numTable @param {object} data
     */
    async addNote(numTable, data) {
      return this.run(() => addNoteEpreuve(numTable, data), {
        success: 'Note enregistrée.',
        failure: 'Erreur lors de l’enregistrement de la note.',
      });
    },

    /** @param {File} file @param {string} concoursId */
    async importCandidatsFile(file, concoursId) {
      return this.run(() => importCandidats(file, concoursId), {
        success: 'Import des candidats terminé.',
        failure: 'Erreur lors de l’import des candidats.',
        onSuccess: async (response) => {
          this.importReport = response.data ?? null;
          await this.fetchByConcours(concoursId);
        },
      });
    },

    /** @param {File} file @param {string} concoursId */
    async importNotesFile(file, concoursId) {
      return this.run(() => importNotes(file, concoursId), {
        success: 'Import des notes terminé.',
        failure: 'Erreur lors de l’import des notes.',
        onSuccess: (response) => {
          this.importReport = response.data ?? null;
        },
      });
    },
  },
});
