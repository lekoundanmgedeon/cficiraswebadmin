/**
 * Routes du module Finances.
 *
 * Les chemins et les noms sont **inchangés** par rapport à l'ancien
 * `src/routes/finances.routes.js` : la barre latérale et les liens existants s'y
 * réfèrent, la migration des vues vers `src/modules/finances/` ne devait rien
 * casser côté navigation.
 */
export default [
  {
    path: '/paiements-finances',
    name: 'FinancePaiement',
    component: () => import('./paiements/views/PaiementsView.vue'),
    meta: { title: 'Paiements & scolarités' },
  },
  {
    path: '/factures-finances',
    name: 'FinanceFacture',
    component: () => import('./facturations/views/FacturationsView.vue'),
    meta: { title: 'Facturation' },
  },
  {
    path: '/rapports-financiers',
    name: 'RapportsFinanciers',
    component: () => import('./rapports/views/RapportsFinancesView.vue'),
    meta: { title: 'Rapports financiers' },
  },
];
