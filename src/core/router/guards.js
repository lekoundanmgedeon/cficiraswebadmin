import { hasToken } from '@/core/auth/tokenStorage';

/**
 * Garde de navigation.
 *
 * Les routes portaient `meta: { requiresAuth: true }` mais aucun
 * `router.beforeEach` n'existait : le flag n'était lu par personne et une URL
 * interne tapée à la main s'ouvrait sans session. Ce guard lui donne enfin un
 * effet.
 *
 * Convention : tout est protégé par défaut. Une route publique doit se déclarer
 * explicitement avec `meta: { public: true }` — un oubli ferme la porte plutôt
 * que de l'ouvrir.
 *
 * @param {import('vue-router').Router} router
 */
export function registerAuthGuard(router) {
  router.beforeEach((to) => {
    const isPublic = to.matched.some((route) => route.meta.public);
    const isAuthenticated = hasToken();

    if (!isPublic && !isAuthenticated) {
      // On mémorise la cible pour y revenir après connexion.
      return { name: 'Login', query: { redirect: to.fullPath } };
    }

    // Un utilisateur déjà connecté n'a rien à faire sur l'écran de login.
    if (isPublic && isAuthenticated && to.name === 'Login') {
      return { name: 'Dashboard' };
    }

    return true;
  });
}
