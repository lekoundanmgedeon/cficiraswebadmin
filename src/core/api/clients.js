import { createHttpClient } from './httpClient';

/**
 * Clients HTTP par domaine backend.
 *
 * Un seul client par préfixe : le mode « formulaire » de l'ancien
 * `apiClients.js` (`gestionFormApi`, `academiqueFormApi`) n'a plus lieu d'être,
 * l'intercepteur de requête retirant automatiquement le `Content-Type` sur les
 * `FormData`.
 */

export const authClient = createHttpClient('/auth');
export const academiqueClient = createHttpClient('/academique');
export const gestionClient = createHttpClient('/gestion');
export const pedagogieClient = createHttpClient('/pedagogies');
export const financeClient = createHttpClient('/finance');
export const evaluationClient = createHttpClient('/evaluations');
export const bibliothequeClient = createHttpClient('/bibliotheque');
export const coordinationClient = createHttpClient('/coordination');
export const documentClient = createHttpClient('/documents');

/**
 * Paramètres et comptes.
 *
 * Client sans préfixe : le module backend sert `/parametres` **et**
 * `/utilisateurs`, deux domaines distincts qu'aucun préfixe commun ne
 * décrirait honnêtement. Les chemins sont donc écrits en entier dans `api.js`.
 */
export const plateformeClient = createHttpClient('');
