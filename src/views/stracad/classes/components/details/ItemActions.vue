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
          :to="`/edition-concours/edit/${item.classe_id}`"
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
      <li class="dropdown-divider"></li>
      <li>
        <button class="dropdown-item text-danger" @click="$emit('delete', item)">
          <i class="mdi mdi-delete-outline me-2"></i> Supprimer
        </button>
      </li>
    </ul>
  </div>

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
            <h5 class="modal-title">Détails de la classe</h5>
            <button type="button" class="btn-close btn-close-white" @click="closeDetails"></button>
          </div>

          <div class="modal-body">
            <ul class="list-group list-group-flush">
              <li class="list-group-item d-flex justify-content-between">
                <strong>Code :</strong>
                <span class="fw-bold text-primary">{{ item.code }}</span>
              </li>
              <li class="list-group-item d-flex justify-content-between">
                <strong>Capacité :</strong>
                <span class="badge bg-info">{{ item.capacite_max }}</span>
              </li>
              <li class="list-group-item d-flex justify-content-between">
                <strong>Niveau :</strong>
                <span>{{ item.niveau_code }}</span>
              </li>
              <li class="list-group-item d-flex justify-content-between">
                <strong>Frais :</strong>
                <span class="text-success">{{ item.niveau_frais }} FCFA</span>
              </li>
              <li class="list-group-item d-flex justify-content-between">
                <strong>Filière :</strong>
                <span>{{ item.filiere_designation }}</span>
              </li>
              <li class="list-group-item d-flex justify-content-between">
                <strong>Cycle :</strong>
                <span>{{ item.cycle_designation }}</span>
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

defineProps({
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

const isDetailsVisible = ref(false);

const closeDetails = () => {
  isDetailsVisible.value = false;
};
</script>
