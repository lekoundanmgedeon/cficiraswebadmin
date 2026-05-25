import { defineStore } from 'pinia';
import {
  getConcours,
  getConcoursById,
  createConcours,
  updateConcours,
  changeConcoursStatut,
  deleteConcours,
  calculerMoyennesEtRangs,
  proclamerAdmissions,
  downloadAdmis,
} from '@/api/gestions/gestionApi';
import { useMessageStore } from '@/stores/messages/messageStore';
import { extractErrorMessage } from '@/stores/messages/useErrorMessage';

export const useConcoursStore = defineStore('concoursStore', {
  state: () => ({
    concoursList: [],
    concours: null,
    moyennesRangs: null,
    loading: false,
  }),

  actions: {
    // Récupérer tous les concours
    async fetchConcours() {
      const messageStore = useMessageStore();
      this.loading = true;
      try {
        const response = await getConcours();
        this.concoursList = response.data;
      } catch (error) {
        messageStore.notifyError(
          extractErrorMessage(error, 'Erreur lors du chargement des concours.')
        );
      } finally {
        this.loading = false;
      }
    },

    // Récupérer un concours par ID
    async fetchConcoursById(id) {
      const messageStore = useMessageStore();
      this.loading = true;
      try {
        const response = await getConcoursById(id);
        this.concours = response.data;
      } catch (error) {
        messageStore.notifyError(
          extractErrorMessage(error, 'Erreur lors du chargement du concours.')
        );
      } finally {
        this.loading = false;
      }
    },

    // Créer un concours
    async addConcours(data) {
      const messageStore = useMessageStore();
      this.loading = true;
      try {
        await createConcours(data);
        messageStore.notifySuccess('Concours créé avec succès.');
        await this.fetchConcours();
      } catch (error) {
        messageStore.notifyError(
          extractErrorMessage(error, 'Erreur lors de la création du concours.')
        );
      } finally {
        this.loading = false;
      }
    },

    // Modifier un concours
    async editConcours(id, data) {
      const messageStore = useMessageStore();
      this.loading = true;
      try {
        await updateConcours(id, data);
        messageStore.notifySuccess('Concours mis à jour avec succès.');
        await this.fetchConcours();
      } catch (error) {
        messageStore.notifyError(
          extractErrorMessage(error, 'Erreur lors de la mise à jour du concours.')
        );
      } finally {
        this.loading = false;
      }
    },

    // Modifier le statut d’un concours
    async changeStatut(id, data) {
      const messageStore = useMessageStore();
      this.loading = true;
      try {
        await changeConcoursStatut(id, data);
        messageStore.notifySuccess('Statut du concours modifié avec succès.');
        await this.fetchConcoursById(id);
      } catch (error) {
        messageStore.notifyError(
          extractErrorMessage(error, 'Erreur lors du changement de statut.')
        );
      } finally {
        this.loading = false;
      }
    },

    // Supprimer un concours
    async removeConcours(id) {
      const messageStore = useMessageStore();
      this.loading = true;
      try {
        await deleteConcours(id);
        messageStore.notifySuccess('Concours supprimé avec succès.');
        await this.fetchConcours();
      } catch (error) {
        messageStore.notifyError(
          extractErrorMessage(error, 'Erreur lors de la suppression du concours.')
        );
      } finally {
        this.loading = false;
      }
    },

    // Calculer moyennes et rangs
    async fetchMoyennesRangs(id) {
      const messageStore = useMessageStore();
      this.loading = true;
      try {
        const response = await calculerMoyennesEtRangs(id);
        this.moyennesRangs = response.data;
      } catch (error) {
        messageStore.notifyError(
          extractErrorMessage(error, 'Erreur lors du calcul des moyennes et rangs.')
        );
      } finally {
        this.loading = false;
      }
    },

    // Proclamer admissions
    async proclaimAdmissions(id) {
      const messageStore = useMessageStore();
      this.loading = true;
      try {
        await proclamerAdmissions(id);
        messageStore.notifySuccess('Admissions proclamées avec succès.');
        await this.fetchConcoursById(id);
      } catch (error) {
        messageStore.notifyError(
          extractErrorMessage(error, 'Erreur lors de la proclamation des admissions.')
        );
      } finally {
        this.loading = false;
      }
    },

    // Télécharger liste des admis
    async downloadAdmisList(id) {
      const messageStore = useMessageStore();
      this.loading = true;
      try {
        const response = await downloadAdmis(id);
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `admis_concours_${id}.pdf`;
        link.click();
        messageStore.notifySuccess('Liste des admis téléchargée.');
      } catch (error) {
        messageStore.notifyError(
          extractErrorMessage(error, 'Erreur lors du téléchargement de la liste des admis.')
        );
      } finally {
        this.loading = false;
      }
    },
  },
});
