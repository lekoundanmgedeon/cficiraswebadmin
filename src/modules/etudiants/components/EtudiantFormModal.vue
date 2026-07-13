<script setup>
import { computed, ref } from 'vue';
import { useEtudiantStore } from '../store';
import { useEtudiantForm } from '../composables/useEtudiantForm';
import { ETUDIANT_MODAL_ID, LIMITS, SEXES } from '../constants';

/**
 * Création d'un étudiant.
 *
 * Il n'en existait aucun : `etudiantStore.addEtudiant()` était défini mais
 * **aucune vue ne l'appelait**, et le bouton « Modifier » de la liste pointait
 * sur un `console.log`.
 *
 * Le formulaire ne fait que **créer** : le backend n'expose pas
 * `PUT /etudiants/:id`. Il ne rattache pas non plus l'étudiant à une classe —
 * `POST /etudiants` crée un « étudiant seul », et c'est une *inscription* qui
 * l'affecte à une classe pour une année. Comme l'annuaire est une projection des
 * inscriptions, un étudiant créé ici n'apparaîtra dans la liste qu'une fois
 * inscrit : le message de succès le dit, et l'encart ci-dessous le rappelle.
 *
 * La modale ne se ferme que si l'enregistrement a réellement abouti (`run()`
 * renvoie `undefined` en cas d'échec).
 */

const etudiantStore = useEtudiantStore();
const { close } = useEtudiantForm();

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
};

const form = ref({ ...EMPTY_FORM });
const errorMessage = ref('');

const loading = computed(() => etudiantStore.loading);

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

  const result = await etudiantStore.create(form.value);

  if (result !== undefined) {
    form.value = { ...EMPTY_FORM };
    close();
  }
}
</script>

<template>
  <div :id="ETUDIANT_MODAL_ID" class="modal fade" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered modal-lg">
      <div class="modal-content">
        <div class="modal-header bg-primary text-white">
          <h5 class="modal-title">Ajouter un étudiant</h5>
          <button
            type="button"
            class="btn-close btn-close-white"
            data-bs-dismiss="modal"
            aria-label="Fermer"
          ></button>
        </div>

        <form @submit.prevent="submit">
          <div class="modal-body">
            <div class="alert alert-info d-flex align-items-start" role="alert">
              <i class="mdi mdi-information-outline me-2 mt-1"></i>
              <div class="small">
                Cet écran crée l'étudiant, pas son inscription. Il apparaîtra dans le répertoire une
                fois <strong>inscrit à une classe</strong>, depuis le module Inscriptions.
              </div>
            </div>

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
                  placeholder="Ex : ETU-2025-0001"
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

            <div class="mb-0">
              <label for="etudiant-adresse" class="form-label">Adresse</label>
              <textarea
                id="etudiant-adresse"
                v-model="form.adresse"
                class="form-control"
                rows="2"
              ></textarea>
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
