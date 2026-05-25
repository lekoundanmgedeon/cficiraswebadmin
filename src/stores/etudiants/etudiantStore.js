import { defineStore } from 'pinia';
import {
  createEtudiant,
  addTuteurToEtudiant,
  uploadPhotoEtudiant,
  getParcoursAcademique,
} from '@/api/academique/etudiantApi';
import { useMessageStore } from '@/stores/messages/messageStore';
import { extractErrorMessage } from '@/stores/messages/useErrorMessage';

export const useEtudiantStore = defineStore('etudiantStore', {
  state: () => ({
    etudiant: null,
    parcours: null,
    loading: false,
  }),

  actions: {
    // Créer un étudiant
    async addEtudiant(data) {
      const messageStore = useMessageStore();
      this.loading = true;
      try {
        const response = await createEtudiant(data);
        this.etudiant = response.data;
        messageStore.notifySuccess('Étudiant créé avec succès.');
      } catch (error) {
        messageStore.notifyError(extractErrorMessage(error, 'Erreur lors de la création de l’étudiant.'));
      } finally {
        this.loading = false;
      }
    },

    // Ajouter un tuteur à un étudiant
    async addTuteur(etudiantId, data) {
      const messageStore = useMessageStore();
      this.loading = true;
      try {
        await addTuteurToEtudiant(etudiantId, data);
        messageStore.notifySuccess('Tuteur ajouté avec succès.');
      } catch (error) {
        messageStore.notifyError(extractErrorMessage(error, 'Erreur lors de l’ajout du tuteur.'));
      } finally {
        this.loading = false;
      }
    },

    // Upload photo de profil
    async uploadPhoto(etudiantId, file) {
      const messageStore = useMessageStore();
      this.loading = true;
      try {
        await uploadPhotoEtudiant(etudiantId, file);
        messageStore.notifySuccess('Photo de profil mise à jour avec succès.');
      } catch (error) {
        messageStore.notifyError(extractErrorMessage(error, 'Erreur lors du téléchargement de la photo.'));
      } finally {
        this.loading = false;
      }
    },

    // Récupérer parcours académique
    async fetchParcours(id) {
      const messageStore = useMessageStore();
      this.loading = true;
      try {
        const response = await getParcoursAcademique(id);
        this.parcours = response.data;
      } catch (error) {
        messageStore.notifyError(extractErrorMessage(error, 'Erreur lors du chargement du parcours académique.'));
      } finally {
        this.loading = false;
      }
    },
  },
});
