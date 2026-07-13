<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import Chart from 'chart.js/auto';
import EmptyState from '@/shared/components/EmptyState.vue';
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue';
import ExportMenu from '@/shared/components/ExportMenu.vue';
import { useTableExport } from '@/shared/composables/useTableExport';
import { useInscriptionStore } from '../../store';
import { STATUT_LIST, formatMoney, normalizeStatut } from '../../constants';

/**
 * Statistiques des inscriptions.
 *
 * `StatsRapports.vue` était un mockup intégral : « 1 284 inscriptions »,
 * « 12.5M FCFA », « 94.2 % de rétention », un graphique aux barres figées
 * `[40, 60, 45, 90, 65, 85, 100]` et un `topFilieres` en dur. Son bouton
 * « Générer PDF » appelait `console.log`. Aucun store, aucune API.
 *
 * Le backend n'expose pas de statistiques d'inscription, mais il n'en a pas
 * besoin : tout ce qui était simulé ici se déduit de `GET /inscriptions` et de
 * `GET /inscriptions/finances`, deux endpoints bien réels. Et « Générer PDF »
 * génère maintenant un PDF.
 */

const store = useInscriptionStore();
const { items: inscriptions, financeTotals, loading } = storeToRefs(store);

/** Teinte unique : les barres comparent des magnitudes, la couleur ne porte pas d'identité. */
const HUE = '#4b49ac';

const filiereCanvas = ref(null);
const anneeCanvas = ref(null);

/** @type {{filiere: Chart|null, annee: Chart|null}} */
const charts = { filiere: null, annee: null };

onMounted(() => {
  store.fetchAll();
  store.fetchFinances();
});

const total = computed(() => inscriptions.value.length);

const enAttente = computed(
  () =>
    inscriptions.value.filter(
      (inscription) => normalizeStatut(inscription.inscription_statut) === 'EN_ATTENTE'
    ).length
);

/** Part des frais effectivement encaissée. */
const tauxRecouvrement = computed(() => {
  const { total_collecte: collecte, total_attente: attente } = financeTotals.value;
  const attendu = collecte + attente;
  if (attendu <= 0) return 0;
  return Math.round((collecte / attendu) * 100);
});

/**
 * Compte les inscriptions par valeur d'une clé, du plus fréquent au moins fréquent.
 * @param {string} key
 * @returns {Array<{label: string, value: number}>}
 */
function countBy(key) {
  const counts = new Map();

  for (const inscription of inscriptions.value) {
    const label = inscription[key] ?? 'Non renseigné';
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

const parFiliere = computed(() => countBy('filiere_nom'));

/** L'axe des années se lit dans l'ordre chronologique, pas par effectif. */
const parAnnee = computed(() =>
  countBy('annee_code').sort((a, b) => String(a.label).localeCompare(String(b.label)))
);

const parStatut = computed(() =>
  STATUT_LIST.map((statut) => ({
    ...statut,
    value: inscriptions.value.filter(
      (inscription) => normalizeStatut(inscription.inscription_statut) === statut.code
    ).length,
  })).filter((statut) => statut.value > 0)
);

const exportRows = computed(() =>
  parFiliere.value.map((ligne) => ({
    Filière: ligne.label,
    Inscriptions: ligne.value,
    Part: total.value > 0 ? `${Math.round((ligne.value / total.value) * 100)} %` : '0 %',
  }))
);

const { exportToExcel, exportToPdf } = useTableExport({
  rows: exportRows,
  title: 'Statistiques des inscriptions',
  fileBaseName: 'statistiques_inscriptions',
  filters: () => [
    { label: 'Total inscriptions', value: total.value },
    { label: 'En attente', value: enAttente.value },
    { label: 'Total collecté', value: formatMoney(financeTotals.value.total_collecte) },
    { label: 'Taux de recouvrement', value: `${tauxRecouvrement.value} %` },
    { label: "Date d'édition", value: new Date().toLocaleDateString('fr-FR') },
  ],
});

/**
 * @param {HTMLCanvasElement} canvas
 * @param {Array<{label: string, value: number}>} data
 * @param {'y'|'x'} indexAxis
 */
function buildBarChart(canvas, data, indexAxis) {
  return new Chart(canvas, {
    type: 'bar',
    data: {
      labels: data.map((item) => item.label),
      datasets: [
        {
          data: data.map((item) => item.value),
          backgroundColor: HUE,
          borderRadius: 4,
          barThickness: indexAxis === 'y' ? 14 : 28,
        },
      ],
    },
    options: {
      indexAxis,
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        // Une seule série : le titre de la carte la nomme, aucune légende requise.
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context) => `${context.parsed[indexAxis === 'y' ? 'x' : 'y']} inscription(s)`,
          },
        },
      },
      scales: {
        x: {
          beginAtZero: true,
          ticks: { precision: 0, color: '#6c757d' },
          grid: { color: '#eef2f7' },
        },
        y: {
          beginAtZero: true,
          ticks: { precision: 0, color: '#52514e' },
          grid: { display: false },
        },
      },
    },
  });
}

