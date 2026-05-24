import { defineStore } from 'pinia';
import {
  getNotesByEvaluation,
  publierNotesEvaluation,
  getNotesByEtudiant,
  updateNote,
} from '@/api/evaluations/notesApi';
import { useMessageStore } from '@/stores/messages/messageStore';
import { extractErrorMessage } from '@/stores/messages/useErrorMessage';

export const useNoteStore = defineStore('noteStore', {
  state: () => ({
    notesEvaluation: [],
    notesEtudiant: [],
    loading: false,
  }),

  actions: {
    // Récupérer les notes d'une évaluation
    async fetchNotesByEvaluation(evaluationId) {
      const messageStore = useMessageStore();
      this.loading = true;
      try {
        const response = await getNotesByEvaluation(evaluationId);
        this.notesEvaluation = response.data;
      } catch (error) {
        messageStore.notifyError(extractErrorMessage(error, 'Erreur lors du chargement des notes de l’évaluation.'));
      } finally {
        this.loading = false;
      }
    },

    // Publier les notes d'une évaluation
    async publishNotesEvaluation(evaluationId) {
      const messageStore = useMessageStore();
      this.loading = true;
      try {
        await publierNotesEvaluation(evaluationId);
        messageStore.notifySuccess('Notes publiées avec succès.');
        await this.fetchNotesByEvaluation(evaluationId);
      } catch (error) {
        messageStore.notifyError(extractErrorMessage(error, 'Erreur lors de la publication des notes.'));
      } finally {
        this.loading = false;
      }
    },

    // Récupérer les notes d'un étudiant
    async fetchNotesByEtudiant(etudiantId, semestreId) {
      const messageStore = useMessageStore();
      this.loading = true;
      try {
        const response = await getNotesByEtudiant(etudiantId, semestreId);
        this.notesEtudiant = response.data;
      } catch (error) {
        messageStore.notifyError(extractErrorMessage(error, 'Erreur lors du chargement des notes de l’étudiant.'));
      } finally {
        this.loading = false;
      }
    },

    // Mettre à jour une note spécifique
    async editNote(id, data) {
      const messageStore = useMessageStore();
      this.loading = true;
      try {
        await updateNote(id, data);
        messageStore.notifySuccess('Note mise à jour avec succès.');
      } catch (error) {
        messageStore.notifyError(extractErrorMessage(error, 'Erreur lors de la mise à jour de la note.'));
      } finally {
        this.loading = false;
      }
    },
  },
});
