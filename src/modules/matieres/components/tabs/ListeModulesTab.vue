<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import ItemActions from '@/shared/components/ItemActions.vue';
import ExportMenu from '@/shared/components/ExportMenu.vue';
import EmptyState from '@/shared/components/EmptyState.vue';
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue';
import Pagination from '@/components/shared/Pagination.vue';
import { useTableExport } from '@/shared/composables/useTableExport';
import { useModuleStore } from '../../store';
import { useModuleForm } from '../../composables/useModuleForm';

/**
 * Liste des modules d'enseignement.
 *
 * L'ancien `ModuleList.vue` lisait `moduleStore.modules` et appelait
 * `moduleStore.fetchModules()` — **ni l'un ni l'autre n'existait** dans le store.
 * `filteredModules` valait donc `undefined`, et `paginatedModules` levait un
 * `TypeError` sur `.slice()` : l'écran plantait au montage. Personne ne s'en
 * était aperçu, puisqu'il n'était branché sur aucune route.
 *
 * Ses quatre boutons d'export (PDF, Excel, CSV, Imprimer) étaient des
 * `console.log` accompagnés d'un `// TODO`. Ils exportent maintenant vraiment,
 * via `useTableExport`.
 *
 * Un second fichier, `AModuleList.vue`, en était une copie quasi identique
 * (148 lignes contre 155), avec les mêmes défauts.
 */

const moduleStore = useModuleStore();
const { items: modules, loading } = storeToRefs(moduleStore);
const { openEdit } = useModuleForm();

const searchQuery = ref('');
const currentPage = ref(1);
const itemsPerPage = 10;

onMounted(() => moduleStore.fetchAll());

watch(searchQuery, () => {
  currentPage.value = 1;
});

const filtered = computed(() => {
  const search = searchQuery.value.toLowerCase().trim();
  if (!search) return modules.value;

  return modules.value.filter((module) =>
    [module.code, module.designation, module.responsable_nom]
      .filter(Boolean)
      .some((field) => String(field).toLowerCase().includes(search))
  );
});

const startIndex = computed(() => (currentPage.value - 1) * itemsPerPage);

const paginated = computed(() =>
  filtered.value.slice(startIndex.value, startIndex.value + itemsPerPage)
);

/** @param {any} module @returns {string} */
function responsable(module) {
  if (!module.responsable_nom && !module.responsable_prenom) return '—';
  return `${module.responsable_nom ?? ''} ${module.responsable_prenom ?? ''}`.trim();
}

const totalCredits = computed(() =>
  filtered.value.reduce((total, module) => total + Number(module.credit ?? 0), 0)
);

const totalHeures = computed(() =>
  filtered.value.reduce((total, module) => total + Number(module.volume_horaire ?? 0), 0)
);

const exportRows = computed(() =>
  filtered.value.map((module, index) => ({
    Rang: index + 1,
    Code: module.code,
    Désignation: module.designation,
    Crédits: module.credit ?? 0,
    Coefficient: module.coefficient ?? 1,
    'Volume horaire': `${module.volume_horaire ?? 0} h`,
    Responsable: responsable(module),
  }))
);

const { exportToExcel, exportToPdf } = useTableExport({
  rows: exportRows,
  title: 'Liste des modules',
  fileBaseName: 'modules',
  filters: () => [
    { label: 'Modules', value: filtered.value.length },
    { label: 'Total crédits', value: totalCredits.value },
    { label: 'Volume horaire total', value: `${totalHeures.value} h` },
    { label: "Date d'édition", value: new Date().toLocaleDateString('fr-FR') },
  ],
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

/** @param {{key: string, item: any}} event */
function onAction({ key, item }) {
  if (key === 'edit') openEdit(item);
  if (key === 'delete') moduleStore.remove(item.id);
}
</script>

<template>
  <div>
    <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
      <div>
        <h4 class="fw-bold mb-1">Liste des modules</h4>
        <p class="text-muted small mb-0">
          <b>{{ filtered.length }}</b> module(s) · {{ totalCredits }} crédits · {{ totalHeures }} h
          au total.
        </p>
      </div>
      <ExportMenu :disabled="filtered.length === 0" @excel="exportToExcel" @pdf="exportToPdf" />
    </div>

    <div class="mb-4">
      <div class="input-group shadow-sm" style="max-width: 420px">
        <span class="input-group-text bg-white border-0">
          <i class="mdi mdi-magnify text-primary"></i>
        </span>
        <input
          v-model="searchQuery"
          type="text"
          class="form-control border-0"
          placeholder="Rechercher un code, une désignation, un responsable..."
        />
      </div>
    </div>

    <LoadingSpinner v-if="loading" />

    <EmptyState
      v-else-if="modules.length === 0"
      title="Aucun module"
      description="Créez un premier module depuis le bouton « Ajouter un module »."
    />

    <EmptyState
      v-else-if="filtered.length === 0"
      title="Aucun résultat"
      description="Aucun module ne correspond à cette recherche."
    />

    <div v-else class="card border-0 shadow-sm overflow-hidden">
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead class="bg-light">
              <tr>
                <th class="ps-4 py-3">#</th>
                <th>Code</th>
                <th>Désignation</th>
                <th class="text-center">Crédits</th>
                <th class="text-center">Coefficient</th>
                <th class="text-center">Volume</th>
                <th>Responsable</th>
                <th class="text-end pe-4">Actions</th>
              </tr>
            </thead>

            <tbody>
              <tr v-for="(module, index) in paginated" :key="module.id">
                <td class="ps-4 text-muted small">{{ startIndex + index + 1 }}</td>

                <td>
                  <span class="code-box">{{ module.code }}</span>
                </td>

                <td class="fw-semibold text-dark">{{ module.designation }}</td>

                <td class="text-center">
                  <span class="credit-pill">{{ module.credit ?? 0 }} ECTS</span>
                </td>

                <td class="text-center">{{ module.coefficient ?? 1 }}</td>

                <td class="text-center">{{ module.volume_horaire ?? 0 }} h</td>

                <td class="small">{{ responsable(module) }}</td>

                <td class="text-end pe-4">
                  <ItemActions
                    :item="module"
                    :label="module.designation"
                    :actions="actions"
                    :loading="loading"
                    @action="onAction"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="card-footer bg-white border-0 py-3">
        <Pagination
          v-model="currentPage"
          :items-per-page="itemsPerPage"
          :total-items="filtered.length"
        />
      </div>
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

.credit-pill {
  background: rgba(75, 73, 172, 0.1);
  color: #4b49ac;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 600;
}

.table thead th {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: #6c757d;
  border: none;
}
</style>
