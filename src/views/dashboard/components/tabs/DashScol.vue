<template>
  <div class="dash-scolarite-container">
    <!-- Section 1 : Métriques Spécifiques au Recouvrement -->
    <div class="row g-3 mb-4">
      <div class="col-md-3">
        <div class="card bg-white border-0 shadow-sm p-3 border-start border-primary border-3 rounded-4">
          <span class="text-muted small fw-semibold text-uppercase d-block mb-1">Total Facturé Annuel</span>
          <h4 class="fw-bold text-dark mb-1 font-monospace">48 500 000 FCFA</h4>
          <div class="text-xs text-muted">Objectif contractuel global</div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card bg-white border-0 shadow-sm p-3 border-start border-success border-3 rounded-4">
          <span class="text-muted small fw-semibold text-uppercase d-block mb-1">Taux de Recouvrement</span>
          <h4 class="fw-bold text-success mb-1 font-monospace">76.4 %</h4>
          <div class="progress rounded-pill mt-2" style="height: 5px;">
            <div class="progress-bar bg-success" role="progressbar" style="width: 76.4%"></div>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card bg-white border-0 shadow-sm p-3 border-start border-warning border-3 rounded-4">
          <span class="text-muted small fw-semibold text-uppercase d-block mb-1">Retards de Paiement (Traites)</span>
          <h4 class="fw-bold text-warning mb-1 font-monospace">4 350 000 FCFA</h4>
          <div class="text-xs text-danger font-semibold">
            <i class="bi bi-clock-history me-1"></i> Échéances dépassées
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card bg-white border-0 shadow-sm p-3 border-start border-danger border-3 rounded-4">
          <span class="text-muted small fw-semibold text-uppercase d-block mb-1">Dossiers au Contentieux</span>
          <h4 class="fw-bold text-danger mb-1 font-monospace">1 200 000 FCFA</h4>
          <div class="text-xs text-muted">Blocage portail/examens actif</div>
        </div>
      </div>
    </div>

    <div class="row g-3">
      <!-- Section 2 : Graphique Répartition des Encaissements par Filière -->
      <div class="col-lg-6">
        <div class="card border-0 shadow-sm rounded-4 bg-white p-4 h-100">
          <h6 class="fw-bold text-dark mb-3 small text-uppercase text-secondary tracking-wider">
            <i class="bi bi-bar-chart-fill text-primary me-2"></i>Volume Encaissé par Filière
          </h6>
          <div class="chart-container position-relative" style="height:250px; width:100%">
            <canvas id="chartScolFiliere"></canvas>
          </div>
        </div>
      </div>

      <!-- Section 3 : Liste des 4 plus gros retards de traites (Action immédiate) -->
      <div class="col-lg-6">
        <div class="card border-0 shadow-sm rounded-4 bg-white p-4 h-100 d-flex flex-column">
          <h6 class="fw-bold text-dark mb-3 small text-uppercase text-secondary tracking-wider">
            <i class="bi bi-exclamation-octagon-fill text-danger me-2"></i>Alertes Recouvrement Immédiates
          </h6>

          <div class="table-responsive flex-grow-1">
            <table class="table table-hover align-middle mb-0 text-center text-sm">
              <thead class="bg-light text-secondary text-xs">
                <tr>
                  <th class="text-start ps-2">Étudiant</th>
                  <th>Classe</th>
                  <th>Retard</th>
                  <th class="text-end pe-2">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="alerte in alertesRecouvrement" :key="alerte.id">
                  <td class="text-start ps-2">
                    <div class="fw-bold text-dark mb-0 text-xs">{{ alerte.nom }}</div>
                    <small class="text-muted font-monospace text-xs">{{ alerte.matricule }}</small>
                  </td>
                  <td class="font-monospace text-xs fw-semibold">{{ alerte.classe }}</td>
                  <td class="font-monospace text-xs text-danger fw-bold">{{ formatPrice(alerte.montant) }}</td>
                  <td class="text-end pe-2">
                    <button @click="lancerRelanceFlash(alerte)" class="btn btn-xs btn-light text-danger border-0 font-semibold py-1 px-2" style="font-size: 11px;">
                      <i class="bi bi-bell-fill"></i> Relancer
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import Chart from 'chart.js/auto';

let chartScolInstance = null;

const alertesRecouvrement = ref([
  { id: 1, matricule: 'ETU-2026-114', nom: 'Ibrahima Diallo', classe: 'M2-INFO', montant: 300000 },
  { id: 2, matricule: 'ETU-2026-005', nom: 'Amadou Fall', classe: 'L2-Droit', montant: 150000 },
  { id: 3, matricule: 'ETU-2026-089', nom: 'Penda Sy', classe: 'L3-Mgmt', montant: 120000 },
  { id: 4, matricule: 'ETU-2026-210', nom: 'Khadija Ba', classe: 'M1-Droit', montant: 225000 },
]);

onMounted(() => {
  const ctxScol = document.getElementById('chartScolFiliere');
  if (ctxScol) {
    chartScolInstance = new Chart(ctxScol, {
      type: 'bar',
      data: {
        labels: ['Informatique', 'Management', 'Sciences Juridiques', 'Génie Civil'],
        datasets: [
          {
            label: 'Montant Encaissé',
            data: [18500000, 11200000, 4350000, 3000000],
            backgroundColor: 'rgba(0, 123, 255, 0.85)',
            borderRadius: 2,
            maxBarThickness: 30,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { grid: { color: '#f8f9fa' }, ticks: { font: { size: 10 } } },
          x: { grid: { display: false }, ticks: { font: { size: 11 } } }
        }
      }
    });
  }
});

onBeforeUnmount(() => {
  if (chartScolInstance) chartScolInstance.destroy();
});

const formatPrice = (val) => {
  return new Intl.NumberFormat('fr-FR').format(val) + ' FCFA';
};

const lancerRelanceFlash = (alerte) => {
  alert(`Notification de mise en demeure envoyée à ${alerte.nom}.\nMontant réclamé : ${formatPrice(alerte.montant)} via SMS.`);
};
</script>

<style scoped>
/* Teintes douces Flat Design */
.bg-soft-primary { background-color: rgba(0, 123, 255, 0.08); }
.bg-soft-success { background-color: rgba(40, 167, 69, 0.12); }
.bg-soft-warning { background-color: rgba(255, 193, 7, 0.15); }
.bg-soft-danger { background-color: rgba(220, 53, 69, 0.08); }

.text-xs { font-size: 11px !important; }
.text-sm { font-size: 0.85rem; }
.tracking-wider { letter-spacing: 0.5px; }

.table th {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: #6c757d;
  border: none;
}

.table tbody tr {
  border-bottom: 1px solid #f8f9fa;
}

/* Alignement structurel strict de la charte ERP */
.rounded-4 {
  border-radius: 0.2rem !important;
}
</style>
