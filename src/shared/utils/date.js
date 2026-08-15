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
 * Date et heure : « 15 août 2026 à 17:34 ».
 *
 * Les trois formateurs ci-dessus passent par `toLocaleDateString`, qui **jette
 * l'heure sans le dire** : demander `hour` et `minute` à `formatDate` ne
 * produirait rien. D'où cette fonction distincte, et non une option de plus.
 *
 * @param {string|Date|null|undefined} value
 * @param {string} [fallback]
 */
export function formatDateTime(value, fallback = '-') {
  if (!value) return fallback;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;

  return date.toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Les paliers du temps relatif, du plus fin au plus grossier. */
const PALIERS = [
  { limite: 60, unite: 'second', diviseur: 1 },
  { limite: 3600, unite: 'minute', diviseur: 60 },
  { limite: 86400, unite: 'hour', diviseur: 3600 },
  { limite: 2592000, unite: 'day', diviseur: 86400 },
  { limite: 31536000, unite: 'month', diviseur: 2592000 },
  { limite: Infinity, unite: 'year', diviseur: 31536000 },
];

/**
 * Temps écoulé, en clair : « il y a 3 minutes », « hier », « il y a 2 mois ».
 *
 * `Intl.RelativeTimeFormat` avec `numeric: 'auto'` rend « hier » et « demain »
 * plutôt que « il y a 1 jour » — c'est ce qui distingue une liste de
 * conversations lisible d'un relevé de compteurs.
 *
 * Une date **future** est rendue telle quelle (« dans 5 minutes ») plutôt que
 * ramenée à zéro : sur un poste dont l'horloge avance de quelques secondes,
 * afficher « il y a -3 secondes » serait la seule alternative honnête, et elle
 * est illisible.
 *
 * @param {string|Date|null|undefined} value
 * @param {string} [fallback]
 */
export function formatRelatif(value, fallback = '-') {
  if (!value) return fallback;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;

  const ecartSecondes = (date.getTime() - Date.now()) / 1000;
  const amplitude = Math.abs(ecartSecondes);

  // En deçà de la minute, le compte exact des secondes n'apprend rien et
  // change à chaque rendu.
  if (amplitude < 45) return "à l'instant";

  const palier = PALIERS.find((p) => amplitude < p.limite) ?? PALIERS[PALIERS.length - 1];
  const formateur = new Intl.RelativeTimeFormat('fr-FR', { numeric: 'auto' });

  return formateur.format(Math.round(ecartSecondes / palier.diviseur), palier.unite);
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
