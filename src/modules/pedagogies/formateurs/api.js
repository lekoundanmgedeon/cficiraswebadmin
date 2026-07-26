import { pedagogieClient } from '@/core/api/clients';
import { createResource } from '@/core/api/createResource';

/**
 * Endpoints du domaine « formateurs » (`/api/pedagogies`).
 *
 * ⚠️ Le client est monté sur `/pedagogies` (pluriel) — l'ancien code visait
 * `/pedagogie` (singulier), un préfixe qui n'existe pas : tous ses appels
 * répondaient 404. Les chemins ci-dessous sont ceux réellement exposés par
 * `routes/pedagogies/*.routes.js`, vérifiés en live contre `localhost:3500`.
 *
 * `enseignants` est une ressource REST à part entière (`/enseignant/enseignants`)
 * — d'où `createResource`. La liste et le détail complet passent par la vue
 * `vue_infos_enseignants` (migration 006), qui porte département, contrat et
 * spécialité en une ligne.
 */
export const enseignantsResource = createResource(pedagogieClient, '/enseignant/enseignants');

/** Détail complet d'un enseignant (vue enrichie, filtrée par id). */
export const getEnseignantFullDetails = (id) =>
  pedagogieClient.get(`/enseignant/enseignants/details/${id}`);

/** Ajoute un diplôme à un enseignant. */
export const addDiplome = (enseignantId, data) =>
  pedagogieClient.post(`/enseignant/enseignants/${enseignantId}/diplomes`, data);

/** Départements — pour le filtre du répertoire et le formulaire enseignant. */
export const getDepartements = () => pedagogieClient.get('/departement/departements');

/** @param {string} departementId */
export const getEnseignantsByDepartement = (departementId) =>
  pedagogieClient.get(`/departement/departements/${departementId}/enseignants`);

/** Contrats — types et rattachements. */
export const getContrats = () => pedagogieClient.get('/contrat/contrats');
