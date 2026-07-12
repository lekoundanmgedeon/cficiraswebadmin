<template>
  <div
    class="modal fade"
    id="createSessionModal"
    tabindex="-1"
    aria-labelledby="createSessionModalLabel"
    aria-hidden="true"
    ref="modalRef"
  >
    <div class="modal-dialog modal-dialog-centered modal-lg">
      <div class="modal-content border-0 shadow-lg">
        <div class="modal-header bg-primary text-white">
          <h5 class="modal-title" id="createSessionModalLabel">
            <i class="bi bi-calendar-plus me-2"></i>Ajouter une nouvelle session d'examen
          </h5>
          <button
            type="button"
            class="btn-close btn-close-white"
            data-bs-dismiss="modal"
            aria-label="Close"
            :disabled="loading"
          ></button>
        </div>

        <form @submit.prevent="handleSubmit">
          <div class="modal-body p-4">
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label fw-bold small">Année Académique *</label>
                <select
                  v-model="form.annee_id"
                  class="form-select fw-semibold text-dark"
                  required
                  :disabled="loading"
                >
                  <option value="" disabled>— Sélectionnez une année —</option>
                  <option v-for="annee in anneesAcademiques" :key="annee.id" :value="annee.id">
                    {{ annee.code || annee.nom }}
                    <span v-if="anneeAcademique && annee.id === anneeAcademique.id">
                      (Courante)</span
                    >
                  </option>
                </select>
                <div class="form-text text-muted text-xs">
                  <i class="bi bi-info-circle me-1"></i> Les semestres se chargeront automatiquement
                  après sélection.
                </div>
              </div>

              <div class="col-md-6">
                <label class="form-label fw-bold small">Semestre *</label>
                <select
                  v-model="form.semestre_id"
                  class="form-select"
                  required
                  :disabled="loading || !form.annee_id || semestresLoading"
                >
                  <option value="" disabled v-if="semestresLoading">
                    Chargement des semestres...
                  </option>
                  <option value="" disabled v-else>— Sélectionnez un semestre —</option>

                  <option v-for="sem in semestres" :key="sem.id" :value="sem.id">
                    {{ sem.code }} - {{ sem.designation || sem.nom }}
                  </option>
                </select>
                <div v-if="!form.annee_id" class="form-text text-warning text-xs">
                  Veuillez d'abord choisir une année académique.
                </div>
                <div
                  v-else-if="semestres.length === 0 && !semestresLoading"
                  class="form-text text-danger text-xs"
                >
                  <i class="bi bi-exclamation-triangle-fill me-1"></i> Aucun semestre configuré pour
                  cette année.
                </div>
              </div>

              <div class="col-md-6">
                <label class="form-label fw-bold small">Code Unique *</label>
                <input
                  v-model="form.code"
                  type="text"
                  class="form-control font-monospace"
                  placeholder="Ex: S1_NORM_2026"
                  required
                  :disabled="loading"
                />
              </div>

              <div class="col-md-6">
                <label class="form-label fw-bold small">Désignation *</label>
                <input
                  v-model="form.designation"
                  type="text"
                  class="form-control"
                  placeholder="Ex: Session Normale Semestre 1"
                  required
                  :disabled="loading"
                />
              </div>

              <div class="col-md-6">
                <label class="form-label fw-bold small">Type de Session *</label>
                <select
                  v-model="form.type_session"
                  class="form-select"
                  required
                  :disabled="loading"
                >
                  <option value="NORMALE">NORMALE</option>
                  <option value="RATTRAPAGE">RATTRAPAGE</option>
                </select>
              </div>

              <div class="col-md-6">
                <label class="form-label fw-bold small">État Initial *</label>
                <select v-model="form.etat" class="form-select" required :disabled="loading">
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="Brouillon">Brouillon / Inactive</option>
                </select>
              </div>

              <div class="col-md-6">
                <label class="form-label fw-bold small">Date de Début *</label>
                <input
                  v-model="form.date_debut"
                  type="date"
                  class="form-control"
                  :class="{ 'is-invalid': dateError }"
                  required
                  :disabled="loading"
                  @change="validateDates"
                />
              </div>

              <div class="col-md-6">
                <label class="form-label fw-bold small">Date de Fin *</label>
                <input
                  v-model="form.date_fin"
                  type="date"
                  class="form-control"
                  :class="{ 'is-invalid': dateError }"
                  required
                  :disabled="loading"
                  @change="validateDates"
                />
                <div v-if="dateError" class="invalid-feedback text-xs">
                  La date de fin ne peut pas être antérieure à la date de début.
                </div>
              </div>

              <div class="col-md-12">
                <label class="form-label fw-bold small">Responsable / Entité Organisatrice *</label>
                <input
                  v-model="form.responsable"
                  type="text"
                  class="form-control"
                  placeholder="Ex: Scolarité Centrale, Direction des Études"
                  required
                  :disabled="loading"
                />
              </div>
            </div>
          </div>

          <div class="modal-footer bg-light">
            <button
              type="button"
              class="btn btn-sm btn-secondary"
              data-bs-dismiss="modal"
              :disabled="loading"
            >
              Annuler
            </button>
            <button
              type="submit"
              class="btn btn-sm btn-primary px-3"
              :disabled="loading || dateError || semestresLoading"
            >
              <span
                v-if="loading"
                class="spinner-border spinner-border-sm me-2"
                role="status"
              ></span>
              <i v-else class="bi bi-cloud-check me-1"></i>
              Enregistrer la Session
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useSessionStore } from '@/stores/evaluationStore/sessionStore.js';
import { useAnneeStore } from '@/modules/annee-academique/store/anneeStore';
import { useSemestreStore } from '@/stores/academiqueStore/semestreStore.js';
import { useNotifier } from '@/stores/messages/useNotifier';

