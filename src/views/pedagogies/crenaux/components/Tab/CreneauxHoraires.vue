<template>
  <div class="row">
    <!-- Header de la section -->
    <div class="col-12 mb-4">
      <h3 class="fw-bold mb-1">Planification des Créneaux & Horaires</h3>
      <p class="text-muted small mb-0">
        <i class="bi bi-calendar-event-fill me-1"></i>
        Organisez l'emploi du temps. Importez vos plannings en masse ou ajustez les créneaux
        manuellement (cours, formateurs, salles).
      </p>
    </div>

    <!-- Zone d'actions principales : Import vs Ajout Manuel -->
    <div class="col-12 mb-4">
      <div class="row g-3">
        <!-- Bloc 1 : Import de masse (Excel / CSV) -->
        <div class="col-lg-5">
          <div class="card border-0 shadow-sm rounded-4 h-100 bg-white">
            <div class="card-header bg-white border-0 pt-4 px-4 pb-0">
              <h5 class="fw-bold text-dark mb-0">
                <i class="bi bi-file-earmark-excel-fill text-success me-2"></i>Import de masse
              </h5>
            </div>
            <div class="card-body p-4 d-flex flex-column justify-content-between">
              <p class="text-muted small mb-3">
                Téléversez un fichier de planification au format <code>.xlsx</code> ou
                <code>.csv</code> pour injecter l'emploi du temps d'un coup.
              </p>

              <!-- Zone de Drop Flat Design -->
              <div
                class="upload-zone p-4 rounded text-center mb-3 transition-all"
                :class="{ 'upload-zone-active': isDragging }"
                @dragover.prevent="isDragging = true"
                @dragleave.prevent="isDragging = false"
                @drop.prevent="handleFileDrop"
                @click="$refs.fileInput.click()"
              >
                <input
                  type="file"
                  ref="fileInput"
                  class="d-none"
                  accept=".csv, .xlsx, .xls"
                  @change="handleFileSelect"
                />
                <i class="bi bi-cloud-arrow-up text-success fs-2 mb-2 d-block"></i>
                <span class="small fw-semibold text-dark d-block mb-1">
                  {{ uploadedFile ? uploadedFile.name : 'Glissez-déposez votre fichier ici' }}
                </span>
                <span class="text-muted text-uppercase" style="font-size: 10px">
                  {{
                    uploadedFile
                      ? `${(uploadedFile.size / 1024).toFixed(1)} Ko`
                      : 'ou cliquez pour parcourir'
                  }}
                </span>
              </div>

              <div class="d-flex gap-2">
                <button
                  class="btn btn-success border-0 shadow-sm w-100 py-2"
                  :disabled="!uploadedFile"
                  @click="processImport"
                >
                  <i class="bi bi-check-circle me-1"></i> Valider l'importation
                </button>
                <button
                  v-if="uploadedFile"
                  class="btn btn-light border py-2"
                  @click="uploadedFile = null"
                >
                  <i class="bi bi-x"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Bloc 2 : Ajout / Modification Tardive (Formulaire) -->
        <div class="col-lg-7">
          <div class="card border-0 shadow-sm rounded-4 h-100 bg-white">
            <div class="card-header bg-white border-0 pt-4 px-4 pb-0">
              <h5 class="fw-bold text-dark mb-0">
                <i class="bi bi-pencil-square text-primary me-2"></i
                >{{ isEditing ? 'Ajuster un Créneau' : 'Ajout Tardif ou Modification' }}
              </h5>
            </div>
            <div class="card-body p-4">
              <form @submit.prevent="saveSchedule">
                <div class="row g-2">
                  <!-- Classe -->
                  <div class="col-md-4">
                    <label class="form-label small fw-semibold text-muted mb-1">Classe</label>
                    <select
                      class="form-select bg-light border-0 shadow-sm"
                      v-model="form.classe"
                      required
                    >
                      <option value="">Sélectionner...</option>
                      <option v-for="c in mockClasses" :key="c" :value="c">{{ c }}</option>
                    </select>
                  </div>
                  <!-- Matière (et son formateur par défaut si connecté) -->
                  <div class="col-md-8">
                    <label class="form-label small fw-semibold text-muted mb-1"
                      >Matière & Formateur</label
                    >
                    <select
                      class="form-select bg-light border-0 shadow-sm"
                      v-model="form.matiereFormateur"
                      required
                    >
                      <option value="">Choisir l'enseignement...</option>
                      <option v-for="m in mockMatiereFormateurs" :key="m.id" :value="m">
                        {{ m.matiere }} — {{ m.formateur }}
                      </option>
                    </select>
                  </div>
                  <!-- Salle -->
                  <div class="col-md-4">
                    <label class="form-label small fw-semibold text-muted mb-1"
                      >Salle de cours</label
                    >
                    <select
                      class="form-select bg-light border-0 shadow-sm"
                      v-model="form.salle"
                      required
                    >
                      <option value="">Attribuer une salle...</option>
                      <option v-for="s in mockSalles" :key="s" :value="s">{{ s }}</option>
                    </select>
                  </div>
                  <!-- Date -->
                  <div class="col-md-4">
                    <label class="form-label small fw-semibold text-muted mb-1">Date</label>
                    <input
                      type="date"
                      class="form-control bg-light border-0 shadow-sm"
                      v-model="form.date"
                      required
                    />
                  </div>
                  <!-- Horaires (Début / Fin) -->
                  <div class="col-md-2">
                    <label class="form-label small fw-semibold text-muted mb-1">Début</label>
                    <input
                      type="time"
                      class="form-control bg-light border-0 shadow-sm"
                      v-model="form.heureDebut"
                      required
                    />
                  </div>
                  <div class="col-md-2">
                    <label class="form-label small fw-semibold text-muted mb-1">Fin</label>
                    <input
                      type="time"
                      class="form-control bg-light border-0 shadow-sm"
                      v-model="form.heureFin"
                      required
                    />
                  </div>
                </div>

                <!-- Actions du formulaire -->
                <div class="text-end mt-4">
                  <button
                    v-if="isEditing"
                    type="button"
                    class="btn btn-light border-0 me-2"
                    @click="resetForm"
                  >
                    Annuler
                  </button>
                  <button type="submit" class="btn btn-primary border-0 shadow-sm px-4 py-2">
                    <i class="bi bi-journal-check me-1"></i> Enregistrer le créneau
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Liste/Visualisation de l'Emploi du Temps planifié -->
    <div class="col-12">
      <div class="card border-0 shadow-sm rounded-4 overflow-hidden">
        <div
          class="card-header bg-white border-0 pt-4 px-4 pb-2 d-flex justify-content-between align-items-center"
        >
          <h5 class="fw-bold text-dark mb-0">Registre des Séances Programmées</h5>

          <!-- Filtre rapide d'affichage de la table -->
          <div class="d-flex gap-2">
            <select
              class="form-select form-select-sm border shadow-sm px-3 py-1"
              v-model="tableFilterClasse"
            >
              <option value="Toutes">Toutes les classes</option>
              <option v-for="c in mockClasses" :key="c" :value="c">{{ c }}</option>
            </select>
          </div>
        </div>

        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead class="bg-light">
                <tr>
                  <th class="ps-4 py-3">Date & Heure</th>
                  <th>Classe</th>
                  <th>Matière Enseignée</th>
                  <th>Formateur</th>
                  <th class="text-center">Salle assignée</th>
                  <th class="text-end pe-4">Actions</th>
                </tr>
              </thead>

              <tbody>
                <tr v-for="slot in filteredSchedules" :key="slot.id" class="transition-all">
                  <!-- Date & Créneau Horaire -->
                  <td class="ps-4">
                    <div class="fw-bold text-dark">{{ formatDate(slot.date) }}</div>
                    <small class="text-primary fw-medium">
                      <i class="bi bi-clock me-1"></i>{{ slot.heureDebut }} - {{ slot.heureFin }}
                    </small>
                  </td>

                  <!-- Classe concernée -->
                  <td>
                    <span class="badge bg-light text-secondary border px-2 py-1 fw-bold">{{
                      slot.classe
                    }}</span>
                  </td>

                  <!-- Matière -->
                  <td class="fw-semibold text-dark">
                    {{ slot.matiere }}
                  </td>

                  <!-- Formateur -->
                  <td class="text-secondary small">
                    <i class="bi bi-person-badge me-1"></i> {{ slot.formateur }}
                  </td>

                  <!-- Code de la Salle -->
                  <td class="text-center">
                    <span class="badge bg-soft-primary text-primary px-3 py-2 fw-bold">
                      {{ slot.salle }}
                    </span>
                  </td>

                  <!-- Modification Unitaire Directe -->
                  <td class="text-end pe-4">
                    <button
                      class="btn btn-link text-primary p-0 me-3"
                      title="Modifier la séance"
                      @click="editSlot(slot)"
                    >
                      <i class="bi bi-pencil-fill fs-6"></i>
                    </button>
                    <button
                      class="btn btn-link text-danger p-0 border-0"
                      title="Supprimer le créneau"
                      @click="deleteSlot(slot.id)"
                    >
                      <i class="bi bi-trash fs-6"></i>
                    </button>
                  </td>
                </tr>

                <!-- Cas vide -->
                <tr v-if="filteredSchedules.length === 0">
                  <td colspan="6" class="text-center py-5">
                    <h6 class="text-muted fw-bold mb-1">Aucune séance planifiée</h6>
                    <p class="small text-muted mb-0">
                      Utilisez l'import de fichier ou le formulaire d'ajout.
                    </p>
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
import { ref, computed } from 'vue';

