<script setup>
import { computed } from 'vue';
import { apercusPour } from '../apercus';

/**
 * Les aperçus rapides, en tuiles groupées par domaine.
 *
 * C'est la moitié « insight » de l'écran de plateforme : un champ de saisie vide
 * n'apprend à personne ce qu'un assistant sait faire, et la liste des questions
 * possibles est précisément ce qu'un nouvel utilisateur cherche.
 *
 * ## Elles disparaissent dès la première réponse
 *
 * L'écran est fait pour la question rapide : les tuiles servent à démarrer, pas
 * à décorer. Les garder sous le fil pousserait la réponse — souvent un tableau
 * de quinze lignes — sous le pli. C'est la vue parente qui les masque.
 *
 * ## Ce qui n'est jamais affiché
 *
 * Un domaine que le catalogue de l'appelant ne contient pas. Le cloisonnement
 * reste celui du serveur ; ce filtre-ci ne fait qu'éviter d'exposer un bouton
 * dont on sait qu'il aboutirait à un refus.
 */

const props = defineProps({
  /** Ce que rend `GET /catalogue` : `{ nbVues, domaines, vues }`. */
  catalogue: { type: Object, default: null },

  desactive: { type: Boolean, default: false },
});

const emit = defineEmits(['demander']);

const groupes = computed(() => apercusPour(props.catalogue));
</script>

<template>
  <div v-if="groupes.length">
    <h6 class="text-uppercase text-secondary fw-bold small mb-2 apercus-titre">
      <i class="bi bi-lightning-charge text-warning me-1"></i> Aperçus rapides
    </h6>

    <div class="row g-3">
      <div v-for="groupe in groupes" :key="groupe.domaine" class="col-md-6 col-xl-4">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-body p-3">
            <div class="d-flex align-items-center mb-2">
              <span class="apercus-pastille" :class="`bg-${groupe.couleur}-subtle`">
                <i class="bi" :class="[groupe.icone, `text-${groupe.couleur}-emphasis`]"></i>
              </span>
              <h6 class="mb-0 ms-2 fw-semibold">{{ groupe.libelle }}</h6>
            </div>

            <div class="d-flex flex-column gap-1">
              <button
                v-for="apercu in groupe.apercus"
                :key="apercu.question"
                type="button"
                class="btn btn-sm text-start border-0 apercus-item"
                :disabled="desactive"
                :title="apercu.question"
                @click="emit('demander', apercu.question)"
              >
                <i class="bi me-2" :class="[apercu.icone, `text-${groupe.couleur}`]"></i>
                {{ apercu.libelle }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.apercus-titre {
  letter-spacing: 0.5px;
}

.apercus-pastille {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

/* Une tuile est un raccourci, pas un bouton d'action : elle reste discrète
   jusqu'au survol, sans quoi six pastilles colorées se disputeraient l'écran
   avec le champ de saisie, qui est l'élément principal. */
.apercus-item {
  background: transparent;
  color: #495057;
  font-size: 0.84rem;
  padding: 0.3rem 0.45rem;
  border-radius: 6px;
  transition:
    background-color 0.15s ease-in-out,
    transform 0.15s ease-in-out;
}

.apercus-item:hover:not(:disabled) {
  background: rgba(0, 0, 0, 0.04);
  color: #212529;
  transform: translateX(2px);
}
</style>
