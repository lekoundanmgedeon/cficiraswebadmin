<template>
  <div class="row">
    <div class="col-12 mb-3">
      <h4>Vue d'ensemble de l'organisation</h4>
      <p class="text-muted">
        Suivi opérationnel des effectifs, des capacités d'accueil et du taux de remplissage par
        cycle.
      </p>
    </div>

    <div class="col-12">
      <div class="table-responsive border rounded bg-white">
        <table class="table table-hover align-middle mb-0">
          <thead class="table-light">
            <tr>
              <th scope="col" class="py-3 ps-3">Cycle</th>
              <th scope="col" class="py-3">Filières disponibles</th>
              <th scope="col" class="py-3 text-center">Effectifs / Capacité</th>
              <th scope="col" class="py-3" style="width: 200px">Taux de remplissage</th>
              <th scope="col" class="py-3 text-center" style="width: 120px">Statut</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="5" class="text-center py-5">
                <div class="d-flex justify-content-center align-items-center gap-2">
                  <div class="spinner-border spinner-border-sm text-primary" role="status"></div>
                  <span class="text-muted small fw-medium">Chargement des indicateurs...</span>
                </div>
              </td>
            </tr>

            <tr v-else-if="organisations.length === 0">
              <td colspan="5" class="text-center py-5">
                <div class="d-flex flex-column align-items-center">
                  <img
                    src="/img/empty-box.svg"
                    alt="Aucune donnée"
                    class="mb-2"
                    style="width: 80px; opacity: 0.7"
                  />
                  <div class="text-muted small">Aucune donnée disponible pour le moment.</div>
                </div>
              </td>
            </tr>

            <tr v-for="item in organisations" :key="item.cycle_id">
              <td class="ps-3">
                <div class="fw-bold text-dark">{{ item.cycle_designation }}</div>
                <small class="text-muted text-uppercase fw-semibold" style="font-size: 0.75rem">
                  Codification : {{ item.cycle_code }}
                </small>
              </td>

              <td>
                <div class="d-flex flex-wrap gap-1">
                  <span
                    v-for="(filiere, idx) in formatFilieres(item.filieres_disponibles)"
                    :key="idx"
                    class="badge bg-light text-dark border px-2 py-1 fw-normal"
                    style="font-size: 0.8rem"
                  >
                    {{ filiere }}
                  </span>
                </div>
              </td>

              <td class="text-center">
                <span class="fw-semibold text-dark">{{ item.effectifs }}</span>
                <span class="text-muted px-1">/</span>
                <span class="text-secondary small">{{ item.capacite_totale }}</span>
              </td>

              <td>
                <div v-if="Number(item.capacite_totale) > 0">
                  <div
                    class="d-flex align-items-center justify-content-between mb-1 small text-muted"
                  >
                    <span class="fw-medium text-dark" style="font-size: 0.85rem">
                      {{ item.taux_remplissage }}%
                    </span>
                  </div>
                  <div class="progress" style="height: 6px" title="Remplissage">
                    <div
                      class="progress-bar rounded"
                      role="progressbar"
                      :style="{ width: Math.min(item.taux_remplissage, 100) + '%' }"
                      :class="getProgressClass(item.taux_remplissage)"
                      :aria-valuenow="item.taux_remplissage"
                      aria-valuemin="0"
                      aria-valuemax="100"
                    ></div>
                  </div>
                </div>
                <span v-else class="text-muted small">-</span>
              </td>

              <td class="text-center">
                <span
                  class="badge rounded-pill px-2.5 py-1.5"
                  :class="{
                    'bg-success-soft text-success': item.statut === 'Complet',
                    'bg-warning-soft text-warning': item.statut === 'Partiel',
                    'bg-secondary-soft text-secondary':
                      item.statut === 'Vide' || item.statut === 'Aucune capacité',
                  }"
                  style="font-size: 0.75rem; font-weight: 600"
                >
                  {{ item.statut }}
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
import { onMounted, computed } from 'vue';
import { useCycleStore } from '../../store';

const cycleStore = useCycleStore();

const loading = computed(() => cycleStore.loading);
const organisations = computed(() => cycleStore.organisation);

onMounted(() => cycleStore.fetchOrganisation());

const getProgressClass = (taux) => {
  const value = Number(taux);
  if (value >= 90) return 'bg-success';
  if (value >= 50) return 'bg-primary';
  return 'bg-warning';
};

const formatFilieres = (filieres) => {
  if (!filieres) return ['Aucune filière'];
  if (Array.isArray(filieres)) return filieres;
  return filieres
    .split(',')
    .map((f) => f.trim())
    .filter(Boolean);
};
</script>

<style scoped>
.bg-success-soft {
  background-color: rgba(25, 135, 84, 0.12) !important;
}
.bg-warning-soft {
  background-color: rgba(255, 193, 7, 0.15) !important;
  color: #a17000 !important;
}
.bg-secondary-soft {
  background-color: rgba(108, 117, 125, 0.12) !important;
}

.table th {
  font-size: 0.82rem;
  letter-spacing: 0.5px;
  font-weight: 700;
  color: #5c677d;
}
</style>
