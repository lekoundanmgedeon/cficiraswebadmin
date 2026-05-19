<template>
  <div class="ue-configuration-container">
    <!-- En-tête de page -->
    <div class="row mb-4">
      <div class="col-12 d-flex justify-content-between align-items-center flex-wrap gap-3">
        <div>
          <h3 class="fw-bold text-dark mb-1">Configuration des Unités d'Enseignement</h3>
          <p class="text-muted text-sm mb-0">
            Affectation des matières, répartition des volumes horaires et attribution des
            coefficients ECTS par semestre.
          </p>
        </div>
        <div>
          <button
            class="btn btn-primary text-sm px-3 py-2"
            :disabled="!selectedSemestre"
            @click="ouvrirModalAjoutUE"
          >
            <i class="mdi mdi-plus-box me-1"></i> Rattaché une UE au {{ selectedSemestre?.code }}
          </button>
        </div>
      </div>
    </div>

    <!-- Layout Double Colonne (Master-Detail) -->
    <div class="row g-4">
      <!-- COLONNE GAUCHE : Sélecteur de Semestre -->
      <div class="col-xl-4 col-lg-5">
        <div class="card border-0 shadow-sm bg-white rounded-4 p-3">
          <div class="text-xs text-secondary text-uppercase fw-bold mb-3 tracking-wider px-2">
            Choisir un semestre
          </div>

          <div class="d-flex flex-column gap-2">
            <button
              v-for="sem in semestres"
              :key="sem.id"
              class="btn text-start p-3 rounded border-0 position-relative semestre-selector-card"
              :class="
                selectedSemestreId === sem.id
                  ? 'active-semestre bg-soft-primary'
                  : 'bg-light-subtle'
              "
              @click="selectSemestre(sem)"
            >
              <div class="d-flex justify-content-between align-items-center mb-1">
                <span
                  class="badge font-monospace fw-bold"
                  :class="
                    selectedSemestreId === sem.id
                      ? 'bg-primary text-white'
                      : 'bg-secondary-subtle text-secondary'
                  "
                >
                  {{ sem.code }}
                </span>
                <span class="text-xs text-muted font-monospace">{{ sem.periode }}</span>
              </div>
              <div class="fw-bold text-dark text-truncate">{{ sem.filiere }}</div>
              <div class="text-xs text-muted mt-1">{{ sem.niveau }}</div>
            </button>
          </div>
        </div>
      </div>

      <!-- COLONNE DROITE : Gestion des UE du semestre sélectionné -->
      <div class="col-xl-8 col-lg-7">
        <div v-if="selectedSemestre" class="card border-0 shadow-sm bg-white rounded-4 p-4">
          <!-- Infos du Semestre Actif & Synthèse de charge -->
          <div
            class="d-flex justify-content-between align-items-center border-bottom pb-3 mb-4 flex-wrap gap-2"
          >
            <div>
              <h5 class="fw-bold text-dark mb-1">
                Unités d'Enseignement affectées — {{ selectedSemestre.code }}
              </h5>
              <span class="text-xs text-muted font-monospace"
                >{{ selectedSemestre.niveau }} • {{ selectedSemestre.filiere }}</span
              >
            </div>

            <!-- Compteurs d'analyse de maquette -->
            <div class="d-flex gap-3 bg-light px-3 py-2 rounded border">
              <div class="text-center">
                <div class="text-xs text-muted mb-0">Total Crédits</div>
                <strong class="font-monospace text-primary fs-6">{{ totalCredits }} ECTS</strong>
              </div>
              <div class="border-end my-1"></div>
              <div class="text-center">
                <div class="text-xs text-muted mb-0">Volume Horaire</div>
                <strong class="font-monospace text-dark fs-6">{{ totalHeures }} H</strong>
              </div>
            </div>
          </div>

          <!-- Liste des UE associées -->
          <div v-if="uesFiltrees.length > 0" class="table-responsive">
            <table class="table align-middle text-center mb-0">
              <thead class="table-light-header text-secondary">
                <tr>
                  <th class="text-start ps-3" style="width: 15%">Code UE</th>
                  <th class="text-start" style="width: 40%">Intitulé de la matière</th>
                  <th style="width: 15%">Crédits (ECTS)</th>
                  <th style="width: 15%">Vol. Horaire</th>
                  <th class="text-end pe-3" style="width: 15%">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="ue in uesFiltrees" :key="ue.id" class="ue-row">
                  <!-- Code UE -->
                  <td class="text-start ps-3 font-monospace fw-bold text-secondary">
                    {{ ue.code }}
                  </td>

                  <!-- Intitule -->
                  <td class="text-start">
                    <div class="fw-bold text-dark">{{ ue.libelle }}</div>
                    <small class="text-xs text-muted">Type : {{ ue.type }}</small>
                  </td>

                  <!-- Crédits -->
                  <td>
                    <span
                      class="badge bg-light text-dark border px-2.5 py-1.5 font-monospace fw-bold"
                    >
                      {{ ue.credits }}
                    </span>
                  </td>

                  <!-- Volume Horaire -->
                  <td class="font-monospace text-dark">{{ ue.heures }} h</td>

                  <!-- Actions contextuelles -->
                  <td class="text-end pe-3">
                    <div class="d-flex justify-content-end gap-1">
                      <button
                        class="btn btn-icon btn-light border text-secondary"
                        title="Modifier les paramètres"
                        @click="modifierUE(ue)"
                      >
                        <i class="mdi mdi-pencil-outline"></i>
                      </button>
                      <button
                        class="btn btn-icon btn-light-danger border text-danger"
                        title="Détacher du semestre"
                        @click="retirerUE(ue.id)"
                      >
                        <i class="mdi mdi-link-variant-off"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- État Vide : Le semestre n'a aucune UE rattachée -->
          <div v-else class="text-center py-5 text-muted">
            <i class="mdi mdi-layers-triple-outline fs-1 text-secondary-subtle d-block mb-2"></i>
            <h6 class="fw-bold text-secondary">Aucune UE rattachée</h6>
            <p class="text-muted text-sm mb-0">
              Ce semestre est actuellement vide. Utilisez le bouton d'ajout pour y associer des
              enseignements.
            </p>
          </div>
        </div>

        <!-- Aucun semestre sélectionné au premier chargement -->
        <div
          v-else
          class="card border-0 shadow-sm bg-white rounded-4 p-5 text-center text-muted h-100 d-flex flex-column justify-content-center align-items-center"
        >
          <i class="mdi mdi-arrow-left-bold-box-outline fs-1 text-primary mb-2"></i>
          <h5 class="fw-bold text-secondary">Sélectionnez un semestre</h5>
          <p class="text-muted text-sm max-w-xs">
            Choisissez un semestre dans le panneau de gauche pour configurer ses maquettes de cours
            et ses unités d'enseignements.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

