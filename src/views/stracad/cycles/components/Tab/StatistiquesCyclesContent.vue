<template>
  <div>
    <div class="col-12 mb-2">
      <h4>Statistiques des cycles</h4>
      <p class="text-muted">Indicateurs globaux de distribution des étudiants par cycle académique.</p>
    </div>

    <div class="table-responsive card border-light shadow-sm">
      <table class="table align-middle mb-0 table-hover">
        <thead>
          <tr>
            <th class="ps-4">Code / Cycle</th>
            <th>Diplôme</th>
            <th class="text-center">Effectif Étudiants</th>
            <th class="text-end pe-4">Statut</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="4" class="text-center py-5">
              <div class="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
              <span class="text-muted">Chargement des statistiques...</span>
            </td>
          </tr>

          <tr v-else-if="filteredCycles.length === 0">
            <td colspan="4" class="text-center py-5">
              <div class="py-3">
                <i class="mdi mdi-account-off-outline text-muted" style="font-size: 3rem; opacity: 0.3"></i>
                <p class="text-muted mt-2">Aucune donnée statistique disponible</p>
              </div>
            </td>
          </tr>

          <tr v-else v-for="cycle in filteredCycles" :key="cycle.cycle_id">
            <td class="ps-4">
              <div class="d-flex align-items-center">
                <span class="badge bg-primary-subtle text-primary me-3 px-2 py-1 fw-bold">
                  {{ cycle.cycle_code }}
                </span>
                <span class="fw-bold text-dark">{{ cycle.cycle_code }}</span>
              </div>
            </td>
            <td>
              <span class="text-muted small fw-medium">{{ cycle.diplome || 'N/A' }}</span>
            </td>
            <td class="text-center">
              <span class="badge rounded-pill bg-light text-dark border px-3 fw-semibold">
                {{ formatNumber(cycle.nb_etudiants) }}
              </span>
            </td>
            <td class="text-end pe-4">
              <span :class="Number(cycle.nb_etudiants) > 0 ? 'badge bg-success-subtle text-success' : 'badge bg-secondary-subtle text-secondary'" class="px-2 py-1 rounded-pill small">
                {{ Number(cycle.nb_etudiants) > 0 ? 'Actif' : 'Inactif' }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
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
      cycle.cycle_code.toLowerCase().includes(search) ||
      cycle.diplome.toLowerCase().includes(search)
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

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-icon i {
  font-size: 28px;
}

.stat-content h3 {
  margin: 0;
  font-size: 2rem;
  font-weight: 600;
  color: #2c3e50;
}

.stat-content p {
  margin: 0;
  color: #6c757d;
  font-size: 0.9rem;
}

.bg-primary-soft {
  background-color: rgba(0, 123, 255, 0.1);
}
.bg-success-soft {
  background-color: rgba(40, 167, 69, 0.1);
}
.bg-info-soft {
  background-color: rgba(23, 162, 184, 0.1);
}
.bg-warning-soft {
  background-color: rgba(255, 193, 7, 0.1);
}

.cycle-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 123, 255, 0.1);
}

.cycle-icon i {
  font-size: 20px;
}

/* Table Style Uniforme */
.custom-table-robust thead th {
  background-color: #f8fafc;
  color: #475569;
  font-size: 0.75rem;
  text-transform: uppercase;
  font-weight: 700;
  padding: 18px 12px;
  border-bottom: 2px solid #eef2f7;
}

.custom-table-robust tbody td {
  padding: 16px 12px;
  border-bottom: 1px solid #f1f5f9;
}

/* Tags et Badges */
.code-tag-blue {
  background: #0ea5e9;
  color: white;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  font-weight: 800;
  font-size: 0.8rem;
}

.status-pill-robust {
  font-size: 0.7rem;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 4px;
  text-transform: uppercase;
}

.status-active {
  background: #ecfdf5;
  color: #059669;
  border: 1px solid #d1fae5;
}

.x-small {
  font-size: 0.7rem;
}
</style>
