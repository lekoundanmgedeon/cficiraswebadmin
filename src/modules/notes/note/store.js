import { defineStore } from 'pinia';
import { useNotificationStore } from '@/shared/stores/notificationStore';
import {
  changerStatutNotes,
  getNotesByEtudiant,
  getNotesByEvaluation,
  publierNotesEvaluation,
  saisirNotesBatch,
  updateNote,
} from './api';

/**
 * Store des notes.
 *
 * Pas de `createCrudStore` : les notes ne forment pas une ressource REST. Elles
 * se listent **par évaluation** et il n'existe **pas de `POST`** — elles
 * préexistent, et l'application ne fait que les corriger.
 *
 * L'ancien `stores/evaluationStore/noteStore.js` existait et fonctionnait — mais
 * **aucune vue ne l'appelait**, et de toute façon ses quatre appels d'API
 * répondaient **404** (mauvais chemins, voir `api.js`).
 */
export const useNoteStore = defineStore('notes', {
  state: () => ({
    /** @type {any[]} Grille de notes de l'évaluation consultée. */
    items: [],
    /** @type {string|null} */
    evaluationId: null,
    /**
     * Notes d'un **étudiant** sur un semestre — le relevé qui compose son
     * bulletin.
     *
     * Rangées à part de `items`, et non dedans : `items` est la grille d'une
     * *évaluation*, et c'est elle que lisent `saisies`, `moyenne`, `parStatut`
     * et `statutGlobal`. Y écrire le relevé d'un étudiant ferait décrire à ces
     * getters un objet qui n'est pas le leur — c'est le piège relevé ailleurs
     * dans le dépôt sur `classeStore.fetchByFiliere`, où le contenu d'un store
     * dépendait de qui l'avait appelé en dernier.
     */
    notesEtudiant: [],
    loading: false,
    /** @type {import('@/core/api/apiError').ApiError|null} */
    error: null,
  }),

  getters: {
    /** Notes réellement saisies (une note peut être nulle). */
    saisies: (state) => state.items.filter((note) => note.valeur !== null && note.valeur !== ''),

    /** Moyenne de l'évaluation, sur les seules notes saisies. */
    moyenne() {
      const valeurs = this.saisies
        .map((note) => Number(note.valeur))
        .filter((v) => !Number.isNaN(v));
      if (valeurs.length === 0) return null;
      return valeurs.reduce((somme, v) => somme + v, 0) / valeurs.length;
    },

    /** Une évaluation est publiée dès lors que toutes ses notes le sont. */
    estPubliee: (state) =>
      state.items.length > 0 &&
      state.items.every((note) => String(note.statut).toUpperCase() === 'PUBLIEE'),

    /** Répartition des notes par statut — l'état réel de la grille. */
    parStatut: (state) =>
      state.items.reduce(
        (compteurs, note) => {
          const statut = String(note.statut ?? '').toUpperCase();
          if (compteurs[statut] !== undefined) compteurs[statut] += 1;
          return compteurs;
        },
        { SAISIE: 0, VALIDEE: 0, PUBLIEE: 0 }
      ),

    /**
     * Statut d'ensemble de la grille : le plus **faible** de ses notes.
     *
     * Une grille dont une seule note est repassée en `SAISIE` n'est plus
     * validée — c'est ce que fait aussi le serveur, qui ne déplace que les
     * notes éligibles.
     */
    statutGlobal() {
      if (this.items.length === 0) return null;
      const { SAISIE, VALIDEE } = this.parStatut;
      if (SAISIE > 0) return 'SAISIE';
      if (VALIDEE > 0) return 'VALIDEE';
      return 'PUBLIEE';
    },
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

    /** @param {string} evaluationId */
    async fetchByEvaluation(evaluationId) {
      if (!evaluationId) {
        this.items = [];
        this.evaluationId = null;
        return undefined;
      }

      return this.run(() => getNotesByEvaluation(evaluationId), {
        failure: 'Erreur lors du chargement des notes.',
        onSuccess: (response) => {
          this.items = response.data ?? [];
          this.evaluationId = evaluationId;
        },
      });
    },

    /**
     * Le relevé d'un étudiant pour un semestre : une ligne par évaluation, avec
     * sa matière, sa pondération et ses crédits. C'est la matière du bulletin.
     *
     * `semestreId` est **obligatoire** : le serveur répond 400 sans lui.
     *
     * @param {string} etudiantId @param {string} semestreId
     */
    async fetchByEtudiant(etudiantId, semestreId) {
      if (!etudiantId || !semestreId) {
        this.notesEtudiant = [];
        return undefined;
      }

      return this.run(() => getNotesByEtudiant(etudiantId, semestreId), {
        failure: 'Erreur lors du chargement des notes de l’étudiant.',
        onSuccess: (response) => {
          this.notesEtudiant = response.data ?? [];
        },
      });
    },

    /**
     * Met à jour une note. La valeur doit rester dans [0, 20] — contrainte de la
     * base, que le contrôleur vérifie aussi (400 sinon).
     *
     * @param {string} id
     * @param {{valeur: number, commentaire?: string|null}} data
     */
    async update(id, data) {
      return this.run(() => updateNote(id, data), {
        failure: 'Erreur lors de l’enregistrement de la note.',
      });
    },

    /**
     * Saisit un lot de notes, par matricule.
     *
     * C'est le seul chemin capable de **créer** une note : `update()` ne sait
     * que corriger une ligne existante, et il n'y a pas de `POST /notes`. Un
     * étudiant qui n'avait encore aucune note n'apparaît donc pas dans la
     * grille — il vient de la liste de la classe, et sa note naît ici.
     *
     * @param {string} evaluationId
     * @param {Array<{matricule: string, note: number, commentaire?: string|null}>} lignes
     * @returns {Promise<{total_traite: number, total_succes: number, total_echecs: number, erreurs: any[]}|undefined>}
     */
    async saisirLot(evaluationId, lignes) {
      if (!evaluationId || !lignes?.length) return undefined;

      const response = await this.run(() => saisirNotesBatch(evaluationId, lignes), {
        failure: 'Erreur lors de l’enregistrement des notes.',
      });

      if (response === undefined) return undefined;

      await this.fetchByEvaluation(evaluationId);
      return response.data ?? response;
    },

    /**
     * Change le statut de toutes les notes de l'évaluation consultée.
     *
     * Le serveur répond **409** quand aucune note n'est éligible (par exemple
     * valider une grille déjà validée) : ce n'est pas une panne, et `run()` le
     * remonte comme n'importe quelle erreur métier, message du serveur compris.
     *
     * @param {'SAISIE'|'VALIDEE'|'PUBLIEE'} statut
     */
    async changerStatut(statut) {
      if (!this.evaluationId) return undefined;

      const evaluationId = this.evaluationId;
      const messages = {
        VALIDEE: 'Notes validées.',
        PUBLIEE: 'Notes publiées.',
        SAISIE: 'Grille renvoyée en correction.',
      };

      return this.run(() => changerStatutNotes(evaluationId, statut), {
        success: messages[statut] ?? 'Statut mis à jour.',
        failure: 'Erreur lors du changement de statut.',
        onSuccess: () => this.fetchByEvaluation(evaluationId),
      });
    },

    /** Publie toutes les notes de l'évaluation consultée. */
    async publier() {
      if (!this.evaluationId) return undefined;

      const evaluationId = this.evaluationId;

      return this.run(() => publierNotesEvaluation(evaluationId), {
        success: 'Notes publiées.',
        failure: 'Erreur lors de la publication des notes.',
        onSuccess: () => this.fetchByEvaluation(evaluationId),
      });
    },
  },
});
