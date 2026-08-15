import { defineStore } from 'pinia';
import { useNotificationStore } from '@/shared/stores/notificationStore';
import {
  addNoteEpreuve,
  addPieceCandidat,
  createCandidat,
  getCandidatById,
  getCandidatsByConcours,
  getCandidatsByEpreuve,
  importCandidats,
  importNotes,
} from './api';

/**
 * Store des candidats.
 *
 * Pas de `createCrudStore` : il n'existe **pas de `GET /candidats`** — un
 * candidat n'a de sens que dans un concours. On les liste par concours.
 *
 * L'ancien `candidatStore.js` (153 lignes) appelait par ailleurs
 * `POST /candidats/import`, **une route commentée côté backend** : l'import par
 * lot répondait 404. Elle a été rétablie.
 */
export const useCandidatStore = defineStore('candidats', {
  state: () => ({
    /** @type {any[]} Candidats du concours consulté. */
    items: [],
    /** @type {string|null} */
    concoursId: null,
    /**
     * Notes déjà enregistrées, indexées par **code d'épreuve**.
     *
     * `GET /candidats/concours/:id/epreuve?epreuve_code=` renvoie les candidats
     * **avec leur note** (`v_candidats_epreuves`, jointure gauche sur
     * `notes_epreuves_concours`). Elles sont rangées ici, et non dans `items` :
     * `items` est la liste des candidats, que lisent l'onglet « Candidatures »
     * et la grille de saisie. L'ancienne action `fetchByEpreuve` l'écrasait —
     * c'est le même piège que `classeStore.fetchByFiliere`, documenté ailleurs.
     *
     * @type {Record<string, any[]>}
     */
    notesParEpreuve: {},
    /** @type {any|null} Dossier du candidat consulté. */
    dossier: null,
    /** @type {any|null} Compte rendu du dernier import. */
    importReport: null,
    loading: false,
    /** @type {import('@/core/api/apiError').ApiError|null} */
    error: null,
  }),

  getters: {
    /** @returns {(numTable: string) => any} */
    getByNumTable: (state) => (numTable) =>
      state.items.find((candidat) => candidat.num_table === numTable),
  },

  actions: {
    /**
     * Même contrat que `createCrudStore.run` : `undefined` en cas d'échec.
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

    /** @param {string} concoursId */
    async fetchByConcours(concoursId) {
      if (!concoursId) {
        this.items = [];
        this.concoursId = null;
        return undefined;
      }

      return this.run(() => getCandidatsByConcours(concoursId), {
        failure: 'Erreur lors du chargement des candidats.',
        onSuccess: (response) => {
          this.items = response.data ?? [];
          this.concoursId = concoursId;
        },
      });
    },

    /**
     * Les candidats d'une épreuve, **avec la note déjà enregistrée**.
     *
     * Le résultat est rangé sous le code de l'épreuve, sans toucher à `items` :
     * la grille de saisie a besoin des deux — la liste des candidats et leurs
     * notes — et l'onglet « Candidatures » lit la même collection.
     *
     * @param {string} concoursId @param {string} epreuveCode
     * @param {{force?: boolean}} [options] Ignore ce qui est déjà en mémoire.
     */
    async fetchNotesEpreuve(concoursId, epreuveCode, { force = false } = {}) {
      if (!concoursId || !epreuveCode) return undefined;
      if (!force && this.notesParEpreuve[epreuveCode]) return this.notesParEpreuve[epreuveCode];

      return this.run(() => getCandidatsByEpreuve(concoursId, epreuveCode), {
        failure: 'Erreur lors du chargement des notes de l’épreuve.',
        onSuccess: (response) => {
          this.notesParEpreuve = {
            ...this.notesParEpreuve,
            [epreuveCode]: response.data ?? [],
          };
        },
      });
    },

    /**
     * @deprecated Écrase `items` avec les lignes d'une épreuve. Utiliser
     * `fetchNotesEpreuve`, qui range le résultat à part.
     * @param {string} concoursId @param {string} epreuveCode
     */
    async fetchByEpreuve(concoursId, epreuveCode) {
      return this.run(() => getCandidatsByEpreuve(concoursId, epreuveCode), {
        failure: 'Erreur lors du chargement des candidats de l’épreuve.',
        onSuccess: (response) => {
          this.items = response.data ?? [];
          this.concoursId = concoursId;
        },
      });
    },

    /**
     * Dossier d'un candidat.
     *
     * ⚠️ `GET /candidats/:id` répondait **400** — « relation "candidat" does not
     * exist » : le modèle interrogeait la table au singulier. Corrigé côté
     * backend, la route joint désormais le dossier de candidature (statut, motif
     * de rejet, date de dépôt).
     *
     * @param {string} id
     */
    async fetchDossier(id) {
      this.dossier = null;

      return this.run(() => getCandidatById(id), {
        failure: 'Erreur lors du chargement du dossier du candidat.',
        onSuccess: (response) => {
          this.dossier = response.data ?? null;
        },
      });
    },

    /** @param {object} data */
    async create(data) {
      return this.run(() => createCandidat(data), {
        success: 'Candidat enregistré.',
        failure: 'Erreur lors de l’enregistrement du candidat.',
        onSuccess: () => this.fetchByConcours(data.concours_id ?? this.concoursId),
      });
    },

    /** @param {string} id @param {object} data */
    async addPiece(id, data) {
      return this.run(() => addPieceCandidat(id, data), {
        success: 'Pièce justificative ajoutée.',
        failure: 'Erreur lors de l’ajout de la pièce.',
      });
    },

    /**
     * Enregistre la note d'une épreuve.
     * Le candidat est désigné par son **numéro de table**, pas par son identifiant.
     * @param {string} numTable @param {object} data
     */
    async addNote(numTable, data) {
      return this.run(() => addNoteEpreuve(numTable, data), {
        success: 'Note enregistrée.',
        failure: 'Erreur lors de l’enregistrement de la note.',
      });
    },

    /** @param {File} file @param {string} concoursId */
    async importCandidatsFile(file, concoursId) {
      return this.run(() => importCandidats(file, concoursId), {
        success: 'Import des candidats terminé.',
        failure: 'Erreur lors de l’import des candidats.',
        onSuccess: async (response) => {
          this.importReport = response.data ?? null;
          await this.fetchByConcours(concoursId);
        },
      });
    },

    /** @param {File} file @param {string} concoursId */
    async importNotesFile(file, concoursId) {
      return this.run(() => importNotes(file, concoursId), {
        success: 'Import des notes terminé.',
        failure: 'Erreur lors de l’import des notes.',
        onSuccess: (response) => {
          this.importReport = response.data ?? null;
          // Les notes en mémoire viennent d'être remplacées côté serveur : les
          // garder afficherait l'état d'avant l'import.
          this.notesParEpreuve = {};
        },
      });
    },
  },
});
