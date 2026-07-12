import { beforeEach, describe, expect, it } from 'vitest';
import { createRouter, createMemoryHistory } from 'vue-router';
import { registerAuthGuard } from './guards';
import { setToken, clearToken } from '@/core/auth/tokenStorage';

const Blank = { template: '<div />' };

/** Router minimal reproduisant la structure réelle : public vs protégé. */
function buildRouter() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/auth/login', name: 'Login', component: Blank, meta: { public: true } },
      { path: '/dashboard', name: 'Dashboard', component: Blank },
      { path: '/annees-academiques', name: 'AnneesAcademiques', component: Blank },
    ],
  });
  registerAuthGuard(router);
  return router;
}

describe('registerAuthGuard', () => {
  beforeEach(() => {
    clearToken();
  });

  it('renvoie un visiteur non connecté vers Login', async () => {
    const router = buildRouter();

    await router.push('/annees-academiques');

    expect(router.currentRoute.value.name).toBe('Login');
  });

  // Sans cela, l'utilisateur atterrit sur le dashboard après connexion et doit
  // renaviguer à la main vers la page qu'il visait.
  it('mémorise la page demandée dans `redirect`', async () => {
    const router = buildRouter();

    await router.push('/annees-academiques');

    expect(router.currentRoute.value.query.redirect).toBe('/annees-academiques');
  });

  it('laisse passer un utilisateur authentifié', async () => {
    setToken('jeton-valide');
    const router = buildRouter();

    await router.push('/annees-academiques');

    expect(router.currentRoute.value.name).toBe('AnneesAcademiques');
  });

  it('laisse un visiteur non connecté accéder à Login', async () => {
    const router = buildRouter();

    await router.push('/auth/login');

    expect(router.currentRoute.value.name).toBe('Login');
  });

  it('détourne un utilisateur déjà connecté hors de Login', async () => {
    setToken('jeton-valide');
    const router = buildRouter();

    await router.push('/auth/login');

    expect(router.currentRoute.value.name).toBe('Dashboard');
  });

  // Le guard protège par défaut : une route qui oublie `meta.public` doit être
  // fermée, jamais ouverte.
  it('protège par défaut toute route sans meta.public', async () => {
    const router = buildRouter();

    await router.push('/dashboard');

    expect(router.currentRoute.value.name).toBe('Login');
  });
});
