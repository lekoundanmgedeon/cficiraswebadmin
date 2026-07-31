<script setup>
import { computed, ref, watch } from 'vue';
import { useBibliothequeStore } from '../store';
import { useOuvrageForm } from '../composables/useOuvrageForm';
import { LIMITS, OUVRAGE_MODAL_ID, TYPES_OUVRAGE } from '../constants';

/**
 * Formulaire de création / édition d'un ouvrage.
 *
 * Deux règles de la base sont reprises ici pour que l'utilisateur les voie
 * plutôt que de recevoir une erreur SQL :
 *  - `nb_disponibles <= nb_exemplaires` (contrainte `ouvrages_disponibles_coherents`) ;
 *  - la cote est **unique** — c'est l'identifiant de rayon.
 */

const store = useBibliothequeStore();
const { selectedOuvrage, close } = useOuvrageForm();

const FORMULAIRE_VIDE = {
  cote: '',
  titre: '',
  auteur: '',
  editeur: '',
  annee_publication: null,
  isbn: '',
  categorie: '',
  langue: 'Français',
  type_ouvrage: 'LIVRE',
  resume: '',
  emplacement: '',
  nb_exemplaires: 1,
  nb_disponibles: 1,
};

const form = ref({ ...FORMULAIRE_VIDE });
const errorMessage = ref('');

const isEdit = computed(() => Boolean(selectedOuvrage.value?.id));
const loading = computed(() => store.loading);

watch(
  selectedOuvrage,
  (ouvrage) => {
    errorMessage.value = '';
    form.value = ouvrage
      ? {
          cote: ouvrage.cote ?? '',
          titre: ouvrage.titre ?? '',
          auteur: ouvrage.auteur ?? '',
          editeur: ouvrage.editeur ?? '',
          annee_publication: ouvrage.annee_publication ?? null,
          isbn: ouvrage.isbn ?? '',
          categorie: ouvrage.categorie ?? '',
          langue: ouvrage.langue ?? 'Français',
          type_ouvrage: ouvrage.type_ouvrage ?? 'LIVRE',
          resume: ouvrage.resume ?? '',
          emplacement: ouvrage.emplacement ?? '',
          nb_exemplaires: ouvrage.nb_exemplaires ?? 1,
          nb_disponibles: ouvrage.nb_disponibles ?? 1,
        }
      : { ...FORMULAIRE_VIDE };
  },
  { immediate: true }
);

// À la saisie, un nouvel ouvrage est disponible en entier : recopier le nombre
// d'exemplaires évite la faute la plus fréquente — un fonds annoncé indisponible
// le jour de son catalogage.
watch(
  () => form.value.nb_exemplaires,
  (exemplaires) => {
    if (!isEdit.value) form.value.nb_disponibles = exemplaires;
  }
);

/** @returns {boolean} */
function valider() {
  const {
    cote,
    titre,
    auteur,
    nb_exemplaires: exemplaires,
    nb_disponibles: disponibles,
  } = form.value;

  if (!cote.trim()) {
    errorMessage.value = 'La cote est obligatoire : c’est elle qui situe l’ouvrage en rayon.';
    return false;
  }
  if (!titre.trim()) {
    errorMessage.value = 'Le titre est obligatoire.';
    return false;
  }
  if (!auteur.trim()) {
    errorMessage.value = 'L’auteur est obligatoire.';
    return false;
  }
  if (Number(exemplaires) < 1) {
    errorMessage.value = 'Un ouvrage compte au moins un exemplaire.';
    return false;
  }
  if (Number(disponibles) > Number(exemplaires)) {
    errorMessage.value =
      'Il ne peut pas y avoir plus d’exemplaires disponibles que d’exemplaires possédés.';
    return false;
  }

  errorMessage.value = '';
  return true;
}

async function submit() {
  if (!valider()) return;

  const result = isEdit.value
    ? await store.update(selectedOuvrage.value.id, form.value)
    : await store.create(form.value);

  if (result !== undefined) close();
}
</script>

