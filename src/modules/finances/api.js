import { financeClient } from '@/core/api/clients';
import { createResource } from '@/core/api/createResource';

/**
 * Endpoints du module Finances (`/api/finance`).
 *
 * L'ancien `api/finances/financeApi.js` déclarait un CRUD générique sur
 * `/finances`, `/factures` et `/frais_inscription` : **aucun de ces endpoints
 * n'existait côté serveur**. Le module finance du backend n'était même pas monté
 * (`/finance` était commenté dans `index.routes.js`). Les écrans ne s'en
 * apercevaient pas : ils affichaient des tableaux codés en dur et ne
 * déclenchaient aucun appel.
 *
 * Le domaine est authentifié de bout en bout, et les écritures sont réservées
 * aux rôles `ADMIN` et `FINANCES` : une 403 sur un encaissement n'est pas un bug,
 * c'est un défaut d'habilitation.
 *
 * Voir la documentation du contrat : `cfibackend/docs/finances.md`.
 */

// ── Plans de paiement ────────────────────────────────────────────────────────

/** CRUD des gabarits d'échéancier (ANNUEL, SEMESTRIEL, MENSUEL, TRANCHES). */
export const plansResource = createResource(financeClient, '/plans');

/**
 * Rattache un plan à une classe pour une année (plan proposé par défaut).
 * @param {string} planId
 * @param {{classe_id: string, annee_academique_id: string, par_defaut?: boolean}} data
 */
export const associerPlanClasse = (planId, data) =>
  financeClient.post(`/plans/${planId}/classes`, data);

// ── Échéanciers ──────────────────────────────────────────────────────────────

/**
 * Génère l'échéancier d'une inscription à partir d'un plan.
 *
 * Le serveur refuse la régénération si des paiements y sont déjà imputés (400) :
 * la reconstruire effacerait leur lettrage.
 *
 * @param {{inscription_id: string, plan_id: string}} data
 */
export const genererEcheancier = (data) => financeClient.post('/echeanciers', data);

/** @param {string} inscriptionId */
export const getEcheancierInscription = (inscriptionId) =>
  financeClient.get(`/echeanciers/inscription/${inscriptionId}`);

/** @param {string} etudiantId */
export const getEcheancierEtudiant = (etudiantId) =>
  financeClient.get(`/echeanciers/etudiant/${etudiantId}`);

/**
 * Suivi des traites, tous étudiants confondus.
 * @param {{statut?: string, classe_id?: string, filiere_id?: string, en_retard?: boolean}} [params]
 */
export const getSuiviTraites = (params) => financeClient.get('/echeanciers/suivi', params);

// ── Factures ─────────────────────────────────────────────────────────────────

/**
 * `list(params)` accepte `statut` (les libellés affichés : Payé, Partiel,
 * Impayé), `recherche` (nom, matricule ou n° de facture), `classe_id` et
 * `annee_id`.
 *
 * `create({ inscription_id })` renvoie 409 si une facture active existe déjà.
 * Il n'y a pas d'`update` : une facture ne se modifie pas, elle s'annule.
 */
export const facturesResource = createResource(financeClient, '/factures');

/** @param {string} etudiantId */
export const getFacturesEtudiant = (etudiantId) =>
  financeClient.get(`/factures/etudiant/${etudiantId}`);

/**
 * Factures non soldées. `meta.total_impaye` porte la somme des soldes.
 * @param {{annee_id?: string}} [params]
 */
export const getFacturesImpayees = (params) => financeClient.get('/factures/etat/impayees', params);

/**
 * Facture toutes les inscriptions non encore facturées d'une classe.
 *
 * Une réponse vide n'est **pas** un échec : elle signifie que la classe est déjà
 * entièrement facturée.
 *
 * @param {{classe_id: string, annee_academique_id: string}} data
 */
export const genererFacturesClasse = (data) =>
  financeClient.post('/factures/generation-auto', data);

