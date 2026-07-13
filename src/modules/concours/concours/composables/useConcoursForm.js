import { ref } from 'vue';
import { openModal, closeModal } from '@/shared/utils/modal';
import { CONCOURS_MODAL_ID } from '../../constants';

/**
 * Pilotage de la modale de concours.
 *
 * L'ancien `AddConcour.vue` ne savait que **créer** ; le bouton « Modifier » de
 * la liste appelait un `console.log`. L'état est ici partagé entre l'en-tête
 * (« Ajouter ») et la liste (« Modifier »).
 */

/** @type {import('vue').Ref<any|null>} Concours en cours d'édition, `null` en création. */
const selectedConcours = ref(null);

export function useConcoursForm() {
  function openCreate() {
    selectedConcours.value = null;
    openModal(CONCOURS_MODAL_ID);
  }

  /** @param {object} concours */
  function openEdit(concours) {
    selectedConcours.value = { ...concours };
    openModal(CONCOURS_MODAL_ID);
  }

  function close() {
    closeModal(CONCOURS_MODAL_ID);
    selectedConcours.value = null;
  }

  return { selectedConcours, openCreate, openEdit, close };
}
