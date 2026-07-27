import { defineStore } from 'pinia';
import { useNotificationStore } from '@/shared/stores/notificationStore';
import { classesResource } from '@/modules/structure-academique/classe/api';
import { modulesResource } from '@/modules/matieres/api';
import { enseignantsResource } from '@/modules/pedagogies/formateurs/api';
import { getActiveSemestres } from '@/modules/structure-academique/semestre/api';
import { getAttributions, addAttribution, deleteAttribution } from './api';

/** CDI → Permanent, VAC/CDD → Vacataire, sinon « Non défini » (comme le répertoire). */
function libelleContrat(code) {
  if (code === 'CDI') return 'Permanent';
  if (code === 'VAC' || code === 'CDD') return 'Vacataire';
  return 'Non défini';
}

/**
 * Store des attributions de cours.
 *
 * Remplace les tableaux `mockAssignments` / `mockMatieres` / `mockFormateurs`
 * codés en dur de l'onglet « Assignation des enseignements ». Les attributions
 * viennent de `vue_attributions_cours` ; les référentiels, des modules déjà
 * migrés. Le template continue de résoudre matières et formateurs par id via ses
 * helpers : le store fournit donc les listes sous la forme qu'ils attendent.
 */
export const useAttributionStore = defineStore('pedagogieAttributions', {
  state: () => ({
    /** @type {any[]} Attributions projetées : {id, classe, matiereId, formateurId, heures}. */
    assignments: [],
    /** @type {string[]} Codes de classe. */
    mockClasses: [],
    /** @type {Record<string,string>} Code de classe → id (pour l'écriture). */
    classeCodeToId: {},
    /** @type {Array<{id,nom,parentId}>} Modules présentés comme « matières ». */
    mockMatieres: [],
    /** @type {Array<{id,code,nom}>} Modules pour la résolution du parent. */
    mockModules: [],
    /** @type {Array<{id,nom,prenom,contrat}>} Formateurs. */
    mockFormateurs: [],
    /** @type {string|null} Semestre actif, rattaché par défaut. */
    semestreActifId: null,
    loading: false,
    /** @type {import('@/core/api/apiError').ApiError|null} */
    error: null,
  }),

  actions: {
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

    async fetchAssignments() {
      return this.run(() => getAttributions(), {
        failure: 'Erreur lors du chargement des attributions.',
        onSuccess: (result) => {
          this.assignments = (result.data ?? []).map((a) => ({
            id: a.attribution_id,
            classe: a.classe,
            matiereId: a.module_id,
            formateurId: a.enseignant_id,
            heures: a.heures,
          }));
        },
      });
    },

    async fetchReferentiels() {
      const [classes, modules, formateurs, semestres] = await Promise.all([
        classesResource.list().catch(() => ({ data: [] })),
        modulesResource.list().catch(() => ({ data: [] })),
        enseignantsResource.list().catch(() => ({ data: [] })),
        getActiveSemestres().catch(() => ({ data: [] })),
      ]);

      const classesData = classes.data ?? [];
      this.mockClasses = classesData.map((c) => c.code).filter(Boolean).sort();
      this.classeCodeToId = Object.fromEntries(classesData.map((c) => [c.code, c.id]));

      const modulesData = modules.data ?? [];
      // Chaque module est à la fois sa « matière » et son « module parent » :
      // les helpers du template (getModuleNameByMatiere…) résolvent ainsi une
      // valeur cohérente sans hiérarchie matière/UE distincte côté serveur.
      this.mockMatieres = modulesData.map((m) => ({
        id: m.id,
        nom: m.designation,
        parentId: m.id,
      }));
      this.mockModules = modulesData.map((m) => ({ id: m.id, code: m.code, nom: m.designation }));

      this.mockFormateurs = (formateurs.data ?? []).map((e) => ({
        id: e.enseignant_id,
        nom: e.nom,
        prenom: e.prenom,
        contrat: libelleContrat(e.type_contrat),
      }));

      this.semestreActifId = (semestres.data ?? [])[0]?.id ?? null;
    },

    /** @param {{classe,matiereId,formateurId,heures}} form */
    async create(form) {
      const payload = {
        module_id: form.matiereId,
        classe_id: this.classeCodeToId[form.classe] ?? null,
        enseignant_id: form.formateurId,
        semestre_id: this.semestreActifId,
        heures: form.heures,
      };
      const reponse = await this.run(() => addAttribution(payload), {
        success: 'Cours attribué.',
        failure: 'Erreur lors de l’attribution du cours.',
      });
      if (reponse === undefined) return undefined;
      await this.fetchAssignments();
      return reponse;
    },

    /** @param {string} id */
    async remove(id) {
      const reponse = await this.run(() => deleteAttribution(id), {
        success: 'Attribution retirée.',
        failure: 'Erreur lors du retrait de l’attribution.',
      });
      if (reponse === undefined) return undefined;
      await this.fetchAssignments();
      return reponse;
    },
  },
});