function renderCharts() {
  if (filiereCanvas.value) {
    charts.filiere?.destroy();
    charts.filiere = buildBarChart(filiereCanvas.value, parFiliere.value, 'y');
  }

  if (anneeCanvas.value) {
    charts.annee?.destroy();
    charts.annee = buildBarChart(anneeCanvas.value, parAnnee.value, 'x');
  }
}

// Les canevas sont sous un `v-else` : ils n'existent qu'une fois les données là.
watch(
  [parFiliere, parAnnee],
  async () => {
    if (total.value === 0) return;
    await new Promise((resolve) => requestAnimationFrame(resolve));
    renderCharts();
  },
  { flush: 'post' }
);

// Sans cette destruction, revenir sur l'onglet (que `AppTabs` garde en vie via
// `KeepAlive`) échouerait sur « Canvas is already in use ».
onBeforeUnmount(() => {
  charts.filiere?.destroy();
  charts.annee?.destroy();
});
</script>

<template>
  <div>
    <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
      <div>
        <h4 class="fw-bold mb-1">Rapports et statistiques</h4>
        <p class="text-muted small mb-0">
          Indicateurs calculés sur les inscriptions et le suivi financier réels.
        </p>
      </div>
      <ExportMenu :disabled="total === 0" @excel="exportToExcel" @pdf="exportToPdf" />
    </div>

    <LoadingSpinner v-if="loading && total === 0" />

    <EmptyState
      v-else-if="total === 0"
      title="Aucune donnée à analyser"
      description="Les statistiques apparaîtront dès la première inscription enregistrée."
    />

    <div v-else>
      <div class="row g-3 mb-4">
        <div class="col-md-3">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-body">
              <span class="text-muted small fw-semibold text-uppercase d-block mb-1">
                Inscriptions
              </span>
              <h3 class="fw-bold text-dark mb-0 font-monospace">{{ total }}</h3>
            </div>
          </div>
        </div>

        <div class="col-md-3">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-body">
              <span class="text-muted small fw-semibold text-uppercase d-block mb-1">
                Dossiers en attente
              </span>
              <h3
                class="fw-bold mb-0 font-monospace"
                :class="enAttente > 0 ? 'text-warning' : 'text-dark'"
              >
                {{ enAttente }}
              </h3>
            </div>
          </div>
        </div>

        <div class="col-md-3">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-body">
              <span class="text-muted small fw-semibold text-uppercase d-block mb-1">
                Total collecté
              </span>
              <h3 class="fw-bold text-success mb-0">
                {{ formatMoney(financeTotals.total_collecte) }}
              </h3>
            </div>
          </div>
        </div>

        <div class="col-md-3">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-body">
              <span class="text-muted small fw-semibold text-uppercase d-block mb-1">
                Taux de recouvrement
              </span>
              <h3 class="fw-bold text-dark mb-0 font-monospace">{{ tauxRecouvrement }} %</h3>
              <div class="progress mt-2" style="height: 5px">
                <div
                  class="progress-bar bg-success rounded"
                  role="progressbar"
                  :style="{ width: tauxRecouvrement + '%' }"
                  :aria-valuenow="tauxRecouvrement"
                  aria-valuemin="0"
                  aria-valuemax="100"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="card border-0 shadow-sm mb-4">
        <div class="card-body">
          <h6 class="fw-bold mb-3">Répartition par statut</h6>
          <div class="d-flex flex-wrap gap-3">
            <div
              v-for="statut in parStatut"
              :key="statut.code"
              class="border rounded px-3 py-2 d-flex align-items-center"
            >
              <span
                class="badge rounded-pill me-2"
                :class="`bg-${statut.variant}-subtle text-${statut.variant}`"
              >
                {{ statut.label }}
              </span>
              <span class="fw-bold text-dark">{{ statut.value }}</span>
              <span class="text-muted small ms-1">
                ({{ Math.round((statut.value / total) * 100) }} %)
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="row g-4">
        <div class="col-lg-7">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-body">
              <h6 class="fw-bold mb-3">Inscriptions par filière</h6>
              <div class="chart-holder">
                <canvas ref="filiereCanvas"></canvas>
              </div>
            </div>
          </div>
        </div>

        <div class="col-lg-5">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-body">
              <h6 class="fw-bold mb-3">Inscriptions par année</h6>
              <div class="chart-holder">
                <canvas ref="anneeCanvas"></canvas>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chart-holder {
  position: relative;
  height: 320px;
}
</style>
