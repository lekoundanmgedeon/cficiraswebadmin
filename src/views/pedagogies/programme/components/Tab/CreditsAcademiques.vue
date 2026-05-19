<template>
  <div class="row">
    <!-- Header de la section -->
    <div class="col-12 mb-4">
      <h3 class="fw-bold mb-1">Configuration des Crédits Académiques (ECTS)</h3>
      <p class="text-muted small mb-0">
        <i class="bi bi-shield-lock-fill me-1"></i>
        Définissez les règles de capitalisation, les plafonds de crédits par cycle et les conditions de transférabilité.
      </p>
    </div>

    <!-- Configuration des Règles Globales du Système ECTS -->
    <div class="col-md-5 mb-4">
      <div class="card border-0 shadow-sm rounded-4 bg-white h-100">
        <div class="card-header bg-white border-0 pt-4 px-4 pb-0">
          <h5 class="fw-bold text-dark mb-0">
            <i class="bi bi-sliders text-primary me-2"></i>Réglementation des Cycles
          </h5>
        </div>
        <div class="card-body p-4">
          <form @submit.prevent="updateCycleRules">
            <!-- Sélection du Cycle -->
            <div class="mb-3">
              <label class="form-label small fw-semibold text-muted mb-1">Cycle d'Enseignement</label>
              <select class="form-select bg-light border-0 shadow-sm" v-model="selectedCycle" @change="loadCycleConfig">
                <option value="Licence">Licence (Bac +3)</option>
                <option value="Master">Master (Bac +5)</option>
                <option value="Doctorat">Doctorat (Bac +8)</option>
              </select>
            </div>

            <!-- Volume d'ECTS total requis -->
            <div class="mb-3">
              <label class="form-label small fw-semibold text-muted mb-1">Total Crédits pour l'obtention du diplôme</label>
              <div class="input-group bg-light rounded shadow-sm">
                <input type="number" class="form-control bg-light border-0" v-model.number="cycleConfig.totalEcts" required />
                <span class="input-group-text bg-light border-0 text-muted small">ECTS</span>
              </div>
            </div>

            <!-- Règle de compensation semi-automatique -->
            <div class="mb-3">
              <label class="form-label small fw-semibold text-muted mb-1">Régime de Compensation des UE</label>
              <div class="form-check form-switch mt-1">
                <input class="form-check-input" type="checkbox" id="compensationSwitch" v-model="cycleConfig.compensationPermise">
                <label class="form-check-label small text-secondary" for="compensationSwitch">
                  Autoriser la compensation annuelle des crédits
                </label>
              </div>
            </div>

            <!-- Note seuil pour valider les ECTS unitairement -->
            <div class="mb-4">
              <label class="form-label small fw-semibold text-muted mb-1">Note d'attribution directe du crédit</label>
              <div class="input-group bg-light rounded shadow-sm">
                <input type="number" step="0.5" min="10" max="20" class="form-control bg-light border-0" v-model.number="cycleConfig.noteValidationDirecte" />
                <span class="input-group-text bg-light border-0 text-muted small">/20</span>
              </div>
              <small class="text-muted d-block mt-1" style="font-size: 11px;">
                En dessous de cette note, les ECTS ne sont acquis que par compensation globale du jury.
              </small>
            </div>

            <button type="submit" class="btn btn-primary w-100 border-0 shadow-sm py-2">
              <i class="bi bi-check-circle-fill me-1"></i> Enregistrer le protocole
            </button>
          </form>
        </div>
      </div>
    </div>

    <!-- Visualisation des Unités Capitalisables et Prélèvements d'Équivalences -->
    <div class="col-md-7 mb-4">
      <div class="card border-0 shadow-sm rounded-4 overflow-hidden bg-white h-100">
        <div class="card-header bg-white border-0 pt-4 px-4 pb-2 d-flex justify-content-between align-items-center">
          <h5 class="fw-bold text-dark mb-0">
            <i class="bi bi-journal-bookmark-fill text-warning me-2"></i>Distribution des ECTS par Maquette
          </h5>
          <span class="badge bg-soft-primary text-primary fw-bold">Ref: LMD-MÉSR</span>
        </div>

        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead class="bg-light">
                <tr>
                  <th class="ps-4 py-3">Code Unité (UE)</th>
                  <th>Intitulé de l'Unité Pédagogique</th>
                  <th class="text-center">Volume Horaire</th>
                  <th class="text-center">Valeur ECTS</th>
                  <th class="text-end pe-4">Statut</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="ue in mockUeDistribution" :key="ue.code">
                  <td class="ps-4 font-monospace fw-bold text-primary">{{ ue.code }}</td>
                  <td class="fw-semibold text-dark">{{ ue.nom }}</td>
                  <td class="text-center small text-muted">{{ ue.heures }} h</td>
                  <td class="text-center">
                    <span class="badge bg-soft-success text-success fw-bold px-3 py-1 rounded-pill">
                      {{ ue.ects }} ECTS
                    </span>
                  </td>
                  <td class="text-end pe-4">
                    <span class="badge" :class="ue.obligatoire ? 'bg-light text-dark border' : 'bg-soft-secondary text-secondary'">
                      {{ ue.obligatoire ? 'Obligatoire' : 'Optionnelle' }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Note technique d'information ERP -->
          <div class="p-3 bg-light border-top m-3 rounded">
            <div class="d-flex">
              <i class="bi bi-info-circle-fill text-primary me-2 fs-5"></i>
              <p class="small text-muted mb-0">
                <strong>Règle du Système :</strong> Les crédits ECTS sont définitifs et transférables d'un établissement à un autre. La modification de ces valeurs recalcule automatiquement les moyennes requises sur les PV de délibération des examens.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

// État du cycle sélectionné
const selectedCycle = ref('Master');

// Configuration réactive des règles du cycle
const cycleConfig = ref({
  totalEcts: 120,
  compensationPermise: true,
  noteValidationDirecte: 10.0
});

// Référentiel simulé des configurations par cycle
const loadCycleConfig = () => {
  if (selectedCycle.value === 'Licence') {
    cycleConfig.value = { totalEcts: 180, compensationPermise: true, noteValidationDirecte: 10.0 };
  } else if (selectedCycle.value === 'Master') {
    cycleConfig.value = { totalEcts: 120, compensationPermise: true, noteValidationDirecte: 10.0 };
  } else {
    cycleConfig.value = { totalEcts: 180, compensationPermise: false, noteValidationDirecte: 12.0 };
  }
};

// Distribution factice des ECTS pour alimenter l'interface graphique
const mockUeDistribution = ref([
  { code: 'UE-INF-101', nom: 'Génie Logiciel Avancé', heures: 60, ects: 8, obligatoire: true },
  { code: 'UE-DATA-102', nom: 'Algorithmes de Machine Learning', heures: 45, ects: 6, obligatoire: true },
  { code: 'UE-MNG-103', nom: 'Management de projet & Agilité', heures: 30, ects: 4, obligatoire: false },
  { code: 'UE-LANG-104', nom: 'Anglais Professionnel & Technique', heures: 30, ects: 2, obligatoire: true }
]);

const updateCycleRules = () => {
  alert(`Les règles de crédit pour le cycle [${selectedCycle.value}] ont été mises à jour avec succès.\nNouveau barème de validation appliqué.`);
};
</script>

<style scoped>
/* Teintes douces spécifiques pour une interface ERP propre */
.bg-soft-primary { background-color: rgba(0, 123, 255, 0.08); color: #007bff; }
.bg-soft-success { background-color: rgba(40, 167, 69, 0.12); color: #28a745; }
.bg-soft-secondary { background-color: rgba(108, 117, 125, 0.12); color: #6c757d; }

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

/* Ligne graphique stricte de l'application ERP (Flat design) */
.rounded-4 {
  border-radius: 0.2rem !important;
}
.form-select, .form-control {
  font-size: 0.85rem;
}
</style>