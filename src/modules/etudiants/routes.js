/**
 * Routes du module Étudiants.
 *
 * `/etudiants/:id` **redirige vers le dossier scolaire**. Les deux écrans
 * affichaient la même chose — identité et parcours académique — le dossier
 * offrant en plus les tuteurs, la situation financière et les pièces
 * justificatives. Maintenir deux fiches jumeaux n'avait pas de sens ; la route
 * est conservée pour ne casser aucun lien existant.
 */
export default [
  {
    path: '/etudiants',
    name: 'Etudiants',
    component: () => import('./views/EtudiantsView.vue'),
    meta: { title: 'Étudiants' },
  },
  {
    path: '/etudiants/:id',
    name: 'EtudiantDetails',
    redirect: (to) => ({ name: 'DossierScolaire', params: { id: to.params.id } }),
  },
];
