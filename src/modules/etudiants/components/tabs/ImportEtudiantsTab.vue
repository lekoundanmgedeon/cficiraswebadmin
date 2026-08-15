<script setup>
import { computed, onMounted, ref } from 'vue';
import Pagination from '@/components/shared/Pagination.vue';
import { usePagination } from '@/shared/composables/usePagination';
import { useEtudiantStore } from '../../store';
import { useAnneeStore } from '@/modules/structure-academique/annee/store';
import { IMPORT_ACCEPT } from '../../constants';

/**
 * Import d'une liste d'étudiants (.xlsx / .xls / .csv).
 *
 * Le composant précédent, `Tab/ImportEtudiantsContent.vue`, était **vide** : un
 * template et un script tous deux sans contenu. Son panneau d'onglet existait
 * bien dans le conteneur, mais aucun lien de navigation ne pointait dessus — il
 * était monté à chaque chargement de page et restait inatteignable.
 *
 * Le second candidat, `data-io/DropData.vue`, déclarait deux blocs de script
 * (un `setup` vide et une Options API), traînait les données de démonstration
 * du gabarit d'origine (« TASK-7103 : Parse EXE bandwidth! ») et son bouton
 * « Upload » n'avait **aucun gestionnaire** : les fichiers déposés n'étaient
 * jamais envoyés nulle part.
 *
 * Celui-ci envoie réellement le fichier à `POST /academique/imports/etudiants`.
 *
 * ⚠️ Il manquait l'année académique. Chaque ligne du fichier crée une
 * inscription, et une inscription n'existe que rattachée à une année : sans
 * `code_annee`, le serveur répondait 400 et **l'import n'aboutissait jamais**.
 * Le sélecteur ci-dessous comble ce trou, en proposant par défaut l'année
 * active.
 */

const etudiantStore = useEtudiantStore();
const anneeStore = useAnneeStore();

const fileInput = ref(null);
const isDragging = ref(false);
const selectedFile = ref(null);
const errorMessage = ref('');
const codeAnnee = ref('');

const loading = computed(() => etudiantStore.loading);
const report = computed(() => etudiantStore.importReport);
const annees = computed(() => anneeStore.items ?? []);

/** Lignes rejetées : la partie du compte rendu sur laquelle on peut agir. */
const echecs = computed(() => report.value?.details?.echecs ?? []);
const summary = computed(() => report.value?.summary ?? null);

// Un fichier de plusieurs centaines de lignes peut être rejeté en bloc : le
// compte rendu se lit alors page par page, comme n'importe quelle liste.
const { page, itemsPerPage, paginated: echecsPagines } = usePagination(echecs, { perPage: 10 });

onMounted(async () => {
  await anneeStore.fetchAll();
  // L'année active est le choix juste dans la quasi-totalité des cas ; elle
  // reste modifiable pour rattraper un import sur une année précédente.
  codeAnnee.value = anneeStore.activeAnnee?.code ?? annees.value[0]?.code ?? '';
});

const ACCEPTED_EXTENSIONS = IMPORT_ACCEPT.split(',');

/** @param {File} file @returns {boolean} */
function isAccepted(file) {
  // On valide sur l'extension et non sur le type MIME : celui d'un .xlsx varie
  // d'un système à l'autre (et vaut souvent `application/octet-stream`), si bien
  // que l'ancien contrôle par `file.type` rejetait des fichiers parfaitement
  // valides.
  const name = file.name.toLowerCase();
  return ACCEPTED_EXTENSIONS.some((extension) => name.endsWith(extension));
}

/** @param {File|undefined} file */
function selectFile(file) {
  errorMessage.value = '';

  if (!file) return;

  if (!isAccepted(file)) {
    errorMessage.value = `Format non pris en charge. Attendu : ${IMPORT_ACCEPT}.`;
    selectedFile.value = null;
    return;
  }

  selectedFile.value = file;
}

/** @param {DragEvent} event */
function onDrop(event) {
  isDragging.value = false;
  selectFile(event.dataTransfer?.files?.[0]);
}

/** @param {Event} event */
function onFileChange(event) {
  selectFile(event.target.files?.[0]);
}

function clearFile() {
  selectedFile.value = null;
  errorMessage.value = '';
  // Sans cette remise à zéro, resélectionner le même fichier n'émettrait pas
  // d'événement `change` et le formulaire paraîtrait figé.
  if (fileInput.value) fileInput.value.value = '';
}

async function submit() {
  if (!selectedFile.value) return;

  if (!codeAnnee.value) {
    errorMessage.value = "Choisissez l'année académique de rattachement.";
    return;
  }

  const result = await etudiantStore.importFromFile(selectedFile.value, codeAnnee.value);
  if (result !== undefined) clearFile();
}

/** @param {number} bytes @returns {string} */
function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}
</script>

