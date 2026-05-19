<template>
  <div class="row">
    <!-- Header de la section -->
    <div class="col-12 mb-4">
      <h3 class="fw-bold mb-1">Programmes, Régime d'Examen & Crédits</h3>
      <p class="text-muted small mb-0">
        <i class="bi bi-award-fill me-1"></i>
        Configurez l'architecture des diplômes, associez les matières aux UE et définissez les
        coefficients, ECTS et notes éliminatoires.
      </p>
    </div>

    <!-- Formulaire d'ajout / modification de configuration de matière -->
    <div class="col-12 mb-4">
      <div class="card border-0 shadow-sm rounded-4 bg-white">
        <div class="card-header bg-white border-0 pt-4 px-4 pb-0">
          <h5 class="fw-bold text-dark mb-0">
            <i class="bi bi-gear-wide-connected text-primary me-2"></i
            >{{
              isEditing
                ? 'Modifier la Règle Académique'
                : 'Paramétrer une Matière / Élément Constitutif (EC)'
            }}
          </h5>
        </div>
        <div class="card-body p-4">
          <form @submit.prevent="saveProgramRule">
            <div class="row g-3">
              <!-- Classe / Parcours -->
              <div class="col-md-3">
                <label class="form-label small fw-semibold text-muted mb-1"
                  >Classe / Spécialité</label
                >
                <select
                  class="form-select bg-light border-0 shadow-sm"
                  v-model="form.classe"
                  required
                >
                  <option value="">Sélectionner...</option>
                  <option v-for="c in mockClasses" :key="c" :value="c">{{ c }}</option>
                </select>
              </div>

              <!-- Période / Semestre -->
              <div class="col-md-2">
                <label class="form-label small fw-semibold text-muted mb-1">Semestre</label>
                <select
                  class="form-select bg-light border-0 shadow-sm"
                  v-model="form.semestre"
                  required
                >
                  <option value="Semestre 1">Semestre 1</option>
                  <option value="Semestre 2">Semestre 2</option>
                </select>
              </div>

              <!-- Unité d'Enseignement (UE) parente -->
              <div class="col-md-3">
                <label class="form-label small fw-semibold text-muted mb-1">Rattaché à l'UE</label>
                <select
                  class="form-select bg-light border-0 shadow-sm"
                  v-model="form.moduleCode"
                  required
                >
                  <option value="">Choisir l'UE...</option>
                  <option v-for="m in mockModules" :key="m.code" :value="m.code">
                    [{{ m.code }}] {{ m.nom }}
                  </option>
                </select>
              </div>

              <!-- Nom de la Matière -->
              <div class="col-md-4">
                <label class="form-label small fw-semibold text-muted mb-1"
                  >Intitulé de la Matière (EC)</label
                >
                <input
                  type="text"
                  class="form-control bg-light border-0 shadow-sm"
                  placeholder="Ex: Architecture Microservices"
                  v-model="form.matiere"
                  required
                />
              </div>

              <!-- Paramètres de notation : Coefficient -->
              <div class="col-md-3">
                <label class="form-label small fw-semibold text-muted mb-1"
                  >Coefficient de la matière</label
                >
                <input
                  type="number"
                  class="form-control bg-light border-0 shadow-sm"
                  placeholder="Ex: 2"
                  v-model.number="form.coefficient"
                  step="0.5"
                  min="0.5"
                  required
                />
              </div>

              <!-- Paramètres de notation : Crédits ECTS -->
              <div class="col-md-3">
                <label class="form-label small fw-semibold text-muted mb-1"
                  >Crédits ECTS attribués</label
                >
                <input
                  type="number"
                  class="form-control bg-light border-0 shadow-sm"
                  placeholder="Ex: 4"
                  v-model.number="form.ects"
                  min="1"
                  required
                />
              </div>

              <!-- Règle d'examen : Note Éliminatoire -->
              <div class="col-md-4">
                <label class="form-label small fw-semibold text-muted mb-1"
                  >Note éliminatoire sur 20</label
                >
                <div class="input-group bg-light rounded shadow-sm">
                  <input
                    type="number"
                    class="form-control bg-light border-0"
                    placeholder="Ex: 08.00 (Optionnel)"
                    v-model.number="form.noteEliminatoire"
                    step="0.25"
                    min="0"
                    max="20"
                  />
                  <span class="input-group-text bg-light border-0 text-muted small">/20</span>
                </div>
              </div>

              <!-- Validation -->
              <div class="col-md-2 text-end mt-4 pt-2">
                <button type="submit" class="btn btn-primary w-100 border-0 shadow-sm py-2">
                  <i class="bi bi-file-earmark-check me-1"></i> Fixer
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Tableau récapitulatif de la maquette en cours -->
    <div class="col-12">
      <div class="card border-0 shadow-sm rounded-4 overflow-hidden bg-white">
        <div
          class="card-header bg-white border-0 pt-4 px-4 pb-2 d-flex justify-content-between align-items-center"
        >
          <h5 class="fw-bold text-dark mb-0">Règlement des Examens & Pondérations</h5>
          <!-- Filtrage par Classe -->
          <select
            class="form-select form-select-sm border shadow-sm w-25"
            v-model="tableFilterClasse"
          >
            <option value="Toutes">Toutes les classes</option>
            <option v-for="c in mockClasses" :key="c" :value="c">{{ c }}</option>
          </select>
        </div>

        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead class="bg-light">
                <tr>
                  <th class="ps-4 py-3">Classe & Semestre</th>
                  <th>Unité d'Enseignement (UE)</th>
                  <th>Matière Constitutive (EC)</th>
                  <th class="text-center">Coefficient</th>
                  <th class="text-center">Valeur ECTS</th>
                  <th class="text-center">Seuil Éliminatoire</th>
                  <th class="text-end pe-4">Actions</th>
                </tr>
              </thead>

              <tbody>
                <tr v-for="rule in filteredRules" :key="rule.id" class="transition-all">
                  <!-- Classe & Semestre -->
                  <td class="ps-4">
                    <div class="fw-bold text-dark">{{ rule.classe }}</div>
                    <small class="text-primary fw-medium">{{ rule.semestre }}</small>
                  </td>

                  <!-- Code UE -->
                  <td>
                    <span class="badge bg-light text-dark border px-2 py-1 fw-bold">
                      {{ rule.moduleCode }}
                    </span>
                  </td>

                  <!-- Matière -->
                  <td class="fw-semibold text-secondary">
                    {{ rule.matiere }}
                  </td>

                  <!-- Coefficient -->
                  <td class="text-center fw-bold text-dark">x{{ rule.coefficient }}</td>

                  <!-- Crédits ECTS -->
                  <td class="text-center">
                    <span
                      class="badge bg-soft-success text-success px-3 py-1 rounded-pill fw-bold"
                      style="font-size: 11px"
                    >
                      {{ rule.ects }} ECTS
                    </span>
                  </td>

                  <!-- Note Éliminatoire -->
                  <td class="text-center">
                    <span
                      v-if="rule.noteEliminatoire"
                      class="badge bg-soft-danger text-danger px-2 py-1 fw-bold"
                    >
                      &lt; {{ rule.noteEliminatoire }} /20
                    </span>
                    <span v-else class="text-muted small">Aucune</span>
                  </td>

                  <!-- Actions d'édition ou de suppression -->
                  <td class="text-end pe-4">
                    <button class="btn btn-link text-primary p-0 me-3" @click="editRule(rule)">
                      <i class="bi bi-pencil-fill fs-6"></i>
                    </button>
                    <button
                      class="btn btn-link text-danger p-0 border-0"
                      @click="deleteRule(rule.id)"
                    >
                      <i class="bi bi-trash fs-6"></i>
                    </button>
                  </td>
                </tr>

                <tr v-if="filteredRules.length === 0">
                  <td colspan="7" class="text-center py-5">
                    <h6 class="text-muted fw-bold">Aucun élément paramétré pour ce filtre</h6>
                    <p class="small text-muted mb-0">
                      Remplissez le formulaire ci-dessus pour ajouter des coefficients et des
                      crédits.
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

