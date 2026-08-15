<template>
  <div class="row">
    <!-- Header de la section -->
    <div class="col-12 mb-4">
      <h3 class="fw-bold mb-1">Assignation des Enseignements</h3>
      <p class="text-muted small mb-0">
        <i class="bi bi-link-45deg me-1"></i>
        Affectez chaque matière d'une classe à son formateur référent pour l'année académique.
      </p>
    </div>

    <!-- Formulaire d'affectation ciblé (Matière/Classe -> Formateur) -->
    <div class="col-12 mb-4">
      <div class="card border-0 shadow-sm rounded-4">
        <div class="card-header bg-white border-0 pt-4 px-4 pb-0">
          <h5 class="fw-bold text-dark mb-0">
            <i class="bi bi-person-plus-fill text-primary me-2"></i>Nouvelle Attribution de Cours
          </h5>
        </div>
        <div class="card-body p-4">
          <form @submit.prevent="handleAssign">
            <div class="row g-3 align-items-end">
              <!-- Sélection de la Classe / Cohorte -->
              <div class="col-md-2">
                <label class="form-label small fw-semibold text-muted">Classe Cible</label>
                <select
                  class="form-select bg-light border-0 shadow-sm"
                  v-model="form.classe"
                  @change="handleClasseChange"
                  required
                >
                  <option value="">Choisir la classe</option>
                  <option v-for="c in mockClasses" :key="c" :value="c">{{ c }}</option>
                </select>
              </div>

              <!-- Sélection de la Matière (Filtrée ou globale) -->
              <div class="col-md-4">
                <label class="form-label small fw-semibold text-muted">Matière à assigner</label>
                <select
                  class="form-select bg-light border-0 shadow-sm"
                  v-model="form.matiereId"
                  required
                >
                  <option value="">Sélectionner la matière</option>
                  <option v-for="m in mockMatieres" :key="m.id" :value="m.id">
                    [{{ getModuleCode(m.parentId) }}] {{ m.nom }}
                  </option>
                </select>
              </div>

              <!-- Sélection du Formateur -->
              <div class="col-md-3">
                <label class="form-label small fw-semibold text-muted">Formateur Référent</label>
                <select
                  class="form-select bg-light border-0 shadow-sm"
                  v-model="form.formateurId"
                  required
                >
                  <option value="">Attribuer à un enseignant</option>
                  <option v-for="f in mockFormateurs" :key="f.id" :value="f.id">
                    {{ f.nom }} {{ f.prenom }} ({{ f.contrat }})
                  </option>
                </select>
              </div>

              <!-- Volume Horaire Dédié -->
              <div class="col-md-1">
                <label class="form-label small fw-semibold text-muted">Heures</label>
                <input
                  type="number"
                  class="form-control bg-light border-0 shadow-sm"
                  placeholder="Ex: 30"
                  v-model.number="form.heures"
                  min="1"
                  required
                />
              </div>

              <!-- Bouton de validation -->
              <div class="col-md-2">
                <button type="submit" class="btn btn-primary w-100 shadow-sm border-0 py-2">
                  <i class="bi bi-check-lg me-1"></i> Assigner
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Barre de recherche / Filtre de la liste -->
    <div class="col-12 mb-3 d-flex justify-content-between align-items-center">
      <div class="input-group bg-white rounded shadow-sm w-50">
        <span class="input-group-text bg-white border-0">
          <i class="bi bi-search text-primary"></i>
        </span>
        <input
          type="text"
          class="form-control border-0"
          placeholder="Filtrer par classe, matière ou formateur..."
          v-model="searchQuery"
        />
      </div>
      <small class="text-muted fw-semibold">
        {{ filteredAssignments.length }} cours actuellement assigné(s)
      </small>
    </div>

    <!-- Tableau des Assignations Actuelles -->
    <div class="col-12">
      <div class="card border-0 shadow-sm rounded-4 overflow-hidden">
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead class="bg-light">
                <tr>
                  <th class="ps-4 py-3">Classe</th>
                  <th>Matière Enseignée (Module)</th>
                  <th>Formateur Attribué</th>
                  <th class="text-center">Volume Horaire</th>
                  <th class="text-center">Statut</th>
                  <th class="text-end pe-4">Actions</th>
                </tr>
              </thead>

              <tbody>
                <tr v-for="assign in assignationsPage" :key="assign.id" class="transition-all">
                  <!-- Classe Cible -->
                  <td class="ps-4">
                    <span class="badge bg-light text-primary border px-3 py-2 fw-bold">
                      {{ assign.classe }}
                    </span>
                  </td>

                  <!-- Matière & Module Parent -->
                  <td>
                    <div class="fw-bold text-dark">{{ getMatiereName(assign.matiereId) }}</div>
                    <small class="text-muted">
                      Rattaché à :
                      <span class="fw-semibold text-secondary">{{
                        getModuleNameByMatiere(assign.matiereId)
                      }}</span>
                    </small>
                  </td>

                  <!-- Formateur rattaché -->
                  <td>
                    <div class="d-flex align-items-center">
                      <div class="avatar-initials me-2 bg-soft-primary text-primary">
                        {{ getFormateurInitials(assign.formateurId) }}
                      </div>
                      <div>
                        <div class="fw-semibold text-dark">
                          {{ getFormateurName(assign.formateurId) }}
                        </div>
                        <small class="text-muted" style="font-size: 11px">{{
                          getFormateurContrat(assign.formateurId)
                        }}</small>
                      </div>
                    </div>
                  </td>

                  <!-- Heures prévues -->
                  <td class="text-center">
                    <span class="fw-bold text-dark">{{ assign.heures }} h</span>
                  </td>

                  <!-- Statut de synchronisation -->
                  <td class="text-center">
                    <span
                      class="badge rounded-pill px-3 py-1 bg-soft-success text-success"
                      style="font-size: 11px"
                    >
                      <i
                        class="bi bi-circle-fill me-1"
                        style="font-size: 5px; vertical-align: middle"
                      ></i>
                      Actif
                    </span>
                  </td>

                  <!-- Désassignation -->
                  <td class="text-end pe-4">
                    <button
                      class="btn btn-link text-danger p-0 border-0"
                      title="Retirer le formateur de ce cours"
                      @click="removeAssignment(assign.id)"
                    >
                      <i class="bi bi-person-x fs-5"></i>
                    </button>
                  </td>
                </tr>

                <!-- Liste filtrée vide -->
                <tr v-if="filteredAssignments.length === 0">
                  <td colspan="6" class="text-center py-5">
                    <h6 class="text-muted fw-bold">
                      Aucune assignation ne correspond à vos critères
                    </h6>
                    <p class="small text-muted mb-0">
                      Utilisez le formulaire ci-dessus pour planifier un cours.
                    </p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="card-footer bg-white border-0 py-3">
          <Pagination
            v-model="page"
            v-model:items-per-page="itemsPerPage"
            :total-items="filteredAssignments.length"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import Pagination from '@/components/shared/Pagination.vue';
