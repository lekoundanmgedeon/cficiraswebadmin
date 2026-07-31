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

/**
 * Calcule et enregistre les bulletins d'une classe pour une période.
 *
 * C'est le geste qui remplit `bulletins_semestriels` : sans lui, les quatre
 * routes ci-dessus lisent une table vide. La fonction serveur est idempotente —
 * relancer met à jour, ne duplique pas — et ne touche jamais un bulletin
 * verrouillé.
 *
 * ⚠️ `modules/stats/api.js` déclare le **même** endpoint pour son propre écran.
 * Les deux consommateurs sont indépendants et la ligne est unique de chaque
 * côté ; les fusionner créerait une dépendance entre deux modules qui n'en ont
 * aucune autre.
 *
 * @param {string} classeId
 * @param {{semestreId: string, anneeId: string}} periode
 */
export const genererBulletinsClasse = (classeId, { semestreId, anneeId }) =>
  evaluationClient.post(`${BASE_PATH}/classes/${classeId}/bulletins/generer`, {
    semestreId,
    anneeId,
  });
