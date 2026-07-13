<script setup>
import { computed, reactive, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useAnneeStore } from '@/modules/structure-academique/annee/store';
import { useSemestreStore } from '@/modules/structure-academique/semestre/store';
import { useSessionStore } from '../store';
import { useSessionForm } from '../composables/useSessionForm';
import { ETAT_SESSION_LIST, SESSION_MODAL_ID, TYPES_SESSION } from '../../constants';

/**
 * Formulaire de session d'examen — création **et** édition.
 *
 * `AddSession.vue` ne savait que créer. Le bouton « Modifier » de la liste
 * visait `#editExamModal`, **une modale qui n'existait nulle part**, et se
 * contentait d'un `fetchSessionById()` sans rien afficher : on ne pouvait pas
 * modifier une session.
 *
 * Deux autres corrections :
 *
 * - Son sélecteur d'état proposait `<option value="Brouillon">`. Or le backend
 *   n'accepte que **`INACTIVE`, `ACTIVE` ou `ARCHIVE`** — « Brouillon » n'a
 *   jamais été une valeur valide.
 * - Il fermait la modale **même en cas d'échec** : l'ancien store avalait ses
 *   erreurs (`try/catch` → `notifyError`, sans relancer), donc l'`await` du
 *   composant réussissait toujours. `run()` renvoie désormais `undefined` sur
 *   échec, et la modale ne se ferme que sur un vrai succès.
 */

const sessionStore = useSessionStore();
const anneeStore = useAnneeStore();
const semestreStore = useSemestreStore();

const { selectedSession, close } = useSessionForm();

const { items: annees, current: anneeCourante } = storeToRefs(anneeStore);
const { items: semestres } = storeToRefs(semestreStore);

const loading = computed(() => sessionStore.loading);
const semestresLoading = computed(() => semestreStore.loading);

const isEdit = computed(() => Boolean(selectedSession.value?.id));

const EMPTY_FORM = {
  annee_id: '',
  semestre_id: '',
  code: '',
  designation: '',
  type_session: 'NORMALE',
  etat: 'ACTIVE',
  date_debut: '',
  date_fin: '',
  responsable: '',
};

const form = reactive({ ...EMPTY_FORM });
const dateError = ref(false);
const errorMessage = ref('');

/** Les années et l'année courante alimentent le sélecteur. */
anneeStore.fetchAll();
anneeStore.fetchCurrent();

/** @param {string|null|undefined} value */
const toDateInput = (value) => (value ? String(value).slice(0, 10) : '');

watch(
  selectedSession,
  (session) => {
    dateError.value = false;
    errorMessage.value = '';

    if (!session) {
      Object.assign(form, EMPTY_FORM, { annee_id: anneeCourante.value?.id ?? '' });
      return;
    }

    Object.assign(form, {
      annee_id: session.annee_id ?? '',
      semestre_id: session.semestre_id ?? '',
      code: session.code ?? '',
      designation: session.designation ?? '',
      type_session: session.type_session ?? 'NORMALE',
      etat: session.etat ?? 'ACTIVE',
      date_debut: toDateInput(session.date_debut),
      date_fin: toDateInput(session.date_fin),
      responsable: session.responsable ?? '',
    });
  },
  { immediate: true }
);

// Les semestres dépendent de l'année : changer d'année invalide le semestre
// retenu, sauf au chargement d'une session existante (dont le semestre est
// justement celui de son année).
watch(
  () => form.annee_id,
  async (anneeId, ancienne) => {
    if (ancienne !== undefined && anneeId !== ancienne) {
      form.semestre_id = selectedSession.value?.semestre_id ?? '';
    }
    if (anneeId) await semestreStore.fetchByAnnee(anneeId);
  },
  { immediate: true }
);

function validateDates() {
  dateError.value =
    Boolean(form.date_debut && form.date_fin) &&
    new Date(form.date_fin) < new Date(form.date_debut);
}

async function handleSubmit() {
  validateDates();

  if (dateError.value) {
    errorMessage.value = 'La date de fin ne peut pas être antérieure à la date de début.';
    return;
  }

  errorMessage.value = '';

  const result = isEdit.value
    ? await sessionStore.update(selectedSession.value.id, { ...form })
    : await sessionStore.create({ ...form });

  // `run()` renvoie `undefined` en cas d'échec : on ne ferme que si ça a marché.
  if (result !== undefined) close();
}
</script>

