<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import * as XLSX from 'xlsx';
import Pagination from '@/components/shared/Pagination.vue';
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue';
import { useNotificationStore } from '@/shared/stores/notificationStore';
import { formatDate } from '@/shared/utils/date';
import { useCandidatStore } from '../store';
import { IMPORT_ACCEPT, sexeLabel } from '../../constants';

const props = defineProps({
  concoursId: { type: String, required: true },
});

/**
 * Candidatures d'un concours : import par lot et consultation.
 *
 * La mise en page — modèle Excel, zone d'import, tableau paginé — est celle de
 * l'original. Deux défauts corrigés :
 *
 * - L'import appelait `POST /candidats/import`, **une route commentée côté
 *   backend** : il répondait 404 alors que son contrôleur était bien
 *   implémenté. La route a été rétablie.
 * - Le bouton « Supprimer » ne supprimait **rien** : il retirait la ligne du
 *   tableau local et annonçait « Candidat masqué de la liste locale ». Elle
 *   réapparaissait au rechargement. Et pour cause — **il n'existe aucun
 *   `DELETE /candidats/:id`**. Le bouton a été retiré plutôt que laissé à
 *   mentir.
 */

const candidatStore = useCandidatStore();
const notifications = useNotificationStore();

const { items: candidats, loading } = storeToRefs(candidatStore);

const fileInput = ref(null);
const selectedFile = ref(null);
const dernierImport = ref('');

const currentPage = ref(1);
const itemsPerPage = ref(10);

onMounted(() => candidatStore.fetchByConcours(props.concoursId));

watch(
  () => props.concoursId,
  (id) => {
    currentPage.value = 1;
    candidatStore.fetchByConcours(id);
  }
);

const startIndex = computed(() => (currentPage.value - 1) * itemsPerPage.value);

const paginatedCandidats = computed(() =>
  candidats.value.slice(startIndex.value, startIndex.value + itemsPerPage.value)
);

const triggerFileSelect = () => fileInput.value?.click();

function handleFileChange(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const accepted = IMPORT_ACCEPT.split(',').some((extension) =>
    file.name.toLowerCase().endsWith(extension)
  );

  if (!accepted) {
    notifications.notifyError(`Format non pris en charge. Attendu : ${IMPORT_ACCEPT}.`);
    return;
  }

  selectedFile.value = file;
}

function cancelSelection() {
  selectedFile.value = null;
  // Sans cette remise à zéro, resélectionner le même fichier n'émettrait pas
  // d'événement `change` et le formulaire paraîtrait figé.
  if (fileInput.value) fileInput.value.value = '';
}

async function uploadFile() {
  if (!selectedFile.value) return;

  const result = await candidatStore.importCandidatsFile(selectedFile.value, props.concoursId);

  // `run()` renvoie `undefined` sur échec : on ne réinitialise que si ça a marché.
  if (result === undefined) return;

  cancelSelection();
  currentPage.value = 1;

  dernierImport.value = new Date().toLocaleString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Modèle Excel.
 *
 * Les colonnes sont celles que la base exige, avec leurs contraintes :
 * `sexe` ∈ {M, F}, `email` et `tel` validés par expression régulière.
 */
function downloadTemplate() {
  const exemple = {
    nom: 'KABONGO',
    prenom: 'Marc',
    sexe: 'M',
    datenais: '2002-05-14',
    lieunais: 'Conakry',
    tel: '+224620000000',
    email: 'marc.kabongo@exemple.com',
    num_table: 'TAB-2026-0001',
  };

  const worksheet = XLSX.utils.json_to_sheet([exemple]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Candidats');
  XLSX.writeFile(workbook, 'modele_candidats.xlsx');
}
</script>

<template>
  <div>
    <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
      <div>
        <h5 class="fw-bold mb-1 text-dark">Candidatures</h5>
        <p class="text-muted small mb-0">Importez la liste des candidats inscrits à ce concours.</p>
      </div>

      <button class="btn btn-sm btn-light border text-secondary" @click="downloadTemplate">
        <i class="bi bi-file-earmark-excel me-1"></i> Modèle Excel
      </button>
    </div>

    <div class="card border-0 shadow-sm mb-4">
      <div class="card-body">
        <div class="d-flex align-items-center justify-content-between flex-wrap gap-3">
          <div>
            <a href="#" class="btn btn-outline-primary btn-sm" @click.prevent="triggerFileSelect">
              <i class="bi bi-cloud-arrow-up me-1"></i> Sélectionner un fichier
            </a>
            <small class="text-muted ms-2">Formats acceptés : {{ IMPORT_ACCEPT }}</small>

            <input
              ref="fileInput"
              type="file"
              hidden
              :accept="IMPORT_ACCEPT"
              @change="handleFileChange"
            />
          </div>

          <div v-if="selectedFile" class="d-flex align-items-center gap-2">
            <span class="badge bg-light text-dark border">
              <i class="bi bi-filetype-xlsx text-success me-1"></i>{{ selectedFile.name }}
            </span>
            <button class="btn btn-sm btn-primary" :disabled="loading" @click="uploadFile">
              <span
                v-if="loading"
                class="spinner-border spinner-border-sm me-1"
                aria-hidden="true"
              ></span>
              {{ loading ? 'Import...' : "Lancer l'import" }}
            </button>
            <button
              class="btn btn-sm btn-light border"
              :disabled="loading"
              @click="cancelSelection"
            >
              Annuler
            </button>
          </div>

          <small v-else-if="dernierImport" class="text-muted">
            Dernier import : {{ dernierImport }}
          </small>
        </div>
      </div>
    </div>

    <LoadingSpinner v-if="loading && candidats.length === 0" />

    <div v-else class="table-responsive border rounded-3 shadow-sm bg-white">
      <table class="table table-hover align-middle mb-0 text-sm">
        <thead class="table-light text-uppercase text-xs text-muted">
          <tr>
            <th class="ps-3">N° table</th>
            <th>Candidat</th>
            <th class="text-center">Sexe</th>
            <th>Naissance</th>
            <th>Contact</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="candidat in paginatedCandidats" :key="candidat.id">
            <td class="ps-3">
              <span class="font-monospace fw-bold text-secondary">{{ candidat.num_table }}</span>
            </td>

            <td>
              <div class="fw-semibold text-dark">{{ candidat.nom }} {{ candidat.prenom }}</div>
            </td>

            <td class="text-center">
              <span class="badge bg-light text-dark border">
                {{ sexeLabel(candidat.sexe) }}
              </span>
            </td>

            <td class="small text-muted">
              {{ formatDate(candidat.datenais, '—') }}
              <div v-if="candidat.lieunais" class="text-muted">{{ candidat.lieunais }}</div>
            </td>

            <td class="small">
              <div>{{ candidat.email ?? '—' }}</div>
              <div class="text-muted">{{ candidat.tel ?? '—' }}</div>
            </td>
          </tr>

          <tr v-if="candidats.length === 0">
            <td colspan="5" class="text-center py-5 text-muted">
              <i class="bi bi-people d-block mb-2 fs-3"></i>
              Aucun candidat n'est encore inscrit à ce concours.
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="candidats.length > 0" class="card-footer bg-white border-top py-3">
        <Pagination
          v-model="currentPage"
          :items-per-page="itemsPerPage"
          :total-items="candidats.length"
          @update:items-per-page="itemsPerPage = $event"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.text-xs {
  font-size: 0.72rem;
}
.text-sm {
  font-size: 0.875rem;
}
</style>