// Etats d'importation
const isDragging = ref(false);
const uploadedFile = ref(null);

// Etats du formulaire d'édition/ajout tardif
const isEditing = ref(false);
const editingId = ref(null);
const tableFilterClasse = ref('Toutes');

const form = ref({
  classe: '',
  matiereFormateur: '',
  salle: '',
  date: '',
  heureDebut: '',
  heureFin: '',
});

// Référentiels d'aide à la saisie
const mockClasses = ref(['Master 1 Info', 'Master 2 Info', 'Licence 3 Management']);
const mockSalles = ref(['Amphi A', 'Salle 102 (Labo)', 'Salle 204', 'Visioconférence']);
const mockMatiereFormateurs = ref([
  { id: 1, matiere: 'Conception orientée objet & Patterns', formateur: 'Dupont Jean' },
  { id: 2, matiere: 'Frameworks Modernes (Vue.js 3 & Node)', formateur: 'Traoré Moussa' },
  { id: 3, matiere: 'Deep Learning & Vision par ordinateur', formateur: 'Alami Sanaa' },
  { id: 4, matiere: 'Méthodologies Agiles & Scrum Master', formateur: 'Dupont Jean' },
]);

// Registre centralisé des emplois du temps (Modifiable à la volée)
const mockSchedules = ref([
  {
    id: 1001,
    date: '2026-05-19',
    heureDebut: '08:30',
    heureFin: '11:30',
    classe: 'Master 1 Info',
    matiere: 'Frameworks Modernes (Vue.js 3 & Node)',
    formateur: 'Traoré Moussa',
    salle: 'Salle 102 (Labo)',
  },
  {
    id: 1002,
    date: '2026-05-19',
    heureDebut: '13:30',
    heureFin: '16:30',
    classe: 'Master 2 Info',
    matiere: 'Deep Learning & Vision par ordinateur',
    formateur: 'Alami Sanaa',
    salle: 'Amphi A',
  },
]);

