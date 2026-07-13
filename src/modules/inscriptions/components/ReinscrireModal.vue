<script setup>
import { computed, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useAnneeStore } from '@/modules/structure-academique/annee/store';
import { useClasseStore } from '@/modules/structure-academique/classe/store';
import { useInscriptionStore } from '../store';

/**
 * Réinscription d'un étudiant, à l'unité.
 *
 * L'ancien bouton « Réinscrire » de `Recherche.vue` pré-remplissait deux
 * variables puis appelait `console.log` — il n'y avait aucun flux unitaire, seul
 * l'import en lot était censé fonctionner (et ne fonctionnait pas non plus).
 *
 * Or `POST /inscriptions` accepte `etudiant_id`, `classe_id` et
 * `annee_academique_id` : la réinscription à l'unité est parfaitement possible.
 * C'est ce que fait cette modale. Le serveur force le statut à `EN_ATTENTE` et
 * refuse un doublon sur la même année (409), qui remonte alors comme une erreur
 * de validation normale.
 */

const props = defineProps({
  /** L'étudiant à réinscrire, `null` quand la modale est fermée. */
  etudiant: { type: Object, default: null },
});

const emit = defineEmits(['update:etudiant']);

const store = useInscriptionStore();
const anneeStore = useAnneeStore();
const classeStore = useClasseStore();

const { items: annees } = storeToRefs(anneeStore);
const { items: classes } = storeToRefs(classeStore);

const anneeId = ref('');
const classeId = ref('');
const commentaire = ref('');
const errorMessage = ref('');

const loading = computed(() => store.loading);

watch(
  () => props.etudiant,
  (etudiant) => {
    errorMessage.value = '';
    commentaire.value = '';
    classeId.value = '';

    if (!etudiant) return;

    anneeStore.fetchAll();
    classeStore.fetchAll();

    // L'année active est la cible naturelle d'une réinscription.
    anneeId.value = anneeStore.items.find((annee) => annee.est_active)?.id ?? '';
  }
);

const close = () => emit('update:etudiant', null);

async function submit() {
  if (!anneeId.value || !classeId.value) {
    errorMessage.value = 'L’année académique et la classe de destination sont obligatoires.';
    return;
  }

  errorMessage.value = '';

  const result = await store.create({
    etudiant_id: props.etudiant.id,
    classe_id: classeId.value,
    annee_academique_id: anneeId.value,
    type_inscription: 'REINSCRIPTION',
    commentaire: commentaire.value.trim() || null,
  });

  if (result !== undefined) close();
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="etudiant"
      class="modal fade show d-block"
      tabindex="-1"
      role="dialog"
      style="background-color: rgba(0, 0, 0, 0.5)"
    >
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content shadow-lg">
          <div class="modal-header bg-primary text-white">
            <h5 class="modal-title">Réinscrire {{ etudiant.prenom }} {{ etudiant.nom }}</h5>
            <button
              type="button"
              class="btn-close btn-close-white"
              :disabled="loading"
              aria-label="Fermer"
              @click="close"
            ></button>
          </div>

          <form @submit.prevent="submit">
            <div class="modal-body">
              <div class="border rounded p-3 mb-3 bg-light">
                <div class="d-flex justify-content-between py-1">
                  <span class="text-muted small">Matricule</span>
                  <span class="fw-semibold">{{ etudiant.matricule }}</span>
                </div>
                <div class="d-flex justify-content-between py-1">
                  <span class="text-muted small">Parcours précédent</span>
                  <span class="fw-semibold">
                    {{ etudiant.classe ?? '—' }} · {{ etudiant.annee_academique ?? '—' }}
                  </span>
                </div>
              </div>

              <div class="mb-3">
                <label for="reinscrire-annee" class="form-label">
                  Année académique cible <span class="text-danger">*</span>
                </label>
                <select id="reinscrire-annee" v-model="anneeId" class="form-select" required>
                  <option value="">Choisir une année</option>
                  <option v-for="annee in annees" :key="annee.id" :value="annee.id">
                    {{ annee.code }}
                  </option>
                </select>
              </div>

              <div class="mb-3">
                <label for="reinscrire-classe" class="form-label">
                  Classe de destination <span class="text-danger">*</span>
                </label>
                <select id="reinscrire-classe" v-model="classeId" class="form-select" required>
                  <option value="">Choisir une classe</option>
                  <option v-for="classe in classes" :key="classe.id" :value="classe.id">
                    {{ classe.code }} — {{ classe.filiere_nom }}
                  </option>
                </select>
              </div>

              <div class="mb-0">
                <label for="reinscrire-commentaire" class="form-label">Commentaire</label>
                <textarea
                  id="reinscrire-commentaire"
                  v-model="commentaire"
                  class="form-control"
                  rows="2"
                ></textarea>
              </div>

              <div v-if="errorMessage" class="alert alert-danger mt-3 mb-0" role="alert">
                <i class="mdi mdi-alert-circle me-1"></i> {{ errorMessage }}
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" :disabled="loading" @click="close">
                Annuler
              </button>
              <button type="submit" class="btn btn-primary" :disabled="loading">
                <span
                  v-if="loading"
                  class="spinner-border spinner-border-sm me-2"
                  aria-hidden="true"
                ></span>
                {{ loading ? 'Réinscription...' : 'Réinscrire' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </Teleport>
</template>
