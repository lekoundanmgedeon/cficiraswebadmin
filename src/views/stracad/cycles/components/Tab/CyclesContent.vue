<template>
  <div class="row">
    <h4>Liste des cycles</h4>
    <p>Vous pouvez consulter les détails de chaque examen en cliquant sur le lien correspondant.</p>

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
              <ItemActions :item="cycle" :showAdd="false" @edit="editCycle" @delete="deleteCycle" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

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
