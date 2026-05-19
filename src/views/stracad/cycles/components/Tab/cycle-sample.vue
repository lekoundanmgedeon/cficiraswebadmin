<template>
  <div class="py-3">
    <!-- Header Page Cycles -->
    <div class="d-flex justify-content-between align-items-end mb-4 px-1">
      <div>
        <h4 class="fw-bold text-dark mb-1">Configuration des Cycles</h4>
        <p class="text-muted small mb-0">
          Définition des parcours académiques, durées et exigences en crédits.
        </p>
      </div>
    </div>

    <!-- Conteneur de Table Style "Inscriptions" -->
    <div class="card border-light shadow-sm" style="border-radius: 4px">
      <div class="table-responsive">
        <table class="table align-middle mb-0 custom-table-minimal">
          <thead>
            <tr>
              <th class="ps-4">#</th>
              <th>Référence</th>
              <th>Désignation du Cycle</th>
              <th>Diplôme Délivré</th>
              <th class="text-center">Cursus</th>
              <th class="text-center">Volume (Crédits)</th>
              <th class="text-end pe-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            <!-- Cas vide -->
            <tr v-if="cycles.length === 0">
              <td colspan="7" class="text-center py-5">
                <div class="text-muted small">Aucun cycle configuré pour le moment.</div>
              </td>
            </tr>

            <!-- Boucle sur les cycles -->
            <tr v-for="(cycle, index) in cycles" :key="cycle.id">
              <td class="ps-4 text-muted small">
                {{ String(index + 1).padStart(2, '0') }}
              </td>
              <td>
                <span class="code-box">{{ cycle.code }}</span>
              </td>
              <td>
                <div class="fw-bold text-dark">{{ cycle.designation }}</div>
                <div class="x-small text-muted text-uppercase">Filière Académique</div>
              </td>
              <td>
                <div class="d-flex align-items-center">
                  <div class="icon-indicator me-2 bg-soft-primary">
                    <i class="mdi mdi-certificate text-primary"></i>
                  </div>
                  <span class="small fw-medium">{{ cycle.diplome }}</span>
                </div>
              </td>
              <td class="text-center">
                <div class="small text-dark fw-bold">{{ cycle.duree_annees }} An(s)</div>
                <div class="x-small text-muted">Durée standard</div>
              </td>
              <td class="text-center">
                <span class="credit-pill">{{ cycle.credits_total }} ECTS</span>
              </td>
              <td class="text-end pe-4">
                <ItemActions
                  :item="cycle"
                  :showAdd="false"
                  @edit="editCycle"
                  @delete="deleteCycle"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Table Minimaliste (Même style que Inscriptions) */
.custom-table-minimal thead th {
  background-color: #fcfcfd;
  color: #64748b;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 700;
  padding: 14px 10px;
  border-bottom: 1px solid #eef2f7;
}

.custom-table-minimal tbody td {
  padding: 14px 10px;
  border-bottom: 1px solid #f8fafc;
  font-size: 0.85rem;
}

.custom-table-minimal tbody tr:hover {
  background-color: #fbfcfe;
}

/* Éléments de structure (Bordures 4px) */
.code-box {
  background-color: #f1f5f9;
  color: #334155;
  padding: 4px 8px;
  border-radius: 4px;
  font-family: 'Consolas', monospace;
  font-size: 0.8rem;
  font-weight: 600;
  border: 1px solid #e2e8f0;
}

.credit-pill {
  background-color: #fff;
  color: #4b49ac;
  border: 1px solid #e0e0f0;
  padding: 3px 10px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 700;
}

.icon-indicator {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

.bg-soft-primary {
  background: rgba(75, 73, 172, 0.08);
}

/* Helpers */
.x-small {
  font-size: 0.72rem;
  letter-spacing: 0.2px;
}

.rounded-1 {
  border-radius: 4px !important;
}

.btn-primary {
  background-color: #4b49ac;
  border-color: #4b49ac;
}
</style>
<script setup>
import { computed, onMounted } from 'vue';
import { useCycleStore } from '@/stores/academiqueStore/cycleStore';
import { useNotifier } from '@/stores/messages/useNotifier';
import { extractErrorMessage } from '@/stores/messages/useErrorMessage';
import ItemActions from '../details/ItemActions.vue';

const { notifyError } = useNotifier();

// Stores
const cycleStore = useCycleStore();
// Récupération des cycles depuis le store
const cycles = computed(() => cycleStore.cycles);

// Charger les données au montage
onMounted(async () => {
  try {
    await cycleStore.fetchCycles(); // appel à l’action du store
  } catch (error) {
    notifyError(extractErrorMessage(error, 'Échec lors du chargement des données.'));
  }
});

const deleteCycle = async (id) => {
  await cycleStore.removeCycle(id);
};
</script>
