<script setup>
import { computed, onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import ItemActions from '@/shared/components/ItemActions.vue';
import EmptyState from '@/shared/components/EmptyState.vue';
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue';
import Pagination from '@/components/shared/Pagination.vue';
import { usePagination } from '@/shared/composables/usePagination';
import { useNiveauStore } from '../store';
import { useCycleStore } from '../../cycle/store';
import { useNiveauForm } from '../composables/useNiveauForm';
import NiveauFormModal from './NiveauFormModal.vue';
import { formatMontant } from '@/shared/utils/parametres';

/**
 * Liste des niveaux, filtrable par cycle.
 *
 * L'ancienne version appelait `niveauStore.getNiveauByCycle(cycleId)` — une
 * action qui n'a jamais existé sur le store : filtrer par cycle levait un
 * TypeError. Aucun endpoint « niveaux par cycle » n'existe d'ailleurs côté
 * backend. Le filtre est donc appliqué en mémoire, sur la liste déjà chargée :
 * c'est instantané et cela ne coûte aucune requête.
 */

const niveauStore = useNiveauStore();
const cycleStore = useCycleStore();
const { openCreate, openEdit } = useNiveauForm();

const { items: niveaux, loading } = storeToRefs(niveauStore);
const { items: cycles } = storeToRefs(cycleStore);

/** Code du cycle sélectionné, `null` pour « tous les cycles ». */
const selectedCycleCode = ref(null);

// Les deux listes sont servies par le cache si elles ont déjà été chargées.
onMounted(() => Promise.all([niveauStore.fetchAll(), cycleStore.fetchAll()]));

const filteredNiveaux = computed(() =>
  selectedCycleCode.value
    ? niveaux.value.filter((niveau) => niveau.cycle_code === selectedCycleCode.value)
    : niveaux.value
);

const {
  page: currentPage,
  itemsPerPage,
  startIndex,
  paginated: paginatedNiveaux,
} = usePagination(filteredNiveaux, { perPage: 10, resetKey: () => selectedCycleCode.value });

/** @param {string|null} cycleCode */
function filterByCycle(cycleCode) {
  selectedCycleCode.value = cycleCode;
}

/** @param {number} value */
// Devise réglée depuis l'écran Paramètres, plus « FCFA » en dur.
const formatMoney = (value) => formatMontant(value);

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
  if (key === 'delete') niveauStore.remove(item.id);
}
</script>

<template>
  <div>
    <div class="d-flex justify-content-between align-items-center mb-3">
      <div>
        <h4>Niveaux</h4>
        <p class="text-muted mb-0">Niveaux académiques, tous cycles confondus.</p>
      </div>

      <div class="d-flex align-items-center gap-2">
        <div class="dropdown">
          <button
            class="btn btn-sm btn-outline-primary dropdown-toggle"
            type="button"
            data-bs-toggle="dropdown"
          >
            {{ selectedCycleCode ?? 'Filtrer par cycle' }}
          </button>
          <ul class="dropdown-menu">
            <li>
              <button class="dropdown-item" @click="filterByCycle(null)">Tous les cycles</button>
            </li>
            <li v-for="cycle in cycles" :key="cycle.id">
              <button class="dropdown-item" @click="filterByCycle(cycle.code)">
                {{ cycle.code }}
              </button>
            </li>
          </ul>
        </div>

        <button class="btn btn-sm btn-outline-dark" @click="openCreate">+ Créer un niveau</button>
      </div>
    </div>

    <LoadingSpinner v-if="loading" />

    <EmptyState
      v-else-if="filteredNiveaux.length === 0"
      title="Aucun niveau enregistré"
      :description="
        selectedCycleCode
          ? 'Aucun niveau ne correspond à ce cycle.'
          : 'Créez un premier niveau pour commencer.'
      "
    />

    <template v-else>
      <div class="table-responsive">
        <table class="table table-striped align-middle">
          <thead>
            <tr>
              <th>#</th>
              <th>Code</th>
              <th>Niveau</th>
              <th>Cycle</th>
              <th>Frais scolarité</th>
              <th>Classes</th>
              <th><span class="visually-hidden">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(niveau, index) in paginatedNiveaux" :key="niveau.id">
              <td>{{ startIndex + index + 1 }}</td>
              <td>{{ niveau.code }}</td>
              <td>
                <span class="badge bg-secondary">{{ niveau.ordre }}e année</span>
              </td>
              <td>{{ niveau.cycle_code }}</td>
              <td>{{ formatMoney(niveau.frais_scolarite) }}</td>
              <td>
                <span class="badge" :class="niveau.nb_classes > 0 ? 'bg-success' : 'bg-secondary'">
                  {{ niveau.nb_classes ?? 0 }}
                </span>
              </td>
              <td>
                <ItemActions
                  :item="niveau"
                  :label="niveau.code"
                  :actions="actions"
                  @action="onAction"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <Pagination
        v-model="currentPage"
        v-model:items-per-page="itemsPerPage"
        :total-items="filteredNiveaux.length"
      />
    </template>

    <NiveauFormModal />
  </div>
</template>
