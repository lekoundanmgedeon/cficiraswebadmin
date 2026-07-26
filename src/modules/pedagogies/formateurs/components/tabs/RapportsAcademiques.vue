<template>
  <div class="row">
    <!-- Header de la section -->
    <div class="col-12 mb-4">
      <h3 class="fw-bold mb-1">Rapports & Analyses</h3>
      <p class="text-muted small mb-0">
        <i class="bi bi-bar-chart-line-fill me-1"></i>
        Consultez les statistiques d'assiduité, de performance globale et exportez les bilans
        pédagogiques.
      </p>
    </div>

    <!-- Filtres d'analyse globaux -->
    <div class="col-12 mb-4">
      <div class="card border-0 shadow-sm bg-light rounded-4">
        <div class="card-body p-3">
          <div class="row g-3 align-items-end">
            <!-- Sélection de la Période -->
            <div class="col-md-3">
              <label class="form-label small fw-semibold text-muted mb-1">Période Académique</label>
              <select class="form-select border-0 shadow-sm" v-model="filters.periode">
                <option value="Semestre 1">Semestre 1 - 2025/2026</option>
                <option value="Semestre 2">Semestre 2 - 2025/2026</option>
                <option value="Année Complète">Année Académique Complète</option>
              </select>
            </div>
            <!-- Sélection de la Cohorte/Classe -->
            <div class="col-md-4">
              <label class="form-label small fw-semibold text-muted mb-1">Classe / Promotion</label>
              <select class="form-select border-0 shadow-sm" v-model="filters.classe">
                <option value="Toutes">Toutes les classes</option>
                <option value="Master 1 Info">Master 1 Info</option>
                <option value="Master 2 Info">Master 2 Info</option>
                <option value="Licence 3 Management">Licence 3 Management</option>
              </select>
            </div>
            <!-- Type de Données -->
            <div class="col-md-3">
              <label class="form-label small fw-semibold text-muted mb-1">Type de Rapport</label>
              <select class="form-select border-0 shadow-sm" v-model="filters.type">
                <option value="Global">Vue Pédagogique Globale</option>
                <option value="Absences">Assiduité & Absences</option>
                <option value="Notes">Performances & Notes</option>
              </select>
            </div>
            <!-- Bouton de rafraîchissement -->
            <div class="col-md-2">
              <button class="btn btn-primary w-100 shadow-sm border-0 py-2" @click="refreshReport">
                <i class="bi bi-arrow-clockwise me-1"></i> Générer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Indicateurs Clés (KPI Cards) basés sur les filtres -->
    <div class="col-12 mb-4">
      <div class="row g-3">
        <!-- KPI : Heures assurées -->
        <div class="col-md-4">
          <div class="card border-0 shadow-sm p-3 rounded-4 bg-white">
            <div class="d-flex align-items-center justify-content-between">
              <div>
                <h6 class="text-muted fw-semibold small text-uppercase mb-1">
                  Exécution des Heures
                </h6>
                <h3 class="fw-bold text-dark mb-0">87.4%</h3>
                <small class="text-success fw-medium" style="font-size: 11px">
                  <i class="bi bi-caret-up-fill me-1"></i>378h sur 432h prévues
                </small>
              </div>
              <div class="icon-box bg-soft-primary text-primary rounded-3 p-3">
                <i class="bi bi-clock-history fs-4"></i>
              </div>
            </div>
          </div>
        </div>

        <!-- KPI : Moyenne Générale -->
        <div class="col-md-4">
          <div class="card border-0 shadow-sm p-3 rounded-4 bg-white">
            <div class="d-flex align-items-center justify-content-between">
              <div>
                <h6 class="text-muted fw-semibold small text-uppercase mb-1">Moyenne Générale</h6>
                <h3 class="fw-bold text-dark mb-0">13.42 / 20</h3>
                <small class="text-muted" style="font-size: 11px">
                  Basé sur les évaluations validées
                </small>
              </div>
              <div class="icon-box bg-soft-success text-success rounded-3 p-3">
                <i class="bi bi-journal-check fs-4"></i>
              </div>
            </div>
          </div>
        </div>

        <!-- KPI : Taux d'absentéisme -->
        <div class="col-md-4">
          <div class="card border-0 shadow-sm p-3 rounded-4 bg-white">
            <div class="d-flex align-items-center justify-content-between">
              <div>
                <h6 class="text-muted fw-semibold small text-uppercase mb-1">Taux d'Absentéisme</h6>
                <h3 class="fw-bold text-dark mb-0">4.1%</h3>
                <small class="text-danger fw-medium" style="font-size: 11px">
                  <i class="bi bi-exclamation-triangle-fill me-1"></i>12 alertes critiques
                </small>
              </div>
              <div class="icon-box bg-soft-danger text-danger rounded-3 p-3">
                <i class="bi bi-person-dash fs-4"></i>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Section Documents & Listes des Rapports Prêts à l'Export -->
    <div class="col-12">
      <div class="card border-0 shadow-sm rounded-4 overflow-hidden">
        <div
          class="card-header bg-white border-0 pt-4 px-4 pb-2 d-flex justify-content-between align-items-center"
        >
          <h5 class="fw-bold text-dark mb-0">Documents de Synthèse Disponibles</h5>
          <span class="badge bg-light text-secondary border px-3 py-2 fw-semibold">
            Filtre actif : {{ filters.periode }}
          </span>
        </div>

        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead class="bg-light">
                <tr>
                  <th class="ps-4 py-3">Intitulé du Rapport</th>
                  <th>Cible / Classe</th>
                  <th>Généré le</th>
                  <th>Format</th>
                  <th>Poids</th>
                  <th class="text-end pe-4">Téléchargement</th>
                </tr>
              </thead>

              <tbody>
                <tr v-for="report in mockReports" :key="report.id" class="transition-all">
                  <!-- Nom du rapport -->
                  <td class="ps-4">
                    <div class="d-flex align-items-center">
                      <div
                        class="report-icon-box me-3 rounded-3"
                        :class="getFormatColor(report.format)"
                      >
                        <i class="bi" :class="getFormatIcon(report.format)"></i>
                      </div>
                      <div>
                        <div class="fw-bold text-dark">{{ report.titre }}</div>
                        <small class="text-muted">{{ report.description }}</small>
                      </div>
                    </div>
                  </td>

                  <!-- Classe concernée -->
                  <td>
                    <span class="badge bg-light text-dark border px-2 py-1">{{
                      report.classe
                    }}</span>
                  </td>

                  <!-- Date de génération -->
                  <td class="text-secondary small">{{ report.dateGen }}</td>

                  <!-- Badge format -->
                  <td>
                    <span
                      class="fw-bold text-uppercase small px-2 py-1 rounded"
                      :class="getFormatBadgeClass(report.format)"
                    >
                      {{ report.format }}
                    </span>
                  </td>

                  <!-- Taille du fichier -->
                  <td class="text-muted small">{{ report.taille }}</td>

                  <!-- Actions d'export direct -->
                  <td class="text-end pe-4">
                    <button
                      class="btn btn-light btn-sm border-0 shadow-sm px-3 rounded-pill"
                      @click="downloadReport(report.titre)"
                    >
                      <i class="bi bi-download text-primary me-1"></i> Exporter
                    </button>
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
import { ref } from 'vue';

