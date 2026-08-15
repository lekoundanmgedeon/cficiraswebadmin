/** Constantes du module Examens. */

export const SESSION_MODAL_ID = 'sessionExamenModal';
export const EPREUVE_MODAL_ID = 'epreuveExamenModal';
export const SALLE_MODAL_ID = 'salleExamenModal';
export const PLANNING_IMPORT_MODAL_ID = 'planningImportModal';

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
 * Schéma du fichier d'import d'un planning d'épreuves.
 *
 * Les colonnes désignent le module et la session par leur **code**, jamais par
 * leur identifiant : personne ne saisit un UUID dans un classeur. La résolution
 * code → identifiant se fait à l'envoi, ligne par ligne, et une correspondance
 * introuvable devient un rejet motivé plutôt qu'un 400 opaque.
 *
 * `date_prevue` est la seule colonne facultative : c'est la seule colonne
 * nullable de la table `evaluations`.
 */
export const IMPORT_PLANNING_SCHEMA = {
  columns: [
    'code_session',
    'code_module',
    'type_eval',
    'designation',
    'ponderation',
    'date_prevue',
  ],
  required: ['code_session', 'code_module', 'type_eval', 'designation', 'ponderation'],
  example: {
    code_session: 'SN-2025-S1',
    code_module: 'INF101',
    type_eval: 'EXAMEN',
    designation: 'Examen final — Algorithmique',
    ponderation: 60,
    date_prevue: '2026-01-15',
  },
  /**
   * Les deux contraintes `CHECK` de la table, vérifiées avant l'envoi : sans
   * cela, elles remontent en erreur SQL brute, illisible pour l'opérateur.
   * @param {Record<string, any>} row
   */
  validate(row) {
    const erreurs = [];

    const type = String(row.type_eval ?? '')
      .trim()
      .toUpperCase();
    if (type && !TYPES_EPREUVE.some((item) => item.code === type)) {
      erreurs.push(
        `type_eval « ${row.type_eval} » inconnu (attendu : ${TYPES_EPREUVE.map((item) => item.code).join(', ')})`
      );
    }

    const ponderation = Number(row.ponderation);
    if (row.ponderation !== '' && row.ponderation != null) {
      if (Number.isNaN(ponderation) || ponderation <= 0 || ponderation > PONDERATION.MAX) {
        erreurs.push(`ponderation hors bornes (attendu : > 0 et ≤ ${PONDERATION.MAX})`);
      }
    }

    if (row.date_prevue && dateISO(row.date_prevue) === null) {
      erreurs.push('date_prevue illisible (attendu : AAAA-MM-JJ ou JJ/MM/AAAA)');
    }

    return erreurs;
  },
};

/**
 * Normalise une date de classeur en `AAAA-MM-JJ`.
 *
 * SheetJS est lu avec `cellDates: true` : une cellule au format date arrive en
 * objet `Date`, une cellule texte en chaîne. Les deux doivent aboutir au même
 * format, celui qu'attend la colonne `date_prevue`.
 *
 * ⚠️ **`new Date(chaîne)` ne peut pas servir ici.** Son analyse de repli est
 * bien trop permissive dans un sens et trop stricte dans l'autre — relevé sur
 * Node 24 :
 *
 * | Saisie         | `new Date(…)`  |
 * | -------------- | -------------- |
 * | `15 janvier`   | **2001-01-15** |
 * | `15/01/2026`   | **Invalid**    |
 *
 * Un libellé français serait donc enregistré comme une date de 2001, en
 * silence, tandis que la notation JJ/MM/AAAA — la plus naturelle pour qui
 * saisit le fichier — serait rejetée. Les deux formats acceptés sont donc lus
 * par motif, et leurs composantes vérifiées : le 31/02 n'est pas une date.
 *
 * @param {any} valeur
 * @returns {string|null} `null` si la valeur est absente ou illisible.
 */
export function dateISO(valeur) {
  if (!valeur) return null;

  if (valeur instanceof Date) {
    if (Number.isNaN(valeur.getTime())) return null;
    // Composantes **locales** : `toISOString()` bascule d'un jour sur les
    // fuseaux négatifs, et une date d'examen ne se décale pas.
    return composerISO(valeur.getFullYear(), valeur.getMonth() + 1, valeur.getDate());
  }

  const texte = String(valeur).trim();

  const iso = texte.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return composerISO(Number(iso[1]), Number(iso[2]), Number(iso[3]));

  const fr = texte.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  if (fr) return composerISO(Number(fr[3]), Number(fr[2]), Number(fr[1]));

  return null;
}

/**
 * Assemble `AAAA-MM-JJ` après avoir vérifié que le triplet désigne un jour qui
 * existe — un 31 avril repasserait sinon au 1ᵉʳ mai sans rien dire.
 * @param {number} annee @param {number} mois @param {number} jour
 * @returns {string|null}
 */
function composerISO(annee, mois, jour) {
  const date = new Date(annee, mois - 1, jour);
  const reel =
    date.getFullYear() === annee && date.getMonth() === mois - 1 && date.getDate() === jour;

  if (!reel) return null;

  return `${String(annee).padStart(4, '0')}-${String(mois).padStart(2, '0')}-${String(jour).padStart(2, '0')}`;
}

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
