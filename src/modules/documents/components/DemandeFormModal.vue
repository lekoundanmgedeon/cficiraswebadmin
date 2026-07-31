<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useEtudiantStore } from '@/modules/etudiants/store';
import { useAnneeStore } from '@/modules/structure-academique/annee/store';
import { useClasseStore } from '@/modules/structure-academique/classe/store';
import { useDocumentStore } from '../store';
import { useDemandeForm } from '../composables/useDemandeForm';
import { DEMANDE_MODAL_ID, EXEMPLAIRES } from '../constants';

/**
 * Dépôt d'une demande de document.
 *
 * ## Le formulaire suit le type demandé
 *
 * Chaque type de document déclare ce qu'il exige (`requiert_annee`,
 * `requiert_classe`) et son délai. Un duplicata de diplôme ne vise aucune année
 * ; un certificat de scolarité en vise une, et une classe. Les champs
 * apparaissent donc selon le type retenu, plutôt que d'être tous affichés et à
 * moitié inutiles.
 *
 * ## Le numéro n'est pas saisi
 *
 * Il est attribué par le serveur (`fn_numero_document`) à l'enregistrement, dans
 * la même transaction : un numéro consommé sans demande créée laisserait un trou
 * dans une série officielle.
 */

const store = useDocumentStore();
const etudiantStore = useEtudiantStore();
const anneeStore = useAnneeStore();
const classeStore = useClasseStore();

const { close } = useDemandeForm();
const { types } = storeToRefs(store);
const { items: etudiants } = storeToRefs(etudiantStore);
const { items: annees } = storeToRefs(anneeStore);
const { items: classes } = storeToRefs(classeStore);

const FORMULAIRE_VIDE = {
  etudiant_id: '',
  type_document: '',
  annee_academique_id: '',
  classe_id: '',
  motif: '',
  nb_exemplaires: 1,
  urgence: false,
};

const form = ref({ ...FORMULAIRE_VIDE });
const errorMessage = ref('');

const loading = computed(() => store.loading);
const anneeActive = computed(() => annees.value.find((annee) => annee.est_active));
const typeRetenu = computed(() => store.typeParCode(form.value.type_document));

onMounted(async () => {
  await Promise.all([
    store.fetchTypes(),
    etudiantStore.fetchAll(),
    anneeStore.fetchAll(),
    classeStore.fetchAll(),
  ]);

  form.value.annee_academique_id = anneeActive.value?.id ?? '';
});

/** Échéance annoncée, dérivée du délai du type — la base pose la même. */
const echeanceEstimee = computed(() => {
  if (!typeRetenu.value) return null;

  const echeance = new Date();
  echeance.setDate(echeance.getDate() + Number(typeRetenu.value.delai_jours ?? 3));
  return echeance.toLocaleDateString('fr-FR');
});

watch(
  () => form.value.type_document,
  () => {
    // Un type qui ne vise pas d'année ne doit pas en emporter une au passage.
    if (typeRetenu.value && !typeRetenu.value.requiert_annee) {
      form.value.annee_academique_id = '';
    } else if (!form.value.annee_academique_id) {
      form.value.annee_academique_id = anneeActive.value?.id ?? '';
    }

    if (typeRetenu.value && !typeRetenu.value.requiert_classe) {
      form.value.classe_id = '';
    }
  }
);

/** @returns {boolean} */
function valider() {
  if (!form.value.etudiant_id) {
    errorMessage.value = 'Choisissez l’étudiant qui demande le document.';
    return false;
  }
  if (!form.value.type_document) {
    errorMessage.value = 'Choisissez le document demandé.';
    return false;
  }
  if (typeRetenu.value?.requiert_annee && !form.value.annee_academique_id) {
    errorMessage.value = `« ${typeRetenu.value.libelle} » vise une année académique : précisez-la.`;
    return false;
  }
  if (form.value.nb_exemplaires < EXEMPLAIRES.MIN || form.value.nb_exemplaires > EXEMPLAIRES.MAX) {
    errorMessage.value = `Le nombre d’exemplaires doit être compris entre ${EXEMPLAIRES.MIN} et ${EXEMPLAIRES.MAX}.`;
    return false;
  }

  errorMessage.value = '';
  return true;
}

