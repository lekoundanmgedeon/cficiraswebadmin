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

    /**
     * Rôle normalisé en minuscules.
     *
     * Le backend renvoie le rôle en majuscules (`"ADMIN"`), alors que les
     * getters ci-dessous le comparaient à des minuscules (`'admin'`) : tous
     * renvoyaient donc `false`, y compris pour un administrateur. On normalise
     * en un seul endroit plutôt que de dupliquer un `.toLowerCase()` partout.
     */
    userRole: (state) => state.user?.role?.toLowerCase() ?? null,

    isAdmin() {
      return this.userRole === 'admin';
    },
    isScolarite() {
      return this.userRole === 'scolarite';
    },
    isPedagogie() {
      return this.userRole === 'pedagogie';
    },
    isCCycle() {
      return this.userRole === 'c_cycle';
    },
    isFinances() {
      return this.userRole === 'finances';
    },
    isDirecteur() {
      return this.userRole === 'directeur';
    },
    isEnseignant() {
      return this.userRole === 'enseignant';
    },
    isGestionnaire() {
      return this.userRole === 'gestionnaire';
    },
  },

  actions: {
    /**
     * Enregistre une session à partir d'une réponse d'authentification.
     *
     * Le backend enveloppe systématiquement sa charge utile dans `data` :
     *
     *     { success: true, message: "…", data: { token, user }, meta: {…} }
     *
     * L'ancien code lisait `response.token` et `response.user`, c'est-à-dire un
     * cran trop haut. Le jeton ressortait donc `undefined` et la garde
     * `if (!response.token)` faisait échouer la connexion **y compris sur une
     * réponse 200 parfaitement valide**.
     *
     * @param {{data?: {token: string, user: any}}} response
     * @returns {boolean} `false` si la réponse ne contient pas de jeton.
     */
    _startSession(response) {
      const { token, user } = response?.data ?? {};
      if (!token) return false;

      this.token = token;
      this.user = user ?? null;
      this.status = 'success';
      this.error = null;
      this.lastFetch = Date.now();
      setToken(token);
      return true;
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

    /** @param {{username: string, password: string}} credentials */
    async loginUser(credentials) {
      this.status = 'loading';
      this.error = null;

      try {
        const response = await authClient.post(AUTH_ENDPOINTS.login, credentials);
        if (!this._startSession(response)) {
          throw new Error(response?.message || 'Identifiants invalides.');
        }
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
        if (!this._startSession(response)) {
          throw new Error(response?.message || "Erreur lors de l'inscription.");
        }
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

      // L'ordre compte : `$reset()` réexécute `state()`, dont le champ `token`
      // est initialisé depuis `getToken()`. Purger le stockage après le reset
      // ressusciterait donc le jeton dans le store.
      clearToken();
      // Sans cette purge, les données mises en cache par l'utilisateur sortant
      // resteraient lisibles — et resservies au suivant sur le même poste.
      clearAllCache();
      this.$reset();
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
        // Comme partout ailleurs, le profil est enveloppé dans `data` — et non
        // exposé sous `response.user`, comme le supposait l'ancien code.
        const user = response?.data;
        if (!response?.success || !user) {
          throw new Error(response?.message || "Impossible de récupérer l'utilisateur.");
        }
        this.user = user;
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
