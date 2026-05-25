<template>
  <div class="semester-stats-container">
    <div class="row mb-4">
      <div class="col-12 d-flex justify-content-between align-items-center flex-wrap gap-3">
        <div>
          <h3 class="fw-bold text-dark mb-1">Analytique & Statistiques Semestrielles</h3>
          <p class="text-muted text-sm mb-0">
            Aperçu des indicateurs de performance, volume d'heures global et suivi de l'assiduité par cycle académique.
          </p>
        </div>

        <div class="d-flex align-items-center gap-2">
          <label class="text-xs text-muted text-uppercase fw-bold mb-0">Année :</label>
          <select
            v-model="selectedPeriod"
            class="form-select text-sm bg-white border border-secondary-subtle py-1.5 px-3 shadow-none style-select"
            :disabled="loading"
          >
            <option 
              v-for="option in dynamicOptions" 
              :key="option.value" 
              :value="option.value"
            >
              {{ option.label }}
            </option>
          </select>
        </div>
      </div>
    </div>

    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status"></div>
      <p class="text-muted text-sm mt-2">Calcul des métriques en cours...</p>
    </div>

    <template v-else-if="analyticsData">
      <div class="row g-3 mb-4">
        <div class="col-xl-3 col-sm-6">
          <div class="card border-0 shadow-sm bg-white rounded-4 p-3 h-100 border-start border-4 border-primary">
            <div class="d-flex align-items-center justify-content-between">
              <div>
                <span class="text-xs text-muted text-uppercase fw-bold tracking-wider d-block mb-1">Volume Horaire global</span>
                <h3 class="fw-bold text-dark mb-0 font-monospace">
                  {{ formatNumber(analyticsData.kpis?.volume_horaire_global) }} <small class="fs-6 text-muted">H</small>
                </h3>
              </div>
              <div class="kpi-icon-wrapper bg-soft-primary text-primary">
                <i class="mdi mdi-clock-outline"></i>
              </div>
            </div>
            <div class="mt-2 text-xs text-muted">
              Heures cumulées sur la période
            </div>
          </div>
        </div>

        <div class="col-xl-3 col-sm-6">
          <div class="card border-0 shadow-sm bg-white rounded-4 p-3 h-100 border-start border-4 border-success">
            <div class="d-flex align-items-center justify-content-between">
              <div>
                <span class="text-xs text-muted text-uppercase fw-bold tracking-wider d-block mb-1">Taux d'Assiduité Global</span>
                <h3 class="fw-bold text-success mb-0 font-monospace">
                  {{ analyticsData.kpis?.taux_assiduite_global || '0' }} <small class="fs-6">%</small>
                </h3>
              </div>
              <div class="kpi-icon-wrapper bg-soft-success text-success">
                <i class="mdi mdi-account-check-outline"></i>
              </div>
            </div>
            <div class="mt-2 text-xs text-muted">
              Seuil de tolérance fixé à <span class="fw-bold">85%</span>
            </div>
          </div>
        </div>

        <div class="col-xl-3 col-sm-6">
          <div class="card border-0 shadow-sm bg-white rounded-4 p-3 h-100 border-start border-4 border-info">
            <div class="d-flex align-items-center justify-content-between">
              <div>
                <span class="text-xs text-muted text-uppercase fw-bold tracking-wider d-block mb-1">Corps Enseignant</span>
                <h3 class="fw-bold text-dark mb-0 font-monospace">
                  {{ analyticsData.kpis?.corps_enseignant_total || 0 }} <small class="fs-6 text-muted">Prof.</small>
                </h3>
              </div>
              <div class="kpi-icon-wrapper bg-soft-info text-info">
                <i class="mdi mdi-tie"></i>
              </div>
            </div>
            <div class="mt-2 text-xs text-muted">
              Intervenants déployés
            </div>
          </div>
        </div>

        <div class="col-xl-3 col-sm-6">
          <div class="card border-0 shadow-sm bg-white rounded-4 p-3 h-100 border-start border-4 border-warning">
            <div class="d-flex align-items-center justify-content-between">
              <div>
                <span class="text-xs text-muted text-uppercase fw-bold tracking-wider d-block mb-1">Unités d'Enseignement</span>
                <h3 class="fw-bold text-dark mb-0 font-monospace">
                  {{ analyticsData.kpis?.total_ues || 0 }} <small class="fs-6 text-muted">UE</small>
                </h3>
              </div>
              <div class="kpi-icon-wrapper bg-soft-warning text-warning">
                <i class="mdi mdi-book-open-variant"></i>
              </div>
            </div>
            <div class="mt-2 text-xs text-muted">
              Planifiées au catalogue
            </div>
          </div>
        </div>
      </div>

      <div class="row g-4">
        <div class="col-xl-8">
          <div class="card border-0 shadow-sm bg-white rounded-4 p-4 h-100">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h5 class="fw-bold text-dark mb-0">Charge d'Enseignement par Semestre</h5>
              <span class="badge bg-light text-secondary border font-monospace text-xs px-2.5 py-1.5">Vue d'ensemble analytique</span>
            </div>

            <div class="table-responsive">
              <table class="table align-middle text-center mb-0">
                <thead class="table-light-header text-secondary">
                  <tr>
                    <th class="text-start ps-3" style="width: 15%">Semestre</th>
                    <th class="text-start" style="width: 25%">Filière cible</th>
                    <th style="width: 15%">Nombre d'UE</th>
                    <th style="width: 15%">Volume total</th>
                    <th style="width: 15%">Moy. Validation</th>
                    <th class="text-end pe-3" style="width: 15%">Alerte Équipe</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="stat in analyticsData.matrix" :key="stat.semestre_id" class="stats-row">
                    <td class="text-start ps-3 font-monospace fw-bold text-primary">
                      {{ stat.semestre_code }}
                    </td>

                    <td class="text-start">
                      <div class="fw-bold text-dark text-truncate" style="max-width: 180px" :title="stat.filiere">
                        {{ stat.filiere }}
                      </div>
                      <small class="text-xs text-muted">{{ stat.niveau }}</small>
                    </td>

                    <td class="font-monospace fw-bold text-secondary">
                      {{ stat.nb_ues }}
                    </td>

                    <td class="font-monospace text-dark fw-bold">{{ stat.total_heures }} h</td>

                    <td class="font-monospace">
                      <span class="fw-bold text-dark">{{ stat.moyenne_generale || '-' }}</span>
                      <span v-if="stat.moyenne_generale" class="text-muted text-xs">/20</span>
                    </td>

                    <td class="text-end pe-3">
                      <span
                        class="badge text-xs px-2.5 py-1.5 rounded-pill font-semibold"
                        :class="stat.statut_maquette === 'Conforme' ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-danger-subtle text-danger border border-danger-subtle'"
                      >
                        {{ stat.statut_maquette || 'Inconnu' }}
                      </span>
                    </td>
                  </tr>
                  <tr v-if="!analyticsData.matrix || analyticsData.matrix.length === 0">
                    <td colspan="6" class="text-center py-4 text-muted small">Aucune donnée matricielle disponible</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div class="col-xl-4">
          <div class="card border-0 shadow-sm bg-white rounded-4 p-4 h-100">
            <h5 class="fw-bold text-dark mb-1">Typologie des Enseignements</h5>
            <p class="text-muted text-xs mb-4">
              Répartition en volume d'heures par type d'unité pédagogique.
            </p>

            <div class="d-flex flex-column gap-4">
              <div v-for="(type, i) in analyticsData.typology" :key="i">
                <div class="d-flex justify-content-between align-items-center text-sm mb-1.5">
                  <span class="text-dark fw-bold">
                    <i class="mdi mdi-circle me-2 text-xs" :class="getTypologyColorClass(i)"></i>
                    Volume Groupe {{ i + 1 }}
                  </span>
                  <span class="text-muted font-monospace text-xs">
                    {{ type.volume_heures }} H ({{ type.pourcentage }}%)
                  </span>
                </div>
                <div class="progress" style="height: 6px;">
                  <div 
                    class="progress-bar" 
                    :class="getTypologyBgClass(i)" 
                    role="progressbar" 
                    :style="{ width: type.pourcentage + '%' }"
                    :aria-valuenow="type.pourcentage" 
                    aria-valuemin="0" 
                    aria-valuemax="100"
                  ></div>
                </div>
              </div>
              
              <div v-if="!analyticsData.typology || analyticsData.typology.length === 0" class="text-center text-muted small py-3">
                Aucune donnée de typologie
              </div>
            </div>

            <div class="mt-4 pt-3 border-top bg-light-subtle rounded p-2.5 text-xs text-muted d-flex align-items-start gap-2">
              <i class="mdi mdi-information-outline text-primary mt-0.5 fs-6"></i>
              <span>
                {{ analyticsData.llm_summary || "Les indicateurs reflètent la ventilation actuelle des maquettes de formation configurées pour cette session académique." }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useSemestreStore } from '@/stores/academiqueStore/semestreStore';

