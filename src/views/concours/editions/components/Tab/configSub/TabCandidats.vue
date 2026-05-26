<template>
  <div class="animate__animated animate__fadeIn">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h5 class="fw-bold mb-1 text-dark">Registre des Candidatures</h5>
        <p class="text-muted small mb-0">
          Gérez la liste des postulants inscrits. L'intégration s'effectue par importation de
          fichiers standardisés.
        </p>
      </div>

      <div class="d-flex gap-2">
        <button
          class="btn btn-sm btn-light border text-secondary"
          @click="downloadTemplate"
          title="Télécharger le modèle Excel de base"
        >
          <i class="bi bi-file-earmark-arrow-down me-1"></i> Télécharger le modèle (.xlsx)
        </button>
      </div>
    </div>

    <div class="row g-4">
      <div class="col-12 col-lg-4">
        <div
          class="card border border-dashed rounded-4 p-4 text-center bg-light-subtle h-100 d-flex flex-column justify-content-center min-h-dropzone"
        >
          <input
            type="file"
            ref="fileInputRef"
            @change="handleFileChange"
            accept=".csv, .xlsx, .xls"
            class="d-none"
          />

          <div v-if="!selectedFile">
            <div class="mb-3 text-primary">
              <i class="bi bi-cloud-arrow-up display-4"></i>
            </div>
            <h6 class="fw-bold text-dark">Importer la liste des candidats</h6>
            <p class="text-muted small px-3">
              Glissez-déposez votre fichier ici, ou
              <a
                href="#"
                @click.prevent="triggerFileSelect"
                class="text-decoration-none fw-semibold"
                >parcourez vos fichiers</a
              >.
            </p>
            <div class="text-xs text-muted mt-2 font-monospace">
              Formats acceptés : CSV, XLSX (Max 5Mo)
            </div>
          </div>

          <div v-else class="animate__animated animate__fadeIn">
            <div class="mb-3 text-success">
              <i class="bi bi-file-earmark-check display-4"></i>
            </div>
            <h6 class="fw-bold text-dark text-truncate px-2">{{ selectedFile.name }}</h6>
            <p class="text-muted small font-monospace mb-3">
              {{ (selectedFile.size / 1024).toFixed(1) }} KB
            </p>

            <div class="d-grid gap-2 px-3">
              <button
                class="btn btn-success btn-sm d-flex align-items-center justify-content-center gap-2"
                @click="uploadFile"
                :disabled="isUploading"
              >
                <span
                  v-if="isUploading"
                  class="spinner-border spinner-border-sm"
                  role="status"
                ></span>
                <i v-else class="bi bi-check-circle"></i>
                <span>{{ isUploading ? 'Traitement...' : "Valider l'importation" }}</span>
              </button>
              <button
                class="btn btn-link btn-sm text-danger text-decoration-none"
                @click="cancelSelection"
                :disabled="isUploading"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="col-12 col-lg-8">
        <div class="row g-3">
          <div class="col-12 col-sm-6">
            <div class="card border shadow-sm rounded-3 p-3 bg-white">
              <div class="text-muted text-xs text-uppercase fw-semibold mb-1">
                Candidats Validés
              </div>
              <div class="d-flex align-items-center gap-2">
                <h3 class="fw-bold text-dark mb-0 font-monospace">{{ candidats.length }}</h3>
                <span class="badge bg-success-subtle text-success text-xs rounded-pill"
                  >Inscrits</span
                >
              </div>
            </div>
          </div>
          <div class="col-12 col-sm-6">
            <div class="card border shadow-sm rounded-3 p-3 bg-white">
              <div class="text-muted text-xs text-uppercase fw-semibold mb-1">Dernier Import</div>
              <div class="d-flex align-items-center gap-2">
                <h6 class="fw-semibold text-secondary mb-0 line-clamp-1">
                  {{ dernierImportDate || 'Aucun import récent' }}
                </h6>
              </div>
            </div>
          </div>
        </div>

        <div class="table-responsive border rounded-3 shadow-sm bg-white mt-3">
          <table class="table table-hover align-middle mb-0 text-sm">
            <thead class="table-light text-uppercase font-monospace text-xs">
              <tr>
                <th class="ps-3" style="width: 15%">N° Table</th>
                <th style="width: 25%">Nom & Prénoms</th>
                <th style="width: 25%">Email</th>
                <th style="width: 20%">Téléphone</th>
                <th class="text-end pe-3" style="width: 15%">Actions</th>
              </tr>
            </thead>

            <tbody>
              <tr v-for="(candidat, index) in candidats" :key="index">
                <td class="ps-3 font-monospace fw-bold text-primary">
                  {{ candidat.num_table || `N°${1000 + index}` }}
                </td>
                <td>
                  <div class="fw-semibold text-dark">{{ candidat.nom }} {{ candidat.prenom }}</div>
                  <small class="text-muted text-xs font-monospace"
                    >Sexe : {{ candidat.sexe || 'M' }}</small
                  >
                </td>
                <td class="text-muted font-monospace text-xs">{{ candidat.email || '—' }}</td>
                <td class="font-monospace text-xs">{{ candidat.telephone || '—' }}</td>
                <td class="text-end pe-3">
                  <button
                    class="btn btn-sm btn-link text-danger p-1"
                    @click="deleteCandidat(candidat.id, index)"
                    title="Retirer ce candidat"
                  >
                    <i class="bi bi-person-x"></i>
                  </button>
                </td>
              </tr>

              <tr v-if="candidats.length === 0">
                <td colspan="5" class="text-center text-muted py-5">
                  <i class="bi bi-people text-muted display-6 d-block mb-2"></i>
                  Aucun candidat sur la liste pour le moment. Intégrez votre fichier CSV ou Excel
                  pour commencer.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useNotifier } from '@/stores/messages/useNotifier';
