import { coordinationClient } from '@/core/api/clients';
import { createResource } from '@/core/api/createResource';

/**
 * Endpoints des soutenances, des jurys et des procès-verbaux.
 *
 * `soutenances` et `soutenance_jurys` **préexistaient en base** — dates, heures,
 * salle, rôles du jury — mais aucune route ne les exposait et aucun écran ne les
 * lisait. La migration `015` leur a ajouté le lien au mémoire, le statut et la
 * table des procès-verbaux.
 */

const BASE_PATH = '/soutenances';

/**
 * CRUD standard.
 *
 * `create()` accepte un tableau `jurys` : la soutenance et sa composition sont
 * enregistrées dans **une transaction** côté serveur. Un jury à moitié
 * enregistré ne vaut rien.
 */
export const soutenancesResource = createResource(coordinationClient, BASE_PATH);

/**
 * Le dossier complet : la soutenance, son jury, son procès-verbal.
 * `getById` de la ressource renvoie la même chose ; cet alias nomme l'intention.
 * @param {string} id
 */
export const getDossierSoutenance = (id) => coordinationClient.get(`${BASE_PATH}/${id}`);

/**
 * Remplace la composition du jury.
 *
 * Le serveur efface puis réinsère, en transaction : composer un jury est un
 * geste d'ensemble, pas une suite d'ajouts dont la moitié pourrait survivre.
 *
 * @param {string} id
 * @param {Array<{enseignant_id: string, role: string, ordre_participation?: number}>} jurys
 */
export const setJurys = (id, jurys) =>
  coordinationClient.put(`${BASE_PATH}/${id}/jurys`, { jurys });

/**
 * Crée ou met à jour le procès-verbal d'une soutenance.
 *
 * Une soutenance n'a **qu'un** PV (contrainte d'unicité) : rédiger en deux fois
 * ne produit pas deux documents concurrents. Le numéro officiel est posé par la
 * base à la création (`fn_numero_document`), et ne change jamais.
 *
 * @param {string} id
 * @param {{note_finale?: number, mention?: string, decision?: string, observations?: string, recommandations?: string}} data
 */
export const upsertProcesVerbal = (id, data) =>
  coordinationClient.put(`${BASE_PATH}/${id}/proces-verbal`, data);

/**
 * Valide le procès-verbal : il devient opposable, la soutenance passe à
 * « tenue » et le mémoire à « soutenu ».
 *
 * La base refuse un PV validé sans décision ni note (contrainte
 * `pv_validation_complete`) : ce n'est pas une vérification d'écran.
 *
 * @param {string} id
 */
export const validerProcesVerbal = (id) =>
  coordinationClient.patch(`${BASE_PATH}/${id}/proces-verbal/valider`);

/** Compteurs de l'écran : planifiées, tenues, à venir, sans PV. */
export const getStatistiquesSoutenances = () =>
  coordinationClient.get(`${BASE_PATH}/stats/synthese`);
