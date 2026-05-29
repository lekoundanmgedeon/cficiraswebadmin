export default [
  { path: '/examens', name: 'Examens', component: () => import('@/views/examens/Examens.vue') },
  {
    path: '/planification-examens',
    name: 'PlanificationExamens',
    component: () => import('@/views/examens/planification/Planification.vue'),
  },
  {
    path: '/planification-examens/:id/evaluations',
    name: 'EvaluationsExamens',
    component: () => import('@/views/examens/planification/components/tabs/PlanExamen.vue'),
  },
  {
    path: '/calendrier-examens',
    name: 'CalendrierExamens',
    component: () => import('@/views/examens/calendrier/Calendrier.vue'),
  },
  {
    path: '/salles-horaires',
    name: 'SallesExamens',
    component: () => import('@/views/examens/salles/Salles.vue'),
  },
  {
    path: '/rapport-examens',
    name: 'RapportExamens',
    component: () => import('@/views/examens/rapports/RapportExamens.vue'),
  },
];
