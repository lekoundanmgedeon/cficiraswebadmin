<template>
  <div
    class="modal fade"
    id="exampleModal"
    tabindex="-1"
    aria-labelledby="exampleModalLabel"
    aria-hidden="true"
    ref="modalRef"
  >
    <div class="modal-dialog modal-dialog-centered modal-lg">
      <div class="modal-content border-0 shadow-lg">
        <div class="modal-header bg-primary text-white">
          <h5 class="modal-title" id="exampleModalLabel">
            <i class="bi bi-calendar-plus me-2"></i>Ouverture d'un nouveau concours
          </h5>
          <button
            type="button"
            class="btn-close btn-close-white"
            data-bs-dismiss="modal"
            aria-label="Close"
            :disabled="concoursStore.loading"
          ></button>
        </div>

        <form @submit.prevent="submitConcour">
          <div class="modal-body p-4">
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label fw-bold small">Année Académique *</label>
                <select
                  v-model="form.annee_id"
                  class="form-select fw-semibold text-dark"
                  required
                  :disabled="concoursStore.loading"
                >
                  <option value="" disabled>— Sélectionnez une année —</option>
                  <option
                    v-if="anneeStore.anneeAcademique"
                    :key="anneeStore.anneeAcademique.id"
                    :value="anneeStore.anneeAcademique.id"
                  >
                    {{ anneeStore.anneeAcademique.code }} (Courante)
                  </option>
                </select>
                <div class="form-text text-muted text-xs">
                  <i class="bi bi-info-circle me-1"></i> Liaison automatique avec l'année active.
                </div>
              </div>

              <div class="col-md-6">
                <label class="form-label fw-bold small">Type concours *</label>
                <select
                  v-model="form.type_concours"
                  class="form-select"
                  required
                  :disabled="concoursStore.loading"
                >
                  <option value="" disabled>— Sélectionnez un type —</option>
                  <option value="ENTREE">ENTREE</option>
                  <option value="TEST">TEST</option>
                  <option value="PASSERELLE">PASSERELLE</option>
                  <option value="SPECIAL">SPECIAL</option>
                </select>
              </div>

              <div class="col-md-6">
                <label class="form-label fw-bold small">Désignation *</label>
                <input
                  v-model="form.designation"
                  type="text"
                  class="form-control"
                  placeholder="Ex: Concours d'Entrée IPAR 2026"
                  required
                  :disabled="concoursStore.loading"
                />
              </div>

              <div class="col-md-6">
                <label class="form-label fw-bold small">Statut Initial *</label>
                <select
                  v-model="form.statut"
                  class="form-select"
                  required
                  :disabled="concoursStore.loading"
                >
                  <option value="PLANIFIE">Planifié</option>
                  <option value="OUVERT">Ouvert</option>
                  <option value="CLOTURE">Clôturé</option>
                  <option value="ANNULE">Annulé</option>
                </select>
              </div>

              <div class="col-md-6">
                <label class="form-label fw-bold small">Date de Début *</label>
                <input
                  v-model="form.date_debut"
                  type="date"
                  class="form-control"
                  :class="{ 'is-invalid': dateError }"
                  required
                  :disabled="concoursStore.loading"
                  @change="validateDates"
                />
              </div>

              <div class="col-md-6">
                <label class="form-label fw-bold small">Date de Fin *</label>
                <input
                  v-model="form.date_fin"
                  type="date"
                  class="form-control"
                  :class="{ 'is-invalid': dateError }"
                  required
                  :disabled="concoursStore.loading"
                  @change="validateDates"
                />
                <div v-if="dateError" class="invalid-feedback text-xs">
                  La date de fin ne peut pas être antérieure à la date de début.
                </div>
              </div>

              <div class="col-md-6">
                <label class="form-label fw-bold small text-danger">Date limite dossier *</label>
                <input
                  v-model="form.date_limite_inscription"
                  type="date"
                  class="form-control"
                  required
                  :disabled="concoursStore.loading"
                />
              </div>

              <div class="col-md-12">
                <label class="form-label fw-bold small">Description / Critères d'éligibilité</label>
                <textarea
                  v-model="form.description"
                  class="form-control"
                  rows="3"
                  placeholder="Ajouter des précisions sur le déroulement, les pièces à fournir..."
                  :disabled="concoursStore.loading"
                ></textarea>
              </div>
            </div>
          </div>

          <div class="modal-footer bg-light">
            <button
              type="button"
              class="btn btn-sm btn-secondary"
              data-bs-dismiss="modal"
              :disabled="concoursStore.loading"
            >
              Annuler
            </button>
            <button
              type="submit"
              class="btn btn-sm btn-primary px-3"
              :disabled="concoursStore.loading || dateError"
            >
              <span
                v-if="concoursStore.loading"
                class="spinner-border spinner-border-sm me-2"
                role="status"
                aria-hidden="true"
              ></span>
              <i v-else class="bi bi-cloud-check me-1"></i>
              Enregistrer le Concours
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted, watch } from 'vue';
import { useConcoursStore } from '@/stores/gestionStores/concourStore';
import { useAnneeStore } from '@/modules/structure-academique/annee/store';

const concoursStore = useConcoursStore();
const anneeStore = useAnneeStore();

const initialFormState = () => ({
  designation: '',
  type_concours: '',
  date_debut: '',
  date_fin: '',
  date_limite_inscription: '',
  annee_id: '',
  statut: '',
  description: '',
});

const form = ref(initialFormState());

onMounted(async () => {
  await anneeStore.fetchCurrentAnnee();
});

watch(
  () => anneeStore.anneeAcademique,
  (newAnnee) => {
    if (newAnnee && newAnnee.id) {
      form.value.annee_id = newAnnee.id;
    }
  },
  { immediate: true }
);

async function submitConcour() {
  // On retire le "Number()", l'UUID doit rester une chaîne de caractères (string)
  const payload = {
    ...form.value,
    annee_id: form.value.annee_id ? form.value.annee_id : null,
  };

  await concoursStore.addConcours(payload);
  resetForm();
  closeModal();
}

function resetForm() {
  form.value = initialFormState();
  if (anneeStore.anneeAcademique) {
    form.value.annee_id = anneeStore.anneeAcademique.id;
  }
}

function closeModal() {
  const modalElement = document.getElementById('exampleModal');
  if (modalElement) {
    const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
    modal.hide();
  }
}
</script>
<style scoped>
.text-xs {
  font-size: 11px !important;
}
.modal-content {
  border-radius: 12px;
}
.form-label {
  color: #495057;
}
.form-control:focus,
.form-select:focus {
  border-color: #0d6efd;
  box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.15);
}
</style>