/* =====================
   Données d'États
===================== */
const semestres = ref([]);
const tuesRepository = ref([]); // Toutes les UE indexées en base de données
const selectedSemestreId = ref(null);
const selectedSemestre = ref(null);

/* =====================
   Propriétés calculées (Calculs de totaux de maquettes)
===================== */
const uesFiltrees = computed(() => {
  if (!selectedSemestreId.value) return [];
  return tuesRepository.value.filter((ue) => ue.semestreId === selectedSemestreId.value);
});

const totalCredits = computed(() => {
  return uesFiltrees.value.reduce((sum, ue) => sum + ue.credits, 0);
});

const totalHeures = computed(() => {
  return uesFiltrees.value.reduce((sum, ue) => sum + ue.heures, 0);
});

/* =====================
   Méthodes de gestion
===================== */
const selectSemestre = (semestre) => {
  selectedSemestreId.value = semestre.id;
  selectedSemestre.value = semestre;
};

const retirerUE = (ueId) => {
  // Logique de détachement (Fictif ici)
  tuesRepository.value = tuesRepository.value.filter((ue) => ue.id !== ueId);
};

const initDataMock = () => {
  // Liste des semestres disponibles
  semestres.value = [
    {
      id: 1,
      code: 'SEM-1',
      niveau: 'Licence 1 (Tronc Commun)',
      filiere: 'Informatique',
      periode: '2025-2026',
    },
    {
      id: 2,
      code: 'SEM-2',
      niveau: 'Licence 1 (Tronc Commun)',
      filiere: 'Informatique',
      periode: '2025-2026',
    },
    {
      id: 3,
      code: 'SEM-1',
      niveau: 'Master 1 Spécialisé',
      filiere: 'Data Science',
      periode: '2025-2026',
    },
  ];

  // Catalogue complet des UEs rattachées
  tuesRepository.value = [
    {
      id: 101,
      semestreId: 1,
      code: 'UE-MATH1',
      libelle: 'Mathématiques Algébriques',
      credits: 12,
      heures: 60,
      type: 'Fondamental',
    },
    {
      id: 102,
      semestreId: 1,
      code: 'UE-INF1',
      libelle: 'Informatique Générale & Matérielle',
      credits: 12,
      heures: 72,
      type: 'Fondamental',
    },
    {
      id: 103,
      semestreId: 1,
      code: 'UE-ANG1',
      libelle: 'Anglais Technique',
      credits: 6,
      heures: 30,
      type: 'Transversal',
    },

    {
      id: 201,
      semestreId: 2,
      code: 'UE-ALGO2',
      libelle: 'Algorithmique Procédurale',
      credits: 12,
      heures: 64,
      type: 'Fondamental',
    },
    {
      id: 202,
      semestreId: 2,
      code: 'UE-SGBD2',
      libelle: 'Bases de Données Relationnelles',
      credits: 10,
      heures: 48,
      type: 'Optionnel',
    },

    {
      id: 301,
      semestreId: 3,
      code: 'UE-STAT1',
      libelle: 'Statistiques Inférentielles',
      credits: 15,
      heures: 90,
      type: 'Fondamental',
    },
  ];

  // Sélection par défaut du premier élément pour l'UX
  if (semestres.value.length > 0) {
    selectSemestre(semestres.value[0]);
  }
};

