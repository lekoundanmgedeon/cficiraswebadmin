import { academiqueClient } from '@/core/api/clients';
import { createResource } from '@/core/api/createResource';

/** Endpoints des inscriptions. */

const BASE_PATH = '/inscriptions';

/**
 * CRUD partiel : `list`, `getById`, `create`, `update`.
 *
 * **`remove` n'a pas d'endpoint** : le backend n'expose pas
 * `DELETE /inscriptions/:id` (vérifié dans `academique/inscription.routes.js`).
 * L'ancien `InscriptionForm.vue` appelait pourtant `store.removeInscription(id)`
 * depuis un bouton « Supprimer » — une action qui n'existait ni dans le store ni
 * côté serveur. La sortie d'un dossier passe par un changement de statut
 * (`REJETEE`, `ABANDON`), ce qui préserve la traçabilité.
 *
 * `list(params)` accepte `annee_academique_id`, `classe_id` et `statut`, les
 * trois filtres que `listerInscriptions` lit dans la query string.
 */
export const inscriptionsResource = createResource(academiqueClient, BASE_PATH);

/**
 * Suivi financier : `{ totals: { total_collecte, total_attente }, inscriptions: [...] }`.
 *
 * Attention, cet endpoint parle un autre dialecte que `GET /inscriptions` :
 * il renvoie `statut: "en attente"` là où la liste renvoie `EN_ATTENTE`, et
 * `id` là où elle renvoie `inscription_id`. Voir `normalizeStatut` et le store.
 */
export const getInscriptionsFinances = () => academiqueClient.get(`${BASE_PATH}/finances`);

/**
 * Change le statut d'un dossier.
 * @param {string|number} id
 * @param {{statut: string, commentaire?: string|null}} data
 */
export const changeInscriptionStatut = (id, data) =>
  academiqueClient.patch(`${BASE_PATH}/${id}/statut`, data);

/**
 * Import par lot de nouvelles inscriptions.
 *
 * Le champ du fichier s'appelle `fichier` (et non `file`) : c'est ce que
 * `upload.single('fichier')` attend sur `POST /inscriptions/import`.
 *
 * @param {File} file
 * @param {string} codeAnnee
 */
export const importInscriptions = (file, codeAnnee) => {
  const formData = new FormData();
  formData.append('fichier', file);
  formData.append('code_annee', codeAnnee);
  return academiqueClient.post(`${BASE_PATH}/import`, formData);
};

/**
 * Import par lot de réinscriptions.
 *
 * Deux endpoints font ce travail — `POST /inscriptions/import-reinscription`
 * (champ `fichier`) et `POST /academique/imports/reinscriptions` (champ `file`).
 * On retient le premier : il vit avec la ressource, accepte `code_annee` et suit
 * la même convention de champ que l'import d'inscriptions.
 *
 * @param {File} file
 * @param {string} codeAnnee
 */
export const importReinscriptions = (file, codeAnnee) => {
  const formData = new FormData();
  formData.append('fichier', file);
  formData.append('code_annee', codeAnnee);
  return academiqueClient.post(`${BASE_PATH}/import-reinscription`, formData);
};