// --- Gestion de l'import de fichier ---
const handleFileSelect = (event) => {
  const files = event.target.files;
  if (files.length) uploadedFile.value = files[0];
};

const handleFileDrop = (event) => {
  isDragging.value = false;
  const files = event.dataTransfer.files;
  if (files.length) uploadedFile.value = files[0];
};

const processImport = () => {
  alert(
    `Fichier [${uploadedFile.value.name}] analysé avec succès ! Ajout simulé de 24 nouveaux créneaux horaires dans la base de données.`
  );
  // Simulation de l'insertion post-importation
  mockSchedules.value.push({
    id: Date.now(),
    date: '2026-05-20',
    heureDebut: '09:00',
    heureFin: '12:00',
    classe: 'Licence 3 Management',
    matiere: 'Méthodologies Agiles & Scrum Master',
    formateur: 'Dupont Jean',
    salle: 'Salle 204',
  });
  uploadedFile.value = null;
};

// --- CRUD : Enregistrement (Ajout unitaire / Modification) ---
const saveSchedule = () => {
  if (isEditing.value) {
    // Mode Modification
    const index = mockSchedules.value.findIndex((s) => s.id === editingId.value);
    if (index !== -1) {
      mockSchedules.value[index] = {
        id: editingId.value,
        date: form.value.date,
        heureDebut: form.value.heureDebut,
        heureFin: form.value.heureFin,
        classe: form.value.classe,
        matiere: form.value.matiereFormateur.matiere,
        formateur: form.value.matiereFormateur.formateur,
        salle: form.value.salle,
      };
    }
  } else {
    // Mode Ajout Tardif
    mockSchedules.value.unshift({
      id: Date.now(),
      date: form.value.date,
      heureDebut: form.value.heureDebut,
      heureFin: form.value.heureFin,
      classe: form.value.classe,
      matiere: form.value.matiereFormateur.matiere,
      formateur: form.value.matiereFormateur.formateur,
      salle: form.value.salle,
    });
  }
  resetForm();
};

