export default [
  // Répertoire formateurs, créneaux et attributions ont migré vers
  // `src/modules/pedagogies/` (étapes 1–3). Reste `programme` ci-dessous.
  {
    path: '/programmes-credits',
    name: 'ProgrammesCredits',
    component: () => import('@/views/pedagogies/programme/ProgrammeCredit.vue'),
  },
];
