import { defineStore } from 'pinia';
import { useNotificationStore } from '@/shared/stores/notificationStore';
import {
  enseignantsResource,
  getDepartements,
  getEnseignantFullDetails,
} from './api';

/**
 * Correspondance code de contrat → libellé binaire attendu par le répertoire.
 *
 * Le tableau des formateurs distingue « Permanent » et « Vacataire » (styles et
 * filtre). La base parle en codes (`CDI`, `CDD`, `VAC`) : on les projette sur ces
 * deux libellés sans toucher au template. Un enseignant sans contrat rattaché
 * (la table `contrats` est quasi vide) devient « Non défini ».
 */
function libelleContrat(code) {
  if (code === 'CDI') return 'Permanent';
  if (code === 'VAC' || code === 'CDD') return 'Vacataire';
  return 'Non défini';
}

/** Un timestamp ISO devient une date française ; le template l'affiche brut. */
function formatDate(valeur) {
  if (!valeur) return '—';
  const d = new Date(valeur);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('fr-FR');
}

/**
 * Projette une ligne de `vue_infos_enseignants` sur exactement les champs que
 * `FormateursContent.vue` lit — sans rien changer à son balisage. La vue expose
 * déjà `code_enseignant`, `telephone`, `departement`, `specialite` ; ne restent
 * à dériver que `id` (la vue nomme la clé `enseignant_id`), le libellé de contrat
 * et la date.
 */
function projeter(row) {
  return {
    ...row,
    id: row.enseignant_id,
    code_enseignant: row.code_enseignant ?? row.matricule ?? '—',
    contrat: libelleContrat(row.type_contrat),
    departement: row.departement ?? '—',
    specialite: row.specialite ?? '—',
    telephone: row.telephone ?? row.tel1 ?? '—',
    date_embauche: formatDate(row.date_embauche),
  };
}

/**
 * Store du répertoire des formateurs.
 *
 * Remplace l'ancien `stores/pedagogieStore/enseignantStore.js`, qui appelait
 * `/pedagogie/...` (préfixe inexistant) via un client mal configuré : ses appels
 * répondaient 404 et les écrans affichaient des tableaux codés en dur.
 */
export const useFormateurStore = defineStore('pedagogieFormateurs', {
  state: () => ({
    /** @type {any[]} Formateurs projetés pour le répertoire. */
    items: [],
    /** @type {string[]} Désignations de départements (filtre). */
    departements: [],
    /** @type {any|null} Détail complet du formateur consulté. */
    detail: null,
    loading: false,
    /** @type {import('@/core/api/apiError').ApiError|null} */
    error: null,
  }),

  actions: {
    /**
     * Exécute un appel en gérant `loading`, `error` et les notifications.
     * Même contrat que `createCrudStore.run`.
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

    async fetchAll() {
      return this.run(() => enseignantsResource.list(), {
        failure: 'Erreur lors de la récupération des formateurs.',
        onSuccess: (result) => {
          this.items = (result.data ?? []).map(projeter);
        },
      });
    },

    async fetchDepartements() {
      return this.run(() => getDepartements(), {
        failure: 'Erreur lors de la récupération des départements.',
        onSuccess: (result) => {
          this.departements = (result.data ?? [])
            .map((d) => d.designation)
            .filter(Boolean)
            .sort();
        },
      });
    },

    /** @param {string} id */
    async fetchDetail(id) {
      return this.run(() => getEnseignantFullDetails(id), {
        failure: 'Erreur lors de la récupération du formateur.',
        onSuccess: (result) => {
          this.detail = Array.isArray(result.data) ? result.data[0] : result.data;
        },
      });
    },

    /** @param {string} id @param {object} data */
    async update(id, data) {
      const reponse = await this.run(() => enseignantsResource.update(id, data), {
        success: 'Formateur mis à jour.',
        failure: 'Erreur lors de la mise à jour du formateur.',
      });
      if (reponse === undefined) return undefined;
      await this.fetchAll();
      return reponse.data;
    },

    /** @param {string} id */
    async remove(id) {
      const reponse = await this.run(() => enseignantsResource.remove(id), {
        success: 'Formateur supprimé.',
        failure: 'Erreur lors de la suppression du formateur.',
      });
      if (reponse === undefined) return undefined;
      await this.fetchAll();
      return reponse.data ?? true;
    },
  },
});
