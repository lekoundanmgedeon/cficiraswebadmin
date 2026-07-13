/**
 * Constantes du bulletin — décision du jury, mention, publication.
 *
 * Elles vivent ici, avec le store et l'API du bulletin, et **non** dans
 * `modules/notes` : `notes` dépend déjà d'`examens` (la délibération réutilise
 * ce store). Les placer dans `notes` refermerait le cycle.
 */

/**
 * Décisions du jury sur un bulletin.
 *
 * `CHECK (decision IN ('EN_ATTENTE', 'VALIDE', 'AJOURNE', 'RATTRAPAGE'))` —
 * la liste que le contrôleur valide, mot pour mot.
 */
export const DECISIONS_JURY = {
  EN_ATTENTE: { code: 'EN_ATTENTE', label: 'En attente', variant: 'warning' },
  VALIDE: { code: 'VALIDE', label: 'Validé', variant: 'success' },
  AJOURNE: { code: 'AJOURNE', label: 'Ajourné', variant: 'danger' },
  RATTRAPAGE: { code: 'RATTRAPAGE', label: 'Rattrapage', variant: 'info' },
};

export const DECISION_LIST = Object.values(DECISIONS_JURY);

/** @param {string} raw @returns {{code: string, label: string, variant: string}} */
export function decisionInfo(raw) {
  const code = String(raw ?? '')
    .trim()
    .toUpperCase();
  return (
    DECISIONS_JURY[code] ?? { code: 'EN_ATTENTE', label: raw || 'En attente', variant: 'warning' }
  );
}

/**
 * Mentions.
 *
 * `CHECK (mention IN ('PASSABLE', 'ASSEZ_BIEN', 'BIEN', 'TRES_BIEN', 'EXCELLENT'))`.
 */
export const MENTIONS = {
  PASSABLE: { code: 'PASSABLE', label: 'Passable' },
  ASSEZ_BIEN: { code: 'ASSEZ_BIEN', label: 'Assez bien' },
  BIEN: { code: 'BIEN', label: 'Bien' },
  TRES_BIEN: { code: 'TRES_BIEN', label: 'Très bien' },
  EXCELLENT: { code: 'EXCELLENT', label: 'Excellent' },
};

/** @param {string} raw @returns {string} */
export const mentionLabel = (raw) => MENTIONS[String(raw ?? '').toUpperCase()]?.label ?? '—';

/**
 * Statuts de publication d'un bulletin.
 *
 * `CHECK (statut_publication IN ('BROUILLON', 'PUBLIE', 'VERROUILLE'))`.
 */
export const STATUTS_PUBLICATION = {
  BROUILLON: { code: 'BROUILLON', label: 'Brouillon', variant: 'secondary' },
  PUBLIE: { code: 'PUBLIE', label: 'Publié', variant: 'success' },
  VERROUILLE: { code: 'VERROUILLE', label: 'Verrouillé', variant: 'dark' },
};

/** @param {string} raw @returns {{code: string, label: string, variant: string}} */
export function publicationInfo(raw) {
  const code = String(raw ?? '')
    .trim()
    .toUpperCase();
  return (
    STATUTS_PUBLICATION[code] ?? {
      code: 'BROUILLON',
      label: raw || 'Brouillon',
      variant: 'secondary',
    }
  );
}
