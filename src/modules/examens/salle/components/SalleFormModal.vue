<script setup>
import { computed, reactive, ref, watch } from 'vue';
import { useSalleStore } from '../store';
import { useSalleForm } from '../composables/useSalleForm';
import { SALLE_MODAL_ID, TYPES_SALLE } from '../../constants';

/**
 * Formulaire de salle — création et édition.
 *
 * Il n'en existait aucun : les salles n'étaient pas des entités, mais deux
 * nombres saisis à la main.
 *
 * Les règles ci-dessous sont celles de la **base** (`CHECK` et `NOT NULL`), pas
 * du contrôleur : un envoi non conforme remonterait en erreur SQL brute
 * (« violates check constraint »), illisible.
 */

const salleStore = useSalleStore();
const { selectedSalle, close } = useSalleForm();

const loading = computed(() => salleStore.loading);
const isEdit = computed(() => Boolean(selectedSalle.value?.id));

const EMPTY_FORM = {
  code_salle: '',
  batiment: '',
  numero: '',
  capacite: 30,
  type: 'Cours',
};

const form = reactive({ ...EMPTY_FORM });
const errorMessage = ref('');

watch(
  selectedSalle,
  (salle) => {
    errorMessage.value = '';

    Object.assign(
      form,
      salle
        ? {
            code_salle: salle.code_salle ?? '',
            batiment: salle.batiment ?? '',
            numero: salle.numero ?? '',
            capacite: Number(salle.capacite ?? 30),
            type: salle.type ?? 'Cours',
          }
        : EMPTY_FORM
    );
  },
  { immediate: true }
);

/** @returns {boolean} */
function validate() {
  // Les cinq colonnes sont NOT NULL en base.
  const manquants = ['code_salle', 'batiment', 'numero', 'type'].filter(
    (champ) => !String(form[champ] ?? '').trim()
  );

  if (manquants.length > 0) {
    errorMessage.value = 'Le code, le bâtiment, le numéro et le type sont obligatoires.';
    return false;
  }

  // CHECK (capacite > 0)
  if (!Number.isInteger(Number(form.capacite)) || Number(form.capacite) <= 0) {
    errorMessage.value = 'La capacité doit être un entier strictement positif.';
    return false;
  }

  errorMessage.value = '';
  return true;
}

async function submit() {
  if (!validate()) return;

  const payload = {
    code_salle: form.code_salle.trim(),
    batiment: form.batiment.trim(),
    numero: String(form.numero).trim(),
    capacite: Number(form.capacite),
    type: form.type,
  };

  const result = isEdit.value
    ? await salleStore.update(selectedSalle.value.id, payload)
    : await salleStore.create(payload);

  if (result !== undefined) close();
}
</script>

<template>
  <div :id="SALLE_MODAL_ID" class="modal fade" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content border-0 shadow-lg">
        <div class="modal-header bg-primary text-white">
          <h5 class="modal-title">
            <i class="bi bi-door-closed me-2"></i>
            {{ isEdit ? 'Modifier la salle' : 'Ajouter une salle' }}
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
                <label class="form-label fw-bold small">Code de la salle *</label>
                <input
                  v-model="form.code_salle"
                  type="text"
                  class="form-control font-monospace"
                  placeholder="Ex : B101"
                  required
                  :disabled="loading"
                />
                <div class="form-text text-muted text-xs">
                  Enregistré en majuscules. Il doit être unique.
                </div>
              </div>

              <div class="col-md-6">
                <label class="form-label fw-bold small">Type *</label>
                <select v-model="form.type" class="form-select" required :disabled="loading">
                  <option v-for="type in TYPES_SALLE" :key="type" :value="type">{{ type }}</option>
                </select>
              </div>

              <div class="col-md-6">
                <label class="form-label fw-bold small">Bâtiment *</label>
                <input
                  v-model="form.batiment"
                  type="text"
                  class="form-control"
                  placeholder="Ex : Bâtiment B"
                  required
                  :disabled="loading"
                />
              </div>

              <div class="col-md-3">
                <label class="form-label fw-bold small">Numéro *</label>
                <input
                  v-model="form.numero"
                  type="text"
                  class="form-control"
                  placeholder="101"
                  required
                  :disabled="loading"
                />
              </div>

              <div class="col-md-3">
                <label class="form-label fw-bold small">Capacité *</label>
                <input
                  v-model.number="form.capacite"
                  type="number"
                  class="form-control"
                  min="1"
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
</style>
