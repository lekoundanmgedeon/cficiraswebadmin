import { createCrudStore } from '@/core/store/createCrudStore';
import { associerPlanClasse, plansResource } from '../api';

/**
 * Store des plans de paiement — les gabarits d'échéancier.
 *
 * Un plan ne porte aucun montant : il porte une répartition, que le serveur
 * applique au tarif de la classe de l'étudiant. C'est ce qui permet aux quatre
 * modalités (annuel, semestriel, mensuel, par tranches) de coexister sans
 * dupliquer les tarifs.
 *
 * La liste est mise en cache : elle change rarement et plusieurs écrans la lisent.
 */
export const usePlanStore = createCrudStore({
  id: 'financePlans',
  resource: plansResource,
  label: 'Plan de paiement',
  cacheKey: 'finance-plans',

  getters: {
    /** Les seuls plans proposables à un étudiant. */
    actifs: (state) => state.items.filter((plan) => plan.actif),

    /** @returns {(code: string) => any} */
    getByCode: (state) => (code) => state.items.find((plan) => plan.code === code),
  },

  actions: {
    /**
     * Rattache un plan à une classe (plan proposé par défaut).
     * @param {string} planId
     * @param {{classe_id: string, annee_academique_id: string, par_defaut?: boolean}} data
     */
    async associerClasse(planId, data) {
      return this.run(() => associerPlanClasse(planId, data), {
        success: 'Plan associé à la classe.',
        failure: 'Erreur lors de l’association du plan à la classe.',
        onSuccess: () => this.invalidate(),
      });
    },
  },
});
