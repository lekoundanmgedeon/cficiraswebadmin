import { coordinationClient } from '@/core/api/clients';
import { createResource } from '@/core/api/createResource';

/**
 * Endpoints des travaux de recherche (thèmes & mémoires).
 *
 * Le domaine `/api/coordination` a été créé avec ces écrans : les menus
 * `/themes-memoires`, `/soutenances` et `/statut` existaient dans `main` mais
 * ne pointaient vers rien. Voir la migration `015_coordination_academique.sql`.
 */

const BASE_PATH = '/travaux';

/**
 * CRUD standard.
 *
 * ⚠️ `create()` est **idempotent** sur le couple (étudiant, année) : le serveur
 * fait un `ON CONFLICT DO UPDATE`. Réattribuer un thème corrige l'attribution
 * au lieu d'échouer sur la contrainte d'unicité — c'est le geste de correction
 * qu'attend une scolarité.
 */
export const travauxResource = createResource(coordinationClient, BASE_PATH);

/**
 * Les étudiants en dernière année de leur cycle, sur l'année active, et l'état
 * de leurs travaux.
 *
 * La règle « finaliste » est déduite du cycle (`niveau.ordre =
 * cycle.duree_annees`) : elle vaut pour une licence de trois ans comme pour un
 * cycle d'ingénieur de cinq, sans liste de libellés à tenir à jour.
 *
 * @param {{situation?: string, avecTravail?: boolean, filiereId?: string}} [params]
 */
export const getFinalistes = (params) => coordinationClient.get('/finalistes', params);
