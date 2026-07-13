import { createCrudStore } from '@/core/store/createCrudStore';
import { useNotificationStore } from '@/shared/stores/notificationStore';
import {
  annulerFacture,
  facturesResource,
  genererFacturesClasse,
  getFacturesEtudiant,
  getFacturesImpayees,
} from '../api';

/**
 * Store des factures.
 *
 * Remplace `stores/financeStore/factureStore.js`, dont les cinq actions
 * visaient `/factures` sur la racine de l'API — une route inexistante. Le vrai
 * chemin est `/api/finance/factures`.
 *
 * Une facture ne se met pas à jour : elle s'annule. `update` reste hérité de la
 * fabrique CRUD mais n'a pas d'endpoint côté serveur ; ne l'appelez pas.
 */
export const useFactureStore = createCrudStore({
  id: 'financeFactures',
  resource: facturesResource,
  label: 'Facture',

  state: () => ({
    /** @type {any[]} Factures non soldées. */
    impayees: [],
    /** @type {number} Somme des soldes impayés, servie par `meta.total_impaye`. */
    totalImpaye: 0,
  }),

  getters: {
    /**
     * Total facturé et total encaissé sur les factures chargées.
     *
     * Les montants arrivent en chaînes (`NUMERIC` PostgreSQL) : les additionner
     * sans conversion les concaténerait.
     */
    totaux: (state) => {
      const actives = state.items.filter((facture) => facture.statut !== 'Annulée');
      return {
        facture: actives.reduce((total, f) => total + Number(f.total_du ?? 0), 0),
        encaisse: actives.reduce((total, f) => total + Number(f.deja_paye ?? 0), 0),
        solde: actives.reduce((total, f) => total + Number(f.solde ?? 0), 0),
      };
    },
  },

  actions: {
    /** @param {string} inscriptionId */
    async emettre(inscriptionId) {
      return this.run(() => facturesResource.create({ inscription_id: inscriptionId }), {
        success: 'Facture émise avec succès.',
        failure: 'Erreur lors de l’émission de la facture.',
        onSuccess: () => this.invalidate(),
      });
    },

    /**
     * Facture toutes les inscriptions non encore facturées d'une classe.
     *
     * Une réponse vide n'est pas un échec : la classe est déjà entièrement
     * facturée. On le dit, plutôt que d'annoncer un succès trompeur.
     *
     * @param {string} classeId @param {string} anneeId
     */
    async genererPourClasse(classeId, anneeId) {
      return this.run(
        () => genererFacturesClasse({ classe_id: classeId, annee_academique_id: anneeId }),
        {
          failure: 'Erreur lors de la génération automatique des factures.',
          onSuccess: () => this.invalidate(),
        }
      );
    },

    /**
     * Génère les factures de plusieurs classes d'un coup.
     *
     * Le serveur facture une classe à la fois (`fn_facturer_classe`). Le bouton
     * « Génération automatique » de l'écran ne demande pas de classe : on
     * parcourt donc toutes celles de l'année, et on rend le total émis.
     *
     * @param {Array<{id: string}>} classes
     * @param {string} anneeId
     */
    async genererPourClasses(classes, anneeId) {
      const notifications = useNotificationStore();
      this.loading = true;
      let emises = 0;
      let echecs = 0;

      try {
        for (const classe of classes) {
          try {
            const reponse = await genererFacturesClasse({
              classe_id: classe.id,
              annee_academique_id: anneeId,
            });
            emises += (reponse.data ?? []).length;
          } catch {
            // Une classe sans tarif défini fait échouer sa seule génération ;
            // ce n'est pas une raison d'interrompre les autres.
            echecs += 1;
          }
        }
      } finally {
        this.loading = false;
      }

      if (emises === 0 && echecs === 0) {
        notifications.notifyInfo('Aucune facture à émettre : tout est déjà facturé.');
      } else if (echecs > 0) {
        notifications.notifyWarning(
          `${emises} facture(s) émise(s). ${echecs} classe(s) ignorée(s), faute de tarif défini.`
        );
      } else {
        notifications.notifySuccess(`${emises} facture(s) émise(s).`);
      }

      await this.invalidate();
      return emises;
    },

    /** @param {string} id @param {string} [motif] */
    async annuler(id, motif) {
      return this.run(() => annulerFacture(id, motif), {
        success: 'Facture annulée.',
        failure: 'Erreur lors de l’annulation de la facture.',
        onSuccess: () => this.invalidate(),
      });
    },

    /** @param {{annee_id?: string}} [params] */
    async fetchImpayees(params) {
      return this.run(() => getFacturesImpayees(params), {
        failure: 'Erreur lors de la récupération des impayés.',
        onSuccess: (result) => {
          this.impayees = result.data ?? [];
          this.totalImpaye = Number(result.meta?.total_impaye ?? 0);
        },
      });
    },

    /** @param {string} etudiantId */
    async fetchByEtudiant(etudiantId) {
      const reponse = await this.run(() => getFacturesEtudiant(etudiantId), {
        failure: 'Erreur lors de la récupération des factures de l’étudiant.',
      });
      return reponse?.data ?? [];
    },
  },
});
