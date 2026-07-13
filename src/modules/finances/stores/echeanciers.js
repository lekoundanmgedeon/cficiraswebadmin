import { defineStore } from 'pinia';
import { useNotificationStore } from '@/shared/stores/notificationStore';
import {
  genererEcheancier,
  getEcheancierEtudiant,
  getEcheancierInscription,
  getSuiviTraites,
} from '../api';

/**
 * Store des échéanciers.
 *
 * Pas de `createCrudStore` ici : un échéancier n'est pas une ressource CRUD.
 * Il se **génère** depuis un plan et un tarif, et ne se modifie jamais ligne à
 * ligne — le serveur refuse même de le régénérer dès qu'un paiement y est
 * imputé, pour ne pas effacer le lettrage.
 */
export const useEcheancierStore = defineStore('financeEcheanciers', {
  state: () => ({
    /** @type {any[]} Échéancier de l'inscription courante. */
    echeances: [],
    /** @type {any[]} Suivi des traites, tous étudiants confondus. */
    traites: [],
    loading: false,
    /** @type {import('@/core/api/apiError').ApiError|null} */
    error: null,
  }),

  getters: {
    /** Les traites dont l'échéance est dépassée et le reste non nul. */
    enRetard: (state) => state.traites.filter((traite) => traite.statut === 'EN_RETARD'),

    /**
     * Total encore dû sur l'échéancier courant.
     * `reste` arrive en chaîne (`NUMERIC` PostgreSQL) : d'où le `Number()`.
     */
    resteDu: (state) =>
      state.echeances.reduce((total, echeance) => total + Number(echeance.reste ?? 0), 0),
  },

  actions: {
    /**
     * Exécute un appel en gérant `loading`, `error` et les notifications.
     * Même contrat que `createCrudStore.run`, dont ce store ne descend pas.
     *
     * @template T
     * @param {() => Promise<T>} call
     * @param {{success?: string, failure?: string, onSuccess?: (r: T) => void}} [options]
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

    /**
     * Génère l'échéancier d'une inscription.
     *
     * Les refus du serveur sont des refus métier, pas des pannes : « aucun tarif
     * défini pour cette classe », « des paiements sont déjà imputés ». Ses
     * messages sont rédigés pour l'utilisateur, on les laisse passer tels quels.
     *
     * @param {string} inscriptionId @param {string} planId
     */
    async generer(inscriptionId, planId) {
      const reponse = await this.run(
        () => genererEcheancier({ inscription_id: inscriptionId, plan_id: planId }),
        {
          failure: 'Erreur lors de la génération de l’échéancier.',
          onSuccess: (result) => {
            this.echeances = result.data ?? [];
          },
        }
      );

      if (reponse === undefined) return undefined;

      useNotificationStore().notifySuccess(reponse.message);
      return reponse.data;
    },

    /** @param {string} inscriptionId */
    async fetchByInscription(inscriptionId) {
      return this.run(() => getEcheancierInscription(inscriptionId), {
        failure: 'Erreur lors de la récupération de l’échéancier.',
        onSuccess: (result) => {
          this.echeances = result.data ?? [];
        },
      });
    },

    /** @param {string} etudiantId */
    async fetchByEtudiant(etudiantId) {
      return this.run(() => getEcheancierEtudiant(etudiantId), {
        failure: 'Erreur lors de la récupération de l’échéancier.',
        onSuccess: (result) => {
          this.echeances = result.data ?? [];
        },
      });
    },

    /** @param {{statut?: string, classe_id?: string, filiere_id?: string}} [params] */
    async fetchSuivi(params) {
      return this.run(() => getSuiviTraites(params), {
        failure: 'Erreur lors de la récupération du suivi des traites.',
        onSuccess: (result) => {
          this.traites = result.data ?? [];
        },
      });
    },
  },
});
