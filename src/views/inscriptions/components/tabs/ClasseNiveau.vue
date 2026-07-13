<template>
  <div class="row">
    <div class="col-12 mb-4 d-flex justify-content-between align-items-center">
      <div>
        <h3 class="fw-bold mb-1">Gestion des Classes</h3>
        <p class="text-muted small mb-0">
          Configuration académique et suivi des effectifs par section.
        </p>
      </div>
      <div class="d-flex gap-2">
        <button class="btn btn-white shadow-sm border btn-sm px-3">
          <i class="mdi mdi-printer me-1"></i>Imprimer listes
        </button>
        <button class="btn btn-secondary btn-sm px-3 shadow-sm">+ Nouvelle Classe</button>
      </div>
    </div>

    <div class="col-12 mb-4">
      <div class="row g-3">
        <div class="col-md-4">
          <div class="stat-card bg-white border-0 shadow-sm p-3 rounded-4">
            <div class="d-flex align-items-center">
              <div class="stat-icon bg-soft-primary text-primary me-3">
                <i class="mdi mdi-google-classroom fs-4"></i>
              </div>
              <div>
                <h4 class="fw-bold mb-0">{{ totalClassesCount }}</h4>
                <p class="text-muted small mb-0 text-uppercase">Classes Actives</p>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="stat-card bg-white border-0 shadow-sm p-3 rounded-4">
            <div class="d-flex align-items-center">
              <div class="stat-icon bg-soft-success text-success me-3">
                <i class="mdi mdi-account-group fs-4"></i>
              </div>
              <div>
                <h4 class="fw-bold mb-0">{{ totalCapacite }}</h4>
                <p class="text-muted small mb-0 text-uppercase">Capacité Totale</p>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="stat-card bg-white border-0 shadow-sm p-3 rounded-4">
            <div class="d-flex align-items-center">
              <div class="stat-icon bg-soft-danger text-danger me-3">
                <i class="mdi mdi-alert-circle-outline fs-4"></i>
              </div>
              <div>
                <h4 class="fw-bold mb-0">{{ classesSurchargeesCount }}</h4>
                <p class="text-muted small mb-0 text-uppercase">Classes Surchargées</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="col-12 mb-4">
      <div class="card border-0 shadow-sm bg-light rounded-4">
        <div class="card-body p-3">
          <div class="row g-3 align-items-center">
            <div class="col-md-8">
              <div class="input-group bg-white rounded shadow-sm">
                <span class="input-group-text bg-white border-0">
                  <i class="mdi mdi-magnify text-primary"></i>
                </span>
                <input
                  type="text"
                  class="form-control border-0"
                  placeholder="Rechercher par code de classe ou filière..."
                  v-model="searchQuery"
                />
              </div>
            </div>
            <div class="col-md-4">
              <select class="form-select border-0 shadow-sm" v-model="filterFiliere">
                <option value="">Toutes les filières</option>
                <option v-for="f in filieresUniques" :key="f" :value="f">{{ f }}</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="col-12">
      <div class="card border-0 shadow-sm rounded-4 overflow-hidden">
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead class="bg-light">
                <tr>
                  <th class="ps-4 py-3">#</th>
                  <th>Identifiant Classe</th>
                  <th>Filière & Spécialité</th>
                  <th class="text-center">Niveau</th>
                  <th class="text-center">Taux de Remplissage</th>
                  <th class="text-end pe-4">Actions</th>
                </tr>
              </thead>

              <tbody>
                <tr v-if="loading">
                  <td colspan="6" class="text-center py-5">
                    <div
                      class="spinner-border text-primary spinner-border-sm me-2"
                      role="status"
                    ></div>
                    <span class="text-muted small">Chargement des classes en cours...</span>
                  </td>
                </tr>

                <tr
                  v-else
                  v-for="(classe, index) in paginatedClasses"
                  :key="classe.id || classe.classe_id"
                  class="transition-all"
                >
                  <td class="ps-4 text-muted small font-monospace">{{ startIndex + index + 1 }}</td>
                  <td>
                    <span class="fw-bold text-primary font-monospace">{{
                      classe.code || classe.classe_code || 'N/A'
                    }}</span>
                  </td>
                  <td>
                    <div class="fw-semibold text-dark">
                      {{ classe.filiere_nom || classe.filiere_code || 'Filière non spécifiée' }}
                    </div>
                    <small class="text-muted"
                      >{{ classe.annee_code || classe.annee || 'N/A' }} • Académique</small
                    >
                  </td>
                  <td class="text-center">
                    <span
                      class="badge bg-soft-info text-info px-3 py-2 rounded-pill font-monospace"
                    >
                      {{ classe.niveau_code || classe.niveau || 'N/A' }}
                    </span>
                  </td>
                  <td class="text-center">
                    <div
                      class="d-flex align-items-center justify-content-center mx-auto"
                      style="max-width: 180px"
                    >
                      <span class="fw-bold me-2 small font-monospace">
                        {{ getEffectif(classe) }}/{{ getCapacite(classe) }}
                      </span>
                      <div
                        class="progress w-100 shadow-sm"
                        style="height: 6px; background-color: #e9ecef"
                        :title="`Taux d'occupation : ${calculateRate(classe)}%`"
                      >
                        <div
                          :class="[
                            'progress-bar rounded-pill',
                            calculateRate(classe) > 100 ? 'bg-danger' : 'bg-success',
                          ]"
                          :style="{ width: Math.min(calculateRate(classe), 100) + '%' }"
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td class="text-end pe-4">
                    <div class="btn-group shadow-sm border rounded bg-white" role="group">
                      <button
                        class="btn btn-sm btn-light border-0 text-secondary"
                        @click="voirEtudiants(classe)"
                        title="Voir la liste des étudiants"
                      >
                        <i class="mdi mdi-account-group-outline fs-6"></i>
                      </button>

                      <button
                        class="btn btn-sm btn-light border-0 text-success border-start"
                        @click="openImport(classe)"
                        title="Importer des étudiants (Excel/CSV)"
                      >
                        <i class="mdi mdi-file-upload-outline fs-6"></i>
                      </button>
                    </div>
                  </td>
                </tr>

                <tr v-if="!loading && filteredClasses.length === 0">
                  <td colspan="6" class="text-center py-5">
                    <div class="d-flex flex-column align-items-center py-3">
                      <i class="mdi mdi-google-classroom text-muted opacity-25 display-4 mb-2"></i>
                      <p class="text-muted mb-0 small">
                        Aucune classe ne correspond à vos critères de recherche.
                      </p>
                    </div>
                  </td>
                </tr>
                <ClasseStudentsModal
                  v-model="showModalEtudiants"
                  :classe="classeSelectionnee"
                  :students="classeStore.students"
                  :loading="classeStore.loading"
                />
              </tbody>
            </table>
          </div>
        </div>

        <div
          v-if="!loading && filteredClasses.length > 0"
          class="card-footer bg-white border-top py-2 px-4"
        >
          <AppPagination
            v-model="currentPage"
            v-model:itemsPerPage="itemsPerPage"
            :total-items="filteredClasses.length"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import AppPagination from '@/components/shared/Pagination.vue';
