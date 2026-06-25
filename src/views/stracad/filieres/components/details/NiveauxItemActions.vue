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

      <li class="dropdown-divider"></li>

      <li>
        <button class="dropdown-item text-danger" @click="openDeleteModal">
          <i class="mdi mdi-delete-outline me-2"></i> Supprimer
        </button>
      </li>
    </ul>
  </div>

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
            <button
              type="button"
              class="btn-close btn-close-white"
              @click="closeDeleteModal"
            ></button>
          </div>
          <div class="modal-body">
            <p class="mb-0">
              Voulez-vous vraiment supprimer <strong>{{ item?.code || 'ce niveau' }}</strong> ?
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

  <teleport to="body">
    <div
      v-if="isDetailsVisible"
      class="modal fade show d-block"
      tabindex="-1"
      style="background-color: rgba(0, 0, 0, 0.5)"
    >
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content shadow-lg">
          <div class="modal-header bg-primary text-white">
            <h5 class="modal-title">Détails du niveau</h5>
            <button class="btn-close btn-close-white" @click="closeDetails"></button>
          </div>

          <div class="modal-body">
            <ul class="list-group list-group-flush">
              <li class="list-group-item d-flex justify-content-between">
                <strong>Code :</strong>
                <span class="fw-bold text-primary">{{ item.code }}</span>
              </li>

              <li class="list-group-item d-flex justify-content-between">
                <strong>Ordre :</strong>
                <span class="badge bg-secondary">{{ item.ordre }}</span>
              </li>

              <li class="list-group-item d-flex justify-content-between">
                <strong>Cycle :</strong>
                <span class="text-success">{{ item.cycle_code }}</span>
              </li>

              <li class="list-group-item d-flex justify-content-between">
                <strong>Frais de scolarité :</strong>
                <span class="badge bg-info">{{ formatMoney(item.frais_scolarite) }} FCFA</span>
              </li>

              <li class="list-group-item d-flex justify-content-between">
                <strong>Nombre de classes :</strong>
                <span class="badge bg-warning text-dark">{{ item.nb_classes }}</span>
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
  item: {
    type: Object,
    required: true,
  },
  editModalTarget: {
    type: String,
    default: '#editNiveauModal',
  },
  showAdd: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits(['delete']);

const isDetailsVisible = ref(false);
const isDeleteVisible = ref(false);

const closeDetails = () => {
  isDetailsVisible.value = false;
};

const openDeleteModal = () => {
  isDeleteVisible.value = true;
};

const closeDeleteModal = () => {
  isDeleteVisible.value = false;
};

const confirmDelete = () => {
  emit('delete', props.item);
  closeDeleteModal();
};

const formatMoney = (value) => {
  if (!value) return '0';
  return new Intl.NumberFormat('fr-FR').format(Number(value));
};
</script>
