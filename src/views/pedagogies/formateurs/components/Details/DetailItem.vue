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
        <button class="dropdown-item" @click="$emit('add', item)">
          <i class="mdi mdi-plus-circle-outline me-2"></i> Ajouter
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
      @click.self="closeDetails"
    >
      <div class="modal-dialog modal-dialog-centered modal-lg" role="document">
        <div class="modal-content">
          <div class="modal-header bg-primary text-white">
            <h5 class="modal-title">
              <i class="mdi mdi-account-tie me-2"></i>
              Détails du formateur
            </h5>
            <button type="button" class="btn-close btn-close-white" @click="closeDetails"></button>
          </div>
          <div class="modal-body">
            <div class="row">
              <div class="col-md-6">
                <div class="info-card mb-3">
                  <h6 class="info-title">Informations personnelles</h6>
                  <div class="info-content">
                    <div class="info-item">
                      <span class="info-label">Nom complet:</span>
                      <span class="info-value">{{ item.nom }} {{ item.prenom }}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">Genre:</span>
                      <span class="info-value">{{ item.sexe || 'Non spécifié' }}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">Date de naissance:</span>
                      <span class="info-value">{{ formatDate(item.datenais) }}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">Lieu de naissance:</span>
                      <span class="info-value">{{ item.lieunais || 'Non spécifié' }}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">Nationalité:</span>
                      <span class="info-value">{{ item.nationalite || 'Non spécifié' }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="col-md-6">
                <div class="info-card mb-3">
                  <h6 class="info-title">Coordonnées</h6>
                  <div class="info-content">
                    <div class="info-item">
                      <span class="info-label">Email:</span>
                      <span class="info-value">{{ item.email }}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">Téléphone principal:</span>
                      <span class="info-value">{{ item.tel1 }}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">Téléphone secondaire:</span>
                      <span class="info-value">{{ item.tel2 || 'Non spécifié' }}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">Adresse:</span>
                      <span class="info-value">{{ item.adresse || 'Non spécifié' }}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">Ville:</span>
                      <span class="info-value">{{ item.ville || 'Non spécifié' }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="row mt-3">
              <div class="col-md-6">
                <div class="info-card">
                  <h6 class="info-title">Informations professionnelles</h6>
                  <div class="info-content">
                    <div class="info-item">
                      <span class="info-label">Matricule:</span>
                      <span class="info-value">{{ item.enseignant_id || 'Non spécifié' }}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">Spécialité:</span>
                      <span class="info-value">{{ item.specialite || 'Non spécifié' }}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">Grade:</span>
                      <span class="info-value">{{ item.grade || 'Non spécifié' }}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">Statut:</span>
                      <span class="badge" :class="getStatusClass(item.statut)">
                        {{ item.statut || 'Non spécifié' }}
                      </span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">Date d'embauche:</span>
                      <span class="info-value">{{ formatDate(item.date_debut) }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="col-md-6">
                <div class="info-card">
                  <h6 class="info-title">Informations académiques</h6>
                  <div class="info-content">
                    <div class="info-item">
                      <span class="info-label">Niveau enseigné:</span>
                      <span class="info-value">{{ item.niveau || 'Non spécifié' }}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">Cycle:</span>
                      <span class="info-value">{{ item.cycle || 'Non spécifié' }}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">Modules enseignés:</span>
                      <span class="info-value">{{
                        item.modules_enseignes?.join(', ') || 'Aucun module'
                      }}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">Années d'expérience:</span>
                      <span class="info-value">{{ item.annees_experience || 'Non spécifié' }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="closeDetails">
              <i class="mdi mdi-close me-2"></i> Fermer
            </button>
            <button class="btn btn-primary" @click="$emit('edit', item)">
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
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import localizedFormat from 'dayjs/plugin/localizedFormat';

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

const isDetailsVisible = ref(false);

const closeDetails = () => {
  isDetailsVisible.value = false;
};

const getStatusClass = (status) => {
  if (!status) return 'bg-light text-dark';

  status = status.toLowerCase();
  return (
    {
      actif: 'bg-success',
      'en activité': 'bg-success',
      inactif: 'bg-secondary',
      retraité: 'bg-info',
      'en congé': 'bg-warning text-dark',
    }[status] || 'bg-light text-dark'
  );
};

dayjs.extend(localizedFormat);
dayjs.locale('fr');

function formatDate(dateString) {
  if (!dateString) return 'Non spécifié';
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
  padding: 5px 10px;
  border-radius: 50px;
  font-size: 0.75rem;
  font-weight: 500;
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
