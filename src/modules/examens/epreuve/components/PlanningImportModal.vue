<script setup>
import { computed, ref } from 'vue';
import { storeToRefs } from 'pinia';
import Pagination from '@/components/shared/Pagination.vue';
import { usePagination } from '@/shared/composables/usePagination';
import { useImportFile, IMPORT_ACCEPT } from '@/shared/composables/useImportFile';
import { closeModal } from '@/shared/utils/modal';
import { useModuleStore } from '@/modules/matieres/store';
import { useEpreuveStore } from '../store';
import { useSessionStore } from '../../session/store';
import {
  dateISO,
  IMPORT_PLANNING_SCHEMA,
  PLANNING_IMPORT_MODAL_ID,
  TYPES_EPREUVE,
} from '../../constants';

/**
 * Import par lot d'un planning d'épreuves (.xlsx / .xls / .csv).
 *
 * Le fichier désigne le module et la session par leur **code** ; la résolution
 * en identifiants se fait ici, à l'envoi, contre les référentiels déjà chargés
 * (`GET /modules`, `GET /sessions`). Une correspondance introuvable devient un
 * rejet motivé — « code_module ULM404 introuvable » — plutôt qu'un 400 opaque du
 * serveur.
 *
 * Les contrôles de forme (colonnes obligatoires, type d'épreuve, bornes de la
 * pondération, date lisible) sont faits par `useImportFile` avant l'envoi : une
 * ligne fautive repérée ici évite un aller-retour, et le serveur refait de toute
 * façon ses propres contrôles.
 *
 * ⚠️ Il n'existe pas de route d'import côté serveur pour les évaluations : les
 * lignes sont créées une par une. Voir `importPlanning` dans le store — l'import
 * n'est donc **pas atomique**, ce que la modale annonce.
 */

const epreuveStore = useEpreuveStore();
const sessionStore = useSessionStore();
const moduleStore = useModuleStore();

const { items: sessions } = storeToRefs(sessionStore);
const { items: modules } = storeToRefs(moduleStore);
const { importReport, loading } = storeToRefs(epreuveStore);

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
} = useImportFile(IMPORT_PLANNING_SCHEMA, 'planning_epreuves');

const fileInput = ref(null);

sessionStore.fetchAll();
moduleStore.fetchAll();

const summary = computed(() => importReport.value?.summary ?? null);
const echecs = computed(() => importReport.value?.details?.echecs ?? []);

const {
  page: pageInvalides,
  itemsPerPage: parPageInvalides,
  paginated: invalidRowsPagines,
} = usePagination(invalidRows, { perPage: 5 });

const {
  page: pageEchecs,
  itemsPerPage: parPageEchecs,
  paginated: echecsPagines,
} = usePagination(echecs, { perPage: 5 });

/** Index des référentiels par code, en majuscules : un classeur mélange les casses. */
const sessionsParCode = computed(
  () =>
    new Map(sessions.value.map((session) => [String(session.code ?? '').toUpperCase(), session]))
);

const modulesParCode = computed(
  () => new Map(modules.value.map((module) => [String(module.code ?? '').toUpperCase(), module]))
);

function clearFile() {
  reset();
  epreuveStore.clearImportReport();
  // Sans cette remise à zéro, resélectionner le même fichier n'émettrait pas
  // d'événement `change` et le formulaire paraîtrait figé.
  if (fileInput.value) fileInput.value.value = '';
}

function fermer() {
  closeModal(PLANNING_IMPORT_MODAL_ID);
  clearFile();
}

/**
 * Traduit les lignes du classeur en charges utiles `POST /evaluation`.
 * Les lignes dont un code reste introuvable ne sont pas envoyées : elles sont
 * rendues telles quelles comme rejets, avec leur motif.
 */
