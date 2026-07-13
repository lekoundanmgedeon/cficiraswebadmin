import { ref } from 'vue';
import { openModal, closeModal } from '@/shared/utils/modal';
import { ANNEE_MODAL_ID } from '../constants';

/**
 * Pilotage de la modale de création/édition d'une année académique.
 *
 * Corrige un défaut de l'implémentation précédente : la modale était rendue par
 * `AnneeHeader` et lisait son prop `anneeToEdit`, tandis que le bouton
 * « Modifier » de la liste écrivait dans une variable locale à
 * `ListeAnneesContent`. Les deux ne communiquaient pas, si bien qu'éditer une
 * année ouvrait en réalité un formulaire de création vide.
 *
 * L'année sélectionnée est ici un état partagé au niveau du module : le header
 * et la liste pilotent la même modale, sans faire descendre de props à travers
 * l'arbre d'onglets.
 */

/** @type {import('vue').Ref<any|null>} Année en cours d'édition, `null` en création. */
const selectedAnnee = ref(null);

export function useAnneeForm() {
  /** Ouvre la modale en mode création. */
  function openCreate() {
    selectedAnnee.value = null;
    openModal(ANNEE_MODAL_ID);
  }

  /**
   * Ouvre la modale en mode édition.
   * @param {object} annee
   */
  function openEdit(annee) {
    // Copie : éditer le formulaire ne doit pas muter la ligne du tableau.
    selectedAnnee.value = { ...annee };
    openModal(ANNEE_MODAL_ID);
  }

  function close() {
    closeModal(ANNEE_MODAL_ID);
    selectedAnnee.value = null;
  }

  return { selectedAnnee, openCreate, openEdit, close };
}
