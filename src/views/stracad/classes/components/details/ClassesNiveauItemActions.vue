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
      <li v-if="showAdd && concourRoute">
        <RouterLink class="dropdown-item" :to="`${concourRoute}edit/${itemId}`" @click="$emit('add', item)">
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
            <button type="button" class="btn-close btn-close-white" @click="closeDeleteModal"></button>
          </div>
          <div class="modal-body">
            <p class="mb-0">
              Voulez-vous vraiment supprimer <strong>{{ item?.code || 'cet élément' }}</strong> ?
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
      role="dialog"
      style="background-color: rgba(0, 0, 0, 0.5)"
    >
      <div class="modal-dialog modal-dialog-centered" role="document">
        <div class="modal-content shadow-lg">
          <div class="modal-header bg-primary text-white">
            <h5 class="modal-title">Détails de la classe par niveau</h5>
            <button type="button" class="btn-close btn-close-white" @click="closeDetails"></button>
          </div>
          <div class="modal-body">
            <ul class="list-group list-group-flush">
              <li class="list-group-item d-flex justify-content-between">
                <strong>Code classe :</strong>
                <span class="fw-bold text-primary">{{ item.code || '-' }}</span>
              </li>
              <li class="list-group-item d-flex justify-content-between">
                <strong>Filière :</strong>
                <span>{{ item.filiere_nom || item.filiere_code || item.filiere_designation || '-' }}</span>
              </li>
              <li class="list-group-item d-flex justify-content-between">
                <strong>Capacité :</strong>
                <span>{{ item.capacite_max ?? '-' }}</span>
              </li>
              <li class="list-group-item d-flex justify-content-between">
                <strong>Effectif actuel :</strong>
                <span>{{ item.nb_etudiants ?? item.effectif_actuel ?? '-' }}</span>
              </li>
              <li class="list-group-item d-flex justify-content-between">
                <strong>Créé le :</strong>
                <span>{{ formatDate(item.created_at || item.createdAt) }}</span>
              </li>
              <li class="list-group-item d-flex justify-content-between">
                <strong>Mis à jour le :</strong>
                <span>{{ formatDate(item.updated_at || item.updatedAt) }}</span>
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
import { ref, computed } from 'vue';

const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
  showAdd: {
    type: Boolean,
    default: false,
  },
  concourRoute: {
    type: String,
    default: '',
  },
  editModalTarget: {
    type: String,
    default: '#exampleModal-edit',
  },
});

const emit = defineEmits(['delete', 'add', 'edit']);

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

const itemId = computed(() => props.item?.id || props.item?.classe_id || 'N/A');

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};
</script>
