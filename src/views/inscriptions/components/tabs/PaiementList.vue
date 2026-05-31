<template>
  <div class="row">
    <div class="col-12 grid-margin">
      <div class="d-flex justify-content-between align-items-end mb-4">
        <div>
          <h3 class="fw-bold mb-1">Validation & Frais d'Inscriptions</h3>
          <p class="text-muted small mb-0">
            Suivi des paiements et validation administrative des dossiers.
          </p>
        </div>
        <div class="d-flex gap-3 text-end" v-if="!store.loading">
          <div class="px-3 border-end">
            <small class="text-muted d-block">Total Collecté</small>
            <span class="fw-bold text-success">{{
              formatMoney(store.financeTotals.total_collecte)
            }}</span>
          </div>
          <div class="px-3">
            <small class="text-muted d-block">En attente</small>
            <span class="fw-bold text-warning">{{
              formatMoney(store.financeTotals.total_attente)
            }}</span>
          </div>
        </div>
      </div>

      <div class="card border-0 shadow-sm mb-4">
        <div class="card-body bg-light rounded">
          <div class="row g-3">
            <div class="col-md-3">
              <select class="form-select border-0 shadow-sm" v-model="selectedFiliere">
                <option value="">Toutes les filières</option>
                <option v-for="f in filieres" :key="f" :value="f">{{ f }}</option>
              </select>
            </div>
            <div class="col-md-3">
              <select class="form-select border-0 shadow-sm" v-model="selectedStatut">
                <option value="">Tous les statuts</option>
                <option value="en attente">⏳ En attente</option>
                <option value="validée">✅ Validée</option>
                <option value="annulée">❌ Annulée</option>
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
                  placeholder="Rechercher un étudiant..."
                  v-model="searchQuery"
                />
              </div>
            </div>
            <div class="col-md-2 text-end">
              <button class="btn btn-white w-100 shadow-sm border-0" @click="resetFilters">
                <i class="mdi mdi-filter-variant"></i> Réinitialiser
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="d-flex justify-content-between mb-3 align-items-center">
        <span class="text-muted small">
          Affichage de <b>{{ filteredInscriptions.length }}</b> dossiers
        </span>
        <div class="d-flex gap-2">
          <button class="btn btn-outline-primary btn-sm px-3 shadow-sm bg-white">
            <i class="mdi mdi-file-export-outline me-1"></i> Exporter
          </button>
          <button
            class="btn btn-primary btn-sm px-3 shadow-sm d-inline-flex align-items-center gap-1"
            @click="showBulkModal = true"
          >
            <i class="mdi mdi-file-excel-outline"></i> Validation par lots
          </button>
          <ValidationModal v-model="showBulkModal" />
        </div>
      </div>

      <div class="card border-0 shadow-sm">
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead class="bg-light">
                <tr>
                  <th class="ps-4">Étudiant / Matricule</th>
                  <th>Classe</th>
                  <th>Frais Scolarité</th>
                  <th>Montant Versé</th>
                  <th>Reste</th>
                  <th class="text-center">Statut</th>
                  <th class="text-end pe-4">Actions</th>
                </tr>
              </thead>

              <tbody>
                <tr v-if="store.loading">
                  <td colspan="7" class="text-center py-5">
                    <div class="spinner-border text-primary" role="status"></div>
                    <p class="text-muted mt-2">Chargement du suivi financier...</p>
                  </td>
                </tr>

                <template v-else>
                  <tr v-for="ins in paginatedInscriptions" :key="ins.id">
                    <td class="ps-4">
                      <div class="d-flex align-items-center">
                        <div class="avatar-initials me-3 bg-soft-primary text-primary fw-bold">
                          {{ ins.nom?.[0] }}{{ ins.prenom?.[0] }}
                        </div>
                        <div>
                          <div class="fw-bold text-dark">{{ ins.nom }} {{ ins.prenom }}</div>
                          <small class="text-primary fw-semibold">{{ ins.matricule }}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div class="badge bg-light text-dark border">{{ ins.classe_code }}</div>
                      <div class="small text-muted mt-1">{{ ins.filiere_code }}</div>
                    </td>
                    <td>
                      <span class="fw-bold">{{ formatMoney(ins.frais_scolarite) }}</span>
                    </td>
                    <td>
                      <span class="text-success fw-bold">{{ formatMoney(ins.montant_verse) }}</span>
                    </td>
                    <td>
                      <span
                        :class="[
                          'badge px-2 py-1',
                          ins.reste > 0
                            ? 'bg-soft-danger text-danger'
                            : 'bg-soft-success text-success',
                        ]"
                      >
                        {{ formatMoney(ins.reste) }}
                      </span>
                    </td>
                    <td class="text-center">
                      <span :class="['badge rounded-pill px-3 py-2', statutClass(ins.statut)]">
                        {{ ins.statut }}
                      </span>
                    </td>
                    <td class="text-end pe-4">
                      <button
                        class="btn btn-sm btn-light border text-primary fw-semibold"
                        @click="openPaiementModal(ins)"
                      >
                        <i class="mdi mdi-cash-register fs-6"></i>
                        Gérer Paiement
                      </button>
                    </td>
                  </tr>

                  <tr v-if="filteredInscriptions.length === 0">
                    <td colspan="7" class="text-center py-5">
                      <img src="/img/empty-box.svg" width="100" class="mb-3 opacity-50" />
                      <p class="text-muted">Aucune transaction trouvée.</p>
                    </td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="mt-4" v-if="filteredInscriptions.length > 0">
        <Pagination
          v-model="currentPage"
          :items-per-page="itemsPerPage"
          :total-items="filteredInscriptions.length"
        />
      </div>
    </div>
  </div>

  <PaiementDetailsModal
    v-if="showPaiementModal"
    v-model="showPaiementModal"
    :inscription="selectedPaiementInscription"
  />
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import PaiementDetailsModal from '../modal/PaiementDetails.vue';
import Pagination from '@/components/shared/Pagination.vue';
import ValidationModal from '../modal/ValidationModal.vue';

