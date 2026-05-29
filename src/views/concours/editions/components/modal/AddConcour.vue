<template>
  <div
    class="modal fade"
    id="exampleModal"
    tabindex="-1"
    role="dialog"
    aria-labelledby="exampleModalLabel"
    aria-hidden="true"
  >
    <div class="modal-dialog modal-lg" role="document"> <div class="modal-content border-0 shadow">
        
        <div class="modal-header bg-light">
          <h5 class="modal-title fw-bold text-dark" id="exampleModalLabel">
            <i class="mdi mdi-plus-box text-primary me-2"></i>Ouverture d'un concours
          </h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>

        <div class="modal-body p-4">
          <form @submit.prevent="submitConcour">
            
            <div class="mb-4">
              <label class="form-label fw-semibold text-secondary">
                <i class="mdi mdi-format-text me-1"></i>Désignation
              </label>
              <input 
                v-model="form.designation" 
                type="text" 
                class="form-control form-control-lg fs-6" 
                placeholder="Ex: Concours d'Entrée en 1ère Année" 
                required 
              />
            </div>

            <div class="row mb-4">
              <div class="col-md-6">
                <label class="form-label fw-semibold text-secondary">
                  <i class="mdi mdi-tag-outline me-1"></i>Type concours
                </label>
                <select v-model="form.type_concours" class="form-select form-select-lg fs-6" required>
                  <option value="">Sélectionner</option>
                  <option value="ENTREE">ENTREE</option>
                  <option value="TEST">TEST</option>
                  <option value="PASSERELLE">PASSERELLE</option>
                  <option value="SPECIAL">SPECIAL</option>
                </select>
              </div>
              <div class="col-md-6 mt-3 mt-md-0">
                <label class="form-label fw-semibold text-secondary">
                  <i class="mdi mdi-toggle-switch-outline me-1"></i>Statut initial
                </label>
                <select v-model="form.statut" class="form-select form-select-lg fs-6" required>
                  <option value="">Sélectionner</option>
                  <option value="PLANIFIE">Planifié</option>
                  <option value="OUVERT">Ouvert</option>
                  <option value="CLOTURE">Clôturé</option>
                  <option value="ANNULE">Annulé</option>
                </select>
              </div>
            </div>

            <div class="row mb-4">
              <div class="col-md-6">
                <label class="form-label fw-semibold text-secondary">
                  <i class="mdi mdi-calendar-start me-1"></i>Date début
                </label>
                <input v-model="form.date_debut" type="date" class="form-control form-control-lg fs-6" required />
              </div>
              <div class="col-md-6 mt-3 mt-md-0">
                <label class="form-label fw-semibold text-secondary">
                  <i class="mdi mdi-calendar-end me-1"></i>Date fin
                </label>
                <input v-model="form.date_fin" type="date" class="form-control form-control-lg fs-6" required />
              </div>
            </div>

            <div class="row mb-4">
              <div class="col-md-6">
                <label class="form-label fw-semibold text-danger">
                  <i class="mdi mdi-calendar-clock me-1"></i>Date limite dossier
                </label>
                <input v-model="form.date_limite_inscription" type="date" class="form-control form-control-lg fs-6" required />
              </div>
              <div class="col-md-6 mt-3 mt-md-0">
                <label class="form-label fw-semibold text-secondary">
                  <i class="mdi mdi-school-outline me-1"></i>Année académique
                </label>
                <select v-model="form.annee_id" class="form-select form-select-lg fs-6" required>
                  <option value="">Sélectionner</option>
                  <option 
                    v-if="anneeStore.anneeAcademique" 
                    :value="anneeStore.anneeAcademique.id"
                  >
                    {{ anneeStore.anneeAcademique.code }}
                  </option>
                </select>
              </div>
            </div>

            <div class="mb-4">
              <label class="form-label fw-semibold text-secondary">
                <i class="mdi mdi-text-box-outline me-1"></i>Description / Remarques
              </label>
              <textarea 
                v-model="form.description" 
                class="form-control" 
                rows="3" 
                placeholder="Ajouter des détails ou critères spécifiques liés à ce concours..."
              ></textarea>
            </div>

            <div class="modal-footer border-top-0 pt-0">
              <button type="button" class="btn btn-light btn-lg px-4 fs-6 me-2" data-bs-dismiss="modal">
                Annuler
              </button>
              <button type="submit" class="btn btn-primary btn-lg px-4 fs-6" :disabled="concoursStore.loading">
                <span
                  v-if="concoursStore.loading"
                  class="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                ></span>
                <i v-else class="mdi mdi-check-circle-outline me-1"></i>
                {{ concoursStore.loading ? 'En cours...' : 'Enregistrer le concours' }}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useConcoursStore } from '@/stores/gestionStores/concourStore';
import { useAnneeStore } from '@/stores/academiqueStore/anneStore';

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
  const payload = {
    ...form.value,
    annee_id: form.value.annee_id ? Number(form.value.annee_id) : null
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