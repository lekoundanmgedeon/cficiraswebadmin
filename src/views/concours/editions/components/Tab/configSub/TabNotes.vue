<template>
  <div class="animate__animated animate__fadeIn">
    <!-- En-tête et Menu de Sélection de l'épreuve -->
    <div
      class="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 mb-4"
    >
      <div>
        <h5 class="fw-bold mb-1 text-dark">Saisie des Notes par Épreuve</h5>
        <p class="text-muted small mb-0">
          Sélectionnez une matière pour ouvrir la grille de notation. Les modifications sont
          enregistrées globalement ou à la volée.
        </p>
      </div>

      <div class="d-flex align-items-center gap-2" style="min-width: 280px">
        <label class="form-label text-nowrap fw-semibold text-secondary small mb-0"
          >Épreuve :</label
        >
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
    <div class="card border border-dashed rounded-3 p-3 mb-3 bg-light-subtle shadow-sm">
      <div class="d-flex flex-column flex-md-row align-items-center justify-content-between gap-3">
        <div class="d-flex align-items-center gap-3">
          <div class="p-2 bg-primary-subtle text-primary rounded-circle">
            <i class="bi bi-file-earmark-excel fs-4"></i>
          </div>
          <div>
            <h6 class="fw-bold text-dark mb-0">Importation rapide par fichier Excel</h6>
            <p class="text-muted small mb-0">
              Téléversez une feuille contenant les colonnes : <code>num_table</code> et
              <code>note</code>.
            </p>
          </div>
        </div>

        <div>
          <input
            type="file"
            ref="excelNotesRef"
            @change="handleExcelNotesChange"
            accept=".csv, .xlsx, .xls"
            class="d-none"
          />
          <button
            class="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-2"
            @click="triggerExcelNotesSelect"
            :disabled="storeLoading"
          >
            <i class="bi bi-cloud-arrow-up"></i>
            <span>Choisir le fichier de notes</span>
          </button>
        </div>
      </div>
    </div>

    <!-- État initial : Aucune épreuve choisie -->
    <div
      v-if="!selectedEpreuveId"
      class="text-center py-5 border rounded-4 bg-light-subtle border-dashed"
    >
      <i class="bi bi-pencil-square text-muted display-6 d-block mb-2"></i>
      <h6 class="fw-bold text-secondary">Aucune matière sélectionnée</h6>
      <p class="text-muted small mb-0">
        Veuillez choisir une épreuve dans le menu déroulant ci-dessus pour charger la liste des
        candidats.
      </p>
    </div>

    <!-- Grille de notation active -->
    <div v-else class="animate__animated animate__fadeIn animate__fast">
      <div
        class="d-flex justify-content-between align-items-center bg-light p-3 border rounded-top-3 border-bottom-0"
      >
        <div
          class="d-flex align-items-center gap-3 text-xs fw-semibold text-uppercase font-monospace text-secondary"
        >
          <span
            >Candidats : <strong class="text-dark">{{ notesRows.length }}</strong></span
          >
          <span>•</span>
          <span
            >Saisies :
            <strong class="text-success">{{ totalSaisies }} / {{ notesRows.length }}</strong></span
          >
        </div>

        <div class="d-flex gap-2">
          <button
            class="btn btn-sm btn-outline-secondary bg-white"
            @click="loadCandidatsEtNotes"
            title="Rafraîchir les données"
            :disabled="storeLoading"
          >
            <i class="bi bi-arrow-clockwise"></i>
          </button>
          <button
            class="btn btn-sm btn-primary d-inline-flex align-items-center gap-1.5 px-3"
            @click="saveAllNotes"
            :disabled="storeLoading || notesRows.length === 0"
          >
            <span v-if="storeLoading" class="spinner-border spinner-border-sm" role="status"></span>
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
            <!-- Loader interne de tableau -->
            <tr v-if="storeLoading && notesRows.length === 0">
              <td colspan="4" class="text-center py-5">
                <div class="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
                <span class="text-muted text-xs">Chargement de la feuille de notation...</span>
              </td>
            </tr>

            <!-- Lignes candidats -->
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
                    :ref="(el) => (inputRefs[index] = el)"
                    class="form-control form-control-sm text-center font-monospace fw-bold custom-note-input"
                    placeholder="—"
                    min="0"
                    max="20"
                    step="0.25"
                    :disabled="storeLoading"
                  />
                </div>
              </td>

              <td class="text-end pe-3">
                <span
                  v-if="row.error"
                  class="badge bg-danger-subtle text-danger text-xs border border-danger-subtle"
                >
                  <i class="bi bi-exclamation-triangle-fill me-1"></i> Max 20
                </span>
                <span
                  v-else-if="row.note !== null && row.note !== '' && !row.isModified"
                  class="badge bg-success-subtle text-success text-xs rounded-pill"
                >
                  <i class="bi bi-check-circle-fill me-1"></i> Enregistré
                </span>
                <span
                  v-else-if="row.isModified"
                  class="badge bg-warning-subtle text-warning text-xs rounded-pill"
                >
                  <i class="bi bi-pencil-fill me-1"></i> En attente
                </span>
                <span v-else class="badge bg-light text-muted border text-xs font-monospace">
                  Absent / —
                </span>
              </td>
            </tr>

            <!-- Liste vide -->
            <tr v-if="notesRows.length === 0 && !storeLoading">
              <td colspan="4" class="text-center text-muted py-5">
                <i class="bi bi-people text-muted display-6 d-block mb-2"></i>
                Aucun candidat inscrit à ce concours. Ajoutez des candidats avant de saisir des
                notes.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useConcoursStore } from '@/stores/gestionStores/concourStore';
