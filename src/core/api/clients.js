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
export const pedagogieClient = createHttpClient('/pedagogie');
export const financeClient = createHttpClient('/finance');
export const evaluationClient = createHttpClient('/evaluations');
