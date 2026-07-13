import { defineStore } from 'pinia';
import { useNotificationStore } from '@/shared/stores/notificationStore';
import { createEpreuve, deleteEpreuve, getEpreuvesByConcours, updateEpreuve } from './api';

/**
 * Store des épreuves de concours.
 *
 * Il n'est pas bâti sur `createCrudStore` : les épreuves ne forment pas une
 * ressource REST autonome. Elles se listent **par concours**
 * (`GET /concours/:concoursId/epreuves`) et se créent sous
 * `POST /concours/epreuves` — il n'existe pas de `GET /epreuves`.
 *
 * ⚠️ `updateEpreuve` et `deleteEpreuve` visaient un chemin comportant un
 * `/gestions/` en trop : ils répondaient **404**. Modifier ou supprimer une
 * épreuve n'a jamais fonctionné (voir `api.js`).
 */
export const useEpreuveConcoursStore = defineStore('epreuvesConcours', {
  state: () => ({
    /** @type {any[]} Épreuves du concours consulté. */
    items: [],
    /** @type {string|null} */
    concoursId: null,
    loading: false,
    /** @type {import('@/core/api/apiError').ApiError|null} */
    error: null,
  }),

  getters: {
    /** La somme des coefficients — un concours cohérent la garde constante. */
    totalCoefficients: (state) =>
      state.items.reduce((total, epreuve) => total + Number(epreuve.coefficient ?? 0), 0),

    /** Les épreuves dans l'ordre de passage. */
    ordonnees: (state) =>
      [...state.items].sort((a, b) => Number(a.ordre ?? 0) - Number(b.ordre ?? 0)),
  },

  actions: {
    /**
     * Même contrat que `createCrudStore.run` : renvoie `undefined` en cas
     * d'échec, ce sur quoi l'UI se repose pour ne fermer une modale que si
     * l'appel a réellement abouti.
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

      return this.run(() => getEpreuvesByConcours(concoursId), {
        failure: 'Erreur lors du chargement des épreuves.',
        onSuccess: (response) => {
          this.items = response.data ?? [];
          this.concoursId = concoursId;
        },
      });
    },

    /** @param {object} data */
    async create(data) {
      return this.run(() => createEpreuve(data), {
        success: 'Épreuve créée.',
        failure: "Erreur lors de la création de l'épreuve.",
        onSuccess: () => this.fetchByConcours(data.concours_id ?? this.concoursId),
      });
    },

    /** @param {string} id @param {object} data */
    async update(id, data) {
      return this.run(() => updateEpreuve(id, data), {
        success: 'Épreuve mise à jour.',
        failure: "Erreur lors de la mise à jour de l'épreuve.",
        onSuccess: () => this.fetchByConcours(this.concoursId),
      });
    },

    /** @param {string} id */
    async remove(id) {
      return this.run(() => deleteEpreuve(id), {
        success: 'Épreuve supprimée.',
        failure: "Erreur lors de la suppression de l'épreuve.",
        onSuccess: () => this.fetchByConcours(this.concoursId),
      });
    },
  },
});
