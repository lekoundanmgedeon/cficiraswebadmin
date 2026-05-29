<template>
  <div>
    <!-- Header Intégré et Adapté au Dossier Étudiant -->
    <div class="row mb-4">
      <div class="row align-items-center">
        <div class="col-md-8">
          <nav aria-label="breadcrumb">
            <ol class="breadcrumb mb-2">
              <li class="breadcrumb-item">
                <a href="#" class="text-decoration-none">Étudiants</a>
              </li>
              <li class="breadcrumb-item active" aria-current="page">Dossier Académique</li>
            </ol>
          </nav>
          <!-- Affichage dynamique du nom de l'étudiant -->
          <h3 class="fw-bold text-dark mb-1">
            {{
              currentStudent
                ? `${currentStudent.nom} ${currentStudent.prenom}`
                : "Chargement de l'étudiant..."
            }}
          </h3>
          <p class="text-muted small mb-0" v-if="currentStudent">
            <span class="badge bg-light text-dark border me-2"
              >Matricule: {{ currentStudent.matricule }}</span
            >
            <i class="bi bi-mortarboard me-1"></i> Classe :
            <strong class="text-secondary me-2">{{ currentStudent.classe }}</strong> | Filière :
            <strong class="text-secondary">{{ currentStudent.filiere }}</strong>
          </p>
        </div>
        <div class="col-md-4 text-md-end mt-3 mt-md-0">
          <button class="btn btn-outline-secondary btn-sm me-2" @click="goBack">
            <i class="bi bi-arrow-left me-1"></i> Retour
          </button>
          <button class="btn btn-primary btn-sm px-3" :disabled="isExporting" @click="printDossier">
            <span v-if="isExporting" class="spinner-border spinner-border-sm me-1"></span>
            <i v-else class="bi bi-printer me-1"></i> Imprimer le dossier
          </button>
        </div>
      </div>
    </div>

    <!-- Section Contenu avec Onglets et Loader -->
    <div class="row">
      <div class="col-md-12 grid-margin stretch-card">
        <div class="card border-0 shadow-sm">
          <SkeletonLoader v-if="loading" type="table" :rows="3" :columns="1" />
          <div v-else class="card-body dashboard-tabs p-0">
            <DossierTab />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import DossierTab from './components/tabs/ParcourTab.vue';
// Importez votre SkeletonLoader s'il n'est pas global
// import SkeletonLoader from '@/components/shared/SkeletonLoader.vue';

const route = useRoute();
const router = useRouter();

// États réactifs
const loading = ref(true);
const isExporting = ref(false);
const currentStudent = ref(null);

// Récupération de l'ID de l'étudiant depuis l'URL
const studentId = computed(() => route.params.id);

const goBack = () => router.back();

// Fonction d'impression / export du dossier
const printDossier = async () => {
  isExporting.value = true;
  try {
    // Insérez votre logique d'export ou d'impression (window.print() ou API)
    window.print();
  } catch (error) {
    console.error("Erreur lors de l'impression", error);
  } finally {
    isExporting.value = false;
  }
};

// Simulation de la récupération des données de l'étudiant au chargement
onMounted(async () => {
  loading.value = true;
  try {
    // Remplacez cette simulation par l'appel à votre Store (ex: etudiantStore.getEtudiantById(studentId.value))
    await new Promise((resolve) => setTimeout(resolve, 800)); // Faux délai
    currentStudent.value = {
      id: studentId.value,
      matricule: 'ETU-2026-001',
      nom: 'DIOP',
      prenom: 'Moussa',
      filiere: 'Informatique',
      classe: 'INF-L3',
    };
  } catch (error) {
    console.error('Impossible de charger le dossier', error);
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.card {
  background-color: #ffffff;
  border: 1px solid #dee2e6;
  border-radius: 12px;
}
.btn-primary {
  background-color: #007bff;
  border-color: #007bff;
  color: #fff;
}
.btn-primary:hover {
  background-color: #0056b3;
  border-color: #004080;
}
.status-badge {
  padding: 0.5em 1em;
  border-radius: 20px;
  font-size: 0.85rem;
  color: #fff;
}
.status-draft {
  background-color: #6c757d;
}
.status-active {
  background-color: #0d6efd;
}
.table thead th {
  border-bottom: 2px solid #dee2e6;
}
</style>
