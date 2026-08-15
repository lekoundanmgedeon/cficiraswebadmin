import { describe, expect, it } from 'vitest';
import { nextTick, ref } from 'vue';
import { usePagination } from './usePagination';

const lignes = (n) => Array.from({ length: n }, (_, index) => index + 1);

describe('usePagination', () => {
  it('découpe la collection et numérote les lignes de la page', async () => {
    const source = ref(lignes(25));
    const { page, paginated, startIndex, pageCount, total } = usePagination(source, {
      perPage: 10,
    });

    expect(total.value).toBe(25);
    expect(pageCount.value).toBe(3);
    expect(paginated.value).toEqual(lignes(10));
    expect(startIndex.value).toBe(0);

    page.value = 3;
    await nextTick();
    expect(paginated.value).toEqual([21, 22, 23, 24, 25]);
    // C'est `startIndex` qui évite de renuméroter chaque page à partir de 1.
    expect(startIndex.value).toBe(20);
  });

  it('recadre la page courante quand la collection rétrécit', async () => {
    const source = ref(lignes(25));
    const { page, paginated, pageCount } = usePagination(source, { perPage: 10 });

    page.value = 3;
    source.value = lignes(5);
    await nextTick();

    expect(pageCount.value).toBe(1);
    expect(page.value).toBe(1);
    // Sans le recadrage, la page 3 d'une collection de 5 lignes est vide.
    expect(paginated.value).toEqual(lignes(5));
  });

  it('recadre aussi quand la taille de page augmente', async () => {
    const source = ref(lignes(25));
    const { page, itemsPerPage } = usePagination(source, { perPage: 10 });

    page.value = 3;
    itemsPerPage.value = 20;
    await nextTick();

    expect(page.value).toBe(2);
  });

  it('revient en première page quand les critères de filtre changent', async () => {
    const recherche = ref('');
    const source = ref(lignes(100));
    const { page } = usePagination(source, {
      perPage: 10,
      resetKey: () => [recherche.value],
    });

    page.value = 5;
    recherche.value = 'info';
    await nextTick();

    expect(page.value).toBe(1);
  });

  it('accepte un getter et reste sain sur une collection vide', () => {
    const { paginated, pageCount, total } = usePagination(() => []);

    expect(total.value).toBe(0);
    // Une page vide reste « la page 1 sur 1 » : jamais 0, jamais NaN.
    expect(pageCount.value).toBe(1);
    expect(paginated.value).toEqual([]);
  });
});
