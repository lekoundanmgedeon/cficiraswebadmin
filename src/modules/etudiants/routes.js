/**
 * Routes du module Étudiants.
 *
 * Les routes `/dossiers-scolaires`, `/absences` et `/inscriptions` cohabitaient
 * avec celles-ci dans `src/routes/etudiants.routes.js`. Elles relèvent d'autres
 * modules (parcours, absence, inscriptions), pas encore migrés : elles restent
 * donc dans le fichier hérité et rejoindront leur module respectif à leur tour.
 */
export default [
  {
    path: '/etudiants',
    name: 'Etudiants',
    component: () => import('./views/EtudiantsView.vue'),
    meta: { title: 'Étudiants' },
  },
  {
    path: '/etudiants/:id',
    name: 'EtudiantDetails',
    component: () => import('./views/EtudiantDetailView.vue'),
    props: true,
    meta: { title: 'Fiche étudiant' },
  },
];
