import { createCrudStore } from '@/core/store/createCrudStore';
import { useNotificationStore } from '@/shared/stores/notificationStore';
import {
  assignModuleToClasse,
  detachUeFromConfig,
  getSemestresConfiguration,
  getUesByConfiguration,
  modulesResource,
} from './api';
import { readAssignationResult } from './constants';

/**
 * Store des modules d'enseignement.
 *
 * L'ancien `stores/academiqueStore/moduleStore.js` n'exposait **ni `modules` ni
 * `fetchModules`** — et pourtant `ModuleList.vue` lisait le premier et appelait
 * le second. `filteredModules` valait donc `undefined`, et `paginatedModules`
 * plantait sur `.slice()` : **l'écran levait un `TypeError` au montage**. Il
 * n'était de toute façon branché sur aucune route, donc personne ne l'a vu.
 *
 * La lecture est maintenant réelle : `GET /modules` a été ajouté côté backend.
 */
export const useModuleStore = createCrudStore({
  id: 'modules',
  resource: modulesResource,
  label: 'Module',
  cacheKey: 'modules',

  state: () => ({
    /** @type {any[]} Couples (semestre, classe) configurés. */
    configurations: [],
    /** @type {any[]} UE rattachées à la configuration consultée. */
    ues: [],
  }),

  actions: {
    async fetchConfigurations() {
      return this.run(() => getSemestresConfiguration(), {
        failure: 'Erreur lors du chargement des configurations semestrielles.',
        onSuccess: (response) => {
          this.configurations = response.data ?? [];
        },
      });
    },

    /** @param {string} semestreId @param {string} classeId */
    async fetchUes(semestreId, classeId) {
      // Les deux identifiants sont obligatoires côté serveur (400 sinon) : on
      // évite l'aller-retour plutôt que de le laisser échouer.
      if (!semestreId || !classeId) {
        this.ues = [];
        return undefined;
      }

      return this.run(() => getUesByConfiguration(semestreId, classeId), {
        failure: 'Erreur lors du chargement des unités d’enseignement.',
        onSuccess: (response) => {
          this.ues = response.data ?? [];
        },
      });
    },

    /**
     * Détache une UE d'une configuration.
     * @param {string} attributionId Identifiant du lien, pas du module.
     * @param {string} semestreId @param {string} classeId
     */
    async detachUe(attributionId, semestreId, classeId) {
      return this.run(() => detachUeFromConfig(attributionId), {
        success: 'Unité d’enseignement détachée.',
        failure: 'Erreur lors du détachement de l’unité d’enseignement.',
        onSuccess: () => this.fetchUes(semestreId, classeId),
      });
    },

    /**
     * Rattache un module à une classe pour un semestre.
     *
     * `run()` ne suffit pas ici : l'endpoint répond **200 avec `success: true`
     * même quand l'assignation a échoué** — le verdict est dans `data.statut`.
     * L'ancien store notifiait donc « Module assigné avec succès » y compris
     * lorsque le module était introuvable. On lit le corps.
     *
     * Trois issues, et non deux : `AVERTISSEMENT` (l'affectation existait déjà)
     * n'est ni un succès ni une erreur — **rien n'a été inséré**, et l'annoncer
     * comme une réussite tromperait l'utilisateur.
     *
     * @param {{codeModule: string, codeClasse: string, codeSemestre: string, codeEnseignant: string}} data
     * @param {{semestreId?: string, classeId?: string}} [contexte] Pour rafraîchir la liste affichée.
     * @returns {Promise<boolean|undefined>} `true` seulement si l'affectation a été créée.
     */
    async assignModule(data, contexte = {}) {
      const notifications = useNotificationStore();

      const response = await this.run(() => assignModuleToClasse(data), {
        failure: 'Erreur lors du rattachement du module.',
      });

      // Échec réseau ou HTTP : `run` a déjà notifié.
      if (response === undefined) return undefined;

      const { level, message } = readAssignationResult(response);

      if (level === 'error') {
        notifications.notifyError(message);
        return false;
      }

      if (level === 'warning') {
        notifications.notifyWarning(message);
        return false;
      }

      notifications.notifySuccess(message);

      if (contexte.semestreId && contexte.classeId) {
        await this.fetchUes(contexte.semestreId, contexte.classeId);
      }

      return true;
    },
  },
});
