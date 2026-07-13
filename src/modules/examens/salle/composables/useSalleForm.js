import { ref } from 'vue';
import { openModal, closeModal } from '@/shared/utils/modal';
import { SALLE_MODAL_ID } from '../../constants';

/** Pilotage de la modale de salle. */

/** @type {import('vue').Ref<any|null>} Salle en cours d'édition, `null` en création. */
const selectedSalle = ref(null);

export function useSalleForm() {
  function openCreate() {
    selectedSalle.value = null;
    openModal(SALLE_MODAL_ID);
  }

  /** @param {object} salle */
  function openEdit(salle) {
    selectedSalle.value = { ...salle };
    openModal(SALLE_MODAL_ID);
  }

  function close() {
    closeModal(SALLE_MODAL_ID);
    selectedSalle.value = null;
  }

  return { selectedSalle, openCreate, openEdit, close };
}
