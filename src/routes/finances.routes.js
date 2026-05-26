export default [
  {
    path: '/paiements-finances',
    name: 'FinancePaiement',
    component: () => import('@/views/finances/paiements/Paiements.vue'),
  },
  {
    path: '/factures-finances',
    name: 'FinanceFacture',
    component: () => import('@/views/finances/facturations/Facturation.vue'),
  },
  {
    path: '/rapports-financiers',
    name: 'RapportsFinanciers',
    component: () => import('@/views/finances/rapports/RapportFinances.vue'),
  },
];
