import { academiqueClient } from '@/core/api/clients';
import { createResource } from '@/core/api/createResource';

/**
 * Endpoints des années académiques.
 *
 * Le CRUD est produit par `createResource` ; seuls les endpoints propres au
 * métier sont écrits à la main ci-dessous.
 */

const BASE_PATH = '/annees';

/** CRUD standard : list, getById, create, update, patch, remove. */
export const anneesResource = createResource(academiqueClient, BASE_PATH);

/** Historique des années, avec effectifs agrégés. */
export const getAnneesHistory = () => academiqueClient.get(`${BASE_PATH}/history`);

/** Année académique en cours. */
export const getCurrentAnnee = () => academiqueClient.get(`${BASE_PATH}/current`);

/** @param {string|number} id */
export const getAnneeStats = (id) => academiqueClient.get(`${BASE_PATH}/${id}/stats`);

/** @param {string|number} id */
export const exportAnneeData = (id) => academiqueClient.get(`${BASE_PATH}/${id}/export`);

/**
 * Active une année académique. Le backend désactive automatiquement l'année
 * précédemment active : une seule peut l'être à la fois.
 * @param {string|number} id
 */
export const activateAnnee = (id) => academiqueClient.patch(`${BASE_PATH}/${id}/activate`);
