/**
 * Routes de scolarité restées en attente de migration.
 *
 * Ce fichier s'appelait `etudiants.routes.js`, mais les deux routes du module
 * Étudiants (`/etudiants`, `/etudiants/:id`) vivent désormais dans
 * `@/modules/etudiants/routes`. Ne subsistent ici que des écrans relevant de
 * modules encore à migrer — parcours, absence, inscriptions —, chacun partira
 * vers le sien.
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
  {
    path: '/inscriptions',
    name: 'Inscriptions',
    component: () => import('@/views/inscriptions/Inscription.vue'),
  },
];
