import { ref } from 'vue';
import { openModal, closeModal } from '@/shared/utils/modal';
import { SOUTENANCE_MODAL_ID } from '../../constants';

/** Pilotage de la modale de planification / modification d'une soutenance. */

/** @type {import('vue').Ref<any|null>} */
const selectedSoutenance = ref(null);

export function useSoutenanceForm() {
  function openCreate() {
    selectedSoutenance.value = null;
    openModal(SOUTENANCE_MODAL_ID);
  }

  /** @param {object} soutenance */
  function openEdit(soutenance) {
    selectedSoutenance.value = { ...soutenance };
    openModal(SOUTENANCE_MODAL_ID);
  }

  function close() {
    closeModal(SOUTENANCE_MODAL_ID);
    selectedSoutenance.value = null;
  }

  return { selectedSoutenance, openCreate, openEdit, close };
}
