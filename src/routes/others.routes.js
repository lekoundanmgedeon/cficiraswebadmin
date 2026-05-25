export default [
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/dashboard/Dashboard.vue'),
  },
  {
    path: '/statistiques',
    name: 'Statistiques',
    component: () => import('@/views/stats/Statistiques.vue'),
  },
  {
    path: '/documentation',
    name: 'Documentation',
    component: () => import('@/views/docf/Document.vue'),
  },
  { path: '/notes', name: 'Notes', component: () => import('@/views/notes/Notes.vue') },
  {
    path: '/dossiers-scolaires',
    name: 'DossiersScolaires',
    component: () => import('@/views/parcours/DossierAcademique.vue'),
  },
  {
    path: '/administration',
    name: 'Administration',
    component: () => import('@/views/admin/Administration.vue'),
  },
  {
    path: '/assistant-ai',
    name: 'AssistantAI',
    component: () => import('@/views/prompt/AssistantAi.vue'),
  },
  { path: '/home', name: 'Home', component: () => import('@/views/dashboard/Dashboard.vue') },
  { path: '', name: 'Root', component: () => import('@/views/dashboard/Dashboard.vue') },
];
