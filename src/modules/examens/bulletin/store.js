import { defineStore } from 'pinia';
import { useNotificationStore } from '@/shared/stores/notificationStore';
import { getBulletinsByClasse, publierBulletinsClasse, updateDecisionJury } from './api';

/**
 * Store des bulletins.
 *
 * Il n'est pas bâti sur `createCrudStore` : les bulletins ne forment pas une
 * ressource REST. Ils ne se listent qu'**au sein d'une classe**
 * (`GET /resultats/classes/:classeId/bulletins`) et ne se créent pas depuis
 * l'application — ils résultent des notes.
 *
 * L'ancien `resultStore.js` existait et fonctionnait ; **aucune vue ne
 * l'appelait**.
 */
export const useBulletinStore = defineStore('bulletins', {
  state: () => ({
    /** @type {any[]} Bulletins de la classe consultée. */
    items: [],
    /** @type {string|null} */
    classeId: null,
    loading: false,
    /** @type {import('@/core/api/apiError').ApiError|null} */
    error: null,
  }),

  actions: {
    /**
     * Même contrat que `createCrudStore.run` : renvoie `undefined` en cas
     * d'échec.
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

    /** @param {string} classeId */
    async fetchByClasse(classeId) {
      if (!classeId) {
        this.items = [];
        this.classeId = null;
        return undefined;
      }

      return this.run(() => getBulletinsByClasse(classeId), {
        failure: 'Erreur lors du chargement des bulletins.',
        onSuccess: (response) => {
          this.items = response.data ?? [];
          this.classeId = classeId;
        },
      });
    },

    /**
     * Enregistre la décision du jury sur un bulletin.
     * @param {string} id @param {object} data
     */
    async setDecision(id, data) {
      return this.run(() => updateDecisionJury(id, data), {
        success: 'Décision du jury enregistrée.',
        failure: "Erreur lors de l'enregistrement de la décision.",
        onSuccess: () => this.fetchByClasse(this.classeId),
      });
    },

    /** Publie officiellement les bulletins de la classe consultée. */
    async publier() {
      if (!this.classeId) return undefined;

      const classeId = this.classeId;

      return this.run(() => publierBulletinsClasse(classeId), {
        success: 'Bulletins publiés.',
        failure: 'Erreur lors de la publication des bulletins.',
        onSuccess: () => this.fetchByClasse(classeId),
      });
    },
  },
});
