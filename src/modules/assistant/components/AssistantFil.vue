<script setup>
import { nextTick, ref, watch } from 'vue';
import AssistantRequetes from './AssistantRequetes.vue';

/**
 * Le fil de la conversation.
 *
 * Les réponses de l'assistant arrivent en texte brut, avec des retours à la
 * ligne et parfois des listes à tirets. On les rend tels quels
 * (`white-space: pre-wrap`) plutôt que d'y passer un moteur markdown : le
 * prompt demande des phrases, pas du balisage, et interpréter du markdown sur
 * une sortie de modèle ouvre une injection HTML pour un gain nul.
 */
const props = defineProps({
  /** @type {import('vue').PropType<Array<object>>} */
  messages: { type: Array, required: true },
  enCours: { type: Boolean, default: false },
});

const conteneur = ref(null);

// Une réponse qui s'ajoute hors du champ de vision passerait inaperçue.
watch(
  () => [props.messages.length, props.enCours],
  async () => {
    await nextTick();
    if (conteneur.value) conteneur.value.scrollTop = conteneur.value.scrollHeight;
  }
);
</script>

<template>
  <div ref="conteneur" class="assistant-fil">
    <div
      v-for="(message, i) in messages"
      :key="i"
      class="d-flex mb-3"
      :class="message.role === 'user' ? 'justify-content-end' : 'justify-content-start'"
    >
      <div class="assistant-bulle" :class="`assistant-bulle--${message.role}`">
        <p class="assistant-texte mb-0">{{ message.texte }}</p>

        <AssistantRequetes v-if="message.role === 'assistant'" :requetes="message.requetes || []" />

        <p
          v-if="message.role === 'assistant' && message.dureeMs"
          class="mb-0 mt-1 small text-muted"
        >
          {{ (message.dureeMs / 1000).toFixed(1) }} s
        </p>
      </div>
    </div>

    <!-- L'attente est longue (plusieurs secondes) : sans ce repère, l'écran
         paraît figé et l'utilisateur repose sa question. -->
    <div v-if="enCours" class="d-flex justify-content-start mb-3">
      <div class="assistant-bulle assistant-bulle--assistant text-muted">
        <span class="spinner-border spinner-border-sm me-2" role="status"></span>
        L'assistant interroge les données…
      </div>
    </div>
  </div>
</template>

<style scoped>
.assistant-fil {
  height: 55vh;
  overflow-y: auto;
  padding: 0.5rem;
}

.assistant-bulle {
  max-width: 78%;
  padding: 0.7rem 1rem;
  border-radius: 12px;
}

.assistant-bulle--user {
  background: var(--bs-primary, #6571ff);
  color: #fff;
}

.assistant-bulle--assistant {
  background: rgba(0, 0, 0, 0.05);
}

/* Les réponses portent des retours à la ligne et des listes : les préserver
   sans laisser une longue ligne déborder. */
.assistant-texte {
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
