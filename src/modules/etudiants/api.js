import { academiqueClient } from '@/core/api/clients';

/**
 * Endpoints des étudiants.
 *
 * ⚠️ Le backend n'expose **que quatre routes** sur `/etudiants` (vérifié dans
 * `cfibackend/src/routes/academique/etudiant.routes.js`) :
 *
 * ```
 * POST /etudiants                 créer un étudiant seul
 * POST /etudiants/:id/tuteurs     rattacher un tuteur
 * POST /etudiants/:id/photo       photo de profil
 * GET  /etudiants/:id/parcours    parcours académique
 * ```
 *
 * Il n'y a **ni `GET /etudiants` (liste), ni `GET /etudiants/:id`, ni `PUT`, ni
 * `DELETE`** — les quatre répondent 404. Ce module n'a donc pas de ressource
 * REST complète, et n'utilise pas `createResource`.
 *
 * La liste des étudiants vient de `GET /inscriptions`, dont chaque ligne porte
 * l'identité complète de l'étudiant (`etudiant_id`, `etudiant_matricule`,
 * `etudiant_nom`…). C'est le seul annuaire dont dispose l'application ; voir le
 * getter `etudiants` de `modules/inscriptions/store`.
 */

const BASE_PATH = '/etudiants';

/**
 * Crée un étudiant, sans l'inscrire.
 *
 * L'étudiant créé ici n'apparaîtra dans la liste **qu'une fois inscrit** : la
 * liste est une projection des inscriptions. Pour créer un étudiant *et* son
 * inscription en un geste, passer par l'import de l'onglet Import, ou par le
 * module Inscriptions.
 *
 * @param {object} data
 */
export const createEtudiant = (data) => academiqueClient.post(BASE_PATH, data);

/** Parcours académique d'un étudiant. @param {string|number} id */
export const getEtudiantParcours = (id) => academiqueClient.get(`${BASE_PATH}/${id}/parcours`);

/** Rattache un tuteur à un étudiant. @param {string|number} id @param {object} data */
export const addTuteurToEtudiant = (id, data) =>
  academiqueClient.post(`${BASE_PATH}/${id}/tuteurs`, data);

/**
 * Met à jour la photo de profil.
 *
 * Le `Content-Type` n'est pas posé ici : sur un `FormData`, c'est au navigateur
 * de le faire, lui seul connaissant la « boundary » du multipart.
 *
 * @param {string|number} id @param {File} file
 */
export const uploadPhotoEtudiant = (id, file) => {
  const formData = new FormData();
  formData.append('photo', file);
  return academiqueClient.post(`${BASE_PATH}/${id}/photo`, formData);
};

/**
 * Import par lot d'une liste d'étudiants (.xlsx / .csv).
 *
 * Le champ du fichier s'appelle `file` ici, alors que l'import d'inscriptions
 * attend `fichier` : les deux routes n'ont pas la même convention côté serveur
 * (`upload.single('file')` dans `academique.routes.js`).
 *
 * @param {File} file
 */
export const importEtudiants = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return academiqueClient.post('/imports/etudiants', formData);
};
