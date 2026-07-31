<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useFormateurStore } from '@/modules/pedagogies/formateurs/store';
import { useAnneeStore } from '@/modules/structure-academique/annee/store';
import { useTravailStore } from '../store';
import { useTravailForm } from '../composables/useTravailForm';
import { SITUATION_LIST, TRAVAIL_MODAL_ID, TYPES_TRAVAIL } from '../../constants';

/**
 * Attribution d'un thème de mémoire.
 *
 * ## L'étudiant se choisit parmi les finalistes
 *
 * Un mémoire se rédige en dernière année : proposer les 400 étudiants de
 * l'établissement ferait chercher là où il n'y a rien. La liste vient donc de
 * `GET /coordination/finalistes`, qui déduit la dernière année du cycle
 * (`niveau.ordre = cycle.duree_annees`) — jamais d'un libellé codé en dur.
 *
 * ## L'attribution est idempotente
 *
 * Le serveur fait un `ON CONFLICT (etudiant_id, annee_academique_id) DO UPDATE` :
 * réattribuer un thème corrige l'attribution existante au lieu d'échouer. C'est
 * le geste de correction qu'attend une scolarité, et l'écran le dit.
 *
 * ## L'échéance se calcule toute seule
 *
 * `date_soumission_prevue` est posée par la base (`date_attribution +
 * duree_semaines × 7`) quand elle est laissée vide. Le champ reste modifiable
 * pour les cas particuliers.
 */

const store = useTravailStore();
const formateurStore = useFormateurStore();
const anneeStore = useAnneeStore();

const { selectedTravail, etudiantCible, close } = useTravailForm();
const { finalistes } = storeToRefs(store);
const { items: formateurs } = storeToRefs(formateurStore);
const { items: annees } = storeToRefs(anneeStore);

const FORMULAIRE_VIDE = {
  etudiant_id: '',
  annee_academique_id: '',
  type_travail: 'MEMOIRE',
  theme: '',
  resume: '',
  directeur_id: '',
  co_directeur_id: '',
  date_attribution: new Date().toISOString().slice(0, 10),
  duree_semaines: 24,
  date_soumission_prevue: '',
  situation: 'AUCUNE',
  lieu_travail: '',
  observations: '',
};

const form = ref({ ...FORMULAIRE_VIDE });
const errorMessage = ref('');

const isEdit = computed(() => Boolean(selectedTravail.value?.id));
const loading = computed(() => store.loading);
const anneeActive = computed(() => annees.value.find((annee) => annee.est_active));

onMounted(async () => {
  await Promise.all([formateurStore.fetchAll(), anneeStore.fetchAll(), store.fetchFinalistes()]);
});

/** L'étudiant déjà pourvu n'est pas écarté : on peut corriger son attribution. */
const etudiants = computed(() => finalistes.value);

const dateEcheanceEstimee = computed(() => {
  if (form.value.date_soumission_prevue) return form.value.date_soumission_prevue;
  if (!form.value.date_attribution || !form.value.duree_semaines) return null;

  const debut = new Date(form.value.date_attribution);
  debut.setDate(debut.getDate() + Number(form.value.duree_semaines) * 7);
  return debut.toISOString().slice(0, 10);
});

const dejaAttribue = computed(() => {
  if (isEdit.value || !form.value.etudiant_id) return null;
  return etudiants.value.find(
    (etudiant) => String(etudiant.etudiant_id) === String(form.value.etudiant_id)
  )?.theme;
});

