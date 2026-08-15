<script setup>
/**
 * État vide d'une liste ou d'un tableau.
 *
 * Le bloc « aucune donnée » (image `empty-box.svg` + message) était recopié dans
 * une trentaine de composants, avec des `colspan` incohérents et des textes
 * différents pour la même situation.
 */
defineProps({
  title: { type: String, default: 'Aucune donnée' },
  /** Précision facultative : que faire pour sortir de cet état. */
  description: { type: String, default: '' },
  /** Taille de l'illustration, en pixels. */
  size: { type: Number, default: 100 },
});
</script>

<template>
  <div class="text-center py-5">
    <img src="/img/empty-box.svg" alt="" class="mb-3 opacity-50" :style="{ width: `${size}px` }" />
    <h6 class="text-muted mb-1">{{ title }}</h6>
    <p v-if="description" class="text-muted small mb-0">{{ description }}</p>
    <!-- Action facultative : « Créer le premier élément », par exemple. -->
    <div v-if="$slots.action" class="mt-3">
      <slot name="action" />
    </div>
  </div>
</template>
