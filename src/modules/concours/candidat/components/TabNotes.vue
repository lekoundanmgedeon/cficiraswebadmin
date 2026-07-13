<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue';
import { useNotificationStore } from '@/shared/stores/notificationStore';
import { useCandidatStore } from '../store';
import { useEpreuveConcoursStore } from '../../epreuve/store';
import { IMPORT_ACCEPT } from '../../constants';

const props = defineProps({
  concoursId: { type: String, required: true },
});

/**
 * Saisie des notes, épreuve par épreuve.
 *
 * La grille de saisie est celle de l'original. Deux défauts corrigés :
 *
 * - Elle annonçait « Toutes les notes ont été enregistrées avec succès »
 *   **inconditionnellement**, après la boucle. Comme l'ancien store avalait ses
 *   erreurs, un échec passait totalement inaperçu : l'utilisateur croyait avoir
 *   sauvegardé. On compte désormais les vrais succès.
 * - L'import de notes limitait le fichier à 5 Mo mais ne vérifiait **pas son
 *   extension**.
 */

const candidatStore = useCandidatStore();
const epreuveStore = useEpreuveConcoursStore();
const notifications = useNotificationStore();

const { items: candidats, loading: candidatsLoading } = storeToRefs(candidatStore);
const { ordonnees: epreuves, loading: epreuvesLoading } = storeToRefs(epreuveStore);

const loading = computed(() => candidatsLoading.value || epreuvesLoading.value);

const selectedEpreuveId = ref('');
const notesRows = ref([]);
const fileInput = ref(null);
const saving = ref(false);

onMounted(async () => {
  await Promise.all([
    epreuveStore.fetchByConcours(props.concoursId),
    candidatStore.fetchByConcours(props.concoursId),
  ]);

  selectedEpreuveId.value = epreuves.value[0]?.id ?? '';
});

const currentEpreuve = computed(() =>
  epreuves.value.find((epreuve) => epreuve.id === selectedEpreuveId.value)
);

/** La grille se reconstruit à chaque changement d'épreuve ou de liste. */
watch([currentEpreuve, candidats], () => {
  notesRows.value = candidats.value.map((candidat) => ({
    id: candidat.id,
    num_table: candidat.num_table,
    nom: candidat.nom,
    prenom: candidat.prenom,
    note: '',
    error: null,
    isModified: false,
  }));
});

const totalSaisies = computed(
  () => notesRows.value.filter((row) => row.note !== '' && row.note !== null).length
);

const modifiees = computed(() => notesRows.value.filter((row) => row.isModified));

/** @param {any} row */
function validateRow(row) {
  row.isModified = true;

  if (row.note === '' || row.note === null) {
    row.error = null;
    return;
  }

  const note = Number(row.note);
  row.error = Number.isNaN(note) || note < 0 || note > 20 ? 'Note hors de [0, 20]' : null;
}

async function saveAllNotes() {
  if (!currentEpreuve.value) {
    notifications.notifyError('Choisissez une épreuve avant d’enregistrer.');
    return;
  }

  if (notesRows.value.some((row) => row.error)) {
    notifications.notifyError(
      'Corrigez les notes invalides (hors de [0, 20]) avant d’enregistrer.'
    );
    return;
  }

  const aEnregistrer = modifiees.value;

  if (aEnregistrer.length === 0) {
    notifications.notifyInfo('Aucune modification à enregistrer.');
    return;
  }

  saving.value = true;

  // L'ancienne version annonçait un succès global sans vérifier quoi que ce
  // soit : le store avalait ses erreurs, donc chaque `await` réussissait. On
  // compte ici les vrais succès — `run()` renvoie `undefined` en cas d'échec.
  let succes = 0;

  for (const row of aEnregistrer) {
    const result = await candidatStore.addNote(row.num_table, {
      concours_id: props.concoursId,
      code_epreuve: currentEpreuve.value.code,
      note: row.note === '' ? null : Number(row.note),
      appreciation: null,
    });

    if (result !== undefined) {
      succes += 1;
      row.isModified = false;
    }
  }

  saving.value = false;

  const echecs = aEnregistrer.length - succes;

  if (echecs === 0) {
    notifications.notifySuccess(`${succes} note(s) enregistrée(s).`);
  } else {
    notifications.notifyWarning(
      `${succes} note(s) enregistrée(s), ${echecs} en échec. Les lignes en échec restent modifiables.`
    );
  }
}

