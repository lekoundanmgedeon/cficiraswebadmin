import { ref } from 'vue';
import { openModal, closeModal } from '@/shared/utils/modal';
import { CYCLE_MODAL_ID } from '../constants';

/**
 * Pilotage de la modale de création / édition d'un cycle.
 *
 * Même principe que `useAnneeForm` : l'état de la modale est partagé au niveau
 * du module, ce qui permet à l'en-tête (« Ajouter ») et à la liste
 * (« Modifier ») de piloter la même instance sans faire descendre de props à
 * travers l'arbre d'onglets.
 */

/** @type {import('vue').Ref<any|null>} Cycle en cours d'édition, `null` en création. */
const selectedCycle = ref(null);

export function useCycleForm() {
  function openCreate() {
    selectedCycle.value = null;
    openModal(CYCLE_MODAL_ID);
  }

  /** @param {object} cycle */
  function openEdit(cycle) {
    selectedCycle.value = { ...cycle };
    openModal(CYCLE_MODAL_ID);
  }

  function close() {
    closeModal(CYCLE_MODAL_ID);
    selectedCycle.value = null;
  }

  return { selectedCycle, openCreate, openEdit, close };
}
