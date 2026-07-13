<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useClasseStore } from '../store';
import { useFiliereStore } from '../../filiere/store';
import { useNiveauStore } from '../../niveau/store';
import { useClasseForm, CLASSE_MODAL_ID } from '../composables/useClasseForm';

/**
 * Formulaire de création / édition d'une classe.
 *
 * Une classe est rattachée à une filière et à un niveau : ce formulaire touche
 * trois sous-domaines à la fois. C'est la dépendance la plus forte de la
 * structure académique, et la raison principale de les réunir en un module.
 */

const classeStore = useClasseStore();
const filiereStore = useFiliereStore();
const niveauStore = useNiveauStore();
const { selectedClasse, close } = useClasseForm();

const { items: filieres } = storeToRefs(filiereStore);
const { items: niveaux } = storeToRefs(niveauStore);

const EMPTY_FORM = {
  code: '',
  filiere_id: '',
  niveau_id: '',
  capacite_max: null,
};

const form = ref({ ...EMPTY_FORM });
const errorMessage = ref('');

const isEdit = computed(() => Boolean(selectedClasse.value?.id));
const loading = computed(() => classeStore.loading);

// Les deux listes sont mises en cache par leurs stores : ouvrir ce formulaire
// après avoir consulté les écrans filières ou niveaux ne coûte aucune requête.
onMounted(() => Promise.all([filiereStore.fetchAll(), niveauStore.fetchAll()]));

/**
 * Les niveaux proposés se limitent à ceux du cycle de la filière choisie : un
 * niveau de Master n'a rien à faire dans une classe de Licence.
 */
const filteredNiveaux = computed(() => {
  const filiere = filieres.value.find((item) => item.id === form.value.filiere_id);
  if (!filiere) return [];

  return niveaux.value.filter((niveau) => niveau.cycle_id === filiere.cycle_id);
});

watch(
  selectedClasse,
  (classe) => {
    errorMessage.value = '';
    form.value = classe
      ? {
          code: classe.code ?? '',
          filiere_id: classe.filiere_id ?? '',
          niveau_id: classe.niveau_id ?? '',
          capacite_max: classe.capacite_max ?? null,
        }
      : { ...EMPTY_FORM };
  },
  { immediate: true }
);

// Changer de filière peut rendre le niveau sélectionné incohérent : on le vide
// plutôt que d'envoyer au backend un couple filière/niveau impossible.
watch(
  () => form.value.filiere_id,
  () => {
    const stillValid = filteredNiveaux.value.some(
      (niveau) => niveau.id === form.value.niveau_id
    );
    if (!stillValid) form.value.niveau_id = '';
  }
);

/** @returns {boolean} */
function validate() {
  const { code, filiere_id: filiereId, niveau_id: niveauId, capacite_max: capacite } = form.value;

  if (!code.trim()) {
    errorMessage.value = 'Le code est obligatoire.';
    return false;
  }
  if (!filiereId) {
    errorMessage.value = 'La filière est obligatoire.';
    return false;
  }
  if (!niveauId) {
    errorMessage.value = 'Le niveau est obligatoire.';
    return false;
  }
  if (capacite !== null && capacite < 1) {
    errorMessage.value = 'La capacité maximale doit être supérieure à zéro.';
    return false;
  }

  errorMessage.value = '';
  return true;
}

async function submit() {
  if (!validate()) return;

  const result = isEdit.value
    ? await classeStore.update(selectedClasse.value.id, form.value)
    : await classeStore.create(form.value);

  if (result !== undefined) close();
}
</script>

<template>
  <div :id="CLASSE_MODAL_ID" class="modal fade" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header bg-primary text-white">
          <h5 class="modal-title">{{ isEdit ? 'Modifier' : 'Ajouter' }} une classe</h5>
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
              <label for="classe-code" class="form-label">
                Code <span class="text-danger">*</span>
              </label>
              <input
                id="classe-code"
                v-model="form.code"
                type="text"
                class="form-control"
                placeholder="Ex : L1-INFO-A"
                required
              />
            </div>

            <div class="mb-3">
              <label for="classe-filiere" class="form-label">
                Filière <span class="text-danger">*</span>
              </label>
              <select id="classe-filiere" v-model="form.filiere_id" class="form-select" required>
                <option value="">— Sélectionner une filière —</option>
                <option v-for="filiere in filieres" :key="filiere.id" :value="filiere.id">
                  {{ filiere.designation }}
                </option>
              </select>
            </div>

            <div class="mb-3">
              <label for="classe-niveau" class="form-label">
                Niveau <span class="text-danger">*</span>
              </label>
              <select
                id="classe-niveau"
                v-model="form.niveau_id"
                class="form-select"
                :disabled="!form.filiere_id"
                required
              >
                <option value="">— Sélectionner un niveau —</option>
                <option v-for="niveau in filteredNiveaux" :key="niveau.id" :value="niveau.id">
                  {{ niveau.code }}
                </option>
              </select>
              <small v-if="!form.filiere_id" class="text-muted">
                Choisissez d'abord une filière.
              </small>
            </div>

            <div class="mb-3">
              <label for="classe-capacite" class="form-label">Capacité maximale</label>
              <input
                id="classe-capacite"
                v-model.number="form.capacite_max"
                type="number"
                min="1"
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
