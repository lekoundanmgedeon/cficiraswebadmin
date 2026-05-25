<template>
  <div class="row">
    <div class="col-12 mb-4">
      <div class="card border-0 shadow-sm bg-light-subtle">
        <div
          class="card-body p-3 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3"
        >
          <div>
            <h4 class="mb-1">Classes par Niveau</h4>
            <p class="text-muted small mb-0">
              Sélectionnez un niveau académique pour visualiser les classes rattachées.
            </p>
          </div>

          <div class="d-flex align-items-center gap-2" style="min-width: 250px">
            <label class="text-nowrap text-muted small fw-semibold mb-0">Niveau :</label>
            <select
              v-model="selectedNiveauId"
              @change="handleNiveauChange"
              class="form-select bg-white border-0 shadow-sm fw-medium"
              :disabled="loadingNiveaux"
            >
              <option value="" disabled>-- Choisir un niveau --</option>
              <option v-for="niv in niveaux" :key="niv.id" :value="niv.id">
                {{ niv.code }} - {{ niv.nom || niv.designation || 'Niveau' }}
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
              <th>Filière Rattachement</th>
              <th class="text-center">Capacité Maximale</th>
              <th class="text-center">Date Création</th>
              <th class="text-end pe-3">Actions</th>
            </tr>
          </thead>

          <tbody>
            <tr v-if="!selectedNiveauId">
              <td colspan="6" class="text-center py-5">
                <div class="d-flex flex-column align-items-center py-3">
                  <i
                    class="mdi mdi-arrow-top-right-bold-box-outline text-primary"
                    style="font-size: 3rem; opacity: 0.4"
                  ></i>
                  <div class="text-primary fw-medium mt-2">
                    Veuillez sélectionner un niveau dans le menu ci-dessus
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

            <tr v-else-if="classesByNiveau.length === 0">
              <td colspan="6" class="text-center py-5">
                <div class="d-flex flex-column align-items-center py-3">
                  <i
                    class="mdi mdi-google-classroom text-muted"
                    style="font-size: 3rem; opacity: 0.2"
                  ></i>
                  <div class="text-muted mt-2 small">
                    Aucune classe n'est configurée pour ce niveau
                  </div>
                </div>
              </td>
            </tr>

            <tr v-else v-for="(item, index) in classesByNiveau" :key="item.id">
              <td class="ps-3 text-muted small">{{ index + 1 }}</td>
              <td>
                <span
                  class="badge bg-primary-subtle text-primary border border-primary-subtle font-monospace fw-bold px-2 py-1"
                >
                  {{ item.code }}
                </span>
              </td>
              <td>
                <div class="fw-semibold text-dark">{{ item.filiere_nom }}</div>
              </td>
              <td class="text-center">
                <span class="badge bg-light text-dark border px-3 fw-bold">
                  {{ item.capacite_max }} places
                </span>
              </td>
              <td class="text-center text-muted small">
                {{ formatDate(item.created_at) }}
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
import { useNiveauStore } from '@/stores/academiqueStore/niveauStore';
import ItemActions from '../details/ItemActions.vue';

const classeStore = useClasseStore();
const niveauStore = useNiveauStore();

// États locaux
const selectedNiveauId = ref('');
const loadingNiveaux = ref(false);

/* ========================================================
    Données Réactives (Computed)
======================================================== */
const loading = computed(() => classeStore.loading);

// Branchement sur ta nouvelle clé propre du store
const classesByNiveau = computed(() => classeStore.classesNiveau || []);
const niveaux = computed(() => niveauStore.niveaux || []);

/* ========================================================
    Cycle de vie & Événements
======================================================== */
onMounted(async () => {
  if (niveaux.value.length === 0) {
    try {
      loadingNiveaux.value = true;
      await niveauStore.fetchNiveaux();
    } catch (e) {
      console.error("Erreur lors de l'initialisation des niveaux", e);
    } finally {
      loadingNiveaux.value = false;
    }
  }
});

const handleNiveauChange = async () => {
  if (selectedNiveauId.value) {
    await classeStore.fetchClassesByNiveau(selectedNiveauId.value);
  }
};

/* ========================================================
    Actions & Formats
======================================================== */
const handleEdit = (item) => {
  console.log('Édition classe :', item);
};

const handleDelete = (item) => {
  console.log('Suppression classe :', item);
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
