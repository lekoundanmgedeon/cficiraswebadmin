<script setup>
import { computed, ref, watch } from 'vue';
import { useModuleStore } from '../store';
import { useModuleForm } from '../composables/useModuleForm';
import { LIMITS, MODULE_MODAL_ID } from '../constants';

/**
 * Formulaire de création / édition d'un module.
 *
 * Il n'en existait aucun : le bouton « + Ajouter » de l'ancien écran ouvrait une
 * modale `#exampleModal` **qui n'était montée nulle part**.
 *
 * Le champ crédit s'appelle `credit`, au singulier — la colonne aussi. Le
 * backend transmettait auparavant `credits` à son modèle, qui lisait `credit` :
 * le crédit arrivait donc toujours à `undefined`. Corrigé côté serveur.
 *
 * Le responsable est **facultatif** et désigné par le **matricule** de
 * l'enseignant. S'il ne correspond à personne, le serveur refuse explicitement —
 * là où l'ancienne fonction Postgres n'insérait rien, en silence.
 */

const moduleStore = useModuleStore();
const { selectedModule, close } = useModuleForm();

const EMPTY_FORM = {
  code: '',
  designation: '',
  credit: null,
  coefficient: 1,
  volume_horaire: null,
  responsable_code: '',
};

const form = ref({ ...EMPTY_FORM });
const errorMessage = ref('');

const isEdit = computed(() => Boolean(selectedModule.value?.id));
const loading = computed(() => moduleStore.loading);

watch(
  selectedModule,
  (module) => {
    errorMessage.value = '';
    form.value = module
      ? {
          code: module.code ?? '',
          designation: module.designation ?? '',
          credit: module.credit ?? null,
          coefficient: module.coefficient ?? 1,
          volume_horaire: module.volume_horaire ?? null,
          responsable_code: module.responsable_code ?? '',
        }
      : { ...EMPTY_FORM };
  },
  { immediate: true }
);

/** @returns {boolean} */
function validate() {
  const { code, designation, credit, coefficient, volume_horaire: volume } = form.value;

  if (!code.trim()) {
    errorMessage.value = 'Le code est obligatoire.';
    return false;
  }
  if (!designation.trim()) {
    errorMessage.value = 'La désignation est obligatoire.';
    return false;
  }
  if (credit !== null && credit < 0) {
    errorMessage.value = 'Le nombre de crédits ne peut pas être négatif.';
    return false;
  }
  if (coefficient !== null && coefficient < 1) {
    errorMessage.value = 'Le coefficient doit valoir au moins 1.';
    return false;
  }
  if (volume !== null && volume < 0) {
    errorMessage.value = 'Le volume horaire ne peut pas être négatif.';
    return false;
  }

  errorMessage.value = '';
  return true;
}

async function submit() {
  if (!validate()) return;

  // Un responsable vide doit partir en `null`, pas en chaîne vide : le serveur
  // ne résout le matricule que s'il est renseigné.
  const payload = {
    ...form.value,
    responsable_code: form.value.responsable_code.trim() || null,
  };

  const result = isEdit.value
    ? await moduleStore.update(selectedModule.value.id, payload)
    : await moduleStore.create(payload);

  if (result !== undefined) close();
}
</script>

<template>
  <div :id="MODULE_MODAL_ID" class="modal fade" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered modal-lg">
      <div class="modal-content">
        <div class="modal-header bg-primary text-white">
          <h5 class="modal-title">{{ isEdit ? 'Modifier' : 'Ajouter' }} un module</h5>
          <button
            type="button"
            class="btn-close btn-close-white"
            data-bs-dismiss="modal"
            aria-label="Fermer"
          ></button>
        </div>

        <form @submit.prevent="submit">
          <div class="modal-body">
            <div class="row">
              <div class="col-md-4 mb-3">
                <label for="module-code" class="form-label">
                  Code <span class="text-danger">*</span>
                </label>
                <input
                  id="module-code"
                  v-model="form.code"
                  type="text"
                  class="form-control"
                  placeholder="Ex : ALGO1"
                  :maxlength="LIMITS.CODE"
                  required
                />
                <div class="form-text">Enregistré en majuscules.</div>
              </div>

              <div class="col-md-8 mb-3">
                <label for="module-designation" class="form-label">
                  Désignation <span class="text-danger">*</span>
                </label>
                <input
                  id="module-designation"
                  v-model="form.designation"
                  type="text"
                  class="form-control"
                  placeholder="Ex : Algorithmique et Programmation 1"
                  :maxlength="LIMITS.DESIGNATION"
                  required
                />
              </div>
            </div>

            <div class="row">
              <div class="col-md-4 mb-3">
                <label for="module-credit" class="form-label">Crédits (ECTS)</label>
                <input
                  id="module-credit"
                  v-model.number="form.credit"
                  type="number"
                  min="0"
                  class="form-control"
                />
              </div>

              <div class="col-md-4 mb-3">
                <label for="module-coefficient" class="form-label">Coefficient</label>
                <input
                  id="module-coefficient"
                  v-model.number="form.coefficient"
                  type="number"
                  min="1"
                  class="form-control"
                />
              </div>

              <div class="col-md-4 mb-3">
                <label for="module-volume" class="form-label">Volume horaire</label>
                <div class="input-group">
                  <input
                    id="module-volume"
                    v-model.number="form.volume_horaire"
                    type="number"
                    min="0"
                    class="form-control"
                  />
                  <span class="input-group-text">h</span>
                </div>
              </div>
            </div>

            <div class="p-3 bg-light rounded">
              <label for="module-responsable" class="form-label">
                Responsable <span class="text-muted fw-normal">(facultatif)</span>
              </label>
              <input
                id="module-responsable"
                v-model="form.responsable_code"
                type="text"
                class="form-control"
                placeholder="Matricule de l'enseignant"
              />
              <div class="form-text">
                Laisser vide si le module n'a pas encore de responsable. Un matricule inconnu est
                refusé.
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
