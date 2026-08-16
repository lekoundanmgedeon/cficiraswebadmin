/** Constantes du module Inscriptions. */

import { formatMontant } from '@/shared/utils/parametres';

export const IMPORT_INSCRIPTIONS_MODAL_ID = 'importInscriptionsModal';
export const IMPORT_REINSCRIPTIONS_MODAL_ID = 'importReinscriptionsModal';
export const PAIEMENT_MODAL_ID = 'paiementInscriptionModal';
export const CLASSE_ETUDIANTS_MODAL_ID = 'classeEtudiantsModal';

/**
 * Statuts d'inscription.
 *
 * La liste est celle que le backend accepte en écriture
 * (`inscription.controller.js` → `statutsValides`). L'annulation d'un dossier
 * passe par `REJETEE` (refus à la validation) ou `ABANDON` (départ en cours
 * d'année) : il n'y a pas de suppression, `DELETE /inscriptions/:id` n'existe pas.
 */
export const STATUTS = {
  EN_ATTENTE: { code: 'EN_ATTENTE', label: 'En attente', variant: 'warning' },
  VALIDEE: { code: 'VALIDEE', label: 'Validée', variant: 'success' },
  ACTIVE: { code: 'ACTIVE', label: 'Active', variant: 'success' },
  REJETEE: { code: 'REJETEE', label: 'Rejetée', variant: 'danger' },
  ABANDON: { code: 'ABANDON', label: 'Abandon', variant: 'danger' },
  DIPLOME: { code: 'DIPLOME', label: 'Diplômé', variant: 'info' },
  EXCLU: { code: 'EXCLU', label: 'Exclu', variant: 'danger' },
};

/** Statuts proposés dans les filtres, dans l'ordre du cycle de vie. */
export const STATUT_LIST = Object.values(STATUTS);

/**
 * Alias de lecture.
 *
 * `GET /inscriptions/finances` ne se contente pas de renommer les statuts en
 * français minuscule — il en **traduit un**. Vérifié en croisant les deux
 * endpoints sur les mêmes identifiants :
 *
 * ```
 * /inscriptions          /inscriptions/finances
 * EN_ATTENTE      →      "en attente"
 * VALIDEE         →      "validée"
 * ACTIVE          →      "active"
 * REJETEE         →      "annulée"     ← et non « rejetée »
 * ```
 *
 * Sans cet alias, un dossier rejeté s'affichait « Inconnu » dans l'onglet Frais
 * et paiements, et le filtre correspondant ne le remontait jamais.
 */
const ALIASES = {
  ANNULEE: 'REJETEE',
};

/**
 * Ramène un statut à son code canonique.
 *
 * Deux endpoints, deux vocabulaires : `GET /inscriptions` renvoie `EN_ATTENTE`,
 * tandis que `GET /inscriptions/finances` renvoie `"en attente"`. L'ancien code
 * absorbait l'écart par des `includes('VALI')` disséminés dans quatre
 * composants, chacun avec ses propres cas. La normalisation se fait ici, une
 * fois.
 *
 * @param {string|null|undefined} raw
 * @returns {string|null} Code canonique, ou `null` si le statut est inconnu.
 */
export function normalizeStatut(raw) {
  if (!raw) return null;

  const key = String(raw)
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '_')
    // « Validée », « Rejetée », « Diplômé » : on retire les accents pour que la
    // variante française minuscule des finances retombe sur le code majuscule.
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  const canonical = ALIASES[key] ?? key;

  return STATUTS[canonical]?.code ?? null;
}

/** @param {string} raw @returns {{code: string, label: string, variant: string}} */
export function statutInfo(raw) {
  const code = normalizeStatut(raw);
  return STATUTS[code] ?? { code: 'INCONNU', label: raw || 'Inconnu', variant: 'secondary' };
}

/**
 * Types d'inscription.
 *
 * La colonne `inscriptions.type_inscription` porte une contrainte CHECK qui
 * n'accepte que ces trois codes — le champ qualifie la **nature du passage**
 * (entrée normale, redoublement, transfert), et non l'opposition première
 * inscription / réinscription. Envoyer `REINSCRIPTION` faisait échouer la
 * création en `23514`, que le backend remontait en 500 générique.
 */
export const TYPES_INSCRIPTION = [
  { code: 'NOUVEAU', label: 'Nouveau' },
  { code: 'REDOUBLANT', label: 'Redoublant' },
  { code: 'TRANSFERT', label: 'Transfert' },
];

/** Valeur par défaut côté base (`DEFAULT 'NOUVEAU'`). */
export const TYPE_INSCRIPTION_DEFAUT = 'NOUVEAU';

/**
 * Libellé lisible d'un type d'inscription.
 *
 * Un type inconnu est rendu tel quel plutôt que masqué : la donnée existe en
 * base, la cacher tromperait plus que l'afficher brute.
 *
 * @param {string|null|undefined} raw
 * @returns {string}
 */
export function typeInscriptionLabel(raw) {
  if (!raw) return '';
  const code = String(raw).trim().toUpperCase();
  return TYPES_INSCRIPTION.find((type) => type.code === code)?.label ?? raw;
}

/** Statuts qu'un dossier peut prendre depuis « en attente ». */
export const DECISIONS = [
  { code: 'VALIDEE', label: "Valider l'inscription", variant: 'success' },
  { code: 'REJETEE', label: 'Rejeter le dossier', variant: 'danger' },
];

/** Extensions acceptées par les imports. */
export const IMPORT_ACCEPT = '.xlsx,.xls,.csv';

/**
 * Colonnes attendues par chaque import, et ligne d'exemple du gabarit.
 * Servent à la fois à la validation cliente et à la génération du modèle Excel.
 */
export const IMPORT_SCHEMAS = {
  inscriptions: {
    columns: [
      'nom',
      'prenom',
      'sexe',
      'date_naissance',
      'lieu_naissance',
      'telephone',
      'email',
      'ville',
      'code_filiere',
      'code_classe',
    ],
    required: ['nom', 'prenom', 'email', 'code_filiere', 'code_classe'],
    example: {
      nom: 'DIOP',
      prenom: 'Awa',
      sexe: 'F',
      date_naissance: '2003-05-15',
      lieu_naissance: 'Dakar',
      telephone: '+221770000000',
      email: 'awa.diop@exemple.com',
      ville: 'Dakar',
      code_filiere: 'GI',
      code_classe: 'GI-L1',
    },
  },
  reinscriptions: {
    columns: ['matricule', 'code_filiere', 'code_classe'],
    required: ['matricule', 'code_filiere', 'code_classe'],
    example: {
      matricule: 'ETU-2024-0001',
      code_filiere: 'GI',
      code_classe: 'GI-L2',
    },
  },
};

/**
 * Formate un montant avec la devise réglée.
 *
 * Le symbole vient du paramètre `finances.devise_symbole` et non plus d'un
 * « FCFA » écrit en dur. Le repli est « FCFA » : les tests qui l'attendent
 * restent donc justes tant que l'établissement ne change pas de devise.
 *
 * @param {number|string|null|undefined} amount @returns {string}
 */
export function formatMoney(amount) {
  return formatMontant(amount);
}
