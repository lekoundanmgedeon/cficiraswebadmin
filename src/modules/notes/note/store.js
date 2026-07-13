import { defineStore } from 'pinia';
import { useNotificationStore } from '@/shared/stores/notificationStore';
import {
  getNotesByEtudiant,
  getNotesByEvaluation,
  publierNotesEvaluation,
  updateNote,
} from './api';

/**
 * Store des notes.
 *
 * Pas de `createCrudStore` : les notes ne forment pas une ressource REST. Elles
 * se listent **par évaluation** et il n'existe **pas de `POST`** — elles
 * préexistent, et l'application ne fait que les corriger.
 *
 * L'ancien `stores/evaluationStore/noteStore.js` existait et fonctionnait — mais
 * **aucune vue ne l'appelait**, et de toute façon ses quatre appels d'API
 * répondaient **404** (mauvais chemins, voir `api.js`).
 */
export const useNoteStore = defineStore('notes', {
  state: () => ({
    /** @type {any[]} Grille de notes de l'évaluation consultée. */
    items: [],
    /** @type {string|null} */
    evaluationId: null,
    loading: false,
    /** @type {import('@/core/api/apiError').ApiError|null} */
    error: null,
  }),

  getters: {
    /** Notes réellement saisies (une note peut être nulle). */
    saisies: (state) => state.items.filter((note) => note.valeur !== null && note.valeur !== ''),

    /** Moyenne de l'évaluation, sur les seules notes saisies. */
    moyenne() {
      const valeurs = this.saisies
        .map((note) => Number(note.valeur))
        .filter((v) => !Number.isNaN(v));
      if (valeurs.length === 0) return null;
      return valeurs.reduce((somme, v) => somme + v, 0) / valeurs.length;
    },

    /** Une évaluation est publiée dès lors que toutes ses notes le sont. */
    estPubliee: (state) =>
      state.items.length > 0 &&
      state.items.every((note) => String(note.statut).toUpperCase() === 'PUBLIEE'),
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

    /** @param {string} evaluationId */
    async fetchByEvaluation(evaluationId) {
      if (!evaluationId) {
        this.items = [];
        this.evaluationId = null;
        return undefined;
      }

      return this.run(() => getNotesByEvaluation(evaluationId), {
        failure: 'Erreur lors du chargement des notes.',
        onSuccess: (response) => {
          this.items = response.data ?? [];
          this.evaluationId = evaluationId;
        },
      });
    },

    /** @param {string} etudiantId @param {string} semestreId */
    async fetchByEtudiant(etudiantId, semestreId) {
      return this.run(() => getNotesByEtudiant(etudiantId, semestreId), {
        failure: 'Erreur lors du chargement des notes de l’étudiant.',
        onSuccess: (response) => {
          this.items = response.data ?? [];
        },
      });
    },

    /**
     * Met à jour une note. La valeur doit rester dans [0, 20] — contrainte de la
     * base, que le contrôleur vérifie aussi (400 sinon).
     *
     * @param {string} id
     * @param {{valeur: number, commentaire?: string|null}} data
     */
    async update(id, data) {
      return this.run(() => updateNote(id, data), {
        failure: 'Erreur lors de l’enregistrement de la note.',
      });
    },

    /** Publie toutes les notes de l'évaluation consultée. */
    async publier() {
      if (!this.evaluationId) return undefined;

      const evaluationId = this.evaluationId;

      return this.run(() => publierNotesEvaluation(evaluationId), {
        success: 'Notes publiées.',
        failure: 'Erreur lors de la publication des notes.',
        onSuccess: () => this.fetchByEvaluation(evaluationId),
      });
    },
  },
});
