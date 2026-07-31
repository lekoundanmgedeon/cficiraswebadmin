import { createCrudStore } from '@/core/store/createCrudStore';
import { travauxResource, getFinalistes } from './api';

const nombre = (valeur) => Number(valeur ?? 0) || 0;

/**
 * Store des travaux de recherche et des finalistes.
 *
 * Les deux collections vivent ensemble parce qu'elles décrivent le même objet
 * vu de deux côtés : `items`, ce sont les travaux **attribués** ; `finalistes`,
 * les étudiants **qui devraient en avoir un**. C'est le rapprochement des deux
 * qui répond à la question de l'écran « statut étudiant » — qui n'a pas encore
 * de sujet.
 */
export const useTravailStore = createCrudStore({
  id: 'coordinationTravaux',
  resource: travauxResource,
  label: 'Travail de recherche',

  state: () => ({
    /** @type {any[]} Étudiants en dernière année, année active. */
    finalistes: [],
  }),

  getters: {
    /** Travaux dont l'échéance est passée sans soumission — calculé côté serveur. */
    enRetard: (state) => state.items.filter((travail) => travail.en_retard),

    /** Travaux sans directeur : personne ne les encadre. */
    sansDirecteur: (state) => state.items.filter((travail) => !travail.directeur_id),

    /** Finalistes qui n'ont pas encore de sujet attribué. */
    finalistesSansTravail: (state) => state.finalistes.filter((etudiant) => !etudiant.travail_id),

    /** Répartition des finalistes par situation (stage, recherche, aucune). */
    parSituation: (state) => {
      const compteurs = { STAGE: 0, RECHERCHE: 0, AUCUNE: 0 };

      for (const etudiant of state.finalistes) {
        const cle = String(etudiant.situation ?? 'AUCUNE').toUpperCase();
        if (compteurs[cle] === undefined) compteurs.AUCUNE += 1;
        else compteurs[cle] += 1;
      }

      return compteurs;
    },

    /** Avancement moyen, sur les seuls travaux attribués. */
    progressionMoyenne: (state) => {
      const avecTravail = state.finalistes.filter((etudiant) => etudiant.travail_id);
      if (avecTravail.length === 0) return 0;

      const total = avecTravail.reduce(
        (somme, etudiant) => somme + nombre(etudiant.progression),
        0
      );
      return total / avecTravail.length;
    },
  },

  actions: {
    /** @param {{situation?: string, avecTravail?: boolean, filiereId?: string}} [params] */
    async fetchFinalistes(params) {
      return this.run(() => getFinalistes(params), {
        failure: 'Erreur lors du chargement des finalistes.',
        onSuccess: (response) => {
          this.finalistes = response.data ?? [];
        },
      });
    },

    /**
     * Enregistre l'avancement d'un travail sans toucher au reste.
     * @param {string} id
     * @param {{progression?: number, statut?: string, situation?: string, lieu_travail?: string}} suivi
     */
    async majSuivi(id, suivi) {
      return this.run(() => travauxResource.update(id, suivi), {
        success: 'Suivi mis à jour.',
        failure: 'Erreur lors de la mise à jour du suivi.',
        onSuccess: async () => {
          await Promise.all([this.fetchAll(), this.fetchFinalistes()]);
        },
      });
    },
  },
});
