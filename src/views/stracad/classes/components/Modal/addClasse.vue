<template>
  <div
    class="modal fade"
    id="classeModal"
    tabindex="-1"
    aria-labelledby="classeModalLabel"
    aria-hidden="true"
  >
    <div class="modal-dialog modal-dialog-centered modal-md">
      <div class="modal-content">
        <div class="modal-header bg-primary text-white">
          <h5 class="modal-title" id="classeModalLabel">
            {{ isEdit ? 'Modifier' : 'Ajouter' }} une classe
          </h5>
          <button
            type="button"
            class="btn-close btn-close-white"
            data-bs-dismiss="modal"
            aria-label="Close"
          ></button>
        </div>

        <div class="modal-body">
          <form @submit.prevent="submitClasse">
            <!-- Code -->
            <div class="mb-3">
              <label class="form-label">
                Code de la classe <span class="text-danger">*</span>
              </label>
              <input
                v-model="form.code"
                type="text"
                class="form-control"
                placeholder="Ex: L1-INFO, M2-GC"
                maxlength="10"
                required
              />
              <small class="text-muted">Code unique de la classe (max 10 caractères)</small>
            </div>

            <!-- Filière -->
            <div class="mb-3">
              <label class="form-label"> Filière <span class="text-danger">*</span> </label>
              <select
                v-model="form.filiere_id"
                class="form-select"
                @change="onFiliereChange"
                required
              >
                <option value="">-- Sélectionner une filière --</option>
                <option v-for="filiere in filieres" :key="filiere.id" :value="filiere.id">
                  {{ filiere.code }} - {{ filiere.designation }}
                  <span v-if="filiere.cycle">({{ filiere.cycle.code }})</span>
                </option>
              </select>
              <small class="text-muted">Choisir la filière à laquelle appartient la classe</small>
            </div>

            <!-- Niveau -->
            <div class="mb-3">
              <label class="form-label"> Niveau <span class="text-danger">*</span> </label>
              <select
                v-model="form.niveau_id"
                class="form-select"
                :disabled="!form.filiere_id"
                required
              >
                <option value="">-- Sélectionner un niveau --</option>
                <option v-for="niveau in filteredNiveaux" :key="niveau.id" :value="niveau.id">
                  {{ niveau.code }} - {{ niveau.designation }}
                </option>
              </select>
              <small class="text-muted">
                {{
                  form.filiere_id
                    ? 'Choisir le niveau de la classe'
                    : "Sélectionnez d'abord une filière"
                }}
              </small>
            </div>

            <!-- Capacité maximale -->
            <div class="mb-3">
              <label class="form-label"> Capacité maximale </label>
              <input
                v-model.number="form.capacite_max"
                type="number"
                class="form-control"
                placeholder="50"
                min="1"
              />
              <small class="text-muted">Nombre maximum d'étudiants pour cette classe</small>
            </div>
            <!-- Aperçu de la classe -->
            <div v-if="form.filiere_id && form.niveau_id" class="alert alert-info">
              <i class="mdi mdi-information-outline"></i>
              <strong>Aperçu :</strong>
              {{ getClassePreview() }}
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
          <button type="button" class="btn btn-primary" @click="submitClasse" :disabled="loading">
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
import { ref, computed, watch, onMounted } from 'vue';
import { useClasseStore } from '@/stores/academiqueStore/classeStore'; // À adapter selon vos chemins
import { useFiliereStore } from '@/stores/academiqueStore/filiereStore';
import { useNiveauStore } from '@/stores/academiqueStore/niveauStore';
import { useNotifier } from '@/stores/messages/useNotifier';

// Props & Emits
const props = defineProps({
  classeToEdit: { type: Object, default: null },
});
const emit = defineEmits(['classeCreated', 'classeUpdated']);

// Stores
const classeStore = useClasseStore();
const filiereStore = useFiliereStore();
const niveauStore = useNiveauStore();
const { notifyError } = useNotifier();

// États du Formulaire (Strictement limité aux besoins de l'application et de la BDD)
const form = ref({
  code: '',
  niveau_id: '',
  filiere_id: '',
  capacite_max: null,
});

const filieres = ref([]);
const niveaux = ref([]);
const errorMessage = ref('');
const successMessage = ref('');
const isEdit = ref(false);

// Liaison dynamique avec le chargement global de Pinia
const loading = computed(() => classeStore.loading);

// Filtrer dynamiquement les niveaux selon la filière sélectionnée
const filteredNiveaux = computed(() => {
  if (!form.value.filiere_id) return [];
  const selectedFiliere = filieres.value.find((f) => f.id === form.value.filiere_id);
  if (!selectedFiliere || !selectedFiliere.cycle_id) return niveaux.value;
  
  // Filtrage par le cycle associé (liaison UUID)
  return niveaux.value.filter((n) => n.cycle_id === selectedFiliere.cycle_id);
});

/* 1. Déclaration de resetForm en premier */
const resetForm = () => {
  form.value = {
    code: '',
    niveau_id: '',
    filiere_id: '',
    capacite_max: null,
  };
  errorMessage.value = '';
  successMessage.value = '';
  isEdit.value = false;
};

