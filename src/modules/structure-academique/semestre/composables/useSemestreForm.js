import { ref } from 'vue';
import { openModal, closeModal } from '@/shared/utils/modal';

/** Pilotage de la modale de création / édition d'un semestre. */

export const SEMESTRE_MODAL_ID = 'semestreModal';

/** @type {import('vue').Ref<any|null>} */
const selectedSemestre = ref(null);

export function useSemestreForm() {
  function openCreate() {
    selectedSemestre.value = null;
    openModal(SEMESTRE_MODAL_ID);
  }

  /** @param {object} semestre */
  function openEdit(semestre) {
    selectedSemestre.value = { ...semestre };
    openModal(SEMESTRE_MODAL_ID);
  }

  function close() {
    closeModal(SEMESTRE_MODAL_ID);
    selectedSemestre.value = null;
  }

  return { selectedSemestre, openCreate, openEdit, close };
}
