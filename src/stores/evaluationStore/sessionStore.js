import { defineStore } from 'pinia';
import {
  createSession,
  getSessions,
  getSessionById,
  updateSession,
  deleteSession,
  changeSessionEtat,
} from '@/api/evaluations/evaluationApi';
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

export const useSessionStore = defineStore('sessionStore', {
  state: () => ({
    sessions: [],
    session: null,
    loading: false,
  }),

  actions: {
    // Récupérer toutes les sessions
    async fetchSessions() {
      const messageStore = useMessageStore();
      this.loading = true;
      try {
        const cached = getCache('sessions');
        if (cached) {
          this.sessions = cached;
        } else {
          const response = await getSessions();
          this.sessions = response.data;
          setCache('sessions', response.data);
        }
      } catch (error) {
        messageStore.notifyError(
          extractErrorMessage(error, 'Erreur lors du chargement des sessions.')
        );
      } finally {
        this.loading = false;
      }
    },

    // Récupérer une session par ID
    async fetchSessionById(id) {
      const messageStore = useMessageStore();
      this.loading = true;
      try {
        const response = await getSessionById(id);
        this.session = response.data;
      } catch (error) {
        messageStore.notifyError(
          extractErrorMessage(error, 'Erreur lors du chargement de la session.')
        );
      } finally {
        this.loading = false;
      }
    },

    // Créer une session
    async addSession(data) {
      const messageStore = useMessageStore();
      this.loading = true;
      try {
        await createSession(data);
        messageStore.notifySuccess('Session créée avec succès.');
        localStorage.removeItem('sessions');
        await this.fetchSessions();
      } catch (error) {
        messageStore.notifyError(
          extractErrorMessage(error, 'Erreur lors de la création de la session.')
        );
      } finally {
        this.loading = false;
      }
    },

    // Modifier une session
    async editSession(id, data) {
      const messageStore = useMessageStore();
      this.loading = true;
      try {
        await updateSession(id, data);
        messageStore.notifySuccess('Session mise à jour avec succès.');
        localStorage.removeItem('sessions');
        await this.fetchSessions();
      } catch (error) {
        messageStore.notifyError(
          extractErrorMessage(error, 'Erreur lors de la mise à jour de la session.')
        );
      } finally {
        this.loading = false;
      }
    },

    // Supprimer une session
    async removeSession(id) {
      const messageStore = useMessageStore();
      this.loading = true;
      try {
        await deleteSession(id);
        messageStore.notifySuccess('Session supprimée avec succès.');
        localStorage.removeItem('sessions');
        await this.fetchSessions();
      } catch (error) {
        messageStore.notifyError(
          extractErrorMessage(error, 'Erreur lors de la suppression de la session.')
        );
      } finally {
        this.loading = false;
      }
    },

    // Changer l’état d’une session (workflow)
    async changeEtat(id, data) {
      const messageStore = useMessageStore();
      this.loading = true;
      try {
        await changeSessionEtat(id, data);
        messageStore.notifySuccess('État de la session modifié avec succès.');
        await this.fetchSessionById(id);
      } catch (error) {
        messageStore.notifyError(
          extractErrorMessage(error, 'Erreur lors du changement d’état de la session.')
        );
      } finally {
        this.loading = false;
      }
    },
  },
});
