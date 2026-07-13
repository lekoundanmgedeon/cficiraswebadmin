import { createCrudStore } from '@/core/store/createCrudStore';
import { changeSessionEtat, sessionsResource } from './api';
import { etatSessionInfo } from '../constants';

/**
 * Store des sessions d'évaluation.
 *
 * L'ancien `stores/evaluationStore/sessionStore.js` (146 lignes) recopiait les
 * helpers de cache et six fois la même séquence `loading`/`try`/`notifyError`.
 *
 * Son action `changeEtat` appelait par ailleurs une route **inexistante** : le
 * chemin déclaré côté serveur était doublé (`/sessions-evaluations/sessions-evaluations/:id/etat`),
 * si bien que le changement d'état d'une session répondait 404. Corrigé côté
 * backend ; l'action fonctionne enfin.
 */
export const useSessionStore = createCrudStore({
  id: 'sessions',
  resource: sessionsResource,
  label: 'Session',
  cacheKey: 'sessions',

  getters: {
    /** @deprecated Utiliser `items`. Alias pour les vues non encore migrées. */
    sessions: (state) => state.items,
  },

  actions: {
    /**
     * Change l'état d'une session.
     * @param {string} id
     * @param {'INACTIVE'|'ACTIVE'|'ARCHIVE'} etat
     */
    async changeEtat(id, etat) {
      return this.run(() => changeSessionEtat(id, etat), {
        success: `Session passée à l'état « ${etatSessionInfo(etat).label} ».`,
        failure: "Erreur lors du changement d'état de la session.",
        onSuccess: () => this.invalidate(),
      });
    },
  },
});
