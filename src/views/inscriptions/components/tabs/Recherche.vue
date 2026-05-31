<template>
  <div class="row">
    <div class="col-12 grid-margin">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 class="fw-bold mb-1">Réinscriptions {{ selectedAnnee || '' }}</h3>
          <p class="text-muted small mb-0">
            Gestion du passage des étudiants vers une nouvelle année académique.
          </p>
        </div>
        <div class="d-flex gap-2">
          <button class="btn btn-white shadow-sm border btn-sm px-3" :disabled="inscriptionStore.loading">
            <i class="mdi mdi-export me-1"></i>Exporter
          </button>
          <button
            class="btn btn-primary btn-sm px-3 shadow-sm"
            data-bs-toggle="modal"
            data-bs-target="#importReinscriptionsModal"
            :disabled="inscriptionStore.loading"
          >
            <i class="mdi mdi-upload me-1"></i>Importer des listes
          </button>
        </div>
      </div>

      <div class="card border-0 shadow-sm mb-4">
        <div class="card-body bg-light rounded">
          <div class="row g-3">
            <div class="col-md-3">
              <select class="form-select border-0 shadow-sm" v-model="selectedAnnee">
                <option value="">Toutes les années sources</option>
                <option v-for="year in academicYears" :key="year" :value="year">
                  Année source : {{ year }}
                </option>
              </select>
            </div>

            <div class="col-md-3">
              <select class="form-select border-0 shadow-sm" v-model="selectedFiliere">
                <option value="">Toutes les filières</option>
                <option v-for="f in filieres" :key="f" :value="f">
                  {{ f }}
                </option>
              </select>
            </div>

            <div class="col-md-4">
              <div class="input-group shadow-sm bg-white rounded">
                <span class="input-group-text bg-white border-0">
                  <i class="mdi mdi-magnify text-primary"></i>
                </span>
                <input
                  type="text"
                  class="form-control border-0"
                  v-model="searchQuery"
                  placeholder="Rechercher un étudiant (Nom, matricule...)"
                />
              </div>
            </div>

            <div class="col-md-2">
              <button class="btn btn-white w-100 shadow-sm border-0 h-100" @click="resetFilters">
                <i class="mdi mdi-refresh me-1"></i> Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="inscriptionStore.loading && !filteredCandidats.length" class="text-center py-5">
        <div class="spinner-border text-primary" role="status"></div>
        <p class="text-muted mt-2 small">Récupération des listes d'étudiants admissibles...</p>
      </div>

      <div v-else class="card border-0 shadow-sm">
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead class="bg-light">
                <tr>
                  <th class="ps-4 border-0">Matricule</th>
                  <th class="border-0">Étudiant</th>
                  <th class="border-0">Parcours Précédent</th>
                  <th class="border-0 text-center">Paiement</th>
                  <th class="border-0 text-end pe-4">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="etudiant in filteredCandidats" :key="etudiant.id" class="transition-all">
                  <td class="ps-4">
                    <span class="fw-bold text-primary">{{ etudiant.matricule }}</span>
                  </td>
                  <td>
                    <div class="d-flex align-items-center">
                      <div class="avatar-soft-primary me-3">
                        {{ etudiant.nom?.charAt(0) }}{{ etudiant.prenom?.charAt(0) }}
                      </div>
                      <div class="d-flex flex-column">
                        <span class="fw-bold text-dark">{{ etudiant.nom }} {{ etudiant.prenom }}</span>
                        <small class="text-muted">{{ etudiant.telephone || 'N/A' }}</small>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div class="d-flex flex-column">
                      <span class="text-dark fw-semibold">{{ etudiant.classe_code || etudiant.classe }}</span>
                      <small class="text-muted">{{ etudiant.annee_code || etudiant.annee }} • {{ etudiant.filiere_code || etudiant.filiere }}</small>
                    </div>
                  </td>
                  <td class="text-center">
                    <span
                      class="badge rounded-pill px-3 py-2"
                      :class="
                        etudiant.statut_paiement === 'Payé' || etudiant.statut === 'Payé'
                          ? 'bg-soft-success text-success'
                          : 'bg-soft-warning text-warning'
                      "
                    >
                      <i
                        class="mdi"
                        :class="
                          etudiant.statut_paiement === 'Payé' || etudiant.statut === 'Payé' ? 'mdi-check-circle' : 'mdi-alert-circle'
                        "
                      ></i>
                      {{ etudiant.statut_paiement || etudiant.statut || 'En attente' }}
                    </span>
                  </td>
                  <td class="text-end pe-4">
                    <button
                      class="btn btn-primary btn-sm px-4 rounded-pill shadow-sm btn-reassign"
                      @click="openReinscriptionModal(etudiant)"
                    >
                      <i class="mdi mdi-account-convert me-1"></i> Réinscrire
                    </button>
                  </td>
                </tr>

                <tr v-if="filteredCandidats.length === 0">
                  <td colspan="5" class="text-center py-5">
                    <div class="py-4">
                      <i class="mdi mdi-account-search-outline display-4 text-muted opacity-25"></i>
                      <p class="text-muted mt-2">Aucun candidat éligible trouvé pour ces critères.</p>
                      <button class="btn btn-sm btn-link" @click="resetFilters">
                        Réinitialiser les filtres
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>

  <ImportReinscriptionsModal :classe="selectedClasseData" />
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useInscriptionStore } from '@/stores/academiqueStore/inscriptionStore';
import ImportReinscriptionsModal from '../modal/ReinscriptionModal.vue'; 

