<template>
  <div class="archive-finances-container">
    <!-- Header de la section -->
    <div class="col-12 mb-4">
      <h3 class="fw-bold mb-1">Archives Financières</h3>
      <p class="text-muted small mb-0">
        <i class="bi bi-archive-fill me-1"></i>
        Consultez les grands livres consolidés, les bilans de scolarité clos et les historiques d'encaissement des exercices passés.
      </p>
    </div>

    <!-- Sélecteur d'Exercice Fiscal / Académique -->
    <div class="card mb-4 border-0 shadow-sm bg-light rounded-4">
      <div class="card-body p-3">
        <div class="row g-3 align-items-center">
          <div class="col-md-4">
            <label class="form-label small fw-semibold text-muted mb-1">Choisir un exercice archivé</label>
            <select v-model="selectedExercice" @change="loadArchiveData" class="form-select border-0 shadow-sm">
              <option value="">Sélectionner une année...</option>
              <option v-for="annee in exercices" :key="annee" :value="annee">Exercice {{ annee }}</option>
            </select>
          </div>
          <div class="col-md-8 text-md-end pt-3" v-if="selectedExercice">
            <span class="badge bg-soft-secondary text-secondary border fw-bold p-2">
              <i class="bi bi-lock-fill me-1"></i> Cet exercice est définitivement scellé et non modifiable.
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Contenu des Archives (uniquement si une année est sélectionnée) -->
    <div class="row" v-if="selectedExercice">
      <!-- Cartes de synthèse de l'année sélectionnée -->
      <div class="col-md-4 mb-4">
        <div class="card border-0 shadow-sm rounded-4 bg-white p-3 mb-3">
          <span class="text-muted small fw-semibold text-uppercase d-block mb-1">Total Encaissé</span>
          <h4 class="fw-bold text-dark font-monospace mb-0">{{ formatCurrency(summary.total) }}</h4>
        </div>
      </div>
      <div class="col-md-4 mb-4">
        <div class="card border-0 shadow-sm rounded-4 bg-white p-3 mb-3">
          <span class="text-muted small fw-semibold text-uppercase d-block mb-1">Taux de Recouvrement</span>
          <h4 class="fw-bold text-success mb-0">{{ summary.tauxRecouvrement }} %</h4>
        </div>
      </div>
      <div class="col-md-4 mb-4">
        <div class="card border-0 shadow-sm rounded-4 bg-white p-3 mb-3">
          <span class="text-muted small fw-semibold text-uppercase d-block mb-1">Restes à Recouvrer (Pertes)</span>
          <h4 class="fw-bold text-danger font-monospace mb-0">{{ formatCurrency(summary.creances) }}</h4>
        </div>
      </div>

      <!-- Tableau des archives consolidées par classe de cette année-là -->
      <div class="col-12">
        <div class="card border-0 shadow-sm rounded-4 overflow-hidden bg-white">
          <div class="card-header bg-white border-0 pt-4 px-4 pb-2 d-flex justify-content-between align-items-center">
            <h5 class="fw-bold text-dark mb-0">
              <i class="bi bi-journal-check text-primary me-2"></i>Rapport de Clôture Annuel par Promotion
            </h5>
            <button @click="downloadGlobalReport" class="btn btn-outline-dark btn-xs border shadow-sm">
              <i class="bi bi-download me-1"></i> Télécharger le Grand Livre (PDF)
            </button>
          </div>

          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="table table-hover align-middle mb-0 text-center">
                <thead class="bg-light text-secondary small">
                  <tr>
                    <th class="ps-4 py-3 text-start">Classe / Promotion</th>
                    <th>Effectif</th>
                    <th>Total Attendu</th>
                    <th>Total Perçu</th>
                    <th>Reliquats Impayés</th>
                    <th class="text-end pe-4">Statut Comptable</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in archiveRecords" :key="item.classe">
                    <td class="ps-4 text-start fw-bold text-dark">{{ item.classe }}</td>
                    <td class="text-muted small">{{ item.effectif }} étudiants</td>
                    <td class="font-monospace fw-semibold text-secondary">{{ formatCurrency(item.attendu) }}</td>
                    <td class="font-monospace fw-bold text-success">{{ formatCurrency(item.percu) }}</td>
                    <td class="font-monospace text-danger">{{ formatCurrency(item.attendu - item.percu) }}</td>
                    <td class="text-end pe-4">
                      <span class="badge rounded-pill px-2 py-1 small" :class="item.attendu === item.percu ? 'bg-soft-success text-success' : 'bg-soft-warning text-warning'">
                        {{ item.attendu === item.percu ? 'Équilibré' : 'Solde Débiteur Clôturé' }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- État Hors Sélection -->
    <div class="col-12 py-5 text-center text-muted" v-else>
      <i class="bi bi-box-seam display-4 text-light d-block mb-3"></i>
      <h6 class="fw-bold">Aucun exercice ciblé</h6>
      <p class="small mb-0">Sélectionnez une année académique passée pour extraire son grand livre comptable scellé.</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const exercisces = ['2022-2023', '2023-2024', '2024-2025'];
const selectedExercice = ref('');

// Données de synthèse de l'archive
const summary = ref({ total: 0, tauxRecouvrement: 0, creances: 0 });
const archiveRecords = ref([]);

const loadArchiveData = () => {
  if (!selectedExercice.value) {
    archiveRecords.value = [];
    return;
  }

  // Simulation d'extraction de données figées en BDD pour l'année sélectionnée
  summary.value = {
    total: 142500000,
    tauxRecouvrement: 94.8,
    creances: 7800000
  };

  archiveRecords.value = [
    { classe: 'Licence 1 Informatique (Ex)', effectif: 60, attendu: 45000000, percu: 43200000 },
    { classe: 'Licence 2 Informatique (Ex)', effectif: 48, attendu: 36000000, percu: 36000000 },
    { classe: 'Master 1 Spécialisé (Ex)', effectif: 25, attendu: 37500000, percu: 34500000 },
    { classe: 'Master 2 Recherche (Ex)', effectif: 18, attendu: 31800000, percu: 31000000 }
  ];
};

const formatCurrency = (value) => {
  return new Intl.NumberFormat('fr-FR').format(value) + ' FCFA';
};

const downloadGlobalReport = () => {
  alert(`Extraction et téléchargement du Grand Livre Comptable certifié pour l'exercice [${selectedExercice.value}].`);
};
</script>

<style scoped>
.bg-soft-success { background-color: rgba(40, 167, 69, 0.12); }
.bg-soft-warning { background-color: rgba(255, 193, 7, 0.15); }
.bg-soft-secondary { background-color: rgba(108, 117, 125, 0.1); }

.table th {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: #6c757d;
  border: none;
}

.table tbody tr {
  border-bottom: 1px solid #f8f9fa;
}

.rounded-4 {
  border-radius: 0.2rem !important;
}
.form-select {
  font-size: 0.85rem;
}
.btn-xs {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
}
</style>
