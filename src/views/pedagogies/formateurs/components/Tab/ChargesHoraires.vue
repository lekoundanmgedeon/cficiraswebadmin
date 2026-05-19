<template>
  <div class="row">
    <!-- Header de la section -->
    <div class="col-12 mb-4">
      <h3 class="fw-bold mb-1">Suivi des Charges Horaires</h3>
      <p class="text-muted small mb-0">
        <i class="bi bi-hourglass-split me-1"></i>
        Visualisez le volume d'heures assigné par formateur par rapport à leur quota contractuel.
      </p>
    </div>

    <!-- Filtres & Barre de recherche -->
    <div class="col-12 mb-4">
      <div class="card border-0 shadow-sm bg-light rounded-4">
        <div class="card-body p-3">
          <div class="row g-3">
            <!-- Recherche textuelle -->
            <div class="col-md-6">
              <div class="input-group bg-white rounded shadow-sm">
                <span class="input-group-text bg-white border-0">
                  <i class="bi bi-search text-primary"></i>
                </span>
                <input
                  type="text"
                  class="form-control border-0"
                  placeholder="Rechercher un formateur..."
                  v-model="searchQuery"
                />
              </div>
            </div>
            <!-- Filtre par Type de Contrat -->
            <div class="col-md-4">
              <select class="form-select border-0 shadow-sm" v-model="filterContrat">
                <option value="">Tous les types de contrat</option>
                <option value="Permanent">Permanent (Temps plein)</option>
                <option value="Vacataire">Vacataire</option>
              </select>
            </div>
            <!-- Reset -->
            <div class="col-md-2">
              <button class="btn btn-white w-100 shadow-sm border-0" @click="resetFilters">
                <i class="bi bi-sliders me-1"></i> Reset
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tableau de suivi des charges -->
    <div class="col-12">
      <div class="card border-0 shadow-sm rounded-4 overflow-hidden">
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead class="bg-light">
                <tr>
                  <th class="ps-4 py-3">Formateur</th>
                  <th>Statut / Contrat</th>
                  <th style="width: 25%">Taux d'Occupation</th>
                  <th class="text-center">Heures Assignées</th>
                  <th class="text-center">Quota Max</th>
                  <th class="text-center">Heures Sup.</th>
                  <th class="text-end pe-4">État</th>
                </tr>
              </thead>

              <tbody>
                <tr v-for="charge in filteredCharges" :key="charge.id" class="transition-all">
                  <!-- Formateur -->
                  <td class="ps-4">
                    <div class="d-flex align-items-center">
                      <div class="avatar-initials me-3 bg-soft-primary text-primary">
                        {{ charge.nom[0] }}{{ charge.prenom[0] }}
                      </div>
                      <div>
                        <div class="fw-bold text-dark">{{ charge.nom }} {{ charge.prenom }}</div>
                        <small class="text-muted">ID: {{ charge.matricule }}</small>
                      </div>
                    </div>
                  </td>

                  <!-- Type de Contrat -->
                  <td>
                    <span class="badge bg-light text-secondary border px-2 py-1">
                      {{ charge.contrat }}
                    </span>
                  </td>

                  <!-- Jauge de progression / Taux d'occupation -->
                  <td>
                    <div class="d-flex align-items-center">
                      <div class="progress flex-grow-1 bg-light rounded-pill" style="height: 6px">
                        <div
                          class="progress-bar rounded-pill"
                          role="progressbar"
                          :style="{ width: Math.min(getPercentage(charge), 100) + '%' }"
                          :class="getProgressBarClass(charge)"
                        ></div>
                      </div>
                      <span class="ms-2 small fw-bold text-dark">{{ getPercentage(charge) }}%</span>
                    </div>
                  </td>

                  <!-- Heures assignées au total -->
                  <td class="text-center">
                    <span class="fw-bold text-dark">{{ charge.heuresAssignees }} h</span>
                  </td>

                  <!-- Quota Max contractuel -->
                  <td class="text-center text-muted">
                    <span>{{ charge.quotaMax }} h</span>
                  </td>

                  <!-- Calcul des Heures Sup / Reste -->
                  <td class="text-center">
                    <span
                      v-if="charge.heuresAssignees > charge.quotaMax"
                      class="text-danger fw-bold"
                    >
                      +{{ charge.heuresAssignees - charge.quotaMax }} h
                    </span>
                    <span v-else class="text-muted small">
                      {{ charge.quotaMax - charge.heuresAssignees }} h dispo.
                    </span>
                  </td>

                  <!-- État / Alerte visuelle -->
                  <td class="text-end pe-4">
                    <span class="badge rounded-pill px-2 py-1" :class="getStatusBadgeClass(charge)">
                      {{ getStatusLabel(charge) }}
                    </span>
                  </td>
                </tr>

                <!-- Liste vide -->
                <tr v-if="filteredCharges.length === 0">
                  <td colspan="7" class="text-center py-5">
                    <h6 class="text-muted fw-bold">Aucun formateur trouvé</h6>
                    <p class="small text-muted mb-0">
                      Modifiez vos filtres ou vos termes de recherche.
                    </p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const searchQuery = ref('');
