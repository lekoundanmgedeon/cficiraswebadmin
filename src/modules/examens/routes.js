/**
 * Routes du module Examens.
 *
 * La route `/examens` **redirige vers la planification**. Son écran
 * (`views/examens/Examens.vue`) se contentait d'empiler la planification et le
 * calendrier l'une sous l'autre, dans une page qui portait en plus un bouton
 * « + Ajouter » visant `#exampleModal` — **une modale qui n'existait nulle
 * part** — et un lien « Importer fichier » pointant sur une ancre absente. Les
 * deux écrans ont chacun leur route ; les empiler n'apportait rien.
 */
export default [
  {
    path: '/examens',
    name: 'Examens',
    redirect: { name: 'PlanificationExamens' },
  },
  {
    path: '/planification-examens',
    name: 'PlanificationExamens',
    component: () => import('./session/views/PlanificationView.vue'),
    meta: { title: 'Planification des examens' },
  },
  {
    path: '/planification-examens/:id/evaluations',
    name: 'EvaluationsExamens',
    component: () => import('./epreuve/views/PlanExamenView.vue'),
    props: true,
    meta: { title: "Épreuves d'une session" },
  },
  {
    path: '/calendrier-examens',
    name: 'CalendrierExamens',
    component: () => import('./calendrier/views/CalendrierView.vue'),
    meta: { title: 'Calendrier des examens' },
  },
  {
    path: '/salles-horaires',
    name: 'SallesExamens',
    component: () => import('./salle/views/SallesView.vue'),
    meta: { title: 'Salles et horaires' },
  },
  {
    path: '/rapport-examens',
    name: 'RapportExamens',
    component: () => import('./bulletin/views/RapportsView.vue'),
    meta: { title: 'Rapports d’examens' },
  },
];
