import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { createCrudStore } from './createCrudStore';
import { ApiError } from '@/core/api/apiError';
import { setCache } from '@/shared/utils/cache';

// Les toasts sont un effet de bord du DOM : on ne teste ici que le fait qu'ils
// soient déclenchés, pas leur rendu.
vi.mock('vue3-toastify', () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  }),
}));

/** Ressource factice, entièrement instrumentée. */
function createFakeResource() {
  return {
    list: vi.fn().mockResolvedValue({ data: [{ id: 1, code: '2024-2025' }], meta: { total: 1 } }),
    getById: vi.fn().mockResolvedValue({ data: { id: 1, code: '2024-2025' } }),
    create: vi.fn().mockResolvedValue({ data: { id: 2 } }),
    update: vi.fn().mockResolvedValue({ data: { id: 1 } }),
    patch: vi.fn().mockResolvedValue({ data: { id: 1 } }),
    remove: vi.fn().mockResolvedValue({ success: true }),
  };
}

describe('createCrudStore', () => {
  /** @type {ReturnType<typeof createFakeResource>} */
  let resource;

  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    resource = createFakeResource();
  });

  /** @param {object} [overrides] */
  const buildStore = (overrides = {}) =>
    createCrudStore({
      id: `test-${Math.random()}`,
      resource,
      label: 'Année académique',
      ...overrides,
    })();

  describe('fetchAll', () => {
    it('remplit items et meta depuis la réponse', async () => {
      const store = buildStore();

      await store.fetchAll();

      expect(store.items).toEqual([{ id: 1, code: '2024-2025' }]);
      expect(store.meta).toEqual({ total: 1 });
      expect(store.loading).toBe(false);
    });

    it('sert le cache sans rappeler le réseau', async () => {
      const store = buildStore({ cacheKey: 'annees' });
      setCache('annees', [{ id: 99, code: 'depuis-le-cache' }]);

      await store.fetchAll();

      expect(resource.list).not.toHaveBeenCalled();
      expect(store.items).toEqual([{ id: 99, code: 'depuis-le-cache' }]);
    });

    it('ignore le cache quand force vaut true', async () => {
      const store = buildStore({ cacheKey: 'annees' });
      setCache('annees', [{ id: 99 }]);

      await store.fetchAll({ force: true });

      expect(resource.list).toHaveBeenCalledOnce();
      expect(store.items).toEqual([{ id: 1, code: '2024-2025' }]);
    });

    // Le cache porte sur la liste complète : une liste filtrée n'a pas le même
    // contenu et ne doit ni le lire ni l'écraser.
    it('n’utilise pas le cache lorsqu’un filtre est passé', async () => {
      const store = buildStore({ cacheKey: 'annees' });
      setCache('annees', [{ id: 99 }]);

      await store.fetchAll({ params: { statut: 'OUVERTE' } });

      expect(resource.list).toHaveBeenCalledWith({ statut: 'OUVERTE' });
      expect(store.items).toEqual([{ id: 1, code: '2024-2025' }]);
    });
  });

  describe('mutations', () => {
    it('recharge la liste après une création', async () => {
      const store = buildStore();

      await store.create({ code: '2025-2026' });

      expect(resource.create).toHaveBeenCalledWith({ code: '2025-2026' });
      expect(resource.list).toHaveBeenCalledOnce(); // invalidate() a rechargé
    });

    it('purge le cache après une suppression', async () => {
      const store = buildStore({ cacheKey: 'annees' });
      setCache('annees', [{ id: 1 }]);

      await store.remove(1);

      expect(resource.remove).toHaveBeenCalledWith(1);
      // Le cache a été vidé, donc la liste est bien allée chercher le réseau.
      expect(resource.list).toHaveBeenCalledOnce();
    });
  });

  describe('gestion des erreurs', () => {
    it('expose l’erreur, coupe le loading et renvoie undefined', async () => {
      const apiError = new ApiError({ message: 'Serveur indisponible', status: 500 });
      resource.list.mockRejectedValueOnce(apiError);
      const store = buildStore();

      const result = await store.fetchAll();

      expect(result).toBeUndefined();
      expect(store.error).toBe(apiError);
      expect(store.loading).toBe(false);
      expect(store.items).toEqual([]);
    });

    // Le composant s'appuie sur ce contrat pour décider s'il ferme la modale :
    // une action en échec ne doit jamais ressembler à un succès.
    it('renvoie une valeur définie en cas de succès', async () => {
      const store = buildStore();

      const result = await store.create({ code: '2025-2026' });

      expect(result).not.toBeUndefined();
    });

    it('réinitialise error au début de l’appel suivant', async () => {
      resource.list.mockRejectedValueOnce(new ApiError({ message: 'Échec' }));
      const store = buildStore();

      await store.fetchAll();
      expect(store.error).not.toBeNull();

      await store.fetchAll({ force: true });
      expect(store.error).toBeNull();
    });
  });

  describe('getters', () => {
    it('isEmpty, count et getById reflètent items', async () => {
      const store = buildStore();
      expect(store.isEmpty).toBe(true);

      await store.fetchAll();

      expect(store.isEmpty).toBe(false);
      expect(store.count).toBe(1);
      // getById compare en chaîne : un id d'URL est un string, celui de l'API un number.
      expect(store.getById('1')).toEqual({ id: 1, code: '2024-2025' });
    });
  });
});
