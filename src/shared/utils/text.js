/**
 * Utilitaires de texte pour la mise en surbrillance des résultats de recherche.
 */

/**
 * Échappe les caractères spéciaux HTML.
 *
 * Indispensable avant toute injection via `v-html` : sans cela, une donnée
 * venant du backend contenant `<script>` serait exécutée par le navigateur.
 *
 * @param {string} value
 * @returns {string}
 */
export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Échappe les caractères spéciaux d'une expression régulière.
 *
 * Sans cela, une recherche contenant `(` ou `*` fait lever une SyntaxError à la
 * construction de la RegExp — et le filtre entier plante.
 *
 * @param {string} value
 * @returns {string}
 */
export function escapeRegExp(value) {
  return String(value ?? '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Entoure d'un `<mark>` les occurrences de `query` dans `text`.
 *
 * Le texte est échappé **avant** l'insertion du balisage : le seul HTML présent
 * dans le résultat est celui que cette fonction produit elle-même. La chaîne
 * renvoyée peut donc être passée à `v-html` sans risque.
 *
 * @param {string} text  Texte à afficher (typiquement une donnée backend).
 * @param {string} query Terme recherché, saisi par l'utilisateur.
 * @returns {string} HTML sûr.
 */
export function highlight(text, query) {
  const safeText = escapeHtml(text);
  const term = String(query ?? '').trim();
  if (!term) return safeText;

  const pattern = new RegExp(`(${escapeRegExp(escapeHtml(term))})`, 'gi');
  return safeText.replace(pattern, '<mark class="bg-warning-subtle text-dark p-0">$1</mark>');
}