/* ========================================================
    Store Pinia
======================================================== */
const semestreStore = useSemestreStore();

// Filtre d'année locale
/**
 * Génère dynamiquement la période académique courante (ex: "2025-2026")
 * sur la base de la date d'aujourd'hui.
 */
const getDynamicAcademicPeriod = () => {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth(); // 0 = Janvier, 8 = Septembre

  // Si on est en septembre ou après, l'année académique commence cette année
  // Sinon (de janvier à août), on est dans la seconde moitié de l'année commencée l'an passé
  if (currentMonth >= 8) {
    return `${currentYear}-${currentYear + 1}`;
  } else {
    return `${currentYear - 1}-${currentYear}`;
  }
};

// Le ref est initialisé de manière totalement dynamique !
const selectedPeriod = ref(getDynamicAcademicPeriod());

// Génération dynamique des options du select (Année en cours + l'année précédente pour l'historique)
const dynamicOptions = computed(() => {
  const current = getDynamicAcademicPeriod();
  const [startYear, endYear] = current.split('-').map(Number);
  
  const previous = `${startYear - 1}-${startYear}`;
  
  return [
    { value: current, label: `${current} (En cours)` },
    { value: previous, label: previous }
  ];
});

/* ========================================================
    Computed State (Connecté à l'API)
======================================================== */
const loading = computed(() => semestreStore.loading);
const analyticsData = computed(() => semestreStore.analytics);

