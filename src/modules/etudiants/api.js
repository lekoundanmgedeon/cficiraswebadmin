import { academiqueClient } from '@/core/api/clients';
import { createResource } from '@/core/api/createResource';

/**
 * Endpoints des étudiants.
 *
 * Ce qui existe réellement (`cfibackend/src/routes/academique/etudiant.routes.js`) :
 *
 * ```
 * GET  /etudiants                  liste — filtres : search, filiere_id, statut_dossier
 * GET  /etudiants/:id/complet      identité + tuteurs + pièces du dossier
 * GET  /etudiants/:id/profil-frontend   profil mis en forme
 * GET  /etudiants/:id/parcours     parcours académique
 * POST /etudiants                  créer un étudiant seul
 * POST /etudiants/:id/tuteurs
 * POST /etudiants/:id/photo
 * ```
 *
 * Deux absences à connaître :
 *  - **`GET /etudiants/:id` n'existe pas** (404). Le détail passe par `/complet`,
 *    d'où la surcharge de `fetchById` dans le store.
 *  - **`PUT` et `DELETE /etudiants/:id` n'existent pas** non plus : on ne peut ni
 *    modifier ni supprimer un étudiant. Les boutons correspondants ont été
 *    retirés de l'interface.
 *
 * La liste ne porte **ni classe ni année académique** : un étudiant appartient à
 * une *filière*, sa classe vient de son *inscription*. C'est le module
 * Inscriptions qui la connaît.
 */

const BASE_PATH = '/etudiants';

/**
 * CRUD partiel : `list` et `create` uniquement.
 *
 * `getById`, `update` et `remove` sont bien produits par `createResource`, mais
 * les routes correspondantes n'existent pas : le store les remplace ou les
 * neutralise.
 */
export const etudiantsResource = createResource(academiqueClient, BASE_PATH);

/** Identité + tuteurs + pièces du dossier. Remplace le `GET /etudiants/:id` absent. */
export const getEtudiantComplet = (id) => academiqueClient.get(`${BASE_PATH}/${id}/complet`);

/** Parcours académique : une entrée par année. @param {string|number} id */
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
 * attend `fichier` : les deux routes n'ont pas la même convention côté serveur.
 *
 * `code_annee` est **obligatoire** : chaque ligne du fichier crée une
 * inscription, qui n'existe que rattachée à une année académique. Il manquait à
 * cet appel, et le serveur répondait donc systématiquement
 * « Le paramètre 'code_annee' (ex: 2024-2025) est obligatoire. » — l'écran
 * d'import d'étudiants n'a jamais pu aboutir.
 *
 * @param {File} file
 * @param {string} codeAnnee Ex: "2024-2025"
 */
export const importEtudiants = (file, codeAnnee) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('code_annee', codeAnnee);
  return academiqueClient.post('/imports/etudiants', formData);
};

/**
 * Import par lot de tuteurs légaux (.xlsx / .csv).
 *
 * Pas de `code_annee`, contrairement à l'import d'étudiants : le tuteur se
 * rattache au matricule, qui ne dépend pas de l'année académique.
 *
 * @param {File} file
 */
export const importTuteurs = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return academiqueClient.post('/imports/tuteurs', formData);
};
