<template>
  <div class="dash-pedagogie-container">
    <!-- Section 1 : Métriques Clés d'Activité Pédagogique -->
    <div class="row g-3 mb-4">
      <!-- Volume d'heures dispensées -->
      <div class="col-md-3">
        <div
          class="card bg-white border-0 shadow-sm p-3 border-start border-info border-3 rounded-4"
        >
          <span class="text-muted small fw-semibold text-uppercase d-block mb-1"
            >Heures Effectuées</span
          >
          <h4 class="fw-bold text-dark mb-1 font-monospace">1 420 H</h4>
          <div class="text-xs text-muted">Cumul sur le semestre courant</div>
        </div>
      </div>

      <!-- Émargements en attente de validation -->
      <div class="col-md-3">
        <div
          class="card bg-white border-0 shadow-sm p-3 border-start border-warning border-3 rounded-4"
        >
          <span class="text-muted small fw-semibold text-uppercase d-block mb-1"
            >Cahiers de Texte à Valider</span
          >
          <h4 class="fw-bold text-warning mb-1 font-monospace">18 Classes</h4>
          <div class="text-xs text-warning font-semibold">
            <i class="bi bi-exclamation-circle-fill me-1"></i> Bloque le calcul des vacations
          </div>
        </div>
      </div>

      <!-- Budget Vacations Engagé -->
      <div class="col-md-3">
        <div
          class="card bg-white border-0 shadow-sm p-3 border-start border-danger border-3 rounded-4"
        >
          <span class="text-muted small fw-semibold text-uppercase d-block mb-1"
            >Honoraires Engagés</span
          >
          <h4 class="fw-bold text-danger mb-1 font-monospace">14 200 000 FCFA</h4>
          <div class="progress rounded-pill mt-2" style="height: 5px">
            <div class="progress-bar bg-danger" role="progressbar" style="width: 65%"></div>
          </div>
        </div>
      </div>

      <!-- Nombre de formateurs actifs -->
      <div class="col-md-3">
        <div
          class="card bg-white border-0 shadow-sm p-3 border-start border-primary border-3 rounded-4"
        >
          <span class="text-muted small fw-semibold text-uppercase d-block mb-1"
            >Corps Enseignant</span
          >
          <h4 class="fw-bold text-primary mb-1 font-monospace">42 Professionnels</h4>
          <div class="text-xs text-muted">35 vacataires • 7 permanents</div>
        </div>
      </div>
    </div>

    <div class="row g-3">
      <!-- Section 2 : Graphique d'Avancement des Heures par Département -->
      <div class="col-lg-6">
        <div class="card border-0 shadow-sm rounded-4 bg-white p-4 h-100">
          <h6 class="fw-bold text-dark mb-3 small text-uppercase text-secondary tracking-wider">
            <i class="bi bi-hourglass-split text-info me-2"></i>Consommation des Heures par Pôle
          </h6>
          <div class="chart-container position-relative" style="height: 250px; width: 100%">
            <canvas id="chartPedagogieHeures"></canvas>
          </div>
        </div>
      </div>

      <!-- Section 3 : Validation des Émargements Enseignants -->
      <div class="col-lg-6">
        <div class="card border-0 shadow-sm rounded-4 bg-white p-4 h-100 d-flex flex-column">
          <h6 class="fw-bold text-dark mb-3 small text-uppercase text-secondary tracking-wider">
            <i class="bi bi-check-all text-success me-2"></i>Clôture des Vacations du Mois
          </h6>

          <div class="table-responsive flex-grow-1">
            <table class="table table-hover align-middle mb-0 text-center text-sm">
              <thead class="bg-light text-secondary text-xs">
                <tr>
                  <th class="text-start ps-2">Formateur</th>
                  <th>Cours / Module</th>
                  <th>Heures</th>
                  <th class="text-end pe-2">État Prévu</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="enseignant in suiviVacations" :key="enseignant.id">
                  <td class="text-start ps-2">
                    <div class="fw-bold text-dark mb-0 text-xs">{{ enseignant.nom }}</div>
                    <small class="text-muted text-xs">{{ enseignant.statut }}</small>
                  </td>
                  <td class="text-muted text-xs text-truncate" style="max-width: 150px">
                    {{ enseignant.matiere }}
                  </td>
                  <td class="font-monospace text-xs fw-bold">{{ enseignant.heures }} H</td>
                  <td class="text-end pe-2">
                    <span class="badge px-2 py-1 rounded" :class="getStatutClass(enseignant.etat)">
                      {{ enseignant.etat }}
                    </span>
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

let chartPedagInstance = null;

const suiviVacations = ref([
  {
    id: 1,
    nom: 'Dr. Amadou Diallo',
    statut: 'Vacataire',
    matiere: 'Algorithmique Avancée',
    heures: 36,
    etat: 'Validé',
  },
  {
    id: 2,
    nom: 'Prof. Awa Ndiaye',
    statut: 'Vacataire',
    matiere: 'Droit des Affaires',
    heures: 24,
    etat: 'À valider',
  },
  {
    id: 3,
    nom: 'M. Oumar Sy',
    statut: 'Permanent',
    matiere: 'Architecture Systèmes',
    heures: 16,
    etat: 'Validé',
  },
  {
    id: 4,
    nom: 'Mme Khadija Ba',
    statut: 'Vacataire',
    matiere: 'Comptabilité Générale',
    heures: 30,
    etat: 'En litige',
  },
]);

onMounted(() => {
  const ctxPedag = document.getElementById('chartPedagogieHeures');
  if (ctxPedag) {
    chartPedagInstance = new Chart(ctxPedag, {
      type: 'bar',
      data: {
        labels: ['Tech / Info', 'Management', 'Droit', 'Tronc Commun'],
        datasets: [
          {
            label: 'Heures Planifiées',
            data: [600, 450, 300, 200],
            backgroundColor: '#e3e6f0',
            borderRadius: 2,
            maxBarThickness: 25,
          },
          {
            label: 'Heures Réalisées',
            data: [480, 410, 210, 180],
            backgroundColor: '#17a2b8',
            borderRadius: 2,
            maxBarThickness: 25,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top', labels: { boxWidth: 10, font: { size: 11 } } },
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
  if (chartPedagInstance) chartPedagInstance.destroy();
});

const getStatutClass = (etat) => {
  if (etat === 'Validé') return 'bg-soft-success text-success';
  if (etat === 'À valider') return 'bg-soft-warning text-warning fw-bold';
  if (etat === 'En litige') return 'bg-soft-danger text-danger';
  return 'bg-light text-dark';
};
</script>

<style scoped>
/* Code couleurs du Design System de l'ERP */
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
