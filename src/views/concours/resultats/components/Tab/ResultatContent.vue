<template>
  <div class="container-fluid py-4 animate__animated animate__fadeIn">
    
    <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
      <div>
        <h4 class="fw-bold text-dark mb-1">
          <i class="bi bi-bar-chart-line text-primary me-2"></i>Analyses & Statistiques
        </h4>
        <p class="text-muted small mb-0">
          Suivez les indicateurs de performance, la parité des candidats et comparez les résultats aux sessions précédentes.
        </p>
      </div>

      <div class="d-flex gap-2">
        <select v-model="selectedYear" class="form-select form-select-sm fw-semibold text-dark border-primary-subtle" style="width: 160px;">
          <option :value="2026">Session 2026</option>
          <option :value="2025">Session 2025</option>
          <option :value="2024">Session 2024</option>
        </select>
        <button class="btn btn-sm btn-primary d-inline-flex align-items-center gap-1.5" @click="exportStatistiques">
          <i class="bi bi-download"></i>
          <span>Exporter le rapport</span>
        </button>
      </div>
    </div>

    <h5 class="fw-bold text-secondary text-uppercase font-monospace text-xs mb-3">Vue d'ensemble de la session</h5>
    
    <div class="row g-3 mb-4">
      <div class="col-12 col-sm-6 col-lg-3">
        <div class="card border shadow-sm rounded-3 p-3 bg-white">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <span class="text-muted text-xs text-uppercase fw-semibold">Total Postulants</span>
            <div class="bg-primary-subtle text-primary rounded p-1.5 px-2 text-sm">
              <i class="bi bi-people-fill"></i>
            </div>
          </div>
          <h3 class="fw-extrabold text-dark mb-1 font-monospace">{{ globalStats.totalCandidats }}</h3>
          <span class="text-success text-xs fw-medium">
            <i class="bi bi-arrow-up-right me-0.5"></i>+12.4% <span class="text-muted">vs 2025</span>
          </span>
        </div>
      </div>

      <div class="col-12 col-sm-6 col-lg-3">
        <div class="card border shadow-sm rounded-3 p-3 bg-white">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <span class="text-muted text-xs text-uppercase fw-semibold">Taux de Présence</span>
            <div class="bg-success-subtle text-success rounded p-1.5 px-2 text-sm">
              <i class="bi bi-calendar-check-fill"></i>
            </div>
          </div>
          <h3 class="fw-extrabold text-dark mb-1 font-monospace">{{ globalStats.tauxPresence }}%</h3>
          <span class="text-muted text-xs">Candidats ayant composé</span>
        </div>
      </div>

      <div class="col-12 col-sm-6 col-lg-3">
        <div class="card border shadow-sm rounded-3 p-3 bg-white">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <span class="text-muted text-xs text-uppercase fw-semibold">Moyenne Globale</span>
            <div class="bg-warning-subtle text-warning rounded p-1.5 px-2 text-sm">
              <i class="bi bi-award-fill"></i>
            </div>
          </div>
          <h3 class="fw-extrabold text-dark mb-1 font-monospace">{{ globalStats.moyenneGenerale }}</h3>
          <span class="text-muted text-xs">Sur un barème de 20.00</span>
        </div>
      </div>

      <div class="col-12 col-sm-6 col-lg-3">
        <div class="card border shadow-sm rounded-3 p-3 bg-white">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <span class="text-muted text-xs text-uppercase fw-semibold">Avancement</span>
            <div class="bg-info-subtle text-info rounded p-1.5 px-2 text-sm">
              <i class="bi bi-check-circle-fill"></i>
            </div>
          </div>
          <h3 class="fw-extrabold text-dark mb-1 font-monospace">{{ globalStats.concoursTermines }} / {{ globalStats.totalConcours }}</h3>
          <span class="text-muted text-xs">Éditions délibérées</span>
        </div>
      </div>
    </div>

    <div class="row g-4 mb-5">
      <div class="col-12 col-md-6">
        <div class="card border shadow-sm rounded-3 h-100 bg-white">
          <div class="card-header bg-transparent border-0 pt-3 pb-0">
            <h6 class="fw-bold text-dark mb-0">Répartition par Genre (Parité)</h6>
          </div>
          <div class="card-body d-flex flex-column justify-content-center">
            <div class="d-flex justify-content-between text-sm fw-medium mb-1.5">
              <span class="text-primary"><i class="bi bi-gender-male me-1"></i>Hommes ({{ globalStats.repartitionGenre.hommes }}%)</span>
              <span class="text-purple"><i class="bi bi-gender-female me-1"></i>Femmes ({{ globalStats.repartitionGenre.femmes }}%)</span>
            </div>
            <div class="progress rounded-pill shadow-sm" style="height: 16px;">
              <div class="progress-bar bg-primary" role="progressbar" :style="{ width: globalStats.repartitionGenre.hommes + '%' }"></div>
              <div class="progress-bar bg-purple" role="progressbar" :style="{ width: globalStats.repartitionGenre.femmes + '%' }"></div>
            </div>
          </div>
        </div>
      </div>

      <div class="col-12 col-md-6">
        <div class="card border shadow-sm rounded-3 h-100 bg-white">
          <div class="card-header bg-transparent border-0 pt-3 pb-2">
            <h6 class="fw-bold text-dark mb-0">Top 3 des concours les plus demandés</h6>
          </div>
          <div class="card-body py-2">
            <div v-for="(concours, idx) in globalStats.topConcours" :key="idx" class="mb-2.5">
              <div class="d-flex justify-content-between text-xs mb-1">
                <span class="fw-semibold text-dark">{{ concours.libelle }}</span>
                <span class="font-monospace text-muted fw-bold">{{ concours.inscrits }} inscrits</span>
              </div>
              <div class="progress rounded-flat" style="height: 6px;">
                <div class="progress-bar bg-secondary" role="progressbar" :style="{ width: (concours.inscrits / globalStats.totalCandidats * 100) * 2 + '%' }"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="card border shadow-sm rounded-3 bg-white">
      <div class="card-header bg-light py-3 border-bottom">
        <h6 class="fw-bold mb-0 text-dark d-flex align-items-center gap-2">
          <i class="bi bi-arrow-left-right text-secondary"></i>
          <span>Évolution des Sessions et Comparaisons Historiques</span>
        </h6>
      </div>

      <div class="table-responsive">
        <table class="table table-hover align-middle mb-0 text-sm">
          <thead class="table-light text-uppercase font-monospace text-xs border-top-0">
            <tr>
              <th class="ps-3" style="width: 15%">Année / Session</th>
              <th class="text-center" style="width: 20%">Total Inscriptions</th>
              <th class="text-center" style="width: 20%">Candidats Composants</th>
              <th class="text-center" style="width: 20%">Taux d'Admission Moyen</th>
              <th class="text-end pe-3" style="width: 25%">Progression Annuelle</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in comparisonStats" :key="row.annee" :class="{ 'table-primary-subtle fw-semibold': row.annee === selectedYear }">
              <td class="ps-3 font-monospace fs-6 fw-bold text-dark">
                {{ row.annee }}
                <span v-if="row.annee === 2026" class="badge bg-primary text-xs ms-1 rounded-pill fw-medium text-capitalize">Actuelle</span>
              </td>

              <td class="text-center font-monospace fw-bold text-secondary">
                {{ row.totalInscriptions.toLocaleString() }}
              </td>

              <td class="text-center font-monospace text-muted">
                {{ row.totalComposants.toLocaleString() }}
              </td>

              <td class="text-center font-monospace text-dark fw-semibold">
                {{ row.tauxAdmission }}%
              </td>

              <td class="text-end pe-3 font-monospace">
                <span v-if="row.progression > 0" class="text-success fw-bold">
                  <i class="bi bi-caret-up-fill me-1"></i>+{{ row.progression }}%
                </span>
                <span v-else-if="row.progression < 0" class="text-danger fw-bold">
                  <i class="bi bi-caret-down-fill me-1"></i>{{ row.progression }}%
                </span>
                <span v-else class="text-muted fw-medium">
                  Stable (0%)
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useNotifier } from '@/stores/messages/useNotifier';

