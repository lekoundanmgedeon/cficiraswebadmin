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
 * Le `titre` est la première question du fil — le backend n'en fait pas générer
 * un par le modèle.
 */
export const getConversations = (limite = 20) => assistantClient.get('/conversations', { limite });

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
