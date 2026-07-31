import { createCrudStore } from '@/core/store/createCrudStore';
import { useNotificationStore } from '@/shared/stores/notificationStore';
import {
  addTuteurToEtudiant,
  etudiantsResource,
  getEtudiantComplet,
  getEtudiantParcours,
  importEtudiants,
  importTuteurs,
  uploadPhotoEtudiant,
} from './api';

/**
 * Store des étudiants.
 *
 * L'ancien `stores/etudiants/etudiantStore.js` n'exposait **ni `items` ni
 * `fetchAll`** : aucun écran ne *pouvait* charger de liste, d'où les tableaux
 * codés en dur dans quatre onglets sur six.
 *
 * ⚠️ La ressource `/etudiants` est **incomplète côté serveur** — voir `api.js` :
 * il n'y a ni `GET /etudiants/:id`, ni `PUT`, ni `DELETE`. Trois actions de
 * `createCrudStore` sont donc adaptées :
 *  - `fetchById` passe par `/:id/complet` ;
 *  - `update` et `remove` échouent explicitement plutôt que d'envoyer une requête
 *    vouée à un 404.
 */
export const useEtudiantStore = createCrudStore({
  id: 'etudiants',
  resource: etudiantsResource,
  label: 'Étudiant',
  cacheKey: 'etudiants',

  state: () => ({
    /** @type {any[]} Parcours académique de l'étudiant consulté. */
    parcours: [],
    /** @type {any|null} Compte rendu du dernier import d'étudiants. */
    importReport: null,
    /**
     * @type {any|null} Compte rendu du dernier import de tuteurs.
     *
     * Séparé d'`importReport` : les deux onglets vivent côte à côte, et un
     * compte rendu partagé afficherait le rapport des étudiants sous l'onglet
     * des tuteurs.
     */
    tuteursImportReport: null,
  }),

  actions: {
    /**
     * Charge le détail d'un étudiant.
     *
     * `GET /etudiants/:id` **n'existe pas** (404) : seul `/:id/complet` renvoie
     * l'étudiant, augmenté de ses tuteurs et des pièces de son dossier.
     *
     * @param {string|number} id
     */
    async fetchById(id) {
      return this.run(() => getEtudiantComplet(id), {
        failure: "Erreur lors du chargement de l'étudiant.",
        onSuccess: (response) => {
          this.item = response.data ?? null;
        },
      });
    },

    /**
     * Le backend n'expose pas `PUT /etudiants/:id`. Plutôt que d'émettre une
     * requête qui reviendra en 404, on le dit franchement.
     */
    async update() {
      useNotificationStore().notifyError(
        "La modification d'un étudiant n'est pas encore possible : le serveur n'expose pas cette opération."
      );
      return undefined;
    },

    /** Le backend n'expose pas `DELETE /etudiants/:id`. */
    async remove() {
      useNotificationStore().notifyError(
        "La suppression d'un étudiant n'est pas encore possible : le serveur n'expose pas cette opération."
      );
      return undefined;
    },

    /** @param {string|number} id */
    async fetchParcours(id) {
      return this.run(() => getEtudiantParcours(id), {
        failure: 'Erreur lors du chargement du parcours académique.',
        onSuccess: (response) => {
          this.parcours = response.data ?? [];
        },
      });
    },

    /** @param {string|number} id @param {object} data */
    async addTuteur(id, data) {
      return this.run(() => addTuteurToEtudiant(id, data), {
        success: 'Tuteur ajouté avec succès.',
        failure: "Erreur lors de l'ajout du tuteur.",
        onSuccess: () => this.fetchById(id),
      });
    },

    /** @param {string|number} id @param {File} file */
    async uploadPhoto(id, file) {
      return this.run(() => uploadPhotoEtudiant(id, file), {
        success: 'Photo de profil mise à jour.',
        failure: 'Erreur lors du téléchargement de la photo.',
        onSuccess: () => this.fetchById(id),
      });
    },

    /**
     * @param {File} file
     * @param {string} codeAnnee Année académique cible, ex. "2024-2025".
     */
    async importFromFile(file, codeAnnee) {
      return this.run(() => importEtudiants(file, codeAnnee), {
        failure: "Erreur lors de l'import du fichier.",
        onSuccess: async (response) => {
          this.importReport = response.data ?? null;

          // On notifie avec le message du serveur plutôt qu'un « Import
          // terminé. » fixe : lui seul distingue l'import intégralement repris
          // de l'import partiel (« 3/5 lignes intégrées, 2 rejetée(s) »).
          useNotificationStore().notifySuccess(response.message ?? 'Import terminé.');

          await this.invalidate();
        },
      });
    },

    /**
     * Import par lot de tuteurs légaux.
     *
     * Pas d'`invalidate()` : les tuteurs ne figurent pas dans la liste des
     * étudiants, qui n'a donc pas à être rechargée. Ils apparaissent sur la
     * fiche détaillée, servie par `/etudiants/:id/complet`.
     *
     * @param {File} file
     */
    async importTuteursFromFile(file) {
      return this.run(() => importTuteurs(file), {
        failure: "Erreur lors de l'import des tuteurs.",
        onSuccess: (response) => {
          this.tuteursImportReport = response.data ?? null;
          useNotificationStore().notifySuccess(response.message ?? 'Import terminé.');
        },
      });
    },
  },
});
