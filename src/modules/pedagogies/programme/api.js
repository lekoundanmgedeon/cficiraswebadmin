import { pedagogieClient } from '@/core/api/clients';

/**
 * Endpoints de la maquette pédagogique (`/api/pedagogies/programme`).
 *
 * L'ancien écran gérait ses « règles » (matière, coefficient, ECTS, note
 * éliminatoire) en mémoire : aucune table n'existait. La table
 * `maquette_pedagogique` a été créée (migration 009). Vérifié en live.
 */

/** Toutes les lignes de maquette. */
export const getMaquette = () => pedagogieClient.get('/programme/maquette');

/** @param {object} data classe_code, semestre, module_code, matiere, coefficient, ects, note_eliminatoire */
export const addMaquette = (data) => pedagogieClient.post('/programme/maquette', data);

/** @param {string} id @param {object} data */
export const updateMaquette = (id, data) => pedagogieClient.put(`/programme/maquette/${id}`, data);

/** @param {string} id */
export const deleteMaquette = (id) => pedagogieClient.delete(`/programme/maquette/${id}`);
