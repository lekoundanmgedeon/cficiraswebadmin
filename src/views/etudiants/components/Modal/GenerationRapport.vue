<template>
  <div
    class="modal fade"
    id="genererRapportModal"
    tabindex="-1"
    aria-labelledby="modalRapportLabel"
    aria-hidden="true"
  >
    <div class="modal-dialog modal-dialog-centered modal-md">
      <div class="modal-content border-0 shadow rounded-4 overflow-hidden">
        <div class="modal-header bg-light border-bottom px-4 py-3">
          <div class="d-flex align-items-center">
            <div class="p-2 bg-soft-primary rounded text-primary me-2 line-height-1">
              <i class="mdi mdi-file-document-multiple fs-5"></i>
            </div>
            <div>
              <h6
                class="modal-title fw-bold text-dark text-uppercase small tracking-wider mb-0"
                id="modalRapportLabel"
              >
                Générer un Rapport Étudiant
              </h6>
              <small class="text-muted text-xs">Extraction et listes nominatives consolidées</small>
            </div>
          </div>
          <button
            type="button"
            class="btn-close shadow-none"
            data-bs-dismiss="modal"
            aria-label="Close"
          ></button>
        </div>

        <div class="modal-body p-4">
          <form @submit.prevent="lancerGeneration">
            <div class="mb-3">
              <label class="form-label text-xs fw-bold text-secondary text-uppercase mb-1"
                >Nature du document <span class="text-danger">*</span></label
              >
              <select
                v-model="form.type_rapport"
                class="form-select text-xs shadow-none bg-light border"
                required
              >
                <option value="" disabled>-- Sélectionner un type de rapport --</option>
                <option value="LISTE_EMARGEMENT">Fiche d'émargement officielle</option>
                <option value="LISTE_ALPHABETIQUE">Liste alphabétique des inscrits</option>
                <option value="STATISTIQUES">Statistiques démographiques & Effectifs</option>
                <option value="TROMBINOSCOPE">Trombinoscope de cohorte</option>
              </select>
            </div>

            <div class="row g-2 mb-3">
              <div class="col-md-6">
                <label class="form-label text-xs fw-bold text-secondary text-uppercase mb-1"
                  >Année académique <span class="text-danger">*</span></label
                >
                <select
                  v-model="form.annee_id"
                  class="form-select text-xs shadow-none bg-light border"
                  required
                >
                  <option value="" disabled>-- Sélectionner --</option>
                  <option v-for="annee in annees" :key="annee.id" :value="annee.id">
                    {{ annee.code }} <span v-if="annee.est_active"> (Active)</span>
                  </option>
                </select>
              </div>
              <div class="col-md-6">
                <label class="form-label text-xs fw-bold text-secondary text-uppercase mb-1"
                  >Filière d'études</label
                >
                <select
                  v-model="form.filiere_id"
                  @change="onFiliereChange"
                  class="form-select text-xs shadow-none bg-light border"
                >
                  <option value="">Toutes les filières</option>
                  <option v-for="filiere in filieres" :key="filiere.id" :value="filiere.id">
                    {{ filiere.code }}
                  </option>
                </select>
              </div>
            </div>

            <div class="mb-3">
              <label class="form-label text-xs fw-bold text-secondary text-uppercase mb-1"
                >Classe / Groupe ciblé</label
              >
              <select
                v-model="form.classe_id"
                class="form-select text-xs shadow-none bg-light border"
              >
                <option value="">Toutes les classes</option>
                <option v-for="classe in filteredClasses" :key="classe.id" :value="classe.id">
                  {{ classe.code }}
                </option>
              </select>
            </div>

            <div class="mb-4">
              <label class="form-label text-xs fw-bold text-secondary text-uppercase mb-2"
                >Paramètres d'affichage</label
              >
              <div class="mb-3 d-flex flex-column align-items-center text-center">
                <div class="text-start" style="max-width: 90%">
                  <div class="form-check mb-2">
                    <input
                      class="form-check-input shadow-none cursor-pointer"
                      type="checkbox"
                      id="checkPhoto"
                      v-model="form.inclure_photos"
                    />
                    <label
                      class="form-check-label text-xs text-dark cursor-pointer"
                      for="checkPhoto"
                    >
                      Inclure les photos de profil (Trombinoscope / Émargement)
                    </label>
                  </div>

                  <div class="form-check mb-1">
                    <input
                      class="form-check-input shadow-none cursor-pointer"
                      type="checkbox"
                      id="checkInactifs"
                      v-model="form.exclure_suspendus"
                    />
                    <label
                      class="form-check-label text-xs text-dark cursor-pointer"
                      for="checkInactifs"
                    >
                      Masquer les étudiants aux inscriptions suspendues/abandonnées
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div class="mb-4 p-3 bg-light rounded">
              <label class="form-label text-xs fw-bold text-secondary text-uppercase d-block mb-2"
                >Format de téléchargement</label
              >
              <div class="d-flex gap-3">
                <div
                  class="form-check flex-fill p-2 bg-white rounded border text-center custom-radio-card"
                >
                  <input
                    class="form-check-input d-none"
                    type="radio"
                    name="format"
                    id="formatPdf"
                    value="PDF"
                    v-model="form.format"
                  />
                  <label
                    class="form-check-label d-block text-xs fw-bold cursor-pointer"
                    :class="form.format === 'PDF' ? 'text-danger' : 'text-muted'"
                    for="formatPdf"
                  >
                    <i class="mdi mdi-file-pdf-box fs-3 d-block mb-1 text-danger"></i>
                    Document PDF (.pdf)
                  </label>
                </div>
                <div
                  class="form-check flex-fill p-2 bg-white rounded border text-center custom-radio-card"
                >
                  <input
                    class="form-check-input d-none"
                    type="radio"
                    name="format"
                    id="formatExcel"
                    value="EXCEL"
                    v-model="form.format"
                  />
                  <label
                    class="form-check-label d-block text-xs fw-bold cursor-pointer"
                    :class="form.format === 'EXCEL' ? 'text-success' : 'text-muted'"
                    for="formatExcel"
                  >
                    <i class="mdi mdi-file-excel fs-3 d-block mb-1 text-success"></i>
                    Tableur Excel (.xlsx)
                  </label>
                </div>
              </div>
            </div>

            <div v-if="errorMessage" class="alert alert-danger p-2 text-xs mb-3">
              <i class="mdi mdi-alert-circle me-1"></i> {{ errorMessage }}
            </div>

            <div class="d-flex gap-2 justify-content-end pt-2 border-top border-light">
              <button
                type="button"
                class="btn btn-sm btn-light border text-xs px-3 shadow-none"
                data-bs-dismiss="modal"
                :disabled="loading"
              >
                Annuler
              </button>
              <button type="submit" class="btn btn-sm btn-primary text-xs px-4" :disabled="loading">
                <span
                  v-if="loading"
                  class="spinner-border spinner-border-sm me-1"
                  role="status"
                  aria-hidden="true"
                ></span>
                <i v-else class="mdi mdi-cloud-download me-1"></i> Lancer l'extraction
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAnneeStore } from '@/modules/structure-academique/annee/store';
import { useFiliereStore } from '@/modules/structure-academique/filiere/store';
import { useClasseStore } from '@/modules/structure-academique/classe/store';
import { useNotifier } from '@/stores/messages/useNotifier';

