<script setup>
import { ref } from 'vue';

/**
 * Les requêtes SQL derrière une réponse.
 *
 * Repliées par défaut : l'interlocuteur veut la réponse, pas le SQL. Mais sur
 * des chiffres qui engagent l'établissement — un montant encaissé, un effectif
 * transmis à une tutelle — pouvoir vérifier d'où sort un nombre n'est pas un
 * luxe de développeur. C'est ce qui sépare un assistant vérifiable d'un oracle.
 *
 * Un modèle de langage peut se tromper de vue ou de filtre sans que la phrase
 * produite trahisse quoi que ce soit : la requête, elle, le montre.
 */
defineProps({
  /** @type {import('vue').PropType<Array<{intention: string|null, sql: string, nbLignes: number|null}>>} */
  requetes: { type: Array, default: () => [] },
});

const ouvert = ref(false);
</script>

<template>
  <div v-if="requetes.length" class="mt-2">
    <button
      type="button"
      class="btn btn-link btn-sm p-0 text-muted text-decoration-none"
      @click="ouvert = !ouvert"
    >
      <i class="mdi" :class="ouvert ? 'mdi-chevron-down' : 'mdi-chevron-right'"></i>
      {{ requetes.length }} requête{{ requetes.length > 1 ? 's' : '' }} exécutée{{
        requetes.length > 1 ? 's' : ''
      }}
    </button>

    <div v-if="ouvert" class="mt-2">
      <div v-for="(requete, i) in requetes" :key="i" class="mb-2">
        <p v-if="requete.intention" class="mb-1 small text-muted fst-italic">
          {{ requete.intention }}
        </p>
        <pre class="assistant-sql mb-1"><code>{{ requete.sql }}</code></pre>
        <p v-if="requete.nbLignes !== null" class="mb-0 small text-muted">
          {{ requete.nbLignes }} ligne{{ requete.nbLignes > 1 ? 's' : '' }}
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.assistant-sql {
  background: rgba(0, 0, 0, 0.04);
  border-radius: 4px;
  padding: 0.5rem 0.75rem;
  font-size: 0.78rem;
  /* Une requête longue défile dans son cadre : sans cela, elle élargit la
     bulle, puis la colonne, puis toute la page. */
  overflow-x: auto;
  white-space: pre;
  margin: 0;
}
</style>
