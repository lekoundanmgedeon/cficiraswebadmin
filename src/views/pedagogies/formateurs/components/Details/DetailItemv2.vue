<template>
  <!-- Ton Dropdown d'origine conservé -->
  <div class="dropdown">
    <button class="btn btn-sm btn-outline-primary dropdown-toggle" data-bs-toggle="dropdown">
      ...
    </button>
    <ul class="dropdown-menu dropdown-menu-light shadow-sm border-0">
      <li>
        <button class="dropdown-item py-2" @click="isDetailsVisible = true">
          <i class="mdi mdi-information-outline me-2 text-info"></i> Détails
        </button>
      </li>
      <li v-if="showAdd">
        <button class="dropdown-item py-2" @click="$emit('add', item)">
          <i class="mdi mdi-plus-circle-outline me-2 text-success"></i> Ajouter
        </button>
      </li>
      <li>
        <button
          class="dropdown-item py-2"
          data-bs-toggle="modal"
          :data-bs-target="editModalTarget"
          @click="$emit('edit', item)"
        >
          <i class="mdi mdi-pencil-outline me-2 text-primary"></i> Modifier
        </button>
      </li>
      <li class="dropdown-divider opacity-50"></li>
      <li>
        <button class="dropdown-item py-2 text-danger" @click="$emit('delete', item)">
          <i class="mdi mdi-delete-outline me-2"></i> Supprimer
        </button>
      </li>
    </ul>
  </div>

  <!-- Nouvelle Modal Détails Formateur -->
  <teleport to="body">
    <div
      v-if="isDetailsVisible"
      class="modal-backdrop-custom d-flex align-items-center justify-content-center"
      @click.self="closeDetails"
    >
      <div class="modal-card shadow-lg animate-zoom">
        <!-- Header : Profil Enseignant -->
        <div class="profile-header-trainer">
          <button class="btn-close-modal" @click="closeDetails">×</button>
          <div class="d-flex align-items-center gap-4">
            <div class="avatar-wrapper">
              <img
                v-if="item.photourl"
                :src="getImageUrl(item.photourl)"
                class="trainer-img shadow"
              />
              <div v-else class="trainer-placeholder shadow">
                {{ item.nom ? item.nom[0] : '?' }}{{ item.prenom ? item.prenom[0] : '' }}
              </div>
            </div>
            <div class="text-start">
              <h4 class="fw-bold text-dark mb-1">{{ item.nom }} {{ item.prenom }}</h4>
              <div class="d-flex gap-2 align-items-center">
                <span class="badge bg-soft-primary text-primary rounded-pill px-3">
                  ID: {{ item.enseignant_id || 'N/A' }}
                </span>
                <span class="badge bg-soft-success text-success rounded-pill px-3">
                  <i class="mdi mdi-briefcase-outline me-1"></i>
                  {{ item.designation_type_enseignant || 'Formateur' }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-body-custom p-4">
          <!-- Contacts Rapides -->
          <div class="row g-3 mb-4">
            <div class="col-md-6">
              <div class="contact-pill shadow-sm">
                <i class="mdi mdi-email-outline text-primary"></i>
                <span class="text-truncate">{{ item.email || "Pas d'email" }}</span>
              </div>
            </div>
            <div class="col-md-6">
              <div class="contact-pill shadow-sm">
                <i class="mdi mdi-phone-outline text-success"></i>
                <span
                  >{{ displayTel(item.tel1) }}
                  {{ item.tel2 ? '/ ' + displayTel(item.tel2) : '' }}</span
                >
              </div>
            </div>
          </div>

          <div class="row g-4">
            <!-- Section 1 : Infos Personnelles -->
            <div class="col-md-6">
              <div class="info-section">
                <h6 class="section-title-modern">
                  <i class="mdi mdi-account-circle-outline me-2"></i>État Civil
                </h6>
                <div class="info-list">
                  <div class="info-row">
                    <span class="label">Date de naissance</span>
                    <span class="value">{{ formatDate(item.datenais) }}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">Lieu</span>
                    <span class="value">{{ item.lieunais || 'Non spécifié' }}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">Genre</span>
                    <span class="value">{{ item.sexe === 'M' ? 'Masculin' : 'Féminin' }}</span>
                  </div>
                  <div class="info-row border-0">
                    <span class="label">Situation</span>
                    <span class="value text-primary fw-semibold">{{
                      item.matrimonial || 'N/A'
                    }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Section 2 : Expertise Académique -->
            <div class="col-md-6">
              <div class="info-section expertise-card">
                <h6 class="section-title-modern text-white">
                  <i class="mdi mdi-certificate-outline me-2"></i>Expertise & Diplômes
                </h6>
                <div class="academic-item mb-3">
                  <small class="d-block opacity-75">Dernier Diplôme</small>
                  <span class="fw-bold">{{ item.diplome || 'Non spécifié' }}</span>
                </div>
                <div class="academic-item mb-3">
                  <small class="d-block opacity-75">Spécialité</small>
                  <span class="fw-bold">{{ item.specialite || 'Non spécifié' }}</span>
                </div>
                <div class="academic-item">
                  <small class="d-block opacity-75">Établissement</small>
                  <span class="fw-bold small">{{ item.etablissement || 'N/A' }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer-custom p-3 border-top d-flex justify-content-end gap-2 bg-light">
          <button class="btn btn-secondary btn-sm px-4 rounded-pill" @click="closeDetails">
            Fermer
          </button>
          <button
            class="btn btn-primary btn-sm px-4 rounded-pill shadow-sm"
            @click="$emit('edit', item)"
          >
            <i class="mdi mdi-pencil-outline me-1"></i> Éditer le profil
          </button>
        </div>
      </div>
    </div>
  </teleport>
</template>

<style scoped>
/* Modal Structure */
.modal-backdrop-custom {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(15, 23, 42, 0.5);
  backdrop-filter: blur(5px);
  z-index: 1060;
}

.modal-card {
  background: #fff;
  width: 95%;
  max-width: 700px;
  border-radius: 20px;
  overflow: hidden;
  position: relative;
}

/* Header Style */
.profile-header-trainer {
  background: #f8faff;
  padding: 40px 30px 25px;
  border-bottom: 1px solid #edf2f9;
  position: relative;
}

.trainer-img,
.trainer-placeholder {
  width: 90px;
  height: 90px;
  border-radius: 25px; /* Squircle style */
  object-fit: cover;
  border: 4px solid #fff;
}

.trainer-placeholder {
  background: linear-gradient(135deg, #4b49ac 0%, #7978e9 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  font-weight: bold;
}

.btn-close-modal {
  position: absolute;
  top: 15px;
  right: 20px;
  border: none;
  background: transparent;
  font-size: 1.8rem;
  color: #94a3b8;
}

/* Contact Pills */
.contact-pill {
  background: #fff;
  border: 1px solid #f1f5f9;
  padding: 10px 15px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.85rem;
  color: #475569;
}

/* Section Design */
.section-title-modern {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: 800;
  color: #94a3b8;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #f1f5f9;
  font-size: 0.9rem;
}

.label {
  color: #64748b;
}
.value {
  color: #1e293b;
  font-weight: 500;
}

/* Expertise Card */
.expertise-card {
  background: #4b49ac;
  color: white;
  padding: 20px;
  border-radius: 18px;
  box-shadow: 0 10px 20px rgba(75, 73, 172, 0.2);
}
.expertise-card .section-title-modern {
  color: rgba(255, 255, 255, 0.7);
}

.bg-soft-primary {
  background: rgba(75, 73, 172, 0.1);
}
.bg-soft-success {
  background: rgba(25, 135, 84, 0.1);
}

/* Animation */
.animate-zoom {
  animation: zoomIn 0.25s ease-out;
}
@keyframes zoomIn {
  from {
    opacity: 0;
    transform: scale(0.92);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>

<script setup>
import { ref, onMounted } from 'vue';
import { getEnseignants } from '@/api/pedagogies/pedagogieApi';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
const etudiant = ref();
import localizedFormat from 'dayjs/plugin/localizedFormat';

const props = defineProps({
  item: Object,
  showAdd: { type: Boolean, default: false },
  editModalTarget: { type: String, default: '#exampleModal-edit' },
});

const isDetailsVisible = ref(false);
const enseignantDetails = ref(null);

const closeDetails = () => {
  isDetailsVisible.value = false;
};

const calculateCompletionRate = () => {
  const modules = parseInt(props.item.modules_evalues) || 1;
  const notes = parseInt(props.item.nombre_notes_saisies) || 0;
  return Math.min(Math.round((notes / modules) * 100), 100);
};

const getStatusClass = (status) => {
  return (
    {
      active: 'bg-success',
      inactive: 'bg-secondary',
      draft: 'bg-warning text-dark',
      completed: 'bg-info',
    }[status] || 'bg-light text-dark'
  );
};

dayjs.extend(localizedFormat);
dayjs.locale('fr');

function toInputDateFormat(dateString) {
  return dateString ? dayjs(dateString).format('DD MMMM YYYY') : '-';
}

function formatDate(dateString) {
  if (!dateString) return 'Non spécifié';
  return dayjs(dateString).format('DD MMMM YYYY');
}

onMounted(async () => {
  const res = await getEnseignants();
  if (res.success && res.data) {
    enseignantDetails.value = res.data.find(
      (ens) => `${ens.nom} ${ens.prenom}`.trim() === props.item.responsable?.trim()
    );
  }
});

function displayTel(tel) {
  return tel && tel !== '' ? tel : 'Non spécifié';
}

const getImageUrl = (photoPath) => {
  return `http://localhost:3500${photoPath}`; // Remplace cette URL par celle de ton backend
};
</script>
