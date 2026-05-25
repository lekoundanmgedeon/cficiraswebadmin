import { createRouter, createWebHistory } from 'vue-router';
import DefaultLayout from '@/layouts/DefaultLayout.vue';

// Import des modules
import authRoutes from './auth.routes';
import structureRoutes from './structure.routes';
import etudiantsRoutes from './etudiants.routes';
import examensRoutes from './examens.routes';
import concoursRoutes from './concours.routes';
import financesRoutes from './finances.routes';
import pedagogieRoutes from './pedagogie.routes';
import othersRoutes from './others.routes';

const routes = [
  ...authRoutes,
  {
    path: '/',
    component: DefaultLayout,
    meta: { requiresAuth: true },
    children: [
      ...structureRoutes,
      ...etudiantsRoutes,
      ...examensRoutes,
      ...concoursRoutes,
      ...financesRoutes,
      ...pedagogieRoutes,
      ...othersRoutes,
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
