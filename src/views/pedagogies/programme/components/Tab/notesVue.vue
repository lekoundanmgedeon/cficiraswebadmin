<template>
  <div class="row">
    <!-- Header de la section -->
    <div class="col-12 mb-4">
      <h3 class="fw-bold mb-1">Saisie & Gestion des Notes</h3>
      <p class="text-muted small mb-0">
        <i class="bi bi-journal-check me-1"></i>
        Enregistrez les évaluations, saisissez les notes des étudiants et analysez les performances
        de la session.
      </p>
    </div>

    <!-- Contexte de l'évaluation & Sélection -->
    <div class="col-12 mb-4">
      <div class="card border-0 shadow-sm bg-light rounded-4">
        <div class="card-body p-3">
          <div class="row g-3 align-items-end">
            <!-- Classe -->
            <div class="col-md-3">
              <label class="form-label small fw-semibold text-muted mb-1">Classe / Promotion</label>
              <select
                class="form-select border-0 shadow-sm"
                v-model="session.classe"
                @change="loadStudents"
              >
                <option value="">Choisir une classe...</option>
                <option v-for="c in mockClasses" :key="c" :value="c">{{ c }}</option>
              </select>
            </div>
            <!-- Matière -->
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
            <!-- Type d'évaluation -->
            <div class="col-md-3">
              <label class="form-label small fw-semibold text-muted mb-1">Nature du Devoir</label>
              <select
                class="form-select border-0 shadow-sm"
                v-model="session.typeDevoir"
                :disabled="!session.matiere"
              >
                <option value="Contrôle Continu">Contrôle Continu (CC)</option>
                <option value="Examen Terminal">Examen Terminal (Partiel)</option>
                <option value="Projet Académique">Projet Spécifique</option>
              </select>
            </div>
            <!-- Bouton d'action -->
            <div class="col-md-3">
              <button
                class="btn btn-primary w-100 border-0 shadow-sm py-2"
                :disabled="!session.typeDevoir || mockStudentsList.length === 0"
                @click="saveAllNotes"
              >
                <i class="bi bi-cloud-arrow-up-fill me-1"></i> Publier le Procès-Verbal
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Statistiques dynamiques de la session de saisie -->
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
            <span class="text-muted small fw-semibold text-uppercase"
              >Sous le seuil éliminatoire (&lt;{{ session.matiere.seuil }})</span
            >
            <h4 class="fw-bold mt-1 mb-0 text-danger">{{ statsSession.alertes }} étudiant(s)</h4>
          </div>
        </div>
      </div>
    </div>

    <!-- Grille de saisie des notes -->
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
                  <!-- Matricule -->
                  <td class="ps-4">
                    <span class="badge bg-light text-dark border font-monospace">{{
                      student.matricule
                    }}</span>
                  </td>

                  <!-- Nom de l'étudiant -->
                  <td class="fw-bold text-dark">
                    {{ student.nom }}
                  </td>

                  <!-- Champ de Saisie de Note -->
                  <td class="text-center">
                    <div
                      class="input-group input-group-sm mx-auto shadow-sm rounded"
                      style="width: 110px"
                    >
                      <input
                        type="number"
                        class="form-control text-center border-0 bg-light fw-bold"
                        v-model.number="student.note"
                        min="0"
                        max="20"
                        step="0.25"
                        placeholder="--"
                        :class="
                          isNoteEliminatoire(student.note)
                            ? 'text-danger bg-soft-danger'
                            : 'text-dark'
                        "
                      />
                      <span
                        class="input-group-text bg-light border-0 text-muted"
                        style="font-size: 11px"
                        >/20</span
                      >
                    </div>
                  </td>

                  <!-- Appréciation contextuelle -->
                  <td class="pe-4">
                    <input
                      type="text"
                      class="form-control form-control-sm border-0 bg-light"
                      placeholder="Ex: Excellent travail, à encourager..."
                      v-model="student.appreciation"
                    />
                  </td>
                </tr>

                <!-- Cas hors contexte de sélection -->
                <tr v-if="mockStudentsList.length === 0">
                  <td colspan="4" class="text-center py-5">
                    <h6 class="text-muted fw-bold">En attente de ciblage pédagogique</h6>
                    <p class="small text-muted mb-0">
                      Sélectionnez une classe pour charger le registre des étudiants.
                    </p>
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
import { ref, computed } from 'vue';

// Configuration de la session de notation
const session = ref({
  classe: '',
  matiere: '',
  typeDevoir: 'Contrôle Continu',
});

// Référentiels issus des maquettes précédentes
const mockClasses = ref(['Master 1 Info', 'Master 2 Info', 'Licence 3 Management']);
const mockMatieres = ref([
  { nom: 'Conception orientée objet & Patterns', coef: 2, seuil: 8 },
  { nom: 'Frameworks Modernes (Vue.js 3 & Node)', coef: 2, seuil: 7 },
  { nom: 'Deep Learning & Vision par ordinateur', coef: 3, seuil: 10 },
]);

// Liste d'étudiants réactive (vide par défaut, chargée au choix de la classe)
const mockStudentsList = ref([]);

const loadStudents = () => {
  if (!session.value.classe) {
    mockStudentsList.value = [];
    return;
  }
  // Chargement simulé de la promotion
  mockStudentsList.value = [
    { matricule: '2026-M101', nom: 'Ndiaye Fatou', note: null, appreciation: '' },
    { matricule: '2026-M102', nom: 'Camara Ibrahima', note: null, appreciation: '' },
    { matricule: '2026-M103', nom: 'Sow Amadou', note: null, appreciation: '' },
    { matricule: '2026-M104', nom: 'Diallo Diariou', note: null, appreciation: '' },
  ];
};

// Vérification de la règle éliminatoire définie à l'étape précédente
const isNoteEliminatoire = (note) => {
  if (note === null || !session.value.matiere) return false;
  return note < session.value.matiere.seuil;
};

// Calcul en temps réel des statistiques de la session de saisie
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

  // Compter le nombre de notes sous le seuil éliminatoire défini dans le programme
  const alertes = mockStudentsList.value.filter(
    (s) => s.note !== null && isNoteEliminatoire(s.note)
  ).length;

  return {
    moyenne: moy.toFixed(2),
    max: max.toFixed(2),
    alertes: alertes,
  };
});

// Publication définitive du PV de notes
const saveAllNotes = () => {
  alert(
    `Validation du PV de notes pour la classe [${session.value.classe}] en [${session.value.matiere.nom}].\nMoyenne générale calculée : ${statsSession.value.moyenne}/20.\nSauvegarde effectuée dans le registre central.`
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
</style>