// États de l'interface
const isEditing = ref(false);
const editingId = ref(null);
const tableFilterClasse = ref('Toutes');

const form = ref({
  classe: '',
  semestre: 'Semestre 1',
  moduleCode: '',
  matiere: '',
  coefficient: null,
  ects: null,
  noteEliminatoire: null,
});

// Référentiels de maquettes
const mockClasses = ref(['Master 1 Info', 'Master 2 Info', 'Licence 3 Management']);
const mockModules = ref([
  { code: 'UE-INF-1', nom: 'Génie Logiciel & Outils de Dev' },
  { code: 'UE-DATA-2', nom: 'Data Science & Intelligence Artificielle' },
  { code: 'UE-MNG-1', nom: 'Management & RH' },
]);

// Registre de la maquette (Règles d'examens unitaires)
const mockRules = ref([
  {
    id: 1,
    classe: 'Master 1 Info',
    semestre: 'Semestre 1',
    moduleCode: 'UE-INF-1',
    matiere: 'Conception orientée objet & Patterns',
    coefficient: 2,
    ects: 4,
    noteEliminatoire: 8,
  },
  {
    id: 2,
    classe: 'Master 1 Info',
    semestre: 'Semestre 1',
    moduleCode: 'UE-INF-1',
    matiere: 'Frameworks Modernes (Vue.js 3 & Node)',
    coefficient: 2,
    ects: 4,
    noteEliminatoire: null,
  },
  {
    id: 3,
    classe: 'Master 2 Info',
    semestre: 'Semestre 1',
    moduleCode: 'UE-DATA-2',
    matiere: 'Deep Learning & Vision par ordinateur',
    coefficient: 3,
    ects: 6,
    noteEliminatoire: 10,
  },
]);

