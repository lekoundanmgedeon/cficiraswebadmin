import { createCrudStore } from '@/core/store/createCrudStore';
import { useNotificationStore } from '@/shared/stores/notificationStore';
import {
  changeInscriptionStatut,
  getInscriptionsFinances,
  importInscriptions,
  importReinscriptions,
  inscriptionsResource,
} from './api';
import { normalizeStatut, statutInfo } from './constants';

/**
 * Store des inscriptions.
 *
 * L'ancien `stores/academiqueStore/inscriptionStore.js` (229 lignes) recopiait
 * les helpers de cache et sept fois la même séquence `loading`/`try`/`notify`.
 * Surtout, **quatre membres consommés par les composants n'y existaient pas** :
 * `removeInscription`, `fetchCandidatsReinscription`, `candidatsPourReinscription`
 * et `bulkImportReinscriptions`. Deux onglets entiers reposaient dessus et ne
 * pouvaient donc rien afficher ni rien envoyer.
 *
 * Une inscription porte l'identité de l'étudiant (`etudiant_matricule`,
 * `etudiant_nom`, `etudiant_prenom`, `etudiant_email`) : c'est, de fait, la seule
 * source de listing d'étudiants du backend — il n'existe pas de `GET /etudiants`.
 * Le module `etudiants` consomme ce store pour cette raison.
 */
export const useInscriptionStore = createCrudStore({
  id: 'inscriptions',
  resource: inscriptionsResource,
  label: 'Inscription',
  // Pas de `cacheKey` : la liste se consulte le plus souvent filtrée (année,
  // classe, statut), et une liste filtrée n'a pas la même clé que la liste
  // complète.

  state: () => ({
    /** @type {any[]} Suivi financier, servi par `/inscriptions/finances`. */
    finances: [],
    /** @type {{total_collecte: number, total_attente: number}} */
    financeTotals: { total_collecte: 0, total_attente: 0 },
    /** @type {any|null} Compte rendu du dernier import (summary + rejets). */
    importReport: null,
  }),

  getters: {
    /**
     * Les étudiants distincts connus du système, dérivés des inscriptions.
     *
     * Le backend n'expose aucun `GET /etudiants` : cette projection est le seul
     * annuaire disponible. Un étudiant réinscrit possède plusieurs inscriptions ;
     * on ne garde que la plus récente pour ne pas le compter deux fois.
     *
     * @returns {any[]}
     */
    etudiants: (state) => {
      const parEtudiant = new Map();

      for (const inscription of state.items) {
        const id = inscription.etudiant_id;
        if (!id) continue;

        const existant = parEtudiant.get(id);
        const plusRecente =
          !existant || new Date(inscription.date_inscription) > new Date(existant.date_inscription);

        if (plusRecente) {
          parEtudiant.set(id, {
            id,
            inscription_id: inscription.inscription_id ?? inscription.id,
            matricule: inscription.etudiant_matricule,
            nom: inscription.etudiant_nom,
            prenom: inscription.etudiant_prenom,
            email: inscription.etudiant_email,
            classe_id: inscription.classe_id,
            classe: inscription.classe_code,
            filiere: inscription.filiere_nom,
            annee_academique: inscription.annee_code,
            statut: inscription.inscription_statut,
            date_inscription: inscription.date_inscription,
          });
        }
      }

      return [...parEtudiant.values()];
    },

    /** Dossiers encore à traiter. */
    enAttente: (state) =>
      state.items.filter(
        (inscription) => normalizeStatut(inscription.inscription_statut) === 'EN_ATTENTE'
      ),
  },

  actions: {
    async fetchFinances() {
      return this.run(() => getInscriptionsFinances(), {
        failure: 'Erreur lors du chargement du suivi financier.',
        onSuccess: (response) => {
          const { totals, inscriptions } = response.data ?? {};
          this.finances = inscriptions ?? [];
          // Le backend renvoie les montants en chaînes ("1100000.00").
          this.financeTotals = {
            total_collecte: Number(totals?.total_collecte ?? 0),
            total_attente: Number(totals?.total_attente ?? 0),
          };
        },
      });
    },

    /**
     * Applique une décision sur un dossier.
     * @param {string|number} id
     * @param {string} statut Code canonique (`VALIDEE`, `REJETEE`, `ABANDON`…).
     * @param {string|null} [commentaire]
     */
    async changeStatut(id, statut, commentaire = null) {
      return this.run(() => changeInscriptionStatut(id, { statut, commentaire }), {
        success: `Dossier passé au statut « ${statutInfo(statut).label} ».`,
        failure: 'Erreur lors du changement de statut.',
        onSuccess: async () => {
          // Le statut change à la fois la liste et les totaux financiers.
          await Promise.all([this.invalidate(), this.fetchFinances()]);
        },
      });
    },

    /** @param {File} file @param {string} codeAnnee */
    async importInscriptions(file, codeAnnee) {
      return this.runImport(() => importInscriptions(file, codeAnnee), 'inscriptions');
    },

    /** @param {File} file @param {string} codeAnnee */
    async importReinscriptions(file, codeAnnee) {
      return this.runImport(() => importReinscriptions(file, codeAnnee), 'réinscriptions');
    },

    /**
     * Exécute un import et en conserve le compte rendu.
     *
     * Le serveur renvoie un bilan `{ summary: { totalTraite, totalSucces,
     * totalEchecs }, details: { echecs } }` : un import « réussi » peut très bien
     * avoir rejeté des lignes. On distingue donc succès complet et succès partiel
     * plutôt que d'annoncer une réussite globale dans les deux cas.
     *
     * @param {() => Promise<any>} call
     * @param {string} label
     */
    async runImport(call, label) {
      this.importReport = null;

      const response = await this.run(call, {
        failure: `Erreur lors de l'import des ${label}.`,
        onSuccess: (result) => {
          this.importReport = result.data ?? null;
        },
      });

      if (response === undefined) return undefined;

      const echecs = this.importReport?.summary?.totalEchecs ?? 0;
      const notifications = useNotificationStore();

      if (echecs > 0) {
        notifications.notifyWarning(
          `Import des ${label} terminé avec ${echecs} ligne(s) rejetée(s).`
        );
      } else {
        notifications.notifySuccess(`Import des ${label} réussi.`);
      }

      await this.invalidate();
      return this.importReport;
    },
  },
});
