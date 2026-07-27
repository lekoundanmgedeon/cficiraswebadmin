<template>
  <div class="row">
    <!-- Header de la section -->
    <div class="col-12 mb-4">
      <h3 class="fw-bold mb-1">Suivi des Charges Horaires</h3>
      <p class="text-muted small mb-0">
        <i class="bi bi-hourglass-split me-1"></i>
        Suivez l'état d'avancement des cours, les heures consommées et le reliquat par matière et
        par classe.
      </p>
    </div>

    <!-- Sélections de filtres rapides -->
    <div class="col-12 mb-4">
      <div class="card border-0 shadow-sm bg-light rounded-4">
        <div class="card-body p-3">
          <div class="row g-3 align-items-center">
            <!-- Sélection de la Classe -->
            <div class="col-md-4">
              <label class="form-label small fw-semibold text-muted mb-1">Filtrer par Classe</label>
              <select class="form-select border-0 shadow-sm" v-model="selectedClasse">
                <option value="Toutes">Toutes les classes</option>
                <option value="Master 1 Info">Master 1 Info</option>
                <option value="Master 2 Info">Master 2 Info</option>
                <option value="Licence 3 Management">Licence 3 Management</option>
              </select>
            </div>
            <!-- État d'avancement -->
            <div class="col-md-4">
              <label class="form-label small fw-semibold text-muted mb-1">Statut du cours</label>
              <select class="form-select border-0 shadow-sm" v-model="statusFilter">
                <option value="Tous">Tous les statuts</option>
                <option value="En cours">En cours d'exécution</option>
                <option value="Terminé">Terminés (100%)</option>
                <option value="Alerte">En retard (&lt; 20%)</option>
              </select>
            </div>
            <!-- Alerte globale de quota -->
            <div class="col-md-4 text-md-end mt-4">
              <span class="badge bg-soft-primary text-primary px-3 py-2 rounded">
                <i class="bi bi-info-circle-fill me-1"></i> Total Volume Planifié : 435 heures
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tableau de suivi des volumes horaires -->
    <div class="col-12">
      <div class="card border-0 shadow-sm rounded-4 overflow-hidden">
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead class="bg-light">
                <tr>
                  <th class="ps-4 py-3">Matière / Classe</th>
                  <th>Formateur</th>
                  <th class="text-center">Quota Total</th>
                  <th class="text-center">Effectué (Consommé)</th>
                  <th class="text-center">Restant</th>
                  <th style="width: 25%">Progression</th>
                  <th class="text-end pe-4">Alerte</th>
                </tr>
              </thead>

              <tbody>
                <tr v-for="item in filteredCharges" :key="item.id" class="transition-all">
                  <!-- Libellé matière et Classe -->
                  <td class="ps-4">
                    <div class="fw-bold text-dark">{{ item.matiere }}</div>
                    <span class="badge bg-light text-secondary border mt-1" style="font-size: 10px">
                      {{ item.classe }}
                    </span>
                  </td>

                  <!-- Nom du Formateur assigné -->
                  <td class="text-secondary small">
                    <i class="bi bi-person me-1"></i> {{ item.formateur }}
                  </td>

                  <!-- Volume global prévu -->
                  <td class="text-center fw-semibold text-dark">{{ item.quota }} h</td>

                  <!-- Heures consommées -->
                  <td class="text-center">
                    <span class="badge bg-soft-success text-success px-2 py-1 fw-bold">
                      {{ item.effectue }} h
                    </span>
                  </td>

                  <!-- Heures restantes -->
                  <td class="text-center">
                    <span
                      class="fw-bold"
                      :class="item.quota - item.effectue === 0 ? 'text-muted' : 'text-danger'"
                    >
                      {{ item.quota - item.effectue }} h
                    </span>
                  </td>

                  <!-- Jauge de progression graphique (Flat UI) -->
                  <td>
                    <div class="d-flex align-items-center">
                      <div class="progress flex-grow-1 bg-light rounded-pill" style="height: 6px">
                        <div
                          class="progress-bar rounded-pill"
                          :class="getProgressColor(item.effectue, item.quota)"
                          role="progressbar"
                          :style="{ width: calculatePercentage(item.effectue, item.quota) + '%' }"
                        ></div>
                      </div>
                      <span class="ms-2 small fw-bold text-muted" style="font-size: 11px">
                        {{ calculatePercentage(item.effectue, item.quota) }}%
                      </span>
                    </div>
                  </td>

                  <!-- Indicateur d'état critique -->
                  <td class="text-end pe-4">
                    <span
                      v-if="calculatePercentage(item.effectue, item.quota) >= 100"
                      class="badge bg-success text-white"
                    >
                      Clôturé
                    </span>
                    <span v-else-if="item.effectue === 0" class="badge bg-warning text-dark">
                      Non démarré
                    </span>
                    <span v-else class="badge bg-light text-dark border"> En cours </span>
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

