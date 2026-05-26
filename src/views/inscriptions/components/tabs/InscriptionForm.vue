<template>
  <div class="row">
    <div class="col-12 grid-margin">
      <!-- Header avec Actions Intégrées -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 class="fw-bold mb-1">Inscription des étudiants</h3>
          <p class="text-muted small mb-0">
            Gestion des inscriptions et réinscriptions par filière
          </p>
        </div>
        <div class="d-flex gap-2">
          <InscriptionClasse />
          <AjouterTuteur />
        </div>
      </div>

      <!-- Filtres Modernisés (UI Harmonisée) -->
      <div class="card border-0 shadow-sm mb-4">
        <div class="card-body bg-light rounded">
          <div class="row g-3">
            <!-- Recherche avec Icône -->
            <div class="col-md-5">
              <div class="input-group shadow-sm bg-white rounded">
                <span class="input-group-text bg-white border-0">
                  <i class="mdi mdi-magnify text-primary"></i>
                </span>
                <input
                  type="text"
                  class="form-control border-0"
                  placeholder="Rechercher (Nom, prénom ou matricule...)"
                  v-model="searchQuery"
                />
              </div>
            </div>

            <!-- Filtre Filière -->
            <div class="col-md-3">
              <select class="form-select border-0 shadow-sm" v-model="selectedFiliere">
                <option value="">Toutes les Filières</option>
                <option v-for="filiere in filieres" :key="filiere" :value="filiere">
                  {{ filiere }}
                </option>
              </select>
            </div>

            <!-- Filtre Statut -->
            <div class="col-md-3">
              <select class="form-select border-0 shadow-sm" v-model="selectedStatut">
                <option value="">Tous les Statuts</option>
                <option value="en attente">⏳ En attente</option>
                <option value="validée">✅ Validée</option>
                <option value="annulée">❌ Annulée</option>
              </select>
            </div>

            <!-- Bouton Refresh Rapide -->
            <div class="col-md-1">
              <button class="btn btn-white w-100 shadow-sm border-0" @click="resetFilters">
                <i class="mdi mdi-refresh"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Tableau Stylisé -->
      <div class="card border-0 shadow-sm">
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead class="bg-light">
                <tr>
                  <th class="ps-4">#</th>
                  <th>Matricule</th>
                  <th>Étudiant</th>
                  <th>Classe & Filière</th>
                  <th class="text-center">Statut</th>
                  <th class="text-end pe-4">Actions</th>
                </tr>
              </thead>

              <tbody>
                <tr
                  v-for="(inscription, index) in paginatedInscriptions"
                  :key="inscription.id"
                  class="transition-all"
                >
                  <td class="ps-4 text-muted small">
                    {{ (currentPage - 1) * itemsPerPage + index + 1 }}
                  </td>
                  <td>
                    <span class="fw-bold text-primary">{{ inscription.etudiant_matricule }}</span>
                  </td>
                  <td>
                    <div class="d-flex flex-column">
                      <span class="fw-bold text-dark"
                        >{{ inscription.etudiant_nom }} {{ inscription.etudiant_prenom }}</span
                      >
                      <small class="text-muted" style="font-size: 11px"
                        >Inscrit le 12/10/2024</small
                      >
                    </div>
                  </td>
                  <td>
                    <div class="d-flex align-items-center">
                      <span class="badge bg-soft-info text-info me-2">{{
                        inscription.classe_code
                      }}</span>
                      <small class="text-muted">{{ inscription.filiere_nom }}</small>
                    </div>
                  </td>
                  <td class="text-center">
                    <span
                      :class="[
                        'badge rounded-pill px-3 py-2',
                        statutBadgeStyle(inscription.inscription_statut),
                      ]"
                    >
                      {{ inscription.inscription_statut }}
                    </span>
                  </td>
                  <td class="text-end pe-4">
                    <div class="btn-group shadow-sm" role="group">
                      <button
                        class="btn btn-sm btn-outline-secondary"
                        @click="openModal(inscription)"
                      >
                        <i class="mdi mdi-information-outline"></i>
                      </button>

                      <button
                        class="btn btn-sm btn-outline-danger"
                        @click="store.removeInscription(inscription.id)"
                      >
                        <i class="mdi mdi-delete-outline"></i>
                      </button>
                    </div>
                  </td>
                </tr>

                <!-- État Vide -->
                <tr v-if="filteredInscriptions.length === 0">
                  <td colspan="6" class="text-center py-5">
                    <div class="d-flex flex-column align-items-center">
                      <img src="/img/empty-box.svg" width="100" class="mb-3 opacity-50" />
                      <h6 class="text-muted">Aucune inscription ne correspond à vos critères</h6>
                      <button class="btn btn-sm btn-outline-primary mt-2" @click="resetFilters">
                        Voir tout
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <!-- Pagination intégrée au pied de la carte -->
        <div class="card-footer bg-white border-0 py-3">
          <Pagination
            v-model="currentPage"
            :items-per-page="itemsPerPage"
            :total-items="filteredInscriptions.length"
          />
        </div>
      </div>

      <InscriptionDetailModal v-model="showModal" :inscription="selectedInscription" />
    </div>
  </div>
