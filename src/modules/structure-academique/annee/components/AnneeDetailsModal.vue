<script setup>
import { computed } from 'vue';
import { formatDate, daysBetween } from '@/shared/utils/date';
import { mapStatut } from '../constants';

/**
 * Fiche détaillée d'une année académique, en lecture seule.
 *
 * Extraite de l'ancien `ItemActions`, qui mêlait dans un même fichier le menu
 * d'actions, trois modales de confirmation et cette fiche.
 */

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  item: { type: Object, default: null },
});

const emit = defineEmits(['update:modelValue']);

const statut = computed(() => mapStatut(props.item?.statut));
const isActive = computed(() => Boolean(props.item?.est_active));

const duration = computed(() => {
  const days = daysBetween(props.item?.date_debut, props.item?.date_fin);
  return days === null ? '-' : `${days} jour${days > 1 ? 's' : ''}`;
});
</script>

<template>
  <Teleport to="body">
    <div
      v-if="modelValue && item"
      class="modal fade show d-block"
      tabindex="-1"
      role="dialog"
      style="background-color: rgba(0, 0, 0, 0.5)"
    >
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content shadow-lg">
          <div class="modal-header bg-primary text-white">
            <h5 class="modal-title">Détails de l'année académique</h5>
            <button
              type="button"
              class="btn-close btn-close-white"
              aria-label="Fermer"
              @click="emit('update:modelValue', false)"
            ></button>
          </div>

          <div class="modal-body">
            <ul class="list-group list-group-flush">
              <li class="list-group-item d-flex justify-content-between">
                <strong>Code :</strong>
                <span class="fw-bold text-primary">{{ item.code || '-' }}</span>
              </li>
              <li class="list-group-item d-flex justify-content-between">
                <strong>Date de début :</strong>
                <span>{{ formatDate(item.date_debut) }}</span>
              </li>
              <li class="list-group-item d-flex justify-content-between">
                <strong>Date de fin :</strong>
                <span>{{ formatDate(item.date_fin) }}</span>
              </li>
              <li class="list-group-item d-flex justify-content-between">
                <strong>Statut :</strong>
                <span :class="statut.class">{{ statut.label }}</span>
              </li>
              <li class="list-group-item d-flex justify-content-between">
                <strong>Active :</strong>
                <span :class="isActive ? 'badge bg-success' : 'badge bg-secondary'">
                  {{ isActive ? 'Oui' : 'Non' }}
                </span>
              </li>
              <li class="list-group-item d-flex justify-content-between">
                <strong>Durée :</strong>
                <span>{{ duration }}</span>
              </li>
            </ul>
          </div>

          <div class="modal-footer">
            <button class="btn btn-secondary" @click="emit('update:modelValue', false)">
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
