<script setup>
import { computed, ref, watch } from 'vue';
import { useCycleStore } from '../store';
import { useCycleForm } from '../composables/useCycleForm';
import { CYCLE_MODAL_ID, LIMITS } from '../constants';

/**
 * Formulaire de création / édition d'un cycle.
 *
 * Corrige une incohérence de nommage de l'ancienne version : le formulaire
 * s'initialisait avec `est_actif`, mais le `watch` d'édition et `resetForm`
 * écrivaient `statut`, alors que le template liait `form.est_actif`. La case
 * « actif » se désynchronisait donc dès la première édition. Un seul nom ici.
 *
 * Comme pour les années, la modale ne se ferme que si l'enregistrement a
 * réellement abouti : l'ancienne version affichait un message de succès puis se
 * fermait après un `setTimeout`, sans vérifier le résultat de l'appel.
 */

const cycleStore = useCycleStore();
const { selectedCycle, close } = useCycleForm();

const EMPTY_FORM = {
  code: '',
  designation: '',
  description: '',
  diplome: '',
  duree_annees: null,
  credits_total: null,
  est_actif: true,
};

const form = ref({ ...EMPTY_FORM });
const errorMessage = ref('');

const isEdit = computed(() => Boolean(selectedCycle.value?.id));
const loading = computed(() => cycleStore.loading);

watch(
  selectedCycle,
  (cycle) => {
    errorMessage.value = '';
    form.value = cycle
      ? {
          code: cycle.code ?? '',
          designation: cycle.designation ?? '',
          description: cycle.description ?? '',
          diplome: cycle.diplome ?? '',
          duree_annees: cycle.duree_annees ?? null,
          credits_total: cycle.credits_total ?? null,
          est_actif: cycle.est_actif ?? true,
        }
      : { ...EMPTY_FORM };
  },
  { immediate: true }
);

/** @returns {boolean} */
function validate() {
  const { code, designation } = form.value;

  if (!code.trim()) {
    errorMessage.value = 'Le code est obligatoire.';
    return false;
  }
  if (code.length > LIMITS.CODE) {
    errorMessage.value = `Le code ne doit pas dépasser ${LIMITS.CODE} caractères.`;
    return false;
  }
  if (!designation.trim()) {
    errorMessage.value = 'La désignation est obligatoire.';
    return false;
  }
  if (designation.length > LIMITS.DESIGNATION) {
    errorMessage.value = `La désignation ne doit pas dépasser ${LIMITS.DESIGNATION} caractères.`;
    return false;
  }

  errorMessage.value = '';
  return true;
}

async function submit() {
  if (!validate()) return;

  const result = isEdit.value
    ? await cycleStore.update(selectedCycle.value.id, form.value)
    : await cycleStore.create(form.value);

  if (result !== undefined) close();
}
</script>

<template>
  <div :id="CYCLE_MODAL_ID" class="modal fade" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header bg-primary text-white">
          <h5 class="modal-title">{{ isEdit ? 'Modifier' : 'Ajouter' }} un cycle</h5>
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
              <label for="cycle-code" class="form-label">
                Code <span class="text-danger">*</span>
              </label>
              <input
                id="cycle-code"
                v-model="form.code"
                type="text"
                class="form-control"
                placeholder="Ex : LIC"
                :maxlength="LIMITS.CODE"
                required
              />
            </div>

            <div class="mb-3">
              <label for="cycle-designation" class="form-label">
                Désignation <span class="text-danger">*</span>
              </label>
              <input
                id="cycle-designation"
                v-model="form.designation"
                type="text"
                class="form-control"
                placeholder="Ex : Licence"
                :maxlength="LIMITS.DESIGNATION"
                required
              />
            </div>

            <div class="mb-3">
              <label for="cycle-description" class="form-label">Description</label>
              <textarea
                id="cycle-description"
                v-model="form.description"
                class="form-control"
                rows="2"
              ></textarea>
            </div>

            <div class="row">
              <div class="col-md-4 mb-3">
                <label for="cycle-duree" class="form-label">Durée (années)</label>
                <input
                  id="cycle-duree"
                  v-model.number="form.duree_annees"
                  type="number"
                  min="1"
                  class="form-control"
                />
              </div>

              <div class="col-md-4 mb-3">
                <label for="cycle-credits" class="form-label">Crédits (ECTS)</label>
                <input
                  id="cycle-credits"
                  v-model.number="form.credits_total"
                  type="number"
                  min="0"
                  class="form-control"
                />
              </div>

              <div class="col-md-4 mb-3">
                <label for="cycle-diplome" class="form-label">Diplôme</label>
                <input id="cycle-diplome" v-model="form.diplome" type="text" class="form-control" />
              </div>
            </div>

            <div class="p-3 bg-light rounded">
              <div class="form-check">
                <input
                  id="cycle-actif"
                  v-model="form.est_actif"
                  type="checkbox"
                  class="form-check-input"
                />
                <label class="form-check-label" for="cycle-actif">
                  <strong>Cycle actif</strong>
                </label>
              </div>
            </div>

            <div v-if="errorMessage" class="alert alert-danger mt-3 mb-0" role="alert">
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
