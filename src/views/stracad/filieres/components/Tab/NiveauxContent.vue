<template>
  <div class="row">
    <div class="col-12 d-flex justify-content-between align-items-center mb-3">
      <div>
        <h4>Niveaux de la filière</h4>
        <p class="text-muted">Liste des niveaux académiques associés à cette filière.</p>
      </div>

      <div class="d-flex align-items-center">
        <div class="dropdown me-2">
          <button
            class="btn btn-outline-primary dropdown-toggle"
            type="button"
            data-bs-toggle="dropdown"
          >
            Filtrer par cycle
          </button>

          <ul class="dropdown-menu">
            <li>
              <button class="dropdown-item" @click="filterByCycle(null)">Tous les cycles</button>
            </li>
            <li v-for="cycle in cycles" :key="cycle.id">
              <button class="dropdown-item" @click="filterByCycle(cycle.id)">
                {{ cycle.cycle_code }}
              </button>
            </li>
          </ul>
        </div>

        <!-- Créer -->
        <button class="btn btn-outline-dark" data-bs-toggle="modal" data-bs-target="#niveauModal">
          + Créer un niveau
        </button>
      </div>

      <NiveauFormModal />
    </div>

    <div class="col-12">
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
              <th width="120"></th>
            </tr>
          </thead>

          <tbody>
            <tr v-if="loading">
              <td colspan="7" class="text-center py-4">Chargement des niveaux...</td>
            </tr>

            <tr v-for="(niveau, index) in paginatedNiveaux" :key="niveau.id">
              <td>{{ startIndex + index + 1 }}</td>
              <td>{{ niveau.code }}</td>
              <td>
                <span class="badge bg-secondary">
                  {{ niveau.ordre + 'e année' }}
                </span>
              </td>
              <td>{{ niveau.cycle_code }}</td>
              <td>{{ formatMoney(niveau.frais_scolarite) }}</td>
              <td>
                <span class="badge" :class="niveau.nb_classes > 0 ? 'bg-success' : 'bg-secondary'">
                  {{ niveau.nb_classes }}
                </span>
              </td>
              <td>
                <ItemActions
                  :item="niveau"
                  :showAdd="false"
                  editModalTarget="#editModuleModal"
                  @edit="editModule"
                  @delete="confirmDelete"
                />
              </td>
            </tr>

            <tr v-if="!loading && niveaux.length === 0">
              <td colspan="7" class="text-center py-4">
                <img src="/img/empty-box.svg" width="80" />
                <div class="text-muted">Aucun niveau enregistré</div>
              </td>
            </tr>
          </tbody>
        </table>

        <Pagination
          v-model="currentPage"
          :items-per-page="itemsPerPage"
          :total-items="niveaux.length"
        />
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, computed, onMounted } from 'vue';
import { useNiveauStore } from '@/stores/academiqueStore/niveauStore';
import { useCycleStore } from '@/stores/academiqueStore/cycleStore';

import NiveauFormModal from '../Modal/addNiveau.vue';
import ItemActions from '../details/ItemActions.vue';

const niveauStore = useNiveauStore();
const cycleStore = useCycleStore();

const selectedCycle = ref(null);
const currentPage = ref(1);
const itemsPerPage = ref(10);

/* =====================
   Computed sécurisés
===================== */
const niveaux = computed(() => (Array.isArray(niveauStore.niveaux) ? niveauStore.niveaux : []));

const cycles = computed(() => (Array.isArray(cycleStore.cycles) ? cycleStore.cycles : []));

const loading = computed(() => niveauStore.loading || cycleStore.loading);

/* =====================
   Pagination
===================== */
const startIndex = computed(() => (currentPage.value - 1) * itemsPerPage.value);

const paginatedNiveaux = computed(() =>
  niveaux.value.slice(startIndex.value, startIndex.value + itemsPerPage.value)
);

/* =====================
   Actions
===================== */
const filterByCycle = async (cycleId) => {
  selectedCycle.value = cycleId;
  currentPage.value = 1;

  if (cycleId) {
    await niveauStore.getNiveauByCycle(cycleId);
  } else {
    await niveauStore.fetchNiveaux();
  }
};

const formatMoney = (value) => {
  return new Intl.NumberFormat('fr-FR').format(value || 0) + ' FCFA';
};

/* =====================
   Lifecycle
===================== */
onMounted(async () => {
  await Promise.all([niveauStore.fetchNiveaux(), cycleStore.fetchCycles()]);
});
</script>
