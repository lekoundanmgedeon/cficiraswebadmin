<template>
  <HeaderView />
  <div class="container-fluid my-4">
    <div class="row mb-4">
      <div class="col-12">
        <div class="d-flex align-items-center justify-content-between bg-white p-3 rounded shadow-sm border-start border-primary border-4">
          <div>
            <h4 class="fw-bold text-dark mb-1">Planification des Salles</h4>
            <p class="text-muted small mb-0">
              Répartissez automatiquement vos listes d'étudiants (Excel/CSV) au sein de vos infrastructures d'examen.
            </p>
          </div>
          <i class="bi bi-building-gear fs-2 text-primary-subtle"></i>
        </div>
      </div>
    </div>

    <div class="row g-4">
      <div class="col-lg-5 col-md-6">
        <div class="card border-0 shadow-sm mb-4 bg-white">
          <div class="card-header bg-white py-3 border-bottom-0">
            <h6 class="fw-bold text-dark mb-0">
              <i class="bi bi-sliders me-2 text-secondary"></i>1. Critères de Configuration
            </h6>
          </div>
          <div class="card-body pt-0">
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label text-xs fw-semibold">Salles Disponibles</label>
                <input type="number" class="form-control form-control-sm" v-model.number="roomCount" min="1" />
              </div>
              <div class="col-md-6">
                <label class="form-label text-xs fw-semibold">Capacité Maximale / Salle</label>
                <input type="number" class="form-control form-control-sm" v-model.number="capacityPerRoom" min="1" />
              </div>
              <div class="col-12">
                <label class="form-label text-xs fw-semibold">Mode de Répartition</label>
                <select class="form-select form-select-sm" v-model="distributionMode">
                  <option value="mixed">Mélanger toutes les classes (Brassage complet)</option>
                  <option value="byClass">Regrouper par classe (Blocs homogènes)</option>
                  <option value="byClassMixed">Mélanger à l'intérieur de chaque classe</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div class="card border-0 shadow-sm bg-white">
          <div class="card-header bg-white py-3 border-bottom-0">
            <h6 class="fw-bold text-dark mb-0">
              <i class="bi bi-file-earmark-excel me-2 text-secondary"></i>2. Fichiers Étudiants
            </h6>
          </div>
          <div class="card-body pt-0">
            <div
              class="drag-drop-area border border-dashed rounded p-4 text-center cursor-pointer mb-3"
              @dragover.prevent
              @dragenter.prevent="isDragging = true"
              @dragleave="isDragging = false"
              @drop.prevent="handleDrop"
              @click="openFileInput"
              :class="{ 'border-primary bg-primary-subtle': isDragging }"
            >
              <i class="bi bi-cloud-arrow-up-fill text-primary fs-2 mb-2 d-block"></i>
              <p class="text-muted small mb-1">
                Glissez-déposez vos fichiers Excel ici ou <span class="text-primary fw-semibold">parcourez</span>
              </p>
              <span class="text-xs text-muted">Formats acceptés : .xlsx, .csv</span>

              <input
                type="file"
                ref="fileInput"
                hidden
                multiple
                @change="handleFileUpload"
                accept=".csv, .xlsx"
              />
            </div>

            <div v-if="uploadedFiles.length > 0">
              <span class="text-xs fw-bold text-secondary d-block mb-2">Fichiers Enregistrés ({{ uploadedFiles.length }}) :</span>
              <div class="list-group list-group-flush border rounded overflow-hidden">
                <div
                  class="list-group-item d-flex justify-content-between align-items-center p-2 text-sm"
                  v-for="(file, index) in uploadedFiles"
                  :key="index"
                >
                  <div class="text-truncate me-2">
                    <i class="bi bi-filetype-xlsx text-success me-2"></i>{{ file.name }}
                  </div>
                  <button class="btn btn-link text-danger p-0" @click.stop="removeFile(index)">
                    <i class="bi bi-trash-fill"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="col-lg-7 col-md-6">
        <div class="card border-0 shadow-sm h-100 bg-white">
          <div class="card-header bg-white py-3 border-bottom-0">
            <h6 class="fw-bold text-dark mb-0">
              <i class="bi bi-pie-chart me-2 text-secondary"></i>3. Statut & Analyse Capacité
            </h6>
          </div>
          <div class="card-body d-flex flex-column justify-content-between">
            <div class="row g-3">
              <div class="col-sm-6">
                <div class="p-3 border rounded bg-light">
                  <span class="text-muted text-xs d-block text-uppercase fw-bold">Étudiants Importés</span>
                  <span class="fs-3 fw-bold text-dark">{{ totalStudents }}</span>
                </div>
              </div>
              <div class="col-sm-6">
                <div class="p-3 border rounded bg-light">
                  <span class="text-muted text-xs d-block text-uppercase fw-bold">Places Disponibles</span>
                  <span class="fs-3 fw-bold text-dark">{{ totalCapacity }}</span>
                </div>
              </div>

              <div class="col-12">
                <div v-if="totalStudents === 0" class="alert alert-light border text-center p-4 small text-muted">
                  <i class="bi bi-hdd me-2"></i>En attente de chargement de listes d'étudiants pour exécuter l'analyse.
                </div>
                <div v-else-if="hasCapacityOverflow" class="alert alert-danger-subtle border border-danger text-dark d-flex align-items-center">
                  <i class="bi bi-exclamation-triangle-fill text-danger me-3 fs-4"></i>
                  <div class="small">
                    <strong class="text-danger">Capacité insuffisante !</strong> Votre volume d'étudiants ({{ totalStudents }}) excède la capacité globale configurée ({{ totalCapacity }} places). Veuillez augmenter le nombre de salles ou leur volume maximal.
                  </div>
                </div>
                <div v-else class="alert alert-success-subtle border border-success text-dark d-flex align-items-center">
                  <i class="bi bi-check-circle-fill text-success me-3 fs-4"></i>
                  <div class="small">
                    <strong>Taille conforme :</strong> Les infrastructures actuelles couvrent largement les listes d'étudiants importées.
                  </div>
                </div>
              </div>
            </div>

            <div class="pt-4 text-end border-top">
              <button 
                class="btn btn-primary px-4 fw-medium btn-sm" 
                @click="distributeStudents" 
                :disabled="!canDistribute"
              >
                <i class="bi bi-cpu me-2"></i>Lancer la Répartition Automatique
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="distributionResults.length > 0" class="row mt-4">
      <div class="col-12">
        <div class="card border-0 shadow-sm bg-white">
          <div class="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
            <h6 class="fw-bold text-dark mb-0">
              <i class="bi bi-check-all text-success me-2"></i>Résultats de la Répartition des Salles
            </h6>
            <button class="btn btn-success btn-sm px-3 font-semibold" @click="exportResults">
              <i class="bi bi-file-earmark-arrow-down me-1"></i> Exporter la feuille Excel (.xlsx)
            </button>
          </div>
          
          <div class="card-body">
            <div class="accordion custom-accordion" id="distributionAccordion">
              <div class="accordion-item border mb-2 rounded overflow-hidden" v-for="(room, index) in distributionResults" :key="index">
                <h2 class="accordion-header">
                  <button
                    class="accordion-button bg-light font-semibold text-dark text-sm py-2 px-3"
                    type="button"
                    data-bs-toggle="collapse"
                    :data-bs-target="'#roomCollapse' + index"
                    :aria-expanded="index === 0 ? 'true' : 'false'"
                  >
                    <div class="d-flex justify-content-between w-100 align-items-center pe-3">
                      <span><i class="bi bi-door-closed me-2 text-secondary"></i>Salle {{ index + 1 }}</span>
                      <span class="badge bg-secondary-subtle text-secondary rounded-pill text-xs">
                        {{ room.students.length }} / {{ capacityPerRoom }} Étudiants
                      </span>
                    </div>
                  </button>
                </h2>
                <div
                  :id="'roomCollapse' + index"
                  class="accordion-collapse collapse"
                  :class="{ show: index === 0 }"
                  data-bs-parent="#distributionAccordion"
                >
                  <div class="accordion-body p-0">
                    <div class="table-responsive">
                      <table class="table table-hover table-striped align-middle text-sm mb-0">
                        <thead class="table-light text-secondary text-uppercase text-xs">
                          <tr>
                            <th class="ps-4" style="width: 80px;">N°</th>
                            <th>Nom & Prénoms</th>
                            <th>Classe Assignée</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="(student, sIndex) in room.students" :key="sIndex">
                            <td class="ps-4 fw-medium text-secondary">{{ sIndex + 1 }}</td>
                            <td class="fw-bold text-dark">{{ student.lastName }} {{ student.firstName }}</td>
                            <td><span class="badge bg-light text-dark border fw-normal">{{ student.class }}</span></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import HeaderView from './components/HeaderView.vue';
