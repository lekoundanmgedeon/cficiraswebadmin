<script setup>
import { computed, ref } from 'vue';
import { closeModal } from '@/shared/utils/modal';
import { useInscriptionStore } from '../store';
import { useImportFile } from '@/shared/composables/useImportFile';
import { IMPORT_ACCEPT, IMPORT_SCHEMAS } from '../constants';

/**
 * Import par lot — inscriptions neuves ou réinscriptions.
 *
 * `InscriptionsModal.vue` (500 lignes) et `ReinscriptionModal.vue` (429 lignes)
 * ne différaient que par leurs colonnes obligatoires, leur libellé et l'action
 * de store appelée. Ils sont réunis ici, pilotés par `kind`.
 *
 * Le second était de toute façon inopérant : il appelait
 * `inscriptionStore.bulkImportReinscriptions()`, **une action qui n'existait pas
 * dans le store**. L'appel levait un `TypeError` capté par un `catch` qui ne
 * remplissait `importReport` que sur une erreur HTTP structurée — l'utilisateur
 * voyait donc le spinner s'arrêter, et rien d'autre.
 */

const props = defineProps({
  /** @type {import('vue').PropType<'inscriptions'|'reinscriptions'>} */
  kind: { type: String, required: true },
  modalId: { type: String, required: true },
});

const store = useInscriptionStore();

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
} = useImportFile(IMPORT_SCHEMAS[props.kind], props.kind);

const fileInput = ref(null);
const codeAnnee = ref('');

const isReinscription = computed(() => props.kind === 'reinscriptions');

const title = computed(() =>
  isReinscription.value ? 'Réinscrire un lot d’étudiants' : 'Importer un lot d’inscriptions'
);

const loading = computed(() => store.loading);
const report = computed(() => store.importReport);

/** L'année cible est obligatoire côté serveur (`code_annee`). */
const canSubmit = computed(
  () => isReady.value && Boolean(codeAnnee.value.trim()) && !loading.value
);

async function submit() {
  if (!canSubmit.value) return;

  const action = isReinscription.value ? store.importReinscriptions : store.importInscriptions;
  const result = await action(selectedFile.value, codeAnnee.value.trim());

  // Un import partiellement rejeté renvoie quand même un rapport : on garde la
  // modale ouverte pour que l'utilisateur puisse lire les lignes en échec.
  if (result && (result.summary?.totalEchecs ?? 0) === 0) {
    closeAndReset();
  }
}

function closeAndReset() {
  closeModal(props.modalId);
  reset();
  store.importReport = null;
}

/** @param {any} value */
function cell(value) {
  return value instanceof Date ? value.toLocaleDateString('fr-FR') : value;
}
</script>

<template>
  <div :id="modalId" class="modal fade" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered modal-xl">
      <div class="modal-content">
        <div class="modal-header bg-primary text-white">
          <h5 class="modal-title">{{ title }}</h5>
          <button
            type="button"
            class="btn-close btn-close-white"
            data-bs-dismiss="modal"
            aria-label="Fermer"
            @click="closeAndReset"
          ></button>
        </div>

        <div class="modal-body">
          <!-- Bilan d'import : remplace le formulaire une fois l'appel abouti. -->
          <div v-if="report">
            <div
              class="alert d-flex align-items-center"
              :class="(report.summary?.totalEchecs ?? 0) > 0 ? 'alert-warning' : 'alert-success'"
            >
              <i class="mdi mdi-check-circle me-2 fs-4"></i>
              <div>
                <strong>{{ report.summary?.totalTraite ?? 0 }}</strong> ligne(s) traitée(s) —
                <strong class="text-success">{{ report.summary?.totalSucces ?? 0 }}</strong>
                créée(s),
                <strong class="text-danger">{{ report.summary?.totalEchecs ?? 0 }}</strong>
                rejetée(s).
              </div>
            </div>

            <div v-if="report.details?.echecs?.length" class="table-responsive">
              <table class="table table-sm align-middle">
                <thead class="table-light">
                  <tr>
                    <th>Ligne</th>
                    <th>Étudiant</th>
                    <th>Motif du rejet</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(echec, index) in report.details.echecs" :key="index">
                    <td class="text-muted small">{{ echec.ligne ?? '—' }}</td>
                    <td>{{ echec.etudiant ?? echec.matricule ?? '—' }}</td>
                    <td class="text-danger small">{{ echec.erreur ?? '—' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Formulaire d'import -->
          <div v-else>
            <div class="row mb-3">
              <div class="col-md-6">
                <label :for="`${modalId}-annee`" class="form-label">
                  Année académique cible <span class="text-danger">*</span>
                </label>
                <input
                  :id="`${modalId}-annee`"
                  v-model="codeAnnee"
                  type="text"
                  class="form-control"
                  placeholder="Ex : 2025-2026"
                />
              </div>

              <div class="col-md-6 d-flex align-items-end justify-content-md-end">
                <button type="button" class="btn btn-outline-secondary" @click="downloadTemplate">
                  <i class="mdi mdi-file-excel me-1"></i> Télécharger le modèle Excel
                </button>
              </div>
            </div>

            <div
              class="drop-zone rounded p-4 text-center mb-3"
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

              <p class="text-muted mb-2">
                Glissez un fichier ici, ou
                <button
                  type="button"
                  class="btn btn-link p-0 align-baseline"
                  @click="fileInput.click()"
                >
                  parcourez vos fichiers
                </button>
              </p>

              <small class="text-muted d-block">
                Colonnes attendues : <code>{{ schema.columns.join(', ') }}</code>
              </small>

              <input
                ref="fileInput"
                type="file"
                hidden
                :accept="IMPORT_ACCEPT"
                @change="onFileChange"
              />
            </div>

            <div v-if="errorMessage" class="alert alert-danger" role="alert">
              <i class="mdi mdi-alert-circle me-1"></i> {{ errorMessage }}
            </div>

            <div v-if="selectedFile && rows.length" class="mb-2">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <span class="fw-semibold text-dark">
                  {{ selectedFile.name }} — {{ rows.length }} ligne(s)
                </span>

                <span v-if="hasErrors" class="badge bg-danger-subtle text-danger">
                  {{ invalidRows.length }} ligne(s) invalide(s)
                </span>
                <span v-else class="badge bg-success-subtle text-success">
                  Toutes les lignes sont valides
                </span>
              </div>

              <div class="table-responsive border rounded">
                <table class="table table-sm align-middle mb-0">
                  <thead class="table-light">
                    <tr>
                      <th v-for="column in schema.columns" :key="column">{{ column }}</th>
                      <th>Erreurs</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="(row, index) in preview"
                      :key="index"
                      :class="{ 'table-danger': row._errors.length }"
                    >
                      <td v-for="column in schema.columns" :key="column" class="small">
                        {{ cell(row[column]) }}
                      </td>
                      <td class="small text-danger">{{ row._errors.join(', ') || '—' }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <small v-if="rows.length > preview.length" class="text-muted d-block mt-2">
                Aperçu des {{ preview.length }} premières lignes sur {{ rows.length }}.
              </small>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button
            type="button"
            class="btn btn-secondary"
            data-bs-dismiss="modal"
            @click="closeAndReset"
          >
            {{ report ? 'Fermer' : 'Annuler' }}
          </button>

          <button
            v-if="!report"
            type="button"
            class="btn btn-primary"
            :disabled="!canSubmit"
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
