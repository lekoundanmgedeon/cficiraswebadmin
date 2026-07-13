import { ref } from 'vue';
import { openModal, closeModal } from '@/shared/utils/modal';

/**
 * Pilotage de la modale de création / édition d'une filière.
 *
 * L'ancien `FilieresContent` câblait le bouton « Modifier » sur une fonction
 * `editFiliere` qui se contentait d'un `console.log` : **éditer une filière ne
 * faisait rien**. Le composable rend l'ouverture de la modale effective, comme
 * pour les années et les cycles.
 */

export const FILIERE_MODAL_ID = 'filiereModal';

/** @type {import('vue').Ref<any|null>} */
const selectedFiliere = ref(null);

export function useFiliereForm() {
  function openCreate() {
    selectedFiliere.value = null;
    openModal(FILIERE_MODAL_ID);
  }

  /** @param {object} filiere */
  function openEdit(filiere) {
    selectedFiliere.value = { ...filiere };
    openModal(FILIERE_MODAL_ID);
  }

  function close() {
    closeModal(FILIERE_MODAL_ID);
    selectedFiliere.value = null;
  }

  return { selectedFiliere, openCreate, openEdit, close };
}
