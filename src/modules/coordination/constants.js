/**
 * Constantes de la coordination académique.
 *
 * Toutes les listes ci-dessous sont relevées sur les contraintes `CHECK` des
 * tables (migration `015_coordination_academique.sql`) — seule source qui fasse
 * foi. En inventer une valeur ferait échouer l'écriture côté base.
 */

export const TRAVAIL_MODAL_ID = 'travailModal';
export const SOUTENANCE_MODAL_ID = 'soutenanceModal';
export const PV_MODAL_ID = 'procesVerbalModal';

/** `travaux_recherche.type_travail`. */
export const TYPES_TRAVAIL = [
  { code: 'MEMOIRE', label: 'Mémoire' },
  { code: 'THESE', label: 'Thèse' },
  { code: 'PROJET', label: 'Projet de fin d’études' },
  { code: 'RAPPORT_STAGE', label: 'Rapport de stage' },
];

/** @param {string} code */
export const typeTravailLabel = (code) =>
  TYPES_TRAVAIL.find((type) => type.code === code)?.label ?? code ?? '—';

/**
 * `travaux_recherche.statut` — la vie d'un mémoire, de son attribution à sa
 * validation.
 */
export const STATUTS_TRAVAIL = {
  ATTRIBUE: { code: 'ATTRIBUE', label: 'Attribué', variant: 'secondary' },
  EN_COURS: { code: 'EN_COURS', label: 'En cours', variant: 'primary' },
  SOUMIS: { code: 'SOUMIS', label: 'Soumis', variant: 'info' },
  SOUTENU: { code: 'SOUTENU', label: 'Soutenu', variant: 'success' },
  VALIDE: { code: 'VALIDE', label: 'Validé', variant: 'success' },
  ABANDONNE: { code: 'ABANDONNE', label: 'Abandonné', variant: 'danger' },
};

export const STATUT_TRAVAIL_LIST = Object.values(STATUTS_TRAVAIL);

/** @param {string} raw */
export const statutTravailInfo = (raw) =>
  STATUTS_TRAVAIL[String(raw ?? '').toUpperCase()] ?? {
    code: 'INCONNU',
    label: raw || 'Non attribué',
    variant: 'secondary',
  };

/**
 * `travaux_recherche.situation` — où l'étudiant travaille réellement.
 * C'est la question posée par l'écran « statut étudiant ».
 */
export const SITUATIONS = {
  STAGE: { code: 'STAGE', label: 'En stage', variant: 'info' },
  RECHERCHE: { code: 'RECHERCHE', label: 'En recherche', variant: 'primary' },
  AUCUNE: { code: 'AUCUNE', label: 'Non engagé', variant: 'secondary' },
};

export const SITUATION_LIST = Object.values(SITUATIONS);

/** @param {string} raw */
export const situationInfo = (raw) =>
  SITUATIONS[String(raw ?? '').toUpperCase()] ?? SITUATIONS.AUCUNE;

/** `soutenances.statut`. */
export const STATUTS_SOUTENANCE = {
  PLANIFIEE: { code: 'PLANIFIEE', label: 'Planifiée', variant: 'primary' },
  TENUE: { code: 'TENUE', label: 'Tenue', variant: 'success' },
  REPORTEE: { code: 'REPORTEE', label: 'Reportée', variant: 'warning' },
  ANNULEE: { code: 'ANNULEE', label: 'Annulée', variant: 'danger' },
};

export const STATUT_SOUTENANCE_LIST = Object.values(STATUTS_SOUTENANCE);

/** @param {string} raw */
export const statutSoutenanceInfo = (raw) =>
  STATUTS_SOUTENANCE[String(raw ?? '').toUpperCase()] ?? {
    code: 'INCONNU',
    label: raw || '—',
    variant: 'secondary',
  };

/** `soutenances.type_soutenance`. */
export const TYPES_SOUTENANCE = [
  { code: 'MEMOIRE', label: 'Mémoire' },
  { code: 'THESE', label: 'Thèse' },
  { code: 'PROJET', label: 'Projet' },
  { code: 'STAGE', label: 'Stage' },
];

/** `soutenance_jurys.role` — quatre rôles, et pas un de plus. */
export const ROLES_JURY = [
  { code: 'PRESIDENT', label: 'Président', variant: 'primary' },
  { code: 'RAPPORTEUR', label: 'Rapporteur', variant: 'info' },
  { code: 'EXAMINATEUR', label: 'Examinateur', variant: 'secondary' },
  { code: 'INVITE', label: 'Invité', variant: 'light' },
];

/** @param {string} code */
export const roleJuryLabel = (code) =>
  ROLES_JURY.find((role) => role.code === code)?.label ?? code ?? '—';

/** `proces_verbaux_soutenance.decision`. */
export const DECISIONS_PV = {
  EN_ATTENTE: { code: 'EN_ATTENTE', label: 'En attente', variant: 'secondary' },
  ADMIS: { code: 'ADMIS', label: 'Admis', variant: 'success' },
  ADMIS_AVEC_RESERVES: {
    code: 'ADMIS_AVEC_RESERVES',
    label: 'Admis avec réserves',
    variant: 'warning',
  },
  AJOURNE: { code: 'AJOURNE', label: 'Ajourné', variant: 'danger' },
  REFUSE: { code: 'REFUSE', label: 'Refusé', variant: 'danger' },
};

export const DECISION_PV_LIST = Object.values(DECISIONS_PV);

/** @param {string} raw */
export const decisionPvInfo = (raw) =>
  DECISIONS_PV[String(raw ?? '').toUpperCase()] ?? DECISIONS_PV.EN_ATTENTE;

/** `proces_verbaux_soutenance.statut`. */
export const STATUTS_PV = {
  BROUILLON: { code: 'BROUILLON', label: 'Brouillon', variant: 'secondary' },
  VALIDE: { code: 'VALIDE', label: 'Validé', variant: 'primary' },
  PUBLIE: { code: 'PUBLIE', label: 'Publié', variant: 'success' },
};

/** @param {string} raw */
export const statutPvInfo = (raw) =>
  STATUTS_PV[String(raw ?? '').toUpperCase()] ?? {
    code: 'ABSENT',
    label: 'Sans PV',
    variant: 'light',
  };

/** `proces_verbaux_soutenance.mention` — les mêmes que celles du bulletin. */
export const MENTIONS_PV = [
  { code: 'PASSABLE', label: 'Passable' },
  { code: 'ASSEZ_BIEN', label: 'Assez bien' },
  { code: 'BIEN', label: 'Bien' },
  { code: 'TRES_BIEN', label: 'Très bien' },
  { code: 'EXCELLENT', label: 'Excellent' },
];

/** @param {string} code */
export const mentionPvLabel = (code) =>
  MENTIONS_PV.find((mention) => mention.code === code)?.label ?? '—';

/** Bornes de la note de soutenance (`CHECK (note_finale BETWEEN 0 AND 20)`). */
export const NOTE_BORNES = { MIN: 0, MAX: 20 };
