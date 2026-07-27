<template>
  <div class="dash-overview-container">
    <!-- Section 1 : Métriques d'établissement -->
    <div class="row g-3 mb-4">
      <div class="col-md-3">
        <div
          class="card bg-white border-0 shadow-sm p-3 border-start border-primary border-3 rounded-4"
        >
          <span class="text-muted small fw-semibold text-uppercase d-block mb-1"
            >Effectif Étudiants</span
          >
          <h4 class="fw-bold text-primary mb-1 font-monospace">
            {{ formatNombre(infrastructure.total_etudiants_inscrits) }} Inscrits
          </h4>
          <div class="text-xs text-muted">
            <i class="bi bi-people me-1"></i> Répartis sur
            {{ formatNombre(infrastructure.total_classes) }} classes
          </div>
        </div>
      </div>

      <div class="col-md-3">
        <div
          class="card bg-white border-0 shadow-sm p-3 border-start border-success border-3 rounded-4"
        >
          <span class="text-muted small fw-semibold text-uppercase d-block mb-1"
            >Taux de Remplissage</span
          >
          <h4 class="fw-bold text-success mb-1 font-monospace">
            {{ tauxRemplissage.toFixed(1) }} %
          </h4>
          <div class="progress rounded-pill mt-2" style="height: 5px">
            <div
              class="progress-bar bg-success"
              role="progressbar"
              :style="{ width: `${Math.min(tauxRemplissage, 100)}%` }"
            ></div>
          </div>
        </div>
      </div>

      <div class="col-md-3">
        <div
          class="card bg-white border-0 shadow-sm p-3 border-start border-info border-3 rounded-4"
        >
          <span class="text-muted small fw-semibold text-uppercase d-block mb-1"
            >Capacité d'Accueil</span
          >
          <h4 class="fw-bold text-info mb-1 font-monospace">
            {{ formatNombre(infrastructure.capacite_totale_etablissement) }} Places
          </h4>
          <div class="text-xs text-muted">
            <i class="bi bi-building me-1"></i> Capacité cumulée des classes
          </div>
        </div>
      </div>

      <div class="col-md-3">
        <div
          class="card bg-white border-0 shadow-sm p-3 border-start border-warning border-3 rounded-4"
        >
          <span class="text-muted small fw-semibold text-uppercase d-block mb-1"
            >Places Disponibles</span
          >
          <h4 class="fw-bold text-warning mb-1 font-monospace">
            {{ formatNombre(infrastructure.places_disponibles_globales) }}
          </h4>
          <div class="text-xs text-muted">
            <i class="bi bi-door-open me-1"></i> Encore ouvertes à l'inscription
          </div>
        </div>
      </div>
    </div>

    <!-- Section 2 : Répartition par cycle + diagnostics -->
    <div class="row g-3">
      <div class="col-lg-8">
        <div class="card border-0 shadow-sm rounded-4 bg-white p-4 h-100">
          <div class="d-flex justify-content-between align-items-center mb-4">
            <h6 class="fw-bold text-dark mb-0 small text-uppercase text-secondary tracking-wider">
              <i class="bi bi-activity text-primary me-2"></i>Répartition des Effectifs par Cycle
            </h6>
            <span class="badge bg-light text-secondary border font-monospace text-xs">
              {{ cycles.length }} cycles
            </span>
          </div>

          <LoadingSpinner v-if="loading && !cycles.length" />
          <EmptyState
            v-else-if="!cyclesPeuples.length"
            title="Aucun étudiant réparti"
            description="Les effectifs apparaîtront dès qu'une inscription sera enregistrée sur un cycle."
            :size="80"
          />
          <div v-else class="chart-container position-relative" style="height: 250px; width: 100%">
            <canvas ref="canvasCycles"></canvas>
          </div>
        </div>
      </div>

      <div class="col-lg-4">
        <div class="card border-0 shadow-sm rounded-4 bg-white p-4 h-100 d-flex flex-column">
          <h6 class="fw-bold text-dark mb-3 small text-uppercase text-secondary tracking-wider">
            <i class="bi bi-robot text-secondary me-2"></i>Flash Diagnostics IA
          </h6>

          <!--
            Ce panneau servait trois alertes entièrement inventées — dont une
            nommant une filière précise avec un taux d'impayés précis. Aucun
            moteur de diagnostic n'existe côté serveur. L'emplacement est
            conservé, son contenu ne ment plus.
          -->
          <div class="flex-grow-1 d-flex align-items-center justify-content-center">
            <EmptyState
              title="Diagnostics indisponibles"
              description="Aucun moteur d'analyse n'est raccordé à l'application. Ce panneau restera vide tant que le serveur n'en exposera pas."
              :size="70"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import Chart from 'chart.js/auto';
import { storeToRefs } from 'pinia';
import EmptyState from '@/shared/components/EmptyState.vue';
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue';
import { useDashboardStore } from '../../store';

const store = useDashboardStore();
// `storeToRefs` rend aussi les getters : `tauxRemplissage` et `cyclesPeuples`
// arrivent ici en refs, sans avoir à les réemballer dans un `computed`.
const { infrastructure, cycles, loading, tauxRemplissage, cyclesPeuples } = storeToRefs(store);

const canvasCycles = ref(null);
let instance = null;

const formatNombre = (valeur) => new Intl.NumberFormat('fr-FR').format(valeur ?? 0);

/**
 * Le canvas n'existe que lorsque des données peuplées sont là (il est sous
 * `v-else`). Le graphique se (re)construit donc après rendu, et l'instance
 * précédente est détruite : sans quoi Chart.js empile ses instances sur le même
 * canvas et fuit à chaque rechargement.
 */
const dessiner = async () => {
  await nextTick();
  instance?.destroy();
  instance = null;

  if (!canvasCycles.value || !cyclesPeuples.value.length) return;

  instance = new Chart(canvasCycles.value, {
    type: 'bar',
    data: {
      labels: cyclesPeuples.value.map((cycle) => cycle.cycle_code),
      datasets: [
        {
          label: "Nombre d'apprenants",
          data: cyclesPeuples.value.map((cycle) => cycle.nb_etudiants),
          backgroundColor: 'rgba(0, 123, 255, 0.85)',
          borderRadius: 2,
          maxBarThickness: 35,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            // Le code de cycle seul est cryptique : le diplôme le rend lisible.
            title: (items) => cyclesPeuples.value[items[0].dataIndex]?.diplome ?? '',
          },
        },
      },
      scales: {
        y: { grid: { color: '#f8f9fa' }, ticks: { font: { size: 10 }, precision: 0 } },
        x: { grid: { display: false }, ticks: { font: { size: 11 } } },
      },
    },
  });
};

watch(cyclesPeuples, dessiner);

onMounted(async () => {
  await store.fetchVueEnsemble();
  dessiner();
});

onBeforeUnmount(() => {
  instance?.destroy();
  instance = null;
});
</script>

<style scoped>
/* Teintes douces Flat Design standardisées */
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

.text-xs {
  font-size: 11px !important;
}
.tracking-wider {
  letter-spacing: 0.5px;
}

/* Alignement structurel strict de la charte ERP */
.rounded-4 {
  border-radius: 0.2rem !important;
}
</style>
