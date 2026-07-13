<script setup>
import { computed, onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import * as XLSX from 'xlsx';
import { useNotificationStore } from '@/shared/stores/notificationStore';
import ExamenHeader from '../../components/ExamenHeader.vue';
import SalleFormModal from '../components/SalleFormModal.vue';
import { useSalleStore } from '../store';
import { useSalleForm } from '../composables/useSalleForm';

/**
 * Planification des salles d'examen.
 *
 * L'écran, son algorithme de répartition et sa mise en page sont ceux de
 * l'original. Une seule chose change, mais elle est essentielle : **les salles
 * sont réelles**.
 *
 * L'ancienne version demandait deux nombres — « Salles disponibles » et
 * « Capacité maximale / salle » — et fabriquait à partir de là *N* salles
 * identiques (5 × 20 par défaut). Elle ne consultait jamais les salles
 * effectivement déclarées, et pour cause : **aucune route ne les exposait**. La
 * table `salles` existait pourtant, avec ses quatre salles et leurs capacités
 * distinctes (un amphi de 200 places, un labo de 25…).
 *
 * Le CRUD `/salles` a été ajouté côté backend. On sélectionne désormais les
 * salles réellement mobilisées, chacune avec **sa propre capacité** — ce que le
 * modèle « N salles identiques » ne savait pas représenter.
 */

const salleStore = useSalleStore();
const notifications = useNotificationStore();

const { items: salles, loading } = storeToRefs(salleStore);
const { openCreate, openEdit } = useSalleForm();

/** Salles retenues pour la répartition. */
const sallesRetenues = ref([]);

const fileInput = ref(null);
const uploadedFiles = ref([]);
const isDragging = ref(false);
const studentsList = ref([]);
const distributionResults = ref([]);
const distributionMode = ref('mixed');

onMounted(async () => {
  await salleStore.fetchAll();
  // Toutes les salles sont mobilisées par défaut : c'est le cas courant.
  sallesRetenues.value = salles.value.map((salle) => salle.id);
});

const sallesActives = computed(() =>
  salles.value.filter((salle) => sallesRetenues.value.includes(salle.id))
);

const totalStudents = computed(() => studentsList.value.length);

/** Somme des capacités **réelles** des salles retenues. */
const totalCapacity = computed(() =>
  sallesActives.value.reduce((total, salle) => total + Number(salle.capacite ?? 0), 0)
);

const hasCapacityOverflow = computed(() => totalStudents.value > totalCapacity.value);

const canDistribute = computed(
  () => totalStudents.value > 0 && sallesActives.value.length > 0 && !hasCapacityOverflow.value
);

const openFileInput = () => fileInput.value?.click();

const handleFileUpload = (event) => processFiles(event.target.files);

const handleDrop = (event) => {
  isDragging.value = false;
  processFiles(event.dataTransfer.files);
};

async function processFiles(files) {
  if (!files?.length) return;
  uploadedFiles.value.push(...files);
  await recalculateStudentList();
}

async function removeFile(index) {
  uploadedFiles.value.splice(index, 1);
  await recalculateStudentList();
}

async function recalculateStudentList() {
  studentsList.value = [];
  // Toute modification des listes d'entrée invalide la répartition précédente.
  distributionResults.value = [];

  for (const file of uploadedFiles.value) {
    await parseStudentFile(file);
  }
}

/** @param {File} file */
async function parseStudentFile(file) {
  try {
    const workbook = XLSX.read(await file.arrayBuffer());
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet);

    studentsList.value.push(
      ...rows.map((row) => ({
        lastName: String(row['Nom'] ?? row['nom'] ?? row['LASTNAME'] ?? '')
          .toUpperCase()
          .trim(),
        firstName: String(row['Prénom'] ?? row['prenom'] ?? row['FIRSTNAME'] ?? '').trim(),
        class: String(row['Classe'] ?? row['classe'] ?? row['CLASS'] ?? 'Inconnue').trim(),
      }))
    );
  } catch {
    // L'ancienne version affichait un `alert()` bloquant du navigateur.
    notifications.notifyError(`Le fichier « ${file.name} » n'a pas pu être lu.`);
  }
}

