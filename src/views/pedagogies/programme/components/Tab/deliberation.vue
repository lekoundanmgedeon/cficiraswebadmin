<template>
  <div class="row">
    <!-- Header de la section -->
    <div class="col-12 mb-4">
      <h3 class="fw-bold mb-1">Délibérations & Jury du Semestre</h3>
      <p class="text-muted small mb-0">
        <i class="bi bi-shield-check me-1"></i>
        Consultez le Procès-Verbal global, validez l'attribution des ECTS et clôturez officiellement
        la session.
      </p>
    </div>

    <!-- Outils de filtrage et d'action du Jury -->
    <div class="col-12 mb-4">
      <div class="card border-0 shadow-sm bg-light rounded-4">
        <div class="card-body p-3">
          <div class="row g-3 align-items-center">
            <!-- Sélection de la promotion -->
            <div class="col-md-3">
              <select
                class="form-select border-0 shadow-sm"
                v-model="selectedClasse"
                @change="processDeliberation"
              >
                <option value="">Sélectionner une promotion...</option>
                <option v-for="c in mockClasses" :key="c" :value="c">{{ c }}</option>
              </select>
            </div>
            <!-- Sélection du semestre -->
            <div class="col-md-3">
              <select
                class="form-select border-0 shadow-sm"
                v-model="selectedSemestre"
                :disabled="!selectedClasse"
              >
                <option value="Semestre 1">Semestre 1</option>
                <option value="Semestre 2">Semestre 2</option>
              </select>
            </div>
            <!-- Actions de clôture -->
            <div class="col-md-6 text-md-end">
              <button
                class="btn btn-warning border-0 shadow-sm px-3 py-2 me-2 text-dark fw-bold"
                :disabled="!selectedClasse"
                @click="cloturerSemestre"
              >
                <i class="bi bi-lock-fill me-1"></i> Clôturer & Verrouiller le Semestre
              </button>
              <button
                class="btn btn-white btn-sm border shadow-sm py-2"
                :disabled="!selectedClasse"
                @click="processDeliberation"
              >
                <i class="bi bi-arrow-clockwise"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Statistiques globales de réussite du Jury -->
    <div class="col-12 mb-4" v-if="selectedClasse && studentsResults.length > 0">
      <div class="row g-3">
        <div class="col-md-3">
          <div class="card border-0 shadow-sm p-3 bg-white rounded-4 text-center">
            <span class="text-muted small fw-semibold text-uppercase"
              >Taux d'Admission Directe</span
            >
            <h4 class="fw-bold mt-1 mb-0 text-success">{{ statsJury.tauxReussite }}%</h4>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card border-0 shadow-sm p-3 bg-white rounded-4 text-center">
            <span class="text-muted small fw-semibold text-uppercase">Moyenne de Promotion</span>
            <h4 class="fw-bold mt-1 mb-0 text-primary">{{ statsJury.moyenneGenerale }} / 20</h4>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card border-0 shadow-sm p-3 bg-white rounded-4 text-center">
            <span class="text-muted small fw-semibold text-uppercase"
              >Convoqués aux Rattrapages</span
            >
            <h4 class="fw-bold mt-1 mb-0 text-warning">{{ statsJury.rattrapages }} étudiant(s)</h4>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card border-0 shadow-sm p-3 bg-white rounded-4 text-center">
            <span class="text-muted small fw-semibold text-uppercase">Major de Promotion</span>
            <h5 class="fw-bold mt-2 mb-0 text-dark text-truncate">{{ statsJury.major }}</h5>
          </div>
        </div>
      </div>
    </div>

    <!-- Tableau du Procès-Verbal de Délibération (PV) -->
    <div class="col-12">
      <div class="card border-0 shadow-sm rounded-4 overflow-hidden bg-white">
        <div class="card-header bg-white border-0 pt-4 px-4 pb-2">
          <h5 class="fw-bold text-dark mb-0">
            <i class="bi bi-table text-warning me-2"></i>Procès-Verbal de Délibération Officiel
          </h5>
        </div>

        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0 text-center">
              <thead class="bg-light text-secondary small uppercase-th">
                <tr>
                  <th class="ps-4 py-3 text-start" style="width: 25%">Étudiant</th>
                  <th>Matière 1 (Vue/Node)</th>
                  <th>Matière 2 (OOP)</th>
                  <th>Matière 3 (Deep L.)</th>
                  <th class="fw-bold text-dark">Moy. Générale</th>
                  <th>Crédits ECTS</th>
                  <th class="text-end pe-4" style="width: 15%">Décision du Jury</th>
                </tr>
              </thead>

              <tbody>
                <tr
                  v-for="student in studentsResults"
                  :key="student.matricule"
                  class="transition-all"
                >
                  <!-- Identité de l'apprenant -->
                  <td class="ps-4 text-start">
                    <div class="fw-bold text-dark">{{ student.nom }}</div>
                    <small class="text-muted font-monospace">{{ student.matricule }}</small>
                  </td>

                  <!-- Notes par Matières -->
                  <td :class="student.n1 < 7 ? 'text-danger fw-bold bg-soft-danger' : ''">
                    {{ student.n1 }}
                  </td>
                  <td :class="student.n2 < 8 ? 'text-danger fw-bold bg-soft-danger' : ''">
                    {{ student.n2 }}
                  </td>
                  <td :class="student.n3 < 10 ? 'text-danger fw-bold bg-soft-danger' : ''">
                    {{ student.n3 }}
                  </td>

                  <!-- Moyenne Pondérée Calculée -->
                  <td class="fw-bold text-primary bg-light">
                    {{ student.moyenne }}
                  </td>

                  <!-- ECTS Capitalisés -->
                  <td>
                    <span
                      class="badge rounded-pill fw-bold"
                      :class="
                        student.ects === 14
                          ? 'bg-soft-success text-success'
                          : 'bg-soft-secondary text-secondary'
                      "
                    >
                      {{ student.ects }} / 14
                    </span>
                  </td>

                  <!-- Décision Statutaire Automatique -->
                  <td class="text-end pe-4">
                    <span
                      class="badge px-3 py-1 fw-bold rounded-pill"
                      :class="getStatusClass(student.decision)"
                    >
                      {{ student.decision }}
                    </span>
                  </td>
                </tr>

                <!-- Hors contexte -->
                <tr v-if="studentsResults.length === 0">
                  <td colspan="7" class="text-center py-5">
                    <h6 class="text-muted fw-bold">Aucun PV généré</h6>
                    <p class="small text-muted mb-0">
                      Veuillez cibler une promotion pour lancer les calculs de pondération du jury.
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

