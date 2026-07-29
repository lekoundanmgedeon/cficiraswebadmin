/**
 * Route de l'assistant IA.
 *
 * Chemin et nom **inchangés** (`/assistant-ai`, `AssistantAI`) : ils étaient
 * portés par `modules/plateforme`, dont la vue n'était qu'un état « aucun
 * assistant n'est raccordé ». La barre latérale y mène déjà et n'a pas à
 * bouger.
 */
export default [
  {
    path: '/assistant-ai',
    name: 'AssistantAI',
    component: () => import('./views/AssistantView.vue'),
    meta: { title: 'Assistant IA' },
  },
];
