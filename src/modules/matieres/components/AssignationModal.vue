<script setup>
import { computed, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { openModal, closeModal } from '@/shared/utils/modal';
import { useClasseStore } from '@/modules/structure-academique/classe/store';
import { useModuleStore } from '../store';
import { ASSIGNATION_MODAL_ID } from '../constants';

/**
 * Rattache un module à une classe, pour un semestre.
 *
 * Deux frictions d'API à absorber ici :
 *
 * 1. `POST /modules/assigner` désigne les entités par leur **code**
 *    (`codeModule`, `codeClasse`, `codeSemestre`), alors que la configuration
 *    servie par `/configuration/semestres` ne fournit qu'un `classe_id`. Le code
 *    de la classe est donc résolu depuis le store des classes.
 *
 * 2. L'endpoint répond **HTTP 200 même en cas d'échec** (`success: true`,
 *    « Module assigné à la classe avec succès »), le vrai verdict étant dans
 *    `data.statut`. `moduleStore.assignModule` lit le corps et renvoie un booléen ;
 *    la modale ne se ferme que sur un vrai succès.
 *
 * L'**enseignant est obligatoire**, bien que rien ne le laisse deviner : le
 * paramètre est accepté à `null` et la requête répond 200, mais la fonction
 * Postgres refuse l'affectation sans matricule — et son message d'erreur, bâti
 * par concaténation SQL avec ce paramètre nul, remonte alors *vide*. On l'exige
 * donc côté client, plutôt que de laisser l'utilisateur face à un échec muet.
 *
 * Il est saisi au matricule et non choisi dans une liste : le domaine
 * `/pedagogie` — le seul à exposer les enseignants — est **commenté dans
 * `index.routes.js` du backend**, donc désactivé. Aucun endpoint ne permet de
 * les lister.
 */

const props = defineProps({
  /** La configuration (semestre, classe) ciblée. `null` tant qu'aucune n'est choisie. */
  config: { type: Object, default: null },
});

const moduleStore = useModuleStore();
const classeStore = useClasseStore();

const { items: modules } = storeToRefs(moduleStore);
const { items: classes } = storeToRefs(classeStore);

const codeModule = ref('');
const codeEnseignant = ref('');
const errorMessage = ref('');

const loading = computed(() => moduleStore.loading);

/** Le code de la classe, que la configuration ne porte pas. */
const codeClasse = computed(
  () => classes.value.find((classe) => classe.id === props.config?.classe_id)?.code ?? ''
);

/** Les modules déjà rattachés n'ont pas à être proposés une seconde fois. */
const modulesDisponibles = computed(() => {
  const dejaRattaches = new Set(moduleStore.ues.map((ue) => ue.code));
  return modules.value.filter((module) => !dejaRattaches.has(module.code));
});

function open() {
  errorMessage.value = '';
  codeModule.value = '';
  codeEnseignant.value = '';

  // Les deux collections sont mises en cache par leur store : rouvrir la modale
  // ne coûte aucune requête supplémentaire.
  moduleStore.fetchAll();
  classeStore.fetchAll();

  openModal(ASSIGNATION_MODAL_ID);
}

watch(
  () => props.config,
  () => {
    errorMessage.value = '';
  }
);

async function submit() {
  if (!codeModule.value) {
    errorMessage.value = 'Choisissez un module à rattacher.';
    return;
  }

  if (!codeEnseignant.value.trim()) {
    errorMessage.value =
      "Le matricule de l'enseignant est obligatoire : le serveur refuse un rattachement sans chargé de cours.";
    return;
  }

  if (!codeClasse.value) {
    errorMessage.value = "Le code de la classe n'a pas pu être déterminé.";
    return;
  }

  errorMessage.value = '';

  const ok = await moduleStore.assignModule(
    {
      codeModule: codeModule.value,
      codeClasse: codeClasse.value,
      codeSemestre: props.config.code,
      codeEnseignant: codeEnseignant.value.trim(),
    },
    { semestreId: props.config.semestre_id, classeId: props.config.classe_id }
  );

  if (ok) closeModal(ASSIGNATION_MODAL_ID);
}
</script>

<template>
  <div>
    <button class="btn btn-primary" :disabled="!config" @click="open">
      <i class="mdi mdi-link-variant me-1"></i> Rattacher un module
    </button>

    <div :id="ASSIGNATION_MODAL_ID" class="modal fade" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header bg-primary text-white">
            <h5 class="modal-title">Rattacher un module</h5>
            <button
              type="button"
              class="btn-close btn-close-white"
              data-bs-dismiss="modal"
              aria-label="Fermer"
            ></button>
          </div>

          <form @submit.prevent="submit">
            <div class="modal-body">
              <div v-if="config" class="border rounded p-3 mb-3 bg-light">
                <div class="d-flex justify-content-between py-1">
                  <span class="text-muted small">Classe</span>
                  <span class="fw-semibold">{{ codeClasse || '—' }}</span>
                </div>
                <div class="d-flex justify-content-between py-1">
                  <span class="text-muted small">Semestre</span>
                  <span class="fw-semibold">{{ config.code }}</span>
                </div>
                <div class="d-flex justify-content-between py-1">
                  <span class="text-muted small">Filière</span>
                  <span class="fw-semibold">{{ config.filiere }}</span>
                </div>
              </div>

              <div class="mb-3">
                <label for="assign-module" class="form-label">
                  Module <span class="text-danger">*</span>
                </label>
                <select id="assign-module" v-model="codeModule" class="form-select" required>
                  <option value="">Choisir un module</option>
                  <option
                    v-for="module in modulesDisponibles"
                    :key="module.id"
                    :value="module.code"
                  >
                    {{ module.code }} — {{ module.designation }}
                  </option>
                </select>
                <div v-if="modulesDisponibles.length === 0" class="form-text text-warning">
                  Tous les modules existants sont déjà rattachés à cette classe.
                </div>
              </div>

              <div class="mb-0">
                <label for="assign-enseignant" class="form-label">
                  Enseignant <span class="text-danger">*</span>
                </label>
                <input
                  id="assign-enseignant"
                  v-model="codeEnseignant"
                  type="text"
                  class="form-control"
                  placeholder="Ex : ENS-001"
                  required
                />
                <div class="form-text">
                  Matricule du chargé de cours. Le serveur refuse un rattachement sans enseignant.
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
                {{ loading ? 'Rattachement...' : 'Rattacher' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>
