<script setup>
import { computed, ref } from 'vue';
import { formatDate, daysBetween } from '@/shared/utils/date';
import { mapStatut } from '../constants';

/**
 * Menu d'actions d'une ligne du tableau des années : détails, modification,
 * activation/désactivation, suppression.
 *
 * Deux nettoyages par rapport à la version précédente :
 *  - `defineEmits` ne déclarait que `delete` et `toggle-status` alors que le
 *    composant émettait aussi `edit` et `add` — Vue avertissait à chaque clic
 *    sur « Modifier », et l'événement passait par les attributs de repli ;
 *  - le menu contenait un lien vers `/edition-concours/edit/{item.concours_id}`,
 *    vestige d'un copier-coller depuis le module Concours, qui pointait vers une
 *    propriété inexistante sur une année.
 */

const props = defineProps({
  /** @type {import('vue').PropType<any>} */
  item: { type: Object, required: true },
});

const emit = defineEmits(['edit', 'delete', 'toggle-status']);

const isDetailsVisible = ref(false);
const isDeleteVisible = ref(false);
const isToggleVisible = ref(false);

const isActive = computed(() => Boolean(props.item?.est_active));
const itemLabel = computed(() => props.item?.code || 'cette année');
const statut = computed(() => mapStatut(props.item?.statut));

const duration = computed(() => {
  const days = daysBetween(props.item?.date_debut, props.item?.date_fin);
  if (days === null) return '-';
  return `${days} jour${days > 1 ? 's' : ''}`;
});

function confirmDelete() {
  emit('delete', props.item);
  isDeleteVisible.value = false;
}

function confirmToggle() {
  emit('toggle-status', props.item);
  isToggleVisible.value = false;
}
</script>

<template>
  <div class="dropdown">
    <button
      class="btn btn-sm btn-outline-primary dropdown-toggle"
      data-bs-toggle="dropdown"
      aria-label="Actions"
    >
      ...
    </button>
    <ul class="dropdown-menu dropdown-menu-light">
      <li>
        <button class="dropdown-item" @click="isDetailsVisible = true">
          <i class="mdi mdi-information-outline me-2"></i> Détails
        </button>
      </li>
      <li>
        <button class="dropdown-item" @click="emit('edit', item)">
          <i class="mdi mdi-pencil-outline me-2"></i> Modifier
        </button>
      </li>
      <li>
        <button class="dropdown-item" @click="isToggleVisible = true">
          <i class="mdi mdi-toggle-switch me-2"></i>
          {{ isActive ? 'Désactiver' : 'Activer' }}
        </button>
      </li>
      <li><hr class="dropdown-divider" /></li>
      <li>
        <button class="dropdown-item text-danger" @click="isDeleteVisible = true">
          <i class="mdi mdi-delete-outline me-2"></i> Supprimer
        </button>
      </li>
    </ul>
  </div>

  <!-- Confirmation d'activation / désactivation -->
  <Teleport to="body">
    <div
      v-if="isToggleVisible"
      class="modal fade show d-block"
      tabindex="-1"
      role="dialog"
      style="background-color: rgba(0, 0, 0, 0.5)"
    >
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content shadow-lg">
          <div class="modal-header" :class="isActive ? 'bg-warning text-dark' : 'bg-success text-white'">
            <h5 class="modal-title">{{ isActive ? 'Désactivation' : 'Activation' }}</h5>
            <button
              type="button"
              class="btn-close"
              :class="isActive ? '' : 'btn-close-white'"
              aria-label="Fermer"
              @click="isToggleVisible = false"
            ></button>
          </div>
          <div class="modal-body">
            <p class="mb-0">
              Voulez-vous vraiment {{ isActive ? 'désactiver' : 'activer' }}
              <strong>{{ itemLabel }}</strong> ?
            </p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="isToggleVisible = false">Annuler</button>
            <button
              class="btn"
              :class="isActive ? 'btn-warning' : 'btn-success'"
              @click="confirmToggle"
            >
              {{ isActive ? 'Désactiver' : 'Activer' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- Confirmation de suppression -->
  <Teleport to="body">
    <div
      v-if="isDeleteVisible"
      class="modal fade show d-block"
      tabindex="-1"
      role="dialog"
      style="background-color: rgba(0, 0, 0, 0.5)"
    >
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content shadow-lg">
          <div class="modal-header bg-danger text-white">
            <h5 class="modal-title">Confirmation de suppression</h5>
            <button
              type="button"
              class="btn-close btn-close-white"
              aria-label="Fermer"
              @click="isDeleteVisible = false"
            ></button>
          </div>
          <div class="modal-body">
            <p class="mb-0">
              Voulez-vous vraiment supprimer <strong>{{ itemLabel }}</strong> ? Cette action est
              irréversible.
            </p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="isDeleteVisible = false">Annuler</button>
            <button class="btn btn-danger" @click="confirmDelete">Supprimer</button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- Détails -->
  <Teleport to="body">
    <div
      v-if="isDetailsVisible"
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
              @click="isDetailsVisible = false"
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
            <button class="btn btn-secondary" @click="isDetailsVisible = false">Fermer</button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
