<script setup>
import { computed, reactive, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useAnneeStore } from '@/modules/structure-academique/annee/store';
import { useConcoursStore } from '../store';
import { useConcoursForm } from '../composables/useConcoursForm';
import { CONCOURS_MODAL_ID, STATUT_CONCOURS_LIST, TYPES_CONCOURS } from '../../constants';

/**
 * Formulaire de concours — création **et** édition.
 *
 * `AddConcour.vue` ne savait que créer, et le bouton « Modifier » de la liste
 * n'était qu'un `console.log`. Trois autres défauts :
 *
 * - Son sélecteur de type ne proposait que **quatre** des **sept** types de la
 *   table `types_concours`. Éditer un concours de type `CONCOURS_INGE` — il en
 *   existe un — lui aurait fait perdre son type.
 * - Il fermait sa modale **même en cas d'échec** : l'ancien store avalait ses
 *   erreurs, donc l'`await` du composant réussissait toujours.
 * - Il ne vérifiait aucune des trois contraintes de dates portées par la base
 *   (`date_fin >= date_debut`, `date_limite_inscription <= date_debut`), qui
 *   remontaient en erreur SQL brute.
 */

const concoursStore = useConcoursStore();
const anneeStore = useAnneeStore();

const { selectedConcours, close } = useConcoursForm();
const { items: annees, current: anneeCourante } = storeToRefs(anneeStore);

const loading = computed(() => concoursStore.loading);
const isEdit = computed(() => Boolean(selectedConcours.value?.id));

const EMPTY_FORM = {
  designation: '',
  type_concours: '',
  date_debut: '',
  date_fin: '',
  date_limite_inscription: '',
  annee_id: '',
  statut: 'PLANIFIE',
  description: '',
};

const form = reactive({ ...EMPTY_FORM });
const errorMessage = ref('');

anneeStore.fetchAll();
anneeStore.fetchCurrent();

/** @param {string|null|undefined} value */
const toDateInput = (value) => (value ? String(value).slice(0, 10) : '');

watch(
  selectedConcours,
  (concours) => {
    errorMessage.value = '';

    if (!concours) {
      Object.assign(form, EMPTY_FORM, { annee_id: anneeCourante.value?.id ?? '' });
      return;
    }

    Object.assign(form, {
      designation: concours.designation ?? '',
      type_concours: concours.type_concours ?? '',
      date_debut: toDateInput(concours.date_debut),
      date_fin: toDateInput(concours.date_fin),
      date_limite_inscription: toDateInput(concours.date_limite_inscription),
      annee_id: concours.annee_id ?? '',
      statut: concours.statut ?? 'PLANIFIE',
      description: concours.description ?? '',
    });
  },
  { immediate: true }
);

/**
 * Les trois règles ci-dessous sont des contraintes **de la base**, pas du
 * contrôleur : sans elles, une saisie incohérente remonterait en
 * « violates check constraint », illisible.
 *
 * @returns {boolean}
 */
function validate() {
  if (!form.annee_id) {
    errorMessage.value = "L'année académique est obligatoire.";
    return false;
  }
  if (!form.type_concours) {
    errorMessage.value = 'Le type de concours est obligatoire.';
    return false;
  }
  if (!form.designation.trim()) {
    errorMessage.value = 'La désignation est obligatoire.';
    return false;
  }

  // CHECK (date_fin >= date_debut)
  if (form.date_debut && form.date_fin && new Date(form.date_fin) < new Date(form.date_debut)) {
    errorMessage.value = 'La date de fin ne peut pas être antérieure à la date de début.';
    return false;
  }

  // CHECK (date_limite_inscription <= date_debut)
  if (
    form.date_debut &&
    form.date_limite_inscription &&
    new Date(form.date_limite_inscription) > new Date(form.date_debut)
  ) {
    errorMessage.value =
      'La date limite de dossier doit précéder (ou égaler) la date de début du concours.';
    return false;
  }

  errorMessage.value = '';
  return true;
}

async function submit() {
  if (!validate()) return;

  const payload = { ...form, annee_id: form.annee_id || null };

  const result = isEdit.value
    ? await concoursStore.update(selectedConcours.value.id, payload)
    : await concoursStore.create(payload);

  // `run()` renvoie `undefined` sur échec : on ne ferme que si ça a marché.
  if (result !== undefined) close();
}
</script>

