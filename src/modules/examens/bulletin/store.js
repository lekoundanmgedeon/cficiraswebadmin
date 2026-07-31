import { defineStore } from 'pinia';
import { useNotificationStore } from '@/shared/stores/notificationStore';
import {
  genererBulletinsClasse,
  getBulletinsByClasse,
  publierBulletinsClasse,
  updateDecisionJury,
} from './api';

/**
 * Store des bulletins.
 *
 * Il n'est pas bâti sur `createCrudStore` : les bulletins ne forment pas une
 * ressource REST. Ils ne se listent qu'au sein du triplet **(classe, semestre,
 * année)** (`GET /resultats/classes/:classeId/bulletins?semestreId&anneeId`) et
 * ne se créent pas depuis l'application — ils résultent des notes.
 *
 * Ce triplet est retenu dans l'état (`contexte`) : la publication le réclame à
 * nouveau, cette fois dans le corps de la requête.
 *
 * L'ancien `resultStore.js` existait et fonctionnait ; **aucune vue ne
 * l'appelait**.
 */
export const useBulletinStore = defineStore('bulletins', {
  state: () => ({
    /** @type {any[]} Bulletins du contexte consulté. */
    items: [],
    /** @type {{classeId: string, semestreId: string, anneeId: string}|null} */
    contexte: null,
    loading: false,
    /** @type {import('@/core/api/apiError').ApiError|null} */
    error: null,
  }),

  actions: {
    /**
     * Même contrat que `createCrudStore.run` : renvoie `undefined` en cas
     * d'échec.
     *
     * @template T
     * @param {() => Promise<T>} call
     * @param {{success?: string, failure?: string, onSuccess?: (result: T) => void|Promise<void>}} [options]
     * @returns {Promise<T|undefined>}
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
        this.error = error;
        notifications.notifyError(error, failure);
        return undefined;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Charge les bulletins d'un triplet (classe, semestre, année). Le triplet
     * doit être complet : le serveur refuse la requête sinon.
     *
     * @param {string} classeId @param {string} semestreId @param {string} anneeId
     */
    async fetchByClasse(classeId, semestreId, anneeId) {
      if (!classeId || !semestreId || !anneeId) {
        this.items = [];
        this.contexte = null;
        return undefined;
      }

      return this.run(() => getBulletinsByClasse(classeId, semestreId, anneeId), {
        failure: 'Erreur lors du chargement des bulletins.',
        onSuccess: (response) => {
          this.items = response.data ?? [];
          this.contexte = { classeId, semestreId, anneeId };
        },
      });
    },

    /** Recharge le contexte courant. */
    async refresh() {
      if (!this.contexte) return undefined;
      const { classeId, semestreId, anneeId } = this.contexte;
      return this.fetchByClasse(classeId, semestreId, anneeId);
    },

    /**
     * Enregistre la décision du jury sur un bulletin.
     * @param {string} id @param {{decision: string, mention?: string}} data
     */
    async setDecision(id, data) {
      return this.run(() => updateDecisionJury(id, data), {
        success: 'Décision du jury enregistrée.',
        failure: "Erreur lors de l'enregistrement de la décision.",
        onSuccess: () => this.refresh(),
      });
    },

    /**
     * Calcule les bulletins d'un triplet, puis les recharge.
     *
     * Le serveur répond `200` avec `generatedCount: 0` quand il n'y a rien à
     * calculer — aucune note exploitable, ou bulletins verrouillés. Ce n'est pas
     * un échec, mais un clic sans effet ne doit pas passer pour un succès :
     * l'appelant reçoit le compte et le dit.
     *
     * @param {string} classeId @param {string} semestreId @param {string} anneeId
     * @returns {Promise<number|undefined>} Nombre de bulletins calculés.
     */
    async generer(classeId, semestreId, anneeId) {
      if (!classeId || !semestreId || !anneeId) return undefined;

      const resultat = await this.run(
        () => genererBulletinsClasse(classeId, { semestreId, anneeId }),
        { failure: 'Erreur lors du calcul des bulletins.' }
      );

      if (resultat === undefined) return undefined;

      await this.fetchByClasse(classeId, semestreId, anneeId);
      return Number(resultat.data?.generatedCount ?? 0) || 0;
    },

    /** Publie officiellement les bulletins du contexte consulté. */
    async publier() {
      if (!this.contexte) return undefined;

      const { classeId, semestreId, anneeId } = this.contexte;

      return this.run(() => publierBulletinsClasse(classeId, { semestreId, anneeId }), {
        success: 'Bulletins publiés.',
        failure: 'Erreur lors de la publication des bulletins.',
        onSuccess: () => this.refresh(),
      });
    },
  },
});
