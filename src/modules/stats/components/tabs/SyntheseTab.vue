<template>
  <div>
    <!-- Métriques de résultats -->
    <div class="row g-3 mb-4">
      <div class="col-md-3">
        <div
          class="card bg-white border-0 shadow-sm p-3 border-start border-primary border-3 rounded-4"
        >
          <span class="text-muted small fw-semibold text-uppercase d-block mb-1"
            >Bulletins Calculés</span
          >
          <h4 class="fw-bold text-primary mb-1 font-monospace">{{ synthese.effectif }}</h4>
          <div class="text-xs text-muted">
            <i class="bi bi-file-earmark-text me-1"></i>
            {{ synthese.publies }} publié(s)
          </div>
        </div>
      </div>

      <div class="col-md-3">
        <div
          class="card bg-white border-0 shadow-sm p-3 border-start border-success border-3 rounded-4"
        >
          <span class="text-muted small fw-semibold text-uppercase d-block mb-1"
            >Taux de Réussite</span
          >
          <h4 class="fw-bold text-success mb-1 font-monospace">{{ tauxReussite.toFixed(1) }} %</h4>
          <div class="progress rounded-pill mt-2" style="height: 5px">
            <div
              class="progress-bar bg-success"
              role="progressbar"
              :style="{ width: `${Math.min(tauxReussite, 100)}%` }"
            ></div>
          </div>
        </div>
      </div>

      <div class="col-md-3">
        <div
          class="card bg-white border-0 shadow-sm p-3 border-start border-info border-3 rounded-4"
        >
          <span class="text-muted small fw-semibold text-uppercase d-block mb-1"
            >Moyenne Générale</span
          >
          <h4 class="fw-bold text-info mb-1 font-monospace">
            {{ formatMoyenne(synthese.moyenne) }}
          </h4>
          <div class="text-xs text-muted">
            <i class="bi bi-arrows-vertical me-1"></i>
            de {{ formatMoyenne(synthese.moyenne_min) }} à
            {{ formatMoyenne(synthese.moyenne_max) }}
          </div>
        </div>
      </div>

      <div class="col-md-3">
        <div
          class="card bg-white border-0 shadow-sm p-3 border-start border-warning border-3 rounded-4"
        >
          <span class="text-muted small fw-semibold text-uppercase d-block mb-1">Rattrapages</span>
          <h4 class="fw-bold text-warning mb-1 font-monospace">{{ synthese.rattrapages }}</h4>
          <div class="text-xs text-muted">
            <i class="bi bi-arrow-repeat me-1"></i>
            {{ synthese.credits_acquis }} crédits acquis au total
          </div>
        </div>
      </div>
    </div>

    <div class="row g-3">
      <!-- Distribution des moyennes -->
      <div class="col-lg-7">
        <div class="card border-0 shadow-sm rounded-4 bg-white p-4 h-100">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <h6 class="fw-bold text-dark mb-0 small text-uppercase text-secondary tracking-wider">
              <i class="bi bi-bar-chart-fill text-primary me-2"></i>Distribution des Moyennes
            </h6>
            <ExportMenu @excel="exportToExcel" @pdf="exportToPdf" />
          </div>

          <LoadingSpinner v-if="loading && estVide" />
          <EmptyState
            v-else-if="estVide"
            title="Aucun bulletin calculé"
            description="Choisissez une classe, un semestre et une année, puis lancez le calcul depuis l'en-tête."
            :size="80"
          />
          <div v-else class="chart-container position-relative" style="height: 260px; width: 100%">
            <canvas ref="canvasDistribution"></canvas>
          </div>
        </div>
      </div>

      <!-- Décisions et mentions -->
      <div class="col-lg-5">
        <div class="card border-0 shadow-sm rounded-4 bg-white p-4 h-100 d-flex flex-column">
          <h6 class="fw-bold text-dark mb-3 small text-uppercase text-secondary tracking-wider">
            <i class="bi bi-clipboard-check text-success me-2"></i>Décisions & Mentions
          </h6>

          <EmptyState
            v-if="estVide"
            title="Rien à répartir"
            description="Les décisions apparaîtront une fois les bulletins calculés."
            :size="70"
          />
          <div v-else class="flex-grow-1">
            <div class="mb-4">
              <span class="text-muted small fw-semibold text-uppercase d-block mb-2"
                >Décisions</span
              >
              <div
                v-for="ligne in decisions"
                :key="ligne.decision"
                class="d-flex justify-content-between align-items-center mb-2"
              >
                <span class="badge text-xs" :class="infoDecision(ligne.decision).classe">
                  {{ infoDecision(ligne.decision).label }}
                </span>
                <span class="font-monospace fw-bold text-xs">{{ ligne.effectif }}</span>
              </div>
            </div>

            <div>
              <span class="text-muted small fw-semibold text-uppercase d-block mb-2">Mentions</span>
              <!--
                Une mention n'est décernée qu'au-dessus de la moyenne : la colonne
                est nulle en dessous, et le serveur écarte ces lignes. Une liste
                vide ici veut donc dire « personne n'a la moyenne », pas « données
                manquantes ».
              -->
              <p v-if="!mentions.length" class="text-muted text-xs mb-0">
                Aucune mention décernée sur ce périmètre.
              </p>
              <div
                v-for="ligne in mentions"
                :key="ligne.mention"
                class="d-flex justify-content-between align-items-center mb-2"
              >
                <span class="badge text-xs" :class="infoMention(ligne.mention).classe">
                  {{ infoMention(ligne.mention).label }}
                </span>
                <span class="font-monospace fw-bold text-xs">{{ ligne.effectif }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import Chart from 'chart.js/auto';
import { storeToRefs } from 'pinia';
import EmptyState from '@/shared/components/EmptyState.vue';
import ExportMenu from '@/shared/components/ExportMenu.vue';
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue';
import { useTableExport } from '@/shared/composables/useTableExport';
import { useStatsStore } from '../../store';
import { couleurTranche, formatMoyenne, infoDecision, infoMention } from '../../constants';

const store = useStatsStore();
const { synthese, decisions, mentions, loading, estVide, tauxReussite, distributionComplete } =
  storeToRefs(store);

const canvasDistribution = ref(null);
let instance = null;

const { exportToExcel, exportToPdf } = useTableExport({
  rows: computed(() =>
    distributionComplete.value.map((ligne) => ({
      Tranche: ligne.tranche,
      Étudiants: ligne.effectif,
    }))
  ),
  title: 'Distribution des moyennes',
  fileBaseName: 'distribution_moyennes',
});

const dessiner = async () => {
  await nextTick();
  instance?.destroy();
  instance = null;

  if (!canvasDistribution.value) return;

  instance = new Chart(canvasDistribution.value, {
    type: 'bar',
    data: {
      labels: distributionComplete.value.map((ligne) => ligne.tranche),
      datasets: [
        {
          label: "Nombre d'étudiants",
          data: distributionComplete.value.map((ligne) => ligne.effectif),
          backgroundColor: distributionComplete.value.map((ligne) => couleurTranche(ligne.tranche)),
          borderRadius: 2,
          maxBarThickness: 40,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { grid: { color: '#f8f9fa' }, ticks: { font: { size: 10 }, precision: 0 } },
        x: { grid: { display: false }, ticks: { font: { size: 11 } } },
      },
    },
  });
};

watch(distributionComplete, dessiner);
// Le canvas est sous `v-else` : il n'existe qu'une fois les données arrivées.
watch(estVide, dessiner);

onMounted(dessiner);

onBeforeUnmount(() => {
  instance?.destroy();
  instance = null;
});
</script>

<style scoped>
.bg-soft-primary {
  background-color: rgba(0, 123, 255, 0.08);
}
.bg-soft-success {
  background-color: rgba(40, 167, 69, 0.12);
}
.bg-soft-warning {
  background-color: rgba(255, 193, 7, 0.15);
}
.bg-soft-danger {
  background-color: rgba(220, 53, 69, 0.08);
}
.bg-soft-secondary {
  background-color: rgba(108, 117, 125, 0.1);
}

.text-xs {
  font-size: 11px !important;
}
.tracking-wider {
  letter-spacing: 0.5px;
}

.rounded-4 {
  border-radius: 0.2rem !important;
}
</style>
