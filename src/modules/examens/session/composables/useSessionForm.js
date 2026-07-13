import { ref } from 'vue';
import { openModal, closeModal } from '@/shared/utils/modal';
import { SESSION_MODAL_ID } from '../../constants';

/**
 * Pilotage de la modale de session.
 *
 * L'état est partagé au niveau du module : l'en-tête (« Ajouter ») et la liste
 * (« Modifier ») pilotent la même instance. L'ancienne version n'avait pas
 * d'édition du tout — le bouton visait une modale inexistante.
 */

/** @type {import('vue').Ref<any|null>} Session en cours d'édition, `null` en création. */
const selectedSession = ref(null);

export function useSessionForm() {
  function openCreate() {
    selectedSession.value = null;
    openModal(SESSION_MODAL_ID);
  }

  /** @param {object} session */
  function openEdit(session) {
    selectedSession.value = { ...session };
    openModal(SESSION_MODAL_ID);
  }

  function close() {
    closeModal(SESSION_MODAL_ID);
    selectedSession.value = null;
  }

  return { selectedSession, openCreate, openEdit, close };
}