<template>
  <div
    :id="CONCOURS_MODAL_ID"
    class="modal fade"
    tabindex="-1"
    aria-labelledby="concoursModalLabel"
    aria-hidden="true"
  >
    <div class="modal-dialog modal-dialog-centered modal-lg">
      <div class="modal-content border-0 shadow-lg">
        <div class="modal-header bg-primary text-white">
          <h5 id="concoursModalLabel" class="modal-title">
            <i class="bi bi-trophy me-2"></i>
            {{ isEdit ? 'Modifier le concours' : 'Ajouter un concours' }}
          </h5>
          <button
            type="button"
            class="btn-close btn-close-white"
            data-bs-dismiss="modal"
            aria-label="Close"
            :disabled="loading"
          ></button>
        </div>

        <form @submit.prevent="submit">
          <div class="modal-body p-4">
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label fw-bold small">Année Académique *</label>
                <select v-model="form.annee_id" class="form-select" required :disabled="loading">
                  <option value="" disabled>— Sélectionnez une année —</option>
                  <option v-for="annee in annees" :key="annee.id" :value="annee.id">
                    {{ annee.code }}
                    <span v-if="anneeCourante && annee.id === anneeCourante.id"> (Courante)</span>
                  </option>
                </select>
                <div class="form-text text-muted text-xs">
                  <i class="bi bi-info-circle me-1"></i> Liaison automatique avec l'année active.
                </div>
              </div>

              <div class="col-md-6">
                <label class="form-label fw-bold small">Type concours *</label>
                <select
                  v-model="form.type_concours"
                  class="form-select"
                  required
                  :disabled="loading"
                >
                  <option value="" disabled>— Sélectionnez un type —</option>
                  <option v-for="type in TYPES_CONCOURS" :key="type.code" :value="type.code">
                    {{ type.label }}
                  </option>
                </select>
              </div>

              <div class="col-md-6">
                <label class="form-label fw-bold small">Désignation *</label>
                <input
                  v-model="form.designation"
                  type="text"
                  class="form-control"
                  placeholder="Ex : Concours Ingénieur 2026"
                  required
                  :disabled="loading"
                />
              </div>

              <div class="col-md-6">
                <label class="form-label fw-bold small">Statut *</label>
                <select v-model="form.statut" class="form-select" required :disabled="loading">
                  <option
                    v-for="statut in STATUT_CONCOURS_LIST"
                    :key="statut.code"
                    :value="statut.code"
                  >
                    {{ statut.label }}
                  </option>
                </select>
              </div>

              <div class="col-md-4">
                <label class="form-label fw-bold small">Date de Début *</label>
                <input
                  v-model="form.date_debut"
                  type="date"
                  class="form-control"
                  required
                  :disabled="loading"
                />
              </div>

              <div class="col-md-4">
                <label class="form-label fw-bold small">Date de Fin *</label>
                <input
                  v-model="form.date_fin"
                  type="date"
                  class="form-control"
                  required
                  :disabled="loading"
                />
              </div>

              <div class="col-md-4">
                <label class="form-label fw-bold small text-danger">Date limite dossier *</label>
                <input
                  v-model="form.date_limite_inscription"
                  type="date"
                  class="form-control"
                  required
                  :disabled="loading"
                />
                <div class="form-text text-muted text-xs">Doit précéder la date de début.</div>
              </div>

              <div class="col-md-12">
                <label class="form-label fw-bold small">
                  Description / Critères d'éligibilité
                </label>
                <textarea
                  v-model="form.description"
                  class="form-control"
                  rows="3"
                  :disabled="loading"
                ></textarea>
              </div>

              <div v-if="errorMessage" class="col-12">
                <div class="alert alert-danger mb-0 py-2 small" role="alert">
                  <i class="bi bi-exclamation-triangle-fill me-1"></i> {{ errorMessage }}
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer bg-light">
            <button
              type="button"
              class="btn btn-sm btn-secondary"
              data-bs-dismiss="modal"
              :disabled="loading"
            >
              Annuler
            </button>
            <button type="submit" class="btn btn-sm btn-primary px-3" :disabled="loading">
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

<style scoped>
.text-xs {
  font-size: 11px !important;
}
.form-label {
  color: #495057;
}
</style>
