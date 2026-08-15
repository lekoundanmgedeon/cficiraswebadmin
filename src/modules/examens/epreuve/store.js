import { createCrudStore } from '@/core/store/createCrudStore';
import { useNotificationStore } from '@/shared/stores/notificationStore';
import { epreuvesResource } from './api';

/**
 * Store des épreuves.
 *
 * L'ancien `stores/evaluationStore/evalStore.js` (128 lignes) existait — et
 * fonctionnait — mais **aucune vue ne l'utilisait** : `PlanExamen.vue`, l'écran
 * qui aurait dû l'appeler, fabriquait ses épreuves, ses filières, ses classes et
 * ses modules en dur.
 */
export const useEpreuveStore = createCrudStore({
  id: 'epreuves',
  resource: epreuvesResource,
  label: 'Épreuve',
  cacheKey: 'epreuves',

  state: () => ({
    /** @type {any|null} Compte rendu du dernier import de planning. */
    importReport: null,
  }),

  getters: {
    /**
     * Les épreuves d'une session.
     *
     * `GET /evaluation` ne sait filtrer que sur `anneeId` et `semestreId` — pas
     * sur la session. Chaque ligne portant son `session_id`, le tri se fait ici.
     *
     * @returns {(sessionId: string) => any[]}
     */
    bySession: (state) => (sessionId) =>
      state.items.filter((epreuve) => String(epreuve.session_id) === String(sessionId)),
  },

  actions: {
    /**
     * Import par lot d'un planning d'épreuves.
     *
     * ⚠️ **Il n'existe pas de route d'import côté serveur** pour les évaluations —
     * contrairement aux étudiants et aux tuteurs, qui ont leur
     * `POST /academique/imports/…`. Les lignes sont donc créées une par une, sur
     * `POST /evaluations/evaluation`, la seule route qui existe et qui a été
     * vérifiée. Trois conséquences, assumées :
     *
     *  - **ce n'est pas atomique** : un fichier à moitié fautif laisse les
     *    lignes valides créées. Le compte rendu dit exactement lesquelles ont
     *    échoué, et le fichier reste à l'écran pour être corrigé puis rejoué ;
     *  - une requête par ligne, séquentielle. Un planning se compte en dizaines
     *    de lignes, pas en milliers ; on préfère la lenteur à un import parallèle
     *    dont les erreurs seraient impossibles à rattacher à leur ligne ;
     *  - `create()` de la fabrique n'est **pas** utilisé : il notifie et recharge
     *    la liste **à chaque appel**. Cent lignes auraient produit cent messages
     *    et cent rechargements. La ressource est appelée directement, la liste
     *    rechargée une fois, à la fin.
     *
     * Le compte rendu reprend la forme de ceux du serveur
     * (`{ summary, details.echecs }`), pour que l'écran d'import soit le même
     * partout.
     *
     * @param {Array<{numero: number, libelle: string, payload: object}>} lignes
     * @param {Array<{ligne: number, epreuve: string, erreur: string}>} [rejetsPrealables]
     *   Lignes écartées avant l'envoi — un code de module ou de session
     *   introuvable, par exemple. Elles rejoignent le compte rendu pour que
     *   l'opérateur n'ait qu'une seule liste à corriger.
     */
    async importPlanning(lignes, rejetsPrealables = []) {
      const notifications = useNotificationStore();
      const echecs = [...rejetsPrealables];
      let succes = 0;

      this.loading = true;
      this.error = null;

      try {
        for (const ligne of lignes) {
          try {
            await epreuvesResource.create(ligne.payload);
            succes += 1;
          } catch (error) {
            echecs.push({
              ligne: ligne.numero,
              epreuve: ligne.libelle,
              // `ApiError` porte déjà le message du serveur, normalisé.
              erreur: error?.message ?? 'Erreur inconnue',
            });
          }
        }
      } finally {
        this.loading = false;
      }

      const total = lignes.length + rejetsPrealables.length;

      this.importReport = {
        summary: { totalTraite: total, totalSucces: succes, totalEchecs: echecs.length },
        details: { echecs: echecs.sort((a, b) => a.ligne - b.ligne) },
      };

      // Une seule invalidation, après coup : le calendrier reflète le résultat.
      if (succes > 0) await this.invalidate();

      const message = `${succes}/${total} épreuve(s) planifiée(s)${
        echecs.length > 0 ? ` — ${echecs.length} rejetée(s)` : ''
      }.`;

      if (echecs.length === 0) notifications.notifySuccess(message);
      else notifications.notifyWarning(message);

      return this.importReport;
    },

    /** Efface le compte rendu — à la fermeture de la modale d'import. */
    clearImportReport() {
      this.importReport = null;
    },
  },
});
