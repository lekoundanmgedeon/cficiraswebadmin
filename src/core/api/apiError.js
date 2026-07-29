/**
 * Normalisation des erreurs HTTP.
 *
 * Le backend renvoie plusieurs formes d'erreur (`data.message`,
 * `data.error.message`, `data.errors[champ][]`, ou une chaîne brute). Ce module
 * les ramène toutes à une forme unique pour que l'UI n'ait jamais à inspecter
 * la structure d'une réponse Axios.
 */

/**
 * Erreur applicative normalisée, propagée par le client HTTP.
 */
export class ApiError extends Error {
  /**
   * @param {object} params
   * @param {string} params.message  Message lisible par un utilisateur final.
   * @param {number} [params.status] Code HTTP, absent si l'erreur est réseau.
   * @param {Record<string, string[]>} [params.fieldErrors] Erreurs par champ de formulaire.
   * @param {unknown} [params.cause] Erreur Axios d'origine, pour le debug.
   */
  constructor({ message, status, fieldErrors = {}, cause }) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fieldErrors = fieldErrors;
    this.cause = cause;
  }

  /** Erreur d'authentification : jeton absent, invalide ou expiré. */
  get isUnauthorized() {
    return this.status === 401;
  }

  /** Le serveur est injoignable (pas de réponse HTTP du tout). */
  get isNetworkError() {
    return this.status === undefined;
  }

  /** Erreur de validation : l'utilisateur peut corriger sa saisie. */
  get isValidationError() {
    return this.status === 422 || Object.keys(this.fieldErrors).length > 0;
  }
}

/**
 * Extrait un message lisible depuis les différentes formes de réponse backend.
 * @param {any} data Corps de la réponse d'erreur.
 * @returns {string|null}
 */
function extractMessage(data) {
  if (!data) return null;
  if (typeof data === 'string') return data;

  if (data.message && data.error?.message) {
    // Le backend répète souvent le même texte aux deux emplacements : c'est le
    // cas chaque fois qu'un contrôleur remonte le message d'une exception
    // métier (`response.error(res, error, error.message, …)`). Sans cette
    // comparaison, l'utilisateur lisait la phrase deux fois, la seconde entre
    // parenthèses — « Quota dépassé, réessayez dans 8 min. (Quota dépassé,
    // réessayez dans 8 min.) ».
    return data.message === data.error.message
      ? data.message
      : `${data.message} (${data.error.message})`;
  }
  if (data.message) return data.message;
  if (data.error?.message) return data.error.message;
  if (typeof data.error === 'string') return data.error;

  if (data.errors) {
    const first = Object.values(data.errors)[0];
    return Array.isArray(first) ? first[0] : String(first);
  }
  return null;
}

/**
 * Convertit une erreur Axios (ou native) en ApiError.
 * @param {any} error
 * @param {string} [fallback]
 * @returns {ApiError}
 */
export function normalizeApiError(error, fallback = 'Une erreur est survenue.') {
  // Déjà normalisée : on évite de ré-emballer.
  if (error instanceof ApiError) return error;

  // Le serveur a répondu avec un code d'erreur.
  if (error?.response) {
    const { status, data } = error.response;
    return new ApiError({
      message: extractMessage(data) ?? `Erreur serveur (code ${status})`,
      status,
      fieldErrors: data?.errors ?? {},
      cause: error,
    });
  }

  // La requête est partie mais aucune réponse n'est revenue.
  if (error?.request) {
    return new ApiError({
      message: 'Impossible de se connecter au serveur.',
      cause: error,
    });
  }

  return new ApiError({ message: error?.message || fallback, cause: error });
}
