<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useNiveauStore } from '../store';
import { useCycleStore } from '../../cycle/store';
import { useNiveauForm, NIVEAU_MODAL_ID } from '../composables/useNiveauForm';

/** Formulaire de création / édition d'un niveau. */

const niveauStore = useNiveauStore();
const cycleStore = useCycleStore();
const { selectedNiveau, close } = useNiveauForm();

const { items: cycles } = storeToRefs(cycleStore);

const EMPTY_FORM = {
  cycle_id: '',
  code: '',
  ordre: null,
  frais_scolarite: null,
};

const form = ref({ ...EMPTY_FORM });
const errorMessage = ref('');

const isEdit = computed(() => Boolean(selectedNiveau.value?.id));
const loading = computed(() => niveauStore.loading);

onMounted(() => cycleStore.fetchAll());

watch(
  selectedNiveau,
  (niveau) => {
    errorMessage.value = '';
    form.value = niveau
      ? {
          cycle_id: niveau.cycle_id ?? '',
          code: niveau.code ?? '',
          ordre: niveau.ordre ?? null,
          frais_scolarite: niveau.frais_scolarite ?? null,
        }
      : { ...EMPTY_FORM };
  },
  { immediate: true }
);

/** @returns {boolean} */
function validate() {
  const { cycle_id: cycleId, code, ordre } = form.value;

  if (!cycleId) {
    errorMessage.value = 'Le cycle de rattachement est obligatoire.';
    return false;
  }
  if (!code.trim()) {
    errorMessage.value = 'Le code du niveau est obligatoire.';
    return false;
  }
  if (!ordre || ordre < 1) {
    errorMessage.value = "L'ordre doit être un entier supérieur ou égal à 1.";
    return false;
  }

  errorMessage.value = '';
  return true;
}

async function submit() {
  if (!validate()) return;

  const result = isEdit.value
    ? await niveauStore.update(selectedNiveau.value.id, form.value)
    : await niveauStore.create(form.value);

  if (result !== undefined) close();
}
</script>

<template>
  <div :id="NIVEAU_MODAL_ID" class="modal fade" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header bg-secondary text-white">
          <h5 class="modal-title">{{ isEdit ? 'Modifier' : 'Créer' }} un niveau</h5>
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
              <label for="niveau-cycle" class="form-label">
                Cycle <span class="text-danger">*</span>
              </label>
              <select id="niveau-cycle" v-model="form.cycle_id" class="form-select" required>
                <option value="">— Sélectionner un cycle —</option>
                <option v-for="cycle in cycles" :key="cycle.id" :value="cycle.id">
                  {{ cycle.code }}
                </option>
              </select>
            </div>

            <div class="mb-3">
              <label for="niveau-code" class="form-label">
                Code du niveau <span class="text-danger">*</span>
              </label>
              <input
                id="niveau-code"
                v-model="form.code"
                type="text"
                class="form-control"
                placeholder="Ex : L1"
                required
              />
            </div>

            <div class="row">
              <div class="col-md-6 mb-3">
                <label for="niveau-ordre" class="form-label">
                  Ordre <span class="text-danger">*</span>
                </label>
                <input
                  id="niveau-ordre"
                  v-model.number="form.ordre"
                  type="number"
                  min="1"
                  class="form-control"
                  required
                />
                <small class="text-muted">Rang de l'année dans le cycle (1, 2, 3…).</small>
              </div>

              <div class="col-md-6 mb-3">
                <label for="niveau-frais" class="form-label">Frais de scolarité</label>
                <input
                  id="niveau-frais"
                  v-model.number="form.frais_scolarite"
                  type="number"
                  min="0"
                  class="form-control"
                />
                <small class="text-muted">En FCFA.</small>
              </div>
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