const filterContrat = ref('');

// Jeu de données simulant la charge horaire globale annuelle ou semestrielle
const mockCharges = ref([
  {
    id: 1,
    nom: 'Dupont',
    prenom: 'Jean',
    matricule: 'FOR-101',
    contrat: 'Permanent',
    heuresAssignees: 165,
    quotaMax: 160,
  },
  {
    id: 2,
    nom: 'Alami',
    prenom: 'Sanaa',
    matricule: 'FOR-102',
    contrat: 'Vacataire',
    heuresAssignees: 45,
    quotaMax: 90,
  },
  {
    id: 3,
    nom: 'Traoré',
    prenom: 'Moussa',
    matricule: 'FOR-103',
    contrat: 'Permanent',
    heuresAssignees: 158,
    quotaMax: 160,
  },
  {
    id: 4,
    nom: 'Muller',
    prenom: 'Charlotte',
    matricule: 'FOR-104',
    contrat: 'Permanent',
    heuresAssignees: 110,
    quotaMax: 160,
  },
]);

// Logique de calcul du pourcentage d'heures effectuées
const getPercentage = (charge) => {
  return Math.round((charge.heuresAssignees / charge.quotaMax) * 100);
};

// Logique de filtrage
const filteredCharges = computed(() => {
  return mockCharges.value.filter((charge) => {
    const matchesSearch =
      charge.nom.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      charge.prenom.toLowerCase().includes(searchQuery.value.toLowerCase());
    const matchesContrat = filterContrat.value === '' || charge.contrat === filterContrat.value;

    return matchesSearch && matchesContrat;
  });
});

// Reset des filtres
const resetFilters = () => {
  searchQuery.value = '';
  filterContrat.value = '';
};

// Choix de la couleur de la barre de progression selon le taux d'occupation
const getProgressBarClass = (charge) => {
  const pct = getPercentage(charge);
  if (pct > 100) return 'bg-danger'; // Surcharge / Heures sup
  if (pct >= 85) return 'bg-success'; // Charge idéale optimale
  if (pct >= 50) return 'bg-warning'; // Légère sous-charge
  return 'bg-secondary'; // Forte sous-charge
};

// Choix des labels et styles de badges d'état
const getStatusLabel = (charge) => {
  const pct = getPercentage(charge);
  if (pct > 100) return 'Heures Sup';
  if (pct >= 85) return 'Optimal';
  if (pct >= 50) return 'Sous-charge';
  return 'Inactif / Critique';
};

const getStatusBadgeClass = (charge) => {
  const pct = getPercentage(charge);
  if (pct > 100) return 'bg-soft-danger text-danger';
  if (pct >= 85) return 'bg-soft-success text-success';
  if (pct >= 50) return 'bg-soft-warning text-warning-dark';
  return 'bg-soft-secondary text-secondary';
};
</script>

<style scoped>
.avatar-initials {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.8rem;
}

/* Couleurs douces pour badges d'état */
.bg-soft-danger {
  background-color: rgba(220, 53, 69, 0.1);
  color: #dc3545;
}
.bg-soft-warning {
  background-color: rgba(255, 193, 7, 0.15);
  color: #997404;
}
.bg-soft-success {
  background-color: rgba(40, 167, 69, 0.1);
  color: #28a745;
}
.bg-soft-secondary {
  background-color: rgba(108, 117, 125, 0.1);
  color: #6c757d;
}
.bg-soft-primary {
  background-color: rgba(0, 123, 255, 0.1);
  color: #007bff;
}

.text-warning-dark {
  color: #997404;
}

.table th {
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
