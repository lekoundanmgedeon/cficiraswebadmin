import { academiqueClient } from '@/core/api/clients';
import { createResource } from '@/core/api/createResource';

/** Endpoints des étudiants. */

const BASE_PATH = '/etudiants';

/**
 * CRUD standard : list, getById, create, update, patch, remove.
 *
 * `list(params)` sert aussi la recherche filtrée : `GET /etudiants` accepte
 * `classeId`, `filiereId` et `anneeId` en query string. L'ancien
 * `getEtudiantsByClasseFiliereAnnee(classeId, filiereId, anneeId)` imposait les
 * trois arguments dans un ordre fixe ; `list()` les rend optionnels et nommés.
 */
export const etudiantsResource = createResource(academiqueClient, BASE_PATH);

/** Parcours académique d'un étudiant. @param {string|number} id */
export const getEtudiantParcours = (id) => academiqueClient.get(`${BASE_PATH}/${id}/parcours`);

/** Rattache un tuteur à un étudiant. @param {string|number} id @param {object} data */
export const addTuteurToEtudiant = (id, data) =>
  academiqueClient.post(`${BASE_PATH}/${id}/tuteurs`, data);

/**
 * Met à jour la photo de profil.
 *
 * Le `Content-Type` n'est pas posé ici : sur un `FormData`, c'est au navigateur
 * de le faire, lui seul connaissant la « boundary » du multipart. L'intercepteur
 * de requête le retire donc explicitement (voir `core/api/httpClient`).
 *
 * @param {string|number} id @param {File} file
 */
export const uploadPhotoEtudiant = (id, file) => {
  const formData = new FormData();
  formData.append('photo', file);
  return academiqueClient.post(`${BASE_PATH}/${id}/photo`, formData);
};

/** Import par lot d'une liste d'étudiants (.xlsx / .csv). @param {File} file */
export const importEtudiants = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return academiqueClient.post('/imports/etudiants', formData);
};
