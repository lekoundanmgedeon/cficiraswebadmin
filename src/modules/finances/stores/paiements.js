import { createCrudStore } from '@/core/store/createCrudStore';
import { useNotificationStore } from '@/shared/stores/notificationStore';
import {
  annulerPaiement,
  enregistrerPaiement,
  getPaiementsEtudiant,
  getRecu,
  paiementsResource,
} from '../api';

/**
 * Store des paiements.
 *
 * Remplace `stores/financeStore/financeStore.js`, qui appelait `/finances` —
 * un endpoint qui n'a jamais existé. Ses cinq actions échouaient donc toutes en
 * silence, `notifyError` mis à part : les écrans, eux, affichaient des tableaux
 * codés en dur et ne l'appelaient jamais.
 */
export const usePaiementStore = createCrudStore({
  id: 'financePaiements',
  resource: paiementsResource,
  label: 'Paiement',
  // Pas de `cacheKey` : la liste est presque toujours filtrée (mois, mode,
  // classe…), et une liste filtrée n'a pas la même clé que la liste complète.

  state: () => ({
    /** @type {any|null} Reçu du dernier encaissement, pour l'impression. */
    dernierRecu: null,
    /** @type {any[]} Imputation du dernier encaissement, échéance par échéance. */
    dernieresAllocations: [],
  }),

  actions: {
    /**
     * Encaisse un paiement.
     *
     * Le serveur impute le versement sur les échéances impayées les plus
     * anciennes et émet le reçu dans la même transaction. Un trop-perçu
     * (`montant_non_impute`) n'est pas une erreur : l'argent est encaissé et
     * reste en avance — mais le guichet doit le savoir, d'où l'avertissement.
     *
     * @param {object} data Voir `enregistrerPaiement` dans `api.js`.
     */
    async encaisser(data) {
      const reponse = await this.run(() => enregistrerPaiement(data), {
        failure: 'Erreur lors de l’enregistrement du paiement.',
        onSuccess: (result) => {
          this.dernierRecu = result.data?.recu ?? null;
          this.dernieresAllocations = result.data?.allocations ?? [];
        },
      });

      if (reponse === undefined) return undefined;

      // Le serveur rédige déjà le bon message (« … non imputé : le versement
      // excède le reste dû »), on le relaie plutôt que d'en inventer un.
      const notifications = useNotificationStore();
      const trop = Number(reponse.data?.montant_non_impute ?? 0);

      if (trop > 0) {
        notifications.notifyWarning(reponse.message);
      } else {
        notifications.notifySuccess(reponse.message ?? 'Paiement enregistré.');
      }

      await this.invalidate();
      return reponse.data;
    },

    /**
     * Annule un paiement. Son imputation est défaite : les échéances qu'il
     * soldait se rouvrent et le solde de la facture remonte d'autant.
     *
     * @param {string} id @param {string} [motif]
     */
    async annuler(id, motif) {
      return this.run(() => annulerPaiement(id, motif), {
        success: 'Paiement annulé ; son imputation a été défaite.',
        failure: 'Erreur lors de l’annulation du paiement.',
        onSuccess: () => this.invalidate(),
      });
    },

    /** @param {string} id */
    async fetchRecu(id) {
      const reponse = await this.run(() => getRecu(id), {
        failure: 'Erreur lors de la récupération du reçu.',
      });
      return reponse?.data ?? null;
    },

    /** @param {string} etudiantId */
    async fetchByEtudiant(etudiantId) {
      return this.run(() => getPaiementsEtudiant(etudiantId), {
        failure: 'Erreur lors de la récupération des paiements de l’étudiant.',
        onSuccess: (result) => {
          this.items = result.data ?? [];
        },
      });
    },
  },
});