const emit = defineEmits(['rapportGenere']);

/* Stores */
const anneeStore = useAnneeStore();
const filiereStore = useFiliereStore();
const classeStore = useClasseStore();
const { notifyError, notifySuccess } = useNotifier();

/* State */
const loading = ref(false);
const errorMessage = ref('');
const annees = ref([]);
const filieres = ref([]);
const classes = ref([]);

const form = ref({
  type_rapport: '',
  annee_id: '',
  filiere_id: '',
  classe_id: '',
  inclure_photos: true,
  exclure_suspendus: false,
  format: 'PDF',
});

/* Filtrer dynamiquement les classes selon la filière sélectionnée (Sécurisé UUID) */
const filteredClasses = computed(() => {
  if (!form.value.filiere_id) return classes.value;
  return classes.value.filter((c) => c.filiere_id === form.value.filiere_id);
});

/* Charger la donnée pour alimenter les listes déroulantes */
onMounted(async () => {
  try {
    await Promise.all([
      anneeStore.fetchAnneesAcademiques(),
      filiereStore.fetchFilieres(),
      classeStore.fetchClasses(),
    ]);

    annees.value = anneeStore.anneesAcademiques || [];
    filieres.value = filiereStore.filieres || [];
    classes.value = classeStore.classes || [];

    // Sélection par défaut automatique sur l'année en cours active
    const anneeActive = annees.value.find((a) => a.est_active);
    if (anneeActive) {
      form.value.annee_id = anneeActive.id;
    }
  } catch (error) {
    notifyError("Erreur lors du chargement des filtres d'extraction.");
  }
});

