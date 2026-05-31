import { useErrorStore } from '@/stores/messages/errorStore';

// Fonction de traitement des erreurs
function handleApiError(error) {
  // Stocker dans Pinia
  try {
    const errorStore = useErrorStore();
    errorStore.addError(error);
  } catch (e) {
    console.warn('Erreur non traitée dans errorStore', error);
  }

  throw error; // Re-propagation pour traitement dans le composant si nécessaire
}

// /api/config/serviceApi.js
const buildService = (client) => ({
  get: async (url, params = {}) => {
    try {
      const response = await client.get(url, { params });
      return response.data;
    } catch (error) {
      throw error; // juste throw, pas de toast ici
    }
  },

  post: async (url, data) => {
    try {
      const response = await client.post(url, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  put: async (url, data) => {
    try {
      const response = await client.put(url, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // FIX : Ajout de la méthode PATCH manquante
  patch: async (url, data) => {
    try {
      const response = await client.patch(url, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  delete: async (url) => {
    try {
      const response = await client.delete(url);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
});

export default buildService;