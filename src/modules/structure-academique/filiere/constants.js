/** Constantes et repères de lecture du module Filière. */

/**
 * Les repères de remplissage (conversion, seuils, palette, couleurs, formats)
 * ont quitté ce fichier pour `shared/utils/remplissage.js` : les onglets
 * statistiques des cycles et des classes ont besoin des mêmes bornes, et trois
 * copies auraient divergé au premier ajustement de seuil. Ils restent
 * réexportés ici, où le module les importe déjà.
 */
export {
  barreTaux,
  classeTaux,
  couleurSerie,
  couleurTaux,
  formatNombre,
  formatTaux,
  nombre,
  PALETTE,
  SEUILS,
  tauxRemplissage,
  tonClasse,
} from '@/shared/utils/remplissage';

/** Habillage d'un statut servi par `v_organisation_filieres`. @param {string} statut */
export const badgeStatut = (statut) =>
  ({
    OUVERTE: 'bg-success-subtle text-success',
    COMPLÈTE: 'bg-danger-subtle text-danger',
    VIDE: 'bg-secondary-subtle text-secondary',
    FERMÉE: 'bg-warning-subtle text-warning',
  })[statut] || 'bg-light text-dark';
