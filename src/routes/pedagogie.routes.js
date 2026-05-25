export default [
  {
    path: '/enseignants',
    name: 'Formateur',
    component: () => import('@/views/pedagogies/formateurs/Enseignants.vue'),
  },
  {
    path: '/attribution-cours',
    name: 'AttributionsCours',
    component: () => import('@/views/pedagogies/attributions/AttributionCours.vue'),
  },
  {
    path: '/crenaux-horaires',
    name: 'CrenauxHoraire',
    component: () => import('@/views/pedagogies/crenaux/CrenauHoraire.vue'),
  },
  {
    path: '/programmes-credits',
    name: 'ProgrammesCredits',
    component: () => import('@/views/pedagogies/programme/ProgrammeCredit.vue'),
  },
];
