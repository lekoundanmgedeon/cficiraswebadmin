import { defineStore } from 'pinia';
import { useNotificationStore } from '@/shared/stores/notificationStore';
import {
  changerStatutDemande,
  createDemande,
  deleteDemande,
  getDemandes,
  getStatistiquesDemandes,
  getTypesDocuments,
} from './api';
import { estClose } from './constants';

/**
 * Store du guichet des documents.
 *
 * Pas de `createCrudStore` : une demande ne se modifie pas comme une ressource
 * REST ordinaire. On la dépose, puis on la fait **avancer** dans un circuit —
 * il n'existe ni `PUT` ni édition libre, et c'est volontaire : une demande
 * délivrée ne se réécrit pas.
 */
export const useDocumentStore = defineStore('documents', {
  state: () => ({
    /** @type {any[]} */
    items: [],
    /** @type {any[]} Catalogue des documents délivrables. */
    types: [],
    /** @type {object|null} */
    statistiques: null,
    loading: false,
    /** @type {import('@/core/api/apiError').ApiError|null} */
    error: null,
  }),

  getters: {
    /** Demandes encore dans le circuit. */
    enCours: (state) => state.items.filter((demande) => !estClose(demande.statut)),

    /** Demandes sorties du circuit — délivrées ou rejetées. */
    traitees: (state) => state.items.filter((demande) => estClose(demande.statut)),

    /** En retard : l'échéance est dépassée et le document n'est pas sorti. */
    enRetard: (state) => state.items.filter((demande) => demande.en_retard),

    /** Urgences en attente : elles passent avant le reste. */
    urgentes: (state) =>
      state.items.filter((demande) => demande.urgence && !estClose(demande.statut)),

    /** @returns {(code: string) => any} */
    typeParCode: (state) => (code) => state.types.find((type) => type.code === code),
  },

  actions: {
    /**
     * Même contrat que `createCrudStore.run` : `undefined` en cas d'échec.
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

    /** @param {object} [params] */
    async fetchAll(params) {
      return this.run(() => getDemandes(params), {
        failure: 'Erreur lors du chargement des demandes.',
        onSuccess: (response) => {
          this.items = response.data ?? [];
        },
      });
    },

    async fetchTypes() {
      // Le catalogue change rarement : inutile de le relire à chaque onglet.
      if (this.types.length > 0) return this.types;

      return this.run(() => getTypesDocuments(), {
        failure: 'Erreur lors du chargement des types de documents.',
        onSuccess: (response) => {
          this.types = response.data ?? [];
        },
      });
    },

    async fetchStatistiques() {
      return this.run(() => getStatistiquesDemandes(), {
        failure: 'Erreur lors du chargement des statistiques du guichet.',
        onSuccess: (response) => {
          this.statistiques = response.data ?? null;
        },
      });
    },

    /** @param {object} data */
    async create(data) {
      const response = await this.run(() => createDemande(data), {
        failure: "Erreur lors de l'enregistrement de la demande.",
      });

      if (response === undefined) return undefined;

      // Le message du serveur porte le numéro attribué : le reprendre tel quel
      // évite d'en fabriquer un second, qui pourrait diverger.
      const notifications = useNotificationStore();
      notifications.notifySuccess(response.message ?? 'Demande enregistrée.');

      await Promise.all([this.fetchAll(), this.fetchStatistiques()]);
      return response.data ?? response;
    },

    /**
     * @param {string} id
     * @param {'EN_TRAITEMENT'|'PRETE'|'DELIVREE'|'REJETEE'} statut
     * @param {{commentaire?: string, motif_rejet?: string}} [donnees]
     */
    async changerStatut(id, statut, donnees = {}) {
      return this.run(() => changerStatutDemande(id, statut, donnees), {
        success: 'Demande mise à jour.',
        failure: 'Erreur lors du changement de statut.',
        onSuccess: async () => {
          await Promise.all([this.fetchAll(), this.fetchStatistiques()]);
        },
      });
    },

    /** @param {string} id */
    async remove(id) {
      return this.run(() => deleteDemande(id), {
        success: 'Demande supprimée.',
        failure: 'Erreur lors de la suppression de la demande.',
        onSuccess: async () => {
          await Promise.all([this.fetchAll(), this.fetchStatistiques()]);
        },
      });
    },
  },
});
