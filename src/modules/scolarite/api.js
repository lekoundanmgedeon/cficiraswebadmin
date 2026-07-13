import { academiqueClient } from '@/core/api/clients';

/**
 * Endpoints du dossier scolaire.
 *
 * Le dossier n'a pas de ressource à lui : il est servi **par les routes des
 * étudiants**, et son identifiant (`dossier_id`) est porté par l'étudiant.
 *
 * ```
 * GET   /etudiants/:id/complet                        identité + tuteurs + pièces
 * GET   /etudiants/:id/parcours                       parcours académique
 * POST  /etudiants/:dossierId/pieces                  déposer une pièce
 * PATCH /etudiants/dossiers/:dossierId/pieces/:pieceId  valider ou rejeter
 * ```
 *
 * ⚠️ Noter l'asymétrie des deux dernières : le dépôt se fait sur
 * `/etudiants/:dossierId/pieces` (sans le segment `dossiers`), la vérification
 * sur `/etudiants/dossiers/:dossierId/pieces/:pieceId` (avec). Ce n'est pas une
 * coquille de ce fichier : c'est bien ce que déclare `etudiant.routes.js`.
 */

const BASE_PATH = '/etudiants';

/** Dossier complet d'un étudiant : identité, tuteurs, pièces. @param {string} etudiantId */
export const getDossier = (etudiantId) =>
  academiqueClient.get(`${BASE_PATH}/${etudiantId}/complet`);

/** Parcours académique : une entrée par année. @param {string} etudiantId */
export const getParcours = (etudiantId) =>
  academiqueClient.get(`${BASE_PATH}/${etudiantId}/parcours`);

/**
 * Dépose une pièce justificative.
 *
 * Ce n'est **pas un envoi de fichier** : l'endpoint attend un `chemin` — une
 * chaîne pointant vers un fichier déjà présent sur le serveur. Il doit respecter
 * `^/uploads/.*\.(pdf|jpg|jpeg|png)$`, contrainte portée par la base : un chemin
 * mal formé remonte en erreur SQL brute.
 *
 * @param {string} dossierId
 * @param {{type_piece: string, chemin: string}} data
 */
export const addPiece = (dossierId, data) =>
  academiqueClient.post(`${BASE_PATH}/${dossierId}/pieces`, data);

/**
 * Valide ou rejette une pièce.
 *
 * `statut` ne peut valoir que `VALIDE` ou `REJETE` (400 sinon), et `motif_rejet`
 * est **obligatoire** sur un rejet.
 *
 * @param {string} dossierId
 * @param {string} pieceId
 * @param {{statut: 'VALIDE'|'REJETE', motif_rejet?: string|null}} data
 */
export const verifyPiece = (dossierId, pieceId, data) =>
  academiqueClient.patch(`${BASE_PATH}/dossiers/${dossierId}/pieces/${pieceId}`, data);
