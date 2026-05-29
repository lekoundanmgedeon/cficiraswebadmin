<template>
  <div class="modal-overlay" v-if="showModal" @click.self="closeModal">
    <div class="modal-container">
      <div class="modal-header">
        <h5 class="modal-title">
          <i class="mdi mdi-calendar-edit me-2"></i>
          {{ isEditMode ? 'Modifier la planification' : 'Nouvelle planification' }}
        </h5>
        <button type="button" class="btn-close" @click="closeModal"></button>
      </div>

      <div class="modal-body">
        <form @submit.prevent="handleSubmit">
          <div class="row g-3">
            <!-- Session -->
            <div class="col-md-6">
              <label class="form-label required">Session d'examen</label>
              <select class="form-select" v-model="formData.sessionId" required>
                <option value="" disabled>Sélectionner une session</option>
                <option v-for="session in activeSessions" :key="session.id" :value="session.id">
                  {{ session.designation }} ({{ session.semestre }})
                </option>
              </select>
            </div>

            <!-- Matière -->
            <div class="col-md-6">
              <label class="form-label required">Matière</label>
              <select class="form-select" v-model="formData.matiereId" required>
                <option value="" disabled>Sélectionner une matière</option>
                <option v-for="matiere in filteredMatieres" :key="matiere.id" :value="matiere.id">
                  {{ matiere.code }} - {{ matiere.nom }}
                </option>
              </select>
            </div>

            <!-- Date et Heure -->
            <div class="col-md-6">
              <label class="form-label required">Date</label>
              <input
                type="date"
                class="form-control"
                v-model="formData.date"
                required
                :min="minDate"
              />
            </div>
            <div class="col-md-3">
              <label class="form-label required">Heure début</label>
              <input type="time" class="form-control" v-model="formData.heureDebut" required />
            </div>
            <div class="col-md-3">
              <label class="form-label required">Heure fin</label>
              <input
                type="time"
                class="form-control"
                v-model="formData.heureFin"
                required
                :min="formData.heureDebut"
              />
            </div>

            <!-- Salle -->
            <div class="col-md-6">
              <label class="form-label required">Salle</label>
              <select class="form-select" v-model="formData.salleId" required>
                <option value="" disabled>Sélectionner une salle</option>
                <option
                  v-for="salle in sallesDisponibles"
                  :key="salle.id"
                  :value="salle.id"
                  :disabled="!isSalleDisponible(salle.id)"
                >
                  {{ salle.nom }} (Capacité: {{ salle.capacite }})
                  <span v-if="!isSalleDisponible(salle.id)"> - Occupée</span>
                </option>
              </select>
              <small class="text-muted"> Capacité requise: {{ nombreEtudiants }} étudiants </small>
            </div>

            <!-- Surveillants -->
            <div class="col-md-6">
              <label class="form-label required">Surveillants</label>
              <VueMultiselect
                v-model="formData.surveillants"
                :options="enseignantsDisponibles"
                :multiple="true"
                :close-on-select="false"
                placeholder="Sélectionner des surveillants"
                label="nomComplet"
                track-by="id"
                :disabled="!formData.date"
              />
              <small class="text-muted"> Sélectionner au moins 2 surveillants </small>
            </div>

            <!-- Options supplémentaires -->
            <div class="col-12">
              <div class="form-check">
                <input
                  class="form-check-input"
                  type="checkbox"
                  id="flexCheckDefault"
                  v-model="formData.estPrincipal"
                />
                <label class="form-check-label" for="flexCheckDefault">
                  Examen principal (affecte toutes les classes)
                </label>
              </div>
            </div>

            <!-- Liste des classes (si pas principal) -->
            <div class="col-12" v-if="!formData.estPrincipal">
              <label class="form-label">Classes concernées</label>
              <div class="row g-2">
                <div class="col-auto" v-for="classe in classesDisponibles" :key="classe.id">
                  <div class="form-check">
                    <input
                      class="form-check-input"
                      type="checkbox"
                      :id="'classe-' + classe.id"
                      v-model="formData.classes"
                      :value="classe.id"
                    />
                    <label class="form-check-label" :for="'classe-' + classe.id">
                      {{ classe.nom }}
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeModal">
              <i class="mdi mdi-close me-1"></i> Annuler
            </button>
            <button type="submit" class="btn btn-primary">
              <i class="mdi mdi-content-save me-1"></i> Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import VueMultiselect from 'vue-multiselect';
import 'vue-multiselect/dist/vue-multiselect.css';

const props = defineProps({
  exam: Object,
  showModal: Boolean,
});

const emit = defineEmits(['close', 'save']);

// Données simulées (à remplacer par des appels API)
const activeSessions = ref([
  {
    id: 1,
    designation: 'Partiel S1',
    semestre: 'S1',
    dateDebut: '2024-12-10',
    dateFin: '2024-12-15',
  },
  {
    id: 2,
    designation: 'Rattrapage S1',
    semestre: 'S1',
    dateDebut: '2025-01-15',
    dateFin: '2025-01-20',
  },
  {
    id: 3,
    designation: 'Partiel S2',
    semestre: 'S2',
    dateDebut: '2025-05-10',
    dateFin: '2025-05-15',
  },
]);

