import { defineStore } from 'pinia';
import { useNotificationStore } from '@/shared/stores/notificationStore';
import { addPiece, getDossier, getParcours, verifyPiece } from './api';

/**
 * Store du dossier scolaire.
 *
 * Il n'est pas bâti sur `createCrudStore` : le dossier n'est pas une ressource
 * REST. Il n'a ni liste, ni création, ni suppression — il **existe déjà** pour
 * chaque étudiant (un `dossier` est créé avec lui, la jointure est même
 * *inner* dans `GET /etudiants`). On le consulte et on agit sur ses pièces.
 *
 * L'écran précédent (`views/parcours/`) était **intégralement simulé** : ses
 * douze fichiers servaient des `ref([...])` codés en dur, et `DossierAcademique`
 * fabriquait son étudiant après un `setTimeout(800)` imitant une latence réseau.
 */
export const useDossierStore = defineStore('dossiers', {
  state: () => ({
    /** @type {any|null} Dossier consulté : identité + `tuteurs` + `pieces`. */
    dossier: null,
    /** @type {any[]} Parcours académique de l'étudiant consulté. */
    parcours: [],
    loading: false,
    /** @type {import('@/core/api/apiError').ApiError|null} */
    error: null,
  }),

  getters: {
    /** @returns {any[]} */
    pieces: (state) => state.dossier?.pieces ?? [],

    /** @returns {any[]} */
    tuteurs: (state) => state.dossier?.tuteurs ?? [],

    /** L'identifiant du dossier, porté par l'étudiant. @returns {string|null} */
    dossierId: (state) => state.dossier?.dossier_id ?? null,

    /** Pièces encore à traiter. */
    piecesEnAttente: (state) =>
      (state.dossier?.pieces ?? []).filter(
        (piece) => String(piece.statut ?? '').toUpperCase() === 'EN_ATTENTE'
      ),
  },

  actions: {
    /**
     * Même contrat que `createCrudStore.run` : renvoie `undefined` en cas
     * d'échec, ce sur quoi l'UI se repose pour ne fermer une modale que si
     * l'appel a réellement abouti.
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

    /** @param {string} etudiantId */
    async fetchDossier(etudiantId) {
      return this.run(() => getDossier(etudiantId), {
        failure: 'Erreur lors du chargement du dossier scolaire.',
        onSuccess: (response) => {
          this.dossier = response.data ?? null;
        },
      });
    },

    /** @param {string} etudiantId */
    async fetchParcours(etudiantId) {
      return this.run(() => getParcours(etudiantId), {
        failure: 'Erreur lors du chargement du parcours académique.',
        onSuccess: (response) => {
          this.parcours = response.data ?? [];
        },
      });
    },

    /**
     * Dépose une pièce au dossier consulté.
     * @param {{type_piece: string, chemin: string}} data
     */
    async addPiece(data) {
      if (!this.dossierId) return undefined;

      const etudiantId = this.dossier.id;

      return this.run(() => addPiece(this.dossierId, data), {
        success: 'Pièce justificative déposée. Elle est en attente de vérification.',
        failure: 'Erreur lors du dépôt de la pièce.',
        // Le dossier porte la liste des pièces : il faut le relire pour la voir.
        onSuccess: () => this.fetchDossier(etudiantId),
      });
    },

    /**
     * Valide ou rejette une pièce.
     * @param {string} pieceId
     * @param {'VALIDE'|'REJETE'} statut
     * @param {string|null} [motifRejet] Obligatoire côté serveur si `statut` vaut `REJETE`.
     */
    async verifyPiece(pieceId, statut, motifRejet = null) {
      if (!this.dossierId) return undefined;

      const etudiantId = this.dossier.id;

      return this.run(
        () => verifyPiece(this.dossierId, pieceId, { statut, motif_rejet: motifRejet }),
        {
          success:
            statut === 'VALIDE' ? 'Pièce validée.' : 'Pièce rejetée. L’étudiant doit la corriger.',
          failure: 'Erreur lors de la vérification de la pièce.',
          onSuccess: () => this.fetchDossier(etudiantId),
        }
      );
    },
  },
});