function preparer() {
  const aEnvoyer = [];
  const rejets = [];

  rows.value.forEach((row, index) => {
    // +2 : la ligne 1 du classeur porte les en-têtes, et l'opérateur compte à
    // partir de 1. C'est le numéro qu'il lit dans son tableur.
    const numero = index + 2;
    const libelle = String(row.designation ?? '').trim();

    const session = sessionsParCode.value.get(
      String(row.code_session ?? '')
        .toUpperCase()
        .trim()
    );
    const module = modulesParCode.value.get(
      String(row.code_module ?? '')
        .toUpperCase()
        .trim()
    );

    if (!session || !module) {
      rejets.push({
        ligne: numero,
        epreuve: libelle || '—',
        erreur: !session
          ? `code_session « ${row.code_session} » introuvable`
          : `code_module « ${row.code_module} » introuvable`,
      });
      return;
    }

    aEnvoyer.push({
      numero,
      libelle,
      payload: {
        session_id: session.id,
        module_id: module.id,
        type_eval: String(row.type_eval).trim().toUpperCase(),
        designation: libelle,
        ponderation: Number(row.ponderation),
        date_prevue: dateISO(row.date_prevue),
      },
    });
  });

  return { aEnvoyer, rejets };
}

async function submit() {
  if (!isReady.value || loading.value) return;

  // Les lignes dont un code reste introuvable ne partent pas ; le store les
  // reprend telles quelles dans le compte rendu.
  const { aEnvoyer, rejets } = preparer();
  await epreuveStore.importPlanning(aEnvoyer, rejets);
}

/** @param {number} bytes @returns {string} */
function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}
</script>

