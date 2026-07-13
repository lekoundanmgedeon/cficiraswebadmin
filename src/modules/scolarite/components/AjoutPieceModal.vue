<script setup>
import { computed, ref } from 'vue';
import { useDossierStore } from '../store';
import { CHEMIN_PATTERN, PIECE_MODAL_ID, TYPES_PIECE, cheminValide } from '../constants';
import { closeModal } from '@/shared/utils/modal';

/**
 * Dépôt d'une pièce justificative.
 *
 * ⚠️ Ce n'est **pas un envoi de fichier**. L'endpoint attend un `chemin` — une
 * chaîne pointant vers un fichier déjà déposé sur le serveur. Le formulaire dit
 * donc « chemin », et non « fichier » : le contraire laisserait croire à un
 * téléversement qui n'a pas lieu.
 *
 * Le format du chemin est imposé par une contrainte **de la base**, pas du
 * contrôleur : `^/uploads/.*\.(pdf|jpg|jpeg|png)$`. Un chemin mal formé remonte
 * donc en erreur SQL brute (« new row violates check constraint »), incompréhensible
 * pour l'utilisateur. On valide ici pour ne jamais en arriver là.
 */

const dossierStore = useDossierStore();

const typePiece = ref('');
const chemin = ref('');
const errorMessage = ref('');

const loading = computed(() => dossierStore.loading);

const cheminEstValide = computed(() => !chemin.value.trim() || cheminValide(chemin.value));

function reset() {
  typePiece.value = '';
  chemin.value = '';
  errorMessage.value = '';
}

async function submit() {
  if (!typePiece.value) {
    errorMessage.value = 'Choisissez le type de pièce.';
    return;
  }

  if (!chemin.value.trim()) {
    errorMessage.value = 'Le chemin du fichier est obligatoire.';
    return;
  }

  if (!cheminValide(chemin.value)) {
    errorMessage.value =
      'Le chemin doit commencer par /uploads/ et se terminer par .pdf, .jpg, .jpeg ou .png.';
    return;
  }

  errorMessage.value = '';

  const result = await dossierStore.addPiece({
    type_piece: typePiece.value,
    chemin: chemin.value.trim(),
  });

  if (result !== undefined) {
    closeModal(PIECE_MODAL_ID);
    reset();
  }
}
</script>

<template>
  <div :id="PIECE_MODAL_ID" class="modal fade" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header bg-primary text-white">
          <h5 class="modal-title">Déposer une pièce justificative</h5>
          <button
            type="button"
            class="btn-close btn-close-white"
            data-bs-dismiss="modal"
            aria-label="Fermer"
            @click="reset"
          ></button>
        </div>

        <form @submit.prevent="submit">
          <div class="modal-body">
            <div class="mb-3">
              <label for="piece-type" class="form-label">
                Type de pièce <span class="text-danger">*</span>
              </label>
              <select id="piece-type" v-model="typePiece" class="form-select" required>
                <option value="">Choisir un type</option>
                <option v-for="type in TYPES_PIECE" :key="type.code" :value="type.code">
                  {{ type.label }}
                </option>
              </select>
            </div>

            <div class="mb-0">
              <label for="piece-chemin" class="form-label">
                Chemin du fichier <span class="text-danger">*</span>
              </label>
              <input
                id="piece-chemin"
                v-model="chemin"
                type="text"
                class="form-control"
                :class="{ 'is-invalid': !cheminEstValide }"
                placeholder="/uploads/diplome-etu-2024-0012.pdf"
                required
              />
              <div class="form-text">
                Le fichier doit déjà être présent sur le serveur. Formats acceptés :
                <code>.pdf</code>, <code>.jpg</code>, <code>.jpeg</code>, <code>.png</code>.
              </div>
              <div v-if="!cheminEstValide" class="invalid-feedback d-block">
                Le chemin doit correspondre à <code>{{ CHEMIN_PATTERN.source }}</code>
              </div>
            </div>

            <div class="alert alert-info d-flex align-items-start mt-3 mb-0" role="alert">
              <i class="mdi mdi-information-outline me-2 mt-1"></i>
              <div class="small">
                La pièce sera déposée au statut <strong>En attente</strong>. Elle devra ensuite être
                validée ou rejetée.
              </div>
            </div>

            <div v-if="errorMessage" class="alert alert-danger mt-3 mb-0" role="alert">
              <i class="mdi mdi-alert-circle me-1"></i> {{ errorMessage }}
            </div>
          </div>

          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-secondary"
              data-bs-dismiss="modal"
              :disabled="loading"
              @click="reset"
            >
              Annuler
            </button>
            <button type="submit" class="btn btn-primary" :disabled="loading">
              <span
                v-if="loading"
                class="spinner-border spinner-border-sm me-2"
                aria-hidden="true"
              ></span>
              {{ loading ? 'Dépôt...' : 'Déposer' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
