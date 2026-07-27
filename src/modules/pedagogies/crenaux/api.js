import { pedagogieClient } from '@/core/api/clients';

/**
 * Endpoints des emplois du temps (`/api/pedagogies/schedule`).
 *
 * ⚠️ Ces routes répondaient 500 : ni la table `schedule` ni la vue
 * `vue_horaire_details` n'existaient (migration 007 les crée). Elles renvoient
 * des **tableaux bruts** (pas l'enveloppe `{success, data}`) : le store lit donc
 * le résultat directement. Vérifié en live contre `localhost:3500`.
 *
 * Le backend dérive le `jour` (grille hebdomadaire) de la `date` saisie : le
 * formulaire n'a qu'à envoyer la date.
 */

/** Tous les créneaux, avec leurs libellés (via `vue_horaire_details`). */
export const getSchedulesDetails = () => pedagogieClient.get('/schedule/schedule/details');

/** Créneaux détaillés d'une classe et d'un semestre (grille). */
export const getScheduleByClasseSemestre = (classe, semestre) =>
  pedagogieClient.get(`/schedule/schedule/details/${classe}/${semestre}`);

/** @param {object} data enseignant_id, module_id, salle_id, classe_code, type_cours, semestre_id, date, heure_debut, heure_fin */
export const addSchedule = (data) => pedagogieClient.post('/schedule', data);

/** @param {string} id @param {object} data */
export const updateSchedule = (id, data) => pedagogieClient.put(`/schedule/${id}`, data);

/** @param {string} id */
export const deleteSchedule = (id) => pedagogieClient.delete(`/schedule/${id}`);
