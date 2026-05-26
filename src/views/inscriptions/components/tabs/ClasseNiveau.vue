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
              <div class="stat-icon bg-soft-warning text-warning me-3">
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
                    <div class="spinner-border text-primary spinner-border-sm me-2"></div>
                    Chargement des classes...
                  </td>
                </tr>

                <tr
                  v-else
                  v-for="(classe, index) in paginatedClasses"
                  :key="classe.classe_id"
                  class="transition-all"
                >
                  <td class="ps-4 text-muted small">{{ startIndex + index + 1 }}</td>
                  <td>
                    <span class="fw-bold text-primary">{{ classe.code }}</span>
                  </td>
                  <td>
                    <div class="fw-semibold text-dark">{{ classe.filiere_nom || 'Filière non spécifiée' }}</div>
                    <small class="text-muted">{{ classe.annee_code || 'N/A' }} • Académique</small>
                  </td>
                  <td class="text-center">
                    <span class="badge bg-soft-info text-info px-3 py-2 rounded-pill">
                      {{ classe.niveau_code }}
                    </span>
                  </td>
                  <td class="text-center">
                    <div class="d-flex align-items-center justify-content-center" style="min-width: 150px;">
                      <span class="fw-bold me-2 small">{{ classe.nb_etudiants || 0 }}/{{ classe.capacite_max }}</span>
                      <div class="progress w-50" style="height: 6px" :title="`Taux d'occupation : ${calculateRate(classe)}%`">
                        <div 
                          :class="['progress-bar', calculateRate(classe) > 100 ? 'bg-danger' : 'bg-success']" 
                          :style="{ width: Math.min(calculateRate(classe), 100) + '%' }"
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td class="text-end pe-4">
                    <div class="btn-group shadow-sm" role="group">
                      <button
                        class="btn btn-sm btn-outline-secondary d-flex align-items-center"
                        @click="voirEtudiants(classe)"
                        title="Voir la liste des étudiants"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="14"
                          height="14"
                          fill="currentColor"
                          class="me-1"
                          viewBox="0 0 24 24"
                        >
                          <path d="M16 11C17.66 11 18.99 9.66 18.99 8S17.66 5 16 5 13 6.34 13 8 14.34 11 16 11M8 11C9.66 11 10.99 9.66 10.99 8S9.66 5 8 5 5 6.34 5 8 6.34 11 8 11M8 13C5.33 13 0 14.34 0 17V19H16V17C16 14.34 10.67 13 8 13M16 13C15.5 13 14.96 13.04 14.39 13.1C15.78 14.03 17 15.35 17 17V19H24V17C24 14.34 18.67 13 16 13Z" />
                        </svg>
                        Étudiants
                      </button>

                      <button
                        class="btn btn-sm btn-outline-success"
                        @click="openImport(classe)"
                        title="Importer des étudiants (Excel/CSV)"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="14"
                          height="14"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M5 20H19V18H5V20M19 9H15V3H9V9H5L12 16L19 9Z" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>

                <tr v-if="!loading && filteredClasses.length === 0">
                  <td colspan="6" class="text-center py-5">
                    <img src="/img/empty-box.svg" width="100" class="mb-3 opacity-50" onerror="this.style.display='none'" />
                    <p class="text-muted mb-0">Aucune classe ne correspond à vos critères de recherche.</p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        <div v-if="!loading && filteredClasses.length > 0" class="card-footer bg-white border-0 py-3">
          <Pagination
            v-model="currentPage"
            :items-per-page="itemsPerPage"
            :total-items="filteredClasses.length"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useClasseStore } from '@/stores/academiqueStore/classeStore';

const classeStore = useClasseStore();

/* ===================== Filtres de recherche ===================== */
const searchQuery = ref('');
const filterFiliere = ref('');

/* ===================== Pagination ===================== */
const currentPage = ref(1);
const itemsPerPage = ref(10);

/* ===================== Données du Store (Securisées) ===================== */
const loading = computed(() => classeStore.loading);
const classes = computed(() => Array.isArray(classeStore.classes) ? classeStore.classes : []);

/* ===================== KPI Réactifs ===================== */
const totalClassesCount = computed(() => classes.value.length);

const totalCapacite = computed(() => {
  return classes.value.reduce((sum, c) => sum + (Number(c.classe_capacite) || 0), 0);
});

const classesSurchargeesCount = computed(() => {
  return classes.value.filter(c => (c.effectif_actuel || 0) > (c.classe_capacite || 0)).length;
});

/* ===================== Extraction des filières uniques ===================== */
const filieresUniques = computed(() => {
  const list = classes.value.map(c => c.filiere_nom).filter(Boolean);
  return [...new Set(list)].sort();
});

/* ===================== Filtrage combiné ===================== */
const filteredClasses = computed(() => {
  return classes.value.filter((c) => {
    const search = searchQuery.value.toLowerCase().trim();
    const matchSearch = !search || c.classe_code?.toLowerCase().includes(search) || c.filiere_nom?.toLowerCase().includes(search);
    const matchFiliere = !filterFiliere.value || c.filiere_nom === filterFiliere.value;
    return matchSearch && matchFiliere;
  });
});

const startIndex = computed(() => (currentPage.value - 1) * itemsPerPage.value);

const paginatedClasses = computed(() => {
  return filteredClasses.value.slice(startIndex.value, startIndex.value + itemsPerPage.value);
});

/* ===================== Calcul du Taux de Remplissage ===================== */
const calculateRate = (classe) => {
  if (!classe.classe_capacite) return 0;
  return Math.round(((classe.effectif_actuel || 0) / classe.classe_capacite) * 100);
};

/* ===================== Importation de Fichiers ===================== */
const classeSelectionnee = ref(null);
const showModalImport = ref(false);

const openImport = (classe) => {
  classeSelectionnee.value = classe;
  showModalImport.value = true;
};

/* ===================== Consultation Étudiants ===================== */
const showModalEtudiants = ref(false);

const voirEtudiants = async (classe) => {
  classeSelectionnee.value = classe;
  showModalEtudiants.value = true;
  // Appel direct à l'action déclarée dans ton store classeStore
  await classeStore.fetchClasseStudents(classe.classe_id);
};

/* ===================== Lifecycle & Watchers ===================== */
onMounted(() => {
  // Appel de l'action réelle définie dans le store fourni
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
.bg-soft-primary { background: rgba(13, 110, 253, 0.1); }
.bg-soft-success { background: rgba(25, 135, 84, 0.1); }
.bg-soft-warning { background: rgba(255, 193, 7, 0.1); }
.bg-soft-info { background: rgba(13, 202, 240, 0.1); }

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
}
.table tbody tr {
  transition: all 0.2s ease;
}
.table tbody tr:hover {
  background-color: #fcfdfe !important;
}
.transition-all {
  transition: all 0.3s ease;
}
.rounded-4 {
  border-radius: 0.5rem !important;
}
</style>