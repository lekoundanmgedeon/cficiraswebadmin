<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import * as XLSX from 'xlsx';
import { useNotificationStore } from '@/shared/stores/notificationStore';
import { useEpreuveConcoursStore } from '../store';
import { TYPES_EPREUVE, typeEpreuveLabel } from '../../constants';

const props = defineProps({
  concoursId: { type: String, required: true },
});

/**
 * Registre des épreuves d'un concours — édition en ligne.
 *
 * La grille et son édition ligne à ligne sont celles de l'original. Trois
 * défauts corrigés :
 *
 * - Le sélecteur de type proposait `écrit` / `oral` / `pratique` **en minuscules
 *   accentuées**, alors que la base impose `ECRIT`, `ORAL`, `PRATIQUE`. Un hack
 *   rattrapait « ÉCRIT » au moment d'enregistrer ; les valeurs sont désormais
 *   justes dès la saisie.
 * - `updateEpreuve` et `deleteEpreuve` visaient un chemin comportant un
 *   `/gestions/` en trop et répondaient **404** : modifier ou supprimer une
 *   épreuve **n'a jamais fonctionné**.
 * - « Excel » exportait une grille dont les colonnes étaient redéclarées à la
 *   main, indépendamment des lignes.
 */

const epreuveStore = useEpreuveConcoursStore();
const notifications = useNotificationStore();

const { items: source, loading, totalCoefficients } = storeToRefs(epreuveStore);

/** Copie de travail : l'édition en ligne modifie les lignes avant de les envoyer. */
const epreuves = ref([]);
const activeEditIndex = ref(null);

/** @param {any[]} rows */
const clone = (rows) => rows.map((row) => ({ ...row }));

onMounted(() => epreuveStore.fetchByConcours(props.concoursId));

// La liste du store fait foi : toute relecture réinitialise la copie de travail.
watch(source, (rows) => {
  epreuves.value = clone(rows);
  activeEditIndex.value = null;
});

watch(
  () => props.concoursId,
  (id) => {
    activeEditIndex.value = null;
    epreuveStore.fetchByConcours(id);
  }
);

const coefficientsSaisis = computed(() =>
  epreuves.value.reduce((total, epreuve) => total + (Number(epreuve.coefficient) || 0), 0)
);

function addEpreuve() {
  if (activeEditIndex.value !== null) {
    notifications.notifyError("Enregistrez d'abord l'épreuve en cours de modification.");
    return;
  }

  epreuves.value.push({
    code: '',
    designation: '',
    coefficient: 1,
    heure_debut: '',
    heure_fin: '',
    type_epreuve: 'ECRIT',
    ordre: epreuves.value.length + 1,
    isNew: true,
  });

  activeEditIndex.value = epreuves.value.length - 1;
}

function editEpreuve(index) {
  if (activeEditIndex.value !== null && activeEditIndex.value !== index) {
    notifications.notifyError("Enregistrez d'abord l'épreuve en cours de modification.");
    return;
  }
  activeEditIndex.value = index;
}

function cancelEdit(index) {
  if (epreuves.value[index]?.isNew) {
    epreuves.value.splice(index, 1);
  } else {
    // Restauration depuis le store, seule source saine.
    epreuves.value = clone(source.value);
  }
  activeEditIndex.value = null;
}

/**
 * Les règles ci-dessous sont celles de la **base** (`CHECK`), pas du contrôleur.
 * @param {any} epreuve @returns {string|null}
 */
function validate(epreuve) {
  if (!epreuve.code?.trim()) return 'Le code de l’épreuve est obligatoire.';
  if (!epreuve.designation?.trim()) return 'L’intitulé de la matière est obligatoire.';

  // CHECK (coefficient > 0)
  if (!(Number(epreuve.coefficient) > 0)) {
    return 'Le coefficient doit être strictement positif.';
  }

  if (!epreuve.heure_debut || !epreuve.heure_fin) {
    return 'Les heures de début et de fin sont obligatoires.';
  }

  // CHECK (heure_fin > heure_debut)
  if (epreuve.heure_fin <= epreuve.heure_debut) {
    return 'L’heure de fin doit être postérieure à l’heure de début.';
  }

  return null;
}

