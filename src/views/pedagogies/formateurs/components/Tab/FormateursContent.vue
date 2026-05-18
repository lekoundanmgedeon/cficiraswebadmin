<template>
  <div class="row">
    <!-- Header avec Statistiques Rapides -->
    <div class="col-12 mb-4 d-flex justify-content-between align-items-center">
      <div>
        <h3 class="fw-bold mb-1">Répertoire des Formateurs</h3>
        <p class="text-muted small mb-0">
          <i class="bi bi-person-badge me-1"></i>
          Total : <b>{{ filteredFormateurs.length }}</b> enseignants trouvés.
        </p>
      </div>

      <!-- Menu Exporter -->
      <div class="dropdown me-2">
        <button
          class="btn btn-outline-dark dropdown-toggle"
          type="button"
          data-bs-toggle="dropdown"
        >
          Exporter
        </button>
        <ul class="dropdown-menu">
          <li><button class="dropdown-item" @click="exportPDF">Export PDF</button></li>
          <li><button class="dropdown-item" @click="exportCSV">Export CSV</button></li>
          <li><button class="dropdown-item" @click="exportExcel">Export Excel</button></li>
          <li><button class="dropdown-item" @click="printTable">Imprimer</button></li>
        </ul>
      </div>
    </div>

    <!-- Zone de Filtres "Flat Design" -->
    <div class="col-12 mb-4">
      <div class="card border-0 shadow-sm bg-light rounded-4">
        <div class="card-body p-3">
          <div class="row g-3">
            <!-- Recherche textuelle -->
            <div class="col-md-5">
              <div class="input-group bg-white rounded shadow-sm">
                <span class="input-group-text bg-white border-0">
                  <i class="bi bi-search text-primary"></i>
                </span>
                <input
                  type="text"
                  class="form-control border-0"
                  placeholder="Rechercher par nom, prénom ou spécialité..."
                  v-model="searchQuery"
                />
              </div>
            </div>
            <!-- Filtre Département -->
            <div class="col-md-3">
              <select class="form-select border-0 shadow-sm" v-model="filterDepartement">
                <option value="">Tous les départements</option>
                <option v-for="d in departements" :key="d">{{ d }}</option>
              </select>
            </div>
            <!-- Filtre Statut / Contrat -->
            <div class="col-md-2">
              <select class="form-select border-0 shadow-sm" v-model="filterContrat">
                <option value="">Type de contrat</option>
                <option value="Permanent">Permanent</option>
                <option value="Vacataire">Vacataire</option>
              </select>
            </div>
            <!-- Bouton Reset -->
            <div class="col-md-2">
              <button class="btn btn-white w-100 shadow-sm border-0" @click="resetFilters">
                <i class="bi bi-sliders me-1"></i> Reset
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tableau des Formateurs -->
    <div class="col-12">
      <div class="card border-0 shadow-sm rounded-4 overflow-hidden">
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead class="bg-light">
                <tr>
                  <th class="ps-4 py-3">#</th>
                  <th>Formateur</th>
                  <th>Code Enseignant</th>
                  <th class="text-center">Statut</th>
                  <th>Département & Spécialité</th>
                  <th>Contact</th>
                  <th class="text-end pe-4">Actions</th>
                </tr>
              </thead>

              <tbody>
                <!-- Loader Simulé -->
                <tr v-if="isLoading">
                  <td colspan="7" class="text-center py-5">
                    <div class="spinner-border text-primary spinner-border-sm me-2"></div>
                    Chargement de la base de données des formateurs...
                  </td>
                </tr>

                <!-- Liste des formateurs -->
                <tr
                  v-else
                  v-for="(formateur, index) in paginatedFormateurs"
                  :key="formateur.id"
                  class="transition-all"
                >
                  <td class="ps-4 text-muted small">{{ startIndex + index + 1 }}</td>
                  <td>
                    <div class="d-flex align-items-center">
                      <div
                        class="avatar-circle me-3"
                        :class="
                          formateur.contrat === 'Permanent'
                            ? 'bg-soft-success text-success'
                            : 'bg-soft-purple text-purple'
                        "
                      >
                        {{ formateur.nom[0] }}{{ formateur.prenom[0] }}
                      </div>
                      <div>
                        <div class="fw-bold text-dark">
                          {{ formateur.nom }} {{ formateur.prenom }}
                        </div>
                        <small class="text-muted">Inscrit depuis le {{ formateur.date_embauche }}</small>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span class="badge bg-light text-primary border fw-bold">
                      {{ formateur.code_enseignant }}
                    </span>
                  </td>
                  <td class="text-center">
                    <span
                      class="badge rounded-pill px-3 py-2"
                      :class="
                        formateur.contrat === 'Permanent'
                          ? 'bg-soft-success text-success'
                          : 'bg-soft-purple text-purple'
                      "
                    >
                      <i
                        class="bi me-1"
                        :class="formateur.contrat === 'Permanent' ? 'bi-shield-check' : 'bi-clock'"
                      ></i>
                      {{ formateur.contrat }}
                    </span>
                  </td>
                  <td>
                    <div class="fw-semibold">{{ formateur.departement }}</div>
                    <small class="text-muted">{{ formateur.specialite }}</small>
                  </td>
                  <td>
                    <div class="small text-dark">{{ formateur.email }}</div>
                    <small class="text-muted">{{ formateur.telephone }}</small>
                  </td>
                  <td class="text-end pe-4">
                    <ItemActions
                      :item="formateur"
                      :showAdd="false"
                      editModalTarget="#editFormateurModal"
                      @edit="editFormateur"
                      @delete="confirmDelete"
                      class="d-inline-block"
                    />
                  </td>
                </tr>

                <!-- Cas où la liste est vide -->
                <tr v-if="!isLoading && filteredFormateurs.length === 0">
                  <td colspan="7" class="text-center py-5">
                    <div class="py-4">
                      <h6 class="text-muted fw-bold">Aucun formateur trouvé</h6>
                      <p class="small text-muted mb-0">Essayez de modifier vos filtres ou critères de recherche.</p>
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
            :total-items="filteredFormateurs.length"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue';
