import { pedagogieClient } from '@/core/api/clients';

/**
 * Emploi du temps **général** : transversal aux cycles, filières et classes.
 *
 * À ne pas confondre avec `pedagogies/crenaux`, qui gère la **saisie** des
 * créneaux d'une classe. Ici, tout est en lecture seule : l'écran donne une vue
 * d'ensemble d'une année académique.
 *
 * ⚠️ Comme les autres routes de `/pedagogies/schedule`, celle-ci répond un
 * **tableau brut** — pas l'enveloppe `{success, data}` du reste de l'API. Le
 * store lit donc le résultat directement.
 */

/**
 * Tous les créneaux, filtrables par contexte académique.
 *
 * Les colonnes de filtre viennent de `vue_horaire_details`, enrichie par la
 * migration backend `011` : avant elle, la vue ne portait que classe et
 * semestre, et cet écran aurait dû rapatrier tous les créneaux pour rejoindre
 * les référentiels côté client.
 *
 * @param {{anneeId?: string, cycleId?: string, filiereId?: string,
 *          classeId?: string, semestreId?: string, jour?: string}} [params]
 * @returns {Promise<Array<object>>} tableau brut
 */
export const getEmploiDuTempsGeneral = (params) => pedagogieClient.get('/schedule/general', params);
