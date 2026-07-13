<template>
  <div class="container-fluid py-4 animate__animated animate__fadeIn">
    <div class="col-12 mb-4 d-flex justify-content-between align-items-center">
      <div>
        <h4 class="fw-bold mb-1">Saisie Manuelle des Notes</h4>
        <p class="text-muted small mb-0">
          <i class="bi bi-journal-check me-1"></i>
          Enregistrez les évaluations, saisissez les notes et analysez les performances du
          <strong>Semestre {{ semestre }}</strong
          >.
        </p>
      </div>
    </div>

    <div class="col-12 mb-4">
      <div class="card border-0 shadow-sm bg-light rounded-4">
        <div class="card-body p-3">
          <div class="row g-3 align-items-end">
            <div class="col-md-3">
              <label class="form-label small fw-semibold text-muted mb-1">Classe / Promotion</label>
              <select
                class="form-select border-0 shadow-sm bg-white"
                v-model="classeCodeAffiche"
                @change="loadStudents"
                disabled
              >
                <option :value="classeCodeAffiche">{{ classeCodeAffiche }}</option>
              </select>
            </div>

            <div class="col-md-3">
              <label class="form-label small fw-semibold text-muted mb-1"
                >Matière (Pondération)</label
              >
              <select
                class="form-select border-0 shadow-sm"
                v-model="session.matiere"
                :disabled="!session.classe"
              >
                <option value="">Sélectionner l'élément...</option>
                <option v-for="m in mockMatieres" :key="m.nom" :value="m">
                  {{ m.nom }} (Coef. {{ m.coef }})
                </option>
              </select>
            </div>

            <div class="col-md-3">
              <label class="form-label small fw-semibold text-muted mb-1"
                >Nature de l'Évaluation</label
              >
              <select
                class="form-select border-0 shadow-sm bg-white"
                :value="props.typeEvaluation"
                disabled
              >
                <option value="CC">Contrôle Continu (CC)</option>
                <option value="SESSION_ORDINAIRE">Examen Terminal (Partiel)</option>
                <option value="RATTRAPAGE">Session de Rattrapage</option>
              </select>
            </div>

            <div class="col-md-3">
              <button
                class="btn btn-primary w-100 border-0 shadow-sm py-2"
                :disabled="!session.matiere || mockStudentsList.length === 0"
                @click="saveAllNotes"
              >
                <i class="bi bi-cloud-arrow-up-fill me-1"></i> Publier le Procès-Verbal
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="col-12 mb-4" v-if="session.matiere && mockStudentsList.length > 0">
      <div class="row g-3">
        <div class="col-md-4">
          <div class="card border-0 shadow-sm p-3 bg-white rounded-4 text-center">
            <span class="text-muted small fw-semibold text-uppercase">Moyenne de Session</span>
            <h4 class="fw-bold mt-1 mb-0 text-primary">{{ statsSession.moyenne }} / 20</h4>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card border-0 shadow-sm p-3 bg-white rounded-4 text-center">
            <span class="text-muted small fw-semibold text-uppercase">Note la plus haute</span>
            <h4 class="fw-bold mt-1 mb-0 text-success">{{ statsSession.max }} / 20</h4>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card border-0 shadow-sm p-3 bg-white rounded-4 text-center">
            <span class="text-muted small fw-semibold text-uppercase">
              Sous le seuil éliminatoire (&lt;{{ session.matiere.seuil }})
            </span>
            <h4 class="fw-bold mt-1 mb-0 text-danger">{{ statsSession.alertes }} étudiant(s)</h4>
          </div>
        </div>
      </div>
    </div>

    <div class="col-12">
      <div class="card border-0 shadow-sm rounded-4 overflow-hidden bg-white">
        <div class="card-header bg-white border-0 pt-4 px-4 pb-2">
          <h5 class="fw-bold text-dark mb-0">
            <i class="bi bi-people-fill text-primary me-2"></i>Liste Nominative des Apprenants
          </h5>
        </div>

        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead class="bg-light">
                <tr>
                  <th class="ps-4 py-3" style="width: 15%">Matricule</th>
                  <th style="width: 30%">Nom & Prénom</th>
                  <th class="text-center" style="width: 20%">Note Numérique (/20)</th>
                  <th style="width: 35%" class="pe-4">Observations / Appréciations du jury</th>
                </tr>
              </thead>

              <tbody>
                <tr
                  v-for="student in mockStudentsList"
                  :key="student.matricule"
                  class="transition-all"
                >
                  <td class="ps-4">
                    <span class="badge bg-light text-dark border font-monospace">{{
                      student.matricule
                    }}</span>
                  </td>
                  <td class="fw-bold text-dark">{{ student.nom }}</td>

                  <td class="text-center">
                    <div
                      class="input-group input-group-sm mx-auto shadow-sm rounded"
                      style="width: 110px"
                    >
                      <input
                        type="number"
                        class="form-control text-center border-0 fw-bold"
                        v-model.number="student.note"
                        min="0"
                        max="20"
                        step="0.25"
                        placeholder="--"
                        :class="
                          isNoteEliminatoire(student.note)
                            ? 'text-danger bg-danger bg-opacity-10'
                            : 'text-dark bg-light'
                        "
                      />
                      <span
                        class="input-group-text bg-light border-0 text-muted"
                        style="font-size: 11px"
                        >/20</span
                      >
                    </div>
                  </td>

                  <td class="pe-4">
                    <input
                      type="text"
                      class="form-control form-control-sm border-0 bg-light"
                      placeholder="Ex: Excellent travail, à encourager..."
                      v-model="student.appreciation"
                    />
                  </td>
                </tr>

                <tr v-if="mockStudentsList.length === 0">
                  <td colspan="4" class="text-center py-5">
                    <h6 class="text-muted fw-bold">Chargement du registre en cours...</h6>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
