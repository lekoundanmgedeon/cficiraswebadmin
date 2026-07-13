import { createCrudStore } from '@/core/store/createCrudStore';
import { epreuvesResource } from './api';

/**
 * Store des épreuves.
 *
 * L'ancien `stores/evaluationStore/evalStore.js` (128 lignes) existait — et
 * fonctionnait — mais **aucune vue ne l'utilisait** : `PlanExamen.vue`, l'écran
 * qui aurait dû l'appeler, fabriquait ses épreuves, ses filières, ses classes et
 * ses modules en dur.
 */
export const useEpreuveStore = createCrudStore({
  id: 'epreuves',
  resource: epreuvesResource,
  label: 'Épreuve',
  cacheKey: 'epreuves',

  getters: {
    /**
     * Les épreuves d'une session.
     *
     * `GET /evaluation` ne sait filtrer que sur `anneeId` et `semestreId` — pas
     * sur la session. Chaque ligne portant son `session_id`, le tri se fait ici.
     *
     * @returns {(sessionId: string) => any[]}
     */
    bySession: (state) => (sessionId) =>
      state.items.filter((epreuve) => String(epreuve.session_id) === String(sessionId)),
  },
});