async function saveEpreuve(epreuve, index) {
  const error = validate(epreuve);
  if (error) {
    notifications.notifyError(error);
    return;
  }

  const payload = {
    code: epreuve.code.trim().toUpperCase(),
    designation: epreuve.designation.trim(),
    coefficient: Number(epreuve.coefficient),
    heure_debut: epreuve.heure_debut,
    heure_fin: epreuve.heure_fin,
    type_epreuve: epreuve.type_epreuve,
    ordre: Number(epreuve.ordre) || index + 1,
    concours_id: props.concoursId,
  };

  const result = epreuve.isNew
    ? await epreuveStore.create(payload)
    : await epreuveStore.update(epreuve.id, payload);

  // `run()` renvoie `undefined` sur échec : on ne sort du mode édition que si
  // l'enregistrement a réellement abouti. La relecture du store, déclenchée par
  // `onSuccess`, remet `activeEditIndex` à `null` via le `watch`.
  if (result === undefined) return;
}

async function removeEpreuve(epreuve, index) {
  if (epreuve.isNew) {
    epreuves.value.splice(index, 1);
    activeEditIndex.value = null;
    return;
  }

  await epreuveStore.remove(epreuve.id);
}

/** @param {string} type */
function typeBadgeClass(type) {
  const classes = {
    ECRIT: 'bg-primary-subtle text-primary',
    ORAL: 'bg-warning-subtle text-warning',
    PRATIQUE: 'bg-success-subtle text-success',
  };
  return classes[type] ?? 'bg-light text-secondary';
}

/** Les colonnes sont dérivées des lignes : elles ne peuvent plus diverger. */
function exportExcel() {
  const rows = epreuves.value.map((epreuve, index) => ({
    Ordre: epreuve.ordre ?? index + 1,
    Code: epreuve.code,
    Matière: epreuve.designation,
    Coefficient: epreuve.coefficient,
    'Heure début': epreuve.heure_debut,
    'Heure fin': epreuve.heure_fin,
    Type: typeEpreuveLabel(epreuve.type_epreuve),
  }));

  if (rows.length === 0) {
    notifications.notifyWarning('Aucune épreuve à exporter.');
    return;
  }

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Épreuves');
  XLSX.writeFile(workbook, `epreuves_concours_${Date.now()}.xlsx`);
}
</script>

