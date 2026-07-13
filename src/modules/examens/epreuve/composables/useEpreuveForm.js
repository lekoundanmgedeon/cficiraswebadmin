import { ref } from 'vue';
import { openModal, closeModal } from '@/shared/utils/modal';
import { EPREUVE_MODAL_ID } from '../../constants';

/** Pilotage de la modale d'épreuve, partagée entre l'en-tête et la liste. */

/** @type {import('vue').Ref<any|null>} Épreuve en cours d'édition, `null` en création. */
const selectedEpreuve = ref(null);

export function useEpreuveForm() {
  function openCreate() {
    selectedEpreuve.value = null;
    openModal(EPREUVE_MODAL_ID);
  }

  /** @param {object} epreuve */
  function openEdit(epreuve) {
    selectedEpreuve.value = { ...epreuve };
    openModal(EPREUVE_MODAL_ID);
  }

  function close() {
    closeModal(EPREUVE_MODAL_ID);
    selectedEpreuve.value = null;
  }

  return { selectedEpreuve, openCreate, openEdit, close };
}