// 1. Importer le store pour pouvoir rechercher la correspondance de l'UUID
import { useClasseStore } from '@/modules/structure-academique/classe/store';

const classeStore = useClasseStore();

// Définition des props héritées de l'URL via Notes.vue
const props = defineProps({
  classeId: {
    type: String,
    required: true,
  },
  semestre: {
    type: String,
    required: true,
  },
  typeEvaluation: {
    type: String,
    required: true,
  },
});

// Configuration de la session de notation
const session = ref({
  classe: '',
  matiere: '',
  typeDevoir: '',
});

// Traduction sémantique du code de l'URL vers un affichage utilisateur
const evaluationLabel = computed(() => {
  switch (props.typeEvaluation) {
    case 'CC':
      return 'Contrôle Continu (CC)';
    case 'SESSION_ORDINAIRE':
      return 'Examen Terminal (Partiel)';
    case 'RATTRAPAGE':
      return 'Session de Rattrapage';
    default:
      return props.typeEvaluation;
  }
});

const mockMatieres = ref([
  { nom: 'Conception orientée objet & Patterns', coef: 2, seuil: 8 },
  { nom: 'Frameworks Modernes (Vue.js 3 & Node)', coef: 2, seuil: 7 },
  { nom: 'Deep Learning & Vision par ordinateur', coef: 3, seuil: 10 },
]);

const mockStudentsList = ref([]);

// Cycle de vie : Initialisation automatique par rapport aux paramètres de la route
onMounted(() => {
  // Optionnel : Idéalement, ici tu feras un fetch sur ton Store pour récupérer le nom réel de la classe via son ID
  session.value.classe = props.classeId;
  session.value.typeDevoir = evaluationLabel.value;

  // Chargement immédiat du registre d'étudiants
  loadStudents();
});

const loadStudents = () => {
  // Simulation de chargement des étudiants de la classe ciblée
  mockStudentsList.value = [
    { matricule: '2026-M101', nom: 'Ndiaye Fatou', note: null, appreciation: '' },
    { matricule: '2026-M102', nom: 'Camara Ibrahima', note: null, appreciation: '' },
    { matricule: '2026-M103', nom: 'Sow Amadou', note: null, appreciation: '' },
    { matricule: '2026-M104', nom: 'Diallo Diariou', note: null, appreciation: '' },
  ];
};

const isNoteEliminatoire = (note) => {
  if (note === null || !session.value.matiere) return false;
  return note < session.value.matiere.seuil;
};

const statsSession = computed(() => {
  const notesValides = mockStudentsList.value
    .filter((s) => s.note !== null && typeof s.note === 'number')
    .map((s) => s.note);

  if (notesValides.length === 0) {
    return { moyenne: '0.00', max: '0.00', min: '0.00', alertes: 0 };
  }

  const total = notesValides.reduce((acc, curr) => acc + curr, 0);
  const moy = total / notesValides.length;
  const max = Math.max(...notesValides);
  const alertes = mockStudentsList.value.filter(
    (s) => s.note !== null && isNoteEliminatoire(s.note)
  ).length;

  return {
    moyenne: moy.toFixed(2),
    max: max.toFixed(2),
    alertes: alertes,
  };
});

const classeCodeAffiche = computed(() => {
  const listeClasses = Array.isArray(classeStore.classes) ? classeStore.classes : [];

  // On cherche la classe dont l'id (ou classe_id) correspond à l'UUID reçu dans props.classeId
  const classeTrouvee = listeClasses.find(
    (c) => String(c.id || c.classe_id) === String(props.classeId)
  );

  // Si on la trouve, on affiche son code lisible. Sinon, on affiche l'UUID en attendant le chargement
  return classeTrouvee ? classeTrouvee.classe_code || classeTrouvee.code : props.classeId;
});

const saveAllNotes = () => {
  alert(
    `Validation du PV pour la classe [${session.value.classe}] - ${session.value.matiere.nom}.\nType : ${evaluationLabel.value}\nMoyenne calculée : ${statsSession.value.moyenne}/20.`
  );
};
</script>

<style scoped>
/* Teintes et alertes Flat UI */
.bg-soft-danger {
  background-color: rgba(220, 53, 69, 0.08) !important;
}

.table th {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: #6c757d;
  border: none;
}

.table tbody tr {
  border-bottom: 1px solid #f8f9fa;
  transition: background 0.2s;
}
.table tbody tr:hover {
  background-color: #fcfdfe !important;
}

/* Alignement avec la ligne graphique unifiée de ton ERP (Flat, pas de rayons exagérés) */
.rounded-4 {
  border-radius: 0.2rem !important;
}
.form-select,
.form-control {
  font-size: 0.85rem;
}
.transition-all {
  transition: all 0.2s ease;
}
.breadcrumb-item + .breadcrumb-item::before {
  content: var(--bs-breadcrumb-divider);
}
</style>