watch(
  [selectedTravail, etudiantCible, anneeActive],
  () => {
    errorMessage.value = '';

    if (selectedTravail.value) {
      const travail = selectedTravail.value;
      form.value = {
        etudiant_id: travail.etudiant_id ?? '',
        annee_academique_id: travail.annee_academique_id ?? '',
        type_travail: travail.type_travail ?? 'MEMOIRE',
        theme: travail.theme ?? '',
        resume: travail.resume ?? '',
        directeur_id: travail.directeur_id ?? '',
        co_directeur_id: travail.co_directeur_id ?? '',
        date_attribution: (travail.date_attribution ?? '').slice(0, 10),
        duree_semaines: travail.duree_semaines ?? 24,
        date_soumission_prevue: (travail.date_soumission_prevue ?? '').slice(0, 10),
        situation: travail.situation ?? 'AUCUNE',
        lieu_travail: travail.lieu_travail ?? '',
        observations: travail.observations ?? '',
      };
      return;
    }

    form.value = {
      ...FORMULAIRE_VIDE,
      etudiant_id: etudiantCible.value?.etudiant_id ?? '',
      annee_academique_id: etudiantCible.value?.annee_academique_id ?? anneeActive.value?.id ?? '',
    };
  },
  { immediate: true }
);

/** @returns {boolean} */
function valider() {
  if (!form.value.etudiant_id) {
    errorMessage.value = 'Choisissez l’étudiant à qui le thème est attribué.';
    return false;
  }
  if (!form.value.annee_academique_id) {
    errorMessage.value = 'L’année académique est obligatoire.';
    return false;
  }
  if (!form.value.theme.trim()) {
    errorMessage.value = 'Le thème est obligatoire.';
    return false;
  }
  if (Number(form.value.duree_semaines) < 1) {
    errorMessage.value = 'La durée des travaux doit valoir au moins une semaine.';
    return false;
  }
  if (form.value.co_directeur_id && form.value.co_directeur_id === form.value.directeur_id) {
    errorMessage.value = 'Le co-directeur doit être différent du directeur.';
    return false;
  }

  errorMessage.value = '';
  return true;
}

async function submit() {
  if (!valider()) return;

  // Les identifiants vides doivent partir à `null` : une chaîne vide sur une
  // clé étrangère uuid fait échouer l'écriture côté base.
  const charge = Object.fromEntries(
    Object.entries(form.value).map(([cle, valeur]) => [cle, valeur === '' ? null : valeur])
  );

  const result = isEdit.value
    ? await store.update(selectedTravail.value.id, charge)
    : await store.create(charge);

  if (result !== undefined) {
    await store.fetchFinalistes();
    close();
  }
}
</script>