import { useInscriptionStore } from '@/stores/academiqueStore/inscriptionStore';

const store = useInscriptionStore();
const showBulkModal = ref(false);
// États locaux
const searchQuery = ref('');
const selectedFiliere = ref('');
const selectedStatut = ref('');
const filieres = ref([]);

const currentPage = ref(1);
const itemsPerPage = ref(10);

onMounted(() => {
  // Remplacement par la méthode financière du store
  store.fetchInscriptionsFinances();

  const savedFilieres = localStorage.getItem('filieres');
  if (savedFilieres) {
    const parsed = JSON.parse(savedFilieres);
    const items = Array.isArray(parsed) ? parsed : parsed?.data;
    if (Array.isArray(items)) {
      filieres.value = items.map((f) => f.code);
    }
  }
});

// Filtrage basé sur store.finances
const filteredInscriptions = computed(() => {
  const data = store.finances || [];

  return data.filter((i) => {
    const search = searchQuery.value.toLowerCase().trim();
    const matchSearch =
      !search ||
      i.nom?.toLowerCase().includes(search) ||
      i.prenom?.toLowerCase().includes(search) ||
      i.matricule?.toLowerCase().includes(search);
    const matchFiliere = !selectedFiliere.value || i.filiere_code === selectedFiliere.value;

    // Tolérance casse (ex: 'VALIDEE' vs 'validée')
    const matchStatut =
      !selectedStatut.value || i.statut?.toLowerCase() === selectedStatut.value.toLowerCase();

    return matchSearch && matchFiliere && matchStatut;
  });
});

// Données paginées
const paginatedInscriptions = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return filteredInscriptions.value.slice(start, end);
});

// Workflow de validation via store.changeStatus
const validerInscription = async (id) => {
  if (!confirm('Voulez-vous valider cette inscription et enregistrer le dossier ?')) return;

  try {
    // Appel du workflow générique de statut défini dans votre store
    await store.changeStatus(id, {
      statut: 'VALIDEE',
      commentaire: 'Validation comptable automatique',
    });
    alert('Inscription validée avec succès !');
    // Recharger les données financières pour mettre à jour les montants globaux
    await store.fetchInscriptionsFinances();
  } catch (error) {
    console.error('Erreur lors de la validation:', error);
    alert('Erreur lors de la validation : ' + error.message);
  }
};
// États pour le modal de paiement
const showPaiementModal = ref(false);
const selectedPaiementInscription = ref(null);

// Fonction pour ouvrir le modal
const openPaiementModal = (inscription) => {
  selectedPaiementInscription.value = inscription;
  showPaiementModal.value = true;
};

const resetFilters = () => {
  searchQuery.value = '';
  selectedFiliere.value = '';
  selectedStatut.value = '';
};

const formatMoney = (amount) => {
  if (amount === undefined || amount === null) return '0 FCFA';
  return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
};

const statutClass = (statut) => {
  const s = statut?.toLowerCase();
  return {
    'bg-success': s === 'validée' || s === 'validee' || s === 'active',
    'bg-warning text-dark': s === 'en attente',
    'bg-danger': s === 'annulée' || s === 'annulee' || s === 'rejetee',
  };
};

const imprimerRecu = (ins) => {
  alert(`Impression du reçu pour ${ins.prenom} ${ins.nom}`);
};

// Reset de la page courante lors de la modification des filtres
watch([searchQuery, selectedFiliere, selectedStatut], () => {
  currentPage.value = 1;
});
</script>

<style scoped>
.avatar-initials {
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  font-size: 0.85rem;
}

.bg-soft-primary {
  background: rgba(75, 73, 172, 0.1);
}
.bg-soft-success {
  background: rgba(25, 135, 84, 0.12);
  color: #198754;
}
.bg-soft-danger {
  background: rgba(220, 53, 69, 0.12);
  color: #dc3545;
}
.bg-soft-warning {
  background: rgba(255, 193, 7, 0.15);
  color: #997404;
}

.btn-white {
  background: #fff;
  border: none;
}
.btn-white:hover {
  background: #f8f9fa;
}

.table thead th {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: #777;
  border: none;
  padding: 15px 10px;
}

.table tbody tr {
  border-bottom: 1px solid #f2f2f2;
}

/* Style spécifique pour les montants FCFA */
td .fw-bold {
  font-family: 'Inter', sans-serif;
  color: #333;
}
</style>
