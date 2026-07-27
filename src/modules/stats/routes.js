/**
 * Route des statistiques de résultats.
 *
 * Chemin et nom **inchangés** par rapport à `src/routes/others.routes.js`, pour
 * ne pas toucher à la barre latérale.
 */
export default [
  {
    path: '/statistiques',
    name: 'Statistiques',
    component: () => import('./views/StatistiquesView.vue'),
    meta: { title: 'Statistiques des résultats' },
  },
];
