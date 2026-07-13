/** Constantes du module Étudiants. */

/** Identifiant DOM de la modale de création / édition. */
export const ETUDIANT_MODAL_ID = 'etudiantModal';

/** Identifiant DOM de la modale de génération de rapport. */
export const RAPPORT_MODAL_ID = 'etudiantRapportModal';

/** Longueurs maximales acceptées par le backend. */
export const LIMITS = {
  MATRICULE: 20,
  NOM: 100,
  PRENOM: 100,
  EMAIL: 150,
  TELEPHONE: 20,
};

/**
 * Sexes acceptés. Le backend renvoie le code brut (`M` / `F`) ; l'UI affiche le
 * libellé et l'icône associés.
 */
export const SEXES = [
  { code: 'M', label: 'Masculin', icon: 'mdi-gender-male' },
  { code: 'F', label: 'Féminin', icon: 'mdi-gender-female' },
];

/** @param {string} code @returns {string} */
export const sexeLabel = (code) => SEXES.find((sexe) => sexe.code === code)?.label ?? '—';

/** Extensions de fichier acceptées à l'import. */
export const IMPORT_ACCEPT = '.xlsx,.xls,.csv';
