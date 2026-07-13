import { createCrudStore } from '@/core/store/createCrudStore';
import { sallesResource } from './api';

/**
 * Store des salles.
 *
 * Il n'en existait aucun : l'écran « Salles & horaires » fabriquait ses
 * infrastructures à partir de deux nombres saisis à la main (`roomCount`,
 * `capacityPerRoom`), sans jamais consulter les salles réellement déclarées.
 */
export const useSalleStore = createCrudStore({
  id: 'salles',
  resource: sallesResource,
  label: 'Salle',
  cacheKey: 'salles',

  getters: {
    /** Capacité totale des salles retenues. @returns {(ids: string[]) => number} */
    capaciteDe: (state) => (ids) =>
      state.items
        .filter((salle) => ids.includes(salle.id))
        .reduce((total, salle) => total + Number(salle.capacite ?? 0), 0),
  },
});