import { useClasseStore } from '@/modules/structure-academique/classe/store';
import ClasseStudentsModal from '../modal/ClasseEtudiantModal.vue';

const classeStore = useClasseStore();

/* ===================== Filtres de recherche ===================== */
const searchQuery = ref('');
const filterFiliere = ref('');

/* ===================== Pagination ===================== */
const currentPage = ref(1);
const itemsPerPage = ref(10);

/* ===================== Données du Store ===================== */
const loading = computed(() => classeStore.loading);
const classes = computed(() => (Array.isArray(classeStore.classes) ? classeStore.classes : []));

/* ===================== Normalisation des données dynamiques ===================== */
const getCapacite = (c) => Number(c.classe_capacite || c.capacite_max || c.capacite || 0);
const getEffectif = (c) => Number(c.effectif_actuel || c.nb_etudiants || c.effectif || 0);

/* ===================== KPI Réactifs ===================== */
const totalClassesCount = computed(() => classes.value.length);

const totalCapacite = computed(() => {
  return classes.value.reduce((sum, c) => sum + getCapacite(c), 0);
});

const classesSurchargeesCount = computed(() => {
  return classes.value.filter((c) => getEffectif(c) > getCapacite(c)).length;
});

/* ===================== Extraction des filières uniques ===================== */
const filieresUniques = computed(() => {
  const list = classes.value.map((c) => c.filiere_nom || c.filiere_code).filter(Boolean);
  return [...new Set(list)].sort();
});

