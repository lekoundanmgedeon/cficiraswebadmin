<script setup>
import { computed, ref, watch } from 'vue';
import { useAnneeStore } from '../store';
import { useAnneeForm } from '../composables/useAnneeForm';
import { ANNEE_MODAL_ID, STATUT, STATUT_OPTIONS } from '../constants';

/**
 * Formulaire de création / édition d'une année académique.
 *
 * L'ancienne version affichait un message de succès local puis fermait la
 * modale après un `setTimeout` de 1,2 s — sans vérifier que l'enregistrement
 * avait réussi. Une création refusée par le backend affichait donc « créée avec
 * succès » avant de se refermer. Ici, la fermeture est conditionnée au
 * résultat réel de l'appel, et le succès est notifié par le store (toast).
 */

const anneeStore = useAnneeStore();
const { selectedAnnee, close } = useAnneeForm();

const EMPTY_FORM = {
  code: '',
  date_debut: '',
  date_fin: '',
  statut: STATUT.PLANIFIEE,
  est_active: false,
};

const form = ref({ ...EMPTY_FORM });
const errorMessage = ref('');

const isEdit = computed(() => Boolean(selectedAnnee.value?.id));
const loading = computed(() => anneeStore.loading);

// La modale est montée une fois pour toutes : c'est le passage de
// `selectedAnnee` à une valeur (édition) ou à `null` (création) qui réinitialise
// le formulaire.
watch(
  selectedAnnee,
  (annee) => {
    errorMessage.value = '';
    form.value = annee
      ? {
          code: annee.code ?? '',
          date_debut: annee.date_debut ?? '',
          date_fin: annee.date_fin ?? '',
          statut: annee.statut ?? STATUT.PLANIFIEE,
          est_active: Boolean(annee.est_active),
        }
      : { ...EMPTY_FORM };
  },
  { immediate: true }
);

/** @returns {boolean} */
function validate() {
  const { code, date_debut, date_fin, statut } = form.value;

  if (!code.trim()) {
    errorMessage.value = 'Le code est obligatoire.';
    return false;
  }
  if (!date_debut || !date_fin) {
    errorMessage.value = 'Veuillez remplir les deux dates.';
    return false;
  }
  if (new Date(date_fin) <= new Date(date_debut)) {
    errorMessage.value = 'La date de fin doit être postérieure à la date de début.';
    return false;
  }
  if (!statut) {
    errorMessage.value = 'Le statut est obligatoire.';
    return false;
  }

  errorMessage.value = '';
  return true;
}

async function submit() {
  if (!validate()) return;

  // Les actions du store renvoient `undefined` en cas d'échec (et ont déjà
  // notifié l'utilisateur) : on ne ferme la modale que sur un succès avéré.
  const result = isEdit.value
    ? await anneeStore.update(selectedAnnee.value.id, form.value)
    : await anneeStore.create(form.value);

  if (result !== undefined) close();
}
</script>

<template>
  <div :id="ANNEE_MODAL_ID" class="modal fade" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header bg-primary text-white">
          <h5 class="modal-title">{{ isEdit ? 'Modifier' : 'Ajouter' }} une année académique</h5>
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
              <label for="annee-code" class="form-label">
                Code <span class="text-danger">*</span>
              </label>
              <input
                id="annee-code"
                v-model="form.code"
                type="text"
                class="form-control"
                placeholder="Ex: 2025-2026"
                required
              />
              <small class="text-muted">Format recommandé : AAAA-AAAA</small>
            </div>

            <div class="row">
              <div class="col-md-6 mb-3">
                <label for="annee-debut" class="form-label">
                  Date de début <span class="text-danger">*</span>
                </label>
                <input
                  id="annee-debut"
                  v-model="form.date_debut"
                  type="date"
                  class="form-control"
                  required
                />
              </div>

              <div class="col-md-6 mb-3">
                <label for="annee-fin" class="form-label">
                  Date de fin <span class="text-danger">*</span>
                </label>
                <input
                  id="annee-fin"
                  v-model="form.date_fin"
                  type="date"
                  class="form-control"
                  required
                />
              </div>
            </div>

            <div class="mb-3">
              <label for="annee-statut" class="form-label">
                Statut <span class="text-danger">*</span>
              </label>
              <select id="annee-statut" v-model="form.statut" class="form-select" required>
                <option v-for="option in STATUT_OPTIONS" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
            </div>

            <div class="p-3 bg-light rounded mb-3">
              <div class="form-check">
                <input
                  id="annee-active"
                  v-model="form.est_active"
                  type="checkbox"
                  class="form-check-input"
                />
                <label class="form-check-label" for="annee-active">
                  <strong>Définir comme année active</strong>
                  <br />
                  <small class="text-muted">Une seule année peut être active à la fois</small>
                </label>
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
