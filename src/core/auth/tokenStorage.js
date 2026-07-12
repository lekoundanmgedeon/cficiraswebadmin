/**
 * Source unique de vérité pour le jeton d'authentification.
 *
 * Avant ce module, `localStorage.getItem('token')` était appelé directement
 * depuis l'intercepteur Axios et depuis authStore. Centraliser l'accès permet
 * de changer de support (cookie, sessionStorage) sans toucher au reste du code.
 */

const TOKEN_KEY = 'token';

/** @returns {string|null} */
export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

/** @param {string} token */
export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

/** @returns {boolean} */
export function hasToken() {
  return Boolean(getToken());
}
