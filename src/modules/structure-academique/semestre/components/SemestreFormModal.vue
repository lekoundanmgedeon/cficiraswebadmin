<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useSemestreStore } from '../store';
import { useAnneeStore } from '../../annee/store';
import { useSemestreForm, SEMESTRE_MODAL_ID } from '../composables/useSemestreForm';

/**
 * Formulaire de création / édition d'un semestre.
 *
 * Un semestre appartient à une année académique : le sélecteur s'appuie sur le
 * store des années, sous-domaine voisin au sein du même module.
 */

const semestreStore = useSemestreStore();
const anneeStore = useAnneeStore();
const { selectedSemestre, close } = useSemestreForm();

const { items: annees } = storeToRefs(anneeStore);

const EMPTY_FORM = {
  annee_id: '',
  code: '',
  date_debut: '',
  date_fin: '',
  est_actif: false,
};

const form = ref({ ...EMPTY_FORM });
const errorMessage = ref('');

const isEdit = computed(() => Boolean(selectedSemestre.value?.id));
const loading = computed(() => semestreStore.loading);

onMounted(() => anneeStore.fetchAll());

watch(
  selectedSemestre,
  (semestre) => {
    errorMessage.value = '';
    form.value = semestre
      ? {
          annee_id: semestre.annee_id ?? '',
          code: semestre.code ?? '',
          date_debut: semestre.date_debut ?? '',
          date_fin: semestre.date_fin ?? '',
          est_actif: Boolean(semestre.est_actif),
        }
      : { ...EMPTY_FORM };
  },
  { immediate: true }
);

/** @returns {boolean} */
function validate() {
  const { annee_id: anneeId, code, date_debut: debut, date_fin: fin } = form.value;

  if (!anneeId) {
    errorMessage.value = "L'année académique est obligatoire.";
    return false;
  }
  if (!code.trim()) {
    errorMessage.value = 'Le code est obligatoire.';
    return false;
  }
  if (!debut || !fin) {
    errorMessage.value = 'Les deux dates sont obligatoires.';
    return false;
  }
  if (new Date(fin) <= new Date(debut)) {
    errorMessage.value = 'La date de fin doit être postérieure à la date de début.';
    return false;
  }

  errorMessage.value = '';
  return true;
}

async function submit() {
  if (!validate()) return;

  const result = isEdit.value
    ? await semestreStore.update(selectedSemestre.value.id, form.value)
    : await semestreStore.create(form.value);

  if (result !== undefined) close();
}
</script>

<template>
  <div :id="SEMESTRE_MODAL_ID" class="modal fade" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header bg-primary text-white">
          <h5 class="modal-title">{{ isEdit ? 'Modifier' : 'Ajouter' }} un semestre</h5>
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
              <label for="semestre-annee" class="form-label">
                Année académique <span class="text-danger">*</span>
              </label>
              <select id="semestre-annee" v-model="form.annee_id" class="form-select" required>
                <option value="">— Sélectionner une année —</option>
                <option v-for="annee in annees" :key="annee.id" :value="annee.id">
                  {{ annee.code }}
                </option>
              </select>
            </div>

            <div class="mb-3">
              <label for="semestre-code" class="form-label">
                Code <span class="text-danger">*</span>
              </label>
              <input
                id="semestre-code"
                v-model="form.code"
                type="text"
                class="form-control"
                placeholder="Ex : S1"
                required
              />
            </div>

            <div class="row">
              <div class="col-md-6 mb-3">
                <label for="semestre-debut" class="form-label">
                  Date de début <span class="text-danger">*</span>
                </label>
                <input
                  id="semestre-debut"
                  v-model="form.date_debut"
                  type="date"
                  class="form-control"
                  required
                />
              </div>

              <div class="col-md-6 mb-3">
                <label for="semestre-fin" class="form-label">
                  Date de fin <span class="text-danger">*</span>
                </label>
                <input
                  id="semestre-fin"
                  v-model="form.date_fin"
                  type="date"
                  class="form-control"
                  required
                />
              </div>
            </div>

            <div class="p-3 bg-light rounded">
              <div class="form-check">
                <input
                  id="semestre-actif"
                  v-model="form.est_actif"
                  type="checkbox"
                  class="form-check-input"
                />
                <label class="form-check-label" for="semestre-actif">
                  <strong>Semestre actif</strong>
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
