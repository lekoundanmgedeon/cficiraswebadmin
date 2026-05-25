export default [
  {
    path: '/annees-academiques',
    name: 'AnneesAcademiques',
    component: () => import('@/views/stracad/anneeac/AnneeAcademique.vue'),
  },
  {
    path: '/cycles-academiques',
    name: 'CyclesAcademiques',
    component: () => import('@/views/stracad/cycles/Cycle.vue'),
  },
  {
    path: '/filieres-academiques',
    name: 'FilieresAcademiques',
    component: () => import('@/views/stracad/filieres/Filiere.vue'),
  },
  {
    path: '/classes-niveaux',
    name: 'ClassesNiveaux',
    component: () => import('@/views/stracad/classes/Classes.vue'),
  },
  {
    path: '/semestres',
    name: 'Semestres',
    component: () => import('@/views/stracad/semestres/Semestre.vue'),
  },
];
