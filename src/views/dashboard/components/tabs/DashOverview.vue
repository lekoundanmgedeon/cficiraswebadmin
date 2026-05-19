<template>
  <div class="dash-overview-container">
    <!-- Section 1 : Métriques Flash (Santé Financière & Académique) -->
    <div class="row g-3 mb-4">
      <!-- Trésorerie Encaissée (Vue globale) -->
      <div class="col-md-3">
        <div
          class="card bg-white border-0 shadow-sm p-3 border-start border-success border-3 rounded-4"
        >
          <span class="text-muted small fw-semibold text-uppercase d-block mb-1"
            >Fonds Encaissés</span
          >
          <h4 class="fw-bold text-success mb-1 font-monospace">37 050 000 FCFA</h4>
          <div class="text-xs text-muted">
            <i class="bi bi-graph-up text-success me-1"></i> 76.4% du prévisionnel global
          </div>
        </div>
      </div>

      <!-- Restes à Recouvrer (Échéanciers en attente) -->
      <div class="col-md-3">
        <div
          class="card bg-white border-0 shadow-sm p-3 border-start border-warning border-3 rounded-4"
        >
          <span class="text-muted small fw-semibold text-uppercase d-block mb-1"
            >Restes à Recouvrer</span
          >
          <h4 class="fw-bold text-warning mb-1 font-monospace">11 450 000 FCFA</h4>
          <div class="text-xs text-danger">
            <i class="bi bi-exclamation-triangle-fill me-1"></i> Retards critiques inclus
          </div>
        </div>
      </div>

      <!-- Total Inscrits (Donnée dynamique issue du registre) -->
      <div class="col-md-3">
        <div
          class="card bg-white border-0 shadow-sm p-3 border-start border-primary border-3 rounded-4"
        >
          <span class="text-muted small fw-semibold text-uppercase d-block mb-1"
            >Effectif Étudiants</span
          >
          <h4 class="fw-bold text-primary mb-1 font-monospace">482 Inscrits</h4>
          <div class="text-xs text-muted">
            <i class="bi bi-plus-lg text-primary me-1"></i> +12% vs année précédente
          </div>
        </div>
      </div>

      <!-- Masse des Honoraires Vacataires -->
      <div class="col-md-3">
        <div
          class="card bg-white border-0 shadow-sm p-3 border-start border-danger border-3 rounded-4"
        >
          <span class="text-muted small fw-semibold text-uppercase d-block mb-1"
            >Charges de Vacation</span
          >
          <h4 class="fw-bold text-danger mb-1 font-monospace">2 800 000 FCFA</h4>
          <div class="text-xs text-muted">
            <i class="bi bi-clock me-1"></i> Clôture mensuelle en cours
          </div>
        </div>
      </div>
    </div>

    <!-- Section 2 : Analytics & Alertes Flash IA -->
    <div class="row g-3">
      <!-- Graphique : Évolution Mensuelle Comparée (Recouvrement vs Charges) -->
      <div class="col-lg-8">
        <div class="card border-0 shadow-sm rounded-4 bg-white p-4 h-100">
          <div class="d-flex justify-content-between align-items-center mb-4">
            <h6 class="fw-bold text-dark mb-0 small text-uppercase text-secondary tracking-wider">
              <i class="bi bi-activity text-primary me-2"></i>Flux de Trésorerie Opérationnelle
            </h6>
            <span class="badge bg-light text-secondary border font-monospace text-xs"
              >Année Académique 2025-2026</span
            >
          </div>
          <div class="chart-container position-relative" style="height: 250px; width: 100%">
            <canvas id="chartFluxGlobal"></canvas>
          </div>
        </div>
      </div>

      <!-- Widget : Flash Informations & Copilote IA -->
      <div class="col-lg-4">
        <div class="card border-0 shadow-sm rounded-4 bg-white p-4 h-100 d-flex flex-column">
          <h6 class="fw-bold text-dark mb-3 small text-uppercase text-secondary tracking-wider">
            <i class="bi bi-robot text-primary me-2"></i>Flash Diagnostics IA
          </h6>

          <div class="flex-grow-1">
            <!-- Alerte 1 -->
            <div
              class="p-2 bg-soft-warning rounded text-xs mb-2 border-start border-3 border-warning"
            >
              <span class="fw-bold text-dark d-block mb-1">Alerte Échéancier critique</span>
              La filière <strong class="text-warning">Sciences Juridiques (L2-A)</strong> présente
              un taux d'impayés de 55% sur la traite de mai. Une campagne de relance SMS est
              préconisée.
            </div>

            <!-- Alerte 2 -->
            <div
              class="p-2 bg-soft-success rounded text-xs mb-2 border-start border-3 border-success"
            >
              <span class="fw-bold text-dark d-block mb-1">Seuil de Rentabilité Atteint</span>
              Le pôle <strong class="text-success">Management & Masters</strong> a entièrement
              couvert ses charges fixes trimestrielles à la date du 15 mai.
            </div>

            <!-- Alerte 3 -->
            <div class="p-2 bg-soft-danger rounded text-xs border-start border-3 border-danger">
              <span class="fw-bold text-dark d-block mb-1">Risque Masse Salariale</span>
              La simulation budgétaire montre qu'une hausse de 5% du taux des vacations dégraderait
              la marge opérationnelle de 1.6%.
            </div>
          </div>

          <div class="pt-3 border-top border-light mt-3 text-center">
            <button
              class="btn btn-xs btn-outline-primary border-0 font-semibold p-0 w-100 small text-xs"
            >
              Ouvrir le Copilote IA complet <i class="bi bi-arrow-right ms-1"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount } from 'vue';
import Chart from 'chart.js/auto';

let chartFluxInstance = null;

onMounted(() => {
  const ctxFlux = document.getElementById('chartFluxGlobal');
  if (ctxFlux) {
    chartFluxInstance = new Chart(ctxFlux, {
      type: 'line',
      data: {
        labels: ['Janv', 'Févr', 'Mars', 'Avril', 'Mai'],
        datasets: [
          {
            label: 'Encaissements Scolarité',
            data: [12000000, 9500000, 7100000, 8450000, 5000000],
            borderColor: '#28a745',
            backgroundColor: 'rgba(40, 167, 69, 0.05)',
            tension: 0.2,
            fill: true,
            borderWidth: 2,
          },
          {
            label: 'Dépenses & Vacations',
            data: [2500000, 2800000, 2600000, 2800000, 2800000],
            borderColor: '#dc3545',
            backgroundColor: 'transparent',
            tension: 0,
            borderDash: [5, 5],
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top', labels: { boxWidth: 12, font: { size: 11 } } },
        },
        scales: {
          y: { grid: { color: '#f8f9fa' }, ticks: { font: { size: 10 } } },
          x: { grid: { display: false }, ticks: { font: { size: 11 } } },
        },
      },
    });
  }
});

onBeforeUnmount(() => {
  if (chartFluxInstance) chartFluxInstance.destroy();
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
