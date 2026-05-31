<template>
  <div class="row">
    <div class="col-12 grid-margin">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 class="fw-bold mb-1">Inscription des étudiants</h3>
          <p class="text-muted small mb-0">
            Gestion des inscriptions et réinscriptions par filière.
          </p>
        </div>
        <div class="d-flex gap-2">
          <InscriptionClasse />
          <AjouterTuteur />
        </div>
      </div>

      <div class="card border-0 shadow-sm mb-4">
        <div class="card-body bg-light rounded">
          <div class="row g-3">
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

            <div class="col-md-3">
              <select class="form-select border-0 shadow-sm" v-model="selectedFiliere">
                <option value="">Toutes les Filières</option>
                <option v-for="filiere in filieres" :key="filiere" :value="filiere">
                  {{ filiere }}
                </option>
              </select>
            </div>

            <div class="col-md-3">
              <select class="form-select border-0 shadow-sm" v-model="selectedStatut">
                <option value="">Tous les Statuts</option>
                <option value="EN_ATTENTE">⏳ En attente</option>
                <option value="ACTIVE">✅ Validée</option>
                <option value="ANNULEE">❌ Annulée</option>
              </select>
            </div>

            <div class="col-md-1">
              <button class="btn btn-white w-100 shadow-sm border-0 h-100" @click="resetFilters" title="Réinitialiser">
                <i class="mdi mdi-refresh text-secondary"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="card border-0 shadow-sm">
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead class="bg-light">
                <tr>
                  <th class="ps-4 border-0">#</th>
                  <th class="border-0">Matricule</th>
                  <th class="border-0">Étudiant</th>
                  <th class="border-0">Classe & Filière</th>
                  <th class="border-0 text-center">Statut</th>
                  <th class="border-0 text-end pe-4">Actions</th>
                </tr>
              </thead>

              <tbody>
                <tr
                  v-for="(inscription, index) in paginatedInscriptions"
                  :key="inscription.id"
                  class="transition-all"
                >
                  <td class="ps-4 text-muted small font-monospace">
                    {{ (currentPage - 1) * itemsPerPage + index + 1 }}
                  </td>
                  <td>
                    <span class="fw-bold text-primary font-monospace">{{ inscription.etudiant_matricule || 'N/A' }}</span>
                  </td>
                  <td>
                    <div class="d-flex flex-column">
                      <span class="fw-bold text-dark">
                        {{ inscription.etudiant_nom }} {{ inscription.etudiant_prenom }}
                      </span>
                      <small class="text-muted" style="font-size: 11px">
                        {{ inscription.created_at ? `Inscrit le ${new Date(inscription.created_at).toLocaleDateString()}` : 'Date inconnue' }}
                      </small>
                    </div>
                  </td>
                  <td>
                    <div class="d-flex align-items-center">
                      <span class="badge bg-soft-info text-info me-2 fw-bold">
                        {{ inscription.classe_code || inscription.classe }}
                      </span>
                      <small class="text-muted truncate-text" style="max-width: 180px;">
                        {{ inscription.filiere_nom || inscription.filiere_code }}
                      </small>
                    </div>
                  </td>
                  <td class="text-center">
                    <span class="badge rounded-pill px-3 py-2 fw-semibold" :class="statutBadgeStyle(inscription.inscription_statut)">
                      {{ formatStatutTexte(inscription.inscription_statut) }}
                    </span>
                  </td>
                  <td class="text-end pe-4">
                    <div class="btn-group shadow-sm border rounded bg-white" role="group">
                      <button
                        class="btn btn-sm btn-light border-0 text-secondary"
                        @click="openModal(inscription)"
                        title="Détails"
                      >
                        <i class="mdi mdi-information-outline fs-6"></i>
                      </button>
                      <button
                        class="btn btn-sm btn-light border-0 text-danger"
                        @click="supprimerInscription(inscription.id)"
                        title="Supprimer"
                      >
                        <i class="mdi mdi-delete-outline fs-6"></i>
                      </button>
                    </div>
                  </td>
                </tr>

                <tr v-if="filteredInscriptions.length === 0">
                  <td colspan="6" class="text-center py-5">
                    <div class="d-flex flex-column align-items-center py-4">
                      <i class="mdi mdi-account-search-outline display-4 text-muted opacity-25 mb-2"></i>
                      <h6 class="text-muted mb-3">Aucune inscription ne correspond à vos critères</h6>
                      <button class="btn btn-sm btn-primary rounded-pill px-4 shadow-sm" @click="resetFilters">
                        Voir toutes les inscriptions
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div v-if="filteredInscriptions.length > 0" class="card-footer bg-white border-top py-2 px-4">
          <AppPagination
            v-model="currentPage"
            v-model:itemsPerPage="itemsPerPage"
            :total-items="filteredInscriptions.length"
          />
        </div>
      </div>

      <InscriptionDetailModal v-model="showModal" :inscription="selectedInscription" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import InscriptionDetailModal from '../modal/InscriptionDetails.vue';
