/**
 * Routes du module Structure académique.
 *
 * Le module regroupe les cinq entités qui décrivent l'ossature de l'école —
 * années, cycles, filières, niveaux, classes, semestres. Elles sont fortement
 * imbriquées (un cycle porte des filières, qui portent des niveaux, qui portent
 * des classes) et évoluent ensemble : les séparer en modules distincts aurait
 * imposé des imports croisés permanents entre eux.
 *
 * Chaque entité reste un sous-domaine autonome, avec ses propres `api.js`,
 * `store.js`, composants et vue. Seules les routes sont assemblées ici.
 */
export default [
  {
    path: '/annees-academiques',
    name: 'AnneesAcademiques',
    component: () => import('./annee/views/AnneeAcademiqueView.vue'),
    meta: { title: 'Années académiques' },
  },
  {
    path: '/cycles-academiques',
    name: 'CyclesAcademiques',
    component: () => import('./cycle/views/CycleView.vue'),
    meta: { title: 'Cycles académiques' },
  },
  {
    path: '/filieres-academiques',
    name: 'FilieresAcademiques',
    component: () => import('./filiere/views/FiliereView.vue'),
    meta: { title: 'Filières académiques' },
  },
  {
    path: '/classes-niveaux',
    name: 'ClassesNiveaux',
    component: () => import('./classe/views/ClasseView.vue'),
    meta: { title: 'Classes et niveaux' },
  },
  {
    path: '/semestres',
    name: 'Semestres',
    component: () => import('./semestre/views/SemestreView.vue'),
    meta: { title: 'Semestres' },
  },
];
