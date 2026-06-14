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
          :to="`/edition-semestre/edit/${item.id}`"
          @click="$emit('add', item)"
        >
          <i class="mdi mdi-launch me-2"></i> Editer
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
          {{ item?.actif ? 'Désactiver' : 'Activer' }}
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
          <div class="modal-header" :class="item?.actif ? 'bg-warning text-dark' : 'bg-success text-white'">
            <h5 class="modal-title">{{ item?.actif ? 'Désactivation' : 'Activation' }}</h5>
            <button
              type="button"
              class="btn-close"
              :class="item?.actif ? '' : 'btn-close-white'"
              @click="closeToggleModal"
            ></button>
          </div>
          <div class="modal-body">
            <p class="mb-0">
              Voulez-vous vraiment {{ item?.actif ? 'désactiver' : 'activer' }}
              <strong>{{ item?.code || 'ce semestre' }}</strong> ?
            </p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="closeToggleModal">Annuler</button>
            <button class="btn" :class="item?.actif ? 'btn-warning' : 'btn-success'" @click="confirmToggleStatus">
              {{ item?.actif ? 'Désactiver' : 'Activer' }}
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
              Voulez-vous vraiment supprimer <strong>{{ item?.code || 'ce semestre' }}</strong> ?
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
        <div class="modal-content shadow-lg">
          <div class="modal-header bg-primary text-white">
            <h5 class="modal-title">Détails du semestre</h5>
            <button type="button" class="btn-close btn-close-white" @click="closeDetails"></button>
          </div>
          <div class="modal-body">
            <ul class="list-group list-group-flush">
              <li class="list-group-item d-flex justify-content-between">
                <strong>Code :</strong>
                <span class="fw-bold text-primary">{{ item.code }}</span>
              </li>
              <li class="list-group-item d-flex justify-content-between">
                <strong>Année :</strong>
                <span>{{ item.annee }}</span>
              </li>
              <li class="list-group-item d-flex justify-content-between">
                <strong>Date début :</strong>
                <span>{{ formatDate(item.dateDebut) }}</span>
              </li>
              <li class="list-group-item d-flex justify-content-between">
                <strong>Date fin :</strong>
                <span>{{ formatDate(item.dateFin) }}</span>
              </li>
              <li class="list-group-item d-flex justify-content-between">
                <strong>Statut :</strong>
                <span :class="item.actif ? 'text-success' : 'text-secondary'">
                  {{ item.actif ? 'Actif' : 'Inactif' }}
                </span>
              </li>
              <li class="list-group-item d-flex justify-content-between">
                <strong>Année académique :</strong>
                <span class="badge bg-info">{{ item.annee }}</span>
              </li>
              <li class="list-group-item d-flex justify-content-between">
                <strong>Année active :</strong>
                <span class="badge bg-warning text-dark">{{
                  item.anneeActive ? 'Oui' : 'Non'
                }}</span>
              </li>
            </ul>
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
import { ref } from 'vue';

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

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('fr-FR');
};
</script>
