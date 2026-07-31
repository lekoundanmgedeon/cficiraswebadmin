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

/**
 * Colonnes de l'import de tuteurs légaux.
 *
 * `columns` reprend le contrat d'en-têtes exigé par le serveur
 * (`services/tuteur.service.js` → `requiredHeaders`) : ces dix colonnes doivent
 * **exister**, sinon le fichier est refusé en bloc. `tel2` est accepté en plus,
 * sans être exigé.
 *
 * `required` est plus court : seules ces cinq valeurs doivent être renseignées
 * sur chaque ligne. Une colonne peut donc être présente et vide.
 *
 * Le tuteur se rattache à l'étudiant par son **matricule** : il n'y a pas
 * d'année académique ici, contrairement à l'import d'étudiants.
 */
export const IMPORT_TUTEURS_SCHEMA = {
  columns: [
    'matricule_etudiant',
    'nom',
    'prenom',
    'tel1',
    'tel2',
    'email',
    'nationalite',
    'adresse',
    'ville',
    'lien_parente',
    'est_contact_principal',
  ],
  required: ['matricule_etudiant', 'nom', 'prenom', 'tel1', 'lien_parente'],
  booleans: ['est_contact_principal'],
  example: {
    matricule_etudiant: 'ETU-2024-0001',
    nom: 'DIOP',
    prenom: 'Moussa',
    tel1: '+221770000000',
    tel2: '',
    email: 'moussa.diop@exemple.com',
    // `nationalite` est un code ISO sur **deux** lettres côté base
    // (`character(2)`) : « CG », pas « CONGOLAISE ».
    nationalite: 'CG',
    adresse: '12 rue de la Paix',
    ville: 'Brazzaville',
    lien_parente: 'PERE',
    est_contact_principal: 'oui',
  },
};

/** Liens de parenté proposés en légende du gabarit. */
export const LIENS_PARENTE = ['PERE', 'MERE', 'ONCLE', 'TANTE', 'FRERE', 'SOEUR', 'TUTEUR'];
