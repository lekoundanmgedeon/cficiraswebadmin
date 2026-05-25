import { defineStore } from 'pinia';
import {
  getSemestresConfiguration,
  getUesByConfiguration,
  detachUeFromConfig,
  assignModuleToClasse,
  createModule,
  updateModule,
  deleteModule,
} from '@/api/academique/moduleApi';
import { useMessageStore } from '@/stores/messages/messageStore';
import { extractErrorMessage } from '@/stores/messages/useErrorMessage';

export const useModuleStore = defineStore('moduleStore', {
  state: () => ({
    semestresConfig: [],
    uesConfig: [],
    loading: false,
  }),

  actions: {
    // Récupérer configuration des semestres
    async fetchSemestresConfiguration() {
      const messageStore = useMessageStore();
      this.loading = true;
      try {
        const response = await getSemestresConfiguration();
        this.semestresConfig = response.data;
      } catch (error) {
        messageStore.notifyError(extractErrorMessage(error, 'Erreur lors du chargement de la configuration des semestres.'));
      } finally {
        this.loading = false;
      }
    },

    // Récupérer les UE par configuration
    async fetchUesByConfiguration() {
      const messageStore = useMessageStore();
      this.loading = true;
      try {
        const response = await getUesByConfiguration();
        this.uesConfig = response.data;
      } catch (error) {
        messageStore.notifyError(extractErrorMessage(error, 'Erreur lors du chargement des UE.'));
      } finally {
        this.loading = false;
      }
    },

    // Détacher une UE d’une configuration
    async detachUe(attributionId) {
      const messageStore = useMessageStore();
      this.loading = true;
      try {
        await detachUeFromConfig(attributionId);
        messageStore.notifySuccess('UE détachée avec succès.');
        await this.fetchUesByConfiguration();
      } catch (error) {
        messageStore.notifyError(extractErrorMessage(error, 'Erreur lors du détachement de l’UE.'));
      } finally {
        this.loading = false;
      }
    },

    // Assigner un module à une classe
    async assignModule(data) {
      const messageStore = useMessageStore();
      this.loading = true;
      try {
        await assignModuleToClasse(data);
        messageStore.notifySuccess('Module assigné avec succès.');
      } catch (error) {
        messageStore.notifyError(extractErrorMessage(error, 'Erreur lors de l’assignation du module.'));
      } finally {
        this.loading = false;
      }
    },

    // CRUD
    async addModule(data) {
      const messageStore = useMessageStore();
      this.loading = true;
      try {
        await createModule(data);
        messageStore.notifySuccess('Module créé avec succès.');
        await this.fetchUesByConfiguration();
      } catch (error) {
        messageStore.notifyError(extractErrorMessage(error, 'Erreur lors de la création du module.'));
      } finally {
        this.loading = false;
      }
    },

    async editModule(id, data) {
      const messageStore = useMessageStore();
      this.loading = true;
      try {
        await updateModule(id, data);
        messageStore.notifySuccess('Module mis à jour avec succès.');
        await this.fetchUesByConfiguration();
      } catch (error) {
        messageStore.notifyError(extractErrorMessage(error, 'Erreur lors de la mise à jour du module.'));
      } finally {
        this.loading = false;
      }
    },

    async removeModule(id) {
      const messageStore = useMessageStore();
      this.loading = true;
      try {
        await deleteModule(id);
        messageStore.notifySuccess('Module supprimé avec succès.');
        await this.fetchUesByConfiguration();
      } catch (error) {
        messageStore.notifyError(extractErrorMessage(error, 'Erreur lors de la suppression du module.'));
      } finally {
        this.loading = false;
      }
    },
  },
});
