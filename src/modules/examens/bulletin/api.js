import { evaluationClient } from '@/core/api/clients';

/**
 * Endpoints des bulletins (les « résultats »).
 *
 * ```
 * GET   /resultats/classes/:classeId/bulletins?semestreId&anneeId   palmarès d'une classe
 * GET   /resultats/etudiants/:etudiantId/bulletins/:semestreId
 * PUT   /resultats/bulletins/:id/decision                           décision du jury
 * PATCH /resultats/classes/:classeId/bulletins/publier              publication officielle
 * ```
 *
 * Ces quatre routes existaient déjà, ainsi que leur store
 * (`evaluationStore/resultStore.js`) — mais **aucune vue ne les appelait**.
 * `RapportExamens.vue` affichait, dans un « rapport d'examens », une liste de
 * **formateurs** codés en dur, servie après un `setTimeout(3000)`.
 *
 * ⚠️ Un bulletin est identifié par le triplet **(classe, semestre, année)** —
 * jamais par la seule classe. `semestreId` et `anneeId` sont **obligatoires** :
 * le contrôleur répond `400 « Les paramètres semestreId et anneeId sont
 * obligatoires »` s'ils manquent (en query pour la lecture, dans le **corps**
 * pour la publication). D'où les trois sélecteurs en tête des écrans.
 */

const BASE_PATH = '/resultats';

/**
 * Palmarès d'une classe, pour un semestre d'une année.
 * @param {string} classeId @param {string} semestreId @param {string} anneeId
 */
export const getBulletinsByClasse = (classeId, semestreId, anneeId) =>
  evaluationClient.get(`${BASE_PATH}/classes/${classeId}/bulletins`, { semestreId, anneeId });

/** Bulletin d'un étudiant pour un semestre. @param {string} etudiantId @param {string} semestreId */
export const getBulletinEtudiant = (etudiantId, semestreId) =>
  evaluationClient.get(`${BASE_PATH}/etudiants/${etudiantId}/bulletins/${semestreId}`);

/** Décision du jury sur un bulletin. @param {string} id @param {{decision: string, mention?: string}} data */
export const updateDecisionJury = (id, data) =>
  evaluationClient.put(`${BASE_PATH}/bulletins/${id}/decision`, data);

/**
 * Publication officielle des bulletins d'une classe.
 * @param {string} classeId @param {{semestreId: string, anneeId: string}} data
 */
export const publierBulletinsClasse = (classeId, data) =>
  evaluationClient.patch(`${BASE_PATH}/classes/${classeId}/bulletins/publier`, data);
