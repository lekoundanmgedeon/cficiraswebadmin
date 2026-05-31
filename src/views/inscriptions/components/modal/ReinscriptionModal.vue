<template>
  <div class="modal fade" id="importReinscriptionsModal" data-bs-backdrop="static" tabindex="-1">
    <div class="modal-dialog modal-lg modal-dialog-scrollable">
      <div class="modal-content shadow-lg border-0">
        
        <div class="modal-header bg-dark text-white py-3">
          <h5 class="modal-title d-flex align-items-center fs-6 fw-bold">
            <i class="bi bi-arrow-repeat text-info fs-5 me-2"></i>
            Réinscrire des étudiants par lot
          </h5>
          <button 
            type="button" 
            class="btn-close btn-close-white" 
            data-bs-dismiss="modal" 
            :disabled="inscriptionStore.loading"
          ></button>
        </div>

        <div class="modal-body position-relative p-4">
          
          <div v-if="inscriptionStore.loading" class="position-absolute top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center bg-white bg-opacity-75" style="z-index: 10;">
            <div class="spinner-border text-info mb-2" style="width: 2.5rem; height: 2.5rem;" role="status"></div>
            <h6 class="fw-bold text-dark small mb-1">Traitement des réinscriptions en cours...</h6>
            <p class="text-muted" style="font-size: 0.75rem;">Veuillez patienter pendant la mise à jour des parcours administratifs.</p>
          </div>

          <div v-if="!importReport">
            
            <div class="row g-3 align-items-center mb-3 bg-light p-3 rounded border">
              <div class="col-md-6">
                <label class="form-label fw-bold text-secondary style-label mb-1">Nouvelle Année Académique *</label>
                <div class="input-group input-group-sm">
                  <span class="input-group-text bg-white border-end-0"><i class="bi bi-calendar3 text-muted"></i></span>
                  <input 
                    v-model="codeAnnee" 
                    type="text" 
                    class="form-control border-start-0" 
                    placeholder="Ex: 2026-2027"
                  />
                </div>
              </div>
              <div class="col-md-6" v-if="props.classe">
                <label class="form-label fw-bold text-secondary style-label mb-1">Classe de destination</label>
                <div class="form-control form-control-sm bg-white-50 text-muted text-truncate">
                  <i class="bi bi-tags me-2"></i>{{ props.classe?.classe_nom || props.classe?.classe_code }}
                </div>
              </div>
            </div>

            <div
              class="dropzone border border-2 border-dashed rounded p-4 text-center position-relative transition-all"
              :class="{ 'border-info bg-info bg-opacity-10': isDragging, 'bg-light': !isDragging && !selectedFile, 'bg-success bg-opacity-10 border-success': selectedFile }"
              @dragover.prevent="isDragging = true"
              @dragleave.prevent="isDragging = false"
              @drop.prevent="handleDrop"
              @click="$refs.fileInput.click()"
              style="cursor: pointer;"
            >
              <input
                ref="fileInput"
                type="file"
                class="d-none"
                accept=".xlsx,.xls,.csv"
                @change="handleFileUpload"
              />

              <div v-if="!selectedFile">
                <i class="bi bi-cloud-arrow-up-fill fs-2 text-info animate-bounce"></i>
                <p class="fw-bold mt-2 mb-1 small">Glissez-déposez le fichier de réinscription ici</p>
                <span class="text-muted" style="font-size: 0.75rem;">ou cliquez pour parcourir vos documents</span>
              </div>
              <div v-else>
                <i class="bi bi-file-earmark-check-fill fs-2 text-success"></i>
                <p class="fw-bold text-success mt-2 mb-1 small">Liste de réinscription prête</p>
                <span class="badge bg-success px-2 py-1" style="font-size: 0.75rem;">{{ selectedFile.name }}</span>
              </div>
            </div>

            <div v-if="hasErrors" class="alert alert-danger d-flex align-items-center mt-3 py-2 px-3 small shadow-sm">
              <i class="bi bi-exclamation-octagon-fill fs-6 me-2"></i>
              <div>Des incohérences de format ont été détectées. Veuillez corriger le fichier avant l'envoi.</div>
            </div>

            <div v-if="previewData.length" class="mt-4 animate-fade-in">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <h6 class="fw-bold text-dark mb-0 style-title">
                  <i class="bi bi-eye-fill me-1 text-muted"></i> Aperçu des réinscriptions <small class="text-muted fw-normal">(5 lignes max)</small>
                </h6>
                <span class="badge bg-dark" style="font-size: 0.7rem;">Total fichier : {{ previewData.length }} ligne(s)</span>
              </div>
              <div class="table-responsive border rounded shadow-sm">
                <table class="table table-sm table-hover align-middle mb-0" style="font-size: 0.8rem;">
                  <thead class="table-light text-uppercase font-monospace" style="font-size: 0.7rem;">
                    <tr>
                      <th class="ps-3">Matricule Étudiant</th>
                      <th>Filière Cible</th>
                      <th>Classe Cible</th>
                      <th class="text-end pe-3">Vérification</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="(row, index) in previewData.slice(0, 5)"
                      :key="index"
                      :class="{ 'table-danger bg-opacity-25': row._errors?.length }"
                    >
                      <td class="ps-3 fw-bold text-dark font-monospace">
                        {{ row.matricule?.toUpperCase().trim() }}
                      </td>
                      <td>
                        <span class="badge bg-blue-subtle text-blue border border-blue-subtle">{{ row.code_filiere || '-' }}</span>
                      </td>
                      <td>
                        <span class="badge bg-secondary-subtle text-secondary border border-secondary-subtle">{{ row.code_classe || '-' }}</span>
                      </td>
                      <td class="text-end pe-3">
                        <span v-if="!row._errors?.length" class="badge bg-success-subtle text-success border border-success-subtle">
                          <i class="bi bi-check-circle me-1"></i>Prêt
                        </span>
                        <div v-else>
                          <span class="badge bg-danger-subtle text-danger border border-danger-subtle mb-1">Erreur</span>
                          <div class="text-danger font-monospace text-start p-1 bg-white rounded border small-box shadow-sm" style="font-size: 0.65rem; max-width: 180px;">
                            <div v-for="(e, i) in row._errors" :key="i">• {{ e }}</div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div v-else class="animate-fade-in py-2">
            <div class="text-center mb-3">
              <div class="fs-2"><i class="bi bi-check-all text-success"></i></div>
              <h5 class="fw-bold mt-1 mb-0">Bilan des réinscriptions</h5>
              <p class="text-muted small">Mise à jour des cursus terminée.</p>
            </div>

            <div class="row g-2 mb-3">
              <div class="col-4">
                <div class="card bg-light border text-center p-2">
                  <div class="fw-bold text-dark fs-5">{{ importReport.summary?.totalTraite }}</div>
                  <div class="text-muted style-label fw-semibold">Traités</div>
                </div>
              </div>
              <div class="col-4">
                <div class="card bg-success-subtle border-success border text-center p-2">
                  <div class="fw-bold text-success fs-5">{{ importReport.summary?.totalSucces }}</div>
                  <div class="text-success style-label fw-semibold">Réinscrits</div>
                </div>
              </div>
              <div class="col-4">
                <div class="card bg-danger-subtle border-danger border text-center p-2">
                  <div class="fw-bold text-danger fs-5">{{ importReport.summary?.totalEchecs }}</div>
                  <div class="text-danger style-label fw-semibold">Rejetés</div>
                </div>
              </div>
            </div>

            <div v-if="importReport.details?.echecs?.length" class="border rounded p-3 bg-white shadow-sm">
              <h6 class="fw-bold text-danger mb-2 d-flex align-items-center style-title">
                <i class="bi bi-exclamation-circle-fill me-2"></i>
                Détails des échecs de réinscription
              </h6>
              <div class="table-responsive" style="max-height: 200px;">
                <table class="table table-sm table-striped border align-middle mb-0" style="font-size: 0.75rem;">
                  <thead class="table-danger sticky-top">
                    <tr>
                      <th class="ps-2">Ligne</th>
                      <th>Identifiant / Matricule</th>
                      <th>Motif du rejet de réinscription</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(err, idx) in importReport.details.echecs" :key="idx">
                      <td class="fw-bold text-center ps-2">N° {{ err.ligne }}</td>
                      <td class="fw-semibold text-nowrap font-monospace">{{ err.etudiant || err.matricule }}</td>
                      <td class="text-danger font-monospace">{{ err.erreur }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </div>

        <div class="modal-footer bg-light py-2">
          <template v-if="!importReport">
            <button class="btn btn-outline-secondary btn-xs me-auto" @click="downloadTemplate" :disabled="inscriptionStore.loading">
              <i class="bi bi-download me-1"></i> Modèle Excel
            </button>
            <button class="btn btn-sm btn-light border" data-bs-dismiss="modal" :disabled="inscriptionStore.loading">Annuler</button>
            <button
              class="btn btn-sm btn-info text-white px-3"
              :disabled="!selectedFile || hasErrors || !codeAnnee || inscriptionStore.loading"
              @click="confirmReinscription"
            >
              Lancer la réinscription
            </button>
          </template>

          <template v-else>
            <button class="btn btn-sm btn-outline-info me-auto" @click="resetModal">
              <i class="bi bi-arrow-counterclockwise me-1"></i> Autre fichier
            </button>
            <button class="btn btn-sm btn-dark px-3" data-bs-dismiss="modal">Fermer</button>
          </template>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import * as XLSX from 'xlsx';
import { ref, computed } from 'vue';
import { useInscriptionStore } from '@/stores/academiqueStore/inscriptionStore';

const inscriptionStore = useInscriptionStore();

const previewData = ref([]);
const selectedFile = ref(null);
const codeAnnee = ref('2026-2027'); // Année suivante par défaut
const isDragging = ref(false);
const importReport = ref(null);

const props = defineProps({
  classe: Object,
});

// VALIDATION CLIENT ADAPTÉE (Contrat réduit à 3 colonnes de base)
const validateRows = (rows) => {
  return rows.map((row) => {
    const errors = [];
    if (!row.matricule?.toString().trim()) errors.push('Matricule absent');
    if (!row.code_filiere?.toString().trim()) errors.push('Code filière absent');
    if (!row.code_classe?.toString().trim()) errors.push('Code classe absent');
    return { ...row, _errors: errors };
  });
};

const hasErrors = computed(() => previewData.value.some((r) => r._errors?.length));

const processFile = (file) => {
  if (!file) return;
  selectedFile.value = file;

  const reader = new FileReader();
  reader.onload = (e) => {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    previewData.value = validateRows(json);
  };
  reader.readAsArrayBuffer(file);
};

const handleFileUpload = (e) => processFile(e.target.files[0]);
const handleDrop = (e) => {
  isDragging.value = false;
  processFile(e.dataTransfer.files[0]);
};

const confirmReinscription = async () => {
  if (hasErrors.value || !selectedFile.value || !codeAnnee.value) return;

  const formData = new FormData();
  formData.append('fichier', selectedFile.value);
  formData.append('code_annee', codeAnnee.value.trim());

  try {
    // Appel du store (adaptez le nom de la méthode selon votre store Pinia)
    const report = await inscriptionStore.bulkImportReinscriptions(formData);
    importReport.value = report; 
  } catch (error) {
    if (error.response?.data?.data) {
      importReport.value = {
        summary: { totalTraite: previewData.value.length, totalSucces: 0, totalEchecs: previewData.value.length },
        details: { echecs: error.response.data.data, succes: [] }
      };
    }
  }
};

const resetModal = () => {
  selectedFile.value = null;
  previewData.value = [];
  importReport.value = null;
};

const downloadTemplate = () => {
  const targetClasse = props.classe?.classe_code || 'GI-L3';
  const targetFiliere = targetClasse.split('-')[0] || 'GI';

  // Structure ultra légère pour la réinscription
  const headers = ['matricule', 'code_filiere', 'code_classe'];
  const exempleRow = ['ETU-2025-0001', targetFiliere, targetClasse];

  const ws = XLSX.utils.aoa_to_sheet([headers, exempleRow]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Réinscriptions');
  XLSX.writeFile(wb, `Template_Reinscription_${targetClasse}.xlsx`);
};
</script>

<style scoped>
.transition-all { transition: all 0.25s ease-in-out; }
.dropzone:hover {
  border-color: #0dcaf0 !important;
  background-color: rgba(13, 202, 240, 0.01);
}
.small-box {
  max-height: 80px;
  overflow-y: auto;
}
.bg-blue-subtle { background-color: #e7f1ff; }
.text-blue { color: #0d6efd; }
.style-label { font-size: 0.75rem; }
.style-title { font-size: 0.9rem; }
.btn-xs { padding: 0.25rem 0.4rem; font-size: 0.75rem; border-radius: 0.2rem; }
.animate-bounce {
  animation: bounce 2s infinite;
}
@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}
</style>