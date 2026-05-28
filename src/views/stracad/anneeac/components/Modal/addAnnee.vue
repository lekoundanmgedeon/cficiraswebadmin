<template>
  <div
    class="modal fade"
    id="anneeModal"
    tabindex="-1"
    aria-labelledby="anneeModalLabel"
    aria-hidden="true"
  >
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header bg-primary text-white">
          <h5 class="modal-title" id="anneeModalLabel">
            {{ isEdit ? 'Modifier' : 'Ajouter' }} une année académique
          </h5>
          <button
            type="button"
            class="btn-close btn-close-white"
            data-bs-dismiss="modal"
            aria-label="Close"
          ></button>
        </div>

        <div class="modal-body">
          <form @submit.prevent="submitAnnee">
            <div class="mb-3">
              <label class="form-label"> Code <span class="text-danger">*</span> </label>
              <input
                v-model="form.code"
                type="text"
                class="form-control"
                placeholder="Ex: 2025-2026"
                required
              />
              <small class="text-muted">Format recommandé: YYYY-YYYY</small>
            </div>

            <div class="row">
              <div class="col-md-6 mb-3">
                <label class="form-label"> Date de début <span class="text-danger">*</span> </label>
                <input v-model="form.date_debut" type="date" class="form-control" required />
              </div>

              <div class="col-md-6 mb-3">
                <label class="form-label"> Date de fin <span class="text-danger">*</span> </label>
                <input v-model="form.date_fin" type="date" class="form-control" required />
              </div>
            </div>

            <div class="mb-3">
              <label class="form-label"> Statut <span class="text-danger">*</span> </label>
              <select v-model="form.statut" class="form-select" required>
                <option value="" disabled selected>Choisir un statut...</option>
                <option value="PLANIFIEE">Planifiée</option>
                <option value="OUVERTE">Ouverte</option>
                <option value="CLOTUREE">Clôturée</option>
              </select>
            </div>

            <div class="p-3 bg-light rounded mb-3">
              <div class="form-check">
                <input
                  v-model="form.est_active"
                  type="checkbox"
                  class="form-check-input"
                  id="activeCheck"
                />
                <label class="form-check-label" for="activeCheck">
                  <strong>Définir comme année active</strong>
                  <br />
                  <small class="text-muted">Une seule année peut être active à la fois</small>
                </label>
              </div>
            </div>

            <!-- Message d'erreur -->
            <div v-if="errorMessage" class="alert alert-danger" role="alert">
              <i class="mdi mdi-alert-circle"></i> {{ errorMessage }}
            </div>

            <!-- Message de succès -->
            <div v-if="successMessage" class="alert alert-success" role="alert">
              <i class="mdi mdi-check-circle"></i> {{ successMessage }}
            </div>
          </form>
        </div>

        <div class="modal-footer">
          <button
            type="button"
            class="btn btn-secondary"
            data-bs-dismiss="modal"
            :disabled="loading"
          >
            <i class="mdi mdi-close"></i> Annuler
          </button>
          <button type="button" class="btn btn-primary" @click="submitAnnee" :disabled="loading">
            <span
              v-if="loading"
              class="spinner-border spinner-border-sm me-2"
              role="status"
              aria-hidden="true"
            ></span>
            <i v-else class="mdi mdi-content-save"></i>
            {{ loading ? 'Enregistrement...' : 'Enregistrer' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue';
import { useAnneeStore } from '@/stores/academiqueStore/anneStore';

const anneeStore = useAnneeStore();
const loading = computed(() => anneeStore.loading);

// Props
const props = defineProps({
  anneeToEdit: {
    type: Object,
    default: null,
  },
});

// Emits
const emit = defineEmits(['anneeCreated', 'anneeUpdated']);

// État initial - On définit 'PLANIFIEE' par défaut pour les nouvelles créations
const form = ref({
  code: '',
  date_debut: '',
  date_fin: '',
  statut: 'PLANIFIEE',
  est_active: false,
});

const errorMessage = ref('');
const successMessage = ref('');
const isEdit = ref(false);

// Watch pour l'édition (Remplit le formulaire avec les données existantes)
watch(
  () => props.anneeToEdit,
  (newVal) => {
    if (newVal) {
      isEdit.value = true;
      form.value = {
        id: newVal.id,
        code: newVal.code,
        date_debut: newVal.date_debut,
        date_fin: newVal.date_fin,
        statut: newVal.statut || 'PLANIFIEE', // Récupère le statut de la BDD
        est_active: newVal.est_active || false,
      };
    }
  },
  { immediate: true }
);

// Réinitialisation du formulaire après fermeture ou création
const resetForm = () => {
  form.value = {
    code: '',
    date_debut: '',
    date_fin: '',
    statut: 'PLANIFIEE',
    est_active: false,
  };
  errorMessage.value = '';
  successMessage.value = '';
  isEdit.value = false;
};

const validateForm = () => {
  if (!form.value.code.trim()) {
    errorMessage.value = 'Le code est obligatoire.';
    return false;
  }
  if (!form.value.date_debut || !form.value.date_fin) {
    errorMessage.value = 'Veuillez remplir toutes les dates obligatoires.';
    return false;
  }
  if (new Date(form.value.date_fin) <= new Date(form.value.date_debut)) {
    errorMessage.value = 'La date de fin doit être supérieure à la date de début.';
    return false;
  }
  if (!form.value.statut) {
    errorMessage.value = 'Le statut est obligatoire.';
    return false;
  }

  errorMessage.value = '';
  return true;
};

const submitAnnee = async () => {
  errorMessage.value = '';
  successMessage.value = '';

  if (!validateForm()) return;

  try {
    if (isEdit.value) {
      await anneeStore.editAnneeAcademique(form.value.id, form.value);
      successMessage.value = 'Année académique modifiée avec succès !';
      emit('anneeUpdated', form.value);
    } else {
      // Envoie l'objet contenant { code, date_debut, date_fin, statut, est_active } au store
      await anneeStore.addAnneeAcademique(form.value);
      successMessage.value = 'Année académique créée avec succès !';
      emit('anneeCreated', form.value);
    }

    setTimeout(() => {
      resetForm();
      const modalElement = document.getElementById('anneeModal');
      const modalInstance = bootstrap.Modal.getInstance(modalElement);
      if (modalInstance) modalInstance.hide();
    }, 1200);
  } catch (error) {
    console.error(error);
    errorMessage.value = error.message || "Une erreur est survenue lors de l'enregistrement.";
  }
};

defineExpose({
  resetForm,
  openForEdit: (annee) => {
    isEdit.value = true;
    form.value = { ...annee };
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

.form-control:focus {
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
</style>

<!-- Exemple d'utilisation dans le composant parent -->
<!--
<template>
  <div>
    <button 
      class="btn btn-primary" 
      data-bs-toggle="modal" 
      data-bs-target="#anneeModal"
    >
      Ajouter une année
    </button>

    <ModalAnneeAcademique 
      @anneeCreated="handleAnneeCreated"
      @anneeUpdated="handleAnneeUpdated"
      :anneeToEdit="selectedAnnee"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import ModalAnneeAcademique from './ModalAnneeAcademique.vue';

const selectedAnnee = ref(null);

const handleAnneeCreated = (newAnnee) => {
  console.log('Nouvelle année créée:', newAnnee);
  // Actualiser votre liste d'années
  // Ex: loadAnnees();
};

const handleAnneeUpdated = (updatedAnnee) => {
  console.log('Année modifiée:', updatedAnnee);
  // Actualiser votre liste d'années
};
</script>
-->
