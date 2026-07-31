import { ref } from 'vue';
import { openModal, closeModal } from '@/shared/utils/modal';
import { OUVRAGE_MODAL_ID } from '../constants';

/** Pilotage de la modale de création / édition d'un ouvrage. */

/** @type {import('vue').Ref<any|null>} */
const selectedOuvrage = ref(null);

export function useOuvrageForm() {
  function openCreate() {
    selectedOuvrage.value = null;
    openModal(OUVRAGE_MODAL_ID);
  }

  /** @param {object} ouvrage */
  function openEdit(ouvrage) {
    selectedOuvrage.value = { ...ouvrage };
    openModal(OUVRAGE_MODAL_ID);
  }

  function close() {
    closeModal(OUVRAGE_MODAL_ID);
    selectedOuvrage.value = null;
  }

  return { selectedOuvrage, openCreate, openEdit, close };
}
