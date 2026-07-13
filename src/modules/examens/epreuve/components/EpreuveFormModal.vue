<script setup>
import { computed, reactive, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useModuleStore } from '@/modules/matieres/store';
import { useEpreuveStore } from '../store';
import { useEpreuveForm } from '../composables/useEpreuveForm';
import { EPREUVE_MODAL_ID, PONDERATION, TYPES_EPREUVE } from '../../constants';

const props = defineProps({
  /** La session à laquelle l'épreuve est rattachée. */
  sessionId: { type: String, required: true },
});

/**
 * Formulaire d'épreuve — création et édition.
 *
 * Il n'en existait aucun : `PlanExamen.vue` composait ses épreuves dans un objet
 * local (`activeEvaluations`) qui n'était jamais envoyé nulle part.
 *
 * Les deux contraintes de la table sont vérifiées ici, car elles sont portées
 * par la **base** et non par le contrôleur : un envoi non conforme remonterait
 * en erreur SQL brute, illisible.
 *
 *  - `type_eval` ∈ { CC, TP, EXAMEN, PROJET }
 *  - `ponderation` ∈ ]0, 100]
 */

const epreuveStore = useEpreuveStore();
const moduleStore = useModuleStore();

const { selectedEpreuve, close } = useEpreuveForm();
const { items: modules } = storeToRefs(moduleStore);

const loading = computed(() => epreuveStore.loading);
const isEdit = computed(() => Boolean(selectedEpreuve.value?.id));

const EMPTY_FORM = {
  module_id: '',
  type_eval: 'EXAMEN',
  designation: '',
  ponderation: 100,
  date_prevue: '',
};

const form = reactive({ ...EMPTY_FORM });
const errorMessage = ref('');

moduleStore.fetchAll();

watch(
  selectedEpreuve,
  (epreuve) => {
    errorMessage.value = '';

    Object.assign(
      form,
      epreuve
        ? {
            module_id: epreuve.module_id ?? '',
            type_eval: epreuve.type_eval ?? 'EXAMEN',
            designation: epreuve.designation ?? '',
            ponderation: Number(epreuve.ponderation ?? 100),
            date_prevue: epreuve.date_prevue ? String(epreuve.date_prevue).slice(0, 10) : '',
          }
        : EMPTY_FORM
    );
  },
  { immediate: true }
);

/** @returns {boolean} */
function validate() {
  if (!form.module_id) {
    errorMessage.value = 'Choisissez le module évalué.';
    return false;
  }
  if (!form.designation.trim()) {
    errorMessage.value = 'La désignation est obligatoire.';
    return false;
  }

  const ponderation = Number(form.ponderation);
  if (!(ponderation > 0) || ponderation > PONDERATION.MAX) {
    errorMessage.value = `La pondération doit être comprise entre ${PONDERATION.MIN} et ${PONDERATION.MAX}.`;
    return false;
  }

  errorMessage.value = '';
  return true;
}

async function submit() {
  if (!validate()) return;

  const payload = {
    module_id: form.module_id,
    session_id: props.sessionId,
    type_eval: form.type_eval,
    designation: form.designation.trim(),
    ponderation: Number(form.ponderation),
    // `date_prevue` est la seule colonne nullable de la table.
    date_prevue: form.date_prevue || null,
  };

  const result = isEdit.value
    ? await epreuveStore.update(selectedEpreuve.value.id, payload)
    : await epreuveStore.create(payload);

  if (result !== undefined) close();
}
</script>

<template>
  <div :id="EPREUVE_MODAL_ID" class="modal fade" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered modal-lg">
      <div class="modal-content border-0 shadow-lg">
        <div class="modal-header bg-primary text-white">
          <h5 class="modal-title">
            <i class="bi bi-journal-plus me-2"></i>
            {{ isEdit ? "Modifier l'épreuve" : 'Ajouter une épreuve' }}
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
                <label class="form-label fw-bold small">Module évalué *</label>
                <select v-model="form.module_id" class="form-select" required :disabled="loading">
                  <option value="" disabled>— Sélectionnez un module —</option>
                  <option v-for="module in modules" :key="module.id" :value="module.id">
                    {{ module.code }} — {{ module.designation }}
                  </option>
                </select>
              </div>

              <div class="col-md-6">
                <label class="form-label fw-bold small">Type d'épreuve *</label>
                <select v-model="form.type_eval" class="form-select" required :disabled="loading">
                  <option v-for="type in TYPES_EPREUVE" :key="type.code" :value="type.code">
                    {{ type.label }}
                  </option>
                </select>
              </div>

              <div class="col-md-12">
                <label class="form-label fw-bold small">Désignation *</label>
                <input
                  v-model="form.designation"
                  type="text"
                  class="form-control"
                  placeholder="Ex : Examen final Algorithmique"
                  required
                  :disabled="loading"
                />
              </div>

              <div class="col-md-6">
                <label class="form-label fw-bold small">Pondération (%) *</label>
                <div class="input-group">
                  <input
                    v-model.number="form.ponderation"
                    type="number"
                    class="form-control"
                    :min="PONDERATION.MIN"
                    :max="PONDERATION.MAX"
                    step="0.01"
                    required
                    :disabled="loading"
                  />
                  <span class="input-group-text">%</span>
                </div>
                <div class="form-text text-muted text-xs">
                  Strictement supérieure à 0, au plus {{ PONDERATION.MAX }}.
                </div>
              </div>

              <div class="col-md-6">
                <label class="form-label fw-bold small">Date prévue</label>
                <input
                  v-model="form.date_prevue"
                  type="date"
                  class="form-control"
                  :disabled="loading"
                />
                <div class="form-text text-muted text-xs">
                  Facultative — c'est elle qui place l'épreuve au calendrier.
                </div>
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
</style>
