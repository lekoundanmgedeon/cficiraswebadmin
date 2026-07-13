import { academiqueClient } from '@/core/api/clients';
import { createResource } from '@/core/api/createResource';

/** Endpoints des cycles académiques. */

const BASE_PATH = '/cycles';

/** CRUD standard : list, getById, create, update, patch, remove. */
export const cyclesResource = createResource(academiqueClient, BASE_PATH);

/** Filières rattachées à un cycle. @param {string|number} id */
export const getCycleFilieres = (id) => academiqueClient.get(`${BASE_PATH}/${id}/filieres`);

/** Arborescence cycles → filières. */
export const getCycleArchitecture = () => academiqueClient.get(`${BASE_PATH}/tree/filieres`);

/** Répartition des effectifs par cycle. */
export const getCycleDistributionStats = () =>
  academiqueClient.get(`${BASE_PATH}/stats/distribution`);

/** Vue d'organisation des cycles. */
export const getCycleOrganisation = () => academiqueClient.get(`${BASE_PATH}/stats/organisations`);
