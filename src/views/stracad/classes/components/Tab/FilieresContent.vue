<template>
  <div class="row">
    <div class="col-12 mb-4">
      <div class="card border-0 shadow-sm bg-light-subtle">
        <div
          class="card-body p-3 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3"
        >
          <div>
            <h4 class="mb-1">Classes par Filière académique</h4>
            <p class="text-muted small mb-0">
              Sélectionnez une filière pour charger et gérer ses classes rattachées.
            </p>
          </div>

          <div class="d-flex align-items-center gap-2" style="min-width: 300px">
            <label class="text-nowrap text-muted small fw-semibold mb-0">Filière :</label>
            <select
              v-model="selectedFiliereId"
              @change="handleFiliereChange"
              class="form-select bg-white border-0 shadow-sm fw-medium"
              :disabled="loadingFilieres"
            >
              <option value="" disabled>-- Choisir une filière --</option>
              <option v-for="fil in filieres" :key="fil.id" :value="fil.id">
                {{ fil.nom || fil.filiere || fil.code }}
              </option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <div class="col-12">
      <div class="table-responsive card border-0 shadow-sm">
        <table class="table align-middle mb-0 table-hover">
          <thead class="table-light">
            <tr>
              <th class="ps-3">#</th>
              <th>Code Classe</th>
              <th>Niveau</th>
              <th class="text-center">Capacité Maximale</th>
              <th class="text-center">Dernière mise à jour</th>
              <th class="text-end pe-3">Actions</th>
            </tr>
          </thead>

          <tbody>
            <tr v-if="!selectedFiliereId">
              <td colspan="6" class="text-center py-5">
                <div class="d-flex flex-column align-items-center py-3">
                  <i
                    class="mdi mdi-filter-variant text-primary"
                    style="font-size: 3rem; opacity: 0.4"
                  ></i>
                  <div class="text-primary fw-medium mt-2">
                    Veuillez sélectionner une filière dans le menu ci-dessus
                  </div>
                </div>
              </td>
            </tr>

            <tr v-else-if="loading">
              <td colspan="6" class="text-center py-5">
                <div class="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
                <span class="text-muted">Récupération des classes...</span>
              </td>
            </tr>

            <tr v-else-if="classesByFiliere.length === 0">
              <td colspan="6" class="text-center py-5">
                <div class="d-flex flex-column align-items-center py-3">
                  <i
                    class="mdi mdi-google-classroom text-muted"
                    style="font-size: 3rem; opacity: 0.2"
                  ></i>
                  <div class="text-muted mt-2 small">
                    Aucune classe n'est configurée pour cette filière
                  </div>
                </div>
              </td>
            </tr>

            <tr v-else v-for="(item, index) in classesByFiliere" :key="item.id">
              <td class="ps-3 text-muted small">{{ index + 1 }}</td>
              <td>
                <span
                  class="badge bg-primary-subtle text-primary border border-primary-subtle font-monospace fw-bold px-2 py-1"
                >
                  {{ item.code }}
                </span>
              </td>
              <td>
                <span
                  class="badge bg-secondary-subtle text-secondary font-monospace px-2 py-1 rounded"
                >
                  {{ item.niveau_code }}
                </span>
              </td>
              <td class="text-center">
                <span class="badge bg-light text-dark border px-3 fw-bold">
                  {{ item.capacite_max }} places
                </span>
              </td>
              <td class="text-center text-muted small">
                {{ formatDate(item.updated_at) }}
              </td>
              <td class="text-end pe-3">
                <ItemActions
                  :item="item"
                  :showAdd="false"
                  @edit="handleEdit"
                  @delete="handleDelete"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useClasseStore } from '@/stores/academiqueStore/classeStore';
import { useFiliereStore } from '@/stores/academiqueStore/filiereStore';
import ItemActions from '../details/ItemActions.vue';

const classeStore = useClasseStore();
const filiereStore = useFiliereStore();

// États locaux
const selectedFiliereId = ref('');
const loadingFilieres = ref(false);

/* ========================================================
    Données Réactives (Computed)
======================================================== */
const loading = computed(() => classeStore.loading);

// Écoute des classes (adapte à .classesFiliere si tu modifies ton store comme vu précédemment)
const classesByFiliere = computed(() => classeStore.classes || []);

// Utilisation de la liste plate des filières pour le menu déroulant
const filieres = computed(() => filiereStore.filieres || []);

/* ========================================================
    Cycle de vie & Événements
======================================================== */
onMounted(async () => {
  // Si le catalogue global des filières n'a pas encore été chargé
  if (filieres.value.length === 0) {
    try {
      loadingFilieres.value = true;
      // On déclenche l'action de liste à plat du filiereStore
      await filiereStore.fetchFilieres();
    } catch (e) {
      console.error("Erreur lors de l'initialisation de la liste des filières", e);
    } finally {
      loadingFilieres.value = false;
    }
  }
});

// Dès qu'on choisit une filière, on requête les classes correspondantes
const handleFiliereChange = async () => {
  if (selectedFiliereId.value) {
    await classeStore.fetchClassesByFiliere(selectedFiliereId.value);
  }
};

/* ========================================================
    Actions & Formats
======================================================== */
const handleEdit = (item) => {
  console.log('Édition classe filière :', item);
};

const handleDelete = (item) => {
  console.log('Suppression classe filière :', item);
};

const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};
</script>
