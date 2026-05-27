<template>
  <div class="animate__animated animate__fadeIn">
    <!-- En-tête de page -->
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
      <!-- Zone Latérale Gauche : Upload de fichier par Lot -->
      <div class="col-12 col-lg-4">
        <div
          class="card border border-dashed rounded-4 p-4 text-center bg-light-subtle h-100 d-flex flex-column justify-content-center min-h-dropzone shadow-sm"
        >
          <input
            type="file"
            ref="fileInputRef"
            @change="handleFileChange"
            accept=".csv, .xlsx, .xls"
            class="d-none"
          />

          <!-- État initial : Zone de Drag & Drop ou Clic -->
          <div v-if="!selectedFile">
            <div class="mb-3 text-primary">
              <i class="bi bi-cloud-arrow-up display-4"></i>
            </div>
            <h6 class="fw-bold text-dark">Importer la liste des candidats</h6>
            <p class="text-muted small px-3">
              Glissez-deposez votre fichier ici, ou
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

          <!-- État Fichier sélectionné prêt à l'envoi -->
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
                :disabled="loading"
              >
                <span
                  v-if="loading"
                  class="spinner-border spinner-border-sm"
                  role="status"
                ></span>
                <i v-else class="bi bi-check-circle"></i>
                <span>{{ loading ? 'Traitement en cours...' : "Valider l'importation" }}</span>
              </button>
              <button
                class="btn btn-link btn-sm text-danger text-decoration-none"
                @click="cancelSelection"
                :disabled="loading"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Zone Latérale Droite : Statistiques et Tableau des Inscrits -->
      <div class="col-12 col-lg-8">
        <div class="row g-3">
          <div class="col-12 col-sm-6">
            <div class="card border shadow-sm rounded-3 p-3 bg-white">
              <div class="text-muted text-xs text-uppercase fw-semibold mb-1">
                Candidats Validés
              </div>
              <div class="d-flex align-items-center gap-2">
                <h3 class="fw-bold text-dark mb-0 font-monospace">{{ listCandidats.length }}</h3>
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
                <th style="width: 30%">Nom & Prénoms</th>
                <th style="width: 25%">Email</th>
                <th style="width: 20%">Téléphone</th>
                <th class="text-end pe-3" style="width: 10%">Actions</th>
              </tr>
            </thead>

            <tbody>
              <!-- État de chargement asynchrone du store -->
              <tr v-if="loading && listCandidats.length === 0">
                <td colspan="5" class="text-center py-5">
                  <div class="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
                  <span class="text-muted text-xs">Synchronisation des candidats...</span>
                </td>
              </tr>

              <!-- Liste des lignes candidats -->
              <tr v-for="(candidat, index) in listCandidats" :key="candidat.id || index">
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
                  <!-- L'API ne possédant pas de suppression individuelle d'un candidat, action locale/informationnelle -->
                  <button
                    class="btn btn-sm btn-link text-danger p-1 shadow-none"
                    @click="deleteCandidat(candidat, index)"
                    title="Retirer ce candidat"
                  >
                    <i class="bi bi-person-x"></i>
                  </button>
                </td>
              </tr>

              <!-- Liste vide -->
              <tr v-if="listCandidats.length === 0 && !loading">
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
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useCandidatStore } from '@/stores/gestionStores/candidatStore'; // Adaptez le chemin si besoin
import { useNotifier } from '@/stores/messages/useNotifier';

const route = useRoute();
const candidatStore = useCandidatStore();
const { notifySuccess, notifyError } = useNotifier();

/* Récupération réactive de l'ID du concours depuis l'URL */
const concoursId = computed(() => route.params.id);
/* State local & Liaisons Store */
const fileInputRef = ref(null);
const selectedFile = ref(null);
const dernierImportDate = ref('');

// Lecture directe de la liste des candidats et du spinner depuis l'état global Pinia
const listCandidats = computed(() => candidatStore.candidats || []);
const loading = computed(() => candidatStore.loading);

/* Cycles de vie et surveillance */
onMounted(async () => {
  await fetchCandidatsConcours();
});

// En cas de changement de concours à chaud dans l'URL
watch(
  () => route.params.id,
  async (newId) => {
    if (newId) {
      cancelSelection();
      await fetchCandidatsConcours();
    }
  }
);

/* Appel API : Récupération des inscrits */
const fetchCandidatsConcours = async () => {
  try {
    if (concoursId.value) {
      await candidatStore.fetchCandidatsByConcours(concoursId.value);
    }
  } catch (err) {
    console.error('Erreur lors de la récupération des candidats:', err);
  }
};

/* Gestion de la sélection du fichier */
const triggerFileSelect = () => {
  if (fileInputRef.value) {
    fileInputRef.value.click();
  }
};

const handleFileChange = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  // Validation restrictive de la taille (5 Mo max)
  if (file.size > 5 * 1024 * 1024) {
    notifyError('Le fichier est trop lourd. Limite fixée à 5 Mo.');
    return;
  }
  selectedFile.value = file;
};

const cancelSelection = () => {
  selectedFile.value = null;
  if (fileInputRef.value) {
    fileInputRef.value.value = '';
  }
};

/* Traitement de l'import par lot */
const uploadFile = async () => {
  if (!selectedFile.value) return;

  // Encapsulation en objet FormData conforme pour l'envoi de fichiers vers le backend
  const formData = new FormData();
  formData.append('concours_id', concoursId.value); // L'id est bien là !
  formData.append('file', selectedFile.value);


  try {
    // Appel de l'action du store : importCandidatsFile
    await candidatStore.importCandidatsFile(formData);

    // Si l'appel réussit, on rafraîchit la table et l'état de l'interface
    cancelSelection();
    await fetchCandidatsConcours();
    
    dernierImportDate.value = new Date().toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (err) {
    console.error("Échec lors de l'upload du lot de candidats:", err);
  }
};

/* Retrait d'un candidat de la liste (Visuel / Local) */
const deleteCandidat = async (candidat, index) => {
  const nomComplet = `${candidat.nom} ${candidat.prenom}`;
  if (confirm(`Voulez-vous retirer le candidat "${nomComplet}" de la liste d'inscription ?`)) {
    // Note: Votre store ne possède pas d'action deleteCandidat explicite pour le moment.
    // Nous effectuons donc une modification visuelle locale par sécurité.
    listCandidats.value.splice(index, 1);
    notifySuccess('Candidat masqué de la liste locale.');
  }
};

const downloadTemplate = () => {
  console.log('Téléchargement du modèle structurel au format Excel (.xlsx)');
  // Logique optionnelle d'ouverture de fichier de structure
};
</script>

<style scoped>
.min-h-dropzone {
  min-height: 220px;
}
.border-dashed {
  border-style: dashed !important;
}
.bg-light-subtle {
  background-color: #fdfdfd;
}
.text-xs {
  font-size: 11px !important;
}
.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;  
  overflow: hidden;
}
</style>

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
