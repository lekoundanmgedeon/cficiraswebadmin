<template>
  <div class="dropdown">
    <button class="btn btn-sm btn-outline-primary dropdown-toggle" data-bs-toggle="dropdown">
      ...
    </button>
    <ul class="dropdown-menu dropdown-menu-light">
      <li>
        <button class="dropdown-item fw-semibold text-primary" @click="goToPlanning">
          <i class="mdi mdi-calendar-clock me-2"></i> Planifier Examens
        </button>
      </li>
      <li class="dropdown-divider"></li>
      
      <li>
        <button class="dropdown-item" @click="isDetailsVisible = true">
          <i class="mdi mdi-information-outline me-2 text-info"></i> Détails
        </button>
      </li>
      <li v-if="showAdd">
        <button class="dropdown-item" @click="$emit('add', item)">
          <i class="mdi mdi-plus-circle-outline me-2 text-success"></i> Ajouter
        </button>
      </li>
      <li>
        <button
          class="dropdown-item"
          data-bs-toggle="modal"
          :data-bs-target="editModalTarget"
          @click="$emit('edit', item)"
        >
          <i class="mdi mdi-pencil-outline me-2 text-primary"></i> Modifier
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
      style="background-color: rgba(0, 0, 0, 0.5)"
      @click.self="closeDetails"
    >
      <div class="modal-dialog modal-dialog-centered modal-lg" role="document">
        <div class="modal-content">
          <div class="modal-header bg-primary text-white">
            <h5 class="modal-title">
              <i class="mdi mdi-information-outline me-2"></i>
              Détails de la session
            </h5>
            <button type="button" class="btn-close btn-close-white" @click="closeDetails"></button>
          </div>
          <div class="modal-body">
            
            <div class="row">
              <div class="col-md-6">
                <div class="info-card mb-3">
                  <h6 class="info-title">Informations générales</h6>
                  <div class="info-content">
                    <div class="info-item">
                      <span class="info-label">Code:</span>
                      <span class="info-value fw-bold">{{ item.code }}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">Désignation:</span>
                      <span class="info-value">{{ item.designation }}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">Type:</span>
                      <span class="info-value badge bg-secondary-subtle text-secondary">{{ item.type_session }}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">Semestre:</span>
                      <span class="info-value">
                        <span class="badge bg-light text-dark border">{{ item.semestre_code }}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="col-md-6">
                <div class="info-card mb-3">
                  <h6 class="info-title">Dates et responsable</h6>
                  <div class="info-content">
                    <div class="info-item">
                      <span class="info-label">Date début:</span>
                      <span class="info-value">{{ toInputDateFormat(item.date_debut) }}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">Date fin:</span>
                      <span class="info-value">{{ toInputDateFormat(item.date_fin) }}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">Responsable:</span>
                      <span class="info-value">{{ item.responsable || 'Non assigné' }}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">Année académique:</span>
                      <span class="info-value">{{ item.annee_code }}</span>
                    </div>
                    <div class="info-item align-items-center">
                      <span class="info-label">État:</span>
                      <span class="badge" :class="getStatusClass(item.etat)">
                        {{ item.etat }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="item.llm_summary" class="row mt-2">
              <div class="col-md-12">
                <div class="info-card">
                  <h6 class="info-title">Résumé de la session</h6>
                  <p class="text-muted small mb-0" style="line-height: 1.5;">
                    {{ item.llm_summary }}
                  </p>
                </div>
              </div>
            </div>

          </div>
          <div class="modal-footer">
            <button class="btn btn-outline-primary me-auto" @click="goToPlanningFromDetails">
              <i class="mdi mdi-calendar-clock me-2"></i> Planifier les examens
            </button>
            
            <button class="btn btn-secondary" @click="closeDetails">
              <i class="mdi mdi-close me-2"></i> Fermer
            </button>
            <button class="btn btn-primary" @click="handleEditFromDetails">
              <i class="mdi mdi-pencil me-2"></i> Modifier
            </button>
          </div>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router'; // 🚀 Importation du routeur Vue
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import localizedFormat from 'dayjs/plugin/localizedFormat';

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

const emit = defineEmits(['add', 'edit', 'delete']);

const router = useRouter(); // 🚀 Initialisation des routes de l'application
const isDetailsVisible = ref(false);

const closeDetails = () => {
  isDetailsVisible.value = false;
};

// Actions de routage vers l'URL dynamique /planification-examens/:id/planning
const goToPlanning = () => {
  router.push(`/planification-examens/${props.item.id}/evaluations`);
};

const goToPlanningFromDetails = () => {
  closeDetails();
  goToPlanning();
};

const handleEditFromDetails = () => {
  closeDetails();
  emit('edit', props.item);
};

const getStatusClass = (status) => {
  if (!status) return 'bg-light text-dark';
  
  switch (status.toLowerCase()) {
    case 'active':
      return 'bg-success';
    case 'inactive':
      return 'bg-secondary';
    case 'draft':
    case 'brouillon':
      return 'bg-warning text-dark';
    default:
      return 'bg-light text-dark';
  }
};

dayjs.extend(localizedFormat);
dayjs.locale('fr');

function toInputDateFormat(dateString) {
  if (!dateString) return 'Non défini';
  return dayjs(dateString).format('DD MMMM YYYY');
}
</script>

<style scoped>
.modal-content {
  border: none;
  border-radius: 10px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
}

.info-card {
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 15px;
  height: 100%;
}

.info-title {
  color: #495057;
  font-weight: 600;
  margin-bottom: 15px;
  padding-bottom: 8px;
  border-bottom: 1px solid #dee2e6;
}

.info-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}

.info-label {
  font-weight: 500;
  color: #6c757d;
}

.info-value {
  font-weight: 400;
  color: #212529;
  text-align: right;
}

.badge {
  padding: 6px 12px;
  border-radius: 50px;
  font-size: 0.75rem;
  font-weight: 600;
}

.btn-close:focus {
  box-shadow: none;
}

.modal-header {
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-footer {
  border-top: 1px solid #dee2e6;
}
</style>