<template>
  <div>
    <div class="mb-4">
      <h4 class="fw-bold mb-1">Import d'étudiants</h4>
      <p class="text-muted small mb-0">
        Chargez une liste d'étudiants au format Excel ou CSV. Les lignes seront créées côté serveur.
      </p>
    </div>

    <div class="card border-0 shadow-sm">
      <div class="card-body">
        <div class="row g-3 mb-3">
          <div class="col-md-5">
            <label for="import-code-annee" class="form-label small fw-semibold">
              Année académique de rattachement
            </label>
            <select id="import-code-annee" v-model="codeAnnee" class="form-select">
              <option value="" disabled>Choisir une année…</option>
              <option v-for="annee in annees" :key="annee.id" :value="annee.code">
                {{ annee.code }}{{ annee.est_active ? ' (active)' : '' }}
              </option>
            </select>
            <small class="text-muted">
              Chaque ligne du fichier crée une inscription pour cette année.
            </small>
          </div>
        </div>

        <div
          class="drop-zone rounded p-5 text-center"
          :class="{ 'drop-zone--active': isDragging }"
          @dragover.prevent
          @dragenter.prevent="isDragging = true"
          @dragleave="isDragging = false"
          @drop.prevent="onDrop"
        >
          <i
            class="mdi mdi-cloud-upload-outline text-primary d-block mb-2"
            style="font-size: 2.5rem"
          ></i>

          <p class="text-muted mb-3">
            Glissez un fichier ici, ou
            <button
              type="button"
              class="btn btn-link p-0 align-baseline"
              @click="fileInput.click()"
            >
              parcourez vos fichiers
            </button>
          </p>

          <small class="text-muted d-block">Formats acceptés : {{ IMPORT_ACCEPT }}</small>

          <input
            ref="fileInput"
            type="file"
            hidden
            :accept="IMPORT_ACCEPT"
            @change="onFileChange"
          />
        </div>

        <div v-if="errorMessage" class="alert alert-danger mt-3 mb-0" role="alert">
          <i class="mdi mdi-alert-circle me-1"></i> {{ errorMessage }}
        </div>

        <div
          v-if="selectedFile"
          class="d-flex align-items-center justify-content-between border rounded p-3 mt-3"
        >
          <div class="d-flex align-items-center">
            <i
              class="mdi mdi-file-document-outline text-primary me-3"
              style="font-size: 1.5rem"
            ></i>
            <div>
              <div class="fw-semibold text-dark">{{ selectedFile.name }}</div>
              <small class="text-muted">{{ formatSize(selectedFile.size) }}</small>
            </div>
          </div>

          <div class="d-flex align-items-center gap-2">
            <button
              type="button"
              class="btn btn-sm btn-outline-secondary"
              :disabled="loading"
              @click="clearFile"
            >
              Retirer
            </button>

            <button type="button" class="btn btn-primary" :disabled="loading" @click="submit">
              <span
                v-if="loading"
                class="spinner-border spinner-border-sm me-2"
                aria-hidden="true"
              ></span>
              {{ loading ? 'Import en cours...' : 'Lancer l’import' }}
            </button>
          </div>
        </div>

        <!--
          Le compte rendu était affiché en JSON brut dans un <pre>. Or ce qui
          compte pour l'opérateur, ce sont les lignes **rejetées** et leur
          motif : c'est la seule information sur laquelle il peut agir pour
          corriger son fichier et relancer.
        -->
        <div v-if="summary" class="mt-3">
          <div
            class="alert mb-0"
            :class="summary.totalEchecs > 0 ? 'alert-warning' : 'alert-success'"
            role="alert"
          >
            <h6 class="alert-heading fw-bold">
              <i
                class="mdi me-1"
                :class="summary.totalEchecs > 0 ? 'mdi-alert' : 'mdi-check-circle'"
              ></i>
              {{ summary.totalSucces }}/{{ summary.totalTraite }} ligne(s) intégrée(s)
              <span v-if="summary.totalEchecs > 0"> — {{ summary.totalEchecs }} rejetée(s) </span>
            </h6>

            <div v-if="echecs.length" class="table-responsive mt-2">
              <table class="table table-sm mb-0 align-middle">
                <thead>
                  <tr>
                    <th scope="col" style="width: 6rem">Ligne</th>
                    <th scope="col">Étudiant</th>
                    <th scope="col">Motif du rejet</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="echec in echecsPagines" :key="echec.ligne">
                    <td class="fw-semibold">{{ echec.ligne }}</td>
                    <td>{{ echec.etudiant }}</td>
                    <td class="small">{{ echec.erreur }}</td>
                  </tr>
                </tbody>
              </table>

              <Pagination
                v-model="page"
                v-model:items-per-page="itemsPerPage"
                :total-items="echecs.length"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.drop-zone {
  border: 2px dashed #dee2e6;
  transition: all 0.2s ease-in-out;
}

.drop-zone--active {
  border-color: var(--bs-primary);
  background-color: rgba(75, 73, 172, 0.04);
}
</style>
