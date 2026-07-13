<script setup>
import { computed, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import ItemActions from '@/shared/components/ItemActions.vue';
import ExportMenu from '@/shared/components/ExportMenu.vue';
import EmptyState from '@/shared/components/EmptyState.vue';
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue';
import { useTableExport } from '@/shared/composables/useTableExport';
import { useFiliereStore } from '../../store';
import { useFiliereForm } from '../../composables/useFiliereForm';

const filiereStore = useFiliereStore();
const { items: filieres, loading } = storeToRefs(filiereStore);
const { openEdit } = useFiliereForm();

onMounted(() => filiereStore.fetchAll());

const exportRows = computed(() =>
  filieres.value.map((filiere, index) => ({
    Rang: index + 1,
    Code: filiere.code,
    Désignation: filiere.designation,
    Cycle: filiere.cycle_nom || '-',
    'Nombre de classes': filiere.nb_classes ?? 0,
  }))
);

const { exportToExcel, exportToPdf } = useTableExport({
  rows: exportRows,
  title: 'Liste des filières',
  fileBaseName: 'filieres',
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
 * L'ancienne version câblait `@edit` sur un `editFiliere` qui se contentait
 * d'un `console.log` : le bouton « Modifier » d'une filière était inopérant.
 * @param {{key: string, item: any}} event
 */
function onAction({ key, item }) {
  if (key === 'edit') openEdit(item);
  if (key === 'delete') filiereStore.remove(item.id);
}
</script>

<template>
  <div>
    <div class="d-flex justify-content-between align-items-center mb-3">
      <div>
        <h4>Liste des filières</h4>
        <p class="mb-0 text-muted">Consultez, modifiez ou supprimez les filières déclarées.</p>
      </div>
      <ExportMenu @excel="exportToExcel" @pdf="exportToPdf" />
    </div>

    <LoadingSpinner v-if="loading" />

    <EmptyState
      v-else-if="filieres.length === 0"
      title="Aucune filière enregistrée"
      description="Créez une première filière depuis le bouton « Ajouter un nouveau »."
    />

    <div v-else class="table-responsive">
      <table class="table table-striped">
        <thead>
          <tr>
            <th>#</th>
            <th>Code</th>
            <th>Désignation</th>
            <th>Cycle</th>
            <th>Nombre de classes</th>
            <th><span class="visually-hidden">Actions</span></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(filiere, index) in filieres" :key="filiere.id">
            <td>{{ index + 1 }}</td>
            <td class="fw-bold">{{ filiere.code }}</td>
            <td>{{ filiere.designation }}</td>
            <td>{{ filiere.cycle_nom || '-' }}</td>
            <td>
              <span class="badge" :class="filiere.nb_classes > 0 ? 'bg-success' : 'bg-secondary'">
                {{ filiere.nb_classes ?? 0 }}
              </span>
            </td>
            <td>
              <ItemActions
                :item="filiere"
                :label="filiere.designation"
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
