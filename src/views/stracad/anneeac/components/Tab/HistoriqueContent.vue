<template>
  <div class="row">
    <!-- Header & Action -->
    <div class="col-12 mb-4 d-flex justify-content-between align-items-center">
      <div>
        <h4 class="fw-bold mb-1">Historique des Années Académiques</h4>
        <p class="text-muted small mb-0">Consultez, gérez et archivez les cycles d'enseignement.</p>
      </div>
    </div>

    <!-- Filtres Optimisés (Style épuré) -->
    <div class="col-12 mb-4">
      <div class="card border-0 shadow-sm">
        <div class="card-body bg-light rounded">
          <div class="row g-3">
            <div class="col-md-5">
              <div class="input-group bg-white rounded shadow-sm">
                <span class="input-group-text bg-white border-0"
                  ><i class="mdi mdi-magnify"></i
                ></span>
                <input
                  v-model="searchQuery"
                  type="text"
                  class="form-control border-0"
                  placeholder="Rechercher par code ou année (ex: 2024)..."
                />
              </div>
            </div>
            <div class="col-md-3">
              <select v-model="filterStatut" class="form-select border-0 shadow-sm">
                <option value="">Tous les statuts</option>
                <option value="active">Année Active</option>
                <option value="en_preparation">En préparation</option>
                <option value="terminee">Terminée</option>
                <option value="archivee">Archivée</option>
              </select>
            </div>
            <div class="col-md-2">
              <select v-model="filterPeriode" class="form-select border-0 shadow-sm">
                <option value="">Toutes périodes</option>
                <option value="current">En cours</option>
                <option value="previous">Passées</option>
              </select>
            </div>
            <div class="col-md-2">
              <button class="btn btn-white w-100 shadow-sm border-0" @click="resetFilters">
                <i class="mdi mdi-filter-off-outline me-1"></i> Reset
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Affichage en mode Chronologique (Timeline) -->
    <div class="col-12">
      <div v-if="loading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status"></div>
      </div>

      <div v-else-if="anneesFiltrees.length > 0" class="timeline-container">
        <div
          v-for="annee in anneesFiltrees"
          :key="annee.id"
          class="annee-card mb-3 position-relative"
        >
          <div
            class="card border-0 shadow-sm overflow-hidden"
            :class="{ 'border-start border-4 border-success': annee.statut === 'active' }"
          >
            <div class="card-body p-3">
              <div class="row align-items-center">
                <!-- Date et Code -->
                <div class="col-md-2 border-end d-flex flex-column align-items-center text-center">
                  <span class="h5 fw-bold mb-0 text-primary">{{ annee.code }}</span>
                  <small class="text-muted fw-semibold">Session</small>
                </div>

                <!-- Durée et Progression -->
                <div class="col-md-4 px-4">
                  <div class="d-flex justify-content-between mb-1">
                    <span class="small fw-bold">{{ formatSimpleDate(annee.debut) }}</span>
                    <span class="small fw-bold">{{ formatSimpleDate(annee.fin) }}</span>
                  </div>
                  <div class="progress" style="height: 6px">
                    <div
                      class="progress-bar"
                      :class="getProgressBarClass(annee.statut)"
                      :style="{ width: calculateProgress(annee) + '%' }"
                    ></div>
                  </div>
                  <small class="text-muted mt-1 d-block text-center">Période académique</small>
                </div>

                <!-- Statut Badge -->
                <div class="col-md-2 text-center">
                  <span
                    :class="getStatusBadgeClass(annee.statut)"
                    class="badge px-3 py-2 rounded-pill"
                  >
                    {{ formatStatut(annee.statut) }}
                  </span>
                </div>

                <!-- Stats rapides -->
                <div class="col-md-2 text-muted small border-start px-3">
                    <div>
                      <i class="mdi mdi-account-group me-1"></i> 
                      {{ annee.nb_etudiants }} {{ annee.nb_etudiants > 1 ? 'Étudiants' : 'Étudiant' }}
                    </div>
                    <div>
                      <i class="mdi mdi-school me-1"></i> 
                      {{ annee.nb_classes }} {{ annee.nb_classes > 1 ? 'Classes' : 'Classe' }}
                    </div>
                  </div>

                <!-- Actions -->
                <div class="col-md-2 text-end">
                  <div class="btn-group">
                    <button class="btn btn-light btn-sm rounded-circle me-1" title="Détails">
                      <i class="mdi mdi-eye text-primary"></i>
                    </button>
                    <button class="btn btn-light btn-sm rounded-circle me-1" title="Modifier">
                      <i class="mdi mdi-pencil text-warning"></i>
                    </button>
                    <button class="btn btn-light btn-sm rounded-circle" title="Plus d'actions">
                      <i class="mdi mdi-dots-vertical"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- State: Vide -->
      <div v-else class="text-center py-5 bg-white rounded shadow-sm">
        <img src="/img/empty-box.svg" alt="Vide" style="width: 120px" class="mb-3 opacity-50" />
        <h5 class="text-muted">Aucune archive trouvée</h5>
        <p class="text-muted small">Modifiez vos filtres ou créez une nouvelle année académique.</p>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, computed, onMounted } from 'vue';
