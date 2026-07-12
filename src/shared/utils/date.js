/**
 * Formatage de dates en français.
 *
 * `formatDate` était redéfini à l'identique dans une dizaine de composants,
 * avec des variantes silencieuses : certaines copies renvoyaient `Invalid Date`
 * sur une entrée corrompue, d'autres `-`. Une seule implémentation ici, qui
 * échoue proprement.
 */

/**
 * @param {string|Date|null|undefined} value
 * @param {Intl.DateTimeFormatOptions} options
 * @param {string} fallback
 * @returns {string}
 */
function format(value, options, fallback) {
  if (!value) return fallback;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;

  return date.toLocaleDateString('fr-FR', options);
}

/**
 * Date longue : « 01 octobre 2025 ».
 * @param {string|Date|null|undefined} value
 * @param {string} [fallback]
 */
export function formatDate(value, fallback = '-') {
  return format(value, { day: '2-digit', month: 'long', year: 'numeric' }, fallback);
}

/**
 * Mois et année : « oct. 2025 ».
 * @param {string|Date|null|undefined} value
 * @param {string} [fallback]
 */
export function formatMonthYear(value, fallback = '-') {
  return format(value, { month: 'short', year: 'numeric' }, fallback);
}

/**
 * Nombre de jours entre deux dates.
 * @param {string|Date} start
 * @param {string|Date} end
 * @returns {number|null} `null` si l'une des dates est invalide.
 */
export function daysBetween(start, end) {
  const from = new Date(start);
  const to = new Date(end);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return null;

  return Math.round((to - from) / (1000 * 60 * 60 * 24));
}
