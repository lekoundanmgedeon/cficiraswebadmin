/**
 * Routes de la coordination académique.
 *
 * Les trois menus `/themes-memoires`, `/soutenances` et `/statut` existaient
 * dans `main` mais **ne pointaient vers rien** : ni route, ni vue, ni table.
 * Écrans, domaine backend (`/api/coordination`) et tables sont créés avec ce
 * module — voir la migration `015_coordination_academique.sql`.
 */
export default [
  {
    path: '/themes-memoires',
    name: 'ThemesMemoires',
    component: () => import('./travaux/views/ThemesMemoiresView.vue'),
    meta: { title: 'Thèmes & mémoires' },
  },
  {
    path: '/soutenances',
    name: 'Soutenances',
    component: () => import('./soutenances/views/SoutenancesView.vue'),
    meta: { title: 'Soutenances' },
  },
  {
    path: '/statut',
    name: 'StatutEtudiant',
    component: () => import('./statut/views/StatutEtudiantView.vue'),
    meta: { title: 'Statut étudiant' },
  },
];
