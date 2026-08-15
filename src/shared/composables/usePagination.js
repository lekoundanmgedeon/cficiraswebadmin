import { computed, ref, unref, watch } from 'vue';

/**
 * Pagination en mémoire d'une collection déjà chargée.
 *
 * Le découpage (`slice`), le nombre de pages et le garde-fou « la page courante
 * dépasse le nouveau total » étaient recopiés dans chaque onglet, avec des
 * variantes : certains oubliaient le garde-fou et affichaient un tableau vide
 * après un filtre, d'autres n'exposaient pas d'index de départ et renumérotaient
 * les lignes à partir de 1 sur chaque page.
 *
 * S'utilise avec `@/components/shared/Pagination.vue`, qui rend la barre de
 * navigation et le sélecteur de taille :
 *
 * ```js
 * const { page, itemsPerPage, paginated, startIndex } = usePagination(filtrees, {
 *   resetKey: () => [recherche.value, filtreCycle.value],
 * });
 * ```
 * ```html
 * <Pagination v-model="page" v-model:items-per-page="itemsPerPage" :total-items="filtrees.length" />
 * ```
 *
 * @template T
 * @param {import('vue').Ref<T[]>|(() => T[])} source Collection complète, déjà filtrée et triée.
 * @param {object} [options]
 * @param {number} [options.perPage] Taille de page initiale.
 * @param {() => any} [options.resetKey]
 *   Valeur observée dont tout changement ramène à la première page — les
 *   critères de filtre, typiquement. Sans elle, appliquer un filtre depuis la
 *   page 4 laisse l'utilisateur sur une page 4 qui ne parle plus de la même
 *   chose.
 */
export function usePagination(source, { perPage = 10, resetKey } = {}) {
  const page = ref(1);
  const itemsPerPage = ref(perPage);

  const items = computed(() => (typeof source === 'function' ? source() : unref(source)) ?? []);
  const total = computed(() => items.value.length);
  const pageCount = computed(() => Math.max(1, Math.ceil(total.value / itemsPerPage.value)));

  const startIndex = computed(() => (page.value - 1) * itemsPerPage.value);
  const paginated = computed(() =>
    items.value.slice(startIndex.value, startIndex.value + itemsPerPage.value)
  );

  // Le total peut fondre sous les pieds de l'utilisateur (filtre, suppression,
  // rechargement) : sans ce recadrage, la page courante pointe au-delà de la
  // collection et le tableau apparaît vide alors qu'il contient des lignes.
  watch([total, itemsPerPage], () => {
    if (page.value > pageCount.value) page.value = pageCount.value;
  });

  if (resetKey) {
    watch(resetKey, () => {
      page.value = 1;
    });
  }

  return { page, itemsPerPage, total, pageCount, startIndex, paginated };
}