</template>

<style scoped>
/* Couleurs douces pour les badges */
.bg-soft-info {
  background: rgba(13, 202, 240, 0.12);
  color: #0dcaf0;
}
.bg-soft-success {
  background: rgba(25, 135, 84, 0.12);
  color: #198754;
}
.bg-soft-warning {
  background: rgba(255, 193, 7, 0.12);
  color: #997404;
}
.bg-soft-danger {
  background: rgba(220, 53, 69, 0.12);
  color: #dc3545;
}

.btn-white {
  background: #fff;
  border: none;
}
.btn-white:hover {
  background: #f8f9fa;
}

.transition-all {
  transition: all 0.2s ease;
}
.table tbody tr:hover {
  background-color: #fcfdfe;
  transform: scale(1.002);
}

.table thead th {
  border: none;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: #888;
}
</style>
<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import InscriptionDetailModal from '../modal/InscriptionDetails.vue';
import { useInscriptionStore } from '@/stores/academiqueStore/inscriptionStore';

const store = useInscriptionStore();

onMounted(() => {
  store.fetchInscriptions();
  const savedFilieres = localStorage.getItem('filieres');
  if (savedFilieres) {
    const parsed = JSON.parse(savedFilieres);
    const items = Array.isArray(parsed) ? parsed : parsed?.data;
    if (Array.isArray(items)) {
      filieres.value = items.map((f) => f.code);
    }
  }
});

const searchQuery = ref('');
const selectedFiliere = ref('');
const selectedStatut = ref('');

const filieres = ref([]);

const filteredInscriptions = computed(() => {
  const data = store.inscriptions || [];

  return data.filter((i) => {
    const search = searchQuery.value.toLowerCase().trim();
    const matchSearch =
      !search ||
      i.nom?.toLowerCase().includes(search) ||
      i.prenom?.toLowerCase().includes(search) ||
      i.matricule?.toLowerCase().includes(search);
    const matchFiliere = !selectedFiliere.value || i.filiere_code === selectedFiliere.value;
    const matchStatut = !selectedStatut.value || i.statut === selectedStatut.value;
    return matchSearch && matchFiliere && matchStatut;
  });
});

const selectedInscription = ref(null);
const showModal = ref(false);

const openModal = (inscription) => {
  selectedInscription.value = inscription;
  showModal.value = true;
};

// statut badge 'EN_ATTENTE' => warning, 'ACTIVE' => success, 'ANNULÉE' => danger
const statutBadgeStyle = (statut) => {
  return {
    'bg-success': statut === 'ACTIVE',
    'bg-warning text-dark': statut === 'EN_ATTENTE',
    'bg-danger': statut === 'ANNULEE',
  };
};

// 1. État de la pagination
const currentPage = ref(1);
const itemsPerPage = ref(10); // Tu peux changer cette valeur

// 2. Calcul des données paginées
const paginatedInscriptions = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return filteredInscriptions.value.slice(start, end);
});

// 3. Reset de la page quand les filtres changent (Optionnel mais recommandé)
// Si l'utilisateur est à la page 5 et filtre, il doit revenir à la page 1
watch([searchQuery, selectedFiliere, selectedStatut], () => {
  currentPage.value = 1;
});
</script>
