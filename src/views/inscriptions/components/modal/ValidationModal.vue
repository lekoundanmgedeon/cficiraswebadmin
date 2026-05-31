<template>
  <teleport to="body">
    <transition name="modal-fade">
      <div
        v-if="modelValue"
        class="modal fade show d-block"
        tabindex="-1"
        role="dialog"
        aria-modal="true"
        style="background-color: rgba(15, 23, 42, 0.45); backdrop-filter: blur(4px)"
        @click.self="proposerFermeture"
      >
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
            <div class="modal-header bg-primary text-white border-0 px-4 py-3">
              <h5 class="modal-title fw-bold d-flex align-items-center gap-2">
                <i class="mdi mdi-file-excel-outline fs-4"></i>
                Validation Inscriptions par Lots
              </h5>
              <button
                type="button"
                class="btn-close btn-close-white shadow-none"
                @click="proposerFermeture"
                :disabled="uploading"
              ></button>
            </div>

            <div class="modal-body p-4">
              <p class="text-muted small mb-3">
                Téléversez un fichier au format <b>Excel (.xlsx, .xls)</b> ou <b>CSV</b> contenant
                la liste des étudiants à valider ou réinscrire massivement pour l'année académique
                courante.
              </p>

              <div
                class="dropzone border border-2 border-dashed rounded-3 p-4 text-center position-relative transition-all"
                :class="{
                  'border-primary bg-light': !selectedFile && !isDragging,
                  'border-success bg-soft-success': isDragging,
                  'border-success bg-light': selectedFile,
                }"
                @dragover.prevent="isDragging = true"
                @dragleave.prevent="isDragging = false"
                @drop.prevent="handleDrop"
              >
                <input
                  type="file"
                  class="position-absolute top-0 start-0 w-100 h-100 opacity-0 custom-pointer"
                  accept=".xlsx, .xls, .csv"
                  @change="handleFileChange"
                  :disabled="uploading"
                  style="cursor: pointer; z-index: 2"
                />

                <div v-if="!selectedFile" style="z-index: 1">
                  <i class="mdi mdi-cloud-upload text-primary display-4 d-block mb-2"></i>
                  <span class="fw-semibold text-dark d-block"
                    >Glissez votre fichier ici ou cliquez</span
                  >
                  <small class="text-muted">Extensions acceptées : XLS, XLSX, CSV (Max: 5Mo)</small>
                </div>

                <div v-else style="z-index: 1">
                  <i class="mdi mdi-file-excel text-success display-4 d-block mb-2"></i>
                  <span class="fw-bold text-dark d-block text-truncate px-3">
                    {{ selectedFile.name }}
                  </span>
                  <small class="text-muted d-block mt-1">
                    Taille : {{ (selectedFile.size / 1024).toFixed(2) }} Ko
                  </small>
                  <button
                    type="button"
                    class="btn btn-link btn-sm text-danger mt-2 position-relative"
                    style="z-index: 3"
                    @click.stop="retirerFichier"
                    :disabled="uploading"
                  >
                    Changer de fichier
                  </button>
                </div>
              </div>

              <div class="d-flex align-items-start gap-2 bg-light p-3 rounded-3 mt-3">
                <i class="mdi mdi-information-outline text-warning fs-5 lh-1"></i>
                <small class="text-muted" style="font-size: 11px">
                  Assurez-vous que la première ligne du fichier contient exactement les entêtes
                  requis (ex: <code>matricule</code>, <code>montant_verse</code>,
                  <code>statut</code>) pour éviter les rejets de lignes.
                </small>
              </div>
            </div>

            <div class="modal-footer bg-light border-0 px-4 py-3">
              <button
                type="button"
                class="btn btn-secondary rounded-pill px-4"
                @click="proposerFermeture"
                :disabled="uploading"
              >
                Annuler
              </button>
              <button
                type="button"
                class="btn btn-success rounded-pill px-4 shadow-sm d-inline-flex align-items-center gap-2"
                :disabled="!selectedFile || uploading"
                @click="traiterImportation"
              >
                <span
                  v-if="uploading"
                  class="spinner-border spinner-border-sm"
                  role="status"
                ></span>
                <i v-else class="mdi mdi-check-all"></i>
                {{ uploading ? 'Traitement en cours...' : 'Lancer la validation' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup>
import { ref } from 'vue';
import { useInscriptionStore } from '@/stores/academiqueStore/inscriptionStore';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['update:modelValue']);
const store = useInscriptionStore();

// États locaux
const selectedFile = ref(null);
const uploading = ref(false);
const isDragging = ref(false);

// Fermeture sécurisée du modal
const proposerFermeture = () => {
  if (!uploading.value) {
    selectedFile.value = null;
    emit('update:modelValue', false);
  }
};

// Gestionnaires de fichiers
const handleFileChange = (event) => {
  const file = event.target.files[0];
  if (file) selectedFile.value = file;
};

const handleDrop = (event) => {
  isDragging.value = false;
  const file = event.dataTransfer.files[0];

  // Petite validation d'extension au drop
  if (
    file &&
    (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv'))
  ) {
    selectedFile.value = file;
  } else {
    alert('Format de fichier non supporté. Veuillez déposer un fichier Excel ou CSV.');
  }
};

const retirerFichier = () => {
  selectedFile.value = null;
};

// Envoi du fichier multipart au store Pinia
const traiterImportation = async () => {
  if (!selectedFile.value) return;

  uploading.value = true;

  // Création du FormData requis pour l'envoi de fichiers
  const formData = new FormData();
  formData.append('fichier', selectedFile.value); // La clé 'fichier' doit correspondre au upload.single('fichier') de l'API Node.js

  try {
    // Exécution de l'action dans le store (qui vide le cache et appelle l'API de réinscription)
    await store.importReinscriptions(formData);

    // Rafraîchir les données de la vue financière principale
    await store.fetchInscriptionsFinances();

    proposerFermeture();
  } catch (error) {
    console.error('Erreur lors de la validation par lots :', error);
    alert("L'importation a échoué. Vérifiez la structure de votre fichier.");
  } finally {
    uploading.value = false;
  }
};
</script>

<style scoped>
.transition-all {
  transition: all 0.2s ease-in-out;
}
.bg-soft-success {
  background-color: rgba(25, 135, 84, 0.08);
}
.dropzone {
  min-height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.dropzone:hover {
  border-color: #0d6efd !important;
}
/* Classes de transition pour le Teleport */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.25s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>
