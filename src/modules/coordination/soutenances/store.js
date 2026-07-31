import { createCrudStore } from '@/core/store/createCrudStore';
import {
  soutenancesResource,
  getDossierSoutenance,
  getStatistiquesSoutenances,
  setJurys,
  upsertProcesVerbal,
  validerProcesVerbal,
} from './api';

/** Store des soutenances, des jurys et des procès-verbaux. */
export const useSoutenanceStore = createCrudStore({
  id: 'coordinationSoutenances',
  resource: soutenancesResource,
  label: 'Soutenance',

  state: () => ({
    /** @type {any|null} Dossier complet consulté (soutenance + jury + PV). */
    dossier: null,
    /** @type {object|null} */
    statistiques: null,
  }),

  getters: {
    /** Soutenances encore à venir, dans l'ordre où elles se tiendront. */
    aVenir: (state) =>
      state.items
        .filter(
          (soutenance) =>
            soutenance.statut === 'PLANIFIEE' &&
            new Date(soutenance.date_soutenance) >= new Date(new Date().toDateString())
        )
        .sort((a, b) => String(a.date_soutenance).localeCompare(String(b.date_soutenance))),

    /**
     * Soutenances tenues sans procès-verbal : le trou administratif que l'écran
     * doit rendre visible, puisque rien d'autre ne le signale.
     */
    sansProcesVerbal: (state) =>
      state.items.filter((soutenance) => soutenance.statut === 'TENUE' && !soutenance.pv_id),

    /** Soutenances dont le PV est rédigé mais pas encore validé. */
    pvEnAttente: (state) =>
      state.items.filter((soutenance) => soutenance.pv_statut === 'BROUILLON'),

    /** Dossiers clos : PV validé ou publié. */
    archives: (state) =>
      state.items.filter((soutenance) => ['VALIDE', 'PUBLIE'].includes(soutenance.pv_statut)),
  },

  actions: {
    /** @param {string} id */
    async fetchDossier(id) {
      if (!id) {
        this.dossier = null;
        return undefined;
      }

      return this.run(() => getDossierSoutenance(id), {
        failure: 'Erreur lors du chargement du dossier de soutenance.',
        onSuccess: (response) => {
          this.dossier = response.data ?? null;
        },
      });
    },

    async fetchStatistiques() {
      return this.run(() => getStatistiquesSoutenances(), {
        failure: 'Erreur lors du chargement des statistiques.',
        onSuccess: (response) => {
          this.statistiques = response.data ?? null;
        },
      });
    },

    /**
     * @param {string} id
     * @param {Array<{enseignant_id: string, role: string}>} jurys
     */
    async enregistrerJury(id, jurys) {
      return this.run(() => setJurys(id, jurys), {
        success: 'Jury enregistré.',
        failure: "Erreur lors de l'enregistrement du jury.",
        onSuccess: (response) => {
          this.dossier = response.data ?? this.dossier;
        },
      });
    },

    /** @param {string} id @param {object} data */
    async enregistrerProcesVerbal(id, data) {
      return this.run(() => upsertProcesVerbal(id, data), {
        success: 'Procès-verbal enregistré.',
        failure: "Erreur lors de l'enregistrement du procès-verbal.",
        onSuccess: async () => {
          await Promise.all([this.fetchDossier(id), this.fetchAll()]);
        },
      });
    },

    /**
     * Valide le PV. Le serveur en tire trois conséquences : le PV devient
     * opposable, la soutenance passe à « tenue », le mémoire à « soutenu ». On
     * relit donc la liste, et pas seulement le dossier.
     * @param {string} id
     */
    async validerPv(id) {
      return this.run(() => validerProcesVerbal(id), {
        success: 'Procès-verbal validé.',
        failure: 'Erreur lors de la validation du procès-verbal.',
        onSuccess: async () => {
          await Promise.all([this.fetchDossier(id), this.fetchAll(), this.fetchStatistiques()]);
        },
      });
    },
  },
});