const inscriptionStore = useInscriptionStore();

// États des filtres
const selectedAnnee = ref('2023-2024'); 
const selectedFiliere = ref('');
const searchQuery = ref('');
const selectedClasseData = ref(null);

// Branchement des données réelles réactives depuis l'état global du Store
const academicYears = computed(() => inscriptionStore.academicYears || ['2023-2024', '2024-2025', '2025-2026']);
const filieres = computed(() => inscriptionStore.filieres || ['GI', 'GTR', 'IDA']);
const candidats = computed(() => inscriptionStore.candidatsPourReinscription || []);

// Filtrage intelligent appliqué sur les variables réelles de l'API
const filteredCandidats = computed(() => {
  return candidats.value.filter((c) => {
    const matchYear = !selectedAnnee.value || (c.annee_code || c.annee) === selectedAnnee.value;
    const matchFiliere = !selectedFiliere.value || (c.filiere_code || c.filiere) === selectedFiliere.value;
    
    const term = searchQuery.value.toLowerCase().trim();
    const matchSearch =
      !term ||
      c.nom.toLowerCase().includes(term) ||
      c.prenom.toLowerCase().includes(term) ||
      c.matricule.toLowerCase().includes(term);
      
    return matchYear && matchFiliere && matchSearch;
  });
});

const resetFilters = () => {
  selectedAnnee.value = '2023-2024';
  selectedFiliere.value = '';
  searchQuery.value = '';
};

// Logique unitaire par étudiant
const openReinscriptionModal = (etudiant) => {
  // Optionnel : stocke l'étudiant sélectionné pour l'injection dynamique
  selectedClasseData.value = { 
    classe_code: etudiant.classe_code || etudiant.classe,
    filiere_code: etudiant.filiere_code || etudiant.filiere
  };
  console.log('Ouverture réinscription unitaire pour:', etudiant.nom);
};

// Chargement initial des collections dynamiques au montage
onMounted(async () => {
  if (typeof inscriptionStore.fetchCandidatsReinscription === 'function') {
    await inscriptionStore.fetchCandidatsReinscription();
  }
});
</script>

<style scoped>
.bg-soft-success {
  background-color: rgba(25, 135, 84, 0.12);
  color: #198754 !important;
}
.bg-soft-warning {
  background-color: rgba(255, 193, 7, 0.12);
  color: #997404 !important;
}

.avatar-soft-primary {
  width: 40px;
  height: 40px;
  background-color: rgba(75, 73, 172, 0.1);
  color: #4b49ac;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  font-weight: 700;
  font-size: 0.85rem;
}

.btn-white {
  background-color: #fff;
  border: 1px solid #e9ecef;
}
.btn-white:hover {
  background-color: #f8f9fa;
}

.btn-reassign {
  transition: all 0.3s ease;
}
.btn-reassign:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(75, 73, 172, 0.2);
}

.table thead th {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: #6c757d;
  padding-top: 15px;
  padding-bottom: 15px;
}

.transition-all {
  transition: background 0.2s ease;
}

.table tbody tr:hover {
  background-color: #fcfdfe !important;
}
</style>
