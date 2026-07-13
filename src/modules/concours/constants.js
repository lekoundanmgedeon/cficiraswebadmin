/** Constantes du module Concours. */

export const CONCOURS_MODAL_ID = 'concoursModal';
export const EPREUVE_MODAL_ID = 'epreuveConcoursModal';
export const CANDIDAT_MODAL_ID = 'candidatConcoursModal';
export const IMPORT_CANDIDATS_MODAL_ID = 'importCandidatsModal';
export const IMPORT_NOTES_MODAL_ID = 'importNotesConcoursModal';

/**
 * Statuts d'un concours.
 *
 * Relevés sur la contrainte `CHECK` de la table `concours` :
 * `statut IN ('PLANIFIE', 'OUVERT', 'CLOTURE', 'ANNULE')`.
 *
 * ⚠️ `TabDeliberation.vue` testait `statut === 'PROCLAMÉ'` pour savoir si les
 * résultats étaient publiés. **Ce statut n'existe pas** : la condition était
 * toujours fausse. La proclamation n'est d'ailleurs pas un statut de concours —
 * elle écrit dans `admissions_concours`.
 */
export const STATUTS_CONCOURS = {
  PLANIFIE: { code: 'PLANIFIE', label: 'Planifié', variant: 'secondary' },
  OUVERT: { code: 'OUVERT', label: 'Ouvert', variant: 'primary' },
  CLOTURE: { code: 'CLOTURE', label: 'Clôturé', variant: 'success' },
  ANNULE: { code: 'ANNULE', label: 'Annulé', variant: 'danger' },
};

export const STATUT_CONCOURS_LIST = Object.values(STATUTS_CONCOURS);

/** @param {string} raw @returns {{code: string, label: string, variant: string}} */
export function statutConcoursInfo(raw) {
  const code = String(raw ?? '')
    .trim()
    .toUpperCase();
  return (
    STATUTS_CONCOURS[code] ?? { code: 'INCONNU', label: raw || 'Inconnu', variant: 'secondary' }
  );
}

/**
 * Types de concours.
 *
 * `concours.type_concours` est une **clé étrangère** vers `types_concours(code)`.
 * La table en contient **sept** ; le formulaire n'en proposait que **quatre**
 * (`ENTREE`, `TEST`, `PASSERELLE`, `SPECIAL`). Les trois autres —
 * `CONCOURS_INGE`, `CONCOURS_MASTER`, `CONCOURS_LICENCE` — étaient inaccessibles,
 * alors qu'un concours existant les utilise : éditer le « Concours Ingénieur
 * 2025 » lui aurait fait perdre son type.
 *
 * ⚠️ Aucun endpoint n'expose `types_concours`. La liste est donc figée ici, à
 * l'image de la table. Un `GET /concours/types` la rendrait dynamique — voir
 * §2.5 du point de reprise.
 */
export const TYPES_CONCOURS = [
  { code: 'ENTREE', label: "Concours d'entrée" },
  { code: 'TEST', label: 'Test' },
  { code: 'PASSERELLE', label: 'Concours passerelle' },
  { code: 'SPECIAL', label: 'Concours spécial' },
  { code: 'CONCOURS_INGE', label: 'Concours Ingénieur' },
  { code: 'CONCOURS_MASTER', label: 'Concours Master' },
  { code: 'CONCOURS_LICENCE', label: 'Concours Licence' },
];

/**
 * Types d'épreuve.
 *
 * `CHECK (type_epreuve IN ('ECRIT', 'ORAL', 'PRATIQUE'))`.
 */
export const TYPES_EPREUVE = [
  { code: 'ECRIT', label: 'Écrit' },
  { code: 'ORAL', label: 'Oral' },
  { code: 'PRATIQUE', label: 'Pratique' },
];

/** @param {string} code @returns {string} */
export const typeEpreuveLabel = (code) =>
  TYPES_EPREUVE.find((type) => type.code === code)?.label ?? code ?? '—';

/** Sexes acceptés : `CHECK (sexe IN ('M', 'F'))`. */
export const SEXES = [
  { code: 'M', label: 'Masculin' },
  { code: 'F', label: 'Féminin' },
];

/** @param {string} code @returns {string} */
export const sexeLabel = (code) => SEXES.find((sexe) => sexe.code === code)?.label ?? '—';

/**
 * Règles de validation d'un candidat, portées par la **base** et non par le
 * contrôleur : une saisie non conforme remonterait en erreur SQL brute
 * (« violates check constraint »), illisible pour l'utilisateur.
 *
 * ```sql
 * CHECK (email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$')
 * CHECK (tel   ~  '^\+?[0-9]{10,15}$')
 * CHECK (datenais > '1900-01-01')
 * ```
 */
export const CANDIDAT_RULES = {
  EMAIL: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
  TELEPHONE: /^\+?[0-9]{10,15}$/,
  DATE_NAISSANCE_MIN: '1900-01-02',
};

/** Seuil d'admission par défaut, aligné sur celui du backend (`proclamerAdmissions`). */
export const SEUIL_ADMISSION_DEFAUT = 10;

/** Extensions acceptées par les imports. */
export const IMPORT_ACCEPT = '.xlsx,.xls,.csv';