const triggerFileSelect = () => fileInput.value?.click();

async function handleFileChange(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const reset = () => {
    if (fileInput.value) fileInput.value.value = '';
  };

  // L'original vérifiait la taille, mais **pas l'extension**.
  const accepted = IMPORT_ACCEPT.split(',').some((extension) =>
    file.name.toLowerCase().endsWith(extension)
  );

  if (!accepted) {
    notifications.notifyError(`Format non pris en charge. Attendu : ${IMPORT_ACCEPT}.`);
    reset();
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    notifications.notifyError('Le fichier est trop lourd. Limite fixée à 5 Mo.');
    reset();
    return;
  }

  await candidatStore.importNotesFile(file, props.concoursId);
  reset();
}
</script>

<template>
  <div>
    <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
      <div>
        <h5 class="fw-bold mb-1 text-dark">Saisie des notes</h5>
        <p class="text-muted small mb-0">
          Saisissez les notes épreuve par épreuve, ou importez-les par lot.
        </p>
      </div>

      <button class="btn btn-sm btn-light border text-secondary" @click="triggerFileSelect">
        <i class="bi bi-file-earmark-excel me-1"></i> Importer des notes
      </button>

      <input
        ref="fileInput"
        type="file"
        hidden
        :accept="IMPORT_ACCEPT"
        @change="handleFileChange"
      />
    </div>

    <div class="card border-0 shadow-sm mb-4">
      <div class="card-body">
        <div class="row g-3 align-items-end">
          <div class="col-md-5">
            <label class="form-label fw-bold small">Épreuve</label>
            <select v-model="selectedEpreuveId" class="form-select form-select-sm">
              <option value="">— Sélectionnez une épreuve —</option>
              <option v-for="epreuve in epreuves" :key="epreuve.id" :value="epreuve.id">
                {{ epreuve.code }} — {{ epreuve.designation }} (coef. {{ epreuve.coefficient }})
              </option>
            </select>
          </div>

          <div class="col-md-4">
            <span class="badge bg-light text-secondary border">
              {{ totalSaisies }} / {{ notesRows.length }} note(s) saisie(s)
            </span>
            <span v-if="modifiees.length > 0" class="badge bg-warning-subtle text-warning ms-2">
              {{ modifiees.length }} non enregistrée(s)
            </span>
          </div>

          <div class="col-md-3 text-md-end">
            <button
              class="btn btn-sm btn-primary px-3"
              :disabled="!currentEpreuve || saving || modifiees.length === 0"
              @click="saveAllNotes"
            >
              <span
                v-if="saving"
                class="spinner-border spinner-border-sm me-1"
                aria-hidden="true"
              ></span>
              {{ saving ? 'Enregistrement...' : 'Enregistrer les notes' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <LoadingSpinner v-if="loading" />

    <div v-else-if="!currentEpreuve" class="text-center py-5 text-muted">
      <i class="bi bi-pencil-square d-block mb-2 fs-3"></i>
      Choisissez une épreuve pour saisir ses notes.
    </div>

    <div v-else class="table-responsive border rounded-3 shadow-sm bg-white">
      <table class="table table-hover align-middle mb-0 text-sm">
        <thead class="table-light text-uppercase text-xs text-muted">
          <tr>
            <th class="ps-3">N° table</th>
            <th>Candidat</th>
            <th style="width: 160px">Note / 20</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="row in notesRows" :key="row.id">
            <td class="ps-3">
              <span class="font-monospace fw-bold text-secondary">{{ row.num_table }}</span>
            </td>

            <td class="fw-semibold text-dark">{{ row.nom }} {{ row.prenom }}</td>

            <td>
              <input
                v-model="row.note"
                type="number"
                class="form-control form-control-sm font-monospace"
                :class="{ 'is-invalid': row.error }"
                min="0"
                max="20"
                step="0.25"
                @input="validateRow(row)"
              />
              <div v-if="row.error" class="invalid-feedback d-block text-xs">
                {{ row.error }}
              </div>
            </td>
          </tr>

          <tr v-if="notesRows.length === 0">
            <td colspan="3" class="text-center py-5 text-muted">
              Aucun candidat n'est inscrit à ce concours.
            </td>
          </tr>
        </tbody>
      </table>
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
