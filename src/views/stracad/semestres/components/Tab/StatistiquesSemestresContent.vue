<template>
  <div class="semester-stats-container">
    <!-- En-tête de page -->
    <div class="row mb-4">
      <div class="col-12 d-flex justify-content-between align-items-center flex-wrap gap-3">
        <div>
          <h3 class="fw-bold text-dark mb-1">Analytique & Statistiques Semestrielles</h3>
          <p class="text-muted text-sm mb-0">
            Aperçu des indicateurs de performance, volume d'heures global et suivi de l'assiduité
            par cycle académique.
          </p>
        </div>

        <!-- Filtre global de période académique -->
        <div class="d-flex align-items-center gap-2">
          <label class="text-xs text-muted text-uppercase fw-bold mb-0">Année :</label>
          <select
            v-model="selectedPeriod"
            class="form-select text-sm bg-white border border-secondary-subtle py-1.5 px-3 shadow-none style-select"
          >
            <option value="2025-2026">2025-2026 (En cours)</option>
            <option value="2024-2025">2024-2025</option>
          </select>
        </div>
      </div>
    </div>

    <!-- ÉTAPE 1 : CARTES DES INDICATEURS CLÉS (KPI CARDS) -->
    <div class="row g-3 mb-4">
      <!-- KPI 1 : Total Heures de Cours -->
      <div class="col-xl-3 col-sm-6">
        <div
          class="card border-0 shadow-sm bg-white rounded-4 p-3 h-100 border-start border-4 border-primary"
        >
          <div class="d-flex align-items-center justify-content-between">
            <div>
              <span class="text-xs text-muted text-uppercase fw-bold tracking-wider d-block mb-1"
                >Volume Horaire global</span
              >
              <h3 class="fw-bold text-dark mb-0 font-monospace">
                1,240 <small class="fs-6 text-muted">H</small>
              </h3>
            </div>
            <div class="kpi-icon-wrapper bg-soft-primary text-primary">
              <i class="mdi mdi-clock-outline"></i>
            </div>
          </div>
          <div class="mt-2 text-xs text-muted">
            <span class="text-success fw-bold"><i class="mdi mdi-arrow-up"></i> +4.2%</span> par
            rapport à l'an passé
          </div>
        </div>
      </div>

      <!-- KPI 2 : Moyenne de Présence -->
      <div class="col-xl-3 col-sm-6">
        <div
          class="card border-0 shadow-sm bg-white rounded-4 p-3 h-100 border-start border-4 border-success"
        >
          <div class="d-flex align-items-center justify-content-between">
            <div>
              <span class="text-xs text-muted text-uppercase fw-bold tracking-wider d-block mb-1"
                >Taux d'Assiduité Global</span
              >
              <h3 class="fw-bold text-success mb-0 font-monospace">
                92.4 <small class="fs-6">%</small>
              </h3>
            </div>
            <div class="kpi-icon-wrapper bg-soft-success text-success">
              <i class="mdi mdi-account-check-outline"></i>
            </div>
          </div>
          <div class="mt-2 text-xs text-muted">
            Seuil de tolérance fixé à <span class="fw-bold">85%</span>
          </div>
        </div>
      </div>

      <!-- KPI 3 : Total Enseignants Actifs -->
      <div class="col-xl-3 col-sm-6">
        <div
          class="card border-0 shadow-sm bg-white rounded-4 p-3 h-100 border-start border-4 border-info"
        >
          <div class="d-flex align-items-center justify-content-between">
            <div>
              <span class="text-xs text-muted text-uppercase fw-bold tracking-wider d-block mb-1"
                >Corps Enseignant</span
              >
              <h3 class="fw-bold text-dark mb-0 font-monospace">
                48 <small class="fs-6 text-muted">Prof.</small>
              </h3>
            </div>
            <div class="kpi-icon-wrapper bg-soft-info text-info">
              <i class="mdi mdi-tie"></i>
            </div>
          </div>
          <div class="mt-2 text-xs text-muted">
            Moyenne de <span class="fw-bold">2.4 UE</span> par intervenant
          </div>
        </div>
      </div>

      <!-- KPI 4 : Total UE enregistrées -->
      <div class="col-xl-3 col-sm-6">
        <div
          class="card border-0 shadow-sm bg-white rounded-4 p-3 h-100 border-start border-4 border-warning"
        >
          <div class="d-flex align-items-center justify-content-between">
            <div>
              <span class="text-xs text-muted text-uppercase fw-bold tracking-wider d-block mb-1"
                >Unités d'Enseignement</span
              >
              <h3 class="fw-bold text-dark mb-0 font-monospace">
                116 <small class="fs-6 text-muted">UE</small>
              </h3>
            </div>
            <div class="kpi-icon-wrapper bg-soft-warning text-warning">
              <i class="mdi mdi-book-open-variant"></i>
            </div>
          </div>
          <div class="mt-2 text-xs text-muted">
            <span class="fw-bold text-dark">100%</span> configurées sur la plateforme
          </div>
        </div>
      </div>
    </div>

    <!-- ÉTAPE 2 : MATRICE DE RÉPARTITION PAR SEMESTRE -->
    <div class="row g-4">
      <!-- Tableau de performance et de charge des semestres actifs -->
      <div class="col-xl-8">
        <div class="card border-0 shadow-sm bg-white rounded-4 p-4 h-100">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <h5 class="fw-bold text-dark mb-0">Charge d'Enseignement par Semestre</h5>
            <span class="badge bg-light text-secondary border font-monospace text-xs px-2.5 py-1.5"
              >Vue d'ensemble analytique</span
            >
          </div>

          <div class="table-responsive">
            <table class="table align-middle text-center mb-0">
              <thead class="table-light-header text-secondary">
                <tr>
                  <th class="text-start ps-3" style="width: 15%">Semestre</th>
                  <th class="text-start" style="width: 25%">Filière cible</th>
                  <th style="width: 15%">Nombre d'UE</th>
                  <th style="width: 15%">Volume total</th>
                  <th style="width: 15%">Moy. Validation</th>
                  <th class="text-end pe-3" style="width: 15%">Alerte Équipe</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="stat in semesterStats" :key="stat.id" class="stats-row">
                  <!-- Semestre -->
                  <td class="text-start ps-3 font-monospace fw-bold text-primary">
                    {{ stat.code }}
                  </td>

                  <!-- Filiere et Niveau -->
                  <td class="text-start">
                    <div class="fw-bold text-dark text-truncate" style="max-width: 180px">
                      {{ stat.filiere }}
                    </div>
                    <small class="text-xs text-muted">{{ stat.niveau }}</small>
                  </td>

                  <!-- Nb UE -->
                  <td class="font-monospace fw-bold text-secondary">
                    {{ stat.nbUes }}
                  </td>

                  <!-- Vol Horaire -->
                  <td class="font-monospace text-dark fw-bold">{{ stat.totalHeures }} h</td>

                  <!-- Note moyenne estimée ou passée -->
                  <td class="font-monospace">
                    <span class="fw-bold text-dark">{{ stat.moyenneGenerale }}</span
                    ><span class="text-muted text-xs">/20</span>
                  </td>

                  <!-- État de la Maquette (Alerte visuelle si sous-dimensionnée) -->
                  <td class="text-end pe-3">
                    <span
                      class="badge text-xs px-2.5 py-1.5 rounded-pill font-semibold"
                      :class="
                        stat.statutMaquette === 'Conforme'
                          ? 'bg-soft-success text-success'
                          : 'bg-soft-danger text-danger'
                      "
                    >
                      {{ stat.statutMaquette }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- COLONNE DROITE : DISTRIBUTION DES HEURES PAR TYPOLOGIE D'UE -->
      <div class="col-xl-4">
        <div class="card border-0 shadow-sm bg-white rounded-4 p-4 h-100">
          <h5 class="fw-bold text-dark mb-1">Typologie des Enseignements</h5>
          <p class="text-muted text-xs mb-4">
            Répartition en volume d'heures par type d'unité pédagogique.
          </p>

          <div class="d-flex flex-column gap-3.5">
            <!-- Type 1 : Fondamental -->
            <div>
              <div class="d-flex justify-content-between align-items-center text-sm mb-1.5">
                <span class="text-dark fw-bold"
                  ><i class="mdi mdi-circle text-primary me-2 text-xs"></i>Cours Fondamentaux</span
                >
                <span class="text-muted font-monospace text-xs">744 H (60%)</span>
              </div>
              <div class="custom-mini-bar-bg">
                <div class="custom-mini-bar-fill bg-primary" style="width: 60%"></div>
              </div>
            </div>

            <!-- Type 2 : Optionnel / Spécialisation -->
            <div>
              <div class="d-flex justify-content-between align-items-center text-sm mb-1.5">
                <span class="text-dark fw-bold"
                  ><i class="mdi mdi-circle text-info me-2 text-xs"></i>Options & Spécialités</span
                >
                <span class="text-muted font-monospace text-xs">372 H (30%)</span>
              </div>
              <div class="custom-mini-bar-bg">
                <div class="custom-mini-bar-fill bg-info" style="width: 30%"></div>
              </div>
            </div>

            <!-- Type 3 : Transversal -->
            <div>
              <div class="d-flex justify-content-between align-items-center text-sm mb-1.5">
                <span class="text-dark fw-bold"
                  ><i class="mdi mdi-circle text-warning me-2 text-xs"></i>Outils &
                  Transversaux</span
                >
                <span class="text-muted font-monospace text-xs">124 H (10%)</span>
              </div>
              <div class="custom-mini-bar-bg">
                <div class="custom-mini-bar-fill bg-warning" style="width: 10%"></div>
              </div>
            </div>
          </div>

          <!-- Note d'audit de bas de carte -->
          <div
            class="mt-4 pt-3 border-top bg-light-subtle rounded p-2.5 text-xs text-muted d-flex align-items-start gap-2"
          >
            <i class="mdi mdi-information-outline text-primary mt-0.5 fs-6"></i>
            <span
              >La répartition actuelle respecte parfaitement les quotas directeurs préconisés par le
              ministère (LMD).</span
            >
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const selectedPeriod = ref('2025-2026');

// Mock data analytique consolidé pour l'affichage statistique
const semesterStats = ref([
  {
    id: 1,
    code: 'SEM-1',
    niveau: 'Licence 1',
    filiere: 'Informatique de Gestion',
    nbUes: 4,
    totalHeures: 162,
    moyenneGenerale: '13.45',
    statutMaquette: 'Conforme',
  },
  {
    id: 2,
    code: 'SEM-2',
    niveau: 'Licence 1',
    filiere: 'Informatique de Gestion',
    nbUes: 3,
    totalHeures: 112,
    moyenneGenerale: '12.80',
    statutMaquette: 'Heures < Minimum',
  },
  {
    id: 3,
    code: 'SEM-1',
    niveau: 'Master 1',
    filiere: 'Génie Logiciel & DevOps',
    nbUes: 5,
    totalHeures: 240,
    moyenneGenerale: '14.10',
    statutMaquette: 'Conforme',
  },
  {
    id: 4,
    code: 'SEM-1',
    niveau: 'Master 1',
    filiere: 'Data Science & IA',
    nbUes: 4,
    totalHeures: 180,
    moyenneGenerale: '11.95',
    statutMaquette: 'Conforme',
  },
]);
</script>

<style scoped>
/* Couleurs douces de fond pour les icônes KPI */
.bg-soft-primary {
  background-color: rgba(0, 123, 255, 0.08);
}
.bg-soft-success {
  background-color: rgba(40, 167, 69, 0.08);
}
.bg-soft-info {
  background-color: rgba(23, 162, 184, 0.08);
}
.bg-soft-warning {
  background-color: rgba(255, 193, 7, 0.08);
}
.bg-soft-danger {
  background-color: rgba(220, 53, 69, 0.08);
}

.bg-light-subtle {
  background-color: #f8f9fa;
}

/* Tailles standardisées de l'UI globale */
.text-sm {
  font-size: 13px !important;
}
.text-xs {
  font-size: 11.5px !important;
}
.tracking-wider {
  letter-spacing: 0.8px;
}

/* Styles spécifiques aux boîtes KPI */
.kpi-icon-wrapper {
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  font-size: 20px;
}

/* En-tête des tableaux */
.table-light-header th {
  font-size: 11.5px;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  background-color: #f8f9fa;
  font-weight: 700;
  border: none;
}

/* Lignes du tableau */
.table tbody tr td {
  padding-top: 13px !important;
  padding-bottom: 13px !important;
}
.stats-row {
  border-bottom: 1px solid #f1f3f5;
  transition: background-color 0.1s ease;
}
.stats-row:hover {
  background-color: rgba(0, 0, 0, 0.005);
}

/* Micro barres de distribution horizontales (CSS natif léger) */
.custom-mini-bar-bg {
  width: 100%;
  height: 6px;
  background-color: #edf2f7;
  border-radius: 10px;
  overflow: hidden;
}
.custom-mini-bar-fill {
  height: 100%;
  border-radius: 10px;
}

/* Éléments de formulaire et conteneurs standardisés */
.rounded-4 {
  border-radius: 0.2rem !important;
}
.style-select {
  border-radius: 0.15rem;
}
.gap-3\.5 {
  gap: 14px !important;
}
</style>
