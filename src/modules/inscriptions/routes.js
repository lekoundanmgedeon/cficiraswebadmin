/** Routes du module Inscriptions. */
export default [
  {
    path: '/inscriptions',
    name: 'Inscriptions',
    component: () => import('./views/InscriptionsView.vue'),
    meta: { title: 'Inscriptions' },
  },
];
