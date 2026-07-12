/**
 * Constantes du module Année académique.
 *
 * Attention : le backend expose deux vocabulaires de statut distincts.
 *  - `/annees` et `/annees/{id}` renvoient  : OUVERTE | PLANIFIEE | CLOTUREE
 *  - `/annees/history` renvoie              : active | en_preparation | terminee | archivee
 *
 * Cet écart existe dans l'API, pas dans le frontend : on le documente et on
 * l'isole ici plutôt que de le laisser se propager dans les composants sous
 * forme de `switch` dupliqués. Il est signalé dans docs/13-points-a-confirmer.md
 * comme candidat à une harmonisation côté backend.
 */

/** Statuts renvoyés par les endpoints CRUD. */
export const STATUT = {
  PLANIFIEE: 'PLANIFIEE',
  OUVERTE: 'OUVERTE',
  CLOTUREE: 'CLOTUREE',
};

/** Options du sélecteur de statut dans le formulaire. */
export const STATUT_OPTIONS = [
  { value: STATUT.PLANIFIEE, label: 'Planifiée' },
  { value: STATUT.OUVERTE, label: 'Ouverte' },
  { value: STATUT.CLOTUREE, label: 'Clôturée' },
];

const STATUT_BADGES = {
  [STATUT.OUVERTE]: { label: 'Ouverte', class: 'badge bg-success' },
  [STATUT.PLANIFIEE]: { label: 'Planifiée', class: 'badge bg-warning text-dark' },
  [STATUT.CLOTUREE]: { label: 'Clôturée', class: 'badge bg-danger' },
};

/**
 * Libellé et classe CSS d'un statut CRUD.
 * @param {string} statut
 * @returns {{label: string, class: string}}
 */
export function mapStatut(statut) {
  return STATUT_BADGES[statut] ?? { label: statut || 'Inconnu', class: 'badge bg-secondary' };
}

/** Statuts renvoyés par l'endpoint `/history`. */
export const STATUT_HISTORIQUE = {
  ACTIVE: 'active',
  EN_PREPARATION: 'en_preparation',
  TERMINEE: 'terminee',
  ARCHIVEE: 'archivee',
};

const STATUT_HISTORIQUE_BADGES = {
  [STATUT_HISTORIQUE.ACTIVE]: { label: 'Active', class: 'badge bg-success text-white' },
  [STATUT_HISTORIQUE.EN_PREPARATION]: {
    label: 'En préparation',
    class: 'badge bg-warning text-dark',
  },
  [STATUT_HISTORIQUE.TERMINEE]: { label: 'Terminée', class: 'badge bg-secondary text-white' },
  [STATUT_HISTORIQUE.ARCHIVEE]: { label: 'Archivée', class: 'badge bg-info text-white' },
};

/**
 * Libellé et classe CSS d'un statut d'historique.
 * @param {string} statut
 * @returns {{label: string, class: string}}
 */
export function mapStatutHistorique(statut) {
  return (
    STATUT_HISTORIQUE_BADGES[statut] ?? { label: statut || 'Inconnu', class: 'badge bg-light' }
  );
}

/** Statuts considérés comme « en cours » dans le filtre de période. */
export const STATUTS_EN_COURS = [STATUT_HISTORIQUE.ACTIVE, STATUT_HISTORIQUE.EN_PREPARATION];

/** Statuts considérés comme « passés » dans le filtre de période. */
export const STATUTS_PASSES = [STATUT_HISTORIQUE.TERMINEE, STATUT_HISTORIQUE.ARCHIVEE];

/** Identifiant DOM de la modale de création/édition. */
export const ANNEE_MODAL_ID = 'anneeModal';
