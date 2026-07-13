import { ref } from 'vue';
import { openModal, closeModal } from '@/shared/utils/modal';
import { ETUDIANT_MODAL_ID } from '../constants';

/**
 * Pilotage de la modale de création / édition d'un étudiant.
 *
 * L'état est partagé au niveau du module : l'en-tête (« Ajouter ») et la liste
 * (« Modifier ») pilotent la même instance de modale sans faire descendre de
 * props à travers l'arbre d'onglets.
 */

/** @type {import('vue').Ref<any|null>} Étudiant en cours d'édition, `null` en création. */
const selectedEtudiant = ref(null);

export function useEtudiantForm() {
  function openCreate() {
    selectedEtudiant.value = null;
    openModal(ETUDIANT_MODAL_ID);
  }

  /** @param {object} etudiant */
  function openEdit(etudiant) {
    selectedEtudiant.value = { ...etudiant };
    openModal(ETUDIANT_MODAL_ID);
  }

  function close() {
    closeModal(ETUDIANT_MODAL_ID);
    selectedEtudiant.value = null;
  }

  return { selectedEtudiant, openCreate, openEdit, close };
}