// Filtres
const selectedClasse = ref('Toutes');
const statusFilter = ref('Tous');

// Données de suivi (Mock data croisant Classes, Matières et Emplois du temps passés)
const mockCharges = ref([
  {
    id: 1,
    classe: 'Master 1 Info',
    matiere: 'Conception orientée objet & Patterns',
    formateur: 'Dupont Jean',
    quota: 45,
    effectue: 30,
  },
  {
    id: 2,
    classe: 'Master 1 Info',
    matiere: 'Frameworks Modernes (Vue.js 3 & Node)',
    formateur: 'Traoré Moussa',
    quota: 40,
    effectue: 40,
  },
  {
    id: 3,
    classe: 'Master 2 Info',
    matiere: 'Deep Learning & Vision par ordinateur',
    formateur: 'Alami Sanaa',
    quota: 35,
    effectue: 12,
  },
  {
    id: 4,
    classe: 'Licence 3 Management',
    matiere: 'Méthodologies Agiles & Scrum Master',
    formateur: 'Dupont Jean',
    quota: 30,
    effectue: 0,
  },
  {
    id: 5,
    classe: 'Master 1 Info',
    matiere: "Bases de l'apprentissage automatique (ML)",
    formateur: 'Alami Sanaa',
    quota: 50,
    effectue: 48,
  },
]);

// Logique de calcul du pourcentage d'exécution
const calculatePercentage = (effectue, quota) => {
  if (!quota) return 0;
  return Math.round((effectue / quota) * 100);
};

// Attribution dynamique de la couleur de la barre de progression (Flat UI style)
const getProgressColor = (effectue, quota) => {
  const pct = calculatePercentage(effectue, quota);
  if (pct >= 100) return 'bg-success'; // Terminé
  if (pct < 20) return 'bg-warning'; // Alerte / Peu avancé
  return 'bg-primary'; // Rythme normal
};

// Filtrage combiné (Classe + Statut d'avancement)
const filteredCharges = computed(() => {
  return mockCharges.value.filter((item) => {
    const matchClasse = selectedClasse.value === 'Toutes' || item.classe === selectedClasse.value;

    const pct = calculatePercentage(item.effectue, item.quota);
    let matchStatus = true;
    if (statusFilter.value === 'En cours') matchStatus = pct > 0 && pct < 100;
    if (statusFilter.value === 'Terminé') matchStatus = pct >= 100;
    if (statusFilter.value === 'Alerte') matchStatus = pct < 20;

    return matchClasse && matchStatus;
  });
});
</script>

<style scoped>
/* Teintes douces pour les badges */
.bg-soft-primary {
  background-color: rgba(0, 123, 255, 0.1);
  color: #007bff;
}
.bg-soft-success {
  background-color: rgba(40, 167, 69, 0.12);
  color: #28a745;
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

/* Identité Flat Design */
.rounded-4 {
  border-radius: 0.2rem !important;
}
.form-select {
  font-size: 0.85rem;
}
.transition-all {
  transition: all 0.3s ease;
}
</style>