async function submit() {
  if (!valider()) return;

  const charge = Object.fromEntries(
    Object.entries(form.value).map(([cle, valeur]) => [cle, valeur === '' ? null : valeur])
  );

  const result = await store.create(charge);

  if (result !== undefined) {
    form.value = { ...FORMULAIRE_VIDE, annee_academique_id: anneeActive.value?.id ?? '' };
    close();
  }
}
</script>

<template>
  <div :id="DEMANDE_MODAL_ID" class="modal fade" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered modal-lg">
      <div class="modal-content">
        <div class="modal-header bg-primary text-white">
          <h5 class="modal-title">Nouvelle demande de document</h5>
          <button
            type="button"
            class="btn-close btn-close-white"
            data-bs-dismiss="modal"
            aria-label="Fermer"
          ></button>
        </div>

        <form @submit.prevent="submit">
          <div class="modal-body">
            <div class="row g-3">
              <div class="col-md-7">
                <label for="demande-etudiant" class="form-label">
                  Étudiant <span class="text-danger">*</span>
                </label>
                <select
                  id="demande-etudiant"
                  v-model="form.etudiant_id"
                  class="form-select"
                  required
                >
                  <option value="">— Choisir un étudiant —</option>
                  <option v-for="etudiant in etudiants" :key="etudiant.id" :value="etudiant.id">
                    {{ etudiant.matricule }} — {{ etudiant.nom }} {{ etudiant.prenom }}
                  </option>
                </select>
              </div>

              <div class="col-md-5">
                <label for="demande-type" class="form-label">
                  Document demandé <span class="text-danger">*</span>
                </label>
                <select id="demande-type" v-model="form.type_document" class="form-select" required>
                  <option value="">— Choisir —</option>
                  <option v-for="type in types" :key="type.code" :value="type.code">
                    {{ type.libelle }}
                  </option>
                </select>
                <div v-if="typeRetenu" class="form-text" style="font-size: 11px">
                  Délai annoncé : {{ typeRetenu.delai_jours }} jour(s) — prêt vers le
                  {{ echeanceEstimee }}.
                </div>
              </div>

              <div v-if="typeRetenu?.description" class="col-12">
                <div class="alert alert-light border py-2 small mb-0">
                  <i class="mdi mdi-information-outline me-1"></i>
                  {{ typeRetenu.description }}
                </div>
              </div>

              <div v-if="typeRetenu?.requiert_annee" class="col-md-6">
                <label for="demande-annee" class="form-label">
                  Année académique <span class="text-danger">*</span>
                </label>
                <select id="demande-annee" v-model="form.annee_academique_id" class="form-select">
                  <option value="">— Choisir —</option>
                  <option v-for="annee in annees" :key="annee.id" :value="annee.id">
                    {{ annee.code }}{{ annee.est_active ? ' (active)' : '' }}
                  </option>
                </select>
              </div>

              <div v-if="typeRetenu?.requiert_classe" class="col-md-6">
                <label for="demande-classe" class="form-label">Classe</label>
                <select id="demande-classe" v-model="form.classe_id" class="form-select">
                  <option value="">— Non précisée —</option>
                  <option v-for="classe in classes" :key="classe.id" :value="classe.id">
                    {{ classe.code }} — {{ classe.filiere_nom }}
                  </option>
                </select>
              </div>

              <div class="col-md-3">
                <label for="demande-exemplaires" class="form-label">Exemplaires</label>
                <input
                  id="demande-exemplaires"
                  v-model.number="form.nb_exemplaires"
                  type="number"
                  class="form-control"
                  :min="EXEMPLAIRES.MIN"
                  :max="EXEMPLAIRES.MAX"
                />
              </div>

              <div class="col-md-3 d-flex align-items-end">
                <div class="form-check mb-2">
                  <input
                    id="demande-urgence"
                    v-model="form.urgence"
                    class="form-check-input"
                    type="checkbox"
                  />
                  <label class="form-check-label" for="demande-urgence">Demande urgente</label>
                </div>
              </div>

              <div class="col-12">
                <label for="demande-motif" class="form-label">Motif de la demande</label>
                <textarea
                  id="demande-motif"
                  v-model="form.motif"
                  class="form-control"
                  rows="2"
                  placeholder="Ex : dossier de bourse, inscription dans un autre établissement…"
                ></textarea>
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
              {{ loading ? 'Enregistrement...' : 'Déposer la demande' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
