import { ref } from 'vue';
import { openModal, closeModal } from '@/shared/utils/modal';
import { TRAVAIL_MODAL_ID } from '../../constants';

/** Pilotage de la modale d'attribution / modification d'un travail de recherche. */

/** @type {import('vue').Ref<any|null>} */
const selectedTravail = ref(null);

/**
 * Étudiant pré-sélectionné quand on attribue depuis la liste des finalistes.
 * @type {import('vue').Ref<any|null>}
 */
const etudiantCible = ref(null);

export function useTravailForm() {
  function openCreate(etudiant = null) {
    selectedTravail.value = null;
    etudiantCible.value = etudiant;
    openModal(TRAVAIL_MODAL_ID);
  }

  /** @param {object} travail */
  function openEdit(travail) {
    selectedTravail.value = { ...travail };
    etudiantCible.value = null;
    openModal(TRAVAIL_MODAL_ID);
  }

  function close() {
    closeModal(TRAVAIL_MODAL_ID);
    selectedTravail.value = null;
    etudiantCible.value = null;
  }

  return { selectedTravail, etudiantCible, openCreate, openEdit, close };
}
