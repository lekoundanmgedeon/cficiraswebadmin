<script setup>
import { computed, onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import ItemActions from '@/shared/components/ItemActions.vue';
import ExportMenu from '@/shared/components/ExportMenu.vue';
import EmptyState from '@/shared/components/EmptyState.vue';
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue';
import Pagination from '@/components/shared/Pagination.vue';
import { useTableExport } from '@/shared/composables/useTableExport';
import { usePagination } from '@/shared/composables/usePagination';
import { useFiliereStore } from '../../store';
import { useFiliereForm } from '../../composables/useFiliereForm';

const filiereStore = useFiliereStore();
const { items: filieres, loading } = storeToRefs(filiereStore);
const { openEdit } = useFiliereForm();

const recherche = ref('');

onMounted(() => filiereStore.fetchAll());

const filieresFiltrees = computed(() => {
  const terme = recherche.value.trim().toLowerCase();
  if (!terme) return filieres.value;

  return filieres.value.filter((filiere) =>
    [filiere.code, filiere.designation, filiere.cycle_nom].some((champ) =>
      String(champ ?? '')
        .toLowerCase()
        .includes(terme)
    )
  );
});

const { page, itemsPerPage, startIndex, paginated } = usePagination(filieresFiltrees, {
  perPage: 10,
  resetKey: () => recherche.value,
});

const exportRows = computed(() =>
  filieresFiltrees.value.map((filiere, index) => ({
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
      <ExportMenu
        :disabled="filieresFiltrees.length === 0"
        @excel="exportToExcel"
        @pdf="exportToPdf"
      />
    </div>

    <LoadingSpinner v-if="loading" />

    <EmptyState
      v-else-if="filieres.length === 0"
      title="Aucune filière enregistrée"
      description="Créez une première filière depuis le bouton « Ajouter un nouveau »."
    />

    <template v-else>
      <div class="row g-2 align-items-center mb-3">
        <div class="col-md-5">
          <div class="input-group input-group-sm">
            <span class="input-group-text bg-white border-end-0 text-muted">
              <i class="bi bi-search"></i>
            </span>
            <input
              v-model="recherche"
              type="text"
              class="form-control border-start-0 ps-0"
              placeholder="Rechercher une filière, un cycle…"
            />
          </div>
        </div>
      </div>

      <EmptyState
        v-if="filieresFiltrees.length === 0"
        title="Aucune filière ne correspond"
        description="Modifiez votre recherche pour retrouver une filière."
        :size="80"
      />

      <template v-else>
        <div class="table-responsive">
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
              <tr v-for="(filiere, index) in paginated" :key="filiere.id">
                <td>{{ startIndex + index + 1 }}</td>
                <td class="fw-bold">{{ filiere.code }}</td>
                <td>{{ filiere.designation }}</td>
                <td>{{ filiere.cycle_nom || '-' }}</td>
                <td>
                  <span
                    class="badge"
                    :class="filiere.nb_classes > 0 ? 'bg-success' : 'bg-secondary'"
                  >
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

        <Pagination
          v-model="page"
          v-model:items-per-page="itemsPerPage"
          :total-items="filieresFiltrees.length"
        />
      </template>
    </template>
  </div>
</template>