const editSlot = (slot) => {
  isEditing.value = true;
  editingId.value = slot.id;

  // Retrouver la correspondance de l'objet d'enseignement
  const matFormObj = mockMatiereFormateurs.value.find((m) => m.matiere === slot.matiere) || '';

  form.value = {
    classe: slot.classe,
    matiereFormateur: matFormObj,
    salle: slot.salle,
    date: slot.date,
    heureDebut: slot.heureDebut,
    heureFin: slot.heureFin,
  };
};

const deleteSlot = (id) => {
  if (confirm('Voulez-vous annuler ce créneau horaire ?')) {
    mockSchedules.value = mockSchedules.value.filter((s) => s.id !== id);
  }
};

const resetForm = () => {
  isEditing.value = false;
  editingId.value = null;
  form.value = {
    classe: '',
    matiereFormateur: '',
    salle: '',
    date: '',
    heureDebut: '',
    heureFin: '',
  };
};

// --- Formatage & Tri ---
const filteredSchedules = computed(() => {
  if (tableFilterClasse.value === 'Toutes') return mockSchedules.value;
  return mockSchedules.value.filter((s) => s.classe === tableFilterClasse.value);
});

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
};
</script>

<style scoped>
/* Zone Drag & Drop Interactive Flat */
.upload-zone {
  border: 2px dashed #dee2e6;
  background-color: #f8f9fa;
  cursor: pointer;
}
.upload-zone:hover,
.upload-zone-active {
  border-color: #198754;
  background-color: rgba(25, 135, 84, 0.04);
}

/* Thématique Douce */
.bg-soft-primary {
  background-color: rgba(0, 123, 255, 0.1);
  color: #007bff;
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

.rounded-4 {
  border-radius: 0.2rem !important; /* Respect strict de la ligne graphique de l'application */
}
.form-select,
.form-control {
  font-size: 0.85rem;
  padding: 8px 12px;
}
.transition-all {
  transition: all 0.2s ease-in-out;
}
</style>
