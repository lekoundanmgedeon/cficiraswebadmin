import { ref } from 'vue';
import { openModal, closeModal } from '@/shared/utils/modal';

/**
 * Pilotage de la modale de création / édition d'une classe.
 *
 * L'ancien `ClassesContent` câblait `@edit` et `@delete` sur des fonctions qui
 * se contentaient l'une et l'autre d'un `console.log` : **modifier et supprimer
 * une classe étaient tous deux inopérants**.
 */

export const CLASSE_MODAL_ID = 'classeModal';

/** @type {import('vue').Ref<any|null>} */
const selectedClasse = ref(null);

export function useClasseForm() {
  function openCreate() {
    selectedClasse.value = null;
    openModal(CLASSE_MODAL_ID);
  }

  /** @param {object} classe */
  function openEdit(classe) {
    selectedClasse.value = { ...classe };
    openModal(CLASSE_MODAL_ID);
  }

  function close() {
    closeModal(CLASSE_MODAL_ID);
    selectedClasse.value = null;
  }

  return { selectedClasse, openCreate, openEdit, close };
}