// Importe ton store Pinia (ajuste le chemin selon ton projet)
import { useAnneeStore } from '@/stores/academiqueStore/anneStore'; 

// Initialisation du store
const anneeStore = useAnneeStore();

// Gestion des filtres
const searchQuery = ref('');
const filterStatut = ref('');
const filterPeriode = ref('');

// Récupération des données au chargement du composant
onMounted(() => {
  anneeStore.fetchAnneesHistory();
});

// Alias réactifs pour simplifier le template (branchement direct sur le store)
const loading = computed(() => anneeStore.loading);
const annees = computed(() => anneeStore.anneeHistory || []);

// Logique des filtres combinés
const anneesFiltrees = computed(() => {
  return annees.value.filter((a) => {
    // 1. Filtre par zone de texte (Code)
    const matchesSearch = a.code.toLowerCase().includes(searchQuery.value.toLowerCase());
    
    // 2. Filtre par Statut
    const matchesStatut = !filterStatut.value || a.statut === filterStatut.value;
    
    // 3. Filtre par Période (Current vs Previous)
    let matchesPeriode = true;
    if (filterPeriode.value === 'current') {
      matchesPeriode = a.statut === 'active' || a.statut === 'en_preparation';
    } else if (filterPeriode.value === 'previous') {
      matchesPeriode = a.statut === 'terminee' || a.statut === 'archivee';
    }

    return matchesSearch && matchesStatut && matchesPeriode;
  });
});

const resetFilters = () => {
  searchQuery.value = '';
  filterStatut.value = '';
  filterPeriode.value = '';
};

// --- Fonctions utilitaires ---

// Formate les dates de l'API (ex: 2025-10-01T00:00:00.000Z -> oct. 2025)
const formatSimpleDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
};

// Classes dynamiques pour le badge de statut
const getStatusBadgeClass = (statut) => {
  const map = {
    active: 'badge-soft-success bg-success text-white', // Ajout de fallback Bootstrap si badge-soft n'est pas défini
    en_preparation: 'badge-soft-warning bg-warning text-dark',
    terminee: 'badge-soft-secondary bg-secondary text-white',
    archivee: 'badge-soft-info bg-info text-white',
  };
  return map[statut] || 'bg-light text-dark';
};

const formatStatut = (s) => s ? s.replace('_', ' ').toUpperCase() : '';

// Calcul intelligent du pourcentage de progression
const calculateProgress = (annee) => {
  if (annee.statut === 'terminee' || annee.statut === 'archivee') return 100;
  if (annee.statut === 'en_preparation') return 0;
  
  // Si active, calcul basé sur le temps réel écoulé
  const debut = new Date(annee.debut);
  const fin = new Date(annee.fin);
  const maintenant = new Date();
  
  if (maintenant < debut) return 0;
  if (maintenant > fin) return 100;
  
  const total = fin - debut;
  const actuel = maintenant - debut;
  return Math.round((actuel / total) * 100);
};

const getProgressBarClass = (statut) => (statut === 'active' ? 'bg-success' : 'bg-secondary');
</script>
<style scoped>
/* Effet au survol des cartes */
.annee-card {
  transition: transform 0.2s ease;
}
.annee-card:hover {
  transform: translateX(5px);
}

.bg-light {
  background-color: #f8f9fa !important;
}

/* Styles spécifiques aux statuts */
.badge-soft-success {
  background: rgba(25, 135, 84, 0.1);
  color: #198754;
}
.badge-soft-warning {
  background: rgba(255, 193, 7, 0.1);
  color: #ffc107;
}
.badge-soft-secondary {
  background: rgba(108, 117, 125, 0.1);
  color: #6c757d;
}
.badge-soft-info {
  background: rgba(13, 110, 253, 0.1);
  color: #0d6efd;
}

.btn-white {
  background: #fff;
}

/* Custom Progress colors */
.progress-bar-success {
  background-color: #198754;
}
.progress-bar-warning {
  background-color: #ffc107;
}
</style>
