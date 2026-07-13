<script setup>
import { computed, ref, watch } from 'vue';
import { useEtudiantStore } from '../store';
import { useEtudiantForm } from '../composables/useEtudiantForm';
import { useEtudiantFilters } from '../composables/useEtudiantFilters';
import { ETUDIANT_MODAL_ID, LIMITS, SEXES } from '../constants';

/**
 * Formulaire de création / édition d'un étudiant.
 *
 * Il n'en existait aucun : `etudiantStore.addEtudiant()` était défini mais
 * **aucune vue ne l'appelait**, et le bouton « Modifier » de la liste pointait
 * sur un `console.log`. On ne pouvait donc ni créer ni modifier un étudiant
 * depuis l'application.
 *
 * Comme partout ailleurs dans les modules migrés, la modale ne se ferme que si
 * l'enregistrement a réellement abouti (`run()` renvoie `undefined` en cas
 * d'échec).
 */

const etudiantStore = useEtudiantStore();
const { selectedEtudiant, close } = useEtudiantForm();
const { filieres, classes, filiereId, loadReferences } = useEtudiantFilters();

const EMPTY_FORM = {
  matricule: '',
  nom: '',
  prenom: '',
  sexe: 'M',
  date_naissance: '',
  lieu_naissance: '',
  email: '',
  telephone: '',
  adresse: '',
  classe_id: '',
};

const form = ref({ ...EMPTY_FORM });
const errorMessage = ref('');

const isEdit = computed(() => Boolean(selectedEtudiant.value?.id));
const loading = computed(() => etudiantStore.loading);

loadReferences();

watch(
  selectedEtudiant,
  (etudiant) => {
    errorMessage.value = '';

    if (!etudiant) {
      form.value = { ...EMPTY_FORM };
      filiereId.value = '';
      return;
    }

    form.value = {
      matricule: etudiant.matricule ?? '',
      nom: etudiant.nom ?? '',
      prenom: etudiant.prenom ?? '',
      sexe: etudiant.sexe ?? 'M',
      date_naissance: etudiant.date_naissance?.slice(0, 10) ?? '',
      lieu_naissance: etudiant.lieu_naissance ?? '',
      email: etudiant.email ?? '',
      telephone: etudiant.telephone ?? '',
      adresse: etudiant.adresse ?? '',
      classe_id: etudiant.classe_id ?? '',
    };

    // Le sélecteur de classe est filtré par filière : sans cela, la classe de
    // l'étudiant ne figurerait pas dans la liste et le champ paraîtrait vide.
    filiereId.value = etudiant.filiere_id ?? '';
  },
  { immediate: true }
);

// Changer de filière refiltre la liste des classes proposées. Si la classe
// retenue n'y figure plus, le `<select>` s'affiche vide alors que `form.classe_id`
// garde l'identifiant d'une classe d'une autre filière — qui serait enregistré
// tel quel. On ne la vide que dans ce cas précis : à l'ouverture d'une fiche
// existante, la classe de l'étudiant appartient à sa propre filière et survit.
watch(classes, (available) => {
  if (!form.value.classe_id || available.length === 0) return;

  const stillListed = available.some(
    (classe) => String(classe.id) === String(form.value.classe_id)
  );
  if (!stillListed) form.value.classe_id = '';
});

/** @returns {boolean} */
function validate() {
  const { matricule, nom, prenom, email } = form.value;

  if (!matricule.trim()) {
    errorMessage.value = 'Le matricule est obligatoire.';
    return false;
  }
  if (!nom.trim()) {
    errorMessage.value = 'Le nom est obligatoire.';
    return false;
  }
  if (!prenom.trim()) {
    errorMessage.value = 'Le prénom est obligatoire.';
    return false;
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errorMessage.value = "L'adresse e-mail n'est pas valide.";
    return false;
  }

  errorMessage.value = '';
  return true;
}

async function submit() {
  if (!validate()) return;

  const result = isEdit.value
    ? await etudiantStore.update(selectedEtudiant.value.id, form.value)
    : await etudiantStore.create(form.value);

  if (result !== undefined) close();
}
</script>

