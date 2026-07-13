import { createCrudStore } from '@/core/store/createCrudStore';
import {
  calculerMoyennesEtRangs,
  changeConcoursStatut,
  concoursResource,
  downloadAdmis,
  getClassement,
  proclamerAdmissions,
} from './api';
import { statutConcoursInfo } from '../constants';

/**
 * Store des concours.
 *
 * L'ancien `stores/gestionStores/concourStore.js` (297 lignes) mêlait dans un
 * seul fichier les concours, leurs épreuves, les classements et les
 * proclamations, et recopiait douze fois la même séquence
 * `loading`/`try`/`notifyError`. Les épreuves ont désormais leur sous-domaine.
 */
export const useConcoursStore = createCrudStore({
  id: 'concours',
  resource: concoursResource,
  label: 'Concours',
  cacheKey: 'concours',

  state: () => ({
    /** @type {any[]} Classement du concours consulté : moyenne générale et rang. */
    classement: [],
  }),

  getters: {
    /** @deprecated Utiliser `items`. Alias pour les vues non encore migrées. */
    concoursList: (state) => state.items,
  },

  actions: {
    /**
     * Change le statut d'un concours.
     * @param {string} id @param {'PLANIFIE'|'OUVERT'|'CLOTURE'|'ANNULE'} statut
     */
    async changeStatut(id, statut) {
      return this.run(() => changeConcoursStatut(id, statut), {
        success: `Concours passé au statut « ${statutConcoursInfo(statut).label} ».`,
        failure: 'Erreur lors du changement de statut.',
        onSuccess: () => this.invalidate(),
      });
    },

    /** @param {string} id */
    async fetchClassement(id) {
      return this.run(() => getClassement(id), {
        failure: 'Erreur lors du chargement du classement.',
        onSuccess: (response) => {
          this.classement = response.data ?? [];
        },
      });
    },

    /**
     * Recalcule les moyennes et les rangs.
     *
     * La route répondait **404 en annonçant un échec alors que le calcul venait
     * de réussir** : la fonction Postgres est un `void`, et le contrôleur prenait
     * son absence de valeur de retour pour une erreur. Corrigé côté backend —
     * elle renvoie maintenant le classement à jour.
     *
     * @param {string} id
     */
    async recalculer(id) {
      return this.run(() => calculerMoyennesEtRangs(id), {
        success: 'Moyennes et rangs recalculés.',
        failure: 'Erreur lors du calcul des moyennes et des rangs.',
        onSuccess: (response) => {
          this.classement = response.data ?? [];
        },
      });
    },

    /**
     * Proclame les admissions au-dessus d'un seuil.
     * @param {string} id
     * @param {{seuil_admission: number, commentaire?: string|null}} data
     */
    async proclamer(id, data) {
      return this.run(() => proclamerAdmissions(id, data), {
        success: 'Admissions proclamées.',
        failure: 'Erreur lors de la proclamation des admissions.',
        onSuccess: () => this.fetchClassement(id),
      });
    },

    /**
     * Télécharge la liste des admis.
     *
     * La réponse est un **blob**, pas du JSON : le client HTTP la renvoie telle
     * quelle, et c'est ici qu'on la transforme en téléchargement.
     *
     * @param {string} id @param {'pdf'|'excel'} format
     */
    async downloadAdmisList(id, format = 'pdf') {
      return this.run(() => downloadAdmis(id, format), {
        success: 'Liste des admis téléchargée.',
        failure: 'Erreur lors du téléchargement de la liste des admis.',
        onSuccess: (blob) => {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `admis_${id}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
          link.click();
          URL.revokeObjectURL(url);
        },
      });
    },
  },
});
