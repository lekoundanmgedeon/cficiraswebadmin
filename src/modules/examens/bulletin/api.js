import { evaluationClient } from '@/core/api/clients';

/**
 * Endpoints des bulletins (les « résultats »).
 *
 * ```
 * GET   /resultats/classes/:classeId/bulletins            palmarès d'une classe
 * GET   /resultats/etudiants/:etudiantId/bulletins/:semestreId
 * PUT   /resultats/bulletins/:id/decision                 décision du jury
 * PATCH /resultats/classes/:classeId/bulletins/publier    publication officielle
 * ```
 *
 * Ces quatre routes existaient déjà, ainsi que leur store
 * (`evaluationStore/resultStore.js`) — mais **aucune vue ne les appelait**.
 * `RapportExamens.vue` affichait, dans un « rapport d'examens », une liste de
 * **formateurs** codés en dur, servie après un `setTimeout(3000)`.
 */

const BASE_PATH = '/resultats';

/** Palmarès d'une classe. @param {string} classeId */
export const getBulletinsByClasse = (classeId) =>
  evaluationClient.get(`${BASE_PATH}/classes/${classeId}/bulletins`);

/** Bulletin d'un étudiant pour un semestre. @param {string} etudiantId @param {string} semestreId */
export const getBulletinEtudiant = (etudiantId, semestreId) =>
  evaluationClient.get(`${BASE_PATH}/etudiants/${etudiantId}/bulletins/${semestreId}`);

/** Décision du jury sur un bulletin. @param {string} id @param {object} data */
export const updateDecisionJury = (id, data) =>
  evaluationClient.put(`${BASE_PATH}/bulletins/${id}/decision`, data);

/** Publication officielle des bulletins d'une classe. @param {string} classeId */
export const publierBulletinsClasse = (classeId) =>
  evaluationClient.patch(`${BASE_PATH}/classes/${classeId}/bulletins/publier`);
