<template>
  <div class="row">
    <!-- Header de la section -->
    <div class="col-12 mb-4">
      <h3 class="fw-bold mb-1">Suivi individuel des Crédits ECTS</h3>
      <p class="text-muted small mb-0">
        <i class="bi bi-award-fill me-1"></i>
        Pilotez les portefeuilles de crédits des apprenants, attribuez les équivalences extérieures
        et validez la capitalisation.
      </p>
    </div>

    <!-- Sélection et Recherche -->
    <div class="col-12 mb-4">
      <div class="card border-0 shadow-sm bg-light rounded-4">
        <div class="card-body p-3">
          <div class="row g-3 align-items-center">
            <div class="col-md-4">
              <label class="form-label small fw-semibold text-muted mb-1">Promotion</label>
              <select
                class="form-select border-0 shadow-sm"
                v-model="selectedClasse"
                @change="loadStudentsCredits"
              >
                <option value="">Choisir une promotion...</option>
                <option v-for="c in mockClasses" :key="c" :value="c">{{ c }}</option>
              </select>
            </div>
            <div class="col-md-5">
              <label class="form-label small fw-semibold text-muted mb-1"
                >Rechercher un apprenant</label
              >
              <div class="input-group input-group-sm bg-white rounded shadow-sm border-0">
                <span class="input-group-text bg-white border-0"
                  ><i class="bi bi-search text-muted"></i
                ></span>
                <input
                  type="text"
                  class="form-control border-0 py-2"
                  placeholder="Nom ou matricule..."
                  v-model="searchQuery"
                  :disabled="!selectedClasse"
                />
              </div>
            </div>
            <div class="col-md-3 text-md-end pt-3">
              <span class="text-xs text-muted fw-bold uppercase d-block" v-if="selectedClasse">
                Objectif Annuel : 60 ECTS
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Liste des portefeuilles ECTS de la classe -->
    <div class="col-12">
      <div class="card border-0 shadow-sm rounded-4 overflow-hidden bg-white">
        <div
          class="card-header bg-white border-0 pt-4 px-4 pb-2 d-flex justify-content-between align-items-center"
        >
          <h5 class="fw-bold text-dark mb-0">
            <i class="bi bi-wallet2 text-primary me-2"></i>Grand Registre des Crédits Capitalisés
          </h5>
          <button
            class="btn btn-outline-primary btn-xs border shadow-sm"
            :disabled="!selectedClasse"
            @click="openEquivalenceModal"
          >
            <i class="bi bi-plus-circle me-1"></i> Octroyer une Équivalence
          </button>
        </div>

        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0 text-center">
              <thead class="bg-light text-secondary small">
                <tr>
                  <th class="ps-4 py-3 text-start" style="width: 25%">Étudiant</th>
                  <th>Crédits Semestre 1</th>
                  <th>Crédits Semestre 2</th>
                  <th>Équivalences Accordées</th>
                  <th class="fw-bold text-dark">Total Capitalisé</th>
                  <th style="width: 20%">Progression Cycle</th>
                  <th class="text-end pe-4">Statut Annuel</th>
                </tr>
              </thead>

              <tbody>
                <tr v-for="student in filteredStudents" :key="student.matricule">
                  <!-- Profil -->
                  <td class="ps-4 text-start">
                    <div class="fw-bold text-dark">{{ student.nom }}</div>
                    <small class="text-muted font-monospace text-xs">{{ student.matricule }}</small>
                  </td>

                  <!-- S1 & S2 -->
                  <td>
                    <span class="fw-semibold">{{ student.ectsS1 }} / 30</span>
                  </td>
                  <td>
                    <span class="fw-semibold">{{ student.ectsS2 }} / 30</span>
                  </td>

                  <!-- Équivalences (ex: transfert d'une autre école) -->
                  <td>
                    <span
                      v-if="student.equivalences > 0"
                      class="badge bg-soft-warning text-warning fw-bold"
                    >
                      +{{ student.equivalences }} ECTS
                    </span>
                    <span v-else class="text-muted small">-</span>
                  </td>

                  <!-- Total -->
                  <td class="fw-bold text-primary bg-light">
                    {{ student.ectsS1 + student.ectsS2 + student.equivalences }} ECTS
                  </td>

                  <!-- Jauge visuelle de progression vers le Diplôme -->
                  <td>
                    <div class="d-flex align-items-center justify-content-center">
                      <div
                        class="progress w-100 me-2"
                        style="height: 6px; background-color: #f0f2f5"
                      >
                        <div
                          class="progress-bar bg-success rounded-pill"
                          role="progressbar"
                          :style="{ width: (calculateTotal(student) / 120) * 100 + '%' }"
                        ></div>
                      </div>
                      <span class="text-xs font-monospace text-muted"
                        >{{ calculateTotal(student) }}/120</span
                      >
                    </div>
                  </td>

                  <!-- État d'avancement -->
                  <td class="text-end pe-4">
                    <span
                      class="badge px-3 py-1 rounded-pill fw-bold"
                      :class="getStatusClass(calculateTotal(student))"
                    >
                      {{ getStatusLabel(calculateTotal(student)) }}
                    </span>
                  </td>
                </tr>

                <!-- Aucun filtre/données -->
                <tr v-if="filteredStudents.length === 0">
                  <td colspan="7" class="text-center py-5 text-muted">
                    <p class="small mb-0">
                      Aucun historique de crédit disponible pour cette sélection.
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

const selectedClasse = ref('');
const searchQuery = ref('');

const mockClasses = ref(['Master 1 Info', 'Master 2 Info', 'Licence 3 Management']);
const studentsCreditsList = ref([]);

const loadStudentsCredits = () => {
  if (!selectedClasse.value) {
    studentsCreditsList.value = [];
    return;
  }
  // Chargement des données consolidées de l'année
  studentsCreditsList.value = [
    { matricule: '2026-M101', nom: 'Ndiaye Fatou', ectsS1: 30, ectsS2: 30, equivalences: 0 },
    { matricule: '2026-M102', nom: 'Camara Ibrahima', ectsS1: 24, ectsS2: 18, equivalences: 0 },
    { matricule: '2026-M103', nom: 'Sow Amadou', ectsS1: 30, ectsS2: 30, equivalences: 12 }, // Venu d'une autre université avec acquis
    { matricule: '2026-M104', nom: 'Diallo Diariou', ectsS1: 30, ectsS2: 26, equivalences: 0 },
  ];
};

const calculateTotal = (student) => {
  return student.ectsS1 + student.ectsS2 + student.equivalences;
};

// Filtre dynamique de recherche
const filteredStudents = computed(() => {
  return studentsCreditsList.value.filter(
    (s) =>
      s.nom.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      s.matricule.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

// Logique d'affichage des badges statuts
const getStatusLabel = (total) => {
  if (total >= 60) return 'Année Validée';
  if (total >= 48) return 'Passage Conditionnel';
  return 'Ajourné';
};

const getStatusClass = (total) => {
  if (total >= 60) return 'bg-soft-success text-success';
  if (total >= 48) return 'bg-soft-warning text-warning';
  return 'bg-soft-danger text-danger';
};

const openEquivalenceModal = () => {
  alert(
    "Ouverture du formulaire d'injection d'ECTS extérieurs (Validation des Acquis de l'Expérience ou Transfert d'Université)."
  );
};
</script>

<style scoped>
.bg-soft-success {
  background-color: rgba(40, 167, 69, 0.12);
}
.bg-soft-warning {
  background-color: rgba(255, 193, 7, 0.12);
}
.bg-soft-danger {
  background-color: rgba(220, 53, 69, 0.08);
}
.bg-soft-warning {
  background-color: rgba(255, 193, 7, 0.15);
}

.text-xs {
  font-size: 11px !important;
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
}

.rounded-4 {
  border-radius: 0.2rem !important;
}
.form-select,
.form-control {
  font-size: 0.85rem;
}
.btn-xs {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
}
</style>