<template>
  <div :id="ETUDIANT_MODAL_ID" class="modal fade" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered modal-lg">
      <div class="modal-content">
        <div class="modal-header bg-primary text-white">
          <h5 class="modal-title">{{ isEdit ? 'Modifier' : 'Ajouter' }} un étudiant</h5>
          <button
            type="button"
            class="btn-close btn-close-white"
            data-bs-dismiss="modal"
            aria-label="Fermer"
          ></button>
        </div>

        <form @submit.prevent="submit">
          <div class="modal-body">
            <div class="row">
              <div class="col-md-4 mb-3">
                <label for="etudiant-matricule" class="form-label">
                  Matricule <span class="text-danger">*</span>
                </label>
                <input
                  id="etudiant-matricule"
                  v-model="form.matricule"
                  type="text"
                  class="form-control"
                  placeholder="Ex : ETU001"
                  :maxlength="LIMITS.MATRICULE"
                  required
                />
              </div>

              <div class="col-md-4 mb-3">
                <label for="etudiant-nom" class="form-label">
                  Nom <span class="text-danger">*</span>
                </label>
                <input
                  id="etudiant-nom"
                  v-model="form.nom"
                  type="text"
                  class="form-control"
                  :maxlength="LIMITS.NOM"
                  required
                />
              </div>

              <div class="col-md-4 mb-3">
                <label for="etudiant-prenom" class="form-label">
                  Prénom <span class="text-danger">*</span>
                </label>
                <input
                  id="etudiant-prenom"
                  v-model="form.prenom"
                  type="text"
                  class="form-control"
                  :maxlength="LIMITS.PRENOM"
                  required
                />
              </div>
            </div>

            <div class="row">
              <div class="col-md-4 mb-3">
                <label for="etudiant-sexe" class="form-label">Sexe</label>
                <select id="etudiant-sexe" v-model="form.sexe" class="form-select">
                  <option v-for="sexe in SEXES" :key="sexe.code" :value="sexe.code">
                    {{ sexe.label }}
                  </option>
                </select>
              </div>

              <div class="col-md-4 mb-3">
                <label for="etudiant-naissance" class="form-label">Date de naissance</label>
                <input
                  id="etudiant-naissance"
                  v-model="form.date_naissance"
                  type="date"
                  class="form-control"
                />
              </div>

              <div class="col-md-4 mb-3">
                <label for="etudiant-lieu" class="form-label">Lieu de naissance</label>
                <input
                  id="etudiant-lieu"
                  v-model="form.lieu_naissance"
                  type="text"
                  class="form-control"
                />
              </div>
            </div>

            <div class="row">
              <div class="col-md-6 mb-3">
                <label for="etudiant-email" class="form-label">E-mail</label>
                <input
                  id="etudiant-email"
                  v-model="form.email"
                  type="email"
                  class="form-control"
                  :maxlength="LIMITS.EMAIL"
                />
              </div>

              <div class="col-md-6 mb-3">
                <label for="etudiant-telephone" class="form-label">Téléphone</label>
                <input
                  id="etudiant-telephone"
                  v-model="form.telephone"
                  type="tel"
                  class="form-control"
                  :maxlength="LIMITS.TELEPHONE"
                />
              </div>
            </div>

            <div class="mb-3">
              <label for="etudiant-adresse" class="form-label">Adresse</label>
              <textarea
                id="etudiant-adresse"
                v-model="form.adresse"
                class="form-control"
                rows="2"
              ></textarea>
            </div>

            <div class="row p-3 bg-light rounded mx-0">
              <div class="col-md-6 mb-3 mb-md-0">
                <label for="etudiant-filiere" class="form-label">Filière</label>
                <select id="etudiant-filiere" v-model="filiereId" class="form-select">
                  <option value="">Toutes les filières</option>
                  <option v-for="filiere in filieres" :key="filiere.id" :value="filiere.id">
                    {{ filiere.designation }}
                  </option>
                </select>
                <div class="form-text">Sert à restreindre la liste des classes.</div>
              </div>

              <div class="col-md-6">
                <label for="etudiant-classe" class="form-label">Classe</label>
                <select id="etudiant-classe" v-model="form.classe_id" class="form-select">
                  <option value="">Non affecté</option>
                  <option v-for="classe in classes" :key="classe.id" :value="classe.id">
                    {{ classe.code }}
                  </option>
                </select>
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
