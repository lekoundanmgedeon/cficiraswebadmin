/**
 * Routes du module Bibliothèque.
 *
 * Le menu `/bibliotheque` existait dans `main` mais **ne pointait vers rien** :
 * ni route, ni vue, ni table. L'écran, son domaine backend et sa table sont
 * créés avec ce module (migration `014_bibliotheque.sql`).
 */
export default [
  {
    path: '/bibliotheque',
    name: 'Bibliotheque',
    component: () => import('./views/BibliothequeView.vue'),
    meta: { title: 'Bibliothèque' },
  },
];
