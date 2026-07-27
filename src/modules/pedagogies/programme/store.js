import { defineStore } from 'pinia';
import { useNotificationStore } from '@/shared/stores/notificationStore';
import { classesResource } from '@/modules/structure-academique/classe/api';
import { modulesResource } from '@/modules/matieres/api';
import { getMaquette, addMaquette, updateMaquette, deleteMaquette } from './api';

/** Ligne de maquette (backend) → « règle » attendue par le template. */
function projeterRegle(row) {
  return {
    id: row.id,
    classe: row.classe_code,
    semestre: row.semestre,
    moduleCode: row.module_code,
    matiere: row.matiere,
    coefficient: row.coefficient !== null ? Number(row.coefficient) : null,
    ects: row.ects,
    noteEliminatoire: row.note_eliminatoire !== null ? Number(row.note_eliminatoire) : null,
  };
}

/**
 * Store de la maquette pédagogique.
 *
 * Remplace les tableaux `mockRules` / `mockModules` / `mockClasses` de l'écran
 * programme. La maquette vient de `/pedagogies/programme/maquette` (table
 * dédiée) ; la répartition des UE (onglet « Crédits académiques ») est dérivée
 * des modules réels (`GET /modules`).
 */
export const useMaquetteStore = defineStore('pedagogieMaquette', {
  state: () => ({
    /** @type {any[]} Règles de maquette projetées. */
    rules: [],
    /** @type {string[]} Codes de classe. */
    mockClasses: [],
    /** @type {Array<{code,nom}>} UE / modules (menu déroulant). */
    mockModules: [],
    /** @type {Array<{code,nom,heures,ects,obligatoire}>} Répartition des UE. */
    ueDistribution: [],
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

    async fetchMaquette() {
      return this.run(() => getMaquette(), {
        failure: 'Erreur lors du chargement de la maquette.',
        onSuccess: (result) => {
          this.rules = (result.data ?? []).map(projeterRegle);
        },
      });
    },

    async fetchReferentiels() {
      const [classes, modules] = await Promise.all([
        classesResource.list().catch(() => ({ data: [] })),
        modulesResource.list().catch(() => ({ data: [] })),
      ]);

      this.mockClasses = (classes.data ?? []).map((c) => c.code).filter(Boolean).sort();

      const modulesData = modules.data ?? [];
      this.mockModules = modulesData.map((m) => ({ code: m.code, nom: m.designation }));
      // Répartition des UE : le champ `obligatoire` n'existe pas côté serveur,
      // on le laisse à vrai par défaut (toutes les UE de la maquette le sont).
      this.ueDistribution = modulesData.map((m) => ({
        code: m.code,
        nom: m.designation,
        heures: m.volume_horaire ?? 0,
        ects: m.credit ?? 0,
        obligatoire: true,
      }));
    },

    /** Construit le corps backend depuis le formulaire de l'écran. */
    payload(form) {
      return {
        classe_code: form.classe,
        semestre: form.semestre,
        module_code: form.moduleCode,
        matiere: form.matiere,
        coefficient: form.coefficient,
        ects: form.ects,
        note_eliminatoire: form.noteEliminatoire,
      };
    },

    async create(form) {
      const reponse = await this.run(() => addMaquette(this.payload(form)), {
        success: 'Règle ajoutée à la maquette.',
        failure: 'Erreur lors de l’ajout à la maquette.',
      });
      if (reponse === undefined) return undefined;
      await this.fetchMaquette();
      return reponse;
    },

    async update(id, form) {
      const reponse = await this.run(() => updateMaquette(id, this.payload(form)), {
        success: 'Règle mise à jour.',
        failure: 'Erreur lors de la mise à jour de la règle.',
      });
      if (reponse === undefined) return undefined;
      await this.fetchMaquette();
      return reponse;
    },

    async remove(id) {
      const reponse = await this.run(() => deleteMaquette(id), {
        success: 'Règle retirée.',
        failure: 'Erreur lors du retrait de la règle.',
      });
      if (reponse === undefined) return undefined;
      await this.fetchMaquette();
      return reponse;
    },
  },
});
