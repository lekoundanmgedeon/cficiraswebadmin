<template>
  <div class="dash-cycles-container">
    <!-- Section 1 : Métriques par Cycle d'Enseignement -->
    <div class="row g-3 mb-4">
      <!-- Cycle Licence -->
      <div class="col-md-4">
        <div
          class="card bg-white border-0 shadow-sm p-3 border-start border-primary border-3 rounded-4"
        >
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <span class="text-muted small fw-semibold text-uppercase d-block mb-1"
                >Cycle Licence</span
              >
              <h4 class="fw-bold text-dark mb-1 font-monospace">315 Étudiants</h4>
              <div class="text-xs text-muted">65.3% de l'effectif total • 12 classes</div>
            </div>
            <span class="badge bg-soft-primary text-primary rounded-pill font-monospace fw-bold"
              >L1-L3</span
            >
          </div>
        </div>
      </div>

      <!-- Cycle Master -->
      <div class="col-md-4">
        <div
          class="card bg-white border-0 shadow-sm p-3 border-start border-warning border-3 rounded-4"
        >
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <span class="text-muted small fw-semibold text-uppercase d-block mb-1"
                >Cycle Master</span
              >
              <h4 class="fw-bold text-dark mb-1 font-monospace">142 Étudiants</h4>
              <div class="text-xs text-muted">29.5% de l'effectif total • 6 classes</div>
            </div>
            <span class="badge bg-soft-warning text-warning rounded-pill font-monospace fw-bold"
              >M1-M2</span
            >
          </div>
        </div>
      </div>

      <!-- Certifications / Formations Courtes -->
      <div class="col-md-4">
        <div
          class="card bg-white border-0 shadow-sm p-3 border-start border-success border-3 rounded-4"
        >
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <span class="text-muted small fw-semibold text-uppercase d-block mb-1"
                >Certifications & Pro</span
              >
              <h4 class="fw-bold text-dark mb-1 font-monospace">25 Auditeurs</h4>
              <div class="text-xs text-muted">5.2% de l'effectif total • 2 groupes</div>
            </div>
            <span class="badge bg-soft-success text-success rounded-pill font-monospace fw-bold"
              >Certif</span
            >
          </div>
        </div>
      </div>
    </div>

    <div class="row g-3">
      <!-- Section 2 : Graphique Répartition des Cohortes par Niveau -->
      <div class="col-lg-7">
        <div class="card border-0 shadow-sm rounded-4 bg-white p-4 h-100">
          <h6 class="fw-bold text-dark mb-3 small text-uppercase text-secondary tracking-wider">
            <i class="bi bi-funnel-fill text-warning me-2"></i>Pyramide des Effectifs par Niveau
            (Cohortes)
          </h6>
          <div class="chart-container position-relative" style="height: 250px; width: 100%">
            <canvas id="chartNiveauxCycles"></canvas>
          </div>
        </div>
      </div>

      <!-- Section 3 : Indicateurs de Performance & Rétention des Cohortes -->
      <div class="col-lg-5">
        <div class="card border-0 shadow-sm rounded-4 bg-white p-4 h-100 d-flex flex-column">
          <h6 class="fw-bold text-dark mb-4 small text-uppercase text-secondary tracking-wider">
            <i class="bi bi-shield-check text-success me-2"></i>Santé & Rétention des Cohortes
          </h6>

          <div class="flex-grow-1">
            <!-- Taux de Remplissage Global -->
            <div class="mb-4">
              <div class="d-flex justify-content-between text-xs mb-1">
                <span class="fw-semibold text-muted">Taux d'Occupation des Salles/Classes</span>
                <span class="font-monospace fw-bold text-dark">84%</span>
              </div>
              <div class="progress rounded-pill" style="height: 6px">
                <div class="progress-bar bg-primary" role="progressbar" style="width: 84%"></div>
              </div>
            </div>

            <!-- Taux de Rétention L1 vers L2 -->
            <div class="mb-4">
              <div class="d-flex justify-content-between text-xs mb-1">
                <span class="fw-semibold text-muted">Taux de Rétention Académique (L1 ➔ L2)</span>
                <span class="font-monospace fw-bold text-success">91.2%</span>
              </div>
              <div class="progress rounded-pill" style="height: 6px">
                <div class="progress-bar bg-success" role="progressbar" style="width: 91.2%"></div>
              </div>
            </div>

            <!-- Taux de Persévérance Master -->
            <div class="mb-3">
              <div class="d-flex justify-content-between text-xs mb-1">
                <span class="fw-semibold text-muted"
                  >Fidélisation Cycle Interne (Licence ➔ Master)</span
                >
                <span class="font-monospace fw-bold text-warning">42.5%</span>
              </div>
              <div class="progress rounded-pill" style="height: 6px">
                <div class="progress-bar bg-warning" role="progressbar" style="width: 42.5%"></div>
              </div>
            </div>
          </div>

          <div
            class="p-3 bg-light rounded text-xs text-muted border-start border-3 border-primary mt-auto"
          >
            <span class="fw-bold text-dark d-block mb-1"
              ><i class="bi bi-info-circle me-1"></i>Note Secrétariat :</span
            >
            Le taux de rétention L1-L2 a progressé de +3.4% cette année grâce au déploiement
            anticipé du module de suivi des émargements et présences.
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount } from 'vue';
import Chart from 'chart.js/auto';

let chartCyclesInstance = null;

onMounted(() => {
  const ctxCycles = document.getElementById('chartNiveauxCycles');
  if (ctxCycles) {
    chartCyclesInstance = new Chart(ctxCycles, {
      type: 'bar',
      data: {
        labels: ['L1', 'L2', 'L3', 'M1', 'M2'],
        datasets: [
          {
            label: "Nombre d'apprenants",
            data: [130, 105, 80, 78, 64],
            backgroundColor: [
              'rgba(0, 123, 255, 0.85)', // L1
              'rgba(0, 123, 255, 0.85)', // L2
              'rgba(0, 123, 255, 0.85)', // L3
              'rgba(255, 193, 7, 0.85)', // M1
              'rgba(255, 193, 7, 0.85)', // M2
            ],
            borderRadius: 2,
            maxBarThickness: 35,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { grid: { color: '#f8f9fa' }, ticks: { font: { size: 10 } } },
          x: { grid: { display: false }, ticks: { font: { size: 11 } } },
        },
      },
    });
  }
});

onBeforeUnmount(() => {
  if (chartCyclesInstance) chartCyclesInstance.destroy();
});
</script>

<style scoped>
/* Teintes douces Flat Design harmonisées */
.bg-soft-primary {
  background-color: rgba(0, 123, 255, 0.08);
}
.bg-soft-warning {
  background-color: rgba(255, 193, 7, 0.15);
}
.bg-soft-success {
  background-color: rgba(40, 167, 69, 0.12);
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
