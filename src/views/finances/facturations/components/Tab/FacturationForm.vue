<template>
  <div class="honoraires-container">
    <!-- Header de la section -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h3 class="fw-bold mb-1">États Honoraires des Formateurs</h3>
        <p class="text-muted small mb-0">
          <i class="bi bi-person-badge me-1"></i>
          Suivi des vacations, taux horaires et émoluments des corps enseignants par période.
        </p>
      </div>
      
      <!-- Outils de filtrage de période & d'import -->
      <div class="d-flex gap-2">
        <div class="btn-group shadow-sm" role="group">
          <input type="radio" v-model="viewType" value="mois" class="btn-check" id="v-mois" checked />
          <label class="btn btn-sm btn-white border px-3" for="v-mois">Mensuel</label>

          <input type="radio" v-model="viewType" value="trimestre" class="btn-check" id="v-trim" />
          <label class="btn btn-sm btn-white border border-start-0 border-end-0 px-3" for="v-trim">Trimestriel</label>

          <input type="radio" v-model="viewType" value="annuel" class="btn-check" id="v-ann" />
          <label class="btn btn-sm btn-white border px-3" for="v-ann">Annuel</label>
        </div>

        <button class="btn btn-primary btn-sm border-0 shadow-sm" data-bs-toggle="modal" data-bs-target="#importFormateurModal">
          <i class="bi bi-upload me-1"></i> Charger Liste (CSV/Excel)
        </button>
      </div>
    </div>

    <!-- Section KPI Flash -->
    <div class="row mb-4 g-3">
      <div class="col-md-6">
        <div class="card bg-white border-0 shadow-sm p-3 border-start border-primary border-3 rounded-4">
          <span class="text-muted small fw-semibold text-uppercase d-block mb-1">Total Honoraires ({{ viewLabel }})</span>
          <h4 class="fw-bold text-primary font-monospace mb-0">{{ formatPrice(totalHonoraires) }}</h4>
        </div>
      </div>
      <div class="col-md-6">
        <div class="card bg-white border-0 shadow-sm p-3 border-start border-secondary border-3 rounded-4">
          <span class="text-muted small fw-semibold text-uppercase d-block mb-1">Nombre de Formateurs Actifs</span>
          <h4 class="fw-bold text-dark mb-0">{{ honoraires.length }} vacataires</h4>
        </div>
      </div>
    </div>

    <!-- Registre des Vacations -->
    <div class="card shadow-sm border-0 rounded-4 overflow-hidden bg-white">
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0 text-center">
            <thead class="bg-light text-secondary small">
              <tr>
                <th class="ps-4 py-3 text-start">Formateur</th>
                <th class="text-start">Matières / Modules</th>
                <th>Volume Horaire</th>
                <th>Taux Horaire</th>
                <th>Total Brut</th>
                <th class="text-end pe-4">Détails</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in honoraires" :key="item.id">
                <td class="ps-4 text-start">
                  <div class="fw-bold text-dark">{{ item.nom }} {{ item.prenom }}</div>
                  <small class="text-muted font-monospace text-xs">{{ item.matricule }}</small>
                </td>
                <td class="text-start text-secondary fw-semibold small">{{ item.modules }}</td>
                <td>
                  <span class="badge bg-light text-dark border">{{ item.heures }} h</span>
                </td>
                <td class="font-monospace text-muted">{{ formatPrice(item.taux) }}</td>
                <td class="fw-bold text-success font-monospace">{{ formatPrice(item.heures * item.taux) }}</td>
                <td class="text-end pe-4">
                  <button class="btn btn-sm btn-white border shadow-sm text-secondary px-3" @click="viewFiche(item)">
                    <i class="bi bi-file-earmark-text me-1"></i> Fiche
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modal d'importation standardisé -->
    <div class="modal fade" id="importFormateurModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 shadow rounded-4">
          <div class="modal-header border-0 pt-4 px-4 pb-2">
            <h5 class="modal-title fw-bold text-dark">Importer la liste des vacations</h5>
            <button type="button" class="btn-close shadow-none" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body px-4 text-center">
            <div class="upload-zone p-5 border-dashed rounded mb-3 bg-light position-relative">
              <i class="bi bi-file-earmark-spreadsheet text-success display-4 d-block mb-2"></i>
              <p class="small text-secondary mb-3">Glissez votre fichier ici ou cliquez pour parcourir</p>
              <input type="file" @change="handleFileChange" class="form-control form-control-sm border-0 shadow-sm" accept=".xlsx, .csv" />
            </div>
            <div class="text-start p-3 bg-light rounded text-xs">
              <span class="fw-bold text-dark uppercase d-block mb-1"><i class="bi bi-info-circle text-primary me-1"></i> Format requis :</span>
              <code class="text-dark font-monospace">matricule, nom, prenom, heures_faites, taux_horaire, mois</code>
            </div>
          </div>
          <div class="modal-footer border-0 pb-4 px-4 pt-2">
            <button type="button" class="btn btn-sm btn-light border px-3" data-bs-dismiss="modal">Annuler</button>
            <button type="button" class="btn btn-sm btn-primary border-0 px-3 shadow-sm" @click="processImport">
              Lancer l'importation
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const viewType = ref('mois');
const honoraires = ref([
  {
    id: 1,
    matricule: 'PRF-001',
    nom: 'BA',
    prenom: 'Abdoulaye',
    modules: 'Maths, Algorithmique',
    heures: 45,
    taux: 15000,
  },
  {
    id: 2,
    matricule: 'PRF-042',
    nom: 'FALL',
    prenom: 'Moussa',
    modules: 'Base de données',
    heures: 30,
    taux: 12000,
  },
  {
    id: 3,
    matricule: 'PRF-009',
    nom: 'NDIAYE',
    prenom: 'Astou',
    modules: 'Comptabilité Générale',
    heures: 20,
    taux: 10000,
  },
]);

const viewLabel = computed(() => {
  if (viewType.value === 'mois') return 'Ce mois-ci';
  if (viewType.value === 'trimestre') return 'Ce trimestre';
  return 'Cette année';
});

const totalHonoraires = computed(() => {
  return honoraires.value.reduce((acc, curr) => acc + curr.heures * curr.taux, 0);
});

const formatPrice = (val) => new Intl.NumberFormat('fr-FR').format(val) + ' FCFA';

const handleFileChange = (e) => {
  if (e.target.files.length > 0) {
    console.log('Fichier prêt :', e.target.files[0].name);
  }
};

const processImport = () => {
  alert('Analyse du fichier et mise à jour des états honoraires terminée !');
};

const viewFiche = (item) => {
  alert(`Génération et ouverture du relevé d'heures certifié pour : ${item.prenom} ${item.nom}`);
};
</script>

<style scoped>
.text-xs { font-size: 11px !important; }

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

.btn-white {
  background-color: #ffffff;
  color: #6c757d;
}
.btn-white:hover {
  background-color: #f8f9fa;
  color: #212529;
}

/* Style de la zone d'upload */
.border-dashed {
  border: 2px dashed #dee2e6 !important;
}

/* Liaison stricte boutons radios masqués au design épuré */
.btn-check:checked + .btn-white {
  background-color: #007bff !important;
  border-color: #007bff !important;
  color: #ffffff !important;
}

/* Ligne graphique stricte de l'ERP */
.rounded-4 {
  border-radius: 0.2rem !important;
}
</style>