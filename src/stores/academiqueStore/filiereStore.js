import { defineStore } from 'pinia';
import {
  getFilieres,
  getFiliereById,
  getFiliereOrganisation,
  getFilieresByCycle,
  getFiliereStats,
  createFiliere,
  updateFiliere,
  deleteFiliere,
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

export const useFiliereStore = defineStore('filiereStore', {
  state: () => ({
    filieres: [],
    filiere: null,
    organisationTree: null,
    stats: null,
    loading: false,
  }),

  actions: {
    // Récupérer toutes les filières
    async fetchFilieres() {
      const messageStore = useMessageStore();
      this.loading = true;
      try {
        const cached = getCache('filieres');
        if (cached) {
          this.filieres = cached;
        } else {
          const response = await getFilieres();
          this.filieres = response.data;
          setCache('filieres', response.data);
        }
      } catch (error) {
        messageStore.notifyError(
          extractErrorMessage(error, 'Erreur lors du chargement des filières.')
        );
      } finally {
        this.loading = false;
      }
    },

    // Récupérer une filière par ID
    async fetchFiliereById(id) {
      const messageStore = useMessageStore();
      this.loading = true;
      try {
        const response = await getFiliereById(id);
        this.filiere = response.data;
      } catch (error) {
        messageStore.notifyError(
          extractErrorMessage(error, 'Erreur lors du chargement de la filière.')
        );
      } finally {
        this.loading = false;
      }
    },

    // Organisation des filières
    async fetchFiliereOrganisation() {
      const messageStore = useMessageStore();
      this.loading = true;
      try {
        const response = await getFiliereOrganisation();
        this.organisationTree = response.data;
      } catch (error) {
        messageStore.notifyError(
          extractErrorMessage(error, 'Erreur lors du chargement de l’organisation.')
        );
      } finally {
        this.loading = false;
      }
    },

    // Récupérer les filières par cycle
    async fetchFilieresByCycle(cycleId) {
      const messageStore = useMessageStore();
      this.loading = true;
      try {
        const response = await getFilieresByCycle(cycleId);
        this.filieres = response.data;
      } catch (error) {
        messageStore.notifyError(
          extractErrorMessage(error, 'Erreur lors du chargement des filières par cycle.')
        );
      } finally {
        this.loading = false;
      }
    },

    // Récupérer statistiques d’une filière
    async fetchFiliereStats(id) {
      const messageStore = useMessageStore();
      this.loading = true;
      try {
        const response = await getFiliereStats(id);
        this.stats = response.data;
      } catch (error) {
        messageStore.notifyError(
          extractErrorMessage(error, 'Erreur lors du chargement des statistiques.')
        );
      } finally {
        this.loading = false;
      }
    },

    // CRUD
    async addFiliere(data) {
      const messageStore = useMessageStore();
      this.loading = true;
      try {
        await createFiliere(data);
        messageStore.notifySuccess('Filière créée avec succès.');
        localStorage.removeItem('filieres');
        await this.fetchFilieres();
      } catch (error) {
        messageStore.notifyError(
          extractErrorMessage(error, 'Erreur lors de la création de la filière.')
        );
      } finally {
        this.loading = false;
      }
    },

    async editFiliere(id, data) {
      const messageStore = useMessageStore();
      this.loading = true;
      try {
        await updateFiliere(id, data);
        messageStore.notifySuccess('Filière mise à jour avec succès.');
        localStorage.removeItem('filieres');
        await this.fetchFilieres();
      } catch (error) {
        messageStore.notifyError(
          extractErrorMessage(error, 'Erreur lors de la mise à jour de la filière.')
        );
      } finally {
        this.loading = false;
      }
    },

    async removeFiliere(id) {
      const messageStore = useMessageStore();
      this.loading = true;
      try {
        await deleteFiliere(id);
        messageStore.notifySuccess('Filière supprimée avec succès.');
        localStorage.removeItem('filieres');
        await this.fetchFilieres();
      } catch (error) {
        messageStore.notifyError(
          extractErrorMessage(error, 'Erreur lors de la suppression de la filière.')
        );
      } finally {
        this.loading = false;
      }
    },
  },
});