// Filtres réactifs
const filters = ref({
  periode: 'Semestre 2',
  classe: 'Toutes',
  type: 'Global',
});

// Liste de rapports pré-générés ou dynamiques (Mock Data)
const mockReports = ref([
  {
    id: 1,
    titre: 'Bilan_Assiduite_Global_S2.pdf',
    description: 'Rapport complet des absences justifiées et injustifiées.',
    classe: 'Toutes les classes',
    dateGen: '18/05/2026',
    format: 'pdf',
    taille: '2.4 Mo',
  },
  {
    id: 2,
    titre: 'Suivi_Charges_Horaires_Formateurs.xlsx',
    description: 'Tableau de synthèse des volumes horaires effectués vs quotas contractuels.',
    classe: 'Équipe Enseignante',
    dateGen: '17/05/2026',
    format: 'excel',
    taille: '1.1 Mo',
  },
  {
    id: 3,
    titre: 'Proces_Verbal_Notes_M1_Info.pdf',
    description: 'Synthèse des moyennes générales et classement pour le Master 1.',
    classe: 'Master 1 Info',
    dateGen: '15/05/2026',
    format: 'pdf',
    taille: '4.8 Mo',
  },
  {
    id: 4,
    titre: 'Statistiques_Espace_Pedagogique.csv',
    description: "Taux de téléchargement et d'usage des fichiers par les étudiants.",
    classe: 'Toutes les classes',
    dateGen: '10/05/2026',
    format: 'csv',
    taille: '420 Ko',
  },
]);

// Actions de simulation
const refreshReport = () => {
  alert(
    `Génération du rapport d'analyse pour la sélection : ${filters.value.classe} (${filters.value.periode})`
  );
};

const downloadReport = (title) => {
  alert(`Préparation du téléchargement pour : ${title}`);
};

// Formattage visuel des icônes de fichiers selon le type d'export
const getFormatIcon = (format) => {
  switch (format) {
    case 'pdf':
      return 'bi-filetype-pdf';
    case 'excel':
      return 'bi-filetype-xlsx';
    case 'csv':
      return 'bi-filetype-csv';
    default:
      return 'bi-file-earmark-bar-graph';
  }
};

const getFormatColor = (format) => {
  switch (format) {
    case 'pdf':
      return 'bg-soft-danger text-danger';
    case 'excel':
      return 'bg-soft-success text-success';
    case 'csv':
      return 'bg-soft-primary text-primary';
    default:
      return 'bg-light text-secondary';
  }
};

const getFormatBadgeClass = (format) => {
  switch (format) {
    case 'pdf':
      return 'bg-danger text-white';
    case 'excel':
      return 'bg-success text-white';
    case 'csv':
      return 'bg-primary text-white';
    default:
      return 'bg-secondary text-white';
  }
};
</script>

<style scoped>
/* Boîtes d'icônes pour les indicateurs (KPI) et rapports */
.icon-box {
  width: 52px;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.report-icon-box {
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
}

/* Palettes douces (Soft styles) */
.bg-soft-primary {
  background-color: rgba(0, 123, 255, 0.1);
  color: #007bff;
}
.bg-soft-success {
  background-color: rgba(40, 167, 69, 0.1);
  color: #28a745;
}
.bg-soft-danger {
  background-color: rgba(220, 53, 69, 0.1);
  color: #dc3545;
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

/* Eléments structurels conformes à ton Flat Design */
.rounded-4 {
  border-radius: 0.2rem !important;
}
.form-select,
.form-label {
  font-size: 0.85rem;
}
.transition-all {
  transition: all 0.3s ease;
}
</style>
