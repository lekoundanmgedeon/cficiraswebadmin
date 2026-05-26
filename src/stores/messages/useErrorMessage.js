/**
 * Extrait un message d'erreur lisible à partir d'une exception backend.
 * @param {Object|Error} error - L'objet d'erreur intercepté.
 * @param {string} fallback - Le message par défaut si rien n'est extrait.
 * @returns {string} Le message d'erreur harmonisé.
 */
export function extractErrorMessage(error, fallback = 'Une erreur est survenue.') {
  if (!error) return fallback;

  // Axios : réponse du serveur
  if (error.response?.data) {
    const data = error.response.data;

    if (typeof data === 'string') return data;

    // Structure de ton backend : data.message + data.error.message
    if (data.message && data.error?.message) {
      return `${data.message} (${data.error.message})`;
    }

    if (data.message) return data.message;
    if (data.error?.message) return data.error.message;
    if (data.error && typeof data.error === 'string') return data.error;

    if (data.errors) {
      const first = Object.values(data.errors)[0];
      return Array.isArray(first) ? first[0] : first;
    }

    if (error.response.status) {
      return `Erreur serveur (Code: ${error.response.status})`;
    }
  }

  // Axios : pas de réponse réseau
  if (error.request) {
    return 'Impossible de se connecter au serveur.';
  }

  // Erreur JavaScript native
  if (error.message) return error.message;

  return fallback;
}
