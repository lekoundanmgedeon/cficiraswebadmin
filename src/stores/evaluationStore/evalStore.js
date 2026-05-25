import { defineStore } from 'pinia';
import {
  createEvaluation,
  getEvaluations,
  getEvaluationById,
  updateEvaluation,
  deleteEvaluation,
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

export const useEvaluationStore = defineStore('evaluationStore', {
  state: () => ({
    evaluations: [],
    evaluation: null,
    loading: false,
  }),

  actions: {
    // Récupérer toutes les évaluations
    async fetchEvaluations() {
      const messageStore = useMessageStore();
      this.loading = true;
      try {
        const cached = getCache('evaluations');
        if (cached) {
          this.evaluations = cached;
        } else {
          const response = await getEvaluations();
          this.evaluations = response.data;
          setCache('evaluations', response.data);
        }
      } catch (error) {
        messageStore.notifyError(
          extractErrorMessage(error, 'Erreur lors du chargement des évaluations.')
        );
      } finally {
        this.loading = false;
      }
    },

    // Récupérer une évaluation par ID
    async fetchEvaluationById(id) {
      const messageStore = useMessageStore();
      this.loading = true;
      try {
        const response = await getEvaluationById(id);
        this.evaluation = response.data;
      } catch (error) {
        messageStore.notifyError(
          extractErrorMessage(error, 'Erreur lors du chargement de l’évaluation.')
        );
      } finally {
        this.loading = false;
      }
    },

    // Créer une évaluation
    async addEvaluation(data) {
      const messageStore = useMessageStore();
      this.loading = true;
      try {
        await createEvaluation(data);
        messageStore.notifySuccess('Évaluation créée avec succès.');
        localStorage.removeItem('evaluations');
        await this.fetchEvaluations();
      } catch (error) {
        messageStore.notifyError(
          extractErrorMessage(error, 'Erreur lors de la création de l’évaluation.')
        );
      } finally {
        this.loading = false;
      }
    },

    // Modifier une évaluation
    async editEvaluation(id, data) {
      const messageStore = useMessageStore();
      this.loading = true;
      try {
        await updateEvaluation(id, data);
        messageStore.notifySuccess('Évaluation mise à jour avec succès.');
        localStorage.removeItem('evaluations');
        await this.fetchEvaluations();
      } catch (error) {
        messageStore.notifyError(
          extractErrorMessage(error, 'Erreur lors de la mise à jour de l’évaluation.')
        );
      } finally {
        this.loading = false;
      }
    },

    // Supprimer une évaluation
    async removeEvaluation(id) {
      const messageStore = useMessageStore();
      this.loading = true;
      try {
        await deleteEvaluation(id);
        messageStore.notifySuccess('Évaluation supprimée avec succès.');
        localStorage.removeItem('evaluations');
        await this.fetchEvaluations();
      } catch (error) {
        messageStore.notifyError(
          extractErrorMessage(error, 'Erreur lors de la suppression de l’évaluation.')
        );
      } finally {
        this.loading = false;
      }
    },
  },
});