const matieres = ref([
  { id: 1, code: 'MATH101', nom: 'Mathématiques', semestre: 'S1', classes: [1, 2] },
  { id: 2, code: 'PHYS101', nom: 'Physique', semestre: 'S1', classes: [1, 3] },
  { id: 3, code: 'INFO201', nom: 'Algorithmique', semestre: 'S2', classes: [4, 5] },
]);

const salles = ref([
  { id: 1, nom: 'Amphi A', capacite: 120, batiment: 'Bâtiment A' },
  { id: 2, nom: 'Salle B101', capacite: 30, batiment: 'Bâtiment B' },
  { id: 3, nom: 'Salle C201', capacite: 50, batiment: 'Bâtiment C' },
]);

const enseignants = ref([
  { id: 1, nomComplet: 'Prof. Dupont', matieres: [1, 2] },
  { id: 2, nomComplet: 'Prof. Martin', matieres: [1, 3] },
  { id: 3, nomComplet: 'Prof. Legrand', matieres: [2] },
]);

const classes = ref([
  { id: 1, nom: 'L1A', effectif: 30, filiere: 'Informatique' },
  { id: 2, nom: 'L1B', effectif: 28, filiere: 'Informatique' },
  { id: 3, nom: 'L1C', effectif: 25, filiere: 'Physique' },
  { id: 4, nom: 'L2A', effectif: 32, filiere: 'Informatique' },
  { id: 5, nom: 'L2B', effectif: 30, filiere: 'Mathématiques' },
]);

// Form data
const formData = ref({
  id: null,
  sessionId: '',
  matiereId: '',
  date: '',
  heureDebut: '08:00',
  heureFin: '10:00',
  salleId: '',
  surveillants: [],
  estPrincipal: false,
  classes: [],
});

// Calculs
const isEditMode = computed(() => !!props.exam?.id);
const filteredMatieres = computed(() => {
  if (!formData.value.sessionId) return [];
  const session = activeSessions.value.find((s) => s.id === formData.value.sessionId);
  return matieres.value.filter((m) => m.semestre === session.semestre);
});

const sallesDisponibles = computed(() => {
  return salles.value.map((salle) => ({
    ...salle,
    disponible: isSalleDisponible(salle.id),
  }));
});

const enseignantsDisponibles = computed(() => {
  if (!formData.value.matiereId) return [];
  return enseignants.value.filter((e) => e.matieres.includes(parseInt(formData.value.matiereId)));
});

const classesDisponibles = computed(() => {
  if (!formData.value.matiereId) return [];
  const matiere = matieres.value.find((m) => m.id === parseInt(formData.value.matiereId));
  return classes.value.filter((c) => matiere.classes.includes(c.id));
});

const nombreEtudiants = computed(() => {
  if (formData.value.estPrincipal) {
    return classesDisponibles.value.reduce((acc, c) => acc + c.effectif, 0);
  }
  return formData.value.classes.reduce((acc, classeId) => {
    const classe = classes.value.find((c) => c.id === classeId);
    return acc + (classe?.effectif || 0);
  }, 0);
});

const minDate = computed(() => {
  if (!formData.value.sessionId) return '';
  const session = activeSessions.value.find((s) => s.id === formData.value.sessionId);
  return session.dateDebut;
});

// Méthodes
const isSalleDisponible = (salleId) => {
  // Vérifier si la salle est disponible à la date/heure sélectionnée
  // (implémentation simplifiée - à compléter avec la logique réelle)
  return true;
};

const resetForm = () => {
  formData.value = {
    id: null,
    sessionId: '',
    matiereId: '',
    date: '',
    heureDebut: '08:00',
    heureFin: '10:00',
    salleId: '',
    surveillants: [],
    estPrincipal: false,
    classes: [],
  };
};

const loadExamData = () => {
  if (props.exam) {
    formData.value = {
      id: props.exam.id,
      sessionId: props.exam.sessionId,
      matiereId: props.exam.matiereId,
      date: props.exam.date,
      heureDebut: props.exam.heureDebut,
      heureFin: props.exam.heureFin,
      salleId: props.exam.salleId,
      surveillants: props.exam.surveillants,
      estPrincipal: props.exam.estPrincipal,
      classes: props.exam.classes || [],
    };
  } else {
    resetForm();
  }
};

const handleSubmit = () => {
  // Validation supplémentaire si nécessaire
  if (formData.value.surveillants.length < 2) {
    alert('Veuillez sélectionner au moins 2 surveillants');
    return;
  }

  if (!formData.value.estPrincipal && formData.value.classes.length === 0) {
    alert('Veuillez sélectionner au moins une classe');
    return;
  }

  emit('save', { ...formData.value });
};

const closeModal = () => {
  emit('close');
};

// Watchers
watch(() => props.exam, loadExamData, { immediate: true });
watch(
  () => props.showModal,
  (val) => {
    if (val) loadExamData();
  }
);
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1050;
}

.modal-container {
  background-color: white;
  border-radius: 8px;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.modal-header {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.modal-body {
  padding: 1.5rem;
}

.modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid #e9ecef;
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.form-label.required::after {
  content: ' *';
  color: #dc3545;
}

:deep(.multiselect) {
  min-height: 38px;
}

:deep(.multiselect__tags) {
  border: 1px solid #ced4da;
  border-radius: 0.375rem;
  padding: 0.375rem 2.5rem 0.375rem 0.75rem;
}

:deep(.multiselect__select) {
  right: 1px;
  top: 1px;
  height: calc(100% - 2px);
}
</style>
