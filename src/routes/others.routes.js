/**
 * Routes héritées, en attente de migration.
 *
 * `/notes`, `/notes/:classeId/:semestre/:type/edit` et `/deliberations` en sont
 * partis : ils vivent désormais dans `@/modules/notes/routes`. La route d'édition
 * a disparu — elle reposait sur un modèle de données que le serveur ne connaît pas.
 *
 * `/dashboard`, `/home` et `''` en sont partis à leur tour, vers
 * `@/modules/dashboard/routes`. `/statistiques` de même, vers `@/modules/stats/routes`.
 */
export default [
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
];
