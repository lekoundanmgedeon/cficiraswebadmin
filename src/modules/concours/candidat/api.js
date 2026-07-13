import { gestionClient } from '@/core/api/clients';

/**
 * Endpoints des candidats.
 *
 * ⚠️ **Il n'existe pas de `GET /candidats`** : un candidat n'a de sens que dans
 * un concours. On les liste par concours (`/candidats/concours/:concoursId`).
 */

const BASE_PATH = '/candidats';

/** @param {string} concoursId */
export const getCandidatsByConcours = (concoursId) =>
  gestionClient.get(`${BASE_PATH}/concours/${concoursId}`);

/** @param {string} concoursId @param {string} epreuveCode */
export const getCandidatsByEpreuve = (concoursId, epreuveCode) =>
  gestionClient.get(`${BASE_PATH}/concours/${concoursId}/epreuve`, {
    epreuve_code: epreuveCode,
  });

/** @param {string} id */
export const getCandidatById = (id) => gestionClient.get(`${BASE_PATH}/${id}`);

/** @param {object} data */
export const createCandidat = (data) => gestionClient.post(BASE_PATH, data);

/** Rattache une pièce justificative. @param {string} id @param {object} data */
export const addPieceCandidat = (id, data) => gestionClient.post(`${BASE_PATH}/${id}/pieces`, data);

/**
 * Enregistre la note d'une épreuve pour un candidat.
 *
 * Le candidat est désigné par son **numéro de table**, pas par son identifiant.
 *
 * @param {string} numTable @param {object} data
 */
export const addNoteEpreuve = (numTable, data) =>
  gestionClient.post(`${BASE_PATH}/${numTable}/notes`, data);

/**
 * Import par lot de candidats.
 *
 * ⚠️ Cette route était **commentée** côté backend, alors que son contrôleur —
 * `importCandidats` — était bien implémenté. Le frontend l'appelait et recevait
 * un **404** : l'import par lot de candidats était inutilisable. La route a été
 * rétablie.
 *
 * @param {File} file @param {string} concoursId
 */
export const importCandidats = (file, concoursId) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('concours_id', concoursId);
  return gestionClient.post(`${BASE_PATH}/import`, formData);
};

/**
 * Import par lot de notes.
 *
 * La route était **déclarée deux fois** côté serveur — la seconde sans son
 * `multer`, donc morte. Une seule subsiste.
 *
 * @param {File} file @param {string} concoursId
 */
export const importNotes = (file, concoursId) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('concours_id', concoursId);
  return gestionClient.post(`${BASE_PATH}/import/notes`, formData);
};
