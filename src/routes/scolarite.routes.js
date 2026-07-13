/**
 * Routes de scolarité restées en attente de migration.
 *
 * Ce fichier s'appelait `etudiants.routes.js`. Les routes des modules Étudiants
 * (`/etudiants`, `/etudiants/:id`) et Inscriptions (`/inscriptions`) vivent
 * désormais dans `@/modules/etudiants/routes` et `@/modules/inscriptions/routes`.
 * Ne subsistent ici que des écrans relevant de modules encore à migrer —
 * parcours, absence —, chacun partira vers le sien.
 */
export default [
  {
    path: '/dossiers-scolaires',
    name: 'DossiersScolaires',
    component: () => import('@/views/parcours/DossierView.vue'),
  },
  {
    path: '/dossiers-scolaires/:id/global-informations',
    name: 'ListesAffichage',
    component: () => import('@/views/parcours/DossierAcademique.vue'),
  },
  {
    path: '/absences',
    name: 'Absences',
    component: () => import('@/views/absence/AbscenceView.vue'),
  },
];
