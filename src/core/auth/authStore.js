import { defineStore } from 'pinia';
import { authClient } from '@/core/api/clients';
import { useNotificationStore } from '@/shared/stores/notificationStore';
import { clearAllCache } from '@/shared/utils/cache';
import { getToken, setToken, clearToken } from './tokenStorage';

/**
 * Session utilisateur : connexion, déconnexion, profil courant, rôles.
 *
 * Trois défauts de l'implémentation précédente sont corrigés ici :
 *
 *  1. `signupUser` appelait `notifyError(...)` sans jamais avoir destructuré
 *     `useNotifier()` — contrairement à `loginUser`, qui le faisait. Toute
 *     inscription en échec levait donc une ReferenceError qui masquait l'erreur
 *     métier réelle.
 *
 *  2. `fetchCurrentUser` appelait `useRouter()` à l'intérieur d'une action
 *     Pinia. `useRouter()` repose sur `inject()` et ne fonctionne que dans un
 *     `setup()` : il renvoyait `undefined`, et la redirection plantait
 *     précisément dans le cas qu'elle devait traiter — l'expiration du jeton.
 *     La redirection sur 401 est désormais du ressort de l'intercepteur HTTP
 *     (voir `core/router/index.js`), qui, lui, a accès au router.
 *
 *  3. Le cache local n'était pas purgé à la déconnexion : les données de
 *     l'utilisateur précédent restaient lisibles dans le localStorage et
 *     pouvaient être resservies au suivant.
 */

const AUTH_ENDPOINTS = {
  login: '/login',
  logout: '/logout',
  signup: '/signup',
  currentUser: '/user',
};

/** Durée de validité du profil en mémoire, avant re-vérification serveur. */
const USER_CACHE_TTL_MS = 5 * 60 * 1000;

export const useAuthStore = defineStore('auth', {
  state: () => ({
    /** @type {any|null} */
    user: null,
    /** @type {string|null} */
    token: getToken(),
    /** @type {'idle'|'loading'|'success'|'error'} */
    status: 'idle',
    /** @type {string|null} */
    error: null,
    /** @type {number|null} Horodatage du dernier chargement du profil. */
    lastFetch: null,
  }),

  getters: {
    isAuthenticated: (state) => Boolean(state.token),
    userRole: (state) => state.user?.role ?? null,

    isAdmin: (state) => state.user?.role === 'admin',
    isScolarite: (state) => state.user?.role === 'scolarite',
    isPedagogie: (state) => state.user?.role === 'pedagogie',
    isCCycle: (state) => state.user?.role === 'c_cycle',
    isFinances: (state) => state.user?.role === 'finances',
    isDirecteur: (state) => state.user?.role === 'directeur',
    isEnseignant: (state) => state.user?.role === 'enseignant',
    isGestionnaire: (state) => state.user?.role === 'gestionnaire',
  },

  actions: {
    /**
     * Enregistre une session authentifiée.
     * @param {{token: string, user: any}} response
     */
    _startSession({ token, user }) {
      this.token = token;
      this.user = user;
      this.status = 'success';
      this.error = null;
      this.lastFetch = Date.now();
      setToken(token);
    },

    /**
     * @param {unknown} error
     * @param {string} fallback
     */
    _failSession(error, fallback) {
      const notifications = useNotificationStore();
      this.status = 'error';
      this.error = error?.message ?? fallback;
      notifications.notifyError(error, fallback);
    },

    /** @param {{email: string, password: string}} credentials */
    async loginUser(credentials) {
      this.status = 'loading';
      this.error = null;

      try {
        const response = await authClient.post(AUTH_ENDPOINTS.login, credentials);
        if (!response?.success || !response.token) {
          throw new Error(response?.message || 'Identifiants invalides.');
        }
        this._startSession(response);
        return true;
      } catch (error) {
        this._failSession(error, 'Erreur lors de la connexion.');
        return false;
      }
    },

    /** @param {object} data */
    async signupUser(data) {
      this.status = 'loading';
      this.error = null;

      try {
        const response = await authClient.post(AUTH_ENDPOINTS.signup, data);
        if (!response?.success || !response.token) {
          throw new Error(response?.message || "Erreur lors de l'inscription.");
        }
        this._startSession(response);
        return true;
      } catch (error) {
        this._failSession(error, "Erreur lors de l'inscription.");
        return false;
      }
    },

    async logoutUser() {
      const notifications = useNotificationStore();

      try {
        await authClient.post(AUTH_ENDPOINTS.logout);
        notifications.notifySuccess('Déconnexion réussie.');
      } catch {
        // L'échec de l'appel serveur ne doit pas empêcher la déconnexion
        // locale : l'utilisateur a demandé à partir, on le déconnecte.
      }

      this.$reset();
      clearToken();
      // Sans cette purge, les données mises en cache par l'utilisateur sortant
      // resteraient lisibles — et resservies au suivant sur le même poste.
      clearAllCache();
    },

    /**
     * Charge le profil courant. Un 401 est traité par l'intercepteur HTTP, qui
     * nettoie la session et redirige vers la connexion.
     * @param {boolean} [force] Ignore le cache mémoire.
     */
    async fetchCurrentUser(force = false) {
      const isFresh = this.lastFetch && Date.now() - this.lastFetch < USER_CACHE_TTL_MS;
      if (!force && this.user && isFresh) {
        return this.user;
      }

      try {
        const response = await authClient.get(AUTH_ENDPOINTS.currentUser);
        if (!response?.success) {
          throw new Error(response?.message || "Impossible de récupérer l'utilisateur.");
        }
        this.user = response.user;
        this.status = 'success';
        this.lastFetch = Date.now();
        return this.user;
      } catch (error) {
        this.status = 'error';
        this.error = error?.message ?? null;
        return null;
      }
    },
  },
});
