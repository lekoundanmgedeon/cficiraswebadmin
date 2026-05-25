<template>
  <div class="animate__animated animate__fadeIn">
    
    <div class="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 mb-4">
      <div>
        <h5 class="fw-bold mb-1 text-dark">Saisie des Notes par Épreuve</h5>
        <p class="text-muted small mb-0">
          Sélectionnez une matière pour ouvrir la grille de notation. Les modifications sont enregistrées à la volée ou globalement.
        </p>
      </div>
      
      <div class="d-flex align-items-center gap-2" style="min-width: 280px;">
        <label class="form-label text-nowrap fw-semibold text-secondary small mb-0">Épreuve :</label>
        <select 
          v-model="selectedEpreuveId" 
          @change="handleEpreuveChange" 
          class="form-select form-select-sm border-primary-subtle fw-medium"
        >
          <option :value="null" disabled>— Choisir une épreuve —</option>
          <option v-for="ep in epreuvesList" :key="ep.id" :value="ep.id">
            {{ ep.code }} - {{ ep.designation }} (Coeff. {{ ep.coefficient }})
          </option>
        </select>
      </div>
    </div>

    <div v-if="!selectedEpreuveId" class="text-center py-5 border rounded-4 bg-light-subtle border-dashed">
      <i class="bi bi-pencil-square text-muted display-6 d-block mb-2"></i>
      <h6 class="fw-bold text-secondary">Aucune matière sélectionnée</h6>
      <p class="text-muted small mb-0">Veuillez choisir une épreuve dans le menu déroulant ci-dessus pour charger la liste des candidats.</p>
    </div>

    <div v-else class="animate__animated animate__fadeIn animate__fast">
      
      <div class="d-flex justify-content-between align-items-center bg-light p-3 border rounded-top-3 border-bottom-0">
        <div class="d-flex align-items-center gap-3 text-xs fw-semibold text-uppercase font-monospace text-secondary">
          <span>Candidats : <strong class="text-dark">{{ notesRows.length }}</strong></span>
          <span>•</span>
          <span>Saisies : <strong class="text-success">{{ totalSaisies }} / {{ notesRows.length }}</strong></span>
        </div>
        
        <div class="d-flex gap-2">
          <button class="btn btn-xs btn-outline-secondary bg-white" @click="loadNotes" title="Rafraîchir les données">
            <i class="bi bi-arrow-clockwise"></i>
          </button>
          <button class="btn btn-sm btn-primary d-inline-flex align-items-center gap-1.5 px-3" @click="saveAllNotes" :disabled="isSaving">
            <span v-if="isSaving" class="spinner-border spinner-border-sm" role="status"></span>
            <i v-else class="bi bi-cloud-check"></i>
            <span>Enregistrer la grille</span>
          </button>
        </div>
      </div>

      <div class="table-responsive border rounded-bottom-3 shadow-sm bg-white">
        <table class="table table-hover align-middle mb-0 text-sm">
          <thead class="table-light text-uppercase font-monospace text-xs">
            <tr>
              <th class="ps-3" style="width: 15%">N° Table</th>
              <th style="width: 45%">Nom & Prénoms du Candidat</th>
              <th class="text-center" style="width: 25%">Note / 20.00</th>
              <th class="text-end pe-3" style="width: 15%">Statut</th>
            </tr>
          </thead>
          
          <tbody>
            <tr v-for="(row, index) in notesRows" :key="row.candidat_id">
              <td class="ps-3 font-monospace fw-bold text-secondary">
                {{ row.num_table }}
              </td>
              
              <td>
                <div class="fw-semibold text-dark">{{ row.nom }} {{ row.prenom }}</div>
              </td>
              
              <td class="text-center">
                <div class="d-flex justify-content-center align-items-center gap-2">
                  <input 
                    type="number" 
                    v-model.number="row.note"
                    @input="validateRowNote(row)"
                    @keydown.enter="focusNextInput(index)"
                    :ref="el => inputRefs[index] = el"
                    class="form-control form-control-sm text-center font-monospace fw-bold custom-note-input"
                    placeholder="—"
                    min="0"
                    max="20"
                    step="0.25"
                  />
                </div>
              </td>

              <td class="text-end pe-3">
                <span v-if="row.error" class="badge bg-danger-subtle text-danger text-xs border border-danger-subtle">
                  <i class="bi bi-exclamation-triangle-fill me-1"></i> Max 20
                </span>
                <span v-else-if="row.note !== null && row.note !== undefined && !row.isModified" class="badge bg-success-subtle text-success text-xs rounded-pill">
                  <i class="bi bi-check-circle-fill me-1"></i> Saisie
                </span>
                <span v-else-if="row.isModified" class="badge bg-warning-subtle text-warning text-xs rounded-pill">
                  <i class="bi bi-pencil-fill me-1"></i> En attente
                </span>
                <span v-else class="badge bg-light text-muted border text-xs font-monospace">
                  Absent / —
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useConcoursStore } from '@/stores/gestionStores/concourStore';
import { useNotifier } from '@/stores/messages/useNotifier';

