import { evaluationClient } from '@/core/api/clients';
import { createResource } from '@/core/api/createResource';

/** Endpoints des sessions d'évaluation. */

const BASE_PATH = '/sessions-evaluations';

/** CRUD standard : list, getById, create, update, remove. */
export const sessionsResource = createResource(evaluationClient, BASE_PATH);

/**
 * Change l'état d'une session (`INACTIVE` | `ACTIVE` | `ARCHIVE`).
 *
 * Le chemin de cette route était **doublé** côté serveur : elle était déclarée
 * `router.patch('/sessions-evaluations/:id/etat')` dans un routeur *déjà* monté
 * sur `/sessions-evaluations`, si bien que la route réelle était
 * `/evaluations/sessions-evaluations/sessions-evaluations/:id/etat`.
 *
 * Le frontend appelait la version simple — la seule qui ait du sens — et
 * recevait un **404** : le changement d'état d'une session n'a jamais pu
 * aboutir. Corrigé côté backend.
 *
 * @param {string} id
 * @param {'INACTIVE'|'ACTIVE'|'ARCHIVE'} etat
 */
export const changeSessionEtat = (id, etat) =>
  evaluationClient.patch(`${BASE_PATH}/${id}/etat`, { etat });
