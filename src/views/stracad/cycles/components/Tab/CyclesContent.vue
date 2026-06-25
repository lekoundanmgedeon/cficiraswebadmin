<template>
  <div class="row">
    <div class="col-12 mb-3 d-flex justify-content-between align-items-center">
      <div>
        <h4>Liste des cycles</h4>
        <p>Vous pouvez consulter les détails de chaque examen en cliquant sur le lien correspondant.</p>
      </div>
      <div class="btn-group">
        <button
          class="btn btn-outline-dark dropdown-toggle"
          type="button"
          data-bs-toggle="dropdown"
          aria-expanded="false"
        > Exporter
        </button>
        <ul class="dropdown-menu dropdown-menu-end">
          <li>
            <button class="dropdown-item" type="button" @click="exportCyclesExcel">
              <i class="mdi mdi-file-excel-box me-2"></i> Excel
            </button>
          </li>
          <li>
            <button class="dropdown-item" type="button" @click="exportCyclesPDF">
              <i class="mdi mdi-file-pdf-box me-2"></i> PDF
            </button>
          </li>
        </ul>
      </div>
    </div>

    <div class="table-responsive">
      <table class="table align-middle mb-0 custom-table-minimal">
        <thead>
          <tr>
            <th class="ps-4">#</th>
            <th>REF</th>
            <th>Désignation</th>
            <th>Diplôme</th>
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
import logoCFI from '@/assets/logoBase64';
import { exportExcel } from '@/utils/exportExcel';
import { exportPDF } from '@/utils/exportPDF';

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

const getExportCyclesData = () =>
  cycles.value.map((cycle, index) => ({
    Rang: index + 1,
    Référence: cycle.code,
    Désignation: cycle.designation,
    Diplôme: cycle.diplome,
    Cursus: `${cycle.duree_annees} an(s)`,
    'Volume (Crédits)': cycle.credits_total ?? 0,
  }));

const exportCyclesExcel = () => {
  if (!cycles.value.length) {
    notifyError('Aucun cycle disponible pour l’export.');
    return;
  }

  exportExcel({
    data: getExportCyclesData(),
    sheetName: 'Cycles',
    fileName: `cycles_${new Date().getTime()}.xlsx`,
  });
};

const exportCyclesPDF = () => {
  if (!cycles.value.length) {
    notifyError('Aucun cycle disponible pour l’export.');
    return;
  }

  exportPDF({
    logoBase64: logoCFI,
    title: 'Liste des cycles',
    filters: [
      { label: 'Total cycles', value: cycles.value.length },
      { label: 'Date', value: new Date().toLocaleDateString('fr-FR') },
    ],
    columns: ['Rang', 'Référence', 'Désignation', 'Diplôme', 'Cursus', 'Volume (Crédits)'],
    rows: cycles.value.map((cycle, index) => [
      index + 1,
      cycle.code,
      cycle.designation,
      cycle.diplome,
      `${cycle.duree_annees} an(s)`,
      cycle.credits_total ?? 0,
    ]),
    fileName: `cycles_${new Date().getTime()}.pdf`,
  });
};
</script>
