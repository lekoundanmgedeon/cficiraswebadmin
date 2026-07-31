/** Constantes du module Bibliothèque. */

/** Identifiant DOM de la modale de création / édition d'un ouvrage. */
export const OUVRAGE_MODAL_ID = 'ouvrageModal';

/**
 * Types d'ouvrage.
 *
 * Relevés sur la contrainte `CHECK` de la table `ouvrages` — seule source qui
 * fasse foi : `type_ouvrage IN ('LIVRE','REVUE','THESE_EXTERNE','RAPPORT','NUMERIQUE')`.
 *
 * `THESE_EXTERNE` désigne une thèse **d'un autre établissement**, acquise comme
 * un livre. Les mémoires et thèses de la maison ne sont pas ici : ce sont des
 * travaux d'étudiants, servis par `GET /bibliotheque/memoires`.
 */
export const TYPES_OUVRAGE = [
  { code: 'LIVRE', label: 'Livre' },
  { code: 'REVUE', label: 'Revue' },
  { code: 'THESE_EXTERNE', label: 'Thèse externe' },
  { code: 'RAPPORT', label: 'Rapport' },
  { code: 'NUMERIQUE', label: 'Document numérique' },
];

/** @param {string} code */
export const typeOuvrageLabel = (code) =>
  TYPES_OUVRAGE.find((type) => type.code === code)?.label ?? code ?? '—';

/**
 * Disponibilité, telle que la vue `v_ouvrages_catalogue` la dérive des
 * compteurs. Elle n'est jamais stockée : une colonne se désynchroniserait du
 * compteur qu'elle prétend résumer.
 */
export const DISPONIBILITES = {
  DISPONIBLE: { code: 'DISPONIBLE', label: 'Disponible', variant: 'success' },
  PARTIEL: { code: 'PARTIEL', label: 'Partiellement sorti', variant: 'warning' },
  INDISPONIBLE: { code: 'INDISPONIBLE', label: 'Indisponible', variant: 'danger' },
};

/** @param {string} raw */
export const disponibiliteInfo = (raw) =>
  DISPONIBILITES[String(raw ?? '').toUpperCase()] ?? {
    code: 'INCONNU',
    label: raw || '—',
    variant: 'secondary',
  };

/** Types de travaux déposés, tels que `travaux_recherche.type_travail` les écrit. */
export const TYPES_TRAVAIL = [
  { code: 'MEMOIRE', label: 'Mémoire' },
  { code: 'THESE', label: 'Thèse' },
  { code: 'PROJET', label: 'Projet de fin d’études' },
  { code: 'RAPPORT_STAGE', label: 'Rapport de stage' },
];

/** @param {string} code */
export const typeTravailLabel = (code) =>
  TYPES_TRAVAIL.find((type) => type.code === code)?.label ?? code ?? '—';

/** Longueurs maximales acceptées par la base. */
export const LIMITS = {
  COTE: 30,
  TITRE: 255,
  AUTEUR: 255,
  EDITEUR: 150,
  ISBN: 20,
  CATEGORIE: 80,
};
