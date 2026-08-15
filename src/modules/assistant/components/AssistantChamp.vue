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

  /**
   * Les amorces proposées au-dessus du champ — un champ vide n'indique pas ce
   * que l'assistant sait faire. Les onglets les affichent dans leur propre
   * colonne, cadrées sur leur domaine : ils passent un tableau vide pour ne pas
   * les voir deux fois.
   *
   * La liste par défaut est écrite ici même : `defineProps` est hissé à la
   * compilation et ne peut référencer aucune variable du module.
   *
   * @type {import('vue').PropType<string[]>}
   */
  suggestions: {
    type: Array,
    default: () => [
      'Combien d’étudiants dans chaque classe ?',
      'Quel est le taux de réussite par filière ce semestre ?',
      'Quels étudiants ont des échéances en retard ?',
    ],
  },

  placeholder: { type: String, default: 'Posez votre question en français…' },
});

const emit = defineEmits(['demander']);

const texte = ref('');

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
    <div v-if="suggestions.length && !texte && !enCours" class="mb-2 d-flex flex-wrap gap-2">
      <button
        v-for="suggestion in suggestions"
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
        :placeholder="desactive ? 'Assistant indisponible' : placeholder"
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