/* ========================================================
    Méthodes de requêtes & Formatage
======================================================== */
const loadDashboardStats = async () => {
  try {
    // On passe la période choisie en paramètre si ton action ou ton API le gère.
    // Si fetchAnalytics() ne prend pas de paramètre, il consomme par défaut l'URL de base.
    await semestreStore.fetchAnalytics(selectedPeriod.value);
  } catch (error) {
    console.error("Erreur lors de la récupération des analytics :", error);
  }
};

const formatNumber = (num) => {
  if (!num) return '0';
  return new Intl.NumberFormat('fr-FR').format(num);
};

// Couleurs alternées pour les types d'enseignements
const getTypologyColorClass = (index) => {
  const classes = ['text-primary', 'text-info', 'text-warning', 'text-danger'];
  return classes[index % classes.length];
};

const getTypologyBgClass = (index) => {
  const classes = ['bg-primary', 'bg-info', 'bg-warning', 'bg-danger'];
  return classes[index % classes.length];
};

/* ========================================================
    Watchers & Lifecycle
======================================================== */
// Recharge les données de l'API dès que l'utilisateur bascule d'année
watch(selectedPeriod, () => {
  loadDashboardStats();
});

onMounted(() => {
  loadDashboardStats();
});
</script>

<style scoped>
/* Couleurs douces de fond pour les icônes KPI */
.bg-soft-primary {
  background-color: rgba(0, 123, 255, 0.08);
}
.bg-soft-success {
  background-color: rgba(40, 167, 69, 0.08);
}
.bg-soft-info {
  background-color: rgba(23, 162, 184, 0.08);
}
.bg-soft-warning {
  background-color: rgba(255, 193, 7, 0.08);
}
.bg-soft-danger {
  background-color: rgba(220, 53, 69, 0.08);
}

.bg-light-subtle {
  background-color: #f8f9fa;
}

/* Tailles standardisées de l'UI globale */
.text-sm {
  font-size: 13px !important;
}
.text-xs {
  font-size: 11.5px !important;
}
.tracking-wider {
  letter-spacing: 0.8px;
}

/* Styles spécifiques aux boîtes KPI */
.kpi-icon-wrapper {
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  font-size: 20px;
}

/* En-tête des tableaux */
.table-light-header th {
  font-size: 11.5px;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  background-color: #f8f9fa;
  font-weight: 700;
  border: none;
}

/* Lignes du tableau */
.table tbody tr td {
  padding-top: 13px !important;
  padding-bottom: 13px !important;
}
.stats-row {
  border-bottom: 1px solid #f1f3f5;
  transition: background-color 0.1s ease;
}
.stats-row:hover {
  background-color: rgba(0, 0, 0, 0.005);
}

/* Micro barres de distribution horizontales (CSS natif léger) */
.custom-mini-bar-bg {
  width: 100%;
  height: 6px;
  background-color: #edf2f7;
  border-radius: 10px;
  overflow: hidden;
}
.custom-mini-bar-fill {
  height: 100%;
  border-radius: 10px;
}

/* Éléments de formulaire et conteneurs standardisés */
.rounded-4 {
  border-radius: 0.2rem !important;
}
.style-select {
  border-radius: 0.15rem;
}
.gap-3\.5 {
  gap: 14px !important;
}
</style>
