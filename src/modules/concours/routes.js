/** Routes du module Concours. */
export default [
  {
    path: '/edition-concours',
    name: 'EditionConcours',
    component: () => import('./concours/views/EditionsView.vue'),
    meta: { title: 'Gestion des concours' },
  },
  {
    path: '/edition-concours/:id/configurations',
    name: 'concours-configuration',
    component: () => import('./concours/views/ConfigurationView.vue'),
    props: true,
    meta: { title: "Configuration d'un concours" },
  },
  {
    path: '/rapport-concours',
    name: 'RapportConcours',
    component: () => import('./concours/views/RapportView.vue'),
    meta: { title: 'Rapports de concours' },
  },
];
