<template>
  <div class="row g-4">
    <div class="col-12">
      <h4>Statistiques des cycles</h4>
      <p class="text-muted mb-0">
        Indicateurs globaux de distribution des étudiants par cycle académique.
      </p>
    </div>

    <div class="col-12 d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3">
      <div class="col-sm-6 col-md-4">
        <div class="input-group">
          <span class="input-group-text bg-white border-end-0 text-muted">
            <i class="bi bi-search"></i>
          </span>
          <input 
            v-model="searchQuery"
            type="text" 
            class="form-control border-start-0 ps-0" 
            placeholder="Rechercher un cycle ou diplôme..."
          />
        </div>
      </div>

      <div class="d-flex align-items-center bg-light border rounded px-3 py-2">
        <div class="bg-primary-subtle text-primary rounded-circle p-2 me-2 d-flex align-items-center justify-content-center" style="width: 35px; height: 35px;">
          <i class="bi bi-mortarboard-fill"></i>
        </div>
        <div>
          <small class="text-muted d-block text-uppercase fw-semibold style-small">Total Étudiants</small>
          <span class="fw-bold text-dark">{{ formatNumber(totalEtudiants) }}</span>
        </div>
      </div>
    </div>

    <div class="col-12">
      <div class="table-responsive border rounded bg-white">
        <table class="table align-middle mb-0 table-hover">
          <thead class="table-light">
            <tr>
              <th scope="col" class="py-3 ps-4" style="min-width: 180px;">Code / Cycle</th>
              <th scope="col" class="py-3">Diplôme visé</th>
              <th scope="col" class="py-3 text-center" style="width: 180px;">Effectif Étudiants</th>
              <th scope="col" class="py-3 text-end pe-4" style="width: 120px;">Statut</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="4" class="text-center py-5">
                <div class="d-flex justify-content-center align-items-center gap-2">
                  <div class="spinner-border spinner-border-sm text-primary" role="status"></div>
                  <span class="text-muted small">Chargement des statistiques...</span>
                </div>
              </td>
            </tr>

            <tr v-else-if="filteredCycles.length === 0">
              <td colspan="4" class="text-center py-5">
                <div class="py-3">
                  <i class="bi bi-person-x text-muted opacity-50" style="font-size: 2.5rem;"></i>
                  <p class="text-muted small mt-2 mb-0">Aucune donnée statistique disponible</p>
                </div>
              </td>
            </tr>

            <tr v-else v-for="cycle in filteredCycles" :key="cycle.cycle_id">
              <td class="ps-4">
                <div class="d-flex align-items-center">
                  <span class="badge bg-primary-subtle text-primary me-3 px-2 py-1.5 fw-bold font-monospace">
                    {{ cycle.cycle_code }}
                  </span>
                  <span class="fw-semibold text-dark">{{ cycle.cycle_nom || 'Cycle Académique' }}</span>
                </div>
              </td>

              <td>
                <span class="text-secondary small fw-medium">{{ cycle.diplome || 'N/A' }}</span>
              </td>

              <td class="text-center">
                <span class="badge rounded-pill bg-light text-dark border px-3 py-1.5 fw-semibold">
                  {{ formatNumber(cycle.nb_etudiants) }}
                </span>
              </td>

              <td class="text-end pe-4">
                <span
                  :class="
                    Number(cycle.nb_etudiants) > 0
                      ? 'bg-success-subtle text-success'
                      : 'bg-secondary-subtle text-secondary'
                  "
                  class="badge px-2.5 py-1.5 rounded-pill small fw-semibold"
                >
                  {{ Number(cycle.nb_etudiants) > 0 ? 'Actif' : 'Inactif' }}
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
import { ref, computed, onMounted } from 'vue';
import { useCycleStore } from '@/stores/academiqueStore/cycleStore';

const cycleStore = useCycleStore();

// Filtres de recherche
const searchQuery = ref('');

// Appel API au montage du composant
onMounted(() => {
  cycleStore.fetchCycleDistributionStats();
});

// Alias réactifs vers le Store
const loading = computed(() => cycleStore.loading);
const cyclesRaw = computed(() => cycleStore.stats || []);

// Filtrage en direct sur les données de l'API
const filteredCycles = computed(() => {
  return cyclesRaw.value.filter((cycle) => {
    const search = searchQuery.value.toLowerCase();
    return (
      (cycle.cycle_code?.toLowerCase().includes(search) || false) ||
      (cycle.diplome?.toLowerCase().includes(search) || false) ||
      (cycle.cycle_nom?.toLowerCase().includes(search) || false)
    );
  });
});

// Total global calculé dynamiquement depuis l'API
const totalEtudiants = computed(() => {
  return cyclesRaw.value.reduce((sum, item) => sum + parseInt(item.nb_etudiants || 0, 10), 0);
});

// Sécurité de formatage pour les chaînes de l'API
const formatNumber = (val) => {
  const num = parseInt(val, 10);
  return isNaN(num) ? 0 : num;
};
</script>

<style scoped>
.style-small {
  font-size: 0.7rem;
  letter-spacing: 0.5px;
}

.table th {
  font-size: 0.82rem;
  letter-spacing: 0.3px;
  font-weight: 700;
  color: #5c677d;
}

/* Conservation et nettoyage de tes styles stat-cards globaux si réutilisés ailleurs */
.stat-card {
  background: #fff;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}
</style>