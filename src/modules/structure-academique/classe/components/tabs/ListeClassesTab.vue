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
import { useClasseStore } from '../../store';
import { useClasseForm } from '../../composables/useClasseForm';

const classeStore = useClasseStore();
const { items: classes, loading } = storeToRefs(classeStore);
const { openEdit } = useClasseForm();

const recherche = ref('');

onMounted(() => classeStore.fetchAll());

const classesFiltrees = computed(() => {
  const terme = recherche.value.trim().toLowerCase();
  if (!terme) return classes.value;

  return classes.value.filter((classe) =>
    [classe.code, classe.filiere_nom, classe.niveau_code].some((champ) =>
      String(champ ?? '')
        .toLowerCase()
        .includes(terme)
    )
  );
});

/**
 * L'onglet paginait déjà, mais à la main : dix lignes par page en dur, sans
 * sélecteur de taille ni indication du nombre de résultats, et sans garde-fou
 * quand la collection rétrécit. Il passe sur le composant partagé, comme le
 * reste de l'application.
 */
const { page, itemsPerPage, startIndex, paginated } = usePagination(classesFiltrees, {
  perPage: 10,
  resetKey: () => recherche.value,
});

const exportRows = computed(() =>
  classesFiltrees.value.map((classe, index) => ({
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
      <ExportMenu
        :disabled="classesFiltrees.length === 0"
        @excel="exportToExcel"
        @pdf="exportToPdf"
      />
    </div>

    <LoadingSpinner v-if="loading" />

    <EmptyState
      v-else-if="classes.length === 0"
      title="Aucune classe enregistrée"
      description="Créez une première classe depuis le bouton « Ajouter un nouveau »."
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
              placeholder="Rechercher une classe, une filière, un niveau…"
            />
          </div>
        </div>
      </div>

      <EmptyState
        v-if="classesFiltrees.length === 0"
        title="Aucune classe ne correspond"
        description="Modifiez votre recherche pour retrouver une classe."
        :size="80"
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
              <tr v-for="(classe, index) in paginated" :key="classe.id">
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

        <Pagination
          v-model="page"
          v-model:items-per-page="itemsPerPage"
          :total-items="classesFiltrees.length"
        />
      </template>
    </template>
  </div>
</template>
