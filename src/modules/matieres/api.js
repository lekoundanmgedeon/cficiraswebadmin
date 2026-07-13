import { academiqueClient } from '@/core/api/clients';
import { createResource } from '@/core/api/createResource';

/** Endpoints des modules d'enseignement. */

const BASE_PATH = '/modules';

/**
 * CRUD standard : `list`, `getById`, `create`, `update`, `remove`.
 *
 * `GET /modules` **n'existait pas** au moment de la migration : la route
 * répondait 404, et aucun écran ne pouvait donc lister les modules — alors même
 * que la table en contenait six. Elle a été ajoutée côté backend, en même temps
 * que la réparation de `POST` (erreur SQL 42702 à chaque appel) et de `PUT`
 * (écrivait dans une colonne `credits` inexistante).
 */
export const modulesResource = createResource(academiqueClient, BASE_PATH);

/**
 * Les couples (semestre, classe) configurés, sur lesquels des UE peuvent être
 * rattachées.
 */
export const getSemestresConfiguration = () =>
  academiqueClient.get(`${BASE_PATH}/configuration/semestres`);

/**
 * Les UE rattachées à un couple (semestre, classe).
 *
 * Les **deux** paramètres sont obligatoires : le contrôleur répond 400 s'il en
 * manque un. Ce n'est donc pas un annuaire de modules, mais la composition
 * pédagogique d'une classe pour un semestre.
 *
 * @param {string} semestreId @param {string} classeId
 */
export const getUesByConfiguration = (semestreId, classeId) =>
  academiqueClient.get(`${BASE_PATH}/configuration/details`, { semestreId, classeId });

/**
 * Détache une UE d'une configuration.
 * @param {string} attributionId Identifiant du lien `ModuleClasse`, pas du module.
 */
export const detachUeFromConfig = (attributionId) =>
  academiqueClient.delete(`${BASE_PATH}/configuration/detacher/${attributionId}`);

/**
 * Assigne un module à une classe pour un semestre.
 *
 * ⚠️ Répond **HTTP 200 même en cas d'échec métier** : le verdict réel est dans
 * `data.statut`. Passer la réponse à `readAssignationResult()` (voir
 * `constants.js`) plutôt que de se fier au code HTTP.
 *
 * Les entités sont désignées par leur **code**, pas par leur identifiant.
 *
 * @param {{codeModule: string, codeClasse: string, codeSemestre: string, codeEnseignant?: string|null}} data
 */
export const assignModuleToClasse = (data) => academiqueClient.post(`${BASE_PATH}/assigner`, data);