/* 2. Watcher pour l'édition placé après resetForm */
watch(
  () => props.classeToEdit,
  (newVal) => {
    if (newVal) {
      isEdit.value = true;
      form.value = {
        id: newVal.id,
        code: newVal.code || '',
        niveau_id: newVal.niveau_id || '', // UUID (String)
        filiere_id: newVal.filiere_id || '', // UUID (String)
        capacite_max: newVal.capacite_max || null,
      };
    } else {
      resetForm();
    }
  },
  { immediate: true }
);

// Chargement initial des dépendances depuis les stores réels
onMounted(async () => {
  await Promise.all([loadFilieres(), loadNiveaux()]);
});

const loadFilieres = async () => {
  try {
    await filiereStore.fetchFilieres();
    filieres.value = filiereStore.filieres || [];
  } catch (error) {
    notifyError('Impossible de charger les filières.');
  }
};

const loadNiveaux = async () => {
  try {
    await niveauStore.fetchNiveaux();
    niveaux.value = niveauStore.niveaux || [];
  } catch (error) {
    notifyError('Impossible de charger les niveaux.');
  }
};

// Actions utilisateurs
const onFiliereChange = () => {
  form.value.niveau_id = '';
};

const getClassePreview = () => {
  const filiere = filieres.value.find((f) => f.id === form.value.filiere_id);
  const niveau = niveaux.value.find((n) => n.id === form.value.niveau_id);
  if (filiere && niveau) {
    return `${niveau.code} - ${filiere.designation}`;
  }
  return '';
};

const validateForm = () => {
  if (!form.value.code.trim()) {
    errorMessage.value = 'Le code est obligatoire.';
    return false;
  }
  if (!form.value.filiere_id) {
    errorMessage.value = 'Veuillez sélectionner une filière.';
    return false;
  }
  if (!form.value.niveau_id) {
    errorMessage.value = 'Veuillez sélectionner un niveau.';
    return false;
  }
  if (form.value.code.length > 10) {
    errorMessage.value = 'Le code ne doit pas dépasser 10 caractères.';
    return false;
  }
  if (form.value.capacite_max && form.value.capacite_max < 1) {
    errorMessage.value = 'La capacité maximale doit être supérieure à 0.';
    return false;
  }
  errorMessage.value = '';
  return true;
};

// Soumission harmonisée avec la méthode create de votre modèle de données
const submitClasse = async () => {
  errorMessage.value = '';
  successMessage.value = '';

  if (!validateForm()) return;

  // Création du payload strict attendu par le modèle PostgreSQL ($1 à $4)
  const dataToSend = {
    code: form.value.code.trim().toUpperCase(),
    niveau_id: form.value.niveau_id, // Transmission directe de l'UUID (String)
    filiere_id: form.value.filiere_id, // Transmission directe de l'UUID (String)
    capacite_max: form.value.capacite_max ? parseInt(form.value.capacite_max, 10) : null,
  };

  try {
    if (isEdit.value) {
      await classeStore.editClasse(form.value.id, dataToSend);
      successMessage.value = 'Classe modifiée avec succès !';
      emit('classeUpdated', { id: form.value.id, ...dataToSend });
    } else {
      // Appel à l'action réelle de votre store Pinia
      await classeStore.addClasse(dataToSend);
      successMessage.value = 'Classe créée avec succès !';
      emit('classeCreated', dataToSend);
    }

    setTimeout(() => {
      closeModal();
    }, 1000);
  } catch (error) {
    console.error(error);
    errorMessage.value = error.message || "Une erreur est survenue lors de l'enregistrement.";
    notifyError(errorMessage.value);
  }
};

const closeModal = () => {
  const modalEl = document.getElementById('classeModal');
  const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
  if (modal) modal.hide();
  setTimeout(() => resetForm(), 300);
};

// Fonctions exposées
defineExpose({
  resetForm,
  openForEdit: (classe) => {
    isEdit.value = true;
    form.value = { ...classe };
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

.form-select:disabled {
  background-color: #e9ecef;
  cursor: not-allowed;
}
</style>

<!-- Exemple d'utilisation dans le composant parent -->
<!--
<template>
  <div>
    <button 
      class="btn btn-primary" 
      data-bs-toggle="modal" 
      data-bs-target="#classeModal"
    >
      <i class="mdi mdi-plus"></i> Ajouter une classe
    </button>

    <AddClasse 
      @classeCreated="handleClasseCreated"
      @classeUpdated="handleClasseUpdated"
      :classeToEdit="selectedClasse"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import AddClasse from './AddClasse.vue';

const selectedClasse = ref(null);

const handleClasseCreated = (newClasse) => {
  console.log('Nouvelle classe créée:', newClasse);
  // Actualiser votre liste de classes
};

const handleClasseUpdated = (updatedClasse) => {
  console.log('Classe modifiée:', updatedClasse);
  // Actualiser votre liste de classes
};
</script>
-->
