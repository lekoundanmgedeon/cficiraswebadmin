<template>
  <teleport to="body">
    <!-- Transition pour un effet d'apparition fluide -->
    <transition name="modal-fade">
      <div
        v-if="modelValue"
        class="modal fade show d-block"
        tabindex="-1"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title-id"
        style="background-color: rgba(15, 23, 42, 0.45); backdrop-filter: blur(4px)"
        @click.self="close"
      >
        <div class="modal-dialog modal-dialog-centered modal-md" role="document">
          <div class="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
            <!-- Header Stylisé -->
            <div class="modal-header bg-primary text-white border-0 px-4 py-3">
              <h5 class="modal-title fw-bold d-flex align-items-center gap-2" id="modal-title-id">
                <i class="mdi mdi-account-card-details-outline fs-4"></i>
                Détails de l'inscription
              </h5>
              <button
                type="button"
                class="btn-close btn-close-white shadow-none"
                @click="close"
                aria-label="Fermer"
              ></button>
            </div>

            <!-- Body avec Fallbacks de clés API Sécurisés -->
            <div class="modal-body p-4" v-if="inscription">
              <div class="text-center mb-4">
                <div
                  class="avatar-container bg-soft-primary rounded-circle mx-auto mb-2 d-flex align-items-center justify-content-center"
                  style="width: 65px; height: 65px"
                >
                  <i class="mdi mdi-account text-primary display-6"></i>
                </div>
                <h5 class="fw-bold text-dark mb-0">
                  {{ inscription.etudiant_nom || inscription.nom }}
                  {{ inscription.etudiant_prenom || inscription.prenom }}
                </h5>
                <span class="badge bg-light text-secondary border px-2 py-1 font-monospace mt-1">
                  {{
                    inscription.etudiant_matricule || inscription.matricule || 'Pas de matricule'
                  }}
                </span>
              </div>

              <ul class="list-group list-group-flush border-top border-bottom">
                <li
                  class="list-group-item d-flex justify-content-between align-items-center px-0 py-3"
                >
                  <span class="text-muted small-title">Sexe</span>
                  <span class="fw-semibold text-dark">{{
                    formatSexe(inscription.etudiant_sexe || inscription.sexe)
                  }}</span>
                </li>

                <li
                  class="list-group-item d-flex justify-content-between align-items-center px-0 py-3"
                >
                  <span class="text-muted small-title">Classe</span>
                  <span
                    class="badge bg-soft-info text-info fw-bold font-monospace px-3 py-2 rounded"
                  >
                    {{ inscription.classe_code || inscription.classe || 'Non spécifiée' }}
                  </span>
                </li>

                <li
                  class="list-group-item d-flex justify-content-between align-items-center px-0 py-3"
                >
                  <span class="text-muted small-title">Filière</span>
                  <span class="fw-medium text-dark text-end truncate-text" style="max-width: 250px">
                    {{ inscription.filiere_nom || inscription.filiere_code || 'Non spécifiée' }}
                  </span>
                </li>

                <li
                  class="list-group-item d-flex justify-content-between align-items-center px-0 py-3"
                >
                  <span class="text-muted small-title">Année Académique</span>
                  <span
                    class="badge bg-light text-success border border-success-subtle font-monospace px-2 py-1"
                  >
                    {{ inscription.annee_code || inscription.annee || 'N/A' }}
                  </span>
                </li>

                <li
                  class="list-group-item d-flex justify-content-between align-items-center px-0 py-3"
                >
                  <span class="text-muted small-title">Date d'inscription</span>
                  <span class="text-secondary fw-medium">
                    {{ formatDate(inscription.created_at || inscription.date_inscription) }}
                  </span>
                </li>

                <li
                  class="list-group-item d-flex justify-content-between align-items-center px-0 py-3"
                >
                  <span class="text-muted small-title">Statut de la fiche</span>
                  <span
                    class="badge rounded-pill px-3 py-2 fw-semibold"
                    :class="statutClass(inscription.inscription_statut || inscription.statut)"
                  >
                    {{ formatStatutTexte(inscription.inscription_statut || inscription.statut) }}
                  </span>
                </li>
              </ul>
            </div>

            <!-- Footer -->
            <div class="modal-footer bg-light border-0 px-4 py-3">
              <button
                type="button"
                class="btn btn-secondary rounded-pill px-4 shadow-sm"
                @click="close"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup>
import { onMounted, onUnmounted, watch } from 'vue';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  inscription: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(['update:modelValue']);

const close = () => {
  emit('update:modelValue', false);
};

// Gestion dynamique des classes de statut (Normalisation en Majuscules)
const statutClass = (statut) => {
  const format = (statut || '').toUpperCase();
  return {
    'bg-soft-success text-success': format === 'ACTIVE' || format === 'VALIDÉE',
    'bg-soft-warning text-warning': format === 'EN_ATTENTE',
    'bg-soft-danger text-danger': format === 'ANNULEE' || format === 'ANNULÉE',
  };
};

const formatStatutTexte = (statut) => {
  const format = (statut || '').toUpperCase();
  if (format === 'ACTIVE' || format === 'VALIDÉE') return 'Validée';
  if (format === 'EN_ATTENTE') return 'En attente';
  if (format === 'ANNULEE' || format === 'ANNULÉE') return 'Annulée';
  return statut || 'Inconnu';
};

const formatSexe = (sexe) => {
  if (!sexe) return 'Non renseigné';
  const s = sexe.toUpperCase();
  if (s === 'M' || s === 'MASCULIN') return 'Masculin';
  if (s === 'F' || s === 'FEMININ') return 'Féminin';
  return sexe;
};

const formatDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// UX : Bloquer le scroll du body arrière-plan quand le modal est ouvert
watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  },
  { immediate: true }
);

// UX : Fermeture via la touche Échap
const handleKeydown = (e) => {
  if (e.key === 'Escape' && props.modelValue) close();
};

onMounted(() => {
  window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
  document.body.style.overflow = ''; // Sécurité nettoyage
});
</script>

<style scoped>
/* Classes Soft Colors */
.bg-soft-primary {
  background-color: rgba(75, 73, 172, 0.1);
}
.bg-soft-info {
  background-color: rgba(0, 192, 244, 0.12);
}
.bg-soft-success {
  background-color: rgba(25, 135, 84, 0.12);
}
.bg-soft-warning {
  background-color: rgba(255, 193, 7, 0.15);
}
.bg-soft-danger {
  background-color: rgba(220, 53, 69, 0.12);
}

.small-title {
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 500;
}

.truncate-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Animations de transition de la feuille modale */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.25s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-active .modal-dialog {
  animation: slideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes slideIn {
  from {
    transform: translateY(-20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
</style>
