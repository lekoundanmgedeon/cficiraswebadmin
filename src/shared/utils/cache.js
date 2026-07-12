/**
 * Cache local à durée de vie limitée.
 *
 * Les helpers `setCache`/`getCache` étaient copiés à l'identique dans neuf
 * stores. Ils sont ici factorisés, avec deux corrections :
 *  - une entrée corrompue ne fait plus planter le store (`JSON.parse` sans
 *    garde relançait une SyntaxError qui remontait jusqu'au composant) ;
 *  - les clés sont préfixées, ce qui permet d'invalider tout un domaine d'un
 *    coup et de purger le cache à la déconnexion sans toucher au jeton.
 */

const PREFIX = 'cache:';
const DEFAULT_TTL_MS = 5 * 60 * 1000;

/** @param {string} key */
const namespaced = (key) => `${PREFIX}${key}`;

/**
 * Lit une entrée de cache encore valide.
 * @param {string} key
 * @param {number} [ttl] Durée de vie en millisecondes.
 * @returns {any|null} La donnée, ou null si absente, expirée ou illisible.
 */
export function getCache(key, ttl = DEFAULT_TTL_MS) {
  const raw = localStorage.getItem(namespaced(key));
  if (!raw) return null;

  try {
    const { data, timestamp } = JSON.parse(raw);
    if (Date.now() - timestamp > ttl) {
      removeCache(key);
      return null;
    }
    return data;
  } catch {
    // Entrée illisible (écriture partielle, changement de format) : on la jette.
    removeCache(key);
    return null;
  }
}

/**
 * Écrit une entrée de cache horodatée.
 * @param {string} key
 * @param {any} data
 */
export function setCache(key, data) {
  try {
    localStorage.setItem(namespaced(key), JSON.stringify({ data, timestamp: Date.now() }));
  } catch {
    // Quota dépassé ou mode navigation privée : le cache est un optimisation,
    // jamais une nécessité — on continue sans lui.
  }
}

/** @param {string} key */
export function removeCache(key) {
  localStorage.removeItem(namespaced(key));
}

/**
 * Purge toutes les entrées de cache, sans toucher aux autres clés du
 * localStorage (jeton d'authentification notamment).
 */
export function clearAllCache() {
  Object.keys(localStorage)
    .filter((key) => key.startsWith(PREFIX))
    .forEach((key) => localStorage.removeItem(key));
}
