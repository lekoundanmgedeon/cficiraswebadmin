<template>
  <!-- Retour à votre Dropdown d'origine -->
  <div class="dropdown">
    <button class="btn btn-sm btn-outline-primary dropdown-toggle" data-bs-toggle="dropdown">
      ...
    </button>
    <ul class="dropdown-menu dropdown-menu-light shadow-sm">
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

  <!-- Modal Détails (Version Enrichie et Pro) -->
  <teleport to="body">
    <div
      v-if="isDetailsVisible"
      class="modal-backdrop-custom d-flex align-items-center justify-content-center"
      @click.self="closeDetails"
    >
      <div class="modal-card shadow-lg animate-zoom">
        <!-- Header Profil -->
        <div class="profile-header text-center">
          <button class="btn-close-modal" @click="closeDetails">×</button>
          <div class="avatar-wrapper">
            <img
              :src="item.photo || '/img/default-avatar.png'"
              class="profile-avatar shadow"
              alt="Avatar"
            />
          </div>
          <h4 class="mt-3 fw-bold text-dark">{{ item.nom }} {{ item.prenom }}</h4>
          <span class="badge bg-soft-primary text-primary rounded-pill px-3">{{
            item.matricule
          }}</span>
        </div>

        <div class="modal-body-custom p-4">
          <div class="row g-4">
            <!-- Colonne 1: Infos Perso -->
            <div class="col-md-6 border-end">
              <h6 class="text-uppercase text-muted small fw-bold mb-3">Identité & Contact</h6>
              <div class="info-group">
                <div class="d-flex justify-content-between mb-2">
                  <span class="text-muted small">Sexe:</span>
                  <span class="fw-semibold">{{ item.sexe }}</span>
                </div>
                <div class="d-flex justify-content-between mb-2">
                  <span class="text-muted small">Né(e) le:</span>
                  <span class="fw-semibold">{{ formatDate(item.date_naissance) }}</span>
                </div>
                <div class="d-flex justify-content-between mb-2">
                  <span class="text-muted small">Lieu:</span>
                  <span class="fw-semibold">{{ item.lieu_naissance }}</span>
                </div>
                <hr class="my-3 opacity-25" />
                <div class="d-flex justify-content-between mb-2">
                  <span class="text-muted small">Téléphone:</span>
                  <span class="fw-bold text-primary">{{ item.telephone }}</span>
                </div>
                <div class="text-truncate">
                  <span class="text-muted small d-block">Email:</span>
                  <span class="fw-semibold">{{ item.email }}</span>
                </div>
              </div>
            </div>

            <!-- Colonne 2: Académique -->
            <div class="col-md-6">
              <h6 class="text-uppercase text-muted small fw-bold mb-3">Parcours Scolaire</h6>
              <div class="academic-box p-3 rounded-3 bg-light">
                <div class="mb-3">
                  <label class="text-muted x-small d-block text-uppercase">Filière</label>
                  <span class="fw-bold text-dark">{{ item.filiere }}</span>
                </div>
                <div class="mb-3">
                  <label class="text-muted x-small d-block text-uppercase">Niveau & Classe</label>
                  <span class="fw-semibold">{{ item.niveau }} - {{ item.classe }}</span>
                </div>
                <div>
                  <label class="text-muted x-small d-block text-uppercase">Année Académique</label>
                  <span class="badge bg-white text-dark shadow-sm">{{
                    item.annee_academique
                  }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer Modal -->
          <div class="mt-4 pt-3 border-top d-flex justify-content-between align-items-center">
            <span
              class="badge"
              :class="item.statut === 'Actif' ? 'bg-success' : 'bg-warning text-dark'"
            >
              Statut: {{ item.statut }}
            </span>
            <div class="d-flex gap-2">
              <button class="btn btn-secondary btn-sm px-4" @click="closeDetails">Fermer</button>
              <button class="btn btn-primary btn-sm px-4" @click="$emit('edit', item)">
                Modifier
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </teleport>
</template>

<style scoped>
/* Modal Overlay moderne */
.modal-backdrop-custom {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  z-index: 1050;
}

.modal-card {
  background: #fff;
  width: 90%;
  max-width: 650px;
  border-radius: 15px;
  overflow: hidden;
  position: relative;
}

.profile-header {
  background: #f8faff;
  padding: 30px 20px;
  border-bottom: 1px solid #edf2f9;
}

.avatar-wrapper {
  position: relative;
  display: inline-block;
}

.profile-avatar {
  width: 100px;
  height: 100px;
  border-radius: 20px; /* Style "Squircle" */
  border: 4px solid #fff;
  object-fit: cover;
}

.btn-close-modal {
  position: absolute;
  top: 15px;
  right: 15px;
  border: none;
  background: none;
  font-size: 1.5rem;
  color: #95aac9;
  line-height: 1;
}

.academic-box {
  border: 1px solid #e3ebf6;
}

.x-small {
  font-size: 0.7rem;
  letter-spacing: 0.5px;
}

.bg-soft-primary {
  background: rgba(75, 73, 172, 0.1);
}

/* Animation simple */
.animate-zoom {
  animation: zoomIn 0.2s ease-out;
}
@keyframes zoomIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* On garde vos styles de dropdown existants via Bootstrap */
</style>

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

const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};
</script>
