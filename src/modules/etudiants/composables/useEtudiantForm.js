import { openModal, closeModal } from '@/shared/utils/modal';
import { ETUDIANT_MODAL_ID } from '../constants';

/**
 * Pilotage de la modale de création d'un étudiant.
 *
 * Il n'y a **pas d'édition** : le backend n'expose pas `PUT /etudiants/:id`
 * (ni `DELETE`). Ce composable n'ouvre donc qu'un formulaire de création — là où
 * la version précédente de ce module prévoyait un `openEdit` qui aurait envoyé
 * ses requêtes dans le vide.
 */
export function useEtudiantForm() {
  const openCreate = () => openModal(ETUDIANT_MODAL_ID);
  const close = () => closeModal(ETUDIANT_MODAL_ID);

  return { openCreate, close };
}
