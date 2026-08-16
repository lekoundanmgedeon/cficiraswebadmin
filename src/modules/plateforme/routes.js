/**
 * Routes des écrans de plateforme.
 *
 * Ces six écrans sont les derniers résidus de `src/views/`. Aucun n'était
 * fonctionnel : démos de bibliothèques laissées en place, assistant répondant
 * toujours la même chose, faux téléchargements, page d'un autre produit
 * recopiée. Ils sont conservés — leur besoin est réel — mais leur contenu
 * mensonger a cédé la place à un état explicite.
 *
 * `/assistant-ai` a quitté ce module : l'assistant existe désormais
 * (`modules/assistant`), il n'est plus un écran sans backend.
 *
 * Trois d'entre eux n'étaient **atteignables par aucune route** alors que la
 * barre latérale y menait : `/settings` et `/notification` tombaient sur la page
 * « introuvable », et `/supports-cours` n'était même pas lié. Les chemins déjà
 * utilisés par le menu sont conservés tels quels.
 */
export default [
  {
    path: '/administration',
    name: 'Administration',
    component: () => import('./views/AdministrationView.vue'),
    meta: { title: 'Administration' },
  },
  {
    path: '/documentation',
    name: 'Documentation',
    component: () => import('./views/DocumentsView.vue'),
    meta: { title: 'Documents académiques' },
  },
  // `/settings` a quitté ce module : l'écran Paramètres a désormais un backend
  // (migration 019), il n'est plus un écran sans serveur. Voir
  // `modules/parametres/routes.js` — le chemin et le nom sont inchangés.
  {
    // Idem — et au singulier, comme le lien du menu.
    path: '/notification',
    name: 'Notifications',
    component: () => import('./views/NotificationsView.vue'),
    meta: { title: 'Notifications' },
  },
  {
    path: '/supports-cours',
    name: 'SupportsCours',
    component: () => import('./views/SupportsCoursView.vue'),
    meta: { title: 'Supports de cours' },
  },
];
