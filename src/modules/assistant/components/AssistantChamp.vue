<script setup>
import { ref } from 'vue';

/**
 * La saisie d'une question.
 *
 * `Entrée` envoie, `Maj+Entrée` va à la ligne : c'est la convention de tous les
 * outils de conversation, et l'inverse surprendrait.
 */
const props = defineProps({
  enCours: { type: Boolean, default: false },
  desactive: { type: Boolean, default: false },
});

const emit = defineEmits(['demander']);

const texte = ref('');

/** Quelques amorces : un champ vide n'indique pas ce que l'assistant sait faire. */
const SUGGESTIONS = [
  'Combien d’étudiants dans chaque classe ?',
  'Quel est le taux de réussite par filière ce semestre ?',
  'Quels étudiants ont des échéances en retard ?',
];

function envoyer() {
  const question = texte.value.trim();
  if (!question || props.enCours || props.desactive) return;
  emit('demander', question);
  texte.value = '';
}

function proposer(suggestion) {
  texte.value = suggestion;
}
</script>

<template>
  <div>
    <div v-if="!texte && !enCours" class="mb-2 d-flex flex-wrap gap-2">
      <button
        v-for="suggestion in SUGGESTIONS"
        :key="suggestion"
        type="button"
        class="btn btn-sm btn-outline-secondary"
        :disabled="desactive"
        @click="proposer(suggestion)"
      >
        {{ suggestion }}
      </button>
    </div>

    <div class="d-flex gap-2 align-items-end">
      <textarea
        v-model="texte"
        class="form-control"
        rows="2"
        :disabled="enCours || desactive"
        :placeholder="desactive ? 'Assistant indisponible' : 'Posez votre question en français…'"
        @keydown.enter.exact.prevent="envoyer"
      ></textarea>

      <button
        type="button"
        class="btn btn-primary"
        :disabled="!texte.trim() || enCours || desactive"
        @click="envoyer"
      >
        <span v-if="enCours" class="spinner-border spinner-border-sm" role="status"></span>
        <i v-else class="mdi mdi-send"></i>
      </button>
    </div>

    <p class="mt-1 mb-0 small text-muted">
      Entrée pour envoyer, Maj+Entrée pour aller à la ligne. Les réponses s'appuient sur les données
      auxquelles votre rôle donne accès.
    </p>
  </div>
</template>
