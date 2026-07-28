<template>
  <div class="card border-0 shadow-sm rounded-4 bg-white p-4">
    <EmptyState :title="titre" :description="description" :size="90">
      <template v-if="$slots.action" #action>
        <slot name="action" />
      </template>
    </EmptyState>

    <!-- Ce que le serveur devrait exposer pour que l'écran vive. Le dire ici
         évite que le besoin se perde : c'est la seule trace visible côté
         application, et elle vaut mieux qu'un écran qui fait semblant. -->
    <div v-if="attendus.length" class="mt-2 pt-3 border-top border-light">
      <span class="text-muted small fw-semibold text-uppercase d-block mb-2">
        Ce qu'il manque côté serveur
      </span>
      <ul class="list-unstyled mb-0">
        <li v-for="attendu in attendus" :key="attendu" class="text-muted text-xs mb-1">
          <i class="bi bi-dot"></i>{{ attendu }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import EmptyState from '@/shared/components/EmptyState.vue';

/**
 * État d'un écran dont le backend n'existe pas.
 *
 * Les six écrans résiduels du projet affichaient tous quelque chose de faux :
 * des démos de bibliothèques laissées en place (`admin`), un assistant qui
 * répondait toujours la même chose (`prompt`), de faux téléchargements
 * (`support`), un tableau vide commenté « pour tester l'affichage » (`docf`).
 *
 * Plutôt que de les supprimer, on conserve leur place et leur intention, et on
 * remplace le mensonge par un constat — avec la liste de ce qui manque, pour que
 * le besoin ne se perde pas.
 */
defineProps({
  titre: { type: String, required: true },
  description: { type: String, default: '' },
  /** Endpoints ou services attendus, en clair. */
  attendus: { type: Array, default: () => [] },
});
</script>

<style scoped>
.text-xs {
  font-size: 11px !important;
}
.rounded-4 {
  border-radius: 0.2rem !important;
}
</style>
