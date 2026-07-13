import { evaluationClient } from '@/core/api/clients';

/**
 * Endpoints des notes.
 *
 * ## Aucun de ces quatre appels ne fonctionnait
 *
 * Le routeur des notes est monté sur `/notes`, **et ses chemins internes
 * répètent le segment** (`router.get('/evaluations/:evaluationId/notes')`,
 * `router.put('/notes/:id')`). Les URL réelles sont donc :
 *
 * ```
 * GET   /evaluations/notes/evaluations/:evaluationId/notes
 * PATCH /evaluations/notes/evaluations/:evaluationId/notes/publier
 * GET   /evaluations/notes/etudiants/:etudiantId/notes?semestreId=…
 * PUT   /evaluations/notes/notes/:id
 * ```
 *
 * L'ancien `notesApi.js` appelait `/evaluations/:id/notes`, `/etudiants/:id/notes`
 * et `/notes/:id` — **sans le préfixe `/notes`**. Les quatre répondaient **404**,
 * vérifié par curl. **L'API des notes n'a jamais fonctionné.**
 *
 * Le doublement du segment est inélégant, mais c'est ce que le serveur expose ;
 * le corriger côté backend casserait l'API sans nécessité. Voir §2.5 du point de
 * reprise.
 *
 * ## Une note ne se crée pas
 *
 * Il n'existe **pas de `POST`** : les notes préexistent (une ligne par couple
 * étudiant / évaluation) et l'application ne fait que les **mettre à jour**.
 */

const BASE_PATH = '/notes';

/** Grille de notes d'une évaluation. @param {string} evaluationId */
export const getNotesByEvaluation = (evaluationId) =>
  evaluationClient.get(`${BASE_PATH}/evaluations/${evaluationId}/notes`);

/** Publie toutes les notes d'une évaluation. @param {string} evaluationId */
export const publierNotesEvaluation = (evaluationId) =>
  evaluationClient.patch(`${BASE_PATH}/evaluations/${evaluationId}/notes/publier`);

/**
 * Notes d'un étudiant pour un semestre.
 * `semestreId` est **obligatoire** : le serveur répond 400 sans lui.
 * @param {string} etudiantId @param {string} semestreId
 */
export const getNotesByEtudiant = (etudiantId, semestreId) =>
  evaluationClient.get(`${BASE_PATH}/etudiants/${etudiantId}/notes`, { semestreId });

/**
 * Met à jour une note.
 * @param {string} id
 * @param {{valeur: number, commentaire?: string|null}} data
 */
export const updateNote = (id, data) => evaluationClient.put(`${BASE_PATH}/notes/${id}`, data);