<template>
  <div :id="OUVRAGE_MODAL_ID" class="modal fade" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered modal-lg">
      <div class="modal-content">
        <div class="modal-header bg-primary text-white">
          <h5 class="modal-title">{{ isEdit ? 'Modifier' : 'Ajouter' }} un ouvrage</h5>
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
              <div class="col-md-4">
                <label for="ouvrage-cote" class="form-label">
                  Cote <span class="text-danger">*</span>
                </label>
                <input
                  id="ouvrage-cote"
                  v-model="form.cote"
                  type="text"
                  class="form-control"
                  :maxlength="LIMITS.COTE"
                  placeholder="Ex : INFO-004"
                  required
                />
              </div>

              <div class="col-md-8">
                <label for="ouvrage-titre" class="form-label">
                  Titre <span class="text-danger">*</span>
                </label>
                <input
                  id="ouvrage-titre"
                  v-model="form.titre"
                  type="text"
                  class="form-control"
                  :maxlength="LIMITS.TITRE"
                  required
                />
              </div>

              <div class="col-md-6">
                <label for="ouvrage-auteur" class="form-label">
                  Auteur <span class="text-danger">*</span>
                </label>
                <input
                  id="ouvrage-auteur"
                  v-model="form.auteur"
                  type="text"
                  class="form-control"
                  :maxlength="LIMITS.AUTEUR"
                  required
                />
              </div>

              <div class="col-md-6">
                <label for="ouvrage-editeur" class="form-label">Éditeur</label>
                <input
                  id="ouvrage-editeur"
                  v-model="form.editeur"
                  type="text"
                  class="form-control"
                  :maxlength="LIMITS.EDITEUR"
                />
              </div>

              <div class="col-md-3">
                <label for="ouvrage-type" class="form-label">Type</label>
                <select id="ouvrage-type" v-model="form.type_ouvrage" class="form-select">
                  <option v-for="type in TYPES_OUVRAGE" :key="type.code" :value="type.code">
                    {{ type.label }}
                  </option>
                </select>
              </div>

              <div class="col-md-3">
                <label for="ouvrage-categorie" class="form-label">Catégorie</label>
                <input
                  id="ouvrage-categorie"
                  v-model="form.categorie"
                  type="text"
                  class="form-control"
                  :maxlength="LIMITS.CATEGORIE"
                  placeholder="Ex : Informatique"
                />
              </div>

              <div class="col-md-3">
                <label for="ouvrage-annee" class="form-label">Année de publication</label>
                <input
                  id="ouvrage-annee"
                  v-model.number="form.annee_publication"
                  type="number"
                  min="1400"
                  class="form-control"
                />
              </div>

              <div class="col-md-3">
                <label for="ouvrage-langue" class="form-label">Langue</label>
                <input id="ouvrage-langue" v-model="form.langue" type="text" class="form-control" />
              </div>

              <div class="col-md-4">
                <label for="ouvrage-isbn" class="form-label">ISBN</label>
                <input
                  id="ouvrage-isbn"
                  v-model="form.isbn"
                  type="text"
                  class="form-control"
                  :maxlength="LIMITS.ISBN"
                />
              </div>

              <div class="col-md-4">
                <label for="ouvrage-exemplaires" class="form-label">Exemplaires</label>
                <input
                  id="ouvrage-exemplaires"
                  v-model.number="form.nb_exemplaires"
                  type="number"
                  min="1"
                  class="form-control"
                />
              </div>

              <div class="col-md-4">
                <label for="ouvrage-disponibles" class="form-label">Dont disponibles</label>
                <input
                  id="ouvrage-disponibles"
                  v-model.number="form.nb_disponibles"
                  type="number"
                  min="0"
                  :max="form.nb_exemplaires"
                  class="form-control"
                />
              </div>

              <div class="col-md-6">
                <label for="ouvrage-emplacement" class="form-label">Emplacement</label>
                <input
                  id="ouvrage-emplacement"
                  v-model="form.emplacement"
                  type="text"
                  class="form-control"
                  placeholder="Ex : Rayon B, étagère 3"
                />
              </div>

              <div class="col-12">
                <label for="ouvrage-resume" class="form-label">Résumé</label>
                <textarea
                  id="ouvrage-resume"
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