const props = defineProps({
  concours: { type: Object, default: () => ({}) }
});

const route = useRoute();
const concoursStore = useConcoursStore();
const concoursId = Number(route.params.id);
const { notifySuccess, notifyError } = useNotifier();

const selectedEpreuveId = ref(null);
const notesRows = ref([]);
const isSaving = ref(false);
const inputRefs = ref([]); // Tableau de références pour la navigation clavier

// Liste des épreuves liées à ce concours (récupérées depuis le store global)
const epreuvesList = computed(() => {
  return concoursStore.epreuves || [];
});

// Compteur dynamique des notes déjà saisies
const totalSaisies = computed(() => {
  return notesRows.value.filter(r => r.note !== null && r.note !== '' && !r.error).length;
});

onMounted(async () => {
  // Assure le chargement des épreuves si pas encore fait
  if (epreuvesList.value.length === 0) {
    await concoursStore.fetchEpreuvesConcours(concoursId);
  }
});

const handleEpreuveChange = () => {
  inputRefs.value = [];
  loadNotes();
};

// Chargement des notes combinant la liste des candidats et leurs notes existantes
const loadNotes = async () => {
  if (!selectedEpreuveId.value) return;
  
  try {
    // Simuler ou appeler ton store, ex :
    // await concoursStore.fetchNotesParEpreuve(selectedEpreuveId.value);
    
    // Structure cible attendue pour alimenter le tableau réactif :
    notesRows.value = [
      { candidat_id: 1, num_table: 'CAND-001', nom: 'KABONGO', prenom: 'Marc', note: 14.5, isModified: false, error: false },
      { candidat_id: 2, num_table: 'CAND-002', nom: 'DIOP', prenom: 'Awa', note: null, isModified: false, error: false },
      { candidat_id: 3, num_table: 'CAND-003', nom: 'NGOUABI', prenom: 'Gaston', note: 19, isModified: false, error: false }
    ];
  } catch (err) {
    notifyError('Erreur lors de la récupération de la feuille de notes.');
  }
};

const validateRowNote = (row) => {
  row.isModified = true;
  if (row.note < 0 || row.note > 20) {
    row.error = true;
  } else {
    row.error = false;
  }
};

// UX Clavier : Passer à la ligne suivante automatiquement lors de l'appui sur "Entrée"
const focusNextInput = (currentIndex) => {
  const nextInput = inputRefs.value[currentIndex + 1];
  if (nextInput) {
    nextInput.focus();
    nextInput.select(); // Sélectionne le texte pour écraser rapidement
  }
};

const saveAllNotes = async () => {
  // Vérification globale avant envoi au backend Node.js
  const hasErrors = notesRows.value.some(r => r.error);
  if (hasErrors) {
    return notifyError('Veuillez corriger les notes supérieures à 20 ou négatives avant d\'enregistrer.');
  }

  isSaving.value = true;
  
  // Formatage du payload épuré
  const payload = notesRows.value.map(r => ({
    candidat_id: r.candidat_id,
    note: r.note
  }));

  try {
    // Appel API ex:
    // await concoursStore.saveGrilleNotes(selectedEpreuveId.value, payload);
    
    notifySuccess('Toutes les notes de cette épreuve ont été enregistrées.');
    // Repasse l'état local à non modifié
    notesRows.value.forEach(r => r.isModified = false);
  } catch (err) {
    notifyError('Échec de la sauvegarde des notes.');
  } finally {
    isSaving.value = false;
  }
};
</script>

<style scoped>
.text-xs { font-size: 0.75rem; }
.text-sm { font-size: 0.875rem; }

.border-dashed {
  border-style: dashed !important;
  border-width: 2px !important;
  border-color: #cbd5e1 !important;
}

/* Style input façon cellule de tableur Excel */
.custom-note-input {
  max-width: 90px;
  border: 1px solid #dee2e6;
  background-color: #f8f9fa;
  transition: all 0.15s ease;
}

.custom-note-input:focus {
  background-color: #fff;
  border-color: #0d6efd;
  box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.15);
  transform: scale(1.05);
}

/* Suppression des flèches natives de type number pour un rendu plus propre */
.custom-note-input::-webkit-outer-spin-button,
.custom-note-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.btn-xs {
  padding: 0.25rem 0.4rem;
  font-size: 0.75rem;
  border-radius: 0.25rem;
}
</style>