import { ref, computed } from 'vue';
import * as XLSX from 'xlsx';

const fileInput = ref(null);
const uploadedFiles = ref([]);
const isDragging = ref(false);
const studentsList = ref([]);
const distributionResults = ref([]);

// Configuration initiale par défaut
const roomCount = ref(5);
const capacityPerRoom = ref(20);
const distributionMode = ref('mixed');

const openFileInput = () => fileInput.value.click();

const handleFileUpload = async (event) => {
  const files = event.target.files;
  if (!files.length) return;
  await processFiles(files);
};

const handleDrop = async (event) => {
  const files = event.dataTransfer.files;
  if (!files.length) return;
  isDragging.value = false;
  await processFiles(files);
};

const processFiles = async (files) => {
  for (const file of files) {
    uploadedFiles.value.push(file);
  }
  await recalculateStudentList();
};

const removeFile = async (index) => {
  uploadedFiles.value.splice(index, 1);
  await recalculateStudentList();
};

const recalculateStudentList = async () => {
  studentsList.value = [];
  distributionResults.value = []; // Reset automatique du tableau si la structure d'entrée change
  for (const file of uploadedFiles.value) {
    await parseStudentFile(file);
  }
};

const parseStudentFile = async (file) => {
  try {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(firstSheet);
    
    const parsed = jsonData.map((row) => ({
      lastName: (row['Nom'] || row['nom'] || row['LASTNAME'] || '').toString().toUpperCase().trim(),
      firstName: (row['Prénom'] || row['prenom'] || row['FIRSTNAME'] || '').toString().trim(),
      class: (row['Classe'] || row['classe'] || row['CLASS'] || 'Inconnue').toString().trim(),
    }));

    studentsList.value.push(...parsed);
  } catch (error) {
    console.error('Erreur lors du traitement du fichier Excel :', error);
    alert(`Erreur de lecture sur le fichier ${file.name}.`);
  }
};

