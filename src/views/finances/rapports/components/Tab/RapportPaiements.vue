<template>
  <div class="rapport-paiements-container">
    <!-- Header de la section -->
    <div class="col-12 mb-4">
      <h3 class="fw-bold mb-1">Rapport de Performance des Paiements</h3>
      <p class="text-muted small mb-0">
        <i class="bi bi-bar-chart-line-fill me-1"></i>
        Visualisation analytique des flux de trésorerie, répartition des modes de règlement et
        historique des encaissements.
      </p>
    </div>

    <!-- Section Graphique Analytics -->
    <div class="row mb-4 g-3">
      <!-- Camembert : répartition par mode de paiement -->
      <div class="col-md-5">
        <div class="card border-0 shadow-sm rounded-4 bg-white p-3 h-100">
          <h6 class="fw-bold text-dark mb-3 small text-uppercase text-secondary tracking-wider">
            <i class="bi bi-pie-chart text-primary me-2"></i>Modes de Règlement
          </h6>
          <div class="chart-container position-relative m-auto" style="height: 220px; width: 100%">
            <canvas id="chartModePaiement"></canvas>
          </div>
        </div>
      </div>

      <!-- Histogramme : montants encaissés par mois -->
      <div class="col-md-7">
        <div class="card border-0 shadow-sm rounded-4 bg-white p-3 h-100">
          <h6 class="fw-bold text-dark mb-3 small text-uppercase text-secondary tracking-wider">
            <i class="bi bi-graph-up-arrow text-success me-2"></i>Volume des Encaissements Mensuels
          </h6>
          <div class="chart-container position-relative" style="height: 220px; width: 100%">
            <canvas id="chartMontants"></canvas>
          </div>
        </div>
      </div>
    </div>

    <!-- Registre Complet du Rapport -->
    <div class="card shadow-sm border-0 rounded-4 overflow-hidden bg-white">
      <div class="card-header bg-white border-0 pt-4 px-4 pb-2">
        <h5 class="fw-bold text-dark mb-0">
          <i class="bi bi-list-check text-primary me-2"></i>Détail des flux comptabilisés
        </h5>
      </div>
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0 text-center">
            <thead class="bg-light text-secondary small">
              <tr>
                <th class="ps-4 py-3 text-start">Matricule</th>
                <th class="text-start">Nom & Prénom</th>
                <th>Montant</th>
                <th>Type de frais</th>
                <th>Statut</th>
                <th>Date</th>
                <th class="text-end pe-4">Mode</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="paiement in paiements" :key="paiement.id">
                <td class="ps-4 text-start font-monospace fw-bold text-primary">
                  {{ paiement.matricule }}
                </td>
                <td class="text-start fw-semibold text-dark">
                  {{ paiement.nom }} {{ paiement.prenom }}
                </td>
                <td class="fw-bold font-monospace">{{ formatCurrency(paiement.montant) }}</td>
                <td>
                  <span class="badge bg-light text-dark border">{{ paiement.type }}</span>
                </td>
                <td>
                  <span
                    class="badge px-3 py-1 rounded-pill fw-bold"
                    :class="
                      paiement.statut === 'Payé'
                        ? 'bg-soft-success text-success'
                        : 'bg-soft-warning text-warning'
                    "
                  >
                    <i
                      class="bi me-1"
                      :class="
                        paiement.statut === 'Payé' ? 'bi-check-circle-fill' : 'bi-clock-history'
                      "
                    ></i>
                    {{ paiement.statut }}
                  </span>
                </td>
                <td class="small text-muted font-monospace">{{ formatDate(paiement.date) }}</td>
                <td class="text-end pe-4">
                  <span class="small font-monospace bg-light px-2 py-1 rounded text-secondary">{{
                    paiement.mode
                  }}</span>
                </td>
              </tr>
              <tr v-if="paiements.length === 0">
                <td colspan="7" class="text-center py-5 text-muted">
                  <i class="bi bi-folder-x display-4 text-light d-block mb-2"></i>
                  <p class="small mb-0">Aucun paiement enregistré pour générer le rapport.</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import Chart from 'chart.js/auto';

