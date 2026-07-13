import { ref } from 'vue';
import { openModal, closeModal } from '@/shared/utils/modal';
import { MODULE_MODAL_ID } from '../constants';

/**
 * Pilotage de la modale de création / édition d'un module.
 *
 * L'état est partagé au niveau du module : l'en-tête (« Ajouter ») et la liste
 * (« Modifier ») pilotent la même instance sans faire descendre de props.
 */

/** @type {import('vue').Ref<any|null>} Module en cours d'édition, `null` en création. */
const selectedModule = ref(null);

export function useModuleForm() {
  function openCreate() {
    selectedModule.value = null;
    openModal(MODULE_MODAL_ID);
  }

  /** @param {object} module */
  function openEdit(module) {
    selectedModule.value = { ...module };
    openModal(MODULE_MODAL_ID);
  }

  function close() {
    closeModal(MODULE_MODAL_ID);
    selectedModule.value = null;
  }

  return { selectedModule, openCreate, openEdit, close };
}