// Initialisation des Stores
const sessionStore = useSessionStore();
const anneeStore = useAnneeStore();
const semestreStore = useSemestreStore();
const { notifyError, notifySuccess } = useNotifier();

// Références réactives globales des stores
const { loading } = storeToRefs(sessionStore);
const { anneesAcademiques, anneeAcademique } = storeToRefs(anneeStore);
const { semestres } = storeToRefs(semestreStore);

// États locaux additionnels
const modalRef = ref(null);
const dateError = ref(false);
const semestresLoading = ref(false);

const initialFormState = {
  annee_id: '',
  semestre_id: '',
  code: '',
  designation: '',
  type_session: 'NORMALE',
  etat: 'ACTIVE',
  date_debut: '',
  date_fin: '',
  responsable: '',
};

const form = reactive({ ...initialFormState });

/* =========================================================================
   🔄 CHARGEMENT EN CASCADE SÉLECTION DE L'ANNÉE -> SEMESTRES
   ========================================================================= */

onMounted(async () => {
  try {
    // Charge toutes les années pour le menu déroulant complet
    await anneeStore.fetchAnneesAcademiques();

    // Identifie également l'année active par défaut pour pré-remplir la liste
    await anneeStore.fetchCurrentAnnee();
    if (anneeAcademique.value?.id) {
      form.annee_id = anneeAcademique.value.id;
    }
  } catch (err) {
    console.error("Erreur de chargement de l'environnement académique :", err);
  }
});

// Écouteur réactif sur l'année sélectionnée (Au clic/changement de l'option)
watch(
  () => form.annee_id,
  async (newAnneeId) => {
    form.semestre_id = ''; // Réinitialisation immédiate du semestre sélectionné

    if (newAnneeId) {
      semestresLoading.value = true;
      try {
        // Chargement depuis le serveur des semestres rattachés à cette année spécifique
        await semestreStore.fetchSemestresByAnnee(newAnneeId);
      } catch (err) {
        console.error("Erreur d'actualisation des semestres pour l'année cliquée :", err);
      } finally {
        semestresLoading.value = false;
      }
    }
  }
);

/* =========================================================================
   ⏳ CONTRÔLE DE COHÉRENCE CHRONOLOGIQUE (DATES)
   ========================================================================= */
const validateDates = () => {
  if (form.date_debut && form.date_fin) {
    const debut = new Date(form.date_debut);
    const fin = new Date(form.date_fin);

    dateError.value = fin < debut;
  } else {
    dateError.value = false;
  }
};

/* =========================================================================
   🚀 ENREGISTREMENT ET NETTOYAGE
   ========================================================================= */
const handleSubmit = async () => {
  validateDates();
  if (dateError.value) {
    return notifyError(
      'Action interrompue : La date de fin ne peut pas être antérieure à la date de début.'
    );
  }

  try {
    await sessionStore.addSession({ ...form });
    notifySuccess("La session d'examen a été créée avec succès.");

    // Préservation de l'année pour éviter une reconfiguration lourde de l'utilisateur
    const currentSelectedAnnee = form.annee_id;

    Object.assign(form, initialFormState);
    dateError.value = false;

    // On réaffecte l'année après réinitialisation
    form.annee_id = currentSelectedAnnee;

    if (modalRef.value) {
      const modalInstance = window.bootstrap?.Modal.getInstance(modalRef.value);
      modalInstance?.hide();
    }
  } catch (error) {
    console.error('Erreur lors de la soumission de la session :', error);
  }
};
</script>

<style scoped>
.text-xs {
  font-size: 11px !important;
}
.modal-content {
  border-radius: 12px;
}
.form-label {
  color: #495057;
}
.form-control:focus,
.form-select:focus {
  border-color: #0d6efd;
  box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.15);
}
</style>