/* =========================================================================
    🧮 ALGORITHME DE RÉPARTITION AUTO DES SALLES
   ========================================================================= */
const distributeStudents = () => {
  if (studentsList.value.length === 0) return;
  
  let studentsToDistribute = [...studentsList.value];
  const results = [];

  // Initialisation structurelle des pièces disponibles
  for (let r = 0; r < roomCount.value; r++) {
    results.push({ id: r + 1, students: [] });
  }

  // 1. Gestion des modes algorithmiques de tri préliminaire
  if (distributionMode.value === 'mixed') {
    studentsToDistribute = shuffleArray(studentsToDistribute);
  } else if (distributionMode.value === 'byClass') {
    // Tri séquentiel alphabétique par classe pour les conserver groupés
    studentsToDistribute.sort((a, b) => a.class.localeCompare(b.class));
  } else if (distributionMode.value === 'byClassMixed') {
    // Séparer par classe, mélanger chaque classe indépendamment puis concaténer
    const classGroups = {};
    studentsToDistribute.forEach(s => {
      if (!classGroups[s.class]) classGroups[s.class] = [];
      classGroups[s.class].push(s);
    });
    
    studentsToDistribute = [];
    Object.keys(classGroups).sort().forEach(cls => {
      const shuffledClass = shuffleArray(classGroups[cls]);
      studentsToDistribute.push(...shuffledClass);
    });
  }

  // 2. Remplissage des salles selon la capacité max configurée
  let currentRoomIndex = 0;
  for (const student of studentsToDistribute) {
    // Si toutes les salles disponibles de la configuration sont pleines, arrêter
    if (currentRoomIndex >= roomCount.value) break;

    if (results[currentRoomIndex].students.length >= capacityPerRoom.value) {
      currentRoomIndex++;
      if (currentRoomIndex >= roomCount.value) break;
    }
    
    results[currentRoomIndex].students.push(student);
  }

  distributionResults.value = results.filter(r => r.students.length > 0);
};

const shuffleArray = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

/* =========================================================================
    💾 EXPORTATION EXCEL UNIQUE STRUCTURÉE
   ========================================================================= */
const exportResults = () => {
  const exportData = [];
  distributionResults.value.forEach((room) => {
    room.students.forEach((student, idx) => {
      exportData.push({
        'Numéro de Table': idx + 1,
        'Salle Affectée': `Salle ${room.id}`,
        'Nom': student.lastName,
        'Prénom': student.firstName,
        'Classe': student.class,
      });
    });
  });

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Répartition Globale Salles');
  XLSX.writeFile(workbook, `repartition_automatique_salles.xlsx`);
};

// Propriétés calculées réactives
const totalStudents = computed(() => studentsList.value.length);
const totalCapacity = computed(() => roomCount.value * capacityPerRoom.value);
const hasCapacityOverflow = computed(() => totalStudents.value > totalCapacity.value);

const canDistribute = computed(() => {
  return studentsList.value.length > 0 && roomCount.value > 0 && capacityPerRoom.value > 0 && !hasCapacityOverflow.value;
});
</script>

<style scoped>
.text-xs {
  font-size: 0.75rem;
}
.cursor-pointer {
  cursor: pointer;
}
.drag-drop-area {
  transition: all 0.2s ease-in-out;
}
.border-dashed {
  border-style: dashed !important;
}
.custom-accordion .accordion-button::after {
  filter: grayscale(1) brightness(0.5);
}
</style>