<template>
  <div class="row">
    <!-- Header de la section -->
    <div class="col-12 mb-4">
      <h3 class="fw-bold mb-1">Rapports & Statistiques des Modules</h3>
      <p class="text-muted small mb-0">
        <i class="bi bi-pie-chart-fill me-1"></i>
        Analysez les taux de réussite, l'état d'avancement des maquettes pédagogiques et exportez les bilans.
      </p>
    </div>

    <!-- Filtres d'analyses ciblés -->
    <div class="col-12 mb-4">
      <div class="card border-0 shadow-sm bg-light rounded-4">
        <div class="card-body p-3">
          <div class="row g-3 align-items-end">
            <!-- Classe -->
            <div class="col-md-3">
              <label class="form-label small fw-semibold text-muted mb-1">Classe</label>
              <select class="form-select border-0 shadow-sm" v-model="filters.classe">
                <option value="Toutes">Toutes les classes</option>
                <option value="Master 1 Info">Master 1 Info</option>
                <option value="Master 2 Info">Master 2 Info</option>
                <option value="Licence 3 Management">Licence 3 Management</option>
              </select>
            </div>
            <!-- Module cible -->
            <div class="col-md-4">
              <label class="form-label small fw-semibold text-muted mb-1">Module Parent (UE)</label>
              <select class="form-select border-0 shadow-sm" v-model="filters.module">
                <option value="Tous">Tous les modules</option>
                <option value="UE-INF-1">UE-INF-1 : Génie Logiciel</option>
                <option value="UE-DATA-2">UE-DATA-2 : Data Science & IA</option>
              </select>
            </div>
            <!-- Type de calcul / Tri -->
            <div class="col-md-3">
              <label class="form-label small fw-semibold text-muted mb-1">Indicateur Principal</label>
              <select class="form-select border-0 shadow-sm" v-model="filters.metric">
                <option value="Moyenne">Moyenne Générale</option>
                <option value="Volume">Taux d'Exécution Horaire</option>
              </select>
            </div>
            <!-- Bouton Générer -->
            <div class="col-md-2">
              <button class="btn btn-primary w-100 shadow-sm border-0 py-2" @click="generateReport">
                <i class="bi bi-arrow-clockwise me-1"></i> Analyser
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Vue Macro : Performance des Unités d'Enseignement -->
    <div class="col-12">
      <div class="card border-0 shadow-sm rounded-4 overflow-hidden">
        <div class="card-header bg-white border-0 pt-4 px-4 pb-2 d-flex justify-content-between align-items-center">
          <h5 class="fw-bold text-dark mb-0">Synthèse de Performance Opérationnelle</h5>
          <button class="btn btn-light btn-sm border shadow-sm px-3 rounded" @click="exportAll">
            <i class="bi bi-file-earmark-pdf-fill text-danger me-1"></i> Exporter le PDF Global
          </button>
        </div>

        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead class="bg-light">
                <tr>
                  <th class="ps-4 py-3">Code & Module</th>
                  <th>Matières Clés</th>
                  <th class="text-center">Moyenne Section</th>
                  <th class="text-center">Taux de Validation</th>
                  <th class="text-center">Avancement Horaire</th>
                  <th class="text-end pe-4">Actions</th>
                </tr>
              </thead>

              <tbody>
                <tr v-for="report in mockModuleReports" :key="report.code" class="transition-all">
                  <!-- Code & Nom du module -->
                  <td class="ps-4">
                    <div class="fw-bold text-dark">{{ report.code }}</div>
                    <small class="text-muted">{{ report.nom }}</small>
                  </td>

                  <!-- Compte des matières incluses -->
                  <td>
                    <span class="badge bg-light text-dark border px-2 py-1">
                      {{ report.nbMatieres }} matières actives
                    </span>
                  </td>

                  <!-- Moyenne générale constatée sur le module -->
                  <td class="text-center fw-bold" :class="report.moyenne >= 10 ? 'text-success' : 'text-danger'">
                    {{ report.moyenne }} / 20
                  </td>

                  <!-- Taux de validation estimé des étudiants -->
                  <td class="text-center">
                    <span class="fw-semibold">{{ report.tauxReussite }}%</span>
                    <div class="progress mx-auto bg-light rounded-pill mt-1" style="width: 80px; height: 4px;">
                      <div class="progress-bar bg-success rounded-pill" :style="{ width: report.tauxReussite + '%' }"></div>
                    </div>
                  </td>

                  <!-- Avancement des heures -->
                  <td class="text-center">
                    <span class="badge bg-soft-primary text-primary fw-bold">{{ report.avancementHoraire }}% effectué</span>
                  </td>

                  <!-- Action d'extraction individuelle -->
                  <td class="text-end pe-4">
                    <button class="btn btn-light btn-sm border-0 shadow-sm rounded-pill px-3" @click="exportSingle(report.code)">
                      <i class="bi bi-download text-primary me-1"></i> Fiche UE
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
  classe: 'Toutes',
  module: 'Tous',
  metric: 'Moyenne'
});

// Mock data orienté performance des modules
const mockModuleReports = ref([
  { code: 'UE-INF-1', nom: 'Génie Logiciel & Outils de Dev', nbMatieres: 2, moyenne: 14.25, tauxReussite: 88, avancementHoraire: 91 },
  { code: 'UE-DATA-2', nom: 'Data Science & Intelligence Artificielle', nbMatieres: 2, moyenne: 11.80, tauxReussite: 74, avancementHoraire: 65 },
  { code: 'UE-MNG-1', nom: 'Management, Projet & RH', nbMatieres: 1, moyenne: 15.10, tauxReussite: 95, avancementHoraire: 0 }
]);

// Actions de simulation
const generateReport = () => {
  alert(`Recalcul des métriques pour le module : ${filters.value.module}`);
};

const exportAll = () => {
  alert('Génération du rapport d\'évaluation global des maquettes pédagogiques au format PDF...');
};

const exportSingle = (code) => {
  alert(`Téléchargement de la fiche de bilan pédagogique détaillée pour l'unité : ${code}`);
};
</script>

<style scoped>
/* Couleurs douces thématiques */
.bg-soft-primary { background-color: rgba(0, 123, 255, 0.1); color: #007bff; }

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

/* Style de ton ERP */
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