<template>
  <div :id="TRAVAIL_MODAL_ID" class="modal fade" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered modal-lg">
      <div class="modal-content">
        <div class="modal-header bg-primary text-white">
          <h5 class="modal-title">
            {{ isEdit ? 'Modifier le travail' : 'Attribuer un thème' }}
          </h5>
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
                <label for="travail-etudiant" class="form-label">
                  Étudiant <span class="text-danger">*</span>
                </label>
                <select
                  id="travail-etudiant"
                  v-model="form.etudiant_id"
                  class="form-select"
                  :disabled="isEdit"
                  required
                >
                  <option value="">— Choisir un finaliste —</option>
                  <option
                    v-for="etudiant in etudiants"
                    :key="etudiant.etudiant_id"
                    :value="etudiant.etudiant_id"
                  >
                    {{ etudiant.matricule }} — {{ etudiant.nom }} {{ etudiant.prenom }} ({{
                      etudiant.classe_code
                    }})
                  </option>
                </select>
                <div class="form-text" style="font-size: 11px">
                  Seuls les étudiants en dernière année de leur cycle sont proposés.
                </div>
              </div>

              <div class="col-md-5">
                <label for="travail-annee" class="form-label">
                  Année académique <span class="text-danger">*</span>
                </label>
                <select
                  id="travail-annee"
                  v-model="form.annee_academique_id"
                  class="form-select"
                  required
                >
                  <option value="">— Choisir —</option>
                  <option v-for="annee in annees" :key="annee.id" :value="annee.id">
                    {{ annee.code }}{{ annee.est_active ? ' (active)' : '' }}
                  </option>
                </select>
              </div>

              <div v-if="dejaAttribue" class="col-12">
                <div class="alert alert-warning py-2 small mb-0">
                  <i class="mdi mdi-information-outline me-1"></i>
                  Cet étudiant a déjà un thème pour cette année (« {{ dejaAttribue }} »).
                  Enregistrer le remplacera.
                </div>
              </div>

              <div class="col-md-4">
                <label for="travail-type" class="form-label">Nature du travail</label>
                <select id="travail-type" v-model="form.type_travail" class="form-select">
                  <option v-for="type in TYPES_TRAVAIL" :key="type.code" :value="type.code">
                    {{ type.label }}
                  </option>
                </select>
              </div>

              <div class="col-md-8">
                <label for="travail-theme" class="form-label">
                  Thème <span class="text-danger">*</span>
                </label>
                <input
                  id="travail-theme"
                  v-model="form.theme"
                  type="text"
                  class="form-control"
                  maxlength="255"
                  placeholder="Intitulé du sujet de recherche"
                  required
                />
              </div>

              <div class="col-md-6">
                <label for="travail-directeur" class="form-label">Directeur de travaux</label>
                <select id="travail-directeur" v-model="form.directeur_id" class="form-select">
                  <option value="">— Non assigné —</option>
                  <option v-for="formateur in formateurs" :key="formateur.id" :value="formateur.id">
                    {{ formateur.nom }} {{ formateur.prenom }} ({{ formateur.code_enseignant }})
                  </option>
                </select>
              </div>

              <div class="col-md-6">
                <label for="travail-codirecteur" class="form-label">Co-directeur</label>
                <select id="travail-codirecteur" v-model="form.co_directeur_id" class="form-select">
                  <option value="">— Aucun —</option>
                  <option v-for="formateur in formateurs" :key="formateur.id" :value="formateur.id">
                    {{ formateur.nom }} {{ formateur.prenom }}
                  </option>
                </select>
              </div>

              <div class="col-md-4">
                <label for="travail-attribution" class="form-label">Date d'attribution</label>
                <input
                  id="travail-attribution"
                  v-model="form.date_attribution"
                  type="date"
                  class="form-control"
                />
              </div>

              <div class="col-md-4">
                <label for="travail-duree" class="form-label">Durée (semaines)</label>
                <input
                  id="travail-duree"
                  v-model.number="form.duree_semaines"
                  type="number"
                  min="1"
                  class="form-control"
                />
              </div>

              <div class="col-md-4">
                <label for="travail-echeance" class="form-label">Soumission prévue</label>
                <input
                  id="travail-echeance"
                  v-model="form.date_soumission_prevue"
                  type="date"
                  class="form-control"
                />
                <div v-if="dateEcheanceEstimee" class="form-text" style="font-size: 11px">
                  Sans saisie : {{ dateEcheanceEstimee }}, calculée depuis la durée.
                </div>
              </div>

              <div class="col-md-5">
                <label for="travail-situation" class="form-label">Situation de l'étudiant</label>
                <select id="travail-situation" v-model="form.situation" class="form-select">
                  <option
                    v-for="situation in SITUATION_LIST"
                    :key="situation.code"
                    :value="situation.code"
                  >
                    {{ situation.label }}
                  </option>
                </select>
              </div>

              <div class="col-md-7">
                <label for="travail-lieu" class="form-label">Lieu (structure d'accueil)</label>
                <input
                  id="travail-lieu"
                  v-model="form.lieu_travail"
                  type="text"
                  class="form-control"
                  placeholder="Ex : Laboratoire d'informatique, entreprise…"
                />
              </div>

              <div class="col-12">
                <label for="travail-resume" class="form-label">Résumé du sujet</label>
                <textarea
                  id="travail-resume"
                  v-model="form.resume"
                  class="form-control"
                  rows="3"
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
              {{ loading ? 'Enregistrement...' : 'Enregistrer' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
