import { defineStore } from 'pinia';
import { useNotificationStore } from '@/shared/stores/notificationStore';
import { getCache, setCache, removeCache } from '@/shared/utils/cache';

/**
 * Fabrique de store CRUD.
 *
 * Chaque store métier réécrivait la même séquence pour chaque action :
 * `loading = true` → `try` → appel API → `notifyError` → `finally loading = false`.
 * Répétée jusqu'à quatorze fois par fichier, elle représentait l'essentiel des
 * 3 391 lignes de `src/stores`. La fabrique la produit une fois.
 *
 * Un store généré expose :
 *  - state   : `items`, `item`, `meta`, `loading`, `error`
 *  - getters : `isEmpty`, `count`, `getById(id)`
 *  - actions : `fetchAll`, `fetchById`, `create`, `update`, `remove`, `invalidate`
 *
 * @example
 * export const useAnneeStore = createCrudStore({
 *   id: 'annees',
 *   resource: anneesResource,
 *   label: 'Année académique',
 *   cacheKey: 'annees',
 *   actions: {
 *     async activate(id) {
 *       await this.run(() => activateAnnee(id), {
 *         success: 'Année activée.',
 *         onSuccess: () => this.invalidate(),
 *       });
 *     },
 *   },
 * });
 */

/**
 * @param {object} options
 * @param {string} options.id Identifiant du store Pinia.
 * @param {import('@/core/api/createResource').Resource} options.resource Ressource REST.
 * @param {string} options.label Libellé métier, utilisé dans les messages ("Année académique créée.").
 * @param {string} [options.cacheKey] Si fourni, la liste est mise en cache sous cette clé.
 * @param {number} [options.cacheTtl] Durée de vie du cache en ms.
 * @param {() => object} [options.state] État additionnel propre au module.
 * @param {Record<string, Function>} [options.getters] Getters additionnels.
 * @param {Record<string, Function>} [options.actions] Actions additionnelles.
 */
export function createCrudStore({
  id,
  resource,
  label,
  cacheKey,
  cacheTtl,
  state = () => ({}),
  getters = {},
  actions = {},
}) {
  return defineStore(id, {
    state: () => ({
      /** @type {any[]} */
      items: [],
      /** @type {any|null} */
      item: null,
      /** @type {object|null} */
      meta: null,
      loading: false,
      /** @type {import('@/core/api/apiError').ApiError|null} */
      error: null,
      ...state(),
    }),

    getters: {
      isEmpty: (state) => state.items.length === 0,
      count: (state) => state.items.length,
      /** @returns {(id: string|number) => any} */
      getById: (state) => (id) => state.items.find((item) => String(item.id) === String(id)),
      ...getters,
    },

    actions: {
      /**
       * Exécute un appel API en gérant `loading`, `error` et les notifications.
       * C'est la brique sur laquelle reposent toutes les autres actions ; les
       * modules l'utilisent aussi pour leurs actions spécifiques.
       *
       * @template T
       * @param {() => Promise<T>} call L'appel API à exécuter.
       * @param {object} [options]
       * @param {string} [options.success] Message affiché en cas de succès.
       * @param {string} [options.failure] Message affiché en cas d'échec.
       * @param {(result: T) => void|Promise<void>} [options.onSuccess] Effet à jouer après succès.
       * @returns {Promise<T|undefined>} Le résultat, ou `undefined` si l'appel a échoué.
       */
      async run(call, { success, failure, onSuccess } = {}) {
        const notifications = useNotificationStore();
        this.loading = true;
        this.error = null;

        try {
          const result = await call();
          await onSuccess?.(result);
          if (success) notifications.notifySuccess(success);
          return result;
        } catch (error) {
          // L'erreur est déjà normalisée en ApiError par le client HTTP.
          this.error = error;
          notifications.notifyError(error, failure);
          return undefined;
        } finally {
          this.loading = false;
        }
      },

      /**
       * Charge la liste. Sert le cache si disponible, sauf si `force` est vrai.
       * @param {object} [options]
       * @param {boolean} [options.force] Ignore le cache et refait l'appel réseau.
       * @param {object} [options.params] Filtres transmis à l'API.
       */
      async fetchAll({ force = false, params } = {}) {
        // Le cache ne s'applique qu'à la liste non filtrée : une liste filtrée
        // dépend de `params` et n'a pas la même clé.
        const cacheable = Boolean(cacheKey) && !params;

        if (cacheable && !force) {
          const cached = getCache(cacheKey, cacheTtl);
          if (cached) {
            this.items = cached;
            return this.items;
          }
        }

        return this.run(() => resource.list(params), {
          failure: `Erreur lors de la récupération des ${label.toLowerCase()}s.`,
          onSuccess: (response) => {
            this.items = response.data ?? [];
            this.meta = response.meta ?? null;
            if (cacheable) setCache(cacheKey, this.items);
          },
        });
      },

      /** @param {string|number} id */
      async fetchById(id) {
        return this.run(() => resource.getById(id), {
          failure: `Erreur lors de la récupération de : ${label.toLowerCase()}.`,
          onSuccess: (response) => {
            this.item = response.data ?? response;
          },
        });
      },

      /** @param {object} data */
      async create(data) {
        return this.run(() => resource.create(data), {
          success: `${label} créé(e) avec succès.`,
          failure: `Erreur lors de la création : ${label.toLowerCase()}.`,
          onSuccess: () => this.invalidate(),
        });
      },

      /** @param {string|number} id @param {object} data */
      async update(id, data) {
        return this.run(() => resource.update(id, data), {
          success: `${label} mis(e) à jour avec succès.`,
          failure: `Erreur lors de la mise à jour : ${label.toLowerCase()}.`,
          onSuccess: () => this.invalidate(),
        });
      },

      /** @param {string|number} id */
      async remove(id) {
        return this.run(() => resource.remove(id), {
          success: `${label} supprimé(e) avec succès.`,
          failure: `Erreur lors de la suppression : ${label.toLowerCase()}.`,
          onSuccess: () => this.invalidate(),
        });
      },

      /**
       * Vide le cache et recharge la liste depuis le réseau.
       * Appelée après toute mutation, pour que l'UI reflète l'état du serveur.
       */
      async invalidate() {
        if (cacheKey) removeCache(cacheKey);
        return this.fetchAll({ force: true });
      },

      ...actions,
    },
  });
}
