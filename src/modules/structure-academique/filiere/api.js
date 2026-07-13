import { academiqueClient } from '@/core/api/clients';
import { createResource } from '@/core/api/createResource';

/** Endpoints des filières. */

const BASE_PATH = '/filieres';

/** CRUD standard : list, getById, create, update, patch, remove. */
export const filieresResource = createResource(academiqueClient, BASE_PATH);

/** Vue d'organisation des filières. */
export const getFiliereOrganisation = () =>
  academiqueClient.get(`${BASE_PATH}/stats/organisations`);

/** Filières rattachées à un cycle. @param {string|number} cycleId */
export const getFilieresByCycle = (cycleId) =>
  academiqueClient.get(`${BASE_PATH}/cycle/${cycleId}`);

/** Statistiques d'une filière. @param {string|number} id */
export const getFiliereStats = (id) => academiqueClient.get(`${BASE_PATH}/${id}/stats`);
