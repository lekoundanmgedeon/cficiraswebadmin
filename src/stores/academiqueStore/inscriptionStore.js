import { defineStore } from 'pinia';
import {
  getInscriptions,
  getInscriptionById,
  createInscription,
  updateInscription,
  changeInscriptionStatus,
  importReinscriptions,
  importTuteurs,
  importInscriptions,
} from '@/api/academique/academiqueApi';
import { useMessageStore } from '@/stores/messages/messageStore';
import { extractErrorMessage } from '@/stores/messages/useErrorMessage';

// Helpers cache
function setCache(key, data) {
  localStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
}

function getCache(key, ttl = 5 * 60 * 1000) {
  const cached = localStorage.getItem(key);
  if (!cached) return null;
  const parsed = JSON.parse(cached);
  if (Date.now() - parsed.timestamp > ttl) {
    localStorage.removeItem(key);
    return null;
  }
  return parsed.data;
}

export const useInscriptionStore = defineStore('inscriptionStore', {
  state: () => ({
    inscriptions: [],
    inscription: null,
    loading: false,
  }),

  actions: {
    // Récupérer toutes les inscriptions
    async fetchInscriptions() {
      const messageStore = useMessageStore();
      this.loading = true;
      try {
        const cached = getCache('inscriptions');
        if (cached) {
          this.inscriptions = cached;
        } else {
          const response = await getInscriptions();
          this.inscriptions = response.data;
          setCache('inscriptions', response.data);
        }
      } catch (error) {
        messageStore.notifyError(
          extractErrorMessage(error, 'Erreur lors du chargement des inscriptions.')
        );
      } finally {
        this.loading = false;
      }
    },

    // Récupérer une inscription par ID
    async fetchInscriptionById(id) {
      const messageStore = useMessageStore();
      this.loading = true;
      try {
        const response = await getInscriptionById(id);
        this.inscription = response.data;
      } catch (error) {
        messageStore.notifyError(
          extractErrorMessage(error, 'Erreur lors du chargement de l’inscription.')
        );
      } finally {
        this.loading = false;
      }
    },

    // Créer une inscription
    async addInscription(data) {
      const messageStore = useMessageStore();
      this.loading = true;
      try {
        await createInscription(data);
        messageStore.notifySuccess('Inscription créée avec succès.');
        localStorage.removeItem('inscriptions');
        await this.fetchInscriptions();
      } catch (error) {
        messageStore.notifyError(
          extractErrorMessage(error, 'Erreur lors de la création de l’inscription.')
        );
      } finally {
        this.loading = false;
      }
    },

    // Modifier une inscription
    async editInscription(id, data) {
      const messageStore = useMessageStore();
      this.loading = true;
      try {
        await updateInscription(id, data);
        messageStore.notifySuccess('Inscription mise à jour avec succès.');
        localStorage.removeItem('inscriptions');
        await this.fetchInscriptions();
      } catch (error) {
        messageStore.notifyError(
          extractErrorMessage(error, 'Erreur lors de la mise à jour de l’inscription.')
        );
      } finally {
        this.loading = false;
      }
    },

    // Changer le statut d’une inscription
    async changeStatus(id, data) {
      const messageStore = useMessageStore();
      this.loading = true;
      try {
        await changeInscriptionStatus(id, data);
        messageStore.notifySuccess('Statut de l’inscription modifié avec succès.');
        await this.fetchInscriptionById(id);
      } catch (error) {
        messageStore.notifyError(
          extractErrorMessage(error, 'Erreur lors du changement de statut.')
        );
      } finally {
        this.loading = false;
      }
    },

   // Importer réinscriptions
    async importReinscriptions(file) {
      const messageStore = useMessageStore();
      this.loading = true;
      try {
        await importReinscriptions(file);
        messageStore.notifySuccess('Import des réinscriptions réussi.');
        await this.fetchInscriptions();
      } catch (error) {
        messageStore.notifyError(
          extractErrorMessage(error, 'Erreur lors de l’import des réinscriptions.')
        );
      } finally {
        this.loading = false;
      }
    },

    // Importer tuteurs
    async importTuteurs(file) {
      const messageStore = useMessageStore();
      this.loading = true;
      try {
        await importTuteurs(file);
        messageStore.notifySuccess('Import des tuteurs réussi.');
      } catch (error) {
        messageStore.notifyError(
          extractErrorMessage(error, 'Erreur lors de l’import des tuteurs.')
        );
      } finally {
        this.loading = false;
      }
    },
    // Nouvelle action : Importation par lot des inscriptions
    async bulkImportInscriptions(formData) {
      const messageStore = useMessageStore();
      this.loading = true;
      try {
        const response = await importInscriptions(formData);
        
        // Notification personnalisée si votre backend renvoie des succès partiels
        if (response.data?.summary?.totalEchecs > 0) {
          messageStore.notifySuccess('Importation complétée avec des erreurs partielles.');
        } else {
          messageStore.notifySuccess('Toutes les inscriptions ont été importées avec succès.');
        }

        // Nettoyage du cache et rechargement de la liste mise à jour
        localStorage.removeItem('inscriptions');
        await this.fetchInscriptions();
        
        return response.data; // Utile si vous voulez afficher le rapport détaillé dans votre composant Vue
      } catch (error) {
        messageStore.notifyError(
          extractErrorMessage(error, 'Erreur lors de l’importation par lot des inscriptions.')
        );
        throw error;
      } finally {
        this.loading = false;
      }
    },
  },
});