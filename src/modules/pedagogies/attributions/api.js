import { pedagogieClient } from '@/core/api/clients';

/**
 * Endpoints d'attribution des cours (`/api/pedagogies/attribution`).
 *
 * Affecte un module (matière) d'une classe à un enseignant, avec un volume
 * horaire, dans la table `moduleclasse`. La colonne `heures` et la vue
 * `vue_attributions_cours` ont été ajoutées (migration 008) : l'ancien écran
 * n'avait aucun backend et gérait des assignations en mémoire. Vérifié en live.
 */

/** Toutes les attributions, avec leurs libellés (classe, matière, formateur). */
export const getAttributions = () => pedagogieClient.get('/attribution/attributions');

/** @param {{module_id,classe_id,enseignant_id,semestre_id,heures}} data */
export const addAttribution = (data) => pedagogieClient.post('/attribution/attributions', data);

/** @param {string} id */
export const deleteAttribution = (id) =>
  pedagogieClient.delete(`/attribution/attributions/${id}`);