// États
const selectedClasse = ref('');
const selectedSemestre = ref('Semestre 1');
const studentsResults = ref([]);

const mockClasses = ref(['Master 1 Info', 'Master 2 Info', 'Licence 3 Management']);

// Modèle de calcul automatique basé sur les coefficients passés (Matière 1 coef 2, Matière 2 coef 2, Matière 3 coef 3. Total Coef = 7)
const processDeliberation = () => {
  if (!selectedClasse.value) {
    studentsResults.value = [];
    return;
  }

  // Base brute simulée provenant de l'étape de saisie précédente
  const rawNotes = [
    { matricule: '2026-M101', nom: 'Ndiaye Fatou', n1: 14.5, n2: 12, n3: 15 },
    { matricule: '2026-M102', nom: 'Camara Ibrahima', n1: 8, n2: 11, n3: 9.5 }, // Échoue à M3 (seuil éliminatoire à 10)
    { matricule: '2026-M103', nom: 'Sow Amadou', n1: 16, n2: 14.5, n3: 13.5 },
    { matricule: '2026-M104', nom: 'Diallo Diariou', n1: 11, n2: 7.5, n3: 12 }, // Note éliminatoire à M2 (< 8)
  ];

  // Application dynamique des règles de validation de l'ERP
  studentsResults.value = rawNotes.map((student) => {
    // Calcul de la moyenne pondérée
    const totalPoints = student.n1 * 2 + student.n2 * 2 + student.n3 * 3;
    const moyenneCalculee = (totalPoints / 7).toFixed(2);

    // Vérification des barrières éliminatoires définies dans la maquette
    const aNoteEliminatoire = student.n1 < 7 || student.n2 < 8 || student.n3 < 10;

    let decision = 'Admis';
    let ectsAttribues = 14; // Total ECTS max du semestre d'exemple

    if (moyenneCalculee < 10) {
      decision = 'Rattrapage';
      ectsAttribues = 0; // Bloqué en attente de la seconde session
    } else if (aNoteEliminatoire) {
      decision = 'Ajourné (Blâmé)'; // Moyenne générale suffisante mais bloqué par une note éliminatoire
      ectsAttribues = 6; // Ne valide que les UE saines
    }

    return {
      ...student,
      moyenne: parseFloat(moyenneCalculee),
      ects: ectsAttribues,
      decision: decision,
    };
  });
};

// Analyse statistique globale de la table calculée
const statsJury = computed(() => {
  if (studentsResults.value.length === 0) return {};

  const admisCount = studentsResults.value.filter((s) => s.decision === 'Admis').length;
  const taux = Math.round((admisCount / studentsResults.value.length) * 100);

  const totalMoy = studentsResults.value.reduce((acc, curr) => acc + curr.moyenne, 0);
  const moyPromo = (totalMoy / studentsResults.value.length).toFixed(2);

  const rattrapages = studentsResults.value.filter((s) => s.decision !== 'Admis').length;

  // Recherche du Major de promo
  const majorStudent = [...studentsResults.value].sort((a, b) => b.moyenne - a.moyenne)[0];

  return {
    tauxReussite: taux,
    moyenneGenerale: moyPromo,
    rattrapages: rattrapages,
    major: `${majorStudent.nom} (${majorStudent.moyenne}/20)`,
  };
});

// Styles CSS dynamiques des badges de décisions
const getStatusClass = (decision) => {
  if (decision === 'Admis') return 'bg-soft-success text-success';
  if (decision === 'Rattrapage') return 'bg-soft-warning text-warning';
  return 'bg-soft-danger text-danger'; // Cas Ajourné / Note éliminatoire
};

const cloturerSemestre = () => {
  alert(
    `[CLÔTURE DU JURY] Le ${selectedSemestre.value} de la promotion [${selectedClasse.value}] est officiellement verrouillé.\nLes moyennes sont figées et les bulletins sont prêts pour impression.`
  );
};
</script>

<style scoped>
/* Couleurs douces de l'identité ERP */
.bg-soft-success {
  background-color: rgba(40, 167, 69, 0.12);
  color: #28a745;
}
.bg-soft-warning {
  background-color: rgba(255, 193, 7, 0.12);
  color: #ffc107;
}
.bg-soft-danger {
  background-color: rgba(220, 53, 69, 0.08);
  color: #dc3545;
}
.bg-soft-secondary {
  background-color: rgba(108, 117, 125, 0.1);
  color: #6c757d;
}

.uppercase-th th {
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

/* Identité Flat UI rigoureuse */
.rounded-4 {
  border-radius: 0.2rem !important;
}
.form-select {
  font-size: 0.85rem;
}
.btn-white {
  background: #ffffff;
  color: #212529;
}
.transition-all {
  transition: all 0.2s ease;
}
</style>