import { usePagination } from '@/shared/composables/usePagination';
import { useAttributionStore } from '@/modules/pedagogies/attributions/store';

/**
 * Assignation des enseignements : affecte une matière d'une classe à un formateur.
 *
 * Les tableaux mock (assignations, matières, formateurs) ont laissé place au vrai
 * backend (`/pedagogies/attribution`, via `vue_attributions_cours`). Le balisage
 * n'a pas bougé : les noms `mock*` et les helpers de résolution par id sont
 * conservés, le store fournit les listes sous la forme qu'ils attendent.
 */
const store = useAttributionStore();
const { assignments, mockClasses, mockMatieres, mockModules, mockFormateurs } = storeToRefs(store);

// États globaux
const searchQuery = ref('');

const form = ref({
  classe: '',
  matiereId: '',
  formateurId: '',
  heures: null,
});

onMounted(() => {
  store.fetchAssignments();
  store.fetchReferentiels();
});

// Le sélecteur de classe déclenche ce handler ; il n'y a pas de filtrage serveur
// des matières par classe, on le garde neutre (le template le référence).
const handleClasseChange = () => {};

// --- Méthodes utilitaires de correspondance des Données ---
const getModuleCode = (parentId) => {
  const mod = mockModules.value.find((m) => m.id === parentId);
  return mod ? mod.code : 'UE';
};

