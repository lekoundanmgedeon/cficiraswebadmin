<script setup>
import { computed, ref } from 'vue';
import ConfirmModal from './ConfirmModal.vue';

/**
 * Menu d'actions d'une ligne de tableau.
 *
 * Le projet comptait huit implémentations de ce composant (de 84 à 620 lignes),
 * qui avaient divergé : certaines confirmaient la suppression, d'autres non ;
 * certaines déclaraient leurs `emits`, d'autres émettaient des événements non
 * déclarés ; l'une d'elles gardait un lien mort vers le module Concours.
 *
 * Celle-ci est pilotée par une liste d'actions, ce qui permet à chaque module de
 * composer son menu sans réécrire de balisage. Une action marquée `confirm`
 * ouvre une `ConfirmModal` et n'émet qu'après validation.
 *
 * @example
 * <ItemActions
 *   :item="annee"
 *   :label="annee.code"
 *   :actions="[
 *     { key: 'edit', label: 'Modifier', icon: 'mdi-pencil-outline' },
 *     { key: 'delete', label: 'Supprimer', icon: 'mdi-delete-outline', variant: 'danger',
 *       confirm: { title: 'Confirmation de suppression' } },
 *   ]"
 *   @action="onAction"
 * />
 */

const props = defineProps({
  /** L'entité de la ligne. Renvoyée telle quelle avec l'événement. */
  item: { type: Object, required: true },

  /** Libellé de l'entité, utilisé dans les messages de confirmation. */
  label: { type: String, default: 'cet élément' },

  /**
   * @type {import('vue').PropType<Array<{
   *   key: string,
   *   label: string,
   *   icon?: string,
   *   variant?: string,
   *   divider?: boolean,
   *   hidden?: boolean,
   *   confirm?: { title: string, message?: string, confirmLabel?: string, variant?: string },
   * }>>}
   */
  actions: { type: Array, required: true },

  /** Désactive le menu et le bouton de confirmation pendant un appel réseau. */
  loading: { type: Boolean, default: false },
});

const emit = defineEmits(['action']);

const visibleActions = computed(() => props.actions.filter((action) => !action.hidden));

/** Action en attente de confirmation, `null` si aucune modale n'est ouverte. */
const pending = ref(null);

const confirmConfig = computed(() => {
  const confirm = pending.value?.confirm ?? {};
  return {
    title: confirm.title ?? 'Confirmation',
    message: confirm.message ?? `Voulez-vous vraiment ${pending.value?.label.toLowerCase()} « ${props.label} » ?`,
    confirmLabel: confirm.confirmLabel ?? pending.value?.label,
    variant: confirm.variant ?? pending.value?.variant ?? 'primary',
  };
});

/** @param {{key: string, confirm?: object}} action */
function trigger(action) {
  if (action.confirm) {
    pending.value = action;
    return;
  }
  emit('action', { key: action.key, item: props.item });
}

function confirmPending() {
  emit('action', { key: pending.value.key, item: props.item });
  pending.value = null;
}
</script>

<template>
  <div class="dropdown">
    <button
      class="btn btn-sm btn-outline-primary dropdown-toggle"
      data-bs-toggle="dropdown"
      :disabled="loading"
      aria-label="Actions"
    >
      ...
    </button>

    <ul class="dropdown-menu dropdown-menu-light">
      <template v-for="action in visibleActions" :key="action.key">
        <li v-if="action.divider"><hr class="dropdown-divider" /></li>
        <li>
          <button
            class="dropdown-item"
            :class="{ 'text-danger': action.variant === 'danger' }"
            @click="trigger(action)"
          >
            <i v-if="action.icon" class="mdi me-2" :class="action.icon"></i>
            {{ action.label }}
          </button>
        </li>
      </template>
    </ul>
  </div>

  <ConfirmModal
    :model-value="pending !== null"
    :title="confirmConfig.title"
    :message="confirmConfig.message"
    :confirm-label="confirmConfig.confirmLabel"
    :variant="confirmConfig.variant"
    :loading="loading"
    @update:model-value="pending = null"
    @confirm="confirmPending"
  />
</template>
