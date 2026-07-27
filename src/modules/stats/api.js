import { evaluationClient } from '@/core/api/clients';

/**
 * Endpoints des statistiques de résultats.
 *
 * ⚠️ **Le domaine `/statistiques` n'existe pas.** Ses routes *et* son service ont
 * été supprimés du backend (`8dc85ab`, `8686c6b`, `3f7e4dc`), et le code
 * récupérable est mort : 9 de ses 11 requêtes échouent contre la base, écrites
 * contre un schéma antérieur (`cursus`, `resultats`, `paiements`,
 * `concours.nb_places`, `cycle.designation` n'existent plus). Voir §2.1 de
 * `docs/ETAT-REFACTORISATION.md`. Cet écran ne le ressuscite pas : il consomme
 * `/evaluations/resultats`, ajouté par la migration backend `010`.
 *
 * Le partage des rôles avec le tableau de bord est net : `dashboard` montre les
 * **effectifs et l'argent**, `stats` montre les **résultats**. Aucun des deux
 * n'appelle les endpoints de l'autre.
 */

/**
 * Agrégats de résultats. Tous les filtres sont facultatifs : sans aucun, la
 * réponse porte sur l'ensemble des bulletins.
 *
 * @param {{classeId?: string, semestreId?: string, anneeId?: string, filiereId?: string}} [params]
 * @returns {Promise<{data: {
 *   synthese: object|null,
 *   distribution: Array<{tranche: string, effectif: number}>,
 *   decisions: Array<{decision: string, effectif: number}>,
 *   mentions: Array<{mention: string, effectif: number}>,
 *   parClasse: Array<object>,
 * }}>}
 */
export const getStatistiquesResultats = (params) =>
  evaluationClient.get('/resultats/statistiques', params);

/**
 * Calcule et enregistre les bulletins d'une classe pour une période.
 *
 * C'est le geste qui alimente tout cet écran : sans lui,
 * `bulletins_semestriels` reste vide et les statistiques n'ont rien à agréger.
 * La fonction serveur est idempotente — relancer un calcul met à jour, ne
 * duplique pas — et ne touche jamais un bulletin verrouillé.
 *
 * @param {string} classeId
 * @param {{semestreId: string, anneeId: string}} periode
 */
export const genererBulletins = (classeId, { semestreId, anneeId }) =>
  evaluationClient.post(`/resultats/classes/${classeId}/bulletins/generer`, {
    semestreId,
    anneeId,
  });

/** Palmarès d'une classe : les bulletins eux-mêmes, triés par rang. */
export const getBulletinsClasse = (classeId, { semestreId, anneeId }) =>
  evaluationClient.get(`/resultats/classes/${classeId}/bulletins`, { semestreId, anneeId });