<template>
  <div :id="PLANNING_IMPORT_MODAL_ID" class="modal fade" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered modal-xl modal-dialog-scrollable">
      <div class="modal-content border-0 shadow-lg">
        <div class="modal-header bg-dark text-white">
          <h5 class="modal-title">
            <i class="bi bi-file-earmark-arrow-up me-2"></i>
            Importer un planning d'épreuves
          </h5>
          <button
            type="button"
            class="btn-close btn-close-white"
            aria-label="Fermer"
            :disabled="loading"
            @click="fermer"
          ></button>
        </div>

        <div class="modal-body p-4">
          <div class="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3">
            <p class="text-muted small mb-0">
              Une ligne par épreuve. Le module et la session sont désignés par leur
              <strong>code</strong>, pas par leur identifiant.
            </p>
            <button
              type="button"
              class="btn btn-sm btn-outline-secondary"
              @click="downloadTemplate"
            >
              <i class="mdi mdi-download me-1"></i> Télécharger le modèle
            </button>
          </div>

          <div class="alert alert-light border small d-flex align-items-start gap-2">
            <i class="bi bi-info-circle text-primary mt-1"></i>
            <div>
              Colonnes attendues :
              <code v-for="column in schema.columns" :key="column" class="me-2">{{ column }}</code>
              <div class="mt-1">
                <code>type_eval</code> parmi
                <strong>{{ TYPES_EPREUVE.map((type) => type.code).join(', ') }}</strong> ·
                <code>ponderation</code> entre 0 et 100 · <code>date_prevue</code> facultative, au
                format <strong>AAAA-MM-JJ</strong>.
              </div>
            </div>
          </div>

          <!-- Dépôt du fichier -->
          <div
            class="drop-zone rounded p-4 text-center"
            :class="{ 'drop-zone--active': isDragging }"
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @drop.prevent="onDrop"
          >
            <i class="mdi mdi-cloud-upload-outline fs-1 text-primary d-block mb-2"></i>
            <p class="mb-1 fw-semibold">Glissez le fichier ici</p>
            <p class="text-muted small mb-3">ou</p>
            <label class="btn btn-outline-primary btn-sm mb-0">
              Parcourir…
              <input
                ref="fileInput"
                type="file"
                class="d-none"
                :accept="IMPORT_ACCEPT"
                @change="onFileChange"
              />
            </label>
            <div class="text-muted small mt-2">Formats acceptés : {{ IMPORT_ACCEPT }}</div>
          </div>

          <div v-if="errorMessage" class="alert alert-danger mt-3 mb-0" role="alert">
            <i class="mdi mdi-alert-circle me-1"></i> {{ errorMessage }}
          </div>

          <div
            v-if="selectedFile"
            class="d-flex align-items-center justify-content-between border rounded p-3 mt-3"
          >
            <div class="d-flex align-items-center gap-2">
              <i class="mdi mdi-file-excel-outline fs-4 text-success"></i>
              <div>
                <div class="fw-semibold">{{ selectedFile.name }}</div>
                <div class="text-muted small">
                  {{ formatSize(selectedFile.size) }} · {{ rows.length }} ligne(s) lue(s)
                </div>
              </div>
            </div>

            <div class="d-flex gap-2">
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
                class="btn btn-sm btn-primary"
                :disabled="!isReady || loading"
                @click="submit"
              >
                <span
                  v-if="loading"
                  class="spinner-border spinner-border-sm me-2"
                  aria-hidden="true"
                ></span>
                {{ loading ? 'Import en cours…' : 'Lancer l’import' }}
              </button>
            </div>
          </div>

          <!-- Lignes fautives repérées avant l'envoi -->
          <div v-if="hasErrors" class="alert alert-danger mt-3 mb-0">
            <h6 class="alert-heading fw-bold">
              <i class="mdi mdi-alert me-1"></i>
              {{ invalidRows.length }} ligne(s) à corriger avant l’envoi
            </h6>
            <div class="table-responsive mt-2">
              <table class="table table-sm mb-0 align-middle bg-white">
                <thead>
                  <tr>
                    <th scope="col" style="width: 10rem">Session</th>
                    <th scope="col" style="width: 10rem">Module</th>
                    <th scope="col">Épreuve</th>
                    <th scope="col">Problème</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(row, index) in invalidRowsPagines" :key="index">
                    <td>{{ row.code_session || '—' }}</td>
                    <td>{{ row.code_module || '—' }}</td>
                    <td>{{ row.designation || '—' }}</td>
                    <td class="small">{{ row._errors.join(', ') }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <Pagination
              v-model="pageInvalides"
              v-model:items-per-page="parPageInvalides"
              :total-items="invalidRows.length"
              :items-per-page-options="[5, 10, 20]"
            />
          </div>

          <!-- Aperçu : les cinq premières lignes, le temps de vérifier les colonnes -->
          <div v-else-if="preview.length" class="mt-3">
            <div class="fw-semibold small mb-2">
              Aperçu des {{ preview.length }} premières lignes
            </div>
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

          <!-- Compte rendu -->
          <div v-if="summary" class="mt-3">
            <div
              class="alert mb-0"
              :class="summary.totalEchecs > 0 ? 'alert-warning' : 'alert-success'"
            >
              <h6 class="alert-heading fw-bold">
                <i
                  class="mdi me-1"
                  :class="summary.totalEchecs > 0 ? 'mdi-alert' : 'mdi-check-circle'"
                ></i>
                {{ summary.totalSucces }}/{{ summary.totalTraite }} épreuve(s) planifiée(s)
                <span v-if="summary.totalEchecs > 0"> — {{ summary.totalEchecs }} rejetée(s) </span>
              </h6>

              <p v-if="summary.totalEchecs > 0" class="small mb-0">
                Les lignes acceptées ont bien été créées : corrigez les lignes ci-dessous, puis
                réimportez <strong>uniquement celles-ci</strong> — sans quoi les épreuves déjà
                planifiées le seront en double.
              </p>

              <div v-if="echecs.length" class="table-responsive mt-2">
                <table class="table table-sm mb-0 align-middle bg-white">
                  <thead>
                    <tr>
                      <th scope="col" style="width: 6rem">Ligne</th>
                      <th scope="col">Épreuve</th>
                      <th scope="col">Motif du rejet</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="echec in echecsPagines" :key="echec.ligne">
                      <td class="fw-semibold">{{ echec.ligne }}</td>
                      <td>{{ echec.epreuve }}</td>
                      <td class="small">{{ echec.erreur }}</td>
                    </tr>
                  </tbody>
                </table>
                <Pagination
                  v-model="pageEchecs"
                  v-model:items-per-page="parPageEchecs"
                  :total-items="echecs.length"
                  :items-per-page-options="[5, 10, 20]"
                />
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" :disabled="loading" @click="fermer">
            Fermer
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
  border-color: #4b49ac;
  background-color: rgba(75, 73, 172, 0.04);
}
</style>
