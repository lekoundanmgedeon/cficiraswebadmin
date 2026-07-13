/**
 * Routes héritées, en attente de migration.
 *
 * `/notes`, `/notes/:classeId/:semestre/:type/edit` et `/deliberations` en sont
 * partis : ils vivent désormais dans `@/modules/notes/routes`. La route d'édition
 * a disparu — elle reposait sur un modèle de données que le serveur ne connaît pas.
 */
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
