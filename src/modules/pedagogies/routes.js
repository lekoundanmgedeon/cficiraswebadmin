/**
 * Routes du module Pédagogie.
 *
 * La migration se fait écran par écran : chaque route quitte l'ancien
 * `src/routes/pedagogie.routes.js` pour ce fichier au fur et à mesure que son
 * écran est branché sur le backend réel. Chemins et noms **inchangés**, pour ne
 * pas toucher à la barre latérale.
 *
 * Étape 1 — formateurs (répertoire enseignants). À suivre : crenaux,
 * attributions, programme.
 */
export default [
  {
    path: '/enseignants',
    name: 'Formateur',
    component: () => import('./formateurs/views/EnseignantsView.vue'),
    meta: { title: 'Formateurs' },
  },
];
