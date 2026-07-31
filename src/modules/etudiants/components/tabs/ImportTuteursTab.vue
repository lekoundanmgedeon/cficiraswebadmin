<script setup>
import { computed, ref } from 'vue';
import { useEtudiantStore } from '../../store';
import { useImportFile, IMPORT_ACCEPT } from '@/shared/composables/useImportFile';
import { IMPORT_TUTEURS_SCHEMA, LIENS_PARENTE } from '../../constants';

/**
 * Import par lot de tuteurs légaux.
 *
 * Le serveur exposait `POST /academique/imports/tuteurs` depuis le début, mais
 * **aucun écran ne l'appelait** : la seule référence vivait dans
 * `src/api/academique/academiqueApi.js`, un fichier que plus personne n'importe.
 * L'import de tuteurs était donc inatteignable depuis l'application.
 *
 * Le tuteur se rattache à l'étudiant par son **matricule** : il n'y a pas
 * d'année académique à choisir ici, contrairement à l'import d'étudiants.
 *
 * L'écran valide le fichier avant de l'envoyer (colonnes obligatoires, e-mail,
 * oui/non) : une ligne fautive détectée ici évite un aller-retour, et le serveur
 * refait de toute façon ses propres contrôles.
 */

const etudiantStore = useEtudiantStore();

const {
  schema,
  selectedFile,
  isDragging,
  rows,
  preview,
  invalidRows,
  hasErrors,
  isReady,
  errorMessage,
  onDrop,
  onFileChange,
  reset,
  downloadTemplate,
} = useImportFile(IMPORT_TUTEURS_SCHEMA, 'tuteurs');

const fileInput = ref(null);

const loading = computed(() => etudiantStore.loading);
const report = computed(() => etudiantStore.tuteursImportReport);
const summary = computed(() => report.value?.summary ?? null);
const echecs = computed(() => report.value?.details?.echecs ?? []);

function clearFile() {
  reset();
  // Sans cette remise à zéro, resélectionner le même fichier n'émettrait pas
  // d'événement `change` et le formulaire paraîtrait figé.
  if (fileInput.value) fileInput.value.value = '';
}

async function submit() {
  if (!isReady.value || loading.value) return;

  const result = await etudiantStore.importTuteursFromFile(selectedFile.value);

  // Un import partiellement rejeté renvoie quand même un rapport : on garde le
  // fichier à l'écran tant qu'il reste des lignes à corriger.
  if (result && (result.data?.summary?.totalEchecs ?? 0) === 0) clearFile();
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
    <div class="mb-4 d-flex justify-content-between align-items-start flex-wrap gap-2">
      <div>
        <h4 class="fw-bold mb-1">Import de tuteurs légaux</h4>
        <p class="text-muted small mb-0">
          Rattachez en une fois les tuteurs à leurs étudiants, par matricule.
        </p>
      </div>

      <button type="button" class="btn btn-outline-secondary btn-sm" @click="downloadTemplate">
        <i class="mdi mdi-download me-1"></i> Télécharger le modèle
      </button>
    </div>

    <div class="card border-0 shadow-sm">
      <div class="card-body">
        <div class="alert alert-light border small mb-3">
          <div class="fw-semibold mb-1">Colonnes attendues</div>
          <div class="mb-2">
            <code v-for="column in schema.columns" :key="column" class="me-2">
              {{ column }}
            </code>
          </div>
          <div class="text-muted">
            Obligatoires : <strong>{{ schema.required.join(', ') }}</strong
            >. Lien de parenté : {{ LIENS_PARENTE.join(', ') }}. Nationalité : code ISO sur 2
            lettres (ex. <code>CG</code>). Contact principal : oui / non.
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
            class="mdi mdi-account-supervisor-outline text-primary d-block mb-2"
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
              <small class="text-muted">
                {{ formatSize(selectedFile.size) }} — {{ rows.length }} ligne(s)
              </small>
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

            <button
              type="button"
              class="btn btn-primary"
              :disabled="!isReady || loading"
              @click="submit"
            >
              <span
                v-if="loading"
                class="spinner-border spinner-border-sm me-2"
                aria-hidden="true"
              ></span>
              {{ loading ? 'Import en cours...' : 'Lancer l’import' }}
            </button>
          </div>
        </div>

        <!-- Lignes fautives repérées avant l'envoi : le bouton reste bloqué
             tant qu'elles n'ont pas disparu du fichier. -->
        <div v-if="hasErrors" class="alert alert-danger mt-3 mb-0" role="alert">
          <h6 class="alert-heading fw-bold">
            <i class="mdi mdi-alert me-1"></i>
            {{ invalidRows.length }} ligne(s) à corriger avant l’envoi
          </h6>
          <div class="table-responsive mt-2">
            <table class="table table-sm mb-0 align-middle">
              <thead>
                <tr>
                  <th scope="col" style="width: 12rem">Matricule visé</th>
                  <th scope="col">Tuteur</th>
                  <th scope="col">Problème</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, index) in invalidRows" :key="index">
                  <td>{{ row.matricule_etudiant || '—' }}</td>
                  <td>{{ [row.nom, row.prenom].filter(Boolean).join(' ') || '—' }}</td>
                  <td class="small">{{ row._errors.join(', ') }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Aperçu : on ne montre que les premières lignes, le temps de vérifier
             que les colonnes ont bien été reconnues. -->
        <div v-else-if="preview.length" class="mt-3">
          <div class="fw-semibold small mb-2">Aperçu des {{ preview.length }} premières lignes</div>
          <div class="table-responsive">
            <table class="table table-sm table-bordered mb-0 align-middle">
              <thead>
                <tr>
                  <th v-for="column in schema.columns" :key="column" scope="col" class="small">
                    {{ column }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, index) in preview" :key="index">
                  <td v-for="column in schema.columns" :key="column" class="small">
                    {{ row[column] }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Compte rendu du serveur : les lignes rejetées et leur motif sont la
             seule information sur laquelle l'opérateur peut agir. -->
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
              {{ summary.totalSucces }}/{{ summary.totalTraite }} tuteur(s) rattaché(s)
              <span v-if="summary.totalEchecs > 0"> — {{ summary.totalEchecs }} rejeté(s) </span>
            </h6>

            <div v-if="echecs.length" class="table-responsive mt-2">
              <table class="table table-sm mb-0 align-middle">
                <thead>
                  <tr>
                    <th scope="col" style="width: 6rem">Ligne</th>
                    <th scope="col">Matricule visé</th>
                    <th scope="col">Tuteur</th>
                    <th scope="col">Motif du rejet</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="echec in echecs" :key="echec.ligne">
                    <td class="fw-semibold">{{ echec.ligne }}</td>
                    <td>{{ echec.matricule_cible }}</td>
                    <td>{{ echec.tuteur }}</td>
                    <td class="small">{{ echec.erreur }}</td>
                  </tr>
                </tbody>
              </table>
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
