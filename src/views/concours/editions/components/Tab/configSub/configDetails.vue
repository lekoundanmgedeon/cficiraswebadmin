<template>
  <div class="row mb-4">
    <div class="row align-items-center">
      <div class="col-md-8">
        <nav aria-label="breadcrumb">
          <ol class="breadcrumb mb-2">
            <li class="breadcrumb-item"><a href="#" class="text-decoration-none">Editions</a></li>
            <li class="breadcrumb-item active" aria-current="page">Configuration</li>
          </ol>
        </nav>
        <h3 class="fw-bold text-dark mb-1">
          {{ currentSession?.designation || 'Chargement du concours...' }}
        </h3>
        <p class="text-muted small mb-0" v-if="currentSession">
          <span class="badge bg-light text-dark border me-2"
            >Code: {{ currentSession.code_annee }}</span
          >
          <i class="bi bi-clock me-1"></i> Période :
          <strong class="text-secondary">{{ formatDate(currentSession.date_debut) }}</strong> au
          <strong class="text-secondary">{{ formatDate(currentSession.date_fin) }}</strong>
        </p>
      </div>
      <div class="col-md-4 text-md-end mt-3 mt-md-0">
        <button class="btn btn-outline-secondary btn-sm me-2" @click="goBack">
          <i class="bi bi-arrow-left me-1"></i> Retour
        </button>
        <button
          class="btn btn-primary btn-sm px-3"
          :disabled="globalSaving"
          @click="saveAllPlanifications"
        >
          <span v-if="globalSaving" class="spinner-border spinner-border-sm me-1"></span>
          <i v-else class="bi bi-cloud-arrow-up me-1"></i> Proclamations
        </button>
      </div>
    </div>
  </div>

  <div class="row">
    <div class="col-12">
      <div class="card">
        <div class="card-body dashboard-tabs p-0">
          <TabDetail />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useConcoursStore } from '@/stores/gestionStores/concourStore';
import { useNotifier } from '@/stores/messages/useNotifier';
import TabDetail from './configTab.vue';

const route = useRoute();
const router = useRouter();
const concoursStore = useConcoursStore();
const { notifyError, notifySuccess } = useNotifier();

// États locaux requis par votre template
const globalSaving = ref(false);

// 1. Récupérer l'ID depuis les paramètres de la route URL
const concoursId = computed(() => route.params.id);

// 2. Trouver le concours correspondant dans le store Pinia
const currentSession = computed(() => {
  return concoursStore.concoursList.find(
    (concour) => String(concour.id) === String(concoursId.value)
  );
});

const goBack = () => router.back();

const saveAllPlanifications = async () => {
  globalSaving.value = true;
  try {
    // Insérez votre logique de sauvegarde ici
    notifySuccess('Planifications enregistrées avec succès !');
  } catch (error) {
    notifyError('Erreur lors de la sauvegarde.');
  } finally {
    globalSaving.value = false;
  }
};

const formatDate = (dateStr) => {
  if (!dateStr) return 'Non définie';
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

// Sécurité : Si l'utilisateur actualise la page directement sur cette URL,
// on s'assure que la liste du store est chargée.
onMounted(async () => {
  if (!concoursStore.concoursList || concoursStore.concoursList.length === 0) {
    await concoursStore.fetchConcours();
  }
});
</script>

<style scoped>
.planification-container {
  padding: 20px;
}

.page-title {
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 0;
}

.page-subtitle {
  font-size: 0.9rem;
}

.filter-section {
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
}

.nav-tabs .nav-link {
  color: #495057;
  font-weight: 500;
  border: none;
  padding: 0.75rem 1.5rem;
}

.nav-tabs .nav-link.active {
  color: #4c74f4;
  border-bottom: 3px solid #4c74f4;
  background-color: transparent;
}

.table th {
  font-weight: 600;
  text-transform: uppercase;
  font-size: 0.8rem;
  color: #6c757d;
}

.badge {
  padding: 0.35em 0.65em;
  font-size: 0.75em;
  font-weight: 500;
  border-radius: 50rem;
}
</style>
