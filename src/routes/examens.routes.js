export default [
  { path: '/examens', name: 'Examens', component: () => import('@/views/examens/Examens.vue') },
  { path: '/examens/planning/:id', name: 'Planning', component: () => import('@/views/examens/calendrier/sample.vue'), props: true },
  { path: '/examens/planning/:id/calendrier/:semestreId', name: 'Calendrier', component: () => import('@/views/examens/calendrier/detail/DetailExamen.vue'), props: true },
  { path: '/planification-examens', name: 'PlanificationExamens', component: () => import('@/views/examens/planification/Planification.vue') },
  { path: '/calendrier-examens', name: 'CalendrierExamens', component: () => import('@/views/examens/calendrier/Calendrier.vue') },
  { path: '/salles-horaires', name: 'SallesExamens', component: () => import('@/views/examens/salles/Salles.vue') },
  { path: '/rapport-examens', name: 'RapportExamens', component: () => import('@/views/examens/rapports/RapportExamens.vue') },
];