import { useCandidatStore } from '@/stores/gestionStores/candidatStore';
import { useNotifier } from '@/stores/messages/useNotifier';

const props = defineProps({
  concours: { type: Object, default: () => ({}) },
});

const route = useRoute();
const concoursStore = useConcoursStore();
const candidatStore = useCandidatStore();
const { notifySuccess, notifyError } = useNotifier();

/* Propriétés Réactives de l'URL */
const concoursId = computed(() => route.params.id);

/* State local */
const selectedEpreuveId = ref(null);
const notesRows = ref([]);
const inputRefs = ref([]);

/* Getters synchronisés avec les Stores Pinia */
const epreuvesList = computed(() => concoursStore.epreuvesList || []);
const storeLoading = computed(() => concoursStore.loading || candidatStore.loading);

// Compteur dynamique basé sur les notes réelles valides
const totalSaisies = computed(() => {
  return notesRows.value.filter((r) => r.note !== null && r.note !== '' && !r.error).length;
});

onMounted(async () => {
  await loadEpreuvesData();
});

// Sécurité : Si le responsable change de concours à la volée dans la barre latérale
watch(
  () => route.params.id,
  async (newId) => {
    if (newId) {
      selectedEpreuveId.value = null;
      notesRows.value = [];
      await loadEpreuvesData();
    }
  }
);

/* 1. Charger la liste des épreuves du concours */
const loadEpreuvesData = async () => {
  try {
    if (concoursId.value) {
      await concoursStore.fetchEpreuvesByConcours(concoursId.value);
    }
  } catch (err) {
    console.error('Erreur lors du chargement des matières:', err);
  }
};

const handleEpreuveChange = () => {
  inputRefs.value = [];
  loadCandidatsEtNotes();
};

