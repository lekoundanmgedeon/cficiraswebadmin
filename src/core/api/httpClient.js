import axios from 'axios';
import { normalizeApiError } from './apiError';
import { getToken } from '@/core/auth/tokenStorage';

/**
 * Client HTTP de l'application.
 *
 * Remplace `api/config/axiosClient.js` + `api/config/serviceApi.js`, qui
 * souffraient de deux défauts :
 *  - `post(url, data)` n'acceptait pas de configuration Axios, si bien que les
 *    appels d'upload passant un 3e argument voyaient leurs en-têtes ignorés
 *    en silence ;
 *  - les `try/catch` se contentaient de relancer l'erreur brute, laissant
 *    chaque appelant réinspecter la structure d'une réponse Axios.
 *
 * Ici, toute erreur ressort en `ApiError` et toute méthode accepte une config.
 */

/**
 * Callback invoqué sur toute réponse 401. Branché sur le router au démarrage
 * (voir `core/router/index.js`) afin d'éviter une dépendance circulaire entre
 * le client HTTP et le router.
 * @type {(() => void) | null}
 */
let unauthorizedHandler = null;

/** @param {() => void} handler */
export function onUnauthorized(handler) {
  unauthorizedHandler = handler;
}

/**
 * Crée une instance Axios pointant vers un préfixe de l'API.
 * @param {string} prefix Préfixe de ressource, ex. `/academique`.
 * @returns {import('axios').AxiosInstance}
 */
function createAxiosInstance(prefix) {
  const instance = axios.create({
    baseURL: `${import.meta.env.VITE_API_URL}/api${prefix}`,
    headers: { 'Content-Type': 'application/json' },
  });

  instance.interceptors.request.use((config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Sur un FormData, le navigateur doit poser lui-même le Content-Type
    // car il seul connaît la « boundary » du multipart.
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  });

  instance.interceptors.response.use(
    // On déballe ici : les appelants reçoivent le corps, jamais l'enveloppe Axios.
    (response) => response.data,
    (error) => {
      const apiError = normalizeApiError(error);
      if (apiError.isUnauthorized) {
        unauthorizedHandler?.();
      }
      return Promise.reject(apiError);
    }
  );

  return instance;
}

/**
 * Crée un client HTTP pour un préfixe donné.
 *
 * Chaque méthode transmet intégralement la config Axios, ce qui permet de
 * passer `signal`, `onUploadProgress` ou des en-têtes spécifiques.
 *
 * @param {string} prefix Préfixe de ressource, ex. `/academique`.
 */
export function createHttpClient(prefix = '') {
  const instance = createAxiosInstance(prefix);

  return {
    /**
     * @param {string} url
     * @param {object} [params] Paramètres de query string.
     * @param {import('axios').AxiosRequestConfig} [config]
     */
    get: (url, params = {}, config = {}) => instance.get(url, { params, ...config }),

    /**
     * @param {string} url
     * @param {any} [data]
     * @param {import('axios').AxiosRequestConfig} [config]
     */
    post: (url, data, config = {}) => instance.post(url, data, config),

    /** @param {string} url @param {any} [data] @param {import('axios').AxiosRequestConfig} [config] */
    put: (url, data, config = {}) => instance.put(url, data, config),

    /** @param {string} url @param {any} [data] @param {import('axios').AxiosRequestConfig} [config] */
    patch: (url, data, config = {}) => instance.patch(url, data, config),

    /** @param {string} url @param {import('axios').AxiosRequestConfig} [config] */
    delete: (url, config = {}) => instance.delete(url, config),
  };
}

/** @typedef {ReturnType<typeof createHttpClient>} HttpClient */
