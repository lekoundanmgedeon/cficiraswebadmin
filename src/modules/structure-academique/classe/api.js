import { academiqueClient } from '@/core/api/clients';
import { createResource } from '@/core/api/createResource';

/** Endpoints des classes. */

const BASE_PATH = '/classes';

/** CRUD standard : list, getById, create, update, patch, remove. */
export const classesResource = createResource(academiqueClient, BASE_PATH);

/** Arborescence d'organisation des classes. */
export const getClassesOrganisationTree = () =>
  academiqueClient.get(`${BASE_PATH}/stats/organisations`);

/**
 * Indicateurs globaux d'infrastructure (tableau de bord).
 *
 * ⚠️ **Aucun écran ne l'appelle, et c'est délibéré.** `v_dashboard_global_classe`
 * somme `capacite_max` après une jointure sur `inscriptions` : chaque classe y
 * compte autant de fois qu'elle a d'inscrits. Relevé en base, **36 325 places
 * annoncées pour 5 400 réelles**, d'où des « places disponibles » et un taux
 * d'occupation faux. Seul `total_etudiants_inscrits` (un `COUNT(DISTINCT)`)
 * résiste. L'onglet « Statistiques » recompose ces quatre chiffres depuis
 * `v_organisation_classes`. À rebrancher le jour où la vue sera corrigée.
 */
export const getGlobalInfrastructureKPIs = () =>
  academiqueClient.get(`${BASE_PATH}/analytics/dashboard-global`);

/** @param {string|number} niveauId */
export const getClassesByNiveau = (niveauId) =>
  academiqueClient.get(`${BASE_PATH}/niveau/${niveauId}`);

/** @param {string|number} filiereId */
export const getClassesByFiliere = (filiereId) =>
  academiqueClient.get(`${BASE_PATH}/filiere/${filiereId}`);

/** Étudiants inscrits dans une classe. @param {string|number} id */
export const getClasseStudents = (id) => academiqueClient.get(`${BASE_PATH}/${id}/etudiants`);

/** Modules enseignés dans une classe. @param {string|number} id */
export const getClasseModules = (id) => academiqueClient.get(`${BASE_PATH}/${id}/modules`);

/** Rattache un module à une classe. @param {string|number} id @param {object} data */
export const assignModuleToClasse = (id, data) =>
  academiqueClient.post(`${BASE_PATH}/${id}/assigner-module`, data);

/** Taux de remplissage d'une classe. @param {string|number} id */
export const getClasseOccupancyRate = (id) =>
  academiqueClient.get(`${BASE_PATH}/${id}/taux-remplissage`);