onMounted(() => {
  initDataMock();
});
</script>

<style scoped>
/* Teintes et structures standardisées */
.bg-soft-primary {
  background-color: rgba(0, 123, 255, 0.06);
}
.bg-light-subtle {
  background-color: #f8f9fa;
}

.text-sm {
  font-size: 13px !important;
}
.text-xs {
  font-size: 11.5px !important;
}
.tracking-wider {
  letter-spacing: 0.8px;
}

/* Carte sélecteur de gauche */
.semestre-selector-card {
  transition: all 0.15s ease-in-out;
  border: 1px solid transparent !important;
}
.semestre-selector-card:hover {
  background-color: rgba(0, 123, 255, 0.02) !important;
  cursor: pointer;
}
.active-semestre {
  border-left: 4px solid #007bff !important;
}

/* En-tête des tableaux */
.table-light-header th {
  font-size: 11.5px;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  background-color: #f8f9fa;
  font-weight: 700;
  border: none;
}

/* Cellules du tableau des UE */
.table tbody tr td {
  padding-top: 12px !important;
  padding-bottom: 12px !important;
}
.ue-row {
  border-bottom: 1px solid #f1f3f5;
  transition: background-color 0.1s ease;
}
.ue-row:hover {
  background-color: rgba(0, 0, 0, 0.005);
}

/* Boutons d'actions carrés et discrets */
.btn-icon {
  width: 32px;
  height: 32px;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px !important;
}
.btn-light-danger {
  background-color: rgba(220, 53, 69, 0.03);
}
.btn-light-danger:hover {
  background-color: #dc3545;
  color: #fff !important;
}

.max-w-xs {
  max-width: 280px;
}
.rounded-4 {
  border-radius: 0.2rem !important;
}
</style>
