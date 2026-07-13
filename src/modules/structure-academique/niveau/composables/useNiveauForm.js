import { ref } from 'vue';
import { openModal, closeModal } from '@/shared/utils/modal';

/** Pilotage de la modale de création / édition d'un niveau. */

export const NIVEAU_MODAL_ID = 'niveauModal';

/** @type {import('vue').Ref<any|null>} */
const selectedNiveau = ref(null);

export function useNiveauForm() {
  function openCreate() {
    selectedNiveau.value = null;
    openModal(NIVEAU_MODAL_ID);
  }

  /** @param {object} niveau */
  function openEdit(niveau) {
    selectedNiveau.value = { ...niveau };
    openModal(NIVEAU_MODAL_ID);
  }

  function close() {
    closeModal(NIVEAU_MODAL_ID);
    selectedNiveau.value = null;
  }

  return { selectedNiveau, openCreate, openEdit, close };
}
