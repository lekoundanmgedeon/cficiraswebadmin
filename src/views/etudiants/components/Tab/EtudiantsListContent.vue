<template>
  <div class="row">
    <!-- Header avec Statistiques Rapides -->
    <div class="col-12 mb-4 d-flex justify-content-between align-items-center">
      <div>
        <h3 class="fw-bold mb-1">Répertoire des Étudiants</h3>
        <p class="text-muted small mb-0">
          <i class="mdi mdi-account-group-outline me-1"></i>
          Total : <b>{{ store.etudiants.length }}</b> étudiants inscrits cette année.
        </p>
      </div>

      <div class="dropdown me-2">
        <button
          class="btn btn-outline-dark dropdown-toggle"
          type="button"
          data-bs-toggle="dropdown"
        >
          Exporter
        </button>

        <ul class="dropdown-menu">
          <li>
            <button class="dropdown-item" @click="exportPDF">Export PDF</button>
          </li>

          <li>
            <button class="dropdown-item" @click="exportCSV">Export CSV</button>
          </li>

          <li>
            <button class="dropdown-item" @click="exportExcel">Export Excel</button>
          </li>

          <li>
            <button class="dropdown-item" @click="printTable">Imprimer</button>
          </li>
        </ul>
      </div>
    </div>

    <!-- Zone de Filtres "Flat Design" -->
    <div class="col-12 mb-4">
      <div class="card border-0 shadow-sm bg-light rounded-4">
        <div class="card-body p-3">
          <div class="row g-3">
            <div class="col-md-5">
              <div class="input-group bg-white rounded shadow-sm">
                <span class="input-group-text bg-white border-0">
                  <i class="mdi mdi-magnify text-primary"></i>
                </span>
                <input
                  type="text"
                  class="form-control border-0"
                  placeholder="Rechercher par nom, matricule..."
                  v-model="searchQuery"
                />
              </div>
            </div>
            <div class="col-md-3">
              <select class="form-select border-0 shadow-sm" v-model="filterFiliere">
                <option value="">Toutes les filières</option>
                <option v-for="f in filieres" :key="f">{{ f }}</option>
              </select>
            </div>
            <div class="col-md-2">
              <select class="form-select border-0 shadow-sm" v-model="filterSexe">
                <option value="">Genre</option>
                <option value="M">Masculin</option>
                <option value="F">Féminin</option>
              </select>
            </div>
            <div class="col-md-2">
              <button class="btn btn-white w-100 shadow-sm border-0" @click="resetFilters">
                <i class="mdi mdi-filter-variant me-1"></i> Reset
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tableau des Étudiants -->
    <div class="col-12">
      <div class="card border-0 shadow-sm rounded-4 overflow-hidden">
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead class="bg-light">
                <tr>
                  <th class="ps-4 py-3">#</th>
                  <th>Étudiant</th>
                  <th>Matricule</th>
                  <th class="text-center">Genre</th>
                  <th>Parcours Académique</th>
                  <th>Année</th>
                  <th class="text-end pe-4">Actions</th>
                </tr>
              </thead>

              <tbody>
                <!-- Loader -->
                <tr v-if="store.loading">
                  <td colspan="7" class="text-center py-5">
                    <div class="spinner-border text-primary spinner-border-sm me-2"></div>
                    Chargement de la base de données...
                  </td>
                </tr>

                <!-- Liste -->
                <tr
                  v-for="(etudiant, index) in paginatedEtudiants"
                  :key="etudiant.id"
                  class="transition-all"
                >
                  <td class="ps-4 text-muted small">{{ startIndex + index + 1 }}</td>
                  <td>
                    <div class="d-flex align-items-center">
                      <div
                        class="avatar-circle me-3"
                        :class="
                          etudiant.sexe === 'M'
                            ? 'bg-soft-info text-info'
                            : 'bg-soft-warning text-warning'
                        "
                      >
                        {{ etudiant.nom[0] }}{{ etudiant.prenom[0] }}
                      </div>
                      <div>
                        <div class="fw-bold text-dark">
                          {{ etudiant.nom }} {{ etudiant.prenom }}
                        </div>
                        <small class="text-muted">Inscrit via Dossier Papier</small>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span class="badge bg-light text-primary border fw-bold">{{
                      etudiant.matricule
                    }}</span>
                  </td>
                  <td class="text-center">
                    <span
                      class="badge rounded-pill px-3 py-2"
                      :class="
                        etudiant.sexe === 'M'
                          ? 'bg-soft-info text-info'
                          : 'bg-soft-warning text-warning'
                      "
                    >
                      <i
                        class="mdi"
                        :class="etudiant.sexe === 'M' ? 'mdi-gender-male' : 'mdi-gender-female'"
                      ></i>
                      {{ etudiant.sexe }}
                    </span>
                  </td>
                  <td>
                    <div class="fw-semibold">{{ etudiant.classe }}</div>
                    <small class="text-muted">{{ etudiant.filiere }}</small>
                  </td>
                  <td>
                    <span class="text-dark">{{ etudiant.annee_academique }}</span>
                  </td>
                  <td class="text-end pe-4">
                    <ItemActions
                      :item="etudiant"
                      :showAdd="false"
                      editModalTarget="#editEtudiantModal"
                      @edit="editEtudiant"
                      @delete="confirmDelete"
                      class="d-inline-block"
                    />
                  </td>
                </tr>

                <!-- Vide -->
                <tr v-if="!store.loading && paginatedEtudiants.length === 0">
                  <td colspan="7" class="text-center py-5">
                    <div class="py-4">
                      <img
                        src="/img/empty-box.svg"
                        alt="Vide"
                        width="100"
                        class="mb-3 opacity-50"
                      />
                      <h6 class="text-muted">Aucun étudiant trouvé</h6>
                      <p class="small text-muted">Essayez de modifier vos critères de recherche.</p>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <!-- Footer / Pagination -->
        <div class="card-footer bg-white border-0 py-3">
          <Pagination
            v-model="currentPage"
            :items-per-page="itemsPerPage"
            :total-items="store.etudiants.length"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Avatars */
