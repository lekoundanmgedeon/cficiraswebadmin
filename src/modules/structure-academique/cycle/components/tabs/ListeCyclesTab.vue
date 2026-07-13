<script setup>
import { computed, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import ItemActions from '@/shared/components/ItemActions.vue';
import ExportMenu from '@/shared/components/ExportMenu.vue';
import EmptyState from '@/shared/components/EmptyState.vue';
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue';
import { useTableExport } from '@/shared/composables/useTableExport';
import { useCycleStore } from '../../store';
import { useCycleForm } from '../../composables/useCycleForm';

const cycleStore = useCycleStore();
const { items: cycles, loading } = storeToRefs(cycleStore);
const { openEdit } = useCycleForm();

onMounted(() => cycleStore.fetchAll());

const exportRows = computed(() =>
  cycles.value.map((cycle, index) => ({
    Rang: index + 1,
    Référence: cycle.code,
    Désignation: cycle.designation,
    Diplôme: cycle.diplome,
    Cursus: `${cycle.duree_annees} an(s)`,
    'Volume (Crédits)': cycle.credits_total ?? 0,
  }))
);

const { exportToExcel, exportToPdf } = useTableExport({
  rows: exportRows,
  title: 'Liste des cycles',
  fileBaseName: 'cycles',
});

const actions = [
  { key: 'edit', label: 'Modifier', icon: 'mdi-pencil-outline' },
  {
    key: 'delete',
    label: 'Supprimer',
    icon: 'mdi-delete-outline',
    variant: 'danger',
    divider: true,
    confirm: { title: 'Confirmation de suppression' },
  },
];

/**
 * L'ancienne version câblait `@edit="editCycle"` sur une fonction qui n'était
 * définie nulle part : le bouton « Modifier » d'un cycle ne faisait rien.
 * @param {{key: string, item: any}} event
 */
function onAction({ key, item }) {
  if (key === 'edit') openEdit(item);
  if (key === 'delete') cycleStore.remove(item.id);
}
</script>

<template>
  <div>
    <div class="d-flex justify-content-between align-items-center mb-3">
      <div>
        <h4>Liste des cycles</h4>
        <p class="mb-0 text-muted">
          Consultez, modifiez ou supprimez les cycles académiques déclarés.
        </p>
      </div>
      <ExportMenu @excel="exportToExcel" @pdf="exportToPdf" />
    </div>

    <LoadingSpinner v-if="loading" />

    <EmptyState
      v-else-if="cycles.length === 0"
      title="Aucun cycle configuré"
      description="Créez un premier cycle depuis le bouton « Ajouter un nouveau »."
    />

    <div v-else class="table-responsive">
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
          <tr v-for="(cycle, index) in cycles" :key="cycle.id">
            <td class="ps-4 text-muted small">{{ String(index + 1).padStart(2, '0') }}</td>
            <td>
              <span class="code-box">{{ cycle.code }}</span>
            </td>
            <td>
              <div class="fw-bold text-dark">{{ cycle.designation }}</div>
              <div class="x-small text-muted text-uppercase">Cycle académique</div>
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
                :label="cycle.designation"
                :actions="actions"
                @action="onAction"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.code-box {
  background: #f1f5f9;
  color: #475569;
  padding: 3px 10px;
  border-radius: 4px;
  font-size: 0.78rem;
  font-weight: 700;
}

.icon-indicator {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bg-soft-primary {
  background: rgba(75, 73, 172, 0.1);
}

.credit-pill {
  background: rgba(75, 73, 172, 0.1);
  color: #4b49ac;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 600;
}

.x-small {
  font-size: 0.7rem;
}

.custom-table-minimal thead th {
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: #5c677d;
  border-bottom: 1px solid #e2e8f0;
}
</style>
