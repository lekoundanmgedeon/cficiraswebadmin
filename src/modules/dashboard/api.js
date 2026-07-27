import { academiqueClient, pedagogieClient } from '@/core/api/clients';

/**
 * Endpoints d'agrégation du tableau de bord.
 *
 * Aucun de ces endpoints n'est propre au dashboard : ce sont des vues
 * d'ensemble que le backend expose depuis toujours et qu'**aucun écran
 * n'appelait**. L'ancien `views/dashboard/` affichait à la place des chiffres
 * écrits en dur dans ses templates (« 37 050 000 FCFA », « 482 Inscrits »).
 *
 * ⚠️ Le domaine `/statistiques` n'existe pas : ses routes **et** son service ont
 * été supprimés du backend, et le code récupérable est mort (9 requêtes sur 11
 * échouent, écrites contre un schéma antérieur). Voir §2.1 de
 * `docs/ETAT-REFACTORISATION.md`. Le dashboard n'en dépend donc pas.
 *
 * Les agrégats financiers ne figurent pas ici : le module `finances` les expose
 * déjà (`modules/finances/stores/rapports.js`), et le dashboard réutilise ce
 * store plutôt que de le dupliquer — même montage que `notes → examens` (§1.11).
 */

/**
 * KPI d'infrastructure : classes, capacité, inscrits, places libres.
 *
 * Renvoie ses compteurs en **chaînes** (`"10"`, `"1610"`) — `pg` sert ainsi les
 * `COUNT`/`SUM`. La conversion se fait dans le store.
 */
export const getInfrastructureKpi = () =>
  academiqueClient.get('/classes/analytics/dashboard-global');

/** Effectif étudiant par cycle (`cycle_code`, `diplome`, `nb_etudiants`). */
export const getDistributionCycles = () => academiqueClient.get('/cycles/stats/distribution');

/** Filières avec effectif, capacité, taux de remplissage et responsable. */
export const getOrganisationFilieres = () => academiqueClient.get('/filieres/stats/organisations');

/**
 * Répertoire des formateurs (`vue_infos_enseignants`, migration backend `006`).
 * Sert au décompte de l'onglet Pédagogie.
 */
export const getEnseignants = () => pedagogieClient.get('/enseignant/enseignants');

/**
 * Attributions cours → formateur (migration backend `008`).
 *
 * ⚠️ Le segment est **doublé** — `/attribution/attributions` — parce que
 * `pedagogie.routes.js` monte le routeur sur `/attribution` alors que celui-ci
 * déclare déjà `/attributions`. C'est laid, mais c'est ce que le serveur expose ;
 * le chemin simple répond 404. Même piège que les notes (§1.11).
 */
export const getAttributions = () => pedagogieClient.get('/attribution/attributions');
