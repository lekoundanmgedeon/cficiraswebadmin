<template>
  <div class="py-4 px-2">
    <!-- Header -->
    <div class="mb-4">
      <h3 class="fw-bold text-dark mb-2">Statistiques des Cycles</h3>
      <p class="text-muted">
        Indicateurs globaux liés aux cycles et à l’activité académique actuelle.
      </p>
    </div>

    <!-- Grille des Statistiques (Scorecards) -->
    <div class="row g-3 mb-5">
      <div class="col-md-6 col-lg-3">
        <div class="stat-card-robust border shadow-sm">
          <div class="stat-icon-box bg-skyblue-soft">
            <i class="mdi mdi-layers-triple text-skyblue"></i>
          </div>
          <div class="stat-details">
            <h3 class="fw-bold mb-0">{{ totalCycles }}</h3>
            <p class="text-muted small fw-semibold text-uppercase mb-0">Cycles Totaux</p>
          </div>
        </div>
      </div>

      <div class="col-md-6 col-lg-3">
        <div class="stat-card-robust border shadow-sm">
          <div class="stat-icon-box bg-success-soft">
            <i class="mdi mdi-check-decagram text-success"></i>
          </div>
          <div class="stat-details">
            <h3 class="fw-bold mb-0">{{ cyclesActifs }}</h3>
            <p class="text-muted small fw-semibold text-uppercase mb-0">Cycles Actifs</p>
          </div>
        </div>
      </div>

      <div class="col-md-6 col-lg-3">
        <div class="stat-card-robust border shadow-sm">
          <div class="stat-icon-box bg-warning-soft">
            <i class="mdi mdi-fountain-pen-tip text-warning"></i>
          </div>
          <div class="stat-details">
            <h3 class="fw-bold mb-0">{{ totalFilieres }}</h3>
            <p class="text-muted small fw-semibold text-uppercase mb-0">Filières Liées</p>
          </div>
        </div>
      </div>

      <div class="col-md-6 col-lg-3">
        <div class="stat-card-robust border shadow-sm">
          <div class="stat-icon-box bg-purple-soft">
            <i class="mdi mdi-account-group text-purple"></i>
          </div>
          <div class="stat-details">
            <h3 class="fw-bold mb-0">{{ totalEtudiants.toLocaleString() }}</h3>
            <p class="text-muted small fw-semibold text-uppercase mb-0">Étudiants Inscrits</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Liste détaillée des cycles -->
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h5 class="fw-bold text-dark mb-0">Répartition par Cycle</h5>
      <button
        @click="exportData"
        class="btn btn-link text-skyblue text-decoration-none fw-bold small"
      >
        <i class="mdi mdi-download me-1"></i> Exporter les stats
      </button>
    </div>

    <div class="card border-light shadow-sm" style="border-radius: 4px">
      <div class="table-responsive">
        <table class="table align-middle mb-0 custom-table-robust">
          <thead>
            <tr>
              <th class="ps-4">Code / Nom</th>
              <th>Type de Diplôme</th>
              <th class="text-center">Filières</th>
              <th class="text-center">Effectif</th>
              <th class="text-center">Crédits</th>
              <th class="text-end pe-4">Statut</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="filteredCycles.length === 0">
              <td colspan="6" class="text-center py-5">
                <div class="py-3">
                  <i
                    class="mdi mdi-folder-open-outline text-muted"
                    style="font-size: 3rem; opacity: 0.3"
                  ></i>
                  <p class="text-muted mt-2">Aucune donnée statistique disponible</p>
                </div>
              </td>
            </tr>
            <tr v-for="cycle in filteredCycles" :key="cycle.id">
              <td class="ps-4">
                <div class="d-flex align-items-center">
                  <span class="code-tag-blue me-3">{{ cycle.code }}</span>
                  <div>
                    <div class="fw-bold text-dark">{{ cycle.nom }}</div>
                    <div class="x-small text-muted">{{ cycle.nomComplet }}</div>
                  </div>
                </div>
              </td>
              <td>
                <span class="text-muted small fw-medium">{{ cycle.diplome }}</span>
              </td>
              <td class="text-center">
                <span class="fw-bold">{{ cycle.nombreFilieres }}</span>
              </td>
              <td class="text-center">
                <span class="badge rounded-pill bg-light text-dark border px-3">
                  {{ cycle.nombreEtudiants }}
                </span>
              </td>
              <td class="text-center fw-semibold text-muted">{{ cycle.creditsECTS }} ECTS</td>
              <td class="text-end pe-4">
                <span :class="getStatutClass(cycle.statut)" class="status-pill-robust">
                  {{ getStatutLabel(cycle.statut) }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Couleurs d'accentuation */
.text-skyblue {
  color: #0ea5e9 !important;
}
.bg-skyblue-soft {
  background-color: #f0f9ff;
}
.bg-success-soft {
  background-color: #f0fdf4;
}
.bg-warning-soft {
  background-color: #fffbeb;
}
.bg-purple-soft {
  background-color: #faf5ff;
}
.text-purple {
  color: #a855f7;
}

/* Cartes Stats Robustes */
.stat-card-robust {
  background: white;
  padding: 1.25rem;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 1.25rem;
}

.stat-icon-box {
  width: 54px;
  height: 54px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

/* Table Style Uniforme */
.custom-table-robust thead th {
  background-color: #f8fafc;
  color: #475569;
  font-size: 0.75rem;
  text-transform: uppercase;
  font-weight: 700;
  padding: 18px 12px;
  border-bottom: 2px solid #eef2f7;
}

.custom-table-robust tbody td {
  padding: 16px 12px;
  border-bottom: 1px solid #f1f5f9;
}

/* Tags et Badges */
.code-tag-blue {
  background: #0ea5e9;
  color: white;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  font-weight: 800;
  font-size: 0.8rem;
}

.status-pill-robust {
  font-size: 0.7rem;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 4px;
  text-transform: uppercase;
}

.status-active {
  background: #ecfdf5;
  color: #059669;
  border: 1px solid #d1fae5;
}

.x-small {
  font-size: 0.7rem;
}
</style>

<script setup>
import { ref, computed } from 'vue';

// Statistiques
const totalCycles = ref(3);
const cyclesActifs = ref(3);
const totalFilieres = ref(12);
const totalEtudiants = ref(1450);

// Filtres
const searchQuery = ref('');
const filterStatut = ref('');
const filterNiveau = ref('');

// Données
const cycles = ref([
  {
    id: 1,
    code: 'L',
    nom: 'Licence',
    nomComplet: 'Licence Professionnelle',
    type: 'licence',
    duree: 3,
    diplome: 'Licence (BAC+3)',
    nombreFilieres: 5,
    nombreEtudiants: 850,
    creditsECTS: 180,
    statut: 'actif',
  },
  {
    id: 2,
    code: 'M',
    nom: 'Master',
    nomComplet: 'Master Recherche et Professionnel',
    type: 'master',
    duree: 2,
    diplome: 'Master (BAC+5)',
    nombreFilieres: 4,
    nombreEtudiants: 450,
    creditsECTS: 120,
    statut: 'actif',
  },
  {
    id: 3,
    code: 'D',
    nom: 'Doctorat',
    nomComplet: 'Doctorat / PhD',
    type: 'doctorat',
    duree: 3,
    diplome: 'Doctorat (BAC+8)',
    nombreFilieres: 3,
    nombreEtudiants: 150,
    creditsECTS: 180,
    statut: 'actif',
  },
]);

const formData = ref({
  code: '',
  nom: '',
  nomComplet: '',
  type: 'licence',
  duree: 3,
  diplome: '',
  description: '',
  creditsECTS: 180,
  statut: 'actif',
});

// Computed
const filteredCycles = computed(() => {
  return cycles.value.filter((cycle) => {
    const matchSearch =
      cycle.nom.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      cycle.code.toLowerCase().includes(searchQuery.value.toLowerCase());
    const matchStatut = !filterStatut.value || cycle.statut === filterStatut.value;
    return matchSearch && matchStatut;
  });
});

// Méthodes
const getCycleIcon = (type) => {
  const icons = {
    licence: 'mdi mdi-school text-primary',
    master: 'mdi mdi-school-outline text-success',
    doctorat: 'mdi mdi-certificate text-warning',
  };
  return icons[type] || 'mdi mdi-school';
};

const getStatutClass = (statut) => {
  const classes = {
    actif: 'status-badge status-active',
    inactif: 'status-badge status-inactive',
    brouillon: 'status-badge status-draft',
  };
  return classes[statut] || 'status-badge';
};

const getStatutLabel = (statut) => {
  const labels = {
    actif: 'Actif',
    inactif: 'Inactif',
    brouillon: 'Brouillon',
  };
  return labels[statut] || statut;
};

const resetFilters = () => {
  searchQuery.value = '';
  filterStatut.value = '';
  filterNiveau.value = '';
};

const applyFilters = () => {
  console.log('Filtres appliqués');
};

const exportData = () => {
  console.log('Export des cycles');
};

const voirDetails = (cycle) => {
  console.log('Voir détails:', cycle);
};

const modifierCycle = (cycle) => {
  console.log('Modifier:', cycle);
};

const supprimerCycle = (cycle) => {
  if (confirm(`Êtes-vous sûr de vouloir supprimer le cycle ${cycle.nom} ?`)) {
    console.log('Supprimer:', cycle);
  }
};

const enregistrerCycle = () => {
  console.log('Enregistrer:', formData.value);
};
</script>
