import buildService from '../config/serviceApi';
import { evaluationApi } from '../config/apiClients';

const noteService = buildService(evaluationApi);

// Voir la grille de notes d'une évaluation
export const getNotesByEvaluation = (evaluationId) =>
  noteService.get(`/evaluations/${evaluationId}/notes`);

// Publier les notes d'une évaluation
export const publierNotesEvaluation = (evaluationId) =>
  noteService.patch(`/evaluations/${evaluationId}/notes/publier`);

// --- Routes axées sur l'Étudiant ---
// Voir les notes d'un étudiant (avec semestreId en Query Params)
export const getNotesByEtudiant = (etudiantId, semestreId) =>
  noteService.get(`/etudiants/${etudiantId}/notes`, {
    params: { semestreId },
  });

// --- Routes axées sur la Note elle-même ---
// Mettre à jour une note spécifique
export const updateNote = (id, data) => noteService.put(`/notes/${id}`, data);
