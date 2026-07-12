/**
 * Accès à l'API modale de Bootstrap.
 *
 * Bootstrap est chargé par `index.html` via `vendor.bundle.base.js`, donc
 * présent uniquement comme global `window.bootstrap` — il n'est pas importable.
 * Les composants faisaient `new bootstrap.Modal(document.getElementById(id))`
 * directement, ce qui lève une ReferenceError si le bundle n'a pas fini de
 * charger, et rend le code intestable (le global n'existe pas sous Vitest).
 *
 * Ces helpers isolent ce couplage en un seul endroit.
 */

/** @returns {any|null} L'objet global Bootstrap, ou null s'il n'est pas chargé. */
function getBootstrap() {
  const bootstrap = /** @type {any} */ (globalThis).bootstrap;
  if (!bootstrap?.Modal) {
    console.warn("Bootstrap n'est pas chargé : la modale est ignorée.");
    return null;
  }
  return bootstrap;
}

/**
 * Ouvre une modale Bootstrap par son id DOM.
 * @param {string} modalId
 */
export function openModal(modalId) {
  const bootstrap = getBootstrap();
  const element = document.getElementById(modalId);
  if (!bootstrap || !element) return;

  bootstrap.Modal.getOrCreateInstance(element).show();
}

/**
 * Ferme une modale Bootstrap par son id DOM.
 * @param {string} modalId
 */
export function closeModal(modalId) {
  const bootstrap = getBootstrap();
  const element = document.getElementById(modalId);
  if (!bootstrap || !element) return;

  // `getInstance` (et non `getOrCreateInstance`) : si aucune instance n'existe,
  // la modale n'est pas ouverte et il n'y a rien à fermer.
  bootstrap.Modal.getInstance(element)?.hide();
}
