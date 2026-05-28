<template>
  <div class="d-flex flex-wrap justify-content-xl-between">
    <div class="card-body p-0">
      <h4 class="card-title">
        Examens —
        <span v-if="semestreGroup === 0">Tous les semestres</span>
        <span v-else-if="semestreGroup === 1">Semestres Impairs</span>
        <span v-else>Semestres Pairs</span>
      </h4>
      <p class="card-description text-muted">
        Liste filtrée selon la période de l'année universitaire.
      </p>

      <div class="d-flex mb-3">
        <button
          v-for="type in types"
          :key="type.value"
          @click="setType(type.value)"
          :class="['btn', type.value === selectedType ? 'btn-primary' : 'btn-outline-dark', 'me-2']"
        >
          {{ type.label }}
        </button>
      </div>

      <div v-if="loading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Chargement...</span>
        </div>
      </div>

      <div v-else class="table-scrollable">
        <table class="table table-hover align-middle">
          <thead>
            <tr>
              <th>Code</th>
              <th>Désignation</th>
              <th>État</th>
              <th>Date début</th>
              <th>Date fin</th>
              <th>Responsable</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="exam in filteredExams" :key="exam.id">
              <td>
                <span class="badge bg-light text-dark border">{{ exam.semestre_code }}</span>
              </td>
              <td>{{ exam.designation }}</td>
              <td>
                <span
                  class="status-badge"
                  :class="exam.etat.toLowerCase() === 'active' ? 'status-active' : 'status-draft'"
                >
                  {{ exam.etat.toLowerCase() }}
                </span>
              </td>
              <td>{{ formatDate(exam.date_debut) }}</td>
              <td>{{ formatDate(exam.date_fin) }}</td>
              <td>{{ exam.responsable || 'Non assigné' }}</td>
              <td>
                <ItemActions
                  :item="exam"
                  moduleRoute="/examens"
                  :showAdd="false"
                  editModalTarget="#editExamModal"
                  @edit="handleEdit"
                  @delete="handleDelete"
                />
              </td>
            </tr>

            <tr v-if="filteredExams.length === 0">
              <td colspan="7" class="text-center py-4">
                <div class="d-flex flex-column align-items-center">
                  <img src="/img/empty-box.svg" alt="Aucune donnée" class="mb-2" width="64" />
                  <div class="text-secondary">Aucun examen ne correspond à ces critères.</div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useSessionStore } from '@/stores/evaluationStore/sessionStore.js';
import ItemActions from '../details/DetailsItem.vue';

const props = defineProps({
  semestreGroup: {
    type: Number, // 0 = Tout, 1 = Impairs, 2 = Pairs
    required: true,
  },
});

const sessionStore = useSessionStore();
const { sessions, loading } = storeToRefs(sessionStore);

const types = [
  { label: 'Normal', value: 'NORMALE' },
  { label: 'Rattrapage', value: 'RATTRAPAGE' },
];
const selectedType = ref('NORMALE');

/**
 * Fonction utilitaire pour extraire le numéro du semestre
 * Gère les formats : "S1", "S2", "SEM-3", "Semestre 5", etc.
 */
const getSemesterNumber = (code) => {
  if (!code) return null;
  // Cherche le premier bloc de chiffres dans la chaîne
  const match = code.match(/\d+/);
  return match ? parseInt(match[0], 10) : null;
};

// Filtrage réactif intelligent
const filteredExams = computed(() => {
  if (!sessions.value) return [];

  return sessions.value.filter((exam) => {
    // 1. Filtrage par Type de session
    const matchType = exam.type_session === selectedType.value;
    if (!matchType) return false;

    // 2. Si l'onglet "Tout" (0) est sélectionné, pas besoin de trier par pair/impair
    if (props.semestreGroup === 0) return true;

    // 3. Extraction et calcul mathématique du numéro du semestre
    const semesterNum = getSemesterNumber(exam.semestre_code);
    if (semesterNum === null) return false; // Sécurité si le format est corrompu

    const isImpair = semesterNum % 2 !== 0;

    if (props.semestreGroup === 1) {
      return isImpair; // Garde seulement si c'est impair (1, 3, 5...)
    } else if (props.semestreGroup === 2) {
      return !isImpair; // Garde seulement si c'est pair (2, 4, 6...)
    }

    return false;
  });
});

const setType = (typeValue) => {
  selectedType.value = typeValue;
};

const formatDate = (dateString) => {
  if (!dateString) return 'Non défini';
  const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
  return new Date(dateString).toLocaleDateString('fr-FR', options);
};

const handleEdit = (item) => {
  sessionStore.fetchSessionById(item.id);
};

const handleDelete = async (item) => {
  if (confirm(`Voulez-vous vraiment supprimer la session "${item.designation}" ?`)) {
    await sessionStore.removeSession(item.id);
  }
};
</script>

<style scoped>
.status-badge {
  padding: 0.4em 0.8em;
  border-radius: 20px;
  font-size: 0.8rem;
  color: #fff;
  display: inline-block;
  text-transform: capitalize;
}
.status-draft {
  background-color: #6c757d;
}
.status-active {
  background-color: #0d6efd;
}
.table thead th {
  border-bottom: 2px solid #dee2e6;
  font-weight: 600;
}
</style>
