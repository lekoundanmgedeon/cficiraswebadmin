import { ref } from 'vue';
import { openModal, closeModal } from '@/shared/utils/modal';
import { DEMANDE_MODAL_ID } from '../constants';

/**
 * Pilotage de la modale de dépôt d'une demande.
 *
 * Il n'y a pas d'édition : une demande se dépose puis avance dans son circuit.
 * La corriger après coup reviendrait à réécrire une pièce déjà numérotée.
 */

/** @type {import('vue').Ref<any|null>} */
const demandeCible = ref(null);

export function useDemandeForm() {
  function openCreate(etudiant = null) {
    demandeCible.value = etudiant;
    openModal(DEMANDE_MODAL_ID);
  }

  function close() {
    closeModal(DEMANDE_MODAL_ID);
    demandeCible.value = null;
  }

  return { demandeCible, openCreate, close };
}