.avatar-circle {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.85rem;
  letter-spacing: -0.5px;
}

/* Couleurs Soft (Badge & Avatar) */
.bg-soft-info {
  background-color: rgba(13, 202, 240, 0.12);
  color: #0dcaf0;
}
.bg-soft-warning {
  background-color: rgba(255, 193, 7, 0.15);
  color: #997404;
}

/* Table styling */
.table thead th {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: #6c757d;
  border: none;
}

.table tbody tr {
  border-bottom: 1px solid #f8f9fa;
  transition: background 0.2s;
}

.table tbody tr:hover {
  background-color: #fcfdfe !important;
}

/* Buttons & Inputs */
.btn-white {
  background: #fff;
  border: 1px solid #edf2f9;
}
.rounded-4 {
  border-radius: 0.2rem !important;
}

.transition-all {
  transition: all 0.3s ease;
}
</style>

<script setup>
import { computed, onMounted, ref } from 'vue';
import ItemActions from '../details/ItemActions.vue';
import Pagination from '@/components/shared/Pagination.vue';
import { useEtudiantStore } from '@/stores/etudiants/etudiantStore';

const store = useEtudiantStore();
console.log('data :', store.etudiants);

// Pagination
const currentPage = ref(1);
const itemsPerPage = ref(10);

const startIndex = computed(() => (currentPage.value - 1) * itemsPerPage.value);
const paginatedEtudiants = computed(() =>
  store.etudiants.slice(startIndex.value, startIndex.value + itemsPerPage.value)
);

// Actions
const editEtudiant = (etudiant) => {
  store.fetchEtudiantById(etudiant.id);
  // ouvrir modal édition par exemple
};
const confirmDelete = (etudiant) => {
  if (confirm(`Voulez-vous vraiment supprimer ${etudiant.nom} ${etudiant.prenom} ?`)) {
    store.removeEtudiant(etudiant.id);
  }
};

// Charger les étudiants au montage
onMounted(() => {
  store.fetchEtudiants();
});
</script>
