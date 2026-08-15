import { createHttpClient } from '@/core/api/httpClient';

/**
 * Endpoints de l'assistant IA (`/api/assistant`).
 *
 * L'assistant a son propre préfixe backend, absent de `core/api/clients.js` :
 * on crée donc son client ici plutôt que d'ajouter un domaine partagé pour un
 * seul module.
 *
 * ⚠️ Ces appels sont **lents par nature** — le serveur interroge un modèle de
 * langage, puis exécute une ou plusieurs requêtes SQL, en plusieurs tours. Une
 * seconde et demie avec un fournisseur distant, davantage avec un modèle local.
 * Aucun de ces appels ne doit être lancé au montage d'un écran.
 */
const assistantClient = createHttpClient('/assistant');

/**
 * Pose une question en langage naturel.
 *
 * Le `cadrage` nomme l'écran d'où part la question — l'assistant est ouvert
 * depuis quatre onglets, et « et par filière ? » n'y a pas le même sens. Il
 * oriente la lecture du modèle ; il **ne restreint aucun droit** : le
 * cloisonnement reste celui du catalogue filtré par rôle, côté serveur. Un
 * cadrage inconnu est refusé en 400 plutôt qu'ignoré (voir `CADRAGES` du
 * backend).
 *
 * @param {string} question
 * @param {string|null} [conversationId] Poursuit un fil existant ; absent, en ouvre un.
 * @param {string|null} [cadrage] `structure-academique` | `scolarite` | `examens` | `finances`.
 * @returns {Promise<{data: {conversationId: string, reponse: string, aboutie: boolean,
 *   requetes: Array<{intention: string|null, sql: string, nbLignes: number|null}>,
 *   tours: number, dureeMs: number}}>}
 */
export const poserQuestion = (question, conversationId = null, cadrage = null) =>
  assistantClient.post('/question', { question, conversationId, cadrage });

/**
 * Les conversations de l'utilisateur, la plus récente d'abord.
 *
 * Le `titre` est celui que l'utilisateur a choisi, à défaut la première question
 * du fil — le backend n'en fait pas générer un par le modèle.
 *
 * `archivees: true` **remplace** la liste par celle des fils rangés : c'est la
 * corbeille, pas un supplément.
 *
 * @param {{limite?: number, offset?: number, q?: string, archivees?: boolean,
 *   cadrage?: string}} [params]
 */
export const getConversations = (params = {}) =>
  assistantClient.get('/conversations', { limite: 20, ...params });

/**
 * Le fil complet d'une conversation.
 *
 * Rend les échanges dans l'ordre, **y compris ceux qui ont échoué** (ils
 * portent `erreur`), chacun avec son `horodatage` : les chiffres d'une réponse
 * sont ceux de ce moment-là, et l'écran doit le dire.
 *
 * 404 si le fil n'existe pas **ou** s'il appartient à quelqu'un d'autre — le
 * serveur confond volontairement les deux cas.
 */
export const getConversation = (id) => assistantClient.get(`/conversations/${id}`);

/**
 * Renomme ou range une conversation.
 *
 * Il n'existe pas de suppression : `assistant_echanges` est le journal d'audit
 * du module. `{ archivee: true }` masque le fil, la trace reste.
 *
 * @param {string} id
 * @param {{titre?: string|null, archivee?: boolean}} patch
 *   `titre: null` rend au fil son titre par défaut.
 */
export const patchConversation = (id, patch) =>
  assistantClient.patch(`/conversations/${id}`, patch);

/** Le journal des échanges, tous utilisateurs — **403 hors ADMIN**. */
export const getAudit = (params = {}) => assistantClient.get('/audit', { limite: 50, ...params });

/** Statistiques d'usage et de coût — **403 hors ADMIN**. */
export const getAuditStatistiques = (jours = 30) =>
  assistantClient.get('/audit/statistiques', { jours });

/** Les dernières questions, tous fils confondus. */
export const getHistorique = (limite = 20) => assistantClient.get('/historique', { limite });

/**
 * État du module : fournisseur joignable, modèle présent, sources accessibles.
 *
 * C'est le seul appel bon marché du lot, et le seul à lancer au montage : il
 * permet d'afficher une indisponibilité avant que l'utilisateur ait tapé sa
 * question.
 */
export const getSante = () => assistantClient.get('/sante');

/** Les sources de données accessibles **à l'utilisateur courant**. */
export const getCatalogue = () => assistantClient.get('/catalogue');
