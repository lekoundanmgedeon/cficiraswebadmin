/**
 * @deprecated Utiliser `@/core/api/httpClient` dans les modules migrés.
 *
 * Couche de service des modules non encore migrés. Deux corrections y ont été
 * apportées :
 *
 *  1. Les méthodes ne prenaient que `(url, data)`. Or `academiqueApi.js` et
 *     `etudiantApi.js` leur passaient un 3e argument de configuration pour
 *     forcer `Content-Type: multipart/form-data` sur les imports de fichiers :
 *     cet argument était silencieusement ignoré. Les appels ne fonctionnaient
 *     que par raccroc, l'intercepteur de `axiosClient` retirant de lui-même le
 *     `Content-Type` sur les FormData. La configuration est désormais transmise.
 *
 *  2. Chaque méthode était enveloppée d'un `try { ... } catch (e) { throw e; }`,
 *     strictement équivalent à l'absence de try/catch. Ces blocs sont retirés,
 *     ainsi que `handleApiError`, défini mais jamais appelé — ce qui explique
 *     que `errorStore` soit toujours resté vide.
 */

/**
 * @param {import('axios').AxiosInstance} client
 */
const buildService = (client) => ({
  /**
   * @param {string} url
   * @param {object} [params]
   * @param {import('axios').AxiosRequestConfig} [config]
   */
  get: async (url, params = {}, config = {}) => {
    const response = await client.get(url, { params, ...config });
    return response.data;
  },

  /**
   * @param {string} url
   * @param {any} [data]
   * @param {import('axios').AxiosRequestConfig} [config]
   */
  post: async (url, data, config = {}) => {
    const response = await client.post(url, data, config);
    return response.data;
  },

  /** @param {string} url @param {any} [data] @param {import('axios').AxiosRequestConfig} [config] */
  put: async (url, data, config = {}) => {
    const response = await client.put(url, data, config);
    return response.data;
  },

  /** @param {string} url @param {any} [data] @param {import('axios').AxiosRequestConfig} [config] */
  patch: async (url, data, config = {}) => {
    const response = await client.patch(url, data, config);
    return response.data;
  },

  /** @param {string} url @param {import('axios').AxiosRequestConfig} [config] */
  delete: async (url, config = {}) => {
    const response = await client.delete(url, config);
    return response.data;
  },
});

export default buildService;
