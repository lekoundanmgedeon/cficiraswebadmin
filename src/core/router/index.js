import { createRouter, createWebHistory } from 'vue-router';
import DefaultLayout from '@/layouts/DefaultLayout.vue';
import { onUnauthorized } from '@/core/api/httpClient';
import { clearToken } from '@/core/auth/tokenStorage';
import { clearAllCache } from '@/shared/utils/cache';
import { registerAuthGuard } from './guards';

// ── Routes des modules migrés ────────────────────────────────────────────────
// Chaque module possède son propre `routes.js` et est ajouté ici. C'est le seul
// point du noyau à toucher pour brancher un nouveau module.
import anneeAcademiqueRoutes from '@/modules/annee-academique/routes';

// ── Routes héritées, en attente de migration ─────────────────────────────────
// Ces fichiers disparaîtront au fur et à mesure que les modules correspondants
// rejoindront `src/modules/`. Voir docs/ARCHITECTURE.md § « Migration en cours ».
import authRoutes from '@/routes/auth.routes';
import structureRoutes from '@/routes/structure.routes';
import etudiantsRoutes from '@/routes/etudiants.routes';
import examensRoutes from '@/routes/examens.routes';
import concoursRoutes from '@/routes/concours.routes';
import financesRoutes from '@/routes/finances.routes';
import pedagogieRoutes from '@/routes/pedagogie.routes';
import othersRoutes from '@/routes/others.routes';

/** Routes internes, rendues dans le layout applicatif et protégées par le guard. */
const protectedRoutes = [
  ...anneeAcademiqueRoutes,
  ...structureRoutes,
  ...etudiantsRoutes,
  ...examensRoutes,
  ...concoursRoutes,
  ...financesRoutes,
  ...pedagogieRoutes,
  ...othersRoutes,
];

const routes = [
  ...authRoutes,
  {
    path: '/',
    component: DefaultLayout,
    children: protectedRoutes,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  // Revenir en haut de page à chaque navigation, sauf retour arrière navigateur.
  scrollBehavior: (to, from, savedPosition) => savedPosition ?? { top: 0 },
});

registerAuthGuard(router);

// Un 401 signifie que le jeton n'est plus valide côté serveur : on nettoie la
// session locale et on renvoie vers la connexion. Le client HTTP ne connaît pas
// le router (cela créerait un cycle d'imports), il expose donc ce point d'accroche.
onUnauthorized(() => {
  clearToken();
  clearAllCache();

  if (router.currentRoute.value.name !== 'Login') {
    router.push({
      name: 'Login',
      query: { redirect: router.currentRoute.value.fullPath },
    });
  }
});

export default router;
