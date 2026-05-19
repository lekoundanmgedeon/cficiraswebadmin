<template>
  <div class="row">
    <div class="col-12 mb-3">
      <h4>Statistiques des étudiants</h4>
      <p class="text-muted">
        Vue d’ensemble des étudiants par filière, classe et année académique.
      </p>
    </div>

    <!-- Cartes résumé -->
    <div class="row g-3 mb-4">
      <!-- Total Étudiants -->
      <div class="col-md-4">
        <div class="card bg-white border-0 shadow-sm p-3 border-start border-primary border-3 rounded-4">
          <div class="d-flex align-items-center justify-content-between">
            <div>
              <span class="text-muted small fw-semibold text-uppercase d-block mb-1">Effectif Global</span>
              <h3 class="fw-bold text-dark mb-0 font-monospace">{{ totalEtudiants }}</h3>
            </div>
            <div class="bg-soft-primary rounded p-2 text-primary">
              <i class="bi bi-people-fill fs-5"></i>
            </div>
          </div>
        </div>
      </div>

      <!-- Total Filières -->
      <div class="col-md-4">
        <div class="card bg-white border-0 shadow-sm p-3 border-start border-success border-3 rounded-4">
          <div class="d-flex align-items-center justify-content-between">
            <div>
              <span class="text-muted small fw-semibold text-uppercase d-block mb-1">Filières Actives</span>
              <h3 class="fw-bold text-dark mb-0 font-monospace">{{ totalFilieres }}</h3>
            </div>
            <div class="bg-soft-success rounded p-2 text-success">
              <i class="bi bi-diagram-3-fill fs-5"></i>
            </div>
          </div>
        </div>
      </div>

      <!-- Total Classes -->
      <div class="col-md-4">
        <div class="card bg-white border-0 shadow-sm p-3 border-start border-warning border-3 rounded-4">
          <div class="d-flex align-items-center justify-content-between">
            <div>
              <span class="text-muted small fw-semibold text-uppercase d-block mb-1">Groupes & Classes</span>
              <h3 class="fw-bold text-dark mb-0 font-monospace">{{ totalClasses }}</h3>
            </div>
            <div class="bg-soft-warning rounded p-2 text-warning">
              <i class="bi bi-mortarboard-fill fs-5"></i>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Graphiques -->
    <div class="row">
      <div class="col-md-6 mb-4">
        <div class="card shadow-sm">
          <div class="card-body">
            <h5 class="card-title">Répartition par filière</h5>
            <canvas id="chartFiliere"></canvas>
          </div>
        </div>
      </div>
      <div class="col-md-6 mb-4">
        <div class="card shadow-sm">
          <div class="card-body">
            <h5 class="card-title">Répartition par année académique</h5>
            <canvas id="chartAnnee"></canvas>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import Chart from 'chart.js/auto';

const etudiants = ref([]);

// Totaux
const totalEtudiants = ref(0);
const totalFilieres = ref(0);
const totalClasses = ref(0);

onMounted(() => {
  // Simulation API
  etudiants.value = [
    {
      id: 1,
      nom: 'Diallo',
      prenom: 'Mamadou',
      filiere: 'Informatique',
      classe: 'L1-INFO-A',
      annee_academique: '2024-2025',
    },
    {
      id: 2,
      nom: 'Ndiaye',
      prenom: 'Awa',
      filiere: 'Informatique',
      classe: 'L2-INFO-B',
      annee_academique: '2024-2025',
    },
    {
      id: 3,
      nom: 'Kouassi',
      prenom: 'Jean',
      filiere: 'Administration',
      classe: 'M1-ADM-A',
      annee_academique: '2023-2024',
    },
    {
      id: 4,
      nom: 'Ba',
      prenom: 'Fatou',
      filiere: 'Administration',
      classe: 'M1-ADM-B',
      annee_academique: '2024-2025',
    },
  ];

  totalEtudiants.value = etudiants.value.length;
  totalFilieres.value = new Set(etudiants.value.map((e) => e.filiere)).size;
  totalClasses.value = new Set(etudiants.value.map((e) => e.classe)).size;

  // Données par filière
  const filiereCounts = {};
  etudiants.value.forEach((e) => {
    filiereCounts[e.filiere] = (filiereCounts[e.filiere] || 0) + 1;
  });

  new Chart(document.getElementById('chartFiliere'), {
    type: 'pie',
    data: {
      labels: Object.keys(filiereCounts),
      datasets: [
        {
          data: Object.values(filiereCounts),
          backgroundColor: ['#007bff', '#ffc107', '#28a745', '#dc3545'],
        },
      ],
    },
  });

  // Données par année académique
  const anneeCounts = {};
  etudiants.value.forEach((e) => {
    anneeCounts[e.annee_academique] = (anneeCounts[e.annee_academique] || 0) + 1;
  });

  new Chart(document.getElementById('chartAnnee'), {
    type: 'bar',
    data: {
      labels: Object.keys(anneeCounts),
      datasets: [
        {
          label: 'Nombre d’étudiants',
          data: Object.values(anneeCounts),
          backgroundColor: '#17a2b8',
        },
      ],
    },
  });
});
</script>

<style scoped>
/* Nuances Flat UI soft & ERP Standard */
.bg-soft-primary { background-color: rgba(0, 123, 255, 0.08); }
.bg-soft-success { background-color: rgba(40, 167, 69, 0.12); }
.bg-soft-warning { background-color: rgba(255, 193, 7, 0.15); }

/* Alignement graphique strict */
.rounded-4 {
  border-radius: 0.2rem !important;
}

.tracking-wider {
  letter-spacing: 0.6px;
}
</style>