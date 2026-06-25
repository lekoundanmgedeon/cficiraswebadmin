<template>
  <div class="dropdown">
    <button
      type="button"
      class="btn btn-sm btn-outline-primary dropdown-toggle"
      data-bs-toggle="dropdown"
      aria-expanded="false"
    >
      ...
    </button>

    <ul class="dropdown-menu dropdown-menu-end dropdown-menu-light shadow-sm">
      <li>
        <button type="button" class="dropdown-item" @click="openDetails">
          <i class="mdi mdi-information-outline me-2"></i>
          Détails
        </button>
      </li>

      <li v-if="showAdd && currentItem.id">
        <RouterLink
          class="dropdown-item"
          :to="`/edition-concours/edit/${currentItem.id}`"
          @click="$emit('add', currentItem)"
        >
          <i class="mdi mdi-launch me-2"></i>
          Éditer
        </RouterLink>
      </li>

      <li>
        <button
          type="button"
          class="dropdown-item"
          data-bs-toggle="modal"
          :data-bs-target="editModalTarget"
          @click="$emit('edit', currentItem)"
        >
          <i class="mdi mdi-pencil-outline me-2"></i>
          Modifier
        </button>
      </li>

      <li>
        <button type="button" class="dropdown-item" @click="openStatusModal">
          <i class="mdi mdi-swap-horizontal-circle-outline me-2"></i>
          Modifier le statut
        </button>
      </li>

      <li>
        <hr class="dropdown-divider" />
      </li>

      <li>
        <button
          type="button"
          class="dropdown-item text-danger"
          @click="$emit('delete', currentItem)"
        >
          <i class="mdi mdi-delete-outline me-2"></i>
          Supprimer
        </button>
      </li>
    </ul>
  </div>

  <!-- Modal détails -->
  <teleport to="body">
    <div
      v-if="isDetailsVisible"
      class="modal fade show d-block"
      tabindex="-1"
      role="dialog"
      style="background-color: rgba(0, 0, 0, 0.5); z-index: 1055"
      @click.self="closeDetails"
    >
      <div class="modal-dialog modal-lg modal-dialog-centered" role="document">
        <div class="modal-content border-0 shadow-lg rounded-4">
          <div class="modal-header bg-primary text-white py-3">
            <h5 class="modal-title d-flex align-items-center mb-0">
              <i class="mdi mdi-information-outline me-2 fs-4"></i>
              Détails du concours
            </h5>
            <button type="button" class="btn-close btn-close-white" @click="closeDetails"></button>
          </div>

          <div class="modal-body p-4">
            <div class="row g-3">
              <div class="col-md-6">
                <div class="info-card">
                  <h6 class="info-title">Informations générales</h6>

                  <div class="info-content">
                    <div class="info-item">
                      <span class="info-label">Désignation :</span>
                      <span class="info-value fw-bold text-dark">
                        {{ currentItem.designation || 'Non renseignée' }}
                      </span>
                    </div>

                    <div class="info-item">
                      <span class="info-label">Type :</span>
                      <span class="info-value">
                        {{ currentItem.libelle_type || 'Non défini' }}
                        <span v-if="currentItem.type_concours">
                          ({{ currentItem.type_concours }})
                        </span>
                      </span>
                    </div>

                    <div class="info-item">
                      <span class="info-label">Description :</span>
                      <span class="info-value">
                        {{ currentItem.description || 'Aucune description' }}
                      </span>
                    </div>

                    <div class="info-item">
                      <span class="info-label">Dossier requis :</span>
                      <span class="info-value">
                        <span
                          class="badge rounded-pill px-2 py-1"
                          :class="
                            currentItem.dossier_requis
                              ? 'bg-success-subtle text-success border border-success-subtle'
                              : 'bg-secondary-subtle text-secondary border border-secondary-subtle'
                          "
                        >
                          {{ currentItem.dossier_requis ? 'Oui' : 'Non' }}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="col-md-6">
                <div class="info-card">
                  <h6 class="info-title">Dates & session</h6>

                  <div class="info-content">
                    <div class="info-item">
                      <span class="info-label">Année académique :</span>
                      <span class="info-value fw-bold text-primary">
                        {{ currentItem.code_annee || 'Non définie' }}
                      </span>
                    </div>

                    <div class="info-item">
                      <span class="info-label">Limite inscription :</span>
                      <span class="info-value text-danger fw-semibold">
                        {{ formatDate(currentItem.date_limite_inscription) }}
                      </span>
                    </div>

                    <div class="info-item">
                      <span class="info-label">Date de début :</span>
                      <span class="info-value font-monospace">
                        {{ formatDate(currentItem.date_debut) }}
                      </span>
                    </div>

                    <div class="info-item">
                      <span class="info-label">Date de fin :</span>
                      <span class="info-value font-monospace">
                        {{ formatDate(currentItem.date_fin) }}
                      </span>
                    </div>

                    <div class="info-item">
                      <span class="info-label">Statut :</span>
                      <span class="info-value">
                        <span
                          class="badge rounded-pill badge-status"
                          :class="getStatusClass(currentItem.statut)"
                        >
                          {{ getStatusLabel(currentItem.statut) }}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Actions rapides -->
            <div class="row mt-3">
              <div class="col-12">
                <div class="info-card bg-light-subtle border">
                  <h6 class="info-title">Actions rapides</h6>

                  <div class="d-flex flex-wrap gap-2">
                    <button
                      type="button"
                      class="btn btn-outline-primary btn-sm px-3"
                      @click="$emit('view-exams', currentItem)"
                    >
                      <i class="mdi mdi-file-document-outline me-1"></i>
                      Voir les épreuves
                    </button>

                    <button
                      type="button"
                      class="btn btn-outline-secondary btn-sm px-3"
                      @click="$emit('view-candidates', currentItem)"
                    >
                      <i class="mdi mdi-clipboard-list-outline me-1"></i>
                      Liste des candidats
                    </button>

                    <button
                      type="button"
                      class="btn btn-outline-info btn-sm px-3"
                      @click="openStatusModalFromDetails"
                    >
                      <i class="mdi mdi-swap-horizontal-circle-outline me-1"></i>
                      Modifier le statut
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer bg-light py-3">
            <button type="button" class="btn btn-secondary btn-sm" @click="closeDetails">
              Fermer
            </button>

            <button
              type="button"
              class="btn btn-primary btn-sm"
              data-bs-toggle="modal"
              :data-bs-target="editModalTarget"
              @click="handleEditFromModal"
            >
              Modifier
            </button>
          </div>
        </div>
      </div>
    </div>
  </teleport>

  <!-- Modal changement de statut -->
  <teleport to="body">
    <div
      v-if="isStatusModalVisible"
      class="modal fade show d-block"
      tabindex="-1"
      role="dialog"
      style="background-color: rgba(0, 0, 0, 0.5); z-index: 1060"
      @click.self="closeStatusModal"
    >
      <div class="modal-dialog modal-dialog-centered" role="document">
        <div class="modal-content border-0 shadow-lg rounded-4">
          <div class="modal-header bg-white border-bottom py-3">
            <div>
              <h5 class="modal-title fw-bold mb-1">Modifier le statut</h5>
              <p class="text-muted small mb-0">Sélectionnez le nouveau statut du concours.</p>
            </div>

            <button type="button" class="btn-close" @click="closeStatusModal"></button>
          </div>

          <div class="modal-body p-4">
            <div class="mb-3">
              <label class="form-label text-muted small fw-semibold"> Concours sélectionné </label>

              <div class="selected-concours-card">
                <div class="fw-semibold text-dark">
                  {{ currentItem.designation || 'Concours non renseigné' }}
                </div>
                <div class="text-muted small">
                  {{ currentItem.code_annee || 'Année non définie' }}
                </div>
              </div>
            </div>

            <div class="mb-3">
              <label class="form-label text-muted small fw-semibold"> Statut actuel </label>

              <div>
                <span
                  class="badge rounded-pill badge-status"
                  :class="getStatusClass(currentItem.statut)"
                >
                  {{ getStatusLabel(currentItem.statut) }}
                </span>
              </div>
            </div>

            <div class="mb-0">
              <label for="statusSelect" class="form-label text-muted small fw-semibold">
                Nouveau statut
              </label>

              <select id="statusSelect" v-model="selectedStatus" class="form-select">
                <option value="PLANIFIE">Planifié</option>
                <option value="OUVERT">Ouvert</option>
                <option value="CLOTURE">Clôturé</option>
                <option value="ANNULE">Annulé</option>
              </select>

              <div class="mt-3">
                <span
                  class="badge rounded-pill badge-status"
                  :class="getStatusClass(selectedStatus)"
                >
                  {{ getStatusLabel(selectedStatus) }}
                </span>
              </div>
            </div>
          </div>

          <div class="modal-footer bg-light border-top py-3">
            <button
              type="button"
              class="btn btn-outline-secondary btn-sm"
              @click="closeStatusModal"
            >
              Annuler
            </button>

            <button
              type="button"
              class="btn btn-primary btn-sm d-inline-flex align-items-center gap-1"
              :disabled="!selectedStatus || !hasStatusChanged"
              @click="submitStatusChange"
            >
              <i class="mdi mdi-check-circle-outline"></i>
              Enregistrer le statut
            </button>
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
    default: () => ({}),
  },
  showAdd: {
    type: Boolean,
    default: false,
  },
  editModalTarget: {
    type: String,
    default: '#exampleModal-edit',
  },
});