// Sauvegarde ou modification d'une règle
const saveProgramRule = () => {
  if (isEditing.value) {
    const index = mockRules.value.findIndex((r) => r.id === editingId.value);
    if (index !== -1) {
      mockRules.value[index] = { id: editingId.value, ...form.value };
    }
  } else {
    mockRules.value.unshift({
      id: Date.now(),
      ...form.value,
    });
  }
  resetForm();
};

const editRule = (rule) => {
  isEditing.value = true;
  editingId.value = rule.id;
  form.value = { ...rule };
};

const deleteRule = (id) => {
  if (confirm('Voulez-vous supprimer cette matière de la maquette pédagogique ?')) {
    mockRules.value = mockRules.value.filter((r) => r.id !== id);
  }
};

const resetForm = () => {
  isEditing.value = false;
  editingId.value = null;
  form.value = {
    classe: '',
    semestre: 'Semestre 1',
    moduleCode: '',
    matiere: '',
    coefficient: null,
    ects: null,
    noteEliminatoire: null,
  };
};

// Filtrage réactif de la table
const filteredRules = computed(() => {
  if (tableFilterClasse.value === 'Toutes') return mockRules.value;
  return mockRules.value.filter((r) => r.classe === tableFilterClasse.value);
});
</script>

<style scoped>
/* Thématique Flat & Soft Colors */
.bg-soft-success {
  background-color: rgba(40, 167, 69, 0.12);
  color: #28a745;
}
.bg-soft-danger {
  background-color: rgba(220, 53, 69, 0.1);
  color: #dc3545;
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

.rounded-4 {
  border-radius: 0.2rem !important; /* Ligne graphique stricte de l'application ERP */
}
.form-select,
.form-control {
  font-size: 0.85rem;
  padding: 8px 12px;
}
.transition-all {
  transition: all 0.2s ease;
}
</style>
