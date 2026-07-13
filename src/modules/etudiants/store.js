import { createCrudStore } from '@/core/store/createCrudStore';
import {
  addTuteurToEtudiant,
  etudiantsResource,
  getEtudiantParcours,
  importEtudiants,
  uploadPhotoEtudiant,
} from './api';

/**
 * Store des étudiants.
 *
 * L'ancien `stores/etudiants/etudiantStore.js` n'exposait que quatre actions
 * (`addEtudiant`, `addTuteur`, `uploadPhoto`, `fetchParcours`) et **aucune
 * lecture de liste** : ni `items`, ni `fetchAll`. Les écrans qui affichaient des
 * étudiants ne pouvaient donc pas en charger — d'où les tableaux codés en dur
 * dans quatre des six onglets.
 *
 * `EtudiantsClassesContent.vue` appelait par ailleurs
 * `etudiantStore.fetchEtudiantsByClasseFiliereAnnee(...)` et lisait
 * `etudiantStore.filteredEtudiants` : **ni l'action ni l'état n'existaient**.
 * L'appel levait un `TypeError` et l'onglet restait vide en toutes circonstances.
 * `fetchAll({ params })` couvre désormais ce besoin.
 */
export const useEtudiantStore = createCrudStore({
  id: 'etudiants',
  resource: etudiantsResource,
  label: 'Étudiant',
  // Pas de `cacheKey` : la liste est presque toujours consultée filtrée (par
  // classe, filière, année), et une liste filtrée n'a pas la même clé que la
  // liste complète. Mettre la première en cache sous la clé de la seconde
  // ferait servir un sous-ensemble comme s'il était complet.

  state: () => ({
    /** @type {any|null} Parcours académique de l'étudiant consulté. */
    parcours: null,
    /** @type {any|null} Compte rendu du dernier import (lignes créées, rejetées). */
    importReport: null,
  }),

  actions: {
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
        onSuccess: () => this.fetchById(id),
      });
    },

    /** @param {File} file */
    async importFromFile(file) {
      return this.run(() => importEtudiants(file), {
        success: 'Import terminé.',
        failure: "Erreur lors de l'import du fichier.",
        onSuccess: (response) => {
          this.importReport = response.data ?? null;
        },
      });
    },
  },
});