/* 2. Construction de la table d'édition (Candidats associés à leurs notes existantes) */
const loadCandidatsEtNotes = async () => {
  if (!selectedEpreuveId.value) return;

  try {
    // Étape A : On s'assure d'avoir la liste fraîche des candidats du concours
    await candidatStore.fetchCandidatsByConcours(concoursId.value);
    const candidatsDuConcours = candidatStore.candidats || [];

    // Étape B : Mapping vers la structure visuelle d'édition
    notesRows.value = candidatsDuConcours.map((candidat) => {
      // Extraction de la note si le candidat possède déjà un tableau de notes lié à cette épreuve
      // S'adapte selon la structure de votre entité Candidat (ex: candidat.notes)
      const noteExistante = candidat.notes?.find((n) => n.epreuve_id === selectedEpreuveId.value);

      return {
        candidat_id: candidat.id,
        num_table: candidat.num_table || `CAND-${candidat.id}`,
        nom: candidat.nom,
        prenom: candidat.prenom,
        note: noteExistante ? noteExistante.valeur : null, // Mettez la clef exacte de votre API (.valeur ou .note)
        isModified: false,
        error: false,
      };
    });
  } catch (err) {
    notifyError('Impossible de charger la grille de saisie.');
  }
};

/* Validation temps réel */
const validateRowNote = (row) => {
  row.isModified = true;
  if (row.note < 0 || row.note > 20) {
    row.error = true;
  } else {
    row.error = false;
  }
};

/* UX Clavier : Aller à la ligne suivante au clic sur Entrée */
const focusNextInput = (currentIndex) => {
  const nextInput = inputRefs.value[currentIndex + 1];
  if (nextInput) {
    nextInput.focus();
    nextInput.select();
  }
};

/* 3. Sauvegarde de la grille de notes complète */
const saveAllNotes = async () => {
  const hasErrors = notesRows.value.some((r) => r.error);
  if (hasErrors) {
    return notifyError(
      'Veuillez corriger les notes invalides (hors de [0, 20]) avant de sauvegarder.'
    );
  }

  // Filtrer pour ne sauvegarder que les lignes réellement modifiées par l'utilisateur
  const lignesAEnregistrer = notesRows.value.filter((r) => r.isModified);

  if (lignesAEnregistrer.length === 0) {
    return notifySuccess('Aucune modification détectée dans la grille.');
  }

  try {
    // Itération asynchrone ordonnée sur chaque ligne modifiée en utilisant l'action du candidatStore
    // addNote(numTable, data) : data contient l'epreuve_id et la note correspondante
    for (const row of lignesAEnregistrer) {
      const payload = {
        epreuve_id: selectedEpreuveId.value,
        note: row.note === '' ? null : Number(row.note),
      };

      await candidatStore.addNote(row.num_table, payload);
    }

    notifySuccess('Toutes les notes modifiées ont été enregistrées avec succès.');

    // Étape finale : Rafraîchissement complet pour remettre à jour le State global
    await loadCandidatsEtNotes();
  } catch (err) {
    console.error('Erreur lors du traitement séquentiel des notes:', err);
  }
};

// 1. Référence pour le nouvel input File (à mettre avec vos autres refs)
const excelNotesRef = ref(null);

// 2. Déclencheur du clic sur l'input masqué
const triggerExcelNotesSelect = () => {
  if (excelNotesRef.value) {
    excelNotesRef.value.click();
  }
};

// 3. Gestionnaire de traitement et d'envoi du fichier Excel
const handleExcelNotesChange = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  // Validation de sécurité sur la taille (5 Mo)
  if (file.size > 5 * 1024 * 1024) {
    return notifyError('Le fichier est trop lourd. Limite fixée à 5 Mo.');
  }

  // Préparation du FormData (requis pour envoyer un fichier brut au backend Node.js)
  const formData = new FormData();
  formData.append('file', file);

  // Si votre backend a besoin de savoir à quelle épreuve lier ces notes :
  if (selectedEpreuveId.value) {
    formData.append('epreuve_id', selectedEpreuveId.value);
  }

  try {
    await candidatStore.importNotesFile(formData);

    // Réinitialisation de l'input pour les prochains imports
    if (excelNotesRef.value) excelNotesRef.value.value = '';

    // Rechargement immédiat de la grille à l'écran pour afficher les notes importées !
    await loadCandidatsEtNotes();
  } catch (err) {
    console.error("Erreur lors de l'import global des notes :", err);
  }
};
</script>

<style scoped>
.text-xs {
  font-size: 0.75rem;
}
.text-sm {
  font-size: 0.875rem;
}

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
