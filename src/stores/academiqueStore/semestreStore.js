import { defineStore } from 'pinia';
import {
  getSemestres,
  getSemestreById,
  getActiveSemestres,
  getSemestresByAnnee,
  getSemestresOrganisation,
  getSemestreAnalytics,
  createSemestre,
  updateSemestre,
  deleteSemestre,
  changeSemestreStatus,
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

export const useSemestreStore = defineStore('semestreStore', {
  state: () => ({
    semestres: [],
    semestre: null,
    organisation: null,
    analytics: null,
    activeSemestres: [],
    loading: false,
  }),

  actions: {
    // Récupérer tous les semestres
    async fetchSemestres() {
      const messageStore = useMessageStore();
      this.loading = true;
      try {
        const cached = getCache('semestres');
        if (cached) {
          this.semestres = cached;
        } else {
          const response = await getSemestres();
          this.semestres = response.data;
          setCache('semestres', response.data);
        }
      } catch (error) {
        messageStore.notifyError(
          extractErrorMessage(error, 'Erreur lors du chargement des semestres.')
        );
      } finally {
        this.loading = false;
      }
    },

    // Récupérer un semestre par ID
    async fetchSemestreById(id) {
      const messageStore = useMessageStore();
      this.loading = true;
      try {
        const response = await getSemestreById(id);
        this.semestre = response.data;
      } catch (error) {
        messageStore.notifyError(
          extractErrorMessage(error, 'Erreur lors du chargement du semestre.')
        );
      } finally {
        this.loading = false;
      }
    },

    // Récupérer les semestres actifs
    async fetchActiveSemestres() {
      const messageStore = useMessageStore();
      this.loading = true;
      try {
        const response = await getActiveSemestres();
        this.activeSemestres = response.data;
      } catch (error) {
        messageStore.notifyError(
          extractErrorMessage(error, 'Erreur lors du chargement des semestres actifs.')
        );
      } finally {
        this.loading = false;
      }
    },

    // Récupérer les semestres par année
    async fetchSemestresByAnnee(anneeId) {
      const messageStore = useMessageStore();
      this.loading = true;
      try {
        const response = await getSemestresByAnnee(anneeId);
        this.semestres = response.data;
      } catch (error) {
        messageStore.notifyError(
          extractErrorMessage(error, 'Erreur lors du chargement des semestres par année.')
        );
      } finally {
        this.loading = false;
      }
    },

    // Organisation des semestres
    async fetchOrganisation() {
      const messageStore = useMessageStore();
      this.loading = true;
      try {
        const response = await getSemestresOrganisation();
        this.organisation = response.data;
      } catch (error) {
        messageStore.notifyError(
          extractErrorMessage(error, 'Erreur lors du chargement de l’organisation.')
        );
      } finally {
        this.loading = false;
      }
    },

    // Analytics des semestres
    async fetchAnalytics(period) {
      const messageStore = useMessageStore();
      this.loading = true;
      try {
        const response = await getSemestreAnalytics(period);
        this.analytics = response.data;
      } catch (error) {
        messageStore.notifyError(
          extractErrorMessage(error, 'Erreur lors du chargement des analytics.')
        );
      } finally {
        this.loading = false;
      }
    },

    // Changer le statut d’un semestre
    async changeStatus(id, data) {
      const messageStore = useMessageStore();
      this.loading = true;
      try {
        await changeSemestreStatus(id, data);
        messageStore.notifySuccess('Statut du semestre modifié avec succès.');
        await this.fetchSemestreById(id);
      } catch (error) {
        messageStore.notifyError(
          extractErrorMessage(error, 'Erreur lors du changement de statut.')
        );
      } finally {
        this.loading = false;
      }
    },

    // CRUD
    async addSemestre(data) {
      const messageStore = useMessageStore();
      this.loading = true;
      try {
        await createSemestre(data);
        messageStore.notifySuccess('Semestre créé avec succès.');
        localStorage.removeItem('semestres');
        await this.fetchSemestres();
      } catch (error) {
        messageStore.notifyError(
          extractErrorMessage(error, 'Erreur lors de la création du semestre.')
        );
      } finally {
        this.loading = false;
      }
    },

    async editSemestre(id, data) {
      const messageStore = useMessageStore();
      this.loading = true;
      try {
        await updateSemestre(id, data);
        messageStore.notifySuccess('Semestre mis à jour avec succès.');
        localStorage.removeItem('semestres');
        await this.fetchSemestres();
      } catch (error) {
        messageStore.notifyError(
          extractErrorMessage(error, 'Erreur lors de la mise à jour du semestre.')
        );
      } finally {
        this.loading = false;
      }
    },

    async removeSemestre(id) {
      const messageStore = useMessageStore();
      this.loading = true;
      try {
        await deleteSemestre(id);
        messageStore.notifySuccess('Semestre supprimé avec succès.');
        localStorage.removeItem('semestres');
        await this.fetchSemestres();
      } catch (error) {
        messageStore.notifyError(
          extractErrorMessage(error, 'Erreur lors de la suppression du semestre.')
        );
      } finally {
        this.loading = false;
      }
    },
  },
});
