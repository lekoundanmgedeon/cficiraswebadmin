/** Constantes du module Finances. */

import { formatMontant } from '@/shared/utils/parametres';

export const PAIEMENT_MODAL_ID = 'financePaiementModal';
export const RECU_MODAL_ID = 'financeRecuModal';
export const FACTURE_MODAL_ID = 'financeFactureModal';
export const PLAN_MODAL_ID = 'financePlanModal';
export const ECHEANCIER_MODAL_ID = 'financeEcheancierModal';
export const GENERATION_AUTO_MODAL_ID = 'financeGenerationAutoModal';

/**
 * Modes de paiement.
 *
 * Ce sont les valeurs que la contrainte `paiements_all_mode_paiement_check`
 * accepte. La maquette proposait « Wave / Orange Money » dans un même choix et
 * « Espèces » en toutes lettres ; le serveur attend un code. Les deux sont donc
 * distingués ici : `code` part sur le réseau, `label` s'affiche.
 */
export const MODES_PAIEMENT = [
  { code: 'ESPECE', label: 'Espèces', icon: 'mdi-cash' },
  { code: 'WAVE', label: 'Wave', icon: 'mdi-cellphone' },
  { code: 'ORANGE_MONEY', label: 'Orange Money', icon: 'mdi-cellphone' },
  { code: 'MOBILE_MONEY', label: 'Mobile Money (autre)', icon: 'mdi-cellphone' },
  { code: 'VIREMENT', label: 'Virement bancaire', icon: 'mdi-bank' },
  { code: 'CHEQUE', label: 'Chèque', icon: 'mdi-checkbook' },
  { code: 'CARTE_BANCAIRE', label: 'Carte bancaire', icon: 'mdi-credit-card-outline' },
  { code: 'BOURSE', label: 'Bourse', icon: 'mdi-school-outline' },
];

/**
 * Natures de paiement.
 *
 * Facultatif à la saisie : le serveur la déduit du plan de l'étudiant lorsqu'elle
 * n'est pas fournie. On ne la propose donc que pour les cas où le guichet veut
 * l'imposer.
 */
export const NATURES_PAIEMENT = [
  { code: 'INSCRIPTION', label: 'Frais d’inscription' },
  { code: 'SCOLARITE_ANNUELLE', label: 'Scolarité (annuelle)' },
  { code: 'SCOLARITE_SEMESTRIELLE', label: 'Scolarité (semestrielle)' },
  { code: 'SCOLARITE_MENSUELLE', label: 'Scolarité (mensuelle)' },
  { code: 'SCOLARITE_TRANCHE', label: 'Scolarité (tranche)' },
  { code: 'FRAIS_EXAMEN', label: 'Frais d’examen' },
  { code: 'FRAIS_ANNEXE', label: 'Frais annexes' },
];

/** Périodicités d'un plan de paiement. */
export const PERIODICITES = [
  { code: 'ANNUEL', label: 'Annuel', hint: 'Un seul versement, à la rentrée.' },
  { code: 'SEMESTRIEL', label: 'Semestriel', hint: 'Deux versements, un par semestre.' },
  { code: 'MENSUEL', label: 'Mensuel', hint: 'Des mensualités égales.' },
  {
    code: 'TRANCHES',
    label: 'Par tranches',
    hint: 'Une répartition libre en pourcentages (40/30/30…).',
  },
];

/**
 * Assiette d'un plan : sur quoi porte l'échéancier.
 * Sans ce champ, « 40 % à l'inscription » est ambigu — 40 % de quoi ?
 */
export const ASSIETTES = [
  { code: 'TOTAL', label: 'Dû total (inscription + scolarité + examen)' },
  { code: 'SCOLARITE', label: 'Scolarité seule' },
];

/**
 * Statuts d'une échéance, tels que `v_finance_echeances` les calcule.
 *
 * « En retard » l'emporte sur « partielle » : une tranche entamée mais dépassée
 * est d'abord un retard.
 */
export const STATUTS_ECHEANCE = {
  PAYE: { code: 'PAYE', label: 'Payée', variant: 'success' },
  PARTIEL: { code: 'PARTIEL', label: 'Partielle', variant: 'warning' },
  EN_RETARD: { code: 'EN_RETARD', label: 'En retard', variant: 'danger' },
  EN_ATTENTE: { code: 'EN_ATTENTE', label: 'En attente', variant: 'secondary' },
};

export const STATUT_ECHEANCE_LIST = Object.values(STATUTS_ECHEANCE);

/**
 * Statuts de règlement d'une facture.
 *
 * Le serveur renvoie ici des **libellés**, pas des codes (`v_finance_factures`
 * calcule le statut à partir des paiements). Les filtres les renvoient tels
 * quels.
 */
export const STATUTS_FACTURE = {
  Payé: { code: 'Payé', label: 'Payé', variant: 'success' },
  Partiel: { code: 'Partiel', label: 'Partiel', variant: 'warning' },
  Impayé: { code: 'Impayé', label: 'Impayé', variant: 'danger' },
  Annulée: { code: 'Annulée', label: 'Annulée', variant: 'secondary' },
};

export const STATUT_FACTURE_LIST = Object.values(STATUTS_FACTURE);

/** Statuts d'un paiement (`statut` de `v_finance_paiements`). */
export const STATUTS_PAIEMENT = {
  Payé: { code: 'Payé', label: 'Payé', variant: 'success' },
  'En attente': { code: 'En attente', label: 'En attente', variant: 'warning' },
  Échoué: { code: 'Échoué', label: 'Annulé', variant: 'danger' },
};

/**
 * Décrit un statut, quel que soit le référentiel.
 * @param {Record<string, {code: string, label: string, variant: string}>} referentiel
 * @param {string|null|undefined} statut
 */
export function statutInfo(referentiel, statut) {
  return (
    referentiel[statut] ?? {
      code: statut ?? 'INCONNU',
      label: statut ?? 'Inconnu',
      variant: 'secondary',
    }
  );
}

/** @param {string} code */
export function modeLabel(code) {
  return MODES_PAIEMENT.find((mode) => mode.code === code)?.label ?? code ?? '—';
}

/**
 * Formate un montant avec la devise réglée.
 *
 * La devise n'est plus « FCFA » en dur : elle vient du paramètre
 * `finances.devise_symbole`, réglable depuis l'écran Paramètres. Le repli reste
 * « FCFA » tant que les réglages ne sont pas revenus du serveur, si bien que le
 * premier rendu est déjà juste.
 *
 * Les montants arrivent du serveur en chaînes (`"575000.00"`, le type `NUMERIC`
 * de PostgreSQL) : les additionner sans conversion concaténerait des textes.
 * `formatMontant` absorbe cette conversion.
 *
 * @param {number|string|null|undefined} montant
 */
export function formatMoney(montant) {
  return formatMontant(montant);
}

/** Somme une colonne d'une liste, en neutralisant les montants en chaînes. */
export function somme(lignes, champ) {
  return lignes.reduce((total, ligne) => total + Number(ligne[champ] ?? 0), 0);
}
