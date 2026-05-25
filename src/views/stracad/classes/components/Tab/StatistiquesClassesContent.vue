<template>
  <div class="row g-3 mb-4">
    <template v-if="loading">
      <div v-for="i in 4" :key="i" class="col-xl-3 col-md-6">
        <div class="card border-0 shadow-sm p-3">
          <div class="d-flex align-items-center placeholder-glow">
            <div
              class="placeholder rounded-circle bg-secondary me-3"
              style="width: 48px; height: 48px"
            ></div>
            <div class="w-100">
              <div class="placeholder col-4 mb-2" style="height: 12px"></div>
              <div class="placeholder col-7" style="height: 24px"></div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <template v-else-if="stats">
      <div class="col-xl-3 col-md-6">
        <div class="card border-0 shadow-sm h-100 card-kpi">
          <div class="card-body d-flex align-items-center">
            <div class="icon-shape bg-primary-subtle text-primary rounded-circle me-3">
              <i class="mdi mdi-google-classroom fs-3"></i>
            </div>
            <div>
              <span class="text-muted small text-uppercase fw-semibold">Total Classes</span>
              <h3 class="mb-0 mt-1 fw-bold text-dark">{{ stats.total_classes }}</h3>
            </div>
          </div>
        </div>
      </div>

      <div class="col-xl-3 col-md-6">
        <div class="card border-0 shadow-sm h-100 card-kpi">
          <div class="card-body d-flex align-items-center">
            <div class="icon-shape bg-info-subtle text-info rounded-circle me-3">
              <i class="mdi mdi-account-group fs-3"></i>
            </div>
            <div>
              <span class="text-muted small text-uppercase fw-semibold">Capacité Globale</span>
              <h3 class="mb-0 mt-1 fw-bold text-dark">
                {{ stats.capacite_totale_etablissement }}
                <small class="fs-6 text-muted">places</small>
              </h3>
            </div>
          </div>
        </div>
      </div>

      <div class="col-xl-3 col-md-6">
        <div class="card border-0 shadow-sm h-100 card-kpi">
          <div class="card-body d-flex align-items-center">
            <div class="icon-shape bg-success-subtle text-success rounded-circle me-3">
              <i class="mdi mdi-school fs-3"></i>
            </div>
            <div>
              <span class="text-muted small text-uppercase fw-semibold">Étudiants Inscrits</span>
              <h3 class="mb-0 mt-1 fw-bold text-dark">{{ stats.total_etudiants_inscrits }}</h3>
            </div>
          </div>
        </div>
      </div>

      <div class="col-xl-3 col-md-6">
        <div class="card border-0 shadow-sm h-100 card-kpi">
          <div class="card-body d-flex align-items-center">
            <div class="icon-shape bg-warning-subtle text-warning rounded-circle me-3">
              <i class="mdi mdi-seat-passenger fs-3"></i>
            </div>
            <div>
              <span class="text-muted small text-uppercase fw-semibold">Places Disponibles</span>
              <h3 class="mb-0 mt-1 fw-bold text-dark">{{ stats.places_disponibles_globales }}</h3>
            </div>
          </div>
        </div>
      </div>
      <div class="col-12 mt-3">
        <div class="card border-0 shadow-sm p-3">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <span class="fw-semibold text-muted small text-uppercase"
              >Taux d'occupation général</span
            >
            <span class="badge bg-primary">{{ tauxOccupation }}%</span>
          </div>
          <div class="progress" style="height: 12px">
            <div
              class="progress-bar progress-bar-striped progress-bar-animated"
              role="progressbar"
              :style="{ width: tauxOccupation + '%' }"
              :class="tauxOccupation > 90 ? 'bg-danger' : 'bg-success'"
            ></div>
          </div>
          <small class="text-muted mt-2 d-block">
            {{ stats.total_etudiants_inscrits }} places occupées sur un total de
            {{ stats.capacite_totale_etablissement }}
          </small>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useClasseStore } from '@/stores/academiqueStore/classeStore';

const classeStore = useClasseStore();

onMounted(async () => {
  await classeStore.fetchAnalytics();
});

const loading = computed(() => classeStore.loading);
const stats = computed(() => classeStore.analytics);

// ---- NOUVEAUX CALCULS DYNAMIQUES ----

const tauxOccupation = computed(() => {
  if (!stats.value) return 0;
  const inscrits = parseInt(stats.value.total_etudiants_inscrits, 10);
  const capacite = parseInt(stats.value.capacite_totale_etablissement, 10);
  return capacite > 0 ? ((inscrits / capacite) * 100).toFixed(2) : 0;
});

const moyenneEtudiantsParClasse = computed(() => {
  if (!stats.value) return 0;
  const inscrits = parseInt(stats.value.total_etudiants_inscrits, 10);
  const classes = parseInt(stats.value.total_classes, 10);
  return classes > 0 ? (inscrits / classes).toFixed(1) : 0;
});
</script>

<style scoped>
.icon-shape {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.card-kpi {
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.card-kpi:hover {
  transform: translateY(-2px);
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.08) !important;
}
</style>
