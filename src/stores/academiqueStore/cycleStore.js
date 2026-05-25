import { defineStore } from 'pinia';
import {
  getCycles,
  getCycleById,
  getCycleFilieres,
  getCycleOrganisation,
  getCycleDistributionStats,
  createCycle,
  updateCycle,
  deleteCycle,
} from '@/api/academique/academiqueApi';
import { useMessageStore } from '@/stores/messages/messageStore';
import { extractErrorMessage } from '@/stores/messages/useErrorMessage';

// Helpers cache
function setCache(key, data) {
  localStorage.setItem(
    key,
    JSON.stringify({
      data,
      timestamp: Date.now(),
    })
  );
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

export const useCycleStore = defineStore('cycleStore', {
  state: () => ({
    cycles: [],
    cycle: null,
    organisationStats: [],
    filieres: [],
    stats: null,
    loading: false,
  }),

  actions: {
    // Récupérer tous les cycles
    async fetchCycles() {
      const messageStore = useMessageStore();
      this.loading = true;
      try {
        const cached = getCache('cycles');
        if (cached) {
          this.cycles = cached;
        } else {
          const response = await getCycles();
          this.cycles = response.data; // <-- important
          setCache('cycles', response.data);
        }
      } catch (error) {
        messageStore.notifyError(
          extractErrorMessage(error, 'Échec lors du chargement des cycles.')
        );
      } finally {
        this.loading = false;
      }
    },
    async fetchCycleOrganisation() {
      const messageStore = useMessageStore();
      this.loading = true;
      try {
        const response = await getCycleOrganisation();
        this.organisationStats = response.data;
      } catch (error) {
        messageStore.notifyError(
          extractErrorMessage(error, 'Échec lors du chargement de l\'organisation des cycles.')
        );
      } finally {
        this.loading = false;
      }
    }, 
    // Récupérer un cycle par ID
    async fetchCycleById(id) {
      const messageStore = useMessageStore();
      this.loading = true;
      try {
        const response = await getCycleById(id);
        this.cycle = response.data;
      } catch (error) {
        messageStore.notifyError(
          extractErrorMessage(error, 'Échec lors du chargement du cycle.')
        );
      } finally {
        this.loading = false;
      }
    },

    // Récupérer les filières d’un cycle
    async fetchCycleFilieres(id) {
      const messageStore = useMessageStore();
      this.loading = true;
      try {
        const response = await getCycleFilieres(id);
        this.filieres = response.data;
      } catch (error) {
        messageStore.notifyError(
          extractErrorMessage(error, 'Échec lors du chargement des filières.')
        );
      } finally {
        this.loading = false;
      }
    },

    // Récupérer les statistiques de distribution des cycles
    async fetchCycleDistributionStats() {
      const messageStore = useMessageStore();
      this.loading = true;
      try {
        const response = await getCycleDistributionStats();
        this.stats = response.data;
      } catch (error) {
        messageStore.notifyError(
          extractErrorMessage(error, 'Échec lors du chargement des statistiques.')
        );
      } finally {
        this.loading = false;
      }
    },

    // Ajouter un nouveau cycle
    async addCycle(data) {
      const messageStore = useMessageStore();
      this.loading = true;
      try {
        await createCycle(data);
        messageStore.notifySuccess('Cycle créé avec succès.');
        localStorage.removeItem('cycles');
        await this.fetchCycles();
      } catch (error) {
        messageStore.notifyError(
          extractErrorMessage(error, 'Erreur lors de la création du cycle.')
        );
      } finally {
        this.loading = false;
      }
    },

    // Modifier un cycle existant
    async editCycle(id, data) {
      const messageStore = useMessageStore();
      this.loading = true;
      try {
        await updateCycle(id, data);
        messageStore.notifySuccess('Cycle mis à jour avec succès.');
        localStorage.removeItem('cycles');
        await this.fetchCycles();
      } catch (error) {
        messageStore.notifyError(
          extractErrorMessage(error, 'Erreur lors de la modification du cycle.')
        );
      } finally {
        this.loading = false;
      }
    },

    // Supprimer un cycle
    async removeCycle(id) {
      const messageStore = useMessageStore();
      this.loading = true;
      try {
        await deleteCycle(id);
        messageStore.notifySuccess('Cycle supprimé avec succès.');
        localStorage.removeItem('cycles');
        await this.fetchCycles();
      } catch (error) {
        messageStore.notifyError(
          extractErrorMessage(error, 'Erreur lors de la suppression du cycle.')
        );
      } finally {
        this.loading = false;
      }
    },
  },
});
