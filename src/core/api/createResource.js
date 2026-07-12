/**
 * Fabrique de ressource REST.
 *
 * Les fichiers d'API du projet répètent le même quintuplet CRUD pour chaque
 * entité (annees, classes, cycles, filieres, niveaux, semestres...). Cette
 * fabrique le produit une fois ; chaque module n'écrit plus que ses endpoints
 * réellement spécifiques.
 *
 * @example
 * const anneesResource = createResource(academiqueClient, '/annees');
 * export const getAnnees = anneesResource.list;
 * export const activateAnnee = (id) => academiqueClient.patch(`/annees/${id}/activate`);
 */

/**
 * @param {import('./httpClient').HttpClient} client Client HTTP du domaine.
 * @param {string} basePath Chemin de la ressource, ex. `/annees`.
 */
export function createResource(client, basePath) {
  return {
    /**
     * @param {object} [params] Filtres et pagination.
     * @returns {Promise<{data: any[], meta?: object}>}
     */
    list: (params) => client.get(basePath, params),

    /** @param {string|number} id */
    getById: (id) => client.get(`${basePath}/${id}`),

    /** @param {object} data */
    create: (data) => client.post(basePath, data),

    /** @param {string|number} id @param {object} data */
    update: (id, data) => client.put(`${basePath}/${id}`, data),

    /** @param {string|number} id @param {object} data */
    patch: (id, data) => client.patch(`${basePath}/${id}`, data),

    /** @param {string|number} id */
    remove: (id) => client.delete(`${basePath}/${id}`),
  };
}

/** @typedef {ReturnType<typeof createResource>} Resource */
