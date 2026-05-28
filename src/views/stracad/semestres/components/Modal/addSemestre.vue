<template>
  <div
    class="modal fade"
    id="semestreModal"
    tabindex="-1"
    aria-labelledby="semestreModalLabel"
    aria-hidden="true"
  >
    <div class="modal-dialog modal-dialog-centered modal-md">
      <div class="modal-content">
        <!-- Header -->
        <div class="modal-header bg-primary text-white">
          <h5 class="modal-title" id="semestreModalLabel">
            {{ isEdit ? 'Modifier' : 'Ajouter' }} un semestre
          </h5>
          <button
            type="button"
            class="btn-close btn-close-white"
            data-bs-dismiss="modal"
            aria-label="Close"
          ></button>
        </div>

        <!-- Body -->
        <div class="modal-body">
          <form @submit.prevent="submitSemestre">
            <!-- Année académique -->
            <div class="mb-3">
              <label class="form-label">
                Année académique <span class="text-danger">*</span>
              </label>
              <select v-model="form.annee_id" class="form-select" :disabled="!isEdit" required>
                <option value="" disabled>-- Année académique --</option>
                <option v-for="annee in anneesAcademiques" :key="annee.id" :value="annee.id">
                  {{ annee.code }} (Année active)
                </option>
              </select>
              <small class="text-muted"
                >Le semestre est automatiquement rattaché à l'année active en cours.</small
              >
            </div>
            <!-- Code -->
            <div class="mb-3">
              <label class="form-label">
                Code du semestre <span class="text-danger">*</span>
              </label>
              <input
                v-model="form.code"
                type="text"
                class="form-control"
                placeholder="Ex: S1, S2"
                maxlength="10"
                required
              />
              <small class="text-muted"> Code unique par année académique </small>
            </div>
            <div class="row">
              <div class="col-md-6 mb-3">
                <label class="form-label">Date de début <span class="text-danger">*</span></label>
                <input v-model="form.date_debut" type="date" class="form-control" required />
              </div>

              <div class="col-md-6 mb-3">
                <label class="form-label">Date de fin <span class="text-danger">*</span></label>
                <input v-model="form.date_fin" type="date" class="form-control" required />
              </div>
            </div>
            <!-- Actif -->
            <div class="mb-3">
              <div class="d-flex align-items-start">
                <input
                  v-model="form.est_actif"
                  type="checkbox"
                  class="form-check-input mt-1 me-2"
                  id="actifCheck"
                />
                <label class="form-check-label" for="actifCheck">
                  <strong>Définir comme semestre actif</strong><br />
                  <small class="text-muted"> Un seul semestre actif par année académique </small>
                </label>
              </div>
            </div>

            <!-- Aperçu -->
            <div v-if="form.annee_id && form.code" class="alert alert-info">
              <strong>Aperçu :</strong>
              {{ getPreview() }}
            </div>

            <!-- Erreur -->
            <div v-if="errorMessage" class="alert alert-danger">
              <i class="mdi mdi-alert-circle"></i> {{ errorMessage }}
            </div>

            <!-- Succès -->
            <div v-if="successMessage" class="alert alert-success">
              <i class="mdi mdi-check-circle"></i> {{ successMessage }}
            </div>
          </form>
        </div>

        <!-- Footer -->
        <div class="modal-footer">
          <button
            type="button"
            class="btn btn-secondary"
            data-bs-dismiss="modal"
            :disabled="loading"
          >
            <i class="mdi mdi-close"></i> Annuler
          </button>

          <button type="button" class="btn btn-primary" @click="submitSemestre" :disabled="loading">
            <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
            <i v-else class="mdi mdi-content-save"></i>
            {{ loading ? 'Enregistrement...' : 'Enregistrer' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import { useSemestreStore } from '@/stores/academiqueStore/semestreStore'; // À adapter selon vos chemins
import { useAnneeStore } from '@/stores/academiqueStore/anneStore';
import { useNotifier } from '@/stores/messages/useNotifier';

/* Props & Emits */
const props = defineProps({
  semestreToEdit: { type: Object, default: null },
});
const emit = defineEmits(['semestreCreated', 'semestreUpdated']);

/* Stores */
const semestreStore = useSemestreStore();
const anneeStore = useAnneeStore();
const { notifyError } = useNotifier();

/* State */
const form = ref({
  annee_id: '',
  code: '',
  date_debut: '',
  date_fin: '',
  est_actif: false,
});

const anneesAcademiques = ref([]);
const errorMessage = ref('');
const successMessage = ref('');
const isEdit = ref(false);

// Liaison avec le loading global du store Pinia
const loading = computed(() => semestreStore.loading);

/* 1. Déclaration de resetForm en premier */
/* Reset du formulaire */
const resetForm = () => {
  form.value = {
    annee_id: '',
    code: '',
    date_debut: '',
    date_fin: '',
    est_actif: false,
  };
  isEdit.value = false;
  errorMessage.value = '';
  successMessage.value = '';

  // Après le reset, on re-sélectionne immédiatement l'année active disponible dans notre liste filtrée
  if (anneesAcademiques.value.length === 1) {
    form.value.annee_id = anneesAcademiques.value[0].id;
  }
};

/* 2. Watcher pour l'édition placé juste après resetForm */
watch(
  () => props.semestreToEdit,
  (val) => {
    if (val) {
      isEdit.value = true;
      form.value = {
        id: val.id,
        annee_id: val.annee_id || '', // UUID (String)
        code: val.code || '',
        date_debut: val.date_debut ? val.date_debut.split('T')[0] : '', // Format YYYY-MM-DD
        date_fin: val.date_fin ? val.date_fin.split('T')[0] : '',
        est_actif: val.est_actif ?? false,
      };
    } else {
      resetForm();
    }
  },
  { immediate: true }
);

/* Lifecycle */
onMounted(async () => {
  await loadAnneesAcademiques();
});

/* Charger les vraies années académiques depuis le store */
const loadAnneesAcademiques = async () => {
  try {
    await anneeStore.fetchAnneesAcademiques();
    const toutesLesAnnees = anneeStore.anneesAcademiques || [];

    if (isEdit.value) {
      anneesAcademiques.value = toutesLesAnnees;
    } else {
      const anneeActive = toutesLesAnnees.find((annee) => annee.est_active);

      if (anneeActive) {
        anneesAcademiques.value = [anneeActive];
        form.value.annee_id = anneeActive.id;
      } else {
        anneesAcademiques.value = [];
        errorMessage.value =
          "Attention : Aucune année académique n'est active actuellement. Impossible de créer un semestre.";
      }
    }
  } catch (error) {
    errorMessage.value = 'Impossible de charger les années académiques.';
    notifyError(errorMessage.value);
  }
};

/* Helpers */
const getPreview = () => {
  const annee = anneesAcademiques.value.find((a) => a.id === form.value.annee_id);
  return annee ? `${form.value.code} - ${annee.code}` : '';
};

const validateForm = () => {
  if (!form.value.annee_id) {
    errorMessage.value = 'Veuillez sélectionner une année académique.';
    return false;
  }
  if (!form.value.code.trim()) {
    errorMessage.value = 'Le code du semestre est obligatoire.';
    return false;
  }
  if (!form.value.date_debut || !form.value.date_fin) {
    errorMessage.value = 'Les dates de début et de fin sont obligatoires.';
    return false;
  }
  if (new Date(form.value.date_fin) <= new Date(form.value.date_debut)) {
    errorMessage.value = 'La date de fin doit être strictement supérieure à la date de début.';
    return false;
  }
  return true;
};

/* Submit */
const submitSemestre = async () => {
  errorMessage.value = '';
  successMessage.value = '';

  if (!validateForm()) return;

  // Payload parfaitement propre et synchronisé avec ton nouveau contrôleur
  const payload = {
    code: form.value.code.trim().toUpperCase(),
    annee_id: form.value.annee_id, // L'UUID de l'année, attendu par le contrôleur et l'INSERT
    date_debut: form.value.date_debut,
    date_fin: form.value.date_fin,
    est_actif: form.value.est_actif ?? false,
  };

  try {
    if (isEdit.value) {
      await semestreStore.editSemestre(form.value.id, payload);
      successMessage.value = 'Semestre modifié avec succès.';
      emit('semestreUpdated', { id: form.value.id, ...payload });
    } else {
      await semestreStore.addSemestre(payload);
      successMessage.value = 'Semestre créé avec succès.';
      emit('semestreCreated', payload); // Correction mineure du nom de l'émit pour rester standard
    }

    setTimeout(closeModal, 1000);
  } catch (error) {
    errorMessage.value = error.message || 'Erreur lors de l’enregistrement.';
    notifyError(errorMessage.value);
  }
};

/* Modal control */
const closeModal = () => {
  const el = document.getElementById('semestreModal');
  const modal = bootstrap.Modal.getInstance(el) || new bootstrap.Modal(el);
  if (modal) modal.hide();
  setTimeout(() => resetForm(), 300);
};

/* Expose */
defineExpose({
  resetForm,
  openForEdit: (semestre) => {
    isEdit.value = true;
    form.value = { ...semestre };
  },
});
</script>
<style scoped>
.modal-header.bg-primary {
  background-color: #007bff !important;
}

.modal-content {
  border-radius: 12px;
  border: none;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
}

.modal-header {
  border-bottom: 2px solid #e9ecef;
  padding: 1.25rem 1.5rem;
}

.modal-body {
  padding: 1.5rem;
  max-height: 70vh;
  overflow-y: auto;
}

.modal-footer {
  border-top: 2px solid #e9ecef;
  padding: 1rem 1.5rem;
}

.form-label {
  font-weight: 500;
  color: #495057;
  margin-bottom: 0.5rem;
}

.form-control:focus,
.form-select:focus {
  border-color: #007bff;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.form-check-input:checked {
  background-color: #007bff;
  border-color: #007bff;
}

.alert {
  border-radius: 8px;
  border: none;
}

.btn {
  border-radius: 6px;
  padding: 0.5rem 1.25rem;
  font-weight: 500;
}

.btn i {
  margin-right: 0.5rem;
}

.text-danger {
  color: #dc3545 !important;
}

.spinner-border-sm {
  width: 1rem;
  height: 1rem;
}

.bg-light {
  background-color: #f8f9fa !important;
}

h6 i {
  color: #007bff;
  margin-right: 0.5rem;
}

.form-select {
  cursor: pointer;
}
</style>