<template>
  <div
    :id="SESSION_MODAL_ID"
    class="modal fade"
    tabindex="-1"
    aria-labelledby="sessionModalLabel"
    aria-hidden="true"
  >
    <div class="modal-dialog modal-dialog-centered modal-lg">
      <div class="modal-content border-0 shadow-lg">
        <div class="modal-header bg-primary text-white">
          <h5 id="sessionModalLabel" class="modal-title">
            <i class="bi bi-calendar-plus me-2"></i>
            {{ isEdit ? 'Modifier la session' : "Ajouter une nouvelle session d'examen" }}
          </h5>
          <button
            type="button"
            class="btn-close btn-close-white"
            data-bs-dismiss="modal"
            aria-label="Close"
            :disabled="loading"
          ></button>
        </div>

        <form @submit.prevent="handleSubmit">
          <div class="modal-body p-4">
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label fw-bold small">Année Académique *</label>
                <select
                  v-model="form.annee_id"
                  class="form-select fw-semibold text-dark"
                  required
                  :disabled="loading"
                >
                  <option value="" disabled>— Sélectionnez une année —</option>
                  <option v-for="annee in annees" :key="annee.id" :value="annee.id">
                    {{ annee.code }}
                    <span v-if="anneeCourante && annee.id === anneeCourante.id"> (Courante)</span>
                  </option>
                </select>
                <div class="form-text text-muted text-xs">
                  <i class="bi bi-info-circle me-1"></i> Les semestres se chargeront automatiquement
                  après sélection.
                </div>
              </div>

              <div class="col-md-6">
                <label class="form-label fw-bold small">Semestre *</label>
                <select
                  v-model="form.semestre_id"
                  class="form-select"
                  required
                  :disabled="loading || !form.annee_id || semestresLoading"
                >
                  <option v-if="semestresLoading" value="" disabled>
                    Chargement des semestres...
                  </option>
                  <option v-else value="" disabled>— Sélectionnez un semestre —</option>

                  <option v-for="sem in semestres" :key="sem.id" :value="sem.id">
                    {{ sem.code }} - {{ sem.designation }}
                  </option>
                </select>
                <div v-if="!form.annee_id" class="form-text text-warning text-xs">
                  Veuillez d'abord choisir une année académique.
                </div>
                <div
                  v-else-if="semestres.length === 0 && !semestresLoading"
                  class="form-text text-danger text-xs"
                >
                  <i class="bi bi-exclamation-triangle-fill me-1"></i> Aucun semestre configuré pour
                  cette année.
                </div>
              </div>

              <div class="col-md-6">
                <label class="form-label fw-bold small">Code Unique *</label>
                <input
                  v-model="form.code"
                  type="text"
                  class="form-control font-monospace"
                  placeholder="Ex: S1_NORM_2026"
                  required
                  :disabled="loading"
                />
              </div>

              <div class="col-md-6">
                <label class="form-label fw-bold small">Désignation *</label>
                <input
                  v-model="form.designation"
                  type="text"
                  class="form-control"
                  placeholder="Ex: Session Normale Semestre 1"
                  required
                  :disabled="loading"
                />
              </div>

              <div class="col-md-6">
                <label class="form-label fw-bold small">Type de Session *</label>
                <select
                  v-model="form.type_session"
                  class="form-select"
                  required
                  :disabled="loading"
                >
                  <option v-for="type in TYPES_SESSION" :key="type.code" :value="type.code">
                    {{ type.code }}
                  </option>
                </select>
              </div>

              <div class="col-md-6">
                <label class="form-label fw-bold small">État *</label>
                <!-- Le backend n'accepte que INACTIVE, ACTIVE et ARCHIVE.
                     L'ancienne version proposait « Brouillon », jamais valide. -->
                <select v-model="form.etat" class="form-select" required :disabled="loading">
                  <option v-for="etat in ETAT_SESSION_LIST" :key="etat.code" :value="etat.code">
                    {{ etat.label }}
                  </option>
                </select>
              </div>

              <div class="col-md-6">
                <label class="form-label fw-bold small">Date de Début *</label>
                <input
                  v-model="form.date_debut"
                  type="date"
                  class="form-control"
                  :class="{ 'is-invalid': dateError }"
                  required
                  :disabled="loading"
                  @change="validateDates"
                />
              </div>

              <div class="col-md-6">
                <label class="form-label fw-bold small">Date de Fin *</label>
                <input
                  v-model="form.date_fin"
                  type="date"
                  class="form-control"
                  :class="{ 'is-invalid': dateError }"
                  required
                  :disabled="loading"
                  @change="validateDates"
                />
                <div v-if="dateError" class="invalid-feedback text-xs">
                  La date de fin ne peut pas être antérieure à la date de début.
                </div>
              </div>

              <div class="col-md-12">
                <label class="form-label fw-bold small">Responsable / Entité Organisatrice *</label>
                <input
                  v-model="form.responsable"
                  type="text"
                  class="form-control"
                  placeholder="Ex: Scolarité Centrale, Direction des Études"
                  required
                  :disabled="loading"
                />
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
.modal-content {
  border-radius: 12px;
}
.form-label {
  color: #495057;
}
</style>
