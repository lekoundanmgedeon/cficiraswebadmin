export default [
  { path: '/edition-concours', name: 'EditionConcours', component: () => import('@/views/concours/editions/Edition.vue') },
  { path: '/edition-concours/:id/configurations',name: 'concours-configuration',
  component: () => import('@/views/concours/editions/components/Tab/configSub/configDetails.vue'),
  props: true }, 
  { path: '/rapport-concours', name: 'RapportConcours', component: () => import('@/views/concours/resultats/RapportConcours.vue') },
];

