/**
 * Source unique de vérité pour le jeton d'authentification.
 *
 * Avant ce module, `localStorage.getItem('token')` était appelé directement
 * depuis l'intercepteur Axios et depuis authStore. Centraliser l'accès permet
 * de changer de support (cookie, sessionStorage) sans toucher au reste du code.
 *
 * ## Deux sessions, deux jetons
 *
 * L'espace de gestion des notes s'ouvre dans une **fenêtre distincte** et exige
 * sa propre connexion : un enseignant peut y entrer sans que la session de
 * l'application principale — ouverte dans l'autre fenêtre, sur le même
 * navigateur, donc le **même `localStorage`** — soit touchée, et inversement.
 *
 * D'où la portée : chaque espace range son jeton sous sa propre clé. La portée
 * est fixée **une fois, au démarrage** (`main.js`), d'après l'URL de la fenêtre ;
 * chaque fenêtre a son propre contexte JavaScript, donc sa propre valeur.
 */

/** Clé de stockage par espace. */
const CLES = {
  app: 'token',
  'espace-notes': 'token:espace-notes',
};

/** @type {keyof typeof CLES} */
let portee = 'app';

/**
 * Fixe l'espace auquel appartient cette fenêtre. À appeler au démarrage, avant
 * le premier appel réseau.
 * @param {'app'|'espace-notes'} valeur
 */
export function setTokenScope(valeur) {
  portee = CLES[valeur] ? valeur : 'app';
}

/** @returns {'app'|'espace-notes'} */
export function getTokenScope() {
  return portee;
}

const cle = () => CLES[portee];

/** @returns {string|null} */
export function getToken() {
  return localStorage.getItem(cle());
}

/** @param {string} token */
export function setToken(token) {
  localStorage.setItem(cle(), token);
}

export function clearToken() {
  localStorage.removeItem(cle());
}

/** @returns {boolean} */
export function hasToken() {
  return Boolean(getToken());
}
