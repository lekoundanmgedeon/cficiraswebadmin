<script setup>
/** Indicateur de chargement, centré. */
defineProps({
  label: { type: String, default: 'Chargement…' },
  /** `sm` pour un usage en ligne (dans un bouton), `md` pour un bloc. */
  size: { type: String, default: 'md' },
});
</script>

<template>
  <div class="text-center py-4">
    <div
      class="spinner-border text-primary"
      :class="{ 'spinner-border-sm': size === 'sm' }"
      role="status"
    >
      <span class="visually-hidden">{{ label }}</span>
    </div>
  </div>
</template>
