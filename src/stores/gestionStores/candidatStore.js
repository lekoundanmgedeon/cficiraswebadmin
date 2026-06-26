import { defineStore } from 'pinia';
import {
  createCandidat,
  addPieceCandidat,
  importCandidats,
  importNotesCandidats,
  addNoteEpreuve,
  getCandidatsByConcours,
  getCandidatsByEpreuve,
  getCandidatById,
} from '@/api/gestions/gestionApi';
import { useMessageStore } from '@/stores/messages/messageStore';
import { extractErrorMessage } from '@/stores/messages/useErrorMessage';

export const useCandidatStore = defineStore('candidatStore', {
  state: () => ({
    candidats: [],
    candidat: null,
    loading: false,
  }),

  actions: {
    // Créer un candidat
    async addCandidat(data) {
      const messageStore = useMessageStore();
      this.loading = true;
      try {
        await createCandidat(data);
        messageStore.notifySuccess('Candidat créé avec succès.');
      } catch (error) {
        messageStore.notifyError(
          extractErrorMessage(error, 'Erreur lors de la création du candidat.')
        );
      } finally {
        this.loading = false;
      }
    },

    // Ajouter une pièce justificative
    async addPiece(id, data) {
      const messageStore = useMessageStore();
      this.loading = true;
      try {
        await addPieceCandidat(id, data);
        messageStore.notifySuccess('Pièce justificative ajoutée avec succès.');
      } catch (error) {
        messageStore.notifyError(extractErrorMessage(error, 'Erreur lors de l’ajout de la pièce.'));
      } finally {
        this.loading = false;
      }
    },

    // Importer candidats par lot
    async importCandidatsFile(formData) {
      const messageStore = useMessageStore();
      this.loading = true;
      try {
        await importCandidats(formData);
        messageStore.notifySuccess('Import des candidats réussi.');
      } catch (error) {
        messageStore.notifyError(
          extractErrorMessage(error, 'Erreur lors de l’import des candidats.')
        );
      } finally {
        this.loading = false;
      }
    },
    // Importer notes par lot
    async importNotesFile(concoursId, file) {
      const messageStore = useMessageStore();
      this.loading = true;
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('concours_id', concoursId);
        const response = await importNotesCandidats(formData);
        messageStore.notifySuccess('Import des notes réussi.');
        return response.data; 
      } catch (error) {
        messageStore.notifyError(extractErrorMessage(error, 'Erreur lors de l’import des notes.'));
        throw error;
      } finally {
        this.loading = false;
      }
    },

    // Ajouter une note d’épreuve
    async addNote(numTable, data) {
      const messageStore = useMessageStore();
      this.loading = true;
      try {
        const response = await addNoteEpreuve(numTable, data);
        messageStore.notifySuccess('Note enregistrée avec succès.');
        return response.data;
      } catch (error) {
        messageStore.notifyError(
          extractErrorMessage(error, 'Erreur lors de l’enregistrement de la note.')
        );
        throw error;
      } finally {
        this.loading = false;
      }
    },

    // Lister candidats d’un concours
    async fetchCandidatsByConcours(concoursId) {
      const messageStore = useMessageStore();
      this.loading = true;
      try {
        const response = await getCandidatsByConcours(concoursId);
        this.candidats = response.data;
      } catch (error) {
        messageStore.notifyError(
          extractErrorMessage(error, 'Erreur lors du chargement des candidats.')
        );
      } finally {
        this.loading = false;
      }
    },
  async fetchCandidatsByEpreuve(concoursId, epreuve_code) {
  const messageStore = useMessageStore();
  this.loading = true;

  try {
    const response = await getCandidatsByEpreuve(concoursId, epreuve_code);
    this.candidats = response.data;
  } catch (error) {
    messageStore.notifyError(
      extractErrorMessage(
        error,
        "Erreur lors du chargement des candidats de l’épreuve."
      )
    );
    this.candidats = [];
  } finally {
    this.loading = false;
  }
},

    // Récupérer un candidat par ID
    async fetchCandidatById(id) {
      const messageStore = useMessageStore();
      this.loading = true;
      try {
        const response = await getCandidatById(id);
        this.candidat = response.data;
      } catch (error) {
        messageStore.notifyError(
          extractErrorMessage(error, 'Erreur lors du chargement du candidat.')
        );
      } finally {
        this.loading = false;
      }
    },
  },
});
