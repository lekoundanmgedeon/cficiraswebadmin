import { gestionClient } from '@/core/api/clients';

/**
 * Endpoints des épreuves de concours.
 *
 * ⚠️ Elles vivent **sous `/concours`**, et non sous une ressource à elles :
 *
 * ```
 * GET    /concours/:concoursId/epreuves   les épreuves d'un concours
 * GET    /concours/epreuves/:id
 * POST   /concours/epreuves
 * PUT    /concours/epreuves/:id
 * DELETE /concours/epreuves/:id
 * ```
 *
 * ## Un bug de chemin qui rendait deux routes inatteignables
 *
 * L'ancien `gestionApi.js` appelait :
 *
 * ```js
 * export const updateEpreuve = (id, data) =>
 *   gestionService.put(`/gestions/concours/epreuves/${id}`, data);   // ← « /gestions/ » en trop
 * export const deleteEpreuve = (id) =>
 *   gestionService.delete(`/gestions/concours/epreuves/${id}`);      // ← idem
 * ```
 *
 * Le client est **déjà** monté sur `/gestion` : l'URL réelle devenait
 * `/api/gestion/gestions/concours/epreuves/:id` — **404**. Modifier et supprimer
 * une épreuve de concours n'ont donc **jamais** fonctionné. Les trois autres
 * routes, elles, avaient le bon chemin.
 */

const BASE_PATH = '/concours';

/** @param {string} concoursId */
export const getEpreuvesByConcours = (concoursId) =>
  gestionClient.get(`${BASE_PATH}/${concoursId}/epreuves`);

/** @param {string} id */
export const getEpreuveById = (id) => gestionClient.get(`${BASE_PATH}/epreuves/${id}`);

/** @param {object} data */
export const createEpreuve = (data) => gestionClient.post(`${BASE_PATH}/epreuves`, data);

/** @param {string} id @param {object} data */
export const updateEpreuve = (id, data) => gestionClient.put(`${BASE_PATH}/epreuves/${id}`, data);

/** @param {string} id */
export const deleteEpreuve = (id) => gestionClient.delete(`${BASE_PATH}/epreuves/${id}`);
