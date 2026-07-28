<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useFiliereStore } from '../store';
import { useCycleStore } from '../../cycle/store';
import { useFiliereForm, FILIERE_MODAL_ID } from '../composables/useFiliereForm';

/**
 * Formulaire de création / édition d'une filière.
 *
 * Une filière appartient à un cycle : le sélecteur a besoin du store des cycles.
 * C'est exactement le genre de dépendance qui justifie de réunir les entités de
 * la structure académique dans un module unique — l'import ci-dessous reste
 * interne au module, plutôt que de traverser une frontière entre modules.
 */

const filiereStore = useFiliereStore();
const cycleStore = useCycleStore();
const { selectedFiliere, close } = useFiliereForm();

const { items: cycles } = storeToRefs(cycleStore);

const EMPTY_FORM = {
  code: '',
  designation: '',
  cycle_id: '',
  credit_total: null,
};

const form = ref({ ...EMPTY_FORM });
const errorMessage = ref('');

const isEdit = computed(() => Boolean(selectedFiliere.value?.id));
const loading = computed(() => filiereStore.loading);

// Le store sert le cache : si les cycles ont déjà été chargés ailleurs, ouvrir
// ce formulaire ne déclenche aucune requête supplémentaire.
onMounted(() => cycleStore.fetchAll());

watch(
  selectedFiliere,
  (filiere) => {
    errorMessage.value = '';
    form.value = filiere
      ? {
          code: filiere.code ?? '',
          designation: filiere.designation ?? '',
          cycle_id: filiere.cycle_id ?? '',
          credit_total: filiere.credit_total ?? null,
        }
      : { ...EMPTY_FORM };
  },
  { immediate: true }
);

/** @returns {boolean} */
function validate() {
  const { code, designation, cycle_id: cycleId } = form.value;

  if (!code.trim()) {
    errorMessage.value = 'Le code est obligatoire.';
    return false;
  }
  if (!designation.trim()) {
    errorMessage.value = 'La désignation est obligatoire.';
    return false;
  }
  if (!cycleId) {
    errorMessage.value = 'Le cycle de rattachement est obligatoire.';
    return false;
  }

  errorMessage.value = '';
  return true;
}

async function submit() {
  if (!validate()) return;

  const result = isEdit.value
    ? await filiereStore.update(selectedFiliere.value.id, form.value)
    : await filiereStore.create(form.value);

  if (result !== undefined) close();
}
</script>

<template>
  <div :id="FILIERE_MODAL_ID" class="modal fade" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header bg-primary text-white">
          <h5 class="modal-title">{{ isEdit ? 'Modifier' : 'Ajouter' }} une filière</h5>
          <button
            type="button"
            class="btn-close btn-close-white"
            data-bs-dismiss="modal"
            aria-label="Fermer"
          ></button>
        </div>

        <form @submit.prevent="submit">
          <div class="modal-body">
            <div class="mb-3">
              <label for="filiere-code" class="form-label">
                Code <span class="text-danger">*</span>
              </label>
              <input
                id="filiere-code"
                v-model="form.code"
                type="text"
                class="form-control"
                placeholder="Ex : INFO"
                required
              />
            </div>

            <div class="mb-3">
              <label for="filiere-designation" class="form-label">
                Désignation <span class="text-danger">*</span>
              </label>
              <input
                id="filiere-designation"
                v-model="form.designation"
                type="text"
                class="form-control"
                placeholder="Ex : Informatique"
                required
              />
            </div>

            <div class="mb-3">
              <label for="filiere-cycle" class="form-label">
                Cycle <span class="text-danger">*</span>
              </label>
              <select id="filiere-cycle" v-model="form.cycle_id" class="form-select" required>
                <option value="">— Sélectionner un cycle —</option>
                <option v-for="cycle in cycles" :key="cycle.id" :value="cycle.id">
                  {{ cycle.code }}
                </option>
              </select>
            </div>

            <div class="mb-3">
              <label for="filiere-credits" class="form-label">Crédits totaux (ECTS)</label>
              <input
                id="filiere-credits"
                v-model.number="form.credit_total"
                type="number"
                min="0"
                class="form-control"
              />
            </div>

            <div v-if="errorMessage" class="alert alert-danger mb-0" role="alert">
              <i class="mdi mdi-alert-circle me-1"></i> {{ errorMessage }}
            </div>
          </div>

          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-secondary"
              data-bs-dismiss="modal"
              :disabled="loading"
            >
              Annuler
            </button>
            <button type="submit" class="btn btn-primary" :disabled="loading">
              <span
                v-if="loading"
                class="spinner-border spinner-border-sm me-2"
                aria-hidden="true"
              ></span>
              {{ loading ? 'Enregistrement...' : 'Enregistrer' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
