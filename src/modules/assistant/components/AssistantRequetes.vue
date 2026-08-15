<script setup>
import { ref } from 'vue';
import { useAuthStore } from '@/core/auth/authStore';

/**
 * Les requêtes SQL derrière une réponse — **réservées au rôle ADMIN**.
 *
 * ## Pourquoi les montrer
 *
 * Un modèle de langage peut se tromper de vue ou de filtre sans que la phrase
 * produite trahisse quoi que ce soit : la requête, elle, le montre. Sur des
 * chiffres qui engagent l'établissement — un effectif transmis à une tutelle,
 * un montant encaissé — pouvoir vérifier d'où sort un nombre est ce qui sépare
 * un assistant vérifiable d'un oracle.
 *
 * ## Pourquoi ne les montrer qu'à l'administrateur
 *
 * Le SQL ne s'adresse pas à un chef de scolarité : il ne lui apprend rien qu'il
 * puisse contrôler, et il expose le nom des vues et des colonnes de la base —
 * une carte du schéma offerte à chaque réponse, dont on se passe volontiers en
 * dehors de l'exploitation.
 *
 * La vérifiabilité n'est pas perdue pour autant : **le serveur journalise
 * chaque échange avec ses appels d'outils** (`assistant_echanges`), et
 * `GET /api/assistant/historique` les rend. Ce qui change ici, c'est qui les
 * lit à l'écran, pas ce qui est conservé.
 *
 * ⚠️ Le rôle vient du profil en mémoire (`authStore.user`), que la connexion
 * renseigne mais qu'un rechargement de page perd. Les écrans qui montent
 * l'assistant appellent donc `fetchCurrentUser()` — sans quoi le bloc
 * resterait caché à un administrateur après un F5. Le défaut, s'il revenait,
 * se ferait dans le sens sûr : on masque, on ne divulgue pas.
 */
defineProps({
  /** @type {import('vue').PropType<Array<{intention: string|null, sql: string, nbLignes: number|null}>>} */
  requetes: { type: Array, default: () => [] },
});

const auth = useAuthStore();
const ouvert = ref(false);
</script>

<template>
  <div v-if="auth.isAdmin && requetes.length" class="mt-2">
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