import AppPagination from '@/components/shared/Pagination.vue'; // Ajustez le chemin vers votre fichier de pagination optimisé
import { useInscriptionStore } from '@/stores/academiqueStore/inscriptionStore';

const store = useInscriptionStore();

// États de filtrage
const searchQuery = ref('');
const selectedFiliere = ref('');
const selectedStatut = ref('');
const filieres = ref([]);

// États de la pagination
const currentPage = ref(1);
const itemsPerPage = ref(10);

// États pour le Modal
const selectedInscription = ref(null);
const showModal = ref(false);

onMounted(async () => {
  if (typeof store.fetchInscriptions === 'function') {
    await store.fetchInscriptions();
  }

  // Chargement sécurisé des filières depuis le cache local
  try {
    const savedFilieres = localStorage.getItem('filieres');
    if (savedFilieres) {
      const parsed = JSON.parse(savedFilieres);
      const items = Array.isArray(parsed) ? parsed : parsed?.data;
      if (Array.isArray(items)) {
        filieres.value = items.map((f) => f.code);
      }
    }
  } catch (e) {
    console.error('Erreur lors du traitement local des filières', e);
  }
});

// Filtrage réactif synchronisé avec vos clefs API
const filteredInscriptions = computed(() => {
  const data = store.inscriptions || [];

  return data.filter((i) => {
    const search = searchQuery.value.toLowerCase().trim();
    
    // Correction ici : Recherche basée sur les véritables clés d'affichage de votre API
    const matchSearch =
      !search ||
      i.etudiant_nom?.toLowerCase().includes(search) ||
      i.etudiant_prenom?.toLowerCase().includes(search) ||
      i.etudiant_matricule?.toLowerCase().includes(search);

    const matchFiliere = !selectedFiliere.value || i.filiere_code === selectedFiliere.value;
    
    // Tolérance à la casse pour le statut
    const currentStatut = i.inscription_statut || i.statut || '';
    const matchStatut = !selectedStatut.value || currentStatut.toUpperCase() === selectedStatut.value.toUpperCase();

    return matchSearch && matchFiliere && matchStatut;
  });
});

// Calcul du segment de données paginées
const paginatedInscriptions = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return filteredInscriptions.value.slice(start, end);
});

// Réinitialisation globale des filtres
const resetFilters = () => {
  searchQuery.value = '';
  selectedFiliere.value = '';
  selectedStatut.value = '';
  currentPage.value = 1;
};

// Actions
const openModal = (inscription) => {
  selectedInscription.value = inscription;
  showModal.value = true;
};

const supprimerInscription = async (id) => {
  if (confirm('Êtes-vous sûr de vouloir supprimer définitivement cette inscription ?')) {
    if (typeof store.removeInscription === 'function') {
      await store.removeInscription(id);
      // Ajustement de sécurité de pagination post-suppression
      if (paginatedInscriptions.value.length === 0 && currentPage.value > 1) {
        currentPage.value--;
      }
    }
  }
};

// Design épuré des badges (Soft Colors)
const statutBadgeStyle = (statut) => {
  const format = (statut || '').toUpperCase();
  return {
    'bg-soft-success text-success': format === 'ACTIVE' || format === 'VALIDÉE',
    'bg-soft-warning text-warning': format === 'EN_ATTENTE',
    'bg-soft-danger text-danger': format === 'ANNULEE' || format === 'ANNULÉE',
  };
};

const formatStatutTexte = (statut) => {
  const format = (statut || '').toUpperCase();
  if (format === 'ACTIVE') return 'Validée';
  if (format === 'EN_ATTENTE') return 'En attente';
  if (format === 'ANNULEE') return 'Annulée';
  return statut;
};

// Réinitialisation automatique de la page lors d'une modification des filtres
watch([searchQuery, selectedFiliere, selectedStatut], () => {
  currentPage.value = 1;
});
</script>

<style scoped>
.bg-soft-info {
  background-color: rgba(0, 192, 244, 0.12);
  color: #00c0f4 !important;
}
.bg-soft-success {
  background-color: rgba(25, 135, 84, 0.12);
}
.bg-soft-warning {
  background-color: rgba(255, 193, 7, 0.15);
}
.bg-soft-danger {
  background-color: rgba(220, 53, 69, 0.12);
}

.btn-white {
  background-color: #fff;
  border: 1px solid #e9ecef;
}
.btn-white:hover {
  background-color: #f8f9fa;
}

.table thead th {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: #6c757d;
  padding-top: 14px;
  padding-bottom: 14px;
}

.transition-all {
  transition: background 0.2s ease;
}

.table tbody tr:hover {
  background-color: #fcfdfe !important;
}

.truncate-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>

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