const emit = defineEmits([
  'add',
  'edit',
  'delete',
  'view-exams',
  'view-candidates',
  'change-status',
]);

const isDetailsVisible = ref(false);
const isStatusModalVisible = ref(false);
const selectedStatus = ref('');

const allowedStatuses = ['PLANIFIE', 'OUVERT', 'CLOTURE', 'ANNULE'];

const currentItem = computed(() => props.item || {});

const normalizeStatus = (status) => {
  if (!status) return '';

  const normalized = status
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim();

  const aliases = {
    FERME: 'CLOTURE',
    FERMEE: 'CLOTURE',
    CLOTUREE: 'CLOTURE',
    PROCLAMEE: 'PROCLAME',
  };

  return aliases[normalized] || normalized;
};

const currentStatus = computed(() => normalizeStatus(currentItem.value?.statut));

const hasStatusChanged = computed(() => {
  return selectedStatus.value && selectedStatus.value !== currentStatus.value;
});

const openDetails = () => {
  isDetailsVisible.value = true;
};

const closeDetails = () => {
  isDetailsVisible.value = false;
};

const openStatusModal = () => {
  const status = currentStatus.value;

  selectedStatus.value = allowedStatuses.includes(status) ? status : 'PLANIFIE';
  isStatusModalVisible.value = true;
};