import { extractErrorMessage } from '@/stores/messages/useErrorMessage';

// Props reçues depuis le parent global contenant le concours sélectionné
const props = defineProps({
  concours: { type: Object, default: () => ({}) },
});

const route = useRoute();
const concoursId = Number(route.params.id);
const { notifySuccess, notifyError } = useNotifier();

const fileInputRef = ref(null);
const selectedFile = ref(null);
const isUploading = ref(false);
const candidats = ref([]);
const dernierImportDate = ref('');

onMounted(() => {
  fetchCandidatsConcours();
});

// Récupération des candidats via le Store ou une API locale
const fetchCandidatsConcours = async () => {
  try {
    // Remplacer par l'appel réel de ton store :
    // await concourStore.fetchCandidats(concoursId)
    // candidats.value = concourStore.candidatsList
    candidats.value = []; // Valeur par défaut
  } catch (err) {
    notifyError('Erreur lors de la récupération des candidats.');
  }
};

const triggerFileSelect = () => {
  fileInputRef.value.click();
};

const handleFileChange = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  // Validation basique de la taille (ex: 5Mo)
  if (file.size > 5 * 1024 * 1024) {
    notifyError('Le fichier est trop lourd. Limite fixée à 5 Mo.');
    return;
  }
  selectedFile.value = file;
};

const cancelSelection = () => {
  selectedFile.value = null;
  fileInputRef.value.value = '';
};

const uploadFile = async () => {
  if (!selectedFile.value) return;

  isUploading.value = true;

  // Préparation du FormData pour l'envoi API du fichier brut
  const formData = new FormData();
  formData.append('file', selectedFile.value);
  formData.append('concours_id', concoursId);

  try {
    // Insérer ici l'appel vers ton store dédié aux téléversements, ex :
    // await concourStore.importCandidatsExcel(formData)

    notifySuccess('Fichier traité et liste des candidats mise à jour avec succès.');
    cancelSelection();
    await fetchCandidatsConcours();
    dernierImportDate.value = new Date().toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (err) {
    notifyError(
      extractErrorMessage(err, 'Le format du fichier ou la structure des colonnes est incorrect.')
    );
  } finally {
    isUploading.value = false;
  }
};

const deleteCandidat = async (id, index) => {
  if (confirm("Voulez-vous retirer ce candidat de la liste d'inscription ?")) {
    try {
      candidats.value.splice(index, 1);
      notifySuccess('Candidat retiré.');
    } catch (err) {
      notifyError('Erreur lors du retrait.');
    }
  }
};

const downloadTemplate = () => {
  console.log('Téléchargement du modèle de structure xlsx');
  // Logique de téléchargement d'un fichier statique
};
</script>

<style scoped>
.text-xs {
  font-size: 0.75rem;
}
.text-sm {
  font-size: 0.875rem;
}

.min-h-dropzone {
  min-height: 260px;
}

.border-dashed {
  border-style: dashed !important;
  border-width: 2px !important;
  border-color: #cbd5e1 !important;
}

.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.btn-link:hover {
  text-decoration: underline !important;
}
</style>
