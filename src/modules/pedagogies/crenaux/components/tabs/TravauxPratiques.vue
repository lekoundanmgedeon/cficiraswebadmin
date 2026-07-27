<template>
  <div class="row">
    <!-- Header de la section -->
    <div class="col-12 mb-4">
      <h3 class="fw-bold mb-1">Rapports & Analyses des Plannings</h3>
      <p class="text-muted small mb-0">
        <i class="bi bi-bar-chart-line-fill me-1"></i>
        Visualisez l'état de consommation des enveloppes horaires, le taux d'occupation des salles
        et l'activité des formateurs.
      </p>
    </div>

    <!-- Filtres de période et d'analyse -->
    <div class="col-12 mb-4">
      <div class="card border-0 shadow-sm bg-light rounded-4">
        <div class="card-body p-3">
          <div class="row g-3 align-items-end">
            <!-- Période -->
            <div class="col-md-3">
              <label class="form-label small fw-semibold text-muted mb-1">Mois d'analyse</label>
              <select class="form-select border-0 shadow-sm" v-model="selectedMois">
                <option value="Mai 2026">Mai 2026 (En cours)</option>
                <option value="Avril 2026">Avril 2026</option>
                <option value="Mars 2026">Mars 2026</option>
              </select>
            </div>
            <!-- Type d'entité étudiée -->
            <div class="col-md-4">
              <label class="form-label small fw-semibold text-muted mb-1">Type de Rapport</label>
              <select class="form-select border-0 shadow-sm" v-model="reportType">
                <option value="formateur">Activité & Volumes Formateurs</option>
                <option value="salle">Taux d'utilisation des Salles</option>
              </select>
            </div>
            <!-- Bouton d'exportation Excel brute -->
            <div class="col-md-5 text-md-end">
              <button
                class="btn btn-success border-0 shadow-sm px-3 py-2 me-2"
                @click="exportToExcel"
              >
                <i class="bi bi-file-earmark-spreadsheet-fill me-1"></i> Exporter Data (Excel)
              </button>
              <button class="btn btn-primary border-0 shadow-sm px-3 py-2" @click="refreshStats">
                <i class="bi bi-arrow-clockwise"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tableau Dynamique selon le type de rapport choisi -->
    <div class="col-12">
      <div class="card border-0 shadow-sm rounded-4 overflow-hidden bg-white">
        <!-- SECTION 1 : RAPPORT FORMATEUR -->
        <div v-if="reportType === 'formateur'">
          <div class="card-header bg-white border-0 pt-4 px-4 pb-2">
            <h5 class="fw-bold text-dark mb-0">
              <i class="bi bi-person-check-fill text-primary me-2"></i>Synthèse Mensuelle des Heures
              Honorées
            </h5>
          </div>
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="table table-hover align-middle mb-0">
                <thead class="bg-light">
                  <tr>
                    <th class="ps-4 py-3">Formateur</th>
                    <th>Statut RH</th>
                    <th class="text-center">Heures Planifiées</th>
                    <th class="text-center">Heures Effectuées</th>
                    <th class="text-center">Taux de Réalisation</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="f in mockFormateurStats" :key="f.nom">
                    <td class="ps-4 fw-bold text-dark">{{ f.nom }}</td>
                    <td>
                      <span class="badge border bg-light text-secondary">{{ f.statut }}</span>
                    </td>
                    <td class="text-center">{{ f.planifie }} h</td>
                    <td class="text-center fw-bold text-primary">{{ f.effectue }} h</td>
                    <td class="text-center">
                      <span
                        class="badge rounded-pill"
                        :class="
                          f.effectue === f.planifie
                            ? 'bg-soft-success text-success'
                            : 'bg-soft-primary text-primary'
                        "
                      >
                        {{ Math.round((f.effectue / f.planifie) * 100) }}%
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- SECTION 2 : RAPPORT SALLE -->
        <div v-else>
          <div class="card-header bg-white border-0 pt-4 px-4 pb-2">
            <h5 class="fw-bold text-dark mb-0">
              <i class="bi bi-building-fill text-warning me-2"></i>Occupation & Fréquentation des
              Locaux
            </h5>
          </div>
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="table table-hover align-middle mb-0">
                <thead class="bg-light">
                  <tr>
                    <th class="ps-4 py-3">Nom de la Salle</th>
                    <th>Type / Capacité</th>
                    <th class="text-center">Total Heures Réservées</th>
                    <th style="width: 30%">Taux d'occupation (sur 160h ouvrables)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="s in mockSalleStats" :key="s.nom">
                    <td class="ps-4 fw-bold text-dark">
                      <span
                        class="badge bg-soft-warning text-warning me-2"
                        style="font-size: 11px"
                        >{{ s.nom }}</span
                      >
                    </td>
                    <td class="text-secondary small">{{ s.type }}</td>
                    <td class="text-center fw-semibold">{{ s.heuresReservees }} h</td>
                    <td>
                      <div class="d-flex align-items-center">
                        <div class="progress flex-grow-1 bg-light rounded-pill" style="height: 6px">
                          <div
                            class="progress-bar rounded-pill bg-warning"
                            role="progressbar"
                            :style="{ width: s.taux + '%' }"
                          ></div>
                        </div>
                        <span class="ms-2 small fw-bold text-muted">{{ s.taux }}%</span>
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
  </div>
</template>

<script setup>
import { ref } from 'vue';

// États des filtres
const selectedMois = ref('Mai 2026');
const reportType = ref('formateur');

// Données fictives d'analyses RH/Formateurs
const mockFormateurStats = ref([
  { nom: 'Dupont Jean', statut: 'Permanent (35h)', planifie: 120, effectue: 112 },
  { nom: 'Traoré Moussa', statut: 'Permanent (35h)', planifie: 90, effectue: 90 },
  { nom: 'Alami Sanaa', statut: 'Vacataire', planifie: 45, effectue: 32 },
]);

// Données fictives d'analyses Infrastructures/Salles
const mockSalleStats = ref([
  { nom: 'Amphi A', type: 'Amphithéâtre (150 places)', heuresReservees: 96, taux: 60 },
  {
    nom: 'Salle 102 (Labo)',
    type: 'Salle Informatique (30 postes)',
    heuresReservees: 128,
    taux: 80,
  },
  { nom: 'Salle 204', type: 'Salle de cours standard (40 places)', heuresReservees: 48, taux: 30 },
]);

// Actions simulées
const refreshStats = () => {
  alert(`Actualisation des données d'emploi du temps pour le mois de ${selectedMois.value}...`);
};

const exportToExcel = () => {
  alert(
    `Génération et téléchargement de l'export d'audit brut : Rapport_${reportType.value}_${selectedMois.value.replace(' ', '_')}.xlsx`
  );
};
</script>

<style scoped>
/* Teintes douces thématiques */
.bg-soft-primary {
  background-color: rgba(0, 123, 255, 0.1);
  color: #007bff;
}
.bg-soft-success {
  background-color: rgba(40, 167, 69, 0.12);
  color: #28a745;
}
.bg-soft-warning {
  background-color: rgba(255, 193, 7, 0.12);
  color: #ffc107;
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

/* Alignement avec la charte graphique ERP */
.rounded-4 {
  border-radius: 0.2rem !important;
}
.form-select {
  font-size: 0.85rem;
}
</style>
