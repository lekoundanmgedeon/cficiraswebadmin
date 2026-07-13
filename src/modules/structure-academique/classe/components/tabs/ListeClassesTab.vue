<script setup>
import { computed, onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import ItemActions from '@/shared/components/ItemActions.vue';
import ExportMenu from '@/shared/components/ExportMenu.vue';
import EmptyState from '@/shared/components/EmptyState.vue';
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue';
import { useTableExport } from '@/shared/composables/useTableExport';
import { useClasseStore } from '../../store';
import { useClasseForm } from '../../composables/useClasseForm';

const classeStore = useClasseStore();
const { items: classes, loading } = storeToRefs(classeStore);
const { openEdit } = useClasseForm();

const currentPage = ref(1);
const PAGE_SIZE = 10;

onMounted(() => classeStore.fetchAll());

const startIndex = computed(() => (currentPage.value - 1) * PAGE_SIZE);

const paginatedClasses = computed(() =>
  classes.value.slice(startIndex.value, startIndex.value + PAGE_SIZE)
);

const pageCount = computed(() => Math.ceil(classes.value.length / PAGE_SIZE) || 1);

const exportRows = computed(() =>
  classes.value.map((classe, index) => ({
    Rang: index + 1,
    Code: classe.code,
    Filière: classe.filiere_nom || '-',
    Niveau: classe.niveau_code || '-',
    Effectif: classe.nb_etudiants ?? 0,
    'Capacité max': classe.capacite_max ?? 0,
  }))
);

const { exportToExcel, exportToPdf } = useTableExport({
  rows: exportRows,
  title: 'Liste des classes',
  fileBaseName: 'classes',
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
 * L'ancienne version câblait `@edit` et `@delete` sur des fonctions qui se
 * contentaient d'un `console.log` : modifier et supprimer une classe étaient
 * tous deux sans effet.
 * @param {{key: string, item: any}} event
 */
function onAction({ key, item }) {
  if (key === 'edit') openEdit(item);
  if (key === 'delete') classeStore.remove(item.id);
}
</script>

<template>
  <div>
    <div class="d-flex justify-content-between align-items-center mb-3">
      <div>
        <h4>Liste des classes</h4>
        <p class="mb-0 text-muted">Effectifs et capacités des classes ouvertes.</p>
      </div>
      <ExportMenu @excel="exportToExcel" @pdf="exportToPdf" />
    </div>

    <LoadingSpinner v-if="loading" />

    <EmptyState
      v-else-if="classes.length === 0"
      title="Aucune classe enregistrée"
      description="Créez une première classe depuis le bouton « Ajouter un nouveau »."
    />

    <template v-else>
      <div class="table-responsive">
        <table class="table align-middle mb-0">
          <thead>
            <tr>
              <th class="ps-3">#</th>
              <th>Code</th>
              <th>Filière</th>
              <th>Niveau</th>
              <th class="text-center">Effectif / Capacité max</th>
              <th class="text-end pe-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(classe, index) in paginatedClasses" :key="classe.id">
              <td class="ps-3 text-muted">{{ startIndex + index + 1 }}</td>
              <td>
                <strong class="text-dark">{{ classe.code }}</strong>
              </td>
              <td>{{ classe.filiere_nom || '-' }}</td>
              <td>
                <span class="badge bg-secondary-subtle text-secondary px-2 py-1 rounded">
                  {{ classe.niveau_code || '-' }}
                </span>
              </td>
              <td class="text-center">
                <span class="badge bg-success-subtle text-success px-2 py-1 rounded fw-semibold">
                  {{ classe.nb_etudiants ?? 0 }} / {{ classe.capacite_max ?? 0 }}
                </span>
              </td>
              <td class="text-end pe-3">
                <ItemActions
                  :item="classe"
                  :label="classe.code"
                  :actions="actions"
                  @action="onAction"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <nav v-if="pageCount > 1" class="d-flex justify-content-center mt-3">
        <ul class="pagination mb-0">
          <li class="page-item" :class="{ disabled: currentPage === 1 }">
            <button class="page-link" @click="currentPage--">Précédent</button>
          </li>
          <li
            v-for="page in pageCount"
            :key="page"
            class="page-item"
            :class="{ active: page === currentPage }"
          >
            <button class="page-link" @click="currentPage = page">{{ page }}</button>
          </li>
          <li class="page-item" :class="{ disabled: currentPage === pageCount }">
            <button class="page-link" @click="currentPage++">Suivant</button>
          </li>
        </ul>
      </nav>
    </template>
  </div>
</template>
