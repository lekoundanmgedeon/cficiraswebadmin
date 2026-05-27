export default [
  {
    path: '/etudiants',
    name: 'Etudiants',
    component: () => import('@/views/etudiants/Etudiants.vue'),
  },
  {
    path: '/etudiants/:id',
    name: 'EtudiantDetails',
    component: () => import('@/views/etudiants/components/details/DetailEtudiant.vue'),
    props: true,
  },
  {
    path: '/dossiers-scolaires',
    name: 'DossiersScolaires',
    component: () => import('@/views/parcours/DossierAcademique.vue'),
  },
  {
    path: '/dossiers-scolaires/:id/global-informations',
    name: 'ListesAffichage',
    component: () => import('@/views/parcours/DossierAcademique.vue'),
  },
  {
    path: '/inscriptions',
    name: 'Inscriptions',
    component: () => import('@/views/inscriptions/Inscription.vue'),
  },

];