/** @param {any[]} array */
function shuffleArray(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Répartition automatique.
 *
 * L'algorithme est celui de l'original, à un détail près : chaque salle a
 * désormais **sa propre capacité**, au lieu d'une capacité unique appliquée à
 * toutes.
 */
function distributeStudents() {
  if (!canDistribute.value) return;

  let aRepartir = [...studentsList.value];

  if (distributionMode.value === 'mixed') {
    aRepartir = shuffleArray(aRepartir);
  } else if (distributionMode.value === 'byClass') {
    aRepartir.sort((a, b) => a.class.localeCompare(b.class));
  } else if (distributionMode.value === 'byClassMixed') {
    const parClasse = {};
    for (const etudiant of aRepartir) {
      (parClasse[etudiant.class] ??= []).push(etudiant);
    }
    aRepartir = Object.keys(parClasse)
      .sort()
      .flatMap((classe) => shuffleArray(parClasse[classe]));
  }

  const resultats = sallesActives.value.map((salle) => ({
    salle,
    capacite: Number(salle.capacite ?? 0),
    students: [],
  }));

  let index = 0;
  for (const etudiant of aRepartir) {
    while (
      index < resultats.length &&
      resultats[index].students.length >= resultats[index].capacite
    ) {
      index += 1;
    }
    if (index >= resultats.length) break;

    resultats[index].students.push(etudiant);
  }

  distributionResults.value = resultats;
  notifications.notifySuccess(
    `${aRepartir.length} étudiant(s) répartis dans ${resultats.length} salle(s).`
  );
}

function exportResults() {
  const rows = distributionResults.value.flatMap((room) =>
    room.students.map((student, index) => ({
      Salle: room.salle.code_salle,
      Bâtiment: room.salle.batiment,
      'N°': index + 1,
      Nom: student.lastName,
      Prénom: student.firstName,
      Classe: student.class,
    }))
  );

  if (rows.length === 0) return;

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Répartition');
  XLSX.writeFile(workbook, `repartition_salles_${Date.now()}.xlsx`);
}

const refresh = () => salleStore.fetchAll({ force: true });
</script>

<template>
  <div>
    <ExamenHeader
      title="Gestion des salles et horaires"
      subtitle="Répartition automatique des étudiants dans les salles d'examen."
      breadcrumb="Salles"
      :refresh="refresh"
    >
      <template #actions>
        <button class="btn btn-primary btn-sm px-3 ms-2" @click="openCreate">
          + Nouvelle salle
        </button>
      </template>
    </ExamenHeader>

    <div class="container-fluid my-2">
      <div class="row mb-4">
        <div class="col-12">
          <div
            class="d-flex align-items-center justify-content-between bg-white p-3 rounded shadow-sm border-start border-primary border-4"
          >
            <div>
              <h4 class="fw-bold text-dark mb-1">Planification des Salles</h4>
              <p class="text-muted small mb-0">
                Répartissez automatiquement vos listes d'étudiants (Excel/CSV) au sein de vos
                infrastructures d'examen.
              </p>
            </div>
            <i class="bi bi-building-gear fs-2 text-primary-subtle"></i>
          </div>
        </div>
      </div>

      <div class="row">
        <div class="col-md-12 grid margin stretch-card">
          <div class="card">
            <div class="card-body">
              <div class="row g-2">
                <div class="col-lg-5 col-md-6">
                  <div class="card border-0 shadow-sm mb-4 bg-white">
                    <div class="card-header bg-white py-3 border-bottom-0">
                      <h6 class="fw-bold text-dark mb-0">
                        <i class="bi bi-sliders me-2 text-secondary"></i>1. Critères de
                        Configuration
                      </h6>
                    </div>
                    <div class="card-body pt-0">
                      <label class="form-label text-xs fw-semibold">Salles mobilisées</label>

                      <div v-if="loading" class="text-muted small">Chargement des salles…</div>

                      <div v-else-if="salles.length === 0" class="alert alert-warning py-2 small">
                        Aucune salle n'est déclarée. Créez-en une avec « + Nouvelle salle ».
                      </div>

                      <div v-else class="list-group list-group-flush border rounded mb-3">
                        <label
                          v-for="salle in salles"
                          :key="salle.id"
                          class="list-group-item d-flex justify-content-between align-items-center py-2"
                        >
                          <span class="d-flex align-items-center">
                            <input
                              v-model="sallesRetenues"
                              class="form-check-input me-2 mt-0"
                              type="checkbox"
                              :value="salle.id"
                            />
                            <span>
                              <span class="fw-semibold text-dark">{{ salle.code_salle }}</span>
                              <small class="text-muted d-block text-xs">
                                {{ salle.batiment }} · {{ salle.type }}
                              </small>
                            </span>
                          </span>

                          <span class="d-flex align-items-center gap-2">
                            <span class="badge bg-light text-dark border">
                              {{ salle.capacite }} places
                            </span>
                            <button
                              type="button"
                              class="btn btn-link btn-sm p-0 text-secondary"
                              title="Modifier la salle"
                              @click.prevent="openEdit(salle)"
                            >
                              <i class="bi bi-pencil"></i>
                            </button>
                          </span>
                        </label>
                      </div>

                      <label class="form-label text-xs fw-semibold">Mode de Répartition</label>
                      <select v-model="distributionMode" class="form-select form-select-sm">
                        <option value="mixed">
                          Mélanger toutes les classes (Brassage complet)
                        </option>
                        <option value="byClass">Regrouper par classe (Blocs homogènes)</option>
                        <option value="byClassMixed">
                          Mélanger à l'intérieur de chaque classe
                        </option>
                      </select>
                    </div>
                  </div>

                  <div class="card border-0 shadow-sm bg-white">
                    <div class="card-header bg-white py-3 border-bottom-0">
                      <h6 class="fw-bold text-dark mb-0">
                        <i class="bi bi-file-earmark-excel me-2 text-secondary"></i>2. Fichiers
                        Étudiants
                      </h6>
                    </div>
                    <div class="card-body pt-0">
                      <div
                        class="drag-drop-area border border-dashed rounded p-4 text-center cursor-pointer mb-3"
                        :class="{ 'border-primary bg-primary-subtle': isDragging }"
                        @dragover.prevent
                        @dragenter.prevent="isDragging = true"
                        @dragleave="isDragging = false"
                        @drop.prevent="handleDrop"
                        @click="openFileInput"
                      >
                        <i class="bi bi-cloud-arrow-up-fill text-primary fs-2 mb-2 d-block"></i>
                        <p class="text-muted small mb-1">
                          Glissez-déposez vos fichiers Excel ici ou
                          <span class="text-primary fw-semibold">parcourez</span>
                        </p>
                        <span class="text-xs text-muted">Formats acceptés : .xlsx, .csv</span>

                        <input
                          ref="fileInput"
                          type="file"
                          hidden
                          multiple
                          accept=".csv, .xlsx"
                          @change="handleFileUpload"
                        />
                      </div>

                      <div v-if="uploadedFiles.length > 0">
                        <span class="text-xs fw-bold text-secondary d-block mb-2">
                          Fichiers Enregistrés ({{ uploadedFiles.length }}) :
                        </span>
                        <div class="list-group list-group-flush border rounded overflow-hidden">
                          <div
                            v-for="(file, index) in uploadedFiles"
                            :key="index"
                            class="list-group-item d-flex justify-content-between align-items-center p-2 text-sm"
                          >
                            <div class="text-truncate me-2">
                              <i class="bi bi-filetype-xlsx text-success me-2"></i>{{ file.name }}
                            </div>
                            <button
                              class="btn btn-link text-danger p-0"
                              @click.stop="removeFile(index)"
                            >
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
                        <i class="bi bi-pie-chart me-2 text-secondary"></i>3. Statut & Analyse
                        Capacité
                      </h6>
                    </div>
                    <div class="card-body d-flex flex-column justify-content-between">
                      <div class="row g-3">
                        <div class="col-sm-6">
                          <div class="p-3 border rounded bg-light">
                            <span class="text-muted text-xs d-block text-uppercase fw-bold">
                              Étudiants Importés
                            </span>
                            <span class="fs-3 fw-bold text-dark">{{ totalStudents }}</span>
                          </div>
                        </div>
                        <div class="col-sm-6">
                          <div class="p-3 border rounded bg-light">
                            <span class="text-muted text-xs d-block text-uppercase fw-bold">
                              Places Disponibles
                            </span>
                            <span class="fs-3 fw-bold text-dark">{{ totalCapacity }}</span>
                            <small class="text-muted d-block text-xs">
                              {{ sallesActives.length }} salle(s) mobilisée(s)
                            </small>
                          </div>
                        </div>

                        <div class="col-12">
                          <div
                            v-if="totalStudents === 0"
                            class="alert alert-light border text-center p-4 small text-muted"
                          >
                            <i class="bi bi-hdd me-2"></i>En attente de chargement de listes
                            d'étudiants pour exécuter l'analyse.
                          </div>
                          <div
                            v-else-if="hasCapacityOverflow"
                            class="alert alert-danger-subtle border border-danger text-dark d-flex align-items-center"
                          >
                            <i class="bi bi-exclamation-triangle-fill text-danger me-3 fs-4"></i>
                            <div class="small">
                              <strong class="text-danger">Capacité insuffisante !</strong> Votre
                              volume d'étudiants ({{ totalStudents }}) excède la capacité des salles
                              mobilisées ({{ totalCapacity }} places). Mobilisez d'autres salles.
                            </div>
                          </div>
                          <div
                            v-else
                            class="alert alert-success-subtle border border-success text-dark d-flex align-items-center"
                          >
                            <i class="bi bi-check-circle-fill text-success me-3 fs-4"></i>
                            <div class="small">
                              <strong>Taille conforme :</strong> les salles mobilisées couvrent les
                              listes d'étudiants importées.
                            </div>
                          </div>
                        </div>
                      </div>

                      <div class="pt-4 text-end border-top">
                        <button
                          class="btn btn-primary px-4 fw-medium btn-sm"
                          :disabled="!canDistribute"
                          @click="distributeStudents"
                        >
                          <i class="bi bi-cpu me-2"></i>Lancer la Répartition Automatique
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="distributionResults.length > 0" class="row mt-4">
        <div class="col-12">
          <div class="card border-0 shadow-sm bg-white">
            <div
              class="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center"
            >
              <h6 class="fw-bold text-dark mb-0">
                <i class="bi bi-check-all text-success me-2"></i>Résultats de la Répartition des
                Salles
              </h6>
              <button class="btn btn-success btn-sm px-3 font-semibold" @click="exportResults">
                <i class="bi bi-file-earmark-arrow-down me-1"></i> Exporter la feuille Excel (.xlsx)
              </button>
            </div>

            <div class="card-body">
              <div id="distributionAccordion" class="accordion custom-accordion">
                <div
                  v-for="(room, index) in distributionResults"
                  :key="room.salle.id"
                  class="accordion-item border mb-2 rounded overflow-hidden"
                >
                  <h2 class="accordion-header">
                    <button
                      class="accordion-button bg-light font-semibold text-dark text-sm py-2 px-3"
                      type="button"
                      data-bs-toggle="collapse"
                      :data-bs-target="'#roomCollapse' + index"
                      :aria-expanded="index === 0 ? 'true' : 'false'"
                    >
                      <div class="d-flex justify-content-between w-100 align-items-center pe-3">
                        <span>
                          <i class="bi bi-door-closed me-2 text-secondary"></i>
                          {{ room.salle.code_salle }}
                          <small class="text-muted">— {{ room.salle.batiment }}</small>
                        </span>
                        <span class="badge bg-secondary-subtle text-secondary rounded-pill text-xs">
                          {{ room.students.length }} / {{ room.capacite }} Étudiants
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
                              <th class="ps-4" style="width: 80px">N°</th>
                              <th>Nom & Prénoms</th>
                              <th>Classe Assignée</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr v-for="(student, sIndex) in room.students" :key="sIndex">
                              <td class="ps-4 fw-medium text-secondary">{{ sIndex + 1 }}</td>
                              <td class="fw-bold text-dark">
                                {{ student.lastName }} {{ student.firstName }}
                              </td>
                              <td>
                                <span class="badge bg-light text-dark border fw-normal">
                                  {{ student.class }}
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
            </div>
          </div>
        </div>
      </div>
    </div>

    <SalleFormModal />
  </div>
</template>

<style scoped>
.text-xs {
  font-size: 11px;
}
.text-sm {
  font-size: 0.875rem;
}
.drag-drop-area {
  cursor: pointer;
  border-style: dashed !important;
}
</style>
