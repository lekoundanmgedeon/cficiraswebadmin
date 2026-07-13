/**
 * Routes du module Matières.
 *
 * L'écran existait depuis longtemps sous `views/matieres/`, mais **aucune route
 * ne pointait dessus** et aucun lien de menu n'y menait : il était strictement
 * inaccessible. Il l'est enfin.
 */
export default [
  {
    path: '/modules',
    name: 'Modules',
    component: () => import('./views/ModulesView.vue'),
    meta: { title: "Modules d'enseignement" },
  },
];