const { notifySuccess } = useNotifier();

// États de filtrage
const selectedYear = ref(2026);

// États de données analytiques
const globalStats = ref({ repartitionGenre: {}, topConcours: [] });
const comparisonStats = ref([]);

onMounted(() => {
  loadStatistiquesData();
});

// Recharger les données si l'utilisateur change d'année focus
watch(selectedYear, () => {
  loadStatistiquesData();
  notifySuccess(`Données analytiques de la session ${selectedYear.value} chargées.`);
});

const loadStatistiquesData = () => {
  // Agrégats provenant typiquement de tes requêtes SQL "COUNT", "AVG", "GROUP BY" exécutées côté Express
  globalStats.value = {
    totalCandidats: 1450,
    tauxPresence: 94.2,
    moyenneGenerale: '11.82',
    totalConcours: 8,
    concoursTermines: 5,
    repartitionGenre: { hommes: 58, femmes: 42 },
    topConcours: [
      { libelle: 'Génie Informatique & Systèmes', inscrits: 620 },
      { libelle: 'Licence Management & RH', inscrits: 410 },
      { libelle: 'Sciences Médicales', inscrits: 280 }
    ]
  };

  comparisonStats.value = [
    { annee: 2026, totalInscriptions: 1450, totalComposants: 1365, tauxAdmission: 32.5, progression: 12.4 },
    { annee: 2025, totalInscriptions: 1290, totalComposants: 1210, tauxAdmission: 34.1, progression: 8.2 },
    { annee: 2024, totalInscriptions: 1192, totalComposants: 1105, tauxAdmission: 29.8, progression: -2.1 },
    { annee: 2023, totalInscriptions: 1218, totalComposants: 1150, tauxAdmission: 31.0, progression: 0 }
  ];
};

const exportStatistiques = () => {
  console.log('Génération et exportation du PDF/Excel récapitulatif des performances');
};
</script>

<style scoped>
.text-xs { font-size: 0.75rem; }
.text-sm { font-size: 0.875rem; }
.fw-extrabold { font-weight: 800; }

.bg-purple { background-color: #ba68c8; }
.text-purple { color: #9c27b0; }

.progress-bar {
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.rounded-flat {
  border-radius: 2px;
}

.mb-2\.5 {
  margin-bottom: 0.65rem;
}

.table-primary-subtle {
  background-color: rgba(13, 110, 253, 0.04);
}

.gap-1\.5 { gap: 0.375rem; }
</style>