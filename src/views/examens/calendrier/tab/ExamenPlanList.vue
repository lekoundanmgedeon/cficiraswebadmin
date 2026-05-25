<script setup>
import { ref, computed } from 'vue';

// =======================
// MOCK DATA
// =======================
const planningData = ref([
  {
    id: 1,
    code_session: 'SESSION-001',
    examen_date_planification: '2026-05-20',
    designation_filiere: 'Informatique',
    classe_nom: 'L1 Génie Logiciel',
    examen_statut: 'planifiée',
    classe_id: 10,
    semestre_id: 1,
  },
  {
    id: 2,
    code_session: 'SESSION-002',
    examen_date_planification: '2026-05-22',
    designation_filiere: 'Réseaux',
    classe_nom: 'L2 Réseaux',
    examen_statut: 'en_attente',
    classe_id: 11,
    semestre_id: 2,
  },
  {
    id: 3,
    code_session: 'SESSION-003',
    examen_date_planification: '2026-05-25',
    designation_filiere: 'Télécom',
    classe_nom: 'L3 Télécom',
    examen_statut: 'terminé',
    classe_id: 12,
    semestre_id: 1,
  },
]);

// =======================
// UI STATES
// =======================
const activeTab = ref('all');
const searchQuery = ref('');
const showFilters = ref(false);
const showModal = ref(false);
const currentExam = ref(null);

// =======================
// FILTERS
// =======================
const filters = ref({
  session_code: '',
  Date: '',
  endDate: '',
});

// =======================
// FILTERED DATA
// =======================
const filteredPlan = computed(() => {
  return planningData.value.filter((exam) => {
    // Recherche par classe
    if (
      searchQuery.value &&
      exam.classe_nom &&
      !exam.classe_nom.toLowerCase().includes(searchQuery.value.toLowerCase())
    ) {
      return false;
    }

    return true;
  });
});

// =======================
// METHODS
// =======================
const toggleFilters = () => {
  showFilters.value = !showFilters.value;
};

const applyFilters = () => {
  showFilters.value = false;
};

const refreshData = () => {
  console.log('Refresh mock data');
};

const openAddModal = () => {
  currentExam.value = null;
  showModal.value = true;
};

const editExam = (exam) => {
  currentExam.value = { ...exam };
  showModal.value = true;
};

const confirmDelete = (exam) => {
  if (confirm(`Supprimer la planification pour ${exam.classe_nom} ?`)) {
    planningData.value = planningData.value.filter((item) => item.id !== exam.id);
  }
};

const closeModal = () => {
  showModal.value = false;
};

const saveExam = (examData) => {
  if (examData.id) {
    // update
    const index = planningData.value.findIndex((item) => item.id === examData.id);

    if (index !== -1) {
      planningData.value[index] = examData;
    }
  } else {
    // add
    examData.id = Date.now();

    planningData.value.push(examData);
  }

  closeModal();
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('fr-FR');
};

const getStatusClass = (status) => {
  const classes = {
    planifiée: 'bg-primary',
    en_attente: 'bg-warning',
    annulé: 'bg-danger',
    terminé: 'bg-success',
  };

  return classes[status] || 'bg-light text-dark';
};

const getStatusLabel = (status) => {
  if (status === 'planifiée') return 'Planifiée';
  if (status === 'en_attente') return 'En attente';
  if (status === 'annulé') return 'Annulé';
  if (status === 'terminé') return 'Terminé';

  return status;
};
</script>
