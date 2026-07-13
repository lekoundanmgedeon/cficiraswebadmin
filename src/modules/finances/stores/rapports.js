import { defineStore } from 'pinia';
import { useNotificationStore } from '@/shared/stores/notificationStore';
import {
  getBilanClasses,
  getBilanFilieres,
  getDossierInscription,
  getEncaissementsMensuels,
  getKpi,
  getRepartitionModes,
  getSituationEtudiant,
} from '../api';

/**
 * Store des rapports financiers.
 *
 * Toutes les valeurs numériques sont converties à l'entrée : PostgreSQL sert ses
 * `NUMERIC` en chaînes (`"14950000.00"`), et les écrans les additionnent ou les
 * passent à Chart.js. Sans cette conversion, `total_engage - total_encaisse`
 * produit `NaN` et un graphique vide.
 */
export const useRapportStore = defineStore('financeRapports', {
  state: () => ({
    /** @type {{total_engage: number, total_encaisse: number, total_restant: number, taux_recouvrement: number, nb_inscriptions: number, nb_debiteurs: number, nb_en_retard: number}} */
    kpi: {
      total_engage: 0,
      total_encaisse: 0,
      total_restant: 0,
      taux_recouvrement: 0,
      nb_inscriptions: 0,
      nb_debiteurs: 0,
      nb_en_retard: 0,
    },
    /** @type {any[]} */
    bilanFilieres: [],
    /** @type {any[]} */
    bilanClasses: [],
    /** @type {any[]} */
    encaissementsMensuels: [],
    /** @type {any[]} */
    repartitionModes: [],
    loading: false,
    /** @type {import('@/core/api/apiError').ApiError|null} */
    error: null,
  }),

  actions: {
    /**
     * @template T
     * @param {() => Promise<T>} call
     * @param {{failure?: string, onSuccess?: (r: T) => void}} [options]
     */
    async run(call, { failure, onSuccess } = {}) {
      const notifications = useNotificationStore();
      this.loading = true;
      this.error = null;

      try {
        const result = await call();
        await onSuccess?.(result);
        return result;
      } catch (error) {
        this.error = error;
        notifications.notifyError(error, failure);
        return undefined;
      } finally {
        this.loading = false;
      }
    },

    /** @param {{annee_id?: string}} [params] Sans année, le serveur rend l'année active. */
    async fetchKpi(params) {
      return this.run(() => getKpi(params), {
        failure: 'Erreur lors du chargement des indicateurs financiers.',
        onSuccess: (result) => {
          const kpi = result.data ?? {};
          this.kpi = {
            total_engage: Number(kpi.total_engage ?? 0),
            total_encaisse: Number(kpi.total_encaisse ?? 0),
            total_restant: Number(kpi.total_restant ?? 0),
            taux_recouvrement: Number(kpi.taux_recouvrement ?? 0),
            nb_inscriptions: Number(kpi.nb_inscriptions ?? 0),
            nb_debiteurs: Number(kpi.nb_debiteurs ?? 0),
            nb_en_retard: Number(kpi.nb_en_retard ?? 0),
          };
        },
      });
    },

    async fetchBilanFilieres() {
      return this.run(() => getBilanFilieres(), {
        failure: 'Erreur lors du chargement du bilan par filière.',
        onSuccess: (result) => {
          this.bilanFilieres = (result.data ?? []).map((ligne) => ({
            ...ligne,
            attendu: Number(ligne.attendu ?? 0),
            percu: Number(ligne.percu ?? 0),
            reste: Number(ligne.reste ?? 0),
            taux: Number(ligne.taux ?? 0),
            nb_etudiants: Number(ligne.nb_etudiants ?? 0),
          }));
        },
      });
    },

    /** @param {{annee_id?: string}} [params] */
    async fetchBilanClasses(params) {
      return this.run(() => getBilanClasses(params), {
        failure: 'Erreur lors du chargement du bilan par classe.',
        onSuccess: (result) => {
          this.bilanClasses = (result.data ?? []).map((ligne) => ({
            ...ligne,
            effectif: Number(ligne.effectif ?? 0),
            attendu: Number(ligne.attendu ?? 0),
            percu: Number(ligne.percu ?? 0),
            reste: Number(ligne.reste ?? 0),
            taux: Number(ligne.taux ?? 0),
          }));
        },
      });
    },

    /** @param {{nb_mois?: number, annee_id?: string}} [params] */
    async fetchEncaissementsMensuels(params) {
      return this.run(() => getEncaissementsMensuels(params), {
        failure: 'Erreur lors du chargement des encaissements mensuels.',
        onSuccess: (result) => {
          this.encaissementsMensuels = (result.data ?? []).map((ligne) => ({
            mois: ligne.mois,
            total: Number(ligne.total ?? 0),
            nb_paiements: Number(ligne.nb_paiements ?? 0),
          }));
        },
      });
    },

    /** @param {{annee_id?: string}} [params] */
    async fetchRepartitionModes(params) {
      return this.run(() => getRepartitionModes(params), {
        failure: 'Erreur lors du chargement de la répartition par mode.',
        onSuccess: (result) => {
          this.repartitionModes = (result.data ?? []).map((ligne) => ({
            mode: ligne.mode,
            total: Number(ligne.total ?? 0),
            nb_paiements: Number(ligne.nb_paiements ?? 0),
          }));
        },
      });
    },

    /**
     * Dossier financier complet d'une inscription : le dû ventilé, le taux de
     * règlement, l'échéancier et les paiements — en un seul appel.
     *
     * @param {string} inscriptionId
     */
    async fetchDossier(inscriptionId) {
      const reponse = await this.run(() => getDossierInscription(inscriptionId), {
        failure: 'Erreur lors du chargement du dossier financier.',
      });
      return reponse?.data ?? null;
    },

    /** @param {string} etudiantId */
    async fetchSituationEtudiant(etudiantId) {
      const reponse = await this.run(() => getSituationEtudiant(etudiantId), {
        failure: 'Erreur lors du chargement de la situation financière.',
      });
      return reponse?.data ?? [];
    },
  },
});