<template>
  <div>
    <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
      <div>
        <h5 class="fw-bold mb-1 text-dark">Registre des Épreuves</h5>
        <p class="text-muted small mb-0">
          Définissez les matières, coefficients et plages horaires indispensables aux calculs de
          délibération.
        </p>
      </div>

      <div class="d-flex gap-2">
        <button
          class="btn btn-sm btn-light border text-secondary"
          title="Exporter sous Excel"
          @click="exportExcel"
        >
          <i class="bi bi-file-earmark-excel me-1"></i> Excel
        </button>
        <button
          class="btn btn-sm btn-primary d-inline-flex align-items-center gap-1"
          :disabled="loading"
          @click="addEpreuve"
        >
          <span>+ Ajouter une épreuve</span>
        </button>
      </div>
    </div>

    <div class="table-responsive border rounded-3 shadow-sm bg-white">
      <table class="table table-hover align-middle mb-0 text-sm">
        <thead class="table-light text-uppercase font-monospace text-xs">
          <tr>
            <th class="ps-3" style="width: 12%">Code</th>
            <th style="width: 25%">Intitulé de la matière</th>
            <th class="text-center" style="width: 12%">Coefficient</th>
            <th style="width: 15%">Heure Début</th>
            <th style="width: 15%">Heure Fin</th>
            <th style="width: 12%">Type</th>
            <th class="text-end pe-3" style="width: 12%">Actions</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="(epreuve, index) in epreuves"
            :key="epreuve.id ?? `nouvelle-${index}`"
            :class="{ 'table-primary-subtle': activeEditIndex === index }"
          >
            <td class="ps-3">
              <input
                v-if="activeEditIndex === index"
                v-model="epreuve.code"
                type="text"
                class="form-control form-control-sm font-monospace text-uppercase"
                placeholder="EP01"
              />
              <span v-else class="font-monospace fw-bold text-secondary">
                {{ epreuve.code || '—' }}
              </span>
            </td>

            <td>
              <input
                v-if="activeEditIndex === index"
                v-model="epreuve.designation"
                type="text"
                class="form-control form-control-sm"
                placeholder="Ex : Mathématiques"
              />
              <span v-else class="fw-semibold text-dark">
                {{ epreuve.designation || 'Sans intitulé' }}
              </span>
            </td>

            <td class="text-center">
              <div v-if="activeEditIndex === index" class="d-flex justify-content-center">
                <input
                  v-model.number="epreuve.coefficient"
                  type="number"
                  class="form-control form-control-sm text-center font-monospace"
                  min="1"
                  style="max-width: 70px"
                />
              </div>
              <span
                v-else
                class="font-monospace fw-bold bg-light px-2 py-1 rounded text-secondary border"
              >
                {{ epreuve.coefficient }}
              </span>
            </td>

            <td>
              <input
                v-if="activeEditIndex === index"
                v-model="epreuve.heure_debut"
                type="time"
                class="form-control form-control-sm font-monospace"
              />
              <span v-else class="font-monospace text-muted">
                <i class="bi bi-clock me-1"></i>{{ epreuve.heure_debut || '--:--' }}
              </span>
            </td>

            <td>
              <input
                v-if="activeEditIndex === index"
                v-model="epreuve.heure_fin"
                type="time"
                class="form-control form-control-sm font-monospace"
              />
              <span v-else class="font-monospace text-muted">
                <i class="bi bi-clock-history me-1"></i>{{ epreuve.heure_fin || '--:--' }}
              </span>
            </td>

            <td>
              <!-- Les valeurs sont celles de la base (ECRIT / ORAL / PRATIQUE).
                   L'original envoyait « écrit » en minuscules accentuées. -->
              <select
                v-if="activeEditIndex === index"
                v-model="epreuve.type_epreuve"
                class="form-select form-select-sm"
              >
                <option v-for="type in TYPES_EPREUVE" :key="type.code" :value="type.code">
                  {{ type.label }}
                </option>
              </select>
              <span
                v-else
                class="badge px-2 py-1 fw-semibold text-xs"
                :class="typeBadgeClass(epreuve.type_epreuve)"
              >
                {{ typeEpreuveLabel(epreuve.type_epreuve) }}
              </span>
            </td>

            <td class="text-end pe-3">
              <div class="d-flex justify-content-end gap-1">
                <template v-if="activeEditIndex === index">
                  <button
                    class="btn btn-sm btn-success p-1 px-2"
                    title="Enregistrer"
                    :disabled="loading"
                    @click="saveEpreuve(epreuve, index)"
                  >
                    <i class="bi bi-check-lg"></i>
                  </button>
                  <button
                    class="btn btn-sm btn-light border p-1 px-2"
                    title="Annuler"
                    :disabled="loading"
                    @click="cancelEdit(index)"
                  >
                    <i class="bi bi-x-lg"></i>
                  </button>
                </template>

                <template v-else>
                  <button
                    class="btn btn-sm btn-light border p-1 px-2"
                    title="Modifier"
                    @click="editEpreuve(index)"
                  >
                    <i class="bi bi-pencil"></i>
                  </button>
                  <button
                    class="btn btn-sm btn-light border text-danger p-1 px-2"
                    title="Supprimer"
                    :disabled="loading"
                    @click="removeEpreuve(epreuve, index)"
                  >
                    <i class="bi bi-trash"></i>
                  </button>
                </template>
              </div>
            </td>
          </tr>

          <tr v-if="epreuves.length === 0">
            <td colspan="7" class="text-center py-5 text-muted">
              <i class="bi bi-journal-x d-block mb-2 fs-3"></i>
              Aucune épreuve n'est encore définie pour ce concours.
            </td>
          </tr>
        </tbody>

        <tfoot v-if="epreuves.length > 0" class="table-light">
          <tr>
            <td colspan="2" class="ps-3 fw-bold text-secondary text-uppercase text-xs">
              Total des coefficients
            </td>
            <td class="text-center fw-bold font-monospace">{{ coefficientsSaisis }}</td>
            <td colspan="4"></td>
          </tr>
        </tfoot>
      </table>
    </div>

    <p v-if="totalCoefficients !== coefficientsSaisis" class="text-muted small mt-2 mb-0">
      <i class="bi bi-info-circle me-1"></i>
      Modifications non enregistrées : le total en base est de {{ totalCoefficients }}.
    </p>
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
