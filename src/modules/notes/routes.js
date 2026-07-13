/**
 * Routes du module Notes & Délibération.
 *
 * La route `/notes/:classeId/:semestre/:type/edit` a **disparu**. Elle reposait
 * sur un modèle de données faux : une note y appartenait à un triplet (classe,
 * semestre, type d'évaluation). **Le serveur ne connaît pas ce modèle** — une
 * note appartient à un couple **(étudiant, évaluation)**, c'est-à-dire à une
 * *épreuve* précise d'une *session*. L'écran de saisie procède désormais par
 * cascade session → épreuve.
 */
export default [
  {
    path: '/notes',
    name: 'Notes',
    component: () => import('./note/views/NotesView.vue'),
    meta: { title: 'Saisie des notes' },
  },
  {
    path: '/deliberations',
    name: 'Deliberations',
    component: () => import('./deliberation/views/DeliberationView.vue'),
    meta: { title: 'Délibération' },
  },
];