const getMatiereName = (id) => {
  const mat = mockMatieres.value.find((m) => m.id === id);
  return mat ? mat.nom : 'Matière inconnue';
};

const getModuleNameByMatiere = (matiereId) => {
  const mat = mockMatieres.value.find((m) => m.id === matiereId);
  if (mat) {
    const mod = mockModules.value.find((m) => m.id === mat.parentId);
    return mod ? mod.nom : 'Module Inconnu';
  }
  return 'Module Inconnu';
};

const getFormateurName = (id) => {
  const f = mockFormateurs.value.find((prof) => prof.id === id);
  return f ? `${f.nom} ${f.prenom}` : 'Non assigné';
};

const getFormateurInitials = (id) => {
  const f = mockFormateurs.value.find((prof) => prof.id === id);
  return f ? `${(f.nom || '?')[0]}${(f.prenom || '?')[0]}` : '??';
};

const getFormateurContrat = (id) => {
  const f = mockFormateurs.value.find((prof) => prof.id === id);
  return f ? f.contrat : '';
};

// --- Filtrage en temps réel ---
const filteredAssignments = computed(() => {
  return assignments.value.filter((assign) => {
    const term = searchQuery.value.toLowerCase();
    const matName = getMatiereName(assign.matiereId).toLowerCase();
    const profName = getFormateurName(assign.formateurId).toLowerCase();
    const className = (assign.classe || '').toLowerCase();

    return matName.includes(term) || profName.includes(term) || className.includes(term);
  });
});

/**
 * Pagination — indispensable ici, pas décorative.
 *
 * `vue_attributions_cours` rend **4 050 lignes** sur le jeu de démonstration, et
 * l'onglet les posait toutes dans le DOM. Chaque ligne construit une pastille,
 * un avatar d'initiales et trois résolutions par identifiant
 * (`getMatiereName`, `getFormateurName`, `getModuleNameByMatiere`), chacune
 * balayant son référentiel : la recherche relançait donc ces parcours pour les
 * 4 050 lignes à chaque frappe.
 *
 * `resetKey` sur la recherche : sans lui, filtrer depuis la page 40 laisse
 * l'utilisateur sur une page 40 qui ne parle plus de la même chose — souvent
 * vide.
 */
const {
  page,
  itemsPerPage,
  paginated: assignationsPage,
} = usePagination(filteredAssignments, { resetKey: () => searchQuery.value });

// --- Actions ---
const handleAssign = async () => {
  const resultat = await store.create(form.value);
  if (resultat !== undefined) {
    // Reset partiel (on garde la classe pour enchaîner les saisies rapidement).
    form.value.matiereId = '';
    form.value.formateurId = '';
    form.value.heures = null;
  }
};

const removeAssignment = async (id) => {
  if (confirm('Voulez-vous rompre le lien entre ce formateur et ce cours ?')) {
    await store.remove(id);
  }
};
</script>

<style scoped>
/* Avatars ronds compacts pour l'équipe */
.avatar-initials {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.75rem;
}

/* Couleurs douces (Soft Thèmes) */
.bg-soft-primary {
  background-color: rgba(0, 123, 255, 0.1);
  color: #007bff;
}
.bg-soft-success {
  background-color: rgba(40, 167, 69, 0.12);
  color: #28a745;
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
  border-radius: 0.2rem !important; /* Maintien de ton identité graphique ERP */
}
.form-select,
.form-control {
  font-size: 0.9rem;
  padding: 10px 12px;
}
.transition-all {
  transition: all 0.3s ease;
}
</style>