const onFiliereChange = () => {
  form.value.classe_id = ''; // Réinitialisation de la classe en cascade
};

/* Logique de traitement */
const lancerGeneration = async () => {
  errorMessage.value = '';

  if (!form.value.type_rapport || !form.value.annee_id) {
    errorMessage.value = 'Le type de rapport et l’année académique sont obligatoires.';
    return;
  }

  loading.value = true;

  const payload = {
    type_rapport: form.value.type_rapport,
    annee_id: form.value.annee_id,
    filiere_id: form.value.filiere_id || null,
    classe_id: form.value.classe_id || null,
    inclure_photos: form.value.inclure_photos,
    exclure_suspendus: form.value.exclure_suspendus,
    format: form.value.format,
  };

  try {
    // Appel réel à votre route d'export de document (Simulé ici)
    await new Promise((resolve) => setTimeout(resolve, 1800));

    notifySuccess('Rapport généré et téléchargé avec succès.');
    emit('rapportGenere', payload);

    // Clôture propre du modal via Bootstrap
    const el = document.getElementById('genererRapportModal');
    const modal = bootstrap.Modal.getInstance(el) || new bootstrap.Modal(el);
    if (modal) modal.hide();

    // Reset du formulaire en conservant la rétention de l'année active
    const currentAnnee = form.value.annee_id;
    form.value = {
      type_rapport: '',
      annee_id: currentAnnee,
      filiere_id: '',
      classe_id: '',
      inclure_photos: true,
      exclure_suspendus: false,
      format: 'PDF',
    };
  } catch (error) {
    errorMessage.value = error.message || 'Erreur lors du calcul du rapport.';
    notifyError(errorMessage.value);
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.bg-soft-primary {
  background-color: rgba(0, 123, 255, 0.08);
}
.text-xs {
  font-size: 11px !important;
}
.tracking-wider {
  letter-spacing: 0.5px;
}
.line-height-1 {
  line-height: 1;
}
.cursor-pointer {
  cursor: pointer;
}

/* Customisation des radios-cards cliquables */
.custom-radio-card {
  transition: all 0.2s ease-in-out;
}
.form-check-input:checked + .form-check-label {
  font-weight: 700 !important;
}
.form-check:has(.form-check-input:checked) {
  border-color: #007bff !important;
  background-color: rgba(0, 123, 255, 0.02) !important;
  box-shadow: 0 2px 4px rgba(0, 123, 255, 0.05);
}

/* Uniformisation stricte à l'image du template */
.rounded-4 {
  border-radius: 0.2rem !important; /* Format compact ERP */
}
.form-control,
.form-select {
  border-radius: 0.15rem;
}
</style>
