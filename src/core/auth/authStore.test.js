import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useAuthStore } from './authStore';
import { authClient } from '@/core/api/clients';
import { ApiError } from '@/core/api/apiError';

vi.mock('vue3-toastify', () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  }),
}));

/**
 * Réponse réelle du backend, relevée sur `POST /api/auth/login`.
 * La charge utile est enveloppée dans `data` — c'est le point que ces tests
 * verrouillent : la lire un cran trop haut faisait échouer la connexion même
 * sur une réponse 200.
 */
const LOGIN_RESPONSE = {
  success: true,
  message: 'Authentification réussie.',
  data: {
    token: 'jwt-de-test',
    user: { id: '0385021a', username: 'superadmin', role: 'ADMIN' },
  },
  meta: { count: 1 },
};

/** Réponse réelle de `GET /api/auth/user` : le profil est dans `data`. */
const PROFILE_RESPONSE = {
  success: true,
  data: { id: '0385021a', username: 'superadmin', email: 'g@cficiras.cg', role: 'ADMIN' },
};

describe('authStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('loginUser', () => {
    it('lit le jeton dans `data` et ouvre la session', async () => {
      vi.spyOn(authClient, 'post').mockResolvedValue(LOGIN_RESPONSE);
      const store = useAuthStore();

      const success = await store.loginUser({ username: 'superadmin', password: 'x' });

      expect(success).toBe(true);
      expect(store.token).toBe('jwt-de-test');
      expect(store.user.username).toBe('superadmin');
      expect(store.isAuthenticated).toBe(true);
      expect(localStorage.getItem('token')).toBe('jwt-de-test');
    });

    it('envoie bien `username` (et non `email`) au backend', async () => {
      const post = vi.spyOn(authClient, 'post').mockResolvedValue(LOGIN_RESPONSE);
      const store = useAuthStore();

      await store.loginUser({ username: 'superadmin', password: 'secret' });

      expect(post).toHaveBeenCalledWith('/login', {
        username: 'superadmin',
        password: 'secret',
      });
    });

    it('échoue proprement sur des identifiants incorrects', async () => {
      vi.spyOn(authClient, 'post').mockRejectedValue(
        new ApiError({ message: 'Identifiants incorrects.', status: 401 })
      );
      const store = useAuthStore();

      const success = await store.loginUser({ username: 'x', password: 'y' });

      expect(success).toBe(false);
      expect(store.token).toBeNull();
      expect(store.error).toBe('Identifiants incorrects.');
      expect(localStorage.getItem('token')).toBeNull();
    });

    // Garde-fou : une réponse 200 sans jeton ne doit pas ouvrir de session.
    it('n’ouvre pas de session si `data.token` est absent', async () => {
      vi.spyOn(authClient, 'post').mockResolvedValue({ success: true, data: {} });
      const store = useAuthStore();

      const success = await store.loginUser({ username: 'x', password: 'y' });

      expect(success).toBe(false);
      expect(store.isAuthenticated).toBe(false);
    });
  });

  describe('rôles', () => {
    it('normalise le rôle majuscule du backend', async () => {
      vi.spyOn(authClient, 'post').mockResolvedValue(LOGIN_RESPONSE);
      const store = useAuthStore();

      await store.loginUser({ username: 'superadmin', password: 'x' });

      // Le backend renvoie "ADMIN" ; les getters comparaient à 'admin' et
      // renvoyaient donc false pour un administrateur.
      expect(store.userRole).toBe('admin');
      expect(store.isAdmin).toBe(true);
      expect(store.isEnseignant).toBe(false);
    });
  });

  describe('fetchCurrentUser', () => {
    it('lit le profil dans `data`', async () => {
      vi.spyOn(authClient, 'get').mockResolvedValue(PROFILE_RESPONSE);
      const store = useAuthStore();

      const user = await store.fetchCurrentUser();

      expect(user.username).toBe('superadmin');
      expect(store.user.email).toBe('g@cficiras.cg');
    });

    it('sert le profil en mémoire sans rappeler le réseau', async () => {
      const get = vi.spyOn(authClient, 'get').mockResolvedValue(PROFILE_RESPONSE);
      const store = useAuthStore();

      await store.fetchCurrentUser();
      await store.fetchCurrentUser();

      expect(get).toHaveBeenCalledOnce();
    });
  });

  describe('logoutUser', () => {
    it('purge le jeton et le cache local', async () => {
      vi.spyOn(authClient, 'post').mockResolvedValue(LOGIN_RESPONSE);
      const store = useAuthStore();
      await store.loginUser({ username: 'superadmin', password: 'x' });
      localStorage.setItem('cache:annees', '{"data":[],"timestamp":1}');

      await store.logoutUser();

      expect(store.token).toBeNull();
      expect(store.user).toBeNull();
      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('cache:annees')).toBeNull();
    });

    it('déconnecte localement même si le serveur échoue', async () => {
      vi.spyOn(authClient, 'post')
        .mockResolvedValueOnce(LOGIN_RESPONSE)
        .mockRejectedValueOnce(new ApiError({ message: 'Serveur indisponible' }));
      const store = useAuthStore();
      await store.loginUser({ username: 'superadmin', password: 'x' });

      await store.logoutUser();

      expect(store.isAuthenticated).toBe(false);
      expect(localStorage.getItem('token')).toBeNull();
    });
  });
});
