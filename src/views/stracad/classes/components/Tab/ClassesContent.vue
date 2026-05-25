<template>
  <div class="row">
    <div class="col-12 mb-2 d-flex justify-content-between align-items-center">
      <div>
        <h4>Liste des classes</h4>
        <p class="text-muted">Liste de toutes les classes académiques enregistrées.</p>
      </div>
    </div>

    <div class="col-12">
      <div class="table-responsive card border-0 shadow-sm">
        <table class="table align-middle mb-0 table-hover">
          <thead class="table-light">
            <tr>
              <th class="ps-3">#</th>
              <th>Code</th>
              <th>Filière</th>
              <th>Niveau</th>
              <th class="text-center">Émarge / Capacité max</th>
              <th class="text-end pe-3">Actions</th>
            </tr>
          </thead>

          <tbody>
            <tr v-if="loading">
              <td colspan="6" class="text-center py-5">
                <div class="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
                <span class="text-muted">Chargement des classes...</span>
              </td>
            </tr>

            <tr
              v-else-if="paginatedClasses.length > 0"
              v-for="(classe, index) in paginatedClasses"
              :key="classe.id"
            >
              <td class="ps-3 text-muted">{{ startIndex + index + 1 }}</td>
              <td>
                <strong class="text-dark">{{ classe.code }}</strong>
              </td>
              <td>{{ classe.filiere_nom }}</td>
              <td>
                <span class="badge bg-secondary-subtle text-secondary px-2 py-1 rounded">{{
                  classe.niveau_code
                }}</span>
              </td>
              <td class="text-center">
                <span class="badge bg-success-subtle text-success px-2 py-1 rounded fw-semibold">
                  {{ classe.nb_etudiants }} / {{ classe.capacite_max }}
                </span>
              </td>
              <td class="text-end pe-3">
                <ItemActions
                  :item="classe"
                  concourRoute="/edition-concours/"
                  :showAdd="false"
                  @edit="editClasse"
                  @delete="confirmDelete"
                />
              </td>
            </tr>

            <tr v-else>
              <td colspan="6" class="text-center py-5">
                <div class="d-flex flex-column align-items-center">
                  <img src="/img/empty-box.svg" alt="Aucune donnée" class="mb-2" width="80" />
                  <div class="text-muted small">Aucune classe enregistrée</div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div class="p-3 border-top bg-light-subtle" v-if="classes.length > 0">
          <Pagination
            v-model="currentPage"
            :items-per-page="itemsPerPage"
            :total-items="classes.length"
          />
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, computed, onMounted } from 'vue';
import { useClasseStore } from '@/stores/academiqueStore/classeStore';
import ItemActions from '../details/ItemActions.vue';

const classeStore = useClasseStore();

/* =====================
    États pagination
===================== */
const currentPage = ref(1);
const itemsPerPage = ref(10);

/* =====================
    Computed
===================== */
const loading = computed(() => classeStore.loading);

const classes = computed(() => (Array.isArray(classeStore.classes) ? classeStore.classes : []));

const startIndex = computed(() => (currentPage.value - 1) * itemsPerPage.value);

const paginatedClasses = computed(() =>
  classes.value.slice(startIndex.value, startIndex.value + itemsPerPage.value)
);

/* =====================
    Actions
===================== */
const editClasse = (classe) => {
  console.log('Édition de la classe :', classe);
};

const confirmDelete = (classe) => {
  console.log('Suppression de la classe :', classe);
};

/* =====================
    Lifecycle
===================== */
onMounted(async () => {
  // CORRECTION: Utilisation du bon nom d'action défini dans ton store
  await classeStore.fetchClasses();
});
</script>
