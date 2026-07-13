import { academiqueClient } from '@/core/api/clients';
import { createResource } from '@/core/api/createResource';

/**
 * Endpoints des niveaux.
 *
 * Les niveaux n'ont pas d'écran propre : ils sont administrés depuis les onglets
 * des filières et des semestres. Ils restent néanmoins un sous-domaine à part
 * entière, avec sa ressource et son store.
 */

const BASE_PATH = '/niveaux';

/** CRUD standard : list, getById, create, update, patch, remove. */
export const niveauxResource = createResource(academiqueClient, BASE_PATH);

/** Niveaux rattachés à une filière. @param {string|number} filiereId */
export const getNiveauxByFiliere = (filiereId) =>
  academiqueClient.get(`${BASE_PATH}/filiere/${filiereId}`);

/** Effectifs d'un niveau. @param {string|number} id */
export const getNiveauEffectifs = (id) => academiqueClient.get(`${BASE_PATH}/${id}/effectifs`);