/* ===================== Filtrage combiné ===================== */
const filteredClasses = computed(() => {
  return classes.value.filter((c) => {
    const search = searchQuery.value.toLowerCase().trim();
    const code = c.code || c.classe_code || '';
    const filiere = c.filiere_nom || c.filiere_code || '';

    const matchSearch =
      !search || code.toLowerCase().includes(search) || filiere.toLowerCase().includes(search);

    const matchFiliere = !filterFiliere.value || filiere === filterFiliere.value;
    return matchSearch && matchFiliere;
  });
});

const startIndex = computed(() => (currentPage.value - 1) * itemsPerPage.value);

const paginatedClasses = computed(() => {
  return filteredClasses.value.slice(startIndex.value, startIndex.value + itemsPerPage.value);
});

/* ===================== Calcul du Taux de Remplissage ===================== */
const calculateRate = (classe) => {
  const cap = getCapacite(classe);
  if (!cap) return 0;
  return Math.round((getEffectif(classe) / cap) * 100);
};

/* ===================== Modaux Actions ===================== */
const classeSelectionnee = ref(null);
const showModalEtudiants = ref(false);

// 2. Lier dynamiquement la liste des étudiants du store
const studentsOfClasse = computed(() => classeStore.students || []);

const voirEtudiants = async (classe) => {
  classeSelectionnee.value = classe;
  showModalEtudiants.value = true;

  const targetId = classe.id || classe.classe_id;
  if (targetId) {
    // Appel de votre store Pinia qui stocke le résultat dans classeStore.students
    await classeStore.fetchClasseStudents(targetId);
  }
};

/* ===================== Lifecycle & Watchers ===================== */
onMounted(() => {
  classeStore.fetchClasses();
});

watch([searchQuery, filterFiliere], () => {
  currentPage.value = 1;
});
</script>

<style scoped>
/* Design Cards & Icons */
.stat-icon {
  width: 45px;
  height: 45px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.bg-soft-primary {
  background: rgba(13, 110, 253, 0.1);
}
.bg-soft-success {
  background: rgba(25, 135, 84, 0.1);
}
.bg-soft-warning {
  background: rgba(255, 193, 7, 0.1);
}
.bg-soft-danger {
  background: rgba(220, 53, 69, 0.1);
}
.bg-soft-info {
  background: rgba(13, 202, 240, 0.1);
  color: #0dcaf0 !important;
}

.btn-white {
  background: #fff;
  border: 1px solid #dee2e6;
}
.btn-white:hover {
  background: #f8f9fa;
}

/* Table Design */
.table thead th {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: #6c757d;
  border: none;
  padding-top: 14px;
  padding-bottom: 14px;
}
.table tbody tr {
  transition: all 0.2s ease;
}
.table tbody tr:hover {
  background-color: #fcfdfe !important;
  transform: scale(1.001);
}
.transition-all {
  transition: all 0.3s ease;
}
.rounded-4 {
  border-radius: 0.5rem !important;
}
</style>
