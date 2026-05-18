<!-- CyclesContent.vue -->
<template>
  <div>
    <!-- Statistiques rapides -->
    <div class="col-12 mb-2">
      <h4>Statistiques des cycles</h4>
      <p class="text-muted">Indicateurs globaux liés aux cycles et à l’activité académique.</p>
    </div>

    <div class="table-responsive card border-light">
      <table class="table align-middle mb-0 custom-table-robust">
        <thead>
          <tr>
            <th class="ps-4">Code / Nom</th>
            <th>Diplôme</th>
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
</template>

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

<style scoped>
.stat-card {
  background: #fff;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-icon i {
  font-size: 28px;
}

.stat-content h3 {
  margin: 0;
  font-size: 2rem;
  font-weight: 600;
  color: #2c3e50;
}

.stat-content p {
  margin: 0;
  color: #6c757d;
  font-size: 0.9rem;
}

.bg-primary-soft {
  background-color: rgba(0, 123, 255, 0.1);
}
.bg-success-soft {
  background-color: rgba(40, 167, 69, 0.1);
}
.bg-info-soft {
  background-color: rgba(23, 162, 184, 0.1);
}
.bg-warning-soft {
  background-color: rgba(255, 193, 7, 0.1);
}

.cycle-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 123, 255, 0.1);
}

.cycle-icon i {
  font-size: 20px;
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
