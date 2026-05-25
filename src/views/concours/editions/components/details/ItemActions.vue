<template>
  <div class="dropdown">
    <button class="btn btn-sm btn-outline-primary dropdown-toggle" data-bs-toggle="dropdown">
      ...
    </button>
    <ul class="dropdown-menu dropdown-menu-light">
      <li>
        <button class="dropdown-item" @click="openDetails">
          <i class="mdi mdi-information-outline me-2"></i> Détails
        </button>
      </li>
      <li v-if="showAdd">
        <RouterLink
          class="dropdown-item"
          :to="`/edition-concours/edit/${item.id}`"
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

  <teleport to="body">
    <div
      v-if="isDetailsVisible"
      class="modal fade show d-block"
      tabindex="-1"
      role="dialog"
      style="background-color: rgba(0, 0, 0, 0.5); z-index: 1055;"
      @click.self="closeDetails"
    >
      <div class="modal-dialog modal-lg modal-dialog-centered" role="document">
        <div class="modal-content border-0 shadow-lg rounded-3">
          <div class="modal-header bg-primary text-white py-3">
            <h5 class="modal-title d-flex align-items-center">
              <i class="mdi mdi-information-outline me-2 fs-4"></i>
              Détails du concours
            </h5>
            <button type="button" class="btn-close btn-close-white" @click="closeDetails"></button>
          </div>
          
          <div class="modal-body p-4">
            <div class="row g-3">
              <div class="col-md-6">
                <div class="info-card mb-3">
                  <h6 class="info-title">Informations générales</h6>
                  <div class="info-content">
                    <div class="info-item">
                      <span class="info-label">Désignation:</span>
                      <span class="info-value fw-bold text-dark">{{ item.designation }}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">Type:</span>
                      <span class="info-value">{{ item.libelle_type }} ({{ item.type_concours }})</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">Description:</span>
                      <span class="info-value text-start">{{ item.description || 'Aucune description' }}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">Dossier requis:</span>
                      <span class="info-value">
                        <span
                          class="badge rounded-pill px-2 py-1 text-xs"
                          :class="item.dossier_requis ? 'bg-success-subtle text-success border border-success' : 'bg-secondary-subtle text-secondary border border-secondary'"
                        >
                          {{ item.dossier_requis ? 'Oui' : 'Non' }}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="col-md-6">
                <div class="info-card mb-3">
                  <h6 class="info-title">Dates & Session</h6>
                  <div class="info-content">
                    <div class="info-item">
                      <span class="info-label">Année académique:</span>
                      <span class="info-value fw-bold text-primary">{{ item.code_annee }}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">Limite inscription:</span>
                      <span class="info-value text-danger fw-semibold">{{ formatDate(item.date_limite_inscription) }}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">Date de début:</span>
                      <span class="info-value font-monospace">{{ formatDate(item.date_debut) }}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">Date de fin:</span>
                      <span class="info-value font-monospace">{{ formatDate(item.date_fin) }}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">Statut:</span>
                      <span class="badge rounded-pill px-2.5 py-1.5 fw-bold" :class="getStatusClass(item.statut)">
                        {{ item.statut }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="row mt-2">
              <div class="col-12">
                <div class="info-card bg-light-subtle border">
                  <h6 class="info-title">Actions rapides</h6>
                  <div class="d-flex flex-wrap gap-2">
                    <button class="btn btn-outline-primary btn-sm px-3" @click="$emit('view-exams', item)">
                      <i class="mdi mdi-file-document-outline me-1"></i> Voir les épreuves
                    </button>
                    <button class="btn btn-outline-secondary btn-sm px-3" @click="$emit('view-candidates', item)">
                      <i class="mdi mdi-clipboard-list-outline me-1"></i> Liste des candidats
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="modal-footer bg-light py-2">
            <button class="btn btn-secondary text-sm" @click="closeDetails">
               Fermer
            </button>
            <button 
              class="btn btn-primary text-sm" 
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
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
  item: {
    type: Object,
    required: true,
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

const emit = defineEmits(['add', 'edit', 'delete', 'view-exams', 'view-candidates']);

const isDetailsVisible = ref(false);

const openDetails = () => {
  isDetailsVisible.value = true;
};

const closeDetails = () => {
  isDetailsVisible.value = false;
};

const handleEditFromModal = () => {
  closeDetails();
  emit('edit', props.item);
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

const getStatusClass = (status) => {
  switch (status?.toLowerCase()) {
    case 'ouvert':
      return 'bg-success text-white';
    case 'fermé':
      return 'bg-danger text-white';
    case 'planifié':
    case 'en attente':
      return 'bg-warning text-dark';
    case 'proclamé':
      return 'bg-info text-white';
    default:
      return 'bg-secondary text-white';
  }
};

defineExpose({ openDetails, closeDetails });
</script>

<style scoped>
.info-card {
  background-color: #f8f9fa;
  border-radius: 0.5rem;
  padding: 1.25rem;
  height: 100%;
}

.info-title {
  font-size: 0.9rem;
  font-weight: 700;
  color: #495057;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 1rem;
  border-bottom: 2px solid #dee2e6;
  padding-bottom: 0.5rem;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: start;
  gap: 15px;
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
</style>