/**
 * Routes du tableau de bord.
 *
 * Les trois chemins servent le même écran : `/dashboard` est le lien de la barre
 * latérale, `/home` un alias historique, et `''` la racine de l'application.
 * Chemins et noms sont **inchangés** par rapport à `src/routes/others.routes.js`,
 * pour ne casser ni la navigation ni les redirections après connexion.
 */
const dashboard = () => import('./views/DashboardView.vue');

export default [
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: dashboard,
    meta: { title: 'Tableau de bord' },
  },
  { path: '/home', name: 'Home', component: dashboard, meta: { title: 'Tableau de bord' } },
  { path: '', name: 'Root', component: dashboard, meta: { title: 'Tableau de bord' } },
];
