/** Constantes du module Examens. */

export const SESSION_MODAL_ID = 'sessionExamenModal';
export const EPREUVE_MODAL_ID = 'epreuveExamenModal';
export const SALLE_MODAL_ID = 'salleExamenModal';

/**
 * Types de session d'évaluation.
 *
 * Deux seulement, et le frontend n'en connaissait pas d'autres non plus.
 */
export const TYPES_SESSION = [
  { code: 'NORMALE', label: 'Normal' },
  { code: 'RATTRAPAGE', label: 'Rattrapage' },
];

/**
 * États d'une session — la machine à états du backend.
 *
 * Relevés dans `sessionEvaluation.controller.js` :
 * `if (!['INACTIVE', 'ACTIVE', 'ARCHIVE'].includes(etat))` → 400.
 */
export const ETATS_SESSION = {
  INACTIVE: { code: 'INACTIVE', label: 'Inactive', variant: 'secondary' },
  ACTIVE: { code: 'ACTIVE', label: 'Active', variant: 'primary' },
  ARCHIVE: { code: 'ARCHIVE', label: 'Archivée', variant: 'dark' },
};

export const ETAT_SESSION_LIST = Object.values(ETATS_SESSION);

/**
 * @param {string} raw
 * @returns {{code: string, label: string, variant: string}}
 */
export function etatSessionInfo(raw) {
  const code = String(raw ?? '')
    .trim()
    .toUpperCase();
  return ETATS_SESSION[code] ?? { code: 'INCONNU', label: raw || 'Inconnu', variant: 'secondary' };
}

/**
 * Types d'épreuve.
 *
 * Relevés sur la contrainte `CHECK` de la table `evaluations` — seule source qui
 * fasse foi, aucune migration n'étant versionnée :
 *
 * ```sql
 * CHECK (type_eval IN ('CC', 'TP', 'EXAMEN', 'PROJET'))
 * ```
 *
 * L'ancien `PlanExamen.vue` en proposait trois **autres** — `CC`, `NORMAL`,
 * `RATTRAPAGE` : seul le premier existait. `NORMAL` et `RATTRAPAGE` sont des
 * types de *session*, pas d'épreuve ; les enregistrer aurait violé la contrainte.
 */
export const TYPES_EPREUVE = [
  { code: 'EXAMEN', label: 'Examen' },
  { code: 'CC', label: 'Contrôle continu' },
  { code: 'TP', label: 'Travaux pratiques' },
  { code: 'PROJET', label: 'Projet' },
];

/** @param {string} code @returns {string} */
export const typeEpreuveLabel = (code) =>
  TYPES_EPREUVE.find((type) => type.code === code)?.label ?? code ?? '—';

/**
 * Bornes de la pondération.
 *
 * `CHECK (ponderation > 0.00 AND ponderation <= 100.00)` — une pondération
 * nulle ou supérieure à 100 remonte en erreur SQL brute si on ne la filtre pas
 * en amont.
 */
export const PONDERATION = { MIN: 0.01, MAX: 100 };

/**
 * Types de salle.
 *
 * Contrainte `CHECK` de la table `salles` :
 * `type IN ('Amphi', 'Cours', 'TD', 'TP', 'Labo')`.
 */
export const TYPES_SALLE = ['Amphi', 'Cours', 'TD', 'TP', 'Labo'];

/**
 * Extrait le numéro d'un code de semestre.
 *
 * Gère « S1 », « S2 », « SEM-3 », « Semestre 5 »… Sert au filtrage
 * pairs / impairs de l'écran de planification.
 *
 * @param {string} code
 * @returns {number|null}
 */
export function numeroSemestre(code) {
  if (!code) return null;
  const match = String(code).match(/\d+/);
  return match ? parseInt(match[0], 10) : null;
}
