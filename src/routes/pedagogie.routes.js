export default [
  // Le répertoire des formateurs (`/enseignants`) a migré vers
  // `src/modules/pedagogies/` (étape 1). Les trois écrans ci-dessous suivront.
  {
    path: '/attribution-cours',
    name: 'AttributionsCours',
    component: () => import('@/views/pedagogies/attributions/AttributionCours.vue'),
  },
  {
    path: '/programmes-credits',
    name: 'ProgrammesCredits',
    component: () => import('@/views/pedagogies/programme/ProgrammeCredit.vue'),
  },
];
