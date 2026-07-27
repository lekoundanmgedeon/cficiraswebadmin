/**
 * Routes du module Pédagogie.
 *
 * La migration se fait écran par écran : chaque route quitte l'ancien
 * `src/routes/pedagogie.routes.js` pour ce fichier au fur et à mesure que son
 * écran est branché sur le backend réel. Chemins et noms **inchangés**, pour ne
 * pas toucher à la barre latérale.
 *
 * Étapes 1–3 — formateurs (répertoire), crenaux (emplois du temps) et
 * attributions (cours → enseignants). À suivre : programme.
 */
export default [
  {
    path: '/enseignants',
    name: 'Formateur',
    component: () => import('./formateurs/views/EnseignantsView.vue'),
    meta: { title: 'Formateurs' },
  },
  {
    path: '/crenaux-horaires',
    name: 'CrenauxHoraire',
    component: () => import('./crenaux/views/CrenauHoraireView.vue'),
    meta: { title: 'Créneaux & horaires' },
  },
  {
    path: '/attribution-cours',
    name: 'AttributionsCours',
    component: () => import('./attributions/views/AttributionCoursView.vue'),
    meta: { title: 'Attribution des cours' },
  },
];
