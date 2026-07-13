import { gestionClient } from '@/core/api/clients';
import { createResource } from '@/core/api/createResource';

/** Endpoints des concours. */

const BASE_PATH = '/concours';

/** CRUD standard : list, getById, create, update, remove. */
export const concoursResource = createResource(gestionClient, BASE_PATH);

/**
 * Change le statut d'un concours (`PLANIFIE` | `OUVERT` | `CLOTURE` | `ANNULE`).
 * @param {string} id @param {string} statut
 */
export const changeConcoursStatut = (id, statut) =>
  gestionClient.patch(`${BASE_PATH}/${id}/statut`, { statut });

/**
 * Calcule les moyennes et les rangs, puis renvoie le classement à jour.
 *
 * ⚠️ Cette route répondait **404 « Impossible de calculer »** alors que le calcul
 * réussissait : la fonction Postgres `calculer_moyennes_et_rangs` est déclarée
 * `RETURNS void` — elle écrit, sans rien renvoyer — et le contrôleur prenait ce
 * `NULL` pour un échec. Corrigé côté backend ; elle renvoie désormais le
 * classement.
 *
 * @param {string} id
 */
export const calculerMoyennesEtRangs = (id) =>
  gestionClient.get(`${BASE_PATH}/${id}/moyennes-rangs`);

/** Classement des candidats : moyenne générale et rang. @param {string} id */
export const getClassement = (id) => gestionClient.get(`${BASE_PATH}/${id}/classement`);

/**
 * Proclame les admissions.
 *
 * La proclamation **n'est pas un statut de concours** : elle écrit dans
 * `admissions_concours`. `TabDeliberation.vue` testait pourtant
 * `concours.statut === 'PROCLAMÉ'`, une valeur qui n'existe dans aucune
 * énumération — la condition était toujours fausse.
 *
 * @param {string} id
 * @param {{seuil_admission?: number, decision_liste_attente?: string, commentaire?: string|null}} data
 */
export const proclamerAdmissions = (id, data = {}) =>
  gestionClient.patch(`${BASE_PATH}/${id}/proclamer`, data);

/**
 * Télécharge la liste des admis.
 * @param {string} id @param {'pdf'|'excel'} format
 */
export const downloadAdmis = (id, format = 'pdf') =>
  gestionClient.get(`${BASE_PATH}/${id}/admis/export`, { format }, { responseType: 'blob' });