const closeStatusModal = () => {
  isStatusModalVisible.value = false;
};

const openStatusModalFromDetails = () => {
  closeDetails();
  openStatusModal();
};

const handleEditFromModal = () => {
  closeDetails();
  emit('edit', currentItem.value);
};

const submitStatusChange = () => {
  if (!selectedStatus.value || !hasStatusChanged.value) return;

  emit('change-status', {
    id: currentItem.value.id,
    item: currentItem.value,
    statut: selectedStatus.value,
  });

  closeStatusModal();
};

const formatDate = (dateString) => {
  if (!dateString) return 'Non défini';

  const date = new Date(dateString);

  return date.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const getStatusLabel = (status) => {
  const normalizedStatus = normalizeStatus(status);

  const labels = {
    PLANIFIE: 'Planifié',
    OUVERT: 'Ouvert',
    CLOTURE: 'Clôturé',
    ANNULE: 'Annulé',
    PROCLAME: 'Proclamé',
  };

  return labels[normalizedStatus] || 'Inconnu';
};

const getStatusClass = (status) => {
  const normalizedStatus = normalizeStatus(status);

  const classes = {
    PLANIFIE: 'badge-planifie',
    OUVERT: 'badge-ouvert',
    CLOTURE: 'badge-cloture',
    ANNULE: 'badge-annule',
    PROCLAME: 'badge-proclame',
  };

  return classes[normalizedStatus] || 'badge-default';
};

defineExpose({
  openDetails,
  closeDetails,
  openStatusModal,
  closeStatusModal,
});
</script>

<style scoped>
.dropdown-menu {
  min-width: 210px;
  border: 1px solid #e9ecef;
  border-radius: 0.75rem;
}

.dropdown-item {
  font-size: 0.875rem;
  padding: 0.55rem 0.9rem;
}

.dropdown-item:active {
  background-color: #0d6efd;
  color: #fff;
}

.info-card {
  background-color: #f8f9fa;
  border-radius: 0.75rem;
  padding: 1.25rem;
  height: 100%;
}

.info-title {
  font-size: 0.78rem;
  font-weight: 700;
  color: #495057;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 1rem;
  border-bottom: 1px solid #dee2e6;
  padding-bottom: 0.5rem;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: start;
  gap: 1rem;
  margin-bottom: 0.75rem;
  font-size: 0.875rem;
}

.info-label {
  font-weight: 600;
  color: #6c757d;
  white-space: nowrap;
}

.info-value {
  text-align: right;
  color: #212529;
}

.selected-concours-card {
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 0.75rem;
  padding: 0.85rem 1rem;
}

.form-select {
  border-color: #e9ecef;
  font-size: 0.9rem;
}

.form-select:focus {
  box-shadow: none;
  border-color: #86b7fe;
}

/* Badges statut */
.badge-status {
  min-width: 92px;
  padding: 0.45rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.01em;
  border: 1px solid transparent;
}

.badge-planifie {
  background-color: #e7f1ff;
  color: #0d6efd;
  border-color: #b6d4fe;
}

.badge-ouvert {
  background-color: #e9f7ef;
  color: #198754;
  border-color: #badbcc;
}

.badge-cloture {
  background-color: #f1f3f5;
  color: #495057;
  border-color: #dee2e6;
}

.badge-annule {
  background-color: #fdecea;
  color: #dc3545;
  border-color: #f5c2c7;
}

.badge-proclame {
  background-color: #e6f4ea;
  color: #146c43;
  border-color: #a3cfbb;
}

.badge-default {
  background-color: #f8f9fa;
  color: #6c757d;
  border-color: #e9ecef;
}

@media (max-width: 576px) {
  .info-item {
    flex-direction: column;
    gap: 0.25rem;
  }

  .info-value {
    text-align: left;
  }
}
</style>