/** @param {string} id @param {string} [motif] */
export const annulerFacture = (id, motif) =>
  financeClient.patch(`/factures/${id}/annuler`, { motif });

// ── Paiements ────────────────────────────────────────────────────────────────

/**
 * `list(params)` accepte `cycle`, `filiere_id`, `classe_id`, `mois` (`YYYY-MM`),
 * `mode`, `statut` et `recherche`.
 *
 * `create(data)` encaisse un versement : voir `enregistrerPaiement`.
 */
export const paiementsResource = createResource(financeClient, '/paiements');

/**
 * Encaisse un paiement.
 *
 * Le serveur impute le versement sur les échéances impayées les plus anciennes
 * (FIFO) — il peut en solder plusieurs, ou n'en solder qu'une partie — puis émet
 * le reçu dans la même transaction. La réponse porte `recu`, `allocations` et
 * `montant_non_impute` (le trop-perçu, qui reste en avance).
 *
 * `nature_paiement` est facultatif : le serveur le déduit du plan de l'étudiant.
 * Le guichet saisit un montant et un mode, pas une taxonomie.
 *
 * @param {{
 *   inscription_id: string,
 *   montant: number,
 *   mode_paiement: string,
 *   nature_paiement?: string|null,
 *   reference_transaction?: string|null,
 *   periode_concernee?: string|null,
 *   observations?: string|null,
 *   frais_annexe_id?: string|null,
 *   date_paiement?: string|null,
 * }} data
 */
export const enregistrerPaiement = (data) => financeClient.post('/paiements', data);

/** @param {string} etudiantId */
export const getPaiementsEtudiant = (etudiantId) =>
  financeClient.get(`/paiements/etudiant/${etudiantId}`);

/** @param {string} id */
export const getRecu = (id) => financeClient.get(`/paiements/${id}/recu`);

/**
 * Annule un paiement : il passe à `ECHOUE` et **son imputation est défaite**,
 * ce qui rouvre les échéances qu'il soldait.
 *
 * @param {string} id @param {string} [motif]
 */
export const annulerPaiement = (id, motif) =>
  financeClient.patch(`/paiements/${id}/annuler`, { motif });

// ── Rapports ─────────────────────────────────────────────────────────────────

/**
 * KPI macro : engagé, encaissé, reste, taux de recouvrement.
 *
 * Sans `annee_id`, le serveur rend l'année active. Avec, il rend un exercice
 * passé — ce dont l'écran « Archives » a besoin.
 *
 * @param {{annee_id?: string}} [params]
 */
export const getKpi = (params) => financeClient.get('/rapports/kpi', params);

/** Balance par filière : `{ filiere, attendu, percu, reste, taux, nb_etudiants }`. */
export const getBilanFilieres = () => financeClient.get('/rapports/bilan-filieres');

/**
 * Balance par classe, avec l'effectif : `{ classe, filiere, effectif, attendu, percu, reste, taux }`.
 * @param {{annee_id?: string}} [params]
 */
export const getBilanClasses = (params) => financeClient.get('/rapports/bilan-classes', params);

/** @param {{nb_mois?: number, annee_id?: string}} [params] */
export const getEncaissementsMensuels = (params) =>
  financeClient.get('/rapports/encaissements-mensuels', params);

/** Répartition des encaissements par mode de paiement. */
export const getRepartitionModes = (params) =>
  financeClient.get('/rapports/repartition-modes', params);

/** Situation financière d'un étudiant : une ligne par inscription. */
export const getSituationEtudiant = (etudiantId) =>
  financeClient.get(`/rapports/situation/${etudiantId}`);

/**
 * Dossier financier complet d'une inscription : le dû ventilé, le taux de
 * règlement, l'`echeancier[]` et les `paiements[]`, en un seul appel.
 *
 * @param {string} inscriptionId
 */
export const getDossierInscription = (inscriptionId) =>
  financeClient.get(`/rapports/dossier/${inscriptionId}`);
