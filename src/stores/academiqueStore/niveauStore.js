import { defineStore } from 'pinia';
import {
  getNiveaux,
  getNiveauById,
  getNiveauxByFiliere,
  getNiveauEffectifs,
  createNiveau,
  updateNiveau,
  deleteNiveau,
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

export const useNiveauStore = defineStore('niveauStore', {
  state: () => ({
    niveaux: [],
    niveau: null,
    effectifs: null,
    loading: false,
  }),

  actions: {
    // Récupérer tous les niveaux
    async fetchNiveaux() {
      const messageStore = useMessageStore();
      this.loading = true;
      try {
        const cached = getCache('niveaux');
        if (cached) {
          this.niveaux = cached;
        } else {
          const response = await getNiveaux();
          this.niveaux = response.data;
          setCache('niveaux', response.data);
        }
      } catch (error) {
        messageStore.notifyError(
          extractErrorMessage(error, 'Erreur lors du chargement des niveaux.')
        );
      } finally {
        this.loading = false;
      }
    },

    // Récupérer un niveau par ID
    async fetchNiveauById(id) {
      const messageStore = useMessageStore();
      this.loading = true;
      try {
        const response = await getNiveauById(id);
        this.niveau = response.data;
      } catch (error) {
        messageStore.notifyError(
          extractErrorMessage(error, 'Erreur lors du chargement du niveau.')
        );
      } finally {
        this.loading = false;
      }
    },

    // Récupérer les niveaux par filière
    async fetchNiveauxByFiliere(filiereId) {
      const messageStore = useMessageStore();
      this.loading = true;
      try {
        const response = await getNiveauxByFiliere(filiereId);
        this.niveaux = response.data;
      } catch (error) {
        messageStore.notifyError(
          extractErrorMessage(error, 'Erreur lors du chargement des niveaux par filière.')
        );
      } finally {
        this.loading = false;
      }
    },

    // Récupérer les effectifs d’un niveau
    async fetchNiveauEffectifs(id) {
      const messageStore = useMessageStore();
      this.loading = true;
      try {
        const response = await getNiveauEffectifs(id);
        this.effectifs = response.data;
      } catch (error) {
        messageStore.notifyError(
          extractErrorMessage(error, 'Erreur lors du chargement des effectifs.')
        );
      } finally {
        this.loading = false;
      }
    },

    // CRUD
    async addNiveau(data) {
      const messageStore = useMessageStore();
      this.loading = true;
      try {
        await createNiveau(data);
        messageStore.notifySuccess('Niveau créé avec succès.');
        localStorage.removeItem('niveaux');
        await this.fetchNiveaux();
      } catch (error) {
        messageStore.notifyError(
          extractErrorMessage(error, 'Erreur lors de la création du niveau.')
        );
      } finally {
        this.loading = false;
      }
    },

    async editNiveau(id, data) {
      const messageStore = useMessageStore();
      this.loading = true;
      try {
        await updateNiveau(id, data);
        messageStore.notifySuccess('Niveau mis à jour avec succès.');
        localStorage.removeItem('niveaux');
        await this.fetchNiveaux();
      } catch (error) {
        messageStore.notifyError(
          extractErrorMessage(error, 'Erreur lors de la mise à jour du niveau.')
        );
      } finally {
        this.loading = false;
      }
    },

    async removeNiveau(id) {
      const messageStore = useMessageStore();
      this.loading = true;
      try {
        await deleteNiveau(id);
        messageStore.notifySuccess('Niveau supprimé avec succès.');
        localStorage.removeItem('niveaux');
        await this.fetchNiveaux();
      } catch (error) {
        messageStore.notifyError(
          extractErrorMessage(error, 'Erreur lors de la suppression du niveau.')
        );
      } finally {
        this.loading = false;
      }
    },
  },
});
