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

/**
 * Vue d'organisation des cycles.
 *
 * ⚠️ **Aucun écran ne l'appelle, et c'est délibéré.** `v_organisation_cycles`
 * somme `classe.capacite_max` après une jointure sur `inscriptions` : la
 * capacité de chaque classe y est multipliée par son nombre d'inscrits (11 130
 * places annoncées pour 1 800 réelles), et `taux_remplissage` comme `statut` en
 * découlent. Les onglets « Organisation » et « Statistiques » recomposent ces
 * agrégats depuis `v_organisation_classes`, groupée par classe. À rebrancher le
 * jour où la vue sera corrigée côté base.
 */
export const getCycleOrganisation = () => academiqueClient.get(`${BASE_PATH}/stats/organisations`);
