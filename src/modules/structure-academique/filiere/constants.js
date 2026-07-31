/** Constantes et repères de lecture du module Filière. */

/**
 * `pg` sert ses `COUNT`, `SUM` et `NUMERIC` en chaînes : `v_filiere_details`
 * renvoie `nb_etudiants: '9'` et `v_organisation_filieres` `taux: '1.80'`.
 * Sans conversion, une addition concatène et Chart.js reçoit un axe vide.
 * @param {any} valeur
 */
export const nombre = (valeur) => Number(valeur ?? 0) || 0;

/**
 * Seuils de remplissage, en pourcentage de la capacité déclarée des classes.
 * Ils servent aux couleurs **et** aux diagnostics : un seul jeu de bornes, pour
 * qu'une barre verte ne puisse jamais accompagner une alerte rouge.
 */
export const SEUILS = {
  /** En dessous : la capacité ouverte n'est pas exploitée. */
  SOUS_UTILISEE: 40,
  /** Au-dessus : il reste peu de places. */
  TENDUE: 85,
  /** Au-dessus : la filière ne peut plus accueillir. */
  SATUREE: 100,
};

/** Palette des graphiques, alignée sur les teintes du tableau de bord. */
export const PALETTE = [
  'rgba(0, 123, 255, 0.85)',
  'rgba(40, 167, 69, 0.85)',
  'rgba(255, 193, 7, 0.85)',
  'rgba(23, 162, 184, 0.85)',
  'rgba(111, 66, 193, 0.85)',
  'rgba(253, 126, 20, 0.85)',
  'rgba(32, 201, 151, 0.85)',
  'rgba(108, 117, 125, 0.85)',
];

/** @param {number} index */
export const couleurSerie = (index) => PALETTE[index % PALETTE.length];

/** Couleur d'un taux de remplissage. @param {number} taux */
export const couleurTaux = (taux) => {
  if (taux >= SEUILS.SATUREE) return 'rgba(220, 53, 69, 0.85)';
  if (taux >= SEUILS.TENDUE) return 'rgba(255, 193, 7, 0.85)';
  if (taux >= SEUILS.SOUS_UTILISEE) return 'rgba(40, 167, 69, 0.85)';
  return 'rgba(23, 162, 184, 0.85)';
};

/** Classe Bootstrap de texte correspondante. @param {number} taux */
export const classeTaux = (taux) => {
  if (taux >= SEUILS.SATUREE) return 'text-danger';
  if (taux >= SEUILS.TENDUE) return 'text-warning';
  if (taux >= SEUILS.SOUS_UTILISEE) return 'text-success';
  return 'text-info';
};

/** Classe Bootstrap de barre de progression correspondante. @param {number} taux */
export const barreTaux = (taux) => {
  if (taux >= SEUILS.SATUREE) return 'bg-danger';
  if (taux >= SEUILS.TENDUE) return 'bg-warning';
  if (taux >= SEUILS.SOUS_UTILISEE) return 'bg-success';
  return 'bg-info';
};

/** Habillage d'un statut servi par `v_organisation_filieres`. @param {string} statut */
export const badgeStatut = (statut) =>
  ({
    OUVERTE: 'bg-success-subtle text-success',
    COMPLÈTE: 'bg-danger-subtle text-danger',
    VIDE: 'bg-secondary-subtle text-secondary',
    FERMÉE: 'bg-warning-subtle text-warning',
  })[statut] || 'bg-light text-dark';

/** @param {any} valeur */
export const formatNombre = (valeur) => new Intl.NumberFormat('fr-FR').format(nombre(valeur));

/** @param {any} valeur */
export const formatTaux = (valeur) => `${nombre(valeur).toFixed(1)} %`;