const paiements = ref([]);
let chartModeInstance = null;
let chartMontantsInstance = null;

onMounted(() => {
  // Données consolidées
  paiements.value = [
    {
      id: 1,
      matricule: 'ETU-2026-001',
      nom: 'Diallo',
      prenom: 'Moussa',
      montant: 50000,
      type: 'Inscription',
      statut: 'Payé',
      date: '2026-01-15',
      mode: 'Mobile Money',
    },
    {
      id: 2,
      matricule: 'ETU-2026-002',
      nom: 'Ndiaye',
      prenom: 'Awa',
      montant: 30000,
      type: 'Cours',
      statut: 'Payé',
      date: '2026-02-10',
      mode: 'Espèces',
    },
    {
      id: 3,
      matricule: 'ETU-2026-003',
      nom: 'Kouassi',
      prenom: 'Jean',
      montant: 45000,
      type: 'Logement',
      statut: 'En attente',
      date: '2026-03-05',
      mode: 'Virement',
    },
  ];

  // 1. Logique d'analyse pour le graphique en Camembert (Mode)
  const modeCounts = {};
  paiements.value.forEach((p) => {
    modeCounts[p.mode] = (modeCounts[p.mode] || 0) + 1;
  });

  const ctxMode = document.getElementById('chartModePaiement');
  if (ctxMode) {
    chartModeInstance = new Chart(ctxMode, {
      type: 'doughnut', // Version épurée du Pie Chart classique
      data: {
        labels: Object.keys(modeCounts),
        datasets: [
          {
            data: Object.values(modeCounts),
            backgroundColor: ['#007bff', '#ffc107', '#28a745', '#dc3545'],
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } },
        },
      },
    });
  }

  // 2. Logique d'analyse pour l'histogramme mensuel
  const moisCounts = {};
  paiements.value.forEach((p) => {
    const mois = new Date(p.date).toLocaleString('fr-FR', { month: 'long' });
    const moisCapitalise = mois.charAt(0).toUpperCase() + mois.slice(1);
    moisCounts[moisCapitalise] = (moisCounts[moisCapitalise] || 0) + p.montant;
  });

  const ctxMontants = document.getElementById('chartMontants');
  if (ctxMontants) {
    chartMontantsInstance = new Chart(ctxMontants, {
      type: 'bar',
      data: {
        labels: Object.keys(moisCounts),
        datasets: [
          {
            label: 'Volume encaissé',
            data: Object.values(moisCounts),
            backgroundColor: 'rgba(40, 167, 69, 0.85)',
            borderRadius: 4,
            barThickness: 25,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { grid: { display: true, drawBorder: false }, ticks: { font: { size: 10 } } },
          x: { grid: { display: false } },
        },
      },
    });
  }
});

// Destruction propre des instances des charts pour prévenir les fuites de mémoire
onBeforeUnmount(() => {
  if (chartModeInstance) chartModeInstance.destroy();
  if (chartMontantsInstance) chartMontantsInstance.destroy();
});

const formatCurrency = (value) => {
  return new Intl.NumberFormat('fr-FR').format(value) + ' FCFA';
};

const formatDate = (dateStr) => {
  const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
  return new Date(dateStr).toLocaleDateString('fr-FR', options);
};
</script>

<style scoped>
/* Teintes douces Flat Design */
.bg-soft-success {
  background-color: rgba(40, 167, 69, 0.12);
}
.bg-soft-warning {
  background-color: rgba(255, 193, 7, 0.15);
}

.tracking-wider {
  letter-spacing: 0.5px;
}
.text-xs {
  font-size: 11px !important;
}

.table th {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: #6c757d;
  border: none;
}

.table tbody tr {
  border-bottom: 1px solid #f8f9fa;
}

/* Identité visuelle ERP */
.rounded-4 {
  border-radius: 0.2rem !important;
}
</style>
