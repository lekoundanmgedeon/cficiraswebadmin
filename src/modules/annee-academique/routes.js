/**
 * Routes du module Année académique.
 *
 * Chaque module déclare ses propres routes ; elles sont agrégées par
 * `core/router/index.js`. Les composants sont chargés en import dynamique pour
 * rester dans des chunks séparés.
 */
export default [
  {
    path: '/annees-academiques',
    name: 'AnneesAcademiques',
    component: () => import('./views/AnneeAcademiqueView.vue'),
    meta: { title: 'Années académiques' },
  },
];
