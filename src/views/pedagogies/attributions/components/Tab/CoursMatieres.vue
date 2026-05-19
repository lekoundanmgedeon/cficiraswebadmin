<template>
  <div class="row">
    <!-- Header de la section -->
    <div class="col-12 mb-4">
      <h3 class="fw-bold mb-1">Gestion des Modules & Matières</h3>
      <p class="text-muted small mb-0">
        <i class="bi bi-journal-bookmark-fill me-1"></i>
        Structurez le programme pédagogique : créez les modules d'enseignement (UE) et les matières
        associées.
      </p>
    </div>

    <!-- Formulaire de création rapide (Flat Design) -->
    <div class="col-12 mb-4">
      <div class="card border-0 shadow-sm rounded-4">
        <div class="card-header bg-white border-0 pt-4 px-4 pb-0">
          <h5 class="fw-bold text-dark mb-0">
            <i class="bi bi-plus-square-fill text-primary me-2"></i>Nouveau Composant Pédagogique
          </h5>
        </div>
        <div class="card-body p-4">
          <form @submit.prevent="handleCreate">
            <div class="row g-3 align-items-end">
              <!-- Type de composant (Module ou Matière) -->
              <div class="col-md-2">
                <label class="form-label small fw-semibold text-muted">Type</label>
                <select
                  class="form-select bg-light border-0 shadow-sm"
                  v-model="form.type"
                  required
                >
                  <option value="Module">Module (UE)</option>
                  <option value="Matière">Matière (Matière isolée)</option>
                </select>
              </div>

              <!-- Libellé / Nom -->
              <div class="col-md-3">
                <label class="form-label small fw-semibold text-muted">Nom du composant</label>
                <input
                  type="text"
                  class="form-control bg-light border-0 shadow-sm"
                  placeholder="Ex: Développement Web"
                  v-model="form.nom"
                  required
                />
              </div>

              <!-- Rattachement à un module (uniquement si c'est une matière) -->
              <div class="col-md-3">
                <label class="form-label small fw-semibold text-muted"
                  >Module Parent (Pour Matière)</label
                >
                <select
                  class="form-select bg-light border-0 shadow-sm"
                  v-model="form.parentId"
                  :disabled="form.type === 'Module'"
                  :required="form.type === 'Matière'"
                >
                  <option value="">-- Choisir un module --</option>
                  <option v-for="m in mockModules" :key="m.id" :value="m.id">
                    {{ m.code }} - {{ m.nom }}
                  </option>
                </select>
              </div>

              <!-- Coefficients / Crédits -->
              <div class="col-md-1">
                <label class="form-label small fw-semibold text-muted">Coef.</label>
                <input
                  type="number"
                  class="form-control bg-light border-0 shadow-sm"
                  v-model.number="form.coefficient"
                  min="1"
                  required
                />
              </div>

              <div class="col-md-1">
                <label class="form-label small fw-semibold text-muted">ECTS</label>
                <input
                  type="number"
                  class="form-control bg-light border-0 shadow-sm"
                  v-model.number="form.ects"
                  min="0"
                />
              </div>

              <!-- Bouton Ajouter -->
              <div class="col-md-2">
                <button type="submit" class="btn btn-primary w-100 shadow-sm border-0 py-2">
                  <i class="bi bi-plus-lg me-1"></i> Ajouter
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Filtre de recherche -->
    <div class="col-12 mb-3">
      <div class="input-group bg-white rounded shadow-sm w-50">
        <span class="input-group-text bg-white border-0">
          <i class="bi bi-search text-primary"></i>
        </span>
        <input
          type="text"
          class="form-control border-0"
          placeholder="Rechercher un module ou une matière..."
          v-model="searchQuery"
        />
      </div>
    </div>

    <!-- Liste structurée des Modules (Arborescence Flat) -->
    <div class="col-12">
      <div
        v-for="module in filteredModules"
        :key="module.id"
        class="card border-0 shadow-sm rounded-4 mb-3 overflow-hidden"
      >
        <!-- Ligne d'entête du Module (UE) -->
        <div
          class="card-header bg-white border-0 p-3 d-flex justify-content-between align-items-center border-bottom-soft"
        >
          <div class="d-flex align-items-center">
            <div class="module-badge bg-soft-primary text-primary me-3 fw-bold rounded-3">
              {{ module.code }}
            </div>
            <div>
              <h6 class="fw-bold text-dark mb-0">{{ module.nom }}</h6>
              <small class="text-muted">Module d'Enseignement Principal</small>
            </div>
          </div>

          <div class="d-flex align-items-center">
            <span class="badge bg-light text-dark border me-3"
              >Total Coef: {{ module.coefficient }}</span
            >
            <span class="badge bg-light text-primary border me-3">{{ module.ects }} ECTS</span>
            <button
              class="btn btn-link text-danger p-0 border-0"
              title="Supprimer le module"
              @click="deleteModule(module.id)"
            >
              <i class="bi bi-trash3 fs-5"></i>
            </button>
          </div>
        </div>

        <!-- Liste des Matières enfants rattachées -->
        <div class="card-body p-0 bg-fcfdfe">
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <tbody>
                <tr v-for="matiere in getMatieresForModule(module.id)" :key="matiere.id">
                  <!-- Retrait visuel pour l'arborescence -->
                  <td class="ps-5" style="width: 50%">
                    <div class="d-flex align-items-center">
                      <i class="bi bi-arrow-return-right text-muted me-3"></i>
                      <div>
                        <span class="fw-semibold text-dark">{{ matiere.nom }}</span>
                      </div>
                    </div>
                  </td>

                  <!-- Coefficient de la matière -->
                  <td>
                    <small class="text-muted">Coefficient : </small>
                    <span class="fw-bold text-dark">{{ matiere.coefficient }}</span>
                  </td>

                  <!-- Crédits ECTS optionnels -->
                  <td>
                    <small class="text-muted">Crédits : </small>
                    <span class="fw-bold text-secondary">{{ matiere.ects || 'N/A' }}</span>
                  </td>

                  <!-- Statut / Type -->
                  <td class="text-center">
                    <span class="badge bg-soft-secondary text-secondary rounded-pill px-3"
                      >Matière Étoile</span
                    >
                  </td>

                  <!-- Actions sur la matière -->
                  <td class="text-end pe-4">
                    <button
                      class="btn btn-link text-danger p-0 border-0"
                      title="Supprimer la matière"
                      @click="deleteMatiere(matiere.id)"
                    >
                      <i class="bi bi-x-circle fs-5"></i>
                    </button>
                  </td>
                </tr>

                <!-- Si aucune matière n'est présente dans ce module -->
                <tr v-if="getMatieresForModule(module.id).length === 0">
                  <td class="ps-5 text-muted small py-3">
                    <i class="bi bi-info-circle me-1"></i> Aucune matière isolée n'est rattachée à
                    ce module pour le moment.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Cas où aucun module ne correspond à la recherche -->
      <div
        v-if="filteredModules.length === 0"
        class="card border-0 shadow-sm rounded-4 p-5 text-center bg-white"
      >
        <h6 class="text-muted fw-bold">Aucun élément pédagogique trouvé</h6>
        <p class="small text-muted mb-0">
          Modifiez vos filtres ou créez une nouvelle unité en utilisant le formulaire ci-dessus.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

// État de recherche
const searchQuery = ref('');

// Modèle du formulaire de saisie
const form = ref({
  type: 'Matière',
  nom: '',
  parentId: '',
  coefficient: 1,
  ects: 4,
});

// Liste fictive des Modules globaux (UE)
const mockModules = ref([
  { id: 1, code: 'UE-INF-1', nom: 'Génie Logiciel & Outils de Dev', coefficient: 4, ects: 8 },
  {
    id: 2,
    code: 'UE-DATA-2',
    nom: 'Data Science & Intelligence Artificielle',
    coefficient: 5,
    ects: 10,
  },
  {
    id: 3,
    code: 'UE-MNG-1',
    nom: 'Management, Management de projet & RH',
    coefficient: 3,
    ects: 6,
  },
]);

// Liste fictive des matières interconnectées
const mockMatieres = ref([
  { id: 101, parentId: 1, nom: 'Conception orientée objet & Patterns', coefficient: 2, ects: 4 },
  { id: 102, parentId: 1, nom: 'Frameworks Modernes (Vue.js 3 & Node)', coefficient: 2, ects: 4 },
  {
    id: 103,
    parentId: 2,
    nom: "Bases de l'apprentissage automatique (ML)",
    coefficient: 3,
    ects: 5,
  },
  { id: 104, parentId: 2, nom: 'Deep Learning & Vision par ordinateur', coefficient: 2, ects: 5 },
  { id: 105, parentId: 3, nom: 'Méthodologies Agiles & Scrum Master', coefficient: 3, ects: 6 },
]);

// Récupère uniquement les matières associées à un ID de module précis
const getMatieresForModule = (moduleId) => {
  return mockMatieres.value.filter((m) => m.parentId === moduleId);
};

// Logique de filtrage en cascade (si la recherche cible un module ou une de ses matières)
const filteredModules = computed(() => {
  return mockModules.value.filter((mod) => {
    const term = searchQuery.value.toLowerCase();
    const matchModule =
      mod.nom.toLowerCase().includes(term) || mod.code.toLowerCase().includes(term);

    // Vérifie si une des matières à l'intérieur correspond aussi
    const matchMatiere = getMatieresForModule(mod.id).some((mat) =>
      mat.nom.toLowerCase().includes(term)
    );

    return matchModule || matchMatiere;
  });
});

// Action : Ajouter un Module ou une Matière
const handleCreate = () => {
  if (form.value.type === 'Module') {
    // Génération d'un nouveau module
    const newId = mockModules.value.length + 1;
    mockModules.value.push({
      id: newId,
      code: `UE-NEW-${newId}`,
      nom: form.value.nom,
      coefficient: form.value.coefficient,
      ects: form.value.ects || 0,
    });
  } else {
    // Ajout d'une matière
    mockMatieres.value.push({
      id: Date.now(),
      parentId: Number(form.value.parentId),
      nom: form.value.nom,
      coefficient: form.value.coefficient,
      ects: form.value.ects || null,
    });
  }

  // Reset partiel du formulaire
  form.value.nom = '';
  form.value.coefficient = 1;
  form.value.ects = 4;
};

// Suppressions sécurisées
const deleteModule = (id) => {
  if (
    confirm(
      'Attention : Supprimer ce module supprimera également toutes les matières rattachées. Continuer ?'
    )
  ) {
    mockModules.value = mockModules.value.filter((m) => m.id !== id);
    mockMatieres.value = mockMatieres.value.filter((mat) => mat.parentId !== id);
  }
};

const deleteMatiere = (id) => {
  if (confirm('Voulez-vous retirer cette matière du module sélectionné ?')) {
    mockMatieres.value = mockMatieres.value.filter((mat) => mat.id !== id);
  }
};
</script>

<style scoped>
/* Boîte pour l'ID/Code du module */
.module-badge {
  padding: 8px 12px;
  font-size: 0.75rem;
  letter-spacing: 0.5px;
}

/* Bordures douces conformes au Flat Design */
.border-bottom-soft {
  border-bottom: 1px solid #f1f5f9;
}

/* Fond légèrement différent pour distinguer le corps du module */
.bg-fcfdfe {
  background-color: #fcfdfe;
}

/* Styles des tables imbriquées */
.table tbody tr {
  border-bottom: 1px solid #f8f9fa;
  transition: background 0.2s;
}
.table tbody tr:hover {
  background-color: #f1f7ff !important;
}

/* Thématiques Couleurs Soft */
.bg-soft-primary {
  background-color: rgba(0, 123, 255, 0.1);
  color: #007bff;
}
.bg-soft-secondary {
  background-color: rgba(108, 117, 125, 0.1);
  color: #6c757d;
}

.rounded-4 {
  border-radius: 0.2rem !important;
}
.form-select,
.form-control {
  font-size: 0.9rem;
  padding: 10px 12px;
}
</style>
