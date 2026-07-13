import { academiqueClient } from '@/core/api/clients';
import { createResource } from '@/core/api/createResource';

/** Endpoints des semestres. */

const BASE_PATH = '/semestres';

/** CRUD standard : list, getById, create, update, patch, remove. */
export const semestresResource = createResource(academiqueClient, BASE_PATH);

/** Semestres actuellement actifs. */
export const getActiveSemestres = () => academiqueClient.get(`${BASE_PATH}/courants/actifs`);

/** Semestres d'une année académique. @param {string|number} anneeId */
export const getSemestresByAnnee = (anneeId) =>
  academiqueClient.get(`${BASE_PATH}/annee/${anneeId}`);

/** Vue d'organisation des semestres. */
export const getSemestresOrganisation = () =>
  academiqueClient.get(`${BASE_PATH}/stats/organisations`);

/**
 * Tableau de bord analytique des semestres.
 *
 * La période était auparavant concaténée à la main dans l'URL. Elle passe
 * désormais par les `params` du client HTTP, qui se charge de l'encodage.
 *
 * @param {string} period
 */
export const getSemestreAnalytics = (period) =>
  academiqueClient.get(`${BASE_PATH}/analytics/dashboard`, { period });

/** Change le statut d'un semestre. @param {string|number} id @param {object} data */
export const changeSemestreStatus = (id, data) =>
  academiqueClient.patch(`${BASE_PATH}/${id}/statut`, data);
