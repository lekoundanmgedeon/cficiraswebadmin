<script setup>
import { computed, onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import ItemActions from '@/shared/components/ItemActions.vue';
import EmptyState from '@/shared/components/EmptyState.vue';
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue';
import { formatDate } from '@/shared/utils/date';
import ExamenHeader from '../../components/ExamenHeader.vue';
import EpreuveFormModal from '../components/EpreuveFormModal.vue';
import { useEpreuveStore } from '../store';
import { useEpreuveForm } from '../composables/useEpreuveForm';
import { useSessionStore } from '../../session/store';
import { TYPES_EPREUVE, typeEpreuveLabel } from '../../constants';

const props = defineProps({
  /** Identifiant de la session, injecté par le router. */
  id: { type: String, required: true },
});

/**
 * Les épreuves d'une session.
 *
 * `PlanExamen.vue` faisait 593 lignes et **tout y était simulé** : la session
 * elle-même (`currentSession` codée en dur), les filières, les classes, les
 * modules. Les épreuves composées dans son `activeEvaluations` n'étaient
 * envoyées nulle part.
 *
 * Le store des épreuves (`evalStore.js`, 128 lignes) existait pourtant, et
 * fonctionnait — **aucune vue ne l'appelait**.
 *
 * Ses trois types d'évaluation (`CC`, `NORMAL`, `RATTRAPAGE`) ne correspondaient
 * par ailleurs pas à la table : `NORMAL` et `RATTRAPAGE` sont des types de
 * *session*. Les vrais types sont `CC`, `TP`, `EXAMEN`, `PROJET`.
 */

const epreuveStore = useEpreuveStore();
const sessionStore = useSessionStore();

const { loading } = storeToRefs(epreuveStore);
const { openCreate, openEdit } = useEpreuveForm();

const filterType = ref('');

onMounted(() => {
  epreuveStore.fetchAll();
  sessionStore.fetchAll();
});

const session = computed(() => sessionStore.getById(props.id));

/** `GET /evaluation` ne filtre pas par session : le tri se fait sur `session_id`. */
const epreuves = computed(() => {
  const rows = epreuveStore.bySession(props.id);
  if (!filterType.value) return rows;
  return rows.filter((epreuve) => epreuve.type_eval === filterType.value);
});

/** La somme des pondérations doit atteindre 100 % pour que la session soit cohérente. */
const totalPonderation = computed(() =>
  epreuveStore
    .bySession(props.id)
    .reduce((total, epreuve) => total + Number(epreuve.ponderation ?? 0), 0)
);

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
  if (key === 'delete') epreuveStore.remove(item.id);
}

const refresh = () => epreuveStore.fetchAll({ force: true });
</script>

<template>
  <div>
    <ExamenHeader
      :title="session?.designation ?? 'Épreuves de la session'"
      :subtitle="session?.code ? `Session ${session.code}` : ''"
      breadcrumb="Épreuves"
      :refresh="refresh"
    >
      <template #actions>
        <button class="btn btn-primary btn-sm px-3 ms-2" @click="openCreate">
          + Ajouter une épreuve
        </button>
      </template>
    </ExamenHeader>

    <div class="row">
      <div class="col-md-12 grid-margin stretch-card">
        <div class="card">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
              <div>
                <h4 class="card-title mb-1">Épreuves</h4>
                <p class="card-description text-muted mb-0">
                  Pondération cumulée :
                  <span
                    class="fw-bold"
                    :class="totalPonderation === 100 ? 'text-success' : 'text-warning'"
                  >
                    {{ totalPonderation }} %
                  </span>
                  <span v-if="totalPonderation !== 100" class="text-muted small">
                    — l'ensemble des épreuves d'une session devrait totaliser 100 %.
                  </span>
                </p>
              </div>

              <div style="min-width: 220px">
                <select v-model="filterType" class="form-select form-select-sm">
                  <option value="">Tous les types</option>
                  <option v-for="type in TYPES_EPREUVE" :key="type.code" :value="type.code">
                    {{ type.label }}
                  </option>
                </select>
              </div>
            </div>

            <LoadingSpinner v-if="loading" />

            <EmptyState
              v-else-if="epreuves.length === 0"
              title="Aucune épreuve"
              description="Ajoutez une première épreuve à cette session."
            />

            <div v-else class="table-responsive">
              <table class="table table-hover align-middle">
                <thead>
                  <tr>
                    <th>Module</th>
                    <th>Désignation</th>
                    <th>Type</th>
                    <th class="text-center">Pondération</th>
                    <th>Date prévue</th>
                    <th class="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="epreuve in epreuves" :key="epreuve.id">
                    <td>
                      <span class="badge bg-light text-dark border">
                        {{ epreuve.code_module ?? '—' }}
                      </span>
                      <div class="small text-muted">{{ epreuve.designation_module ?? '' }}</div>
                    </td>
                    <td class="fw-semibold text-dark">{{ epreuve.designation }}</td>
                    <td>{{ typeEpreuveLabel(epreuve.type_eval) }}</td>
                    <td class="text-center">
                      <span class="badge bg-primary-subtle text-primary">
                        {{ Number(epreuve.ponderation) }} %
                      </span>
                    </td>
                    <td>{{ formatDate(epreuve.date_prevue, 'Non planifiée') }}</td>
                    <td class="text-end">
                      <ItemActions
                        :item="epreuve"
                        :label="epreuve.designation"
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
        </div>
      </div>
    </div>

    <EpreuveFormModal :session-id="id" />
  </div>
</template>

<style scoped>
.table thead th {
  border-bottom: 2px solid #dee2e6;
  font-weight: 600;
}
</style>
