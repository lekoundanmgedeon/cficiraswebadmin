/**
 * Constantes du module Notes.
 *
 * Les constantes du **bulletin** (décision du jury, mention, publication) vivent
 * dans `@/modules/examens/bulletin/constants` — là où vivent son store et son
 * API. La délibération les importe de là ; l'inverse refermerait un cycle entre
 * les deux modules.
 */

/**
 * Statuts d'une note.
 *
 * `CHECK (statut IN ('SAISIE', 'VALIDEE', 'PUBLIEE'))`.
 */
export const STATUTS_NOTE = {
  SAISIE: { code: 'SAISIE', label: 'Saisie', variant: 'secondary' },
  VALIDEE: { code: 'VALIDEE', label: 'Validée', variant: 'primary' },
  PUBLIEE: { code: 'PUBLIEE', label: 'Publiée', variant: 'success' },
};

/** @param {string} raw @returns {{code: string, label: string, variant: string}} */
export function statutNoteInfo(raw) {
  const code = String(raw ?? '')
    .trim()
    .toUpperCase();
  return STATUTS_NOTE[code] ?? { code: 'INCONNU', label: raw || '—', variant: 'secondary' };
}

/** `CHECK (valeur >= 0.00 AND valeur <= 20.00)`. */
export const NOTE_BORNES = { MIN: 0, MAX: 20 };
