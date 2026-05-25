import { defineStore } from 'pinia';
import {
  getClasses,
  getClasseById,
  getClassesOrganisationTree,
  getGlobalInfrastructureKPIs,
  getClassesByNiveau,
  getClassesByFiliere,
  getClasseStudents,
  getClasseModules,
  assignModuleToClasse,
  getClasseOccupancyRate,
  createClasse,
  updateClasse,
  deleteClasse,
} from '@/api/academique/academiqueApi';
import { useMessageStore } from '@/stores/messages/messageStore';
import { extractErrorMessage } from '@/stores/messages/useErrorMessage';

// Helpers cache
function setCache(key, data) {
  localStorage.setItem(
    key,
    JSON.stringify({ data, timestamp: Date.now() })
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

export const useClasseStore = defineStore('classeStore', {
  state: () => ({
    classes: [],
    classesNiveau: [],
    classe: null,
    organisationTree: null,
    analytics: null,
    students: [],
    modules: [],
    occupancyRate: null,
    loading: false,
  }),

  actions: {
    // Récupérer toutes les classes
    async fetchClasses() {
      const messageStore = useMessageStore();
      this.loading = true;
      try {
        const cached = getCache('classes');
        if (cached) {
          this.classes = cached;
        } else {
          const response = await getClasses();
          this.classes = response.data;
          setCache('classes', response.data);
        }
      } catch (error) {
        messageStore.notifyError(extractErrorMessage(error, 'Erreur lors du chargement des classes.'));
      } finally {
        this.loading = false;
      }
    },

    // Récupérer une classe par ID
    async fetchClasseById(id) {
      const messageStore = useMessageStore();
      this.loading = true;
      try {
        const response = await getClasseById(id);
        this.classe = response.data;
      } catch (error) {
        messageStore.notifyError(extractErrorMessage(error, 'Erreur lors du chargement de la classe.'));
      } finally {
        this.loading = false;
      }
    },

    // Organisation des classes
    async fetchOrganisationTree() {
      const messageStore = useMessageStore();
      this.loading = true;
      try {
        const response = await getClassesOrganisationTree();
        this.organisationTree = response.data;
      } catch (error) {
        messageStore.notifyError(extractErrorMessage(error, 'Erreur lors du chargement de l’organisation.'));
      } finally {
        this.loading = false;
      }
    },

    // Analytics globales
    async fetchAnalytics() {
      const messageStore = useMessageStore();
      this.loading = true;
      try {
        const response = await getGlobalInfrastructureKPIs();
        this.analytics = response.data;
      } catch (error) {
        messageStore.notifyError(extractErrorMessage(error, 'Erreur lors du chargement des analytics.'));
      } finally {
        this.loading = false;
      }
    },

    // Récupérer classes par niveau
    async fetchClassesByNiveau(niveauId) {
      const messageStore = useMessageStore();
      this.loading = true;
      try {
        const response = await getClassesByNiveau(niveauId);
        this.classesNiveau = response.data;
      } catch (error) {
        messageStore.notifyError(extractErrorMessage(error, 'Erreur lors du chargement des classes par niveau.'));
      } finally {
        this.loading = false;
      }
    },

    // Récupérer classes par filière
    async fetchClassesByFiliere(filiereId) {
      const messageStore = useMessageStore();
      this.loading = true;
      try {
        const response = await getClassesByFiliere(filiereId);
        this.classes = response.data;
      } catch (error) {
        messageStore.notifyError(extractErrorMessage(error, 'Erreur lors du chargement des classes par filière.'));
      } finally {
        this.loading = false;
      }
    },

    // Récupérer étudiants d’une classe
    async fetchClasseStudents(id) {
      const messageStore = useMessageStore();
      this.loading = true;
      try {
        const response = await getClasseStudents(id);
        this.students = response.data;
      } catch (error) {
        messageStore.notifyError(extractErrorMessage(error, 'Erreur lors du chargement des étudiants.'));
      } finally {
        this.loading = false;
      }
    },

    // Récupérer modules d’une classe
    async fetchClasseModules(id) {
      const messageStore = useMessageStore();
      this.loading = true;
      try {
        const response = await getClasseModules(id);
        this.modules = response.data;
      } catch (error) {
        messageStore.notifyError(extractErrorMessage(error, 'Erreur lors du chargement des modules.'));
      } finally {
        this.loading = false;
      }
    },

    // Assigner un module à une classe
    async assignModule(id, data) {
      const messageStore = useMessageStore();
      this.loading = true;
      try {
        await assignModuleToClasse(id, data);
        messageStore.notifySuccess('Module assigné avec succès.');
        await this.fetchClasseModules(id);
      } catch (error) {
        messageStore.notifyError(extractErrorMessage(error, 'Erreur lors de l’assignation du module.'));
      } finally {
        this.loading = false;
      }
    },

    // Récupérer taux de remplissage
    async fetchOccupancyRate(id) {
      const messageStore = useMessageStore();
      this.loading = true;
      try {
        const response = await getClasseOccupancyRate(id);
        this.occupancyRate = response.data;
      } catch (error) {
        messageStore.notifyError(extractErrorMessage(error, 'Erreur lors du chargement du taux de remplissage.'));
      } finally {
        this.loading = false;
      }
    },

    // CRUD
    async addClasse(data) {
      const messageStore = useMessageStore();
      this.loading = true;
      try {
        await createClasse(data);
        messageStore.notifySuccess('Classe créée avec succès.');
        localStorage.removeItem('classes');
        await this.fetchClasses();
      } catch (error) {
        messageStore.notifyError(extractErrorMessage(error, 'Erreur lors de la création de la classe.'));
      } finally {
        this.loading = false;
      }
    },

    async editClasse(id, data) {
      const messageStore = useMessageStore();
      this.loading = true;
      try {
        await updateClasse(id, data);
        messageStore.notifySuccess('Classe mise à jour avec succès.');
        localStorage.removeItem('classes');
        await this.fetchClasses();
      } catch (error) {
        messageStore.notifyError(extractErrorMessage(error, 'Erreur lors de la mise à jour de la classe.'));
      } finally {
        this.loading = false;
      }
    },

    async removeClasse(id) {
      const messageStore = useMessageStore();
      this.loading = true;
      try {
        await deleteClasse(id);
        messageStore.notifySuccess('Classe supprimée avec succès.');
        localStorage.removeItem('classes');
        await this.fetchClasses();
      } catch (error) {
        messageStore.notifyError(extractErrorMessage(error, 'Erreur lors de la suppression de la classe.'));
      } finally {
        this.loading = false;
      }
    },
  },
});