import ItemActions from '../Details/DetailItemv2.vue';
import Pagination from '@/components/shared/Pagination.vue';

// Variables de contrôle d'état
const isLoading = ref(true);
const currentPage = ref(1);
const itemsPerPage = ref(5); // Mis à 5 pour tester la pagination facilement
const searchQuery = ref('');
const filterDepartement = ref('');
const filterContrat = ref('');

const departements = ref(['Informatique', 'Management', 'Génie Civil', 'Langues']);

// Données Factices (Mock Data)
const mockFormateurs = ref([
  { id: 1, nom: 'Dupont', prenom: 'Jean', code_enseignant: 'ENS-2024-001', contrat: 'Permanent', departement: 'Informatique', specialite: 'Développement Vue.js & Node.js', email: 'j.dupont@ecole.com', telephone: '+33 6 12 34 56 78', date_embauche: '12/09/2022' },
  { id: 2, nom: 'Alami', prenom: 'Sanaa', code_enseignant: 'ENS-2023-042', contrat: 'Vacataire', departement: 'Management', specialite: 'Gestion de Projet & ERP', email: 's.alami@ecole.com', telephone: '+212 6 98 76 54 32', date_embauche: '05/01/2024' },
  { id: 3, nom: 'Traoré', prenom: 'Moussa', code_enseignant: 'ENS-2021-105', contrat: 'Permanent', departement: 'Informatique', specialite: 'Architecture Cloud & DevOps', email: 'm.traore@ecole.com', telephone: '+221 77 123 45 67', date_embauche: '18/11/2021' },
  { id: 4, nom: 'Muller', prenom: 'Charlotte', code_enseignant: 'ENS-2025-012', contrat: 'Permanent', departement: 'Langues', specialite: 'Anglais Professionnel', email: 'c.muller@ecole.com', telephone: '+33 7 89 45 12 23', date_embauche: '01/09/2025' },
  { id: 5, nom: 'Rousseau', prenom: 'Pierre', code_enseignant: 'ENS-2024-089', contrat: 'Vacataire', departement: 'Génie Civil', specialite: 'RDM & Structures', email: 'p.rousseau@ecole.com', telephone: '+33 6 45 78 12 56', date_embauche: '15/02/2024' },
  { id: 6, nom: 'Martin', prenom: 'Sophie', code_enseignant: 'ENS-2022-031', contrat: 'Permanent', departement: 'Management', specialite: 'Ressources Humaines', email: 's.martin@ecole.com', telephone: '+33 6 32 14 56 98', date_embauche: '01/09/2022' }
]);

// Logique de filtrage dynamique (Remplace les requêtes backend pendant le test)
const filteredFormateurs = computed(() => {
  return mockFormateurs.value.filter(formateur => {
    const matchesSearch = 
      formateur.nom.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      formateur.prenom.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      formateur.specialite.toLowerCase().includes(searchQuery.value.toLowerCase());
      
    const matchesDepartement = filterDepartement.value === '' || formateur.departement === filterDepartement.value;
    const matchesContrat = filterContrat.value === '' || formateur.contrat === filterContrat.value;
    
    return matchesSearch && matchesDepartement && matchesContrat;
  });
});

// Logique de Pagination
const startIndex = computed(() => (currentPage.value - 1) * itemsPerPage.value);
const paginatedFormateurs = computed(() =>
  filteredFormateurs.value.slice(startIndex.value, startIndex.value + itemsPerPage.value)
);

// Actions mécaniques de l'UI
const resetFilters = () => {
  searchQuery.value = '';
  filterDepartement.value = '';
  filterContrat.value = '';
  currentPage.value = 1;
};

const editFormateur = (formateur) => {
  alert(`Édition du formateur : ${formateur.nom} ${formateur.prenom}`);
};

const confirmDelete = (formateur) => {
  if (confirm(`Voulez-vous vraiment retirer le formateur ${formateur.nom} ${formateur.prenom} ?`)) {
    mockFormateurs.value = mockFormateurs.value.filter(f => f.id !== formateur.id);
  }
};

// Simulation d'un chargement asynchrone au montage
onMounted(() => {
  setTimeout(() => {
    isLoading.value = false;
  }, 800); // Le tableau s'affiche après 800ms
});

// Fonctions d'exports factices
const exportPDF = () => console.log('Mock Export PDF...');
const exportCSV = () => console.log('Mock Export CSV...');
const exportExcel = () => console.log('Mock Export Excel...');
const printTable = () => window.print();
</script>

<style scoped>
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

/* Couleurs Soft */
.bg-soft-success {
  background-color: rgba(40, 167, 69, 0.12);
  color: #28a745;
}
.bg-soft-purple {
  background-color: rgba(111, 66, 193, 0.12);
  color: #6f42c1;
}

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