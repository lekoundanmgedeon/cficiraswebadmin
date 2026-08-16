/**
 * Route de l'écran Paramètres.
 *
 * Chemin et nom **inchangés** (`/settings`, `Parametres`) : ils étaient portés
 * par `modules/plateforme`, le module des écrans sans backend. Celui-ci en a un
 * désormais (migration 019, routes `/parametres`, `/utilisateurs`,
 * `/notifications` et `/journaux`), d'où le déménagement. La barre latérale y
 * mène déjà et n'a pas à bouger.
 *
 * Le cloisonnement par rôle se fait **dans l'écran** — seul un ADMIN voit les
 * onglets Comptes, Réglages, Notifications et Journaux — et surtout **au
 * serveur**, qui refuse ces routes en 403 quel que soit l'appelant. Une garde de
 * route en plus ici fermerait « Mon compte » à tout le monde, alors qu'il est
 * destiné à tous.
 */
export default [
  {
    path: '/settings',
    name: 'Parametres',
    component: () => import('./views/ParametresView.vue'),
    meta: { title: 'Paramètres' },
  },
];
