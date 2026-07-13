import { defineStore } from 'pinia';
import { useNotificationStore } from '@/shared/stores/notificationStore';
import { useInscriptionStore } from '@/modules/inscriptions/store';
import {
  addTuteurToEtudiant,
  createEtudiant,
  getEtudiantParcours,
  importEtudiants,
  uploadPhotoEtudiant,
} from './api';

/**
 * Store des étudiants.
 *
 * Il n'est **pas** bâti sur `createCrudStore`, contrairement aux autres modules :
 * `/etudiants` n'est pas une ressource REST complète côté backend. Il n'existe ni
 * `GET /etudiants`, ni `GET /etudiants/:id`, ni `PUT`, ni `DELETE` — seulement
 * `POST /etudiants`, plus les tuteurs, la photo et le parcours (voir `api.js`).
 *
 * La **liste** vient donc de `GET /inscriptions`, dont chaque ligne porte
 * l'identité de l'étudiant. Ce store délègue la lecture au store des inscriptions
 * et n'expose en propre que ce que le backend sait réellement faire.
 *
 * Conséquence assumée : on ne peut ni modifier ni supprimer un étudiant depuis
 * l'application, faute d'endpoint. Les boutons correspondants ont été retirés
 * plutôt que laissés à cliquer dans le vide.
 */
export const useEtudiantStore = defineStore('etudiants', {
  state: () => ({
    /** @type {any|null} Étudiant consulté. */
    item: null,
    /** @type {any|null} Parcours académique de l'étudiant consulté. */
    parcours: null,
    /** @type {any|null} Compte rendu du dernier import. */
    importReport: null,
    loading: false,
    /** @type {import('@/core/api/apiError').ApiError|null} */
    error: null,
  }),

  getters: {
    /**
     * L'annuaire des étudiants, projeté depuis les inscriptions.
     * @returns {any[]}
     */
    items() {
      return useInscriptionStore().etudiants;
    },

    /**
     * Chargement de l'**annuaire**, distinct de `loading` (qui couvre les
     * opérations propres au module : création, import, photo, parcours).
     */
    listLoading() {
      return useInscriptionStore().loading;
    },

    isEmpty() {
      return this.items.length === 0;
    },

    count() {
      return this.items.length;
    },

    /** @returns {(id: string|number) => any} */
    getById() {
      return (id) => this.items.find((etudiant) => String(etudiant.id) === String(id));
    },
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

    /**
     * Charge l'annuaire. Délègue aux inscriptions, seule source de listing.
     *
     * @param {object} [options]
     * @param {boolean} [options.force]
     * @param {object} [options.params] Filtres serveur : `annee_academique_id`,
     *   `classe_id`, `statut`. **Pas `filiere_id`** — `listerInscriptions` ne lit
     *   que ces trois clés dans la query string ; filtrer par filière se fait côté client.
     */
    async fetchAll(options) {
      return useInscriptionStore().fetchAll(options);
    },

    /**
     * Charge un étudiant. Il n'y a pas de `GET /etudiants/:id` : on le retrouve
     * dans l'annuaire, qu'on charge au besoin.
     * @param {string|number} id
     */
    async fetchById(id) {
      const inscriptions = useInscriptionStore();

      if (inscriptions.items.length === 0) {
        const loaded = await inscriptions.fetchAll();
        if (loaded === undefined) return undefined;
      }

      this.item = this.getById(id) ?? null;
      return this.item ?? undefined;
    },

    /** @param {object} data */
    async create(data) {
      return this.run(() => createEtudiant(data), {
        success: 'Étudiant créé. Il apparaîtra dans la liste une fois inscrit à une classe.',
        failure: "Erreur lors de la création de l'étudiant.",
      });
    },

    /** @param {string|number} id */
    async fetchParcours(id) {
      return this.run(() => getEtudiantParcours(id), {
        failure: 'Erreur lors du chargement du parcours académique.',
        onSuccess: (response) => {
          this.parcours = response.data ?? null;
        },
      });
    },

    /** @param {string|number} id @param {object} data */
    async addTuteur(id, data) {
      return this.run(() => addTuteurToEtudiant(id, data), {
        success: 'Tuteur ajouté avec succès.',
        failure: "Erreur lors de l'ajout du tuteur.",
      });
    },

    /** @param {string|number} id @param {File} file */
    async uploadPhoto(id, file) {
      return this.run(() => uploadPhotoEtudiant(id, file), {
        success: 'Photo de profil mise à jour.',
        failure: 'Erreur lors du téléchargement de la photo.',
      });
    },

    /** @param {File} file */
    async importFromFile(file) {
      return this.run(() => importEtudiants(file), {
        success: 'Import terminé.',
        failure: "Erreur lors de l'import du fichier.",
        onSuccess: async (response) => {
          this.importReport = response.data ?? null;
          // L'import crée des inscriptions : l'annuaire en dépend.
          await useInscriptionStore().invalidate();
        },
      });
    },
  },
});
