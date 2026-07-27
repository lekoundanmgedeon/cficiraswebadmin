import { defineStore } from 'pinia';
import { useNotificationStore } from '@/shared/stores/notificationStore';
import { classesResource } from '@/modules/structure-academique/classe/api';
import { sallesResource } from '@/modules/examens/salle/api';
import { modulesResource } from '@/modules/matieres/api';
import { getActiveSemestres } from '@/modules/structure-academique/semestre/api';
import {
  addSchedule,
  deleteSchedule,
  getSchedulesDetails,
  updateSchedule,
} from './api';

/** Projette une ligne de `vue_horaire_details` sur le créneau que l'UI affiche. */
function projeterSlot(row) {
  return {
    id: row.id,
    // La grille compare `date === 'YYYY-MM-DD'` : on tronque l'ISO reçu.
    date: row.date ? String(row.date).slice(0, 10) : null,
    heureDebut: (row.heure_debut ?? '').slice(0, 5),
    heureFin: (row.heure_fin ?? '').slice(0, 5),
    classe: row.classe,
    matiere: row.nom_module,
    formateur: row.enseignant,
    salle: row.salle_nom,
  };
}

/**
 * Store des emplois du temps.
 *
 * Remplace les tableaux `mockSchedules` / `mockClasses` / `mockSalles` /
 * `mockMatiereFormateurs` codés en dur dans l'écran crenaux. Les référentiels
 * (classes, salles, matières+responsables, semestre actif) viennent des modules
 * déjà migrés ; les créneaux, de `vue_horaire_details`.
 */
export const useScheduleStore = defineStore('pedagogieSchedule', {
  state: () => ({
    /** @type {any[]} Créneaux projetés. */
    schedules: [],
    /** @type {string[]} Codes de classe (menus + filtre). */
    classes: [],
    /** @type {string[]} Numéros de salle affichés. */
    salles: [],
    /** @type {Record<string,string>} Numéro de salle → id, pour l'écriture. */
    sallesMap: {},
    /** @type {Array<{module_id,matiere,enseignant_id,formateur}>} Enseignement + responsable. */
    matiereFormateurs: [],
    /** @type {string|null} Semestre actif, rattaché par défaut à un créneau. */
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

    async fetchSchedules() {
      return this.run(() => getSchedulesDetails(), {
        failure: 'Erreur lors du chargement des emplois du temps.',
        onSuccess: (rows) => {
          // Réponse brute : un tableau, pas d'enveloppe `{success, data}`.
          this.schedules = (Array.isArray(rows) ? rows : []).map(projeterSlot);
        },
      });
    },

    /**
     * Charge les référentiels de saisie depuis les modules déjà migrés.
     * Silencieux sur l'échec d'un référentiel : l'écran reste utilisable même si
     * une liste manque.
     */
    async fetchReferentiels() {
      const [classes, salles, modules, semestres] = await Promise.all([
        classesResource.list().catch(() => ({ data: [] })),
        sallesResource.list().catch(() => ({ data: [] })),
        modulesResource.list().catch(() => ({ data: [] })),
        getActiveSemestres().catch(() => ({ data: [] })),
      ]);

      this.classes = (classes.data ?? []).map((c) => c.code).filter(Boolean).sort();

      const sallesData = salles.data ?? [];
      this.salles = sallesData.map((s) => s.numero).filter(Boolean);
      this.sallesMap = Object.fromEntries(sallesData.map((s) => [s.numero, s.id]));

      this.matiereFormateurs = (modules.data ?? []).map((m) => ({
        module_id: m.id,
        matiere: m.designation,
        enseignant_id: m.responsable_id ?? null,
        formateur: `${m.responsable_prenom ?? ''} ${m.responsable_nom ?? ''}`.trim() || 'Non assigné',
      }));

      this.semestreActifId = (semestres.data ?? [])[0]?.id ?? null;
    },

    /** Construit le corps attendu par le backend à partir du formulaire de l'écran. */
    payload(form) {
      return {
        classe_code: form.classe,
        module_id: form.matiereFormateur?.module_id ?? null,
        enseignant_id: form.matiereFormateur?.enseignant_id ?? null,
        salle_id: this.sallesMap[form.salle] ?? null,
        type_cours: form.type_cours ?? 'CM',
        semestre_id: this.semestreActifId,
        date: form.date,
        heure_debut: form.heureDebut,
        heure_fin: form.heureFin,
      };
    },

    async create(form) {
      const reponse = await this.run(() => addSchedule(this.payload(form)), {
        success: 'Créneau enregistré.',
        failure: 'Erreur lors de l’enregistrement du créneau.',
      });
      if (reponse === undefined) return undefined;
      await this.fetchSchedules();
      return reponse;
    },

    async update(id, form) {
      const reponse = await this.run(() => updateSchedule(id, this.payload(form)), {
        success: 'Créneau mis à jour.',
        failure: 'Erreur lors de la mise à jour du créneau.',
      });
      if (reponse === undefined) return undefined;
      await this.fetchSchedules();
      return reponse;
    },

    async remove(id) {
      const reponse = await this.run(() => deleteSchedule(id), {
        success: 'Créneau supprimé.',
        failure: 'Erreur lors de la suppression du créneau.',
      });
      if (reponse === undefined) return undefined;
      await this.fetchSchedules();
      return reponse;
    },
  },
});
