<script setup>
/**
 * Modale de confirmation.
 *
 * Chaque `ItemActions` du projet réimplémentait ses propres modales de
 * suppression et d'activation en `<teleport>`, avec un balisage recopié et des
 * variantes de couleurs divergentes. Une seule ici, pilotée par `v-model`.
 */
defineProps({
  /** Contrôle l'ouverture (via `v-model`). */
  modelValue: { type: Boolean, default: false },
  title: { type: String, required: true },
  message: { type: String, default: '' },
  confirmLabel: { type: String, default: 'Confirmer' },
  cancelLabel: { type: String, default: 'Annuler' },
  /** Couleur Bootstrap de l'action : `danger`, `warning`, `success`, `primary`. */
  variant: { type: String, default: 'danger' },
  /** Désactive le bouton de confirmation pendant l'appel réseau. */
  loading: { type: Boolean, default: false },
});

const emit = defineEmits(['update:modelValue', 'confirm']);

const close = () => emit('update:modelValue', false);
</script>

<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="modal fade show d-block"
      tabindex="-1"
      role="dialog"
      style="background-color: rgba(0, 0, 0, 0.5)"
    >
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content shadow-lg">
          <div class="modal-header" :class="`bg-${variant} text-white`">
            <h5 class="modal-title">{{ title }}</h5>
            <button
              type="button"
              class="btn-close btn-close-white"
              aria-label="Fermer"
              @click="close"
            ></button>
          </div>

          <div class="modal-body">
            <slot>
              <p class="mb-0">{{ message }}</p>
            </slot>
          </div>

          <div class="modal-footer">
            <button class="btn btn-secondary" :disabled="loading" @click="close">
              {{ cancelLabel }}
            </button>
            <button
              class="btn"
              :class="`btn-${variant}`"
              :disabled="loading"
              @click="emit('confirm')"
            >
              <span
                v-if="loading"
                class="spinner-border spinner-border-sm me-2"
                aria-hidden="true"
              ></span>
              {{ confirmLabel }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
