<template>
  <div class="dropdown">
    <button class="btn btn-sm btn-outline-primary dropdown-toggle" data-bs-toggle="dropdown">
      ...
    </button>
    <ul class="dropdown-menu dropdown-menu-light">
      <li>
        <button class="dropdown-item" @click="isDetailsVisible = true">
          <i class="mdi mdi-information-outline me-2"></i> Détails
        </button>
      </li>
      <li v-if="showAdd">
        <RouterLink
          class="dropdown-item"
          :to="`/edition-concours/edit/${item.concours_id}`"
          @click="$emit('add', item)"
        >
          <i class="mdi mdi mdi-launch me-2"></i> Editer
        </RouterLink>
      </li>
      <li>
        <button
          class="dropdown-item"
          data-bs-toggle="modal"
          :data-bs-target="editModalTarget"
          @click="$emit('edit', item)"
        >
          <i class="mdi mdi-pencil-outline me-2"></i> Modifier
        </button>
      </li>
      <li>
        <button class="dropdown-item" @click="openToggleModal">
          <i class="mdi mdi-toggle-switch me-2"></i>
          {{ item?.est_active ? 'Désactiver' : 'Activer' }}
        </button>
      </li>
      <li class="dropdown-divider"></li>
      <li>
        <button class="dropdown-item text-danger" @click="openDeleteModal">
          <i class="mdi mdi-delete-outline me-2"></i> Supprimer
        </button>
      </li>
    </ul>
  </div>

  <!-- Modal de confirmation d'activation / désactivation -->
  <teleport to="body">
    <div
      v-if="isToggleVisible"
      class="modal fade show d-block"
      tabindex="-1"
      role="dialog"
      style="background-color: rgba(0, 0, 0, 0.5)"
    >
      <div class="modal-dialog modal-dialog-centered" role="document">
        <div class="modal-content shadow-lg">
          <div class="modal-header" :class="item?.est_active ? 'bg-warning text-dark' : 'bg-success text-white'">
            <h5 class="modal-title">{{ item?.est_active ? 'Désactivation' : 'Activation' }}</h5>
            <button type="button" class="btn-close" :class="item?.est_active ? '' : 'btn-close-white'" @click="closeToggleModal"></button>
          </div>
          <div class="modal-body">
            <p class="mb-0">
              Voulez-vous vraiment {{ item?.est_active ? 'désactiver' : 'activer' }}
              <strong>{{ itemLabel }}</strong> ?
            </p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="closeToggleModal">Annuler</button>
            <button class="btn" :class="item?.est_active ? 'btn-warning' : 'btn-success'" @click="confirmToggleStatus">
              {{ item?.est_active ? 'Désactiver' : 'Activer' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </teleport>

  <!-- Modal de confirmation de suppression -->
  <teleport to="body">
    <div
      v-if="isDeleteVisible"
      class="modal fade show d-block"
      tabindex="-1"
      role="dialog"
      style="background-color: rgba(0, 0, 0, 0.5)"
    >
      <div class="modal-dialog modal-dialog-centered" role="document">
        <div class="modal-content shadow-lg">
          <div class="modal-header bg-danger text-white">
            <h5 class="modal-title">Confirmation de suppression</h5>
            <button type="button" class="btn-close btn-close-white" @click="closeDeleteModal"></button>
          </div>
          <div class="modal-body">
            <p class="mb-0">
              Voulez-vous vraiment supprimer
              <strong>{{ itemLabel }}</strong> ?
            </p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="closeDeleteModal">Annuler</button>
            <button class="btn btn-danger" @click="confirmDelete">Supprimer</button>
          </div>
        </div>
      </div>
    </div>
  </teleport>

  <!-- Modal pour les détails -->
  <teleport to="body">
    <div
      v-if="isDetailsVisible"
      class="modal fade show d-block"
      tabindex="-1"
      role="dialog"
      style="background-color: rgba(0, 0, 0, 0.5)"
    >
      <div class="modal-dialog modal-dialog-centered" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Détails</h5>
            <button type="button" class="btn-close" @click="closeDetails"></button>
          </div>
          <div class="modal-body">
            <p><strong>Code:</strong> {{ item.code }}</p>
            <p><strong>Date début:</strong> {{ formatDate(item.date_debut) }}</p>
            <p><strong>Date fin:</strong> {{ formatDate(item.date_fin) }}</p>
            <p>
              <strong>Statut:</strong>
              <span :class="mapStatut(item.est_actif).class">
                {{ mapStatut(item.est_actif).label }}
              </span>
            </p>
          </div>

          <div class="modal-footer">
            <button class="btn btn-secondary" @click="closeDetails">Fermer</button>
          </div>
        </div>
      </div>
    </div>
  </teleport>
</template>
<script setup>
import { computed, ref } from 'vue';

const props = defineProps({
  item: Object,
  showAdd: {
    type: Boolean,
    default: false,
  },
  editModalTarget: {
    type: String,
    default: '#exampleModal-edit',
  },
});

const emit = defineEmits(['delete', 'toggle-status']);

const isDetailsVisible = ref(false);
const isDeleteVisible = ref(false);
const isToggleVisible = ref(false);

const closeDetails = () => {
  isDetailsVisible.value = false;
};

const itemLabel = computed(() => {
  if (!props.item) return 'cet élément';
  return props.item.code || props.item.designation || props.item.nom || 'cet élément';
});

const openDeleteModal = () => {
  isDeleteVisible.value = true;
};

const closeDeleteModal = () => {
  isDeleteVisible.value = false;
};

const openToggleModal = () => {
  isToggleVisible.value = true;
};

const closeToggleModal = () => {
  isToggleVisible.value = false;
};

const confirmDelete = () => {
  emit('delete', props.item);
  closeDeleteModal();
};

const confirmToggleStatus = () => {
  emit('toggle-status', props.item);
  closeToggleModal();
};

// Helpers
const formatDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};

const mapStatut = (estActif) => {
  return {
    label: estActif ? 'Actif' : 'Inactif',
    class: estActif ? 'badge bg-success' : 'badge bg-secondary',
  };
};
</script>
