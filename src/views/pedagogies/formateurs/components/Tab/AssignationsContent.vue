<template>
  <div class="row">
    <!-- Header de la section -->
    <div class="col-12 mb-4">
      <h3 class="fw-bold mb-1">Assignations des Formateurs</h3>
      <p class="text-muted small mb-0">
        <i class="bi bi-link-45deg me-1"></i>
        Associez les formateurs aux matières et aux classes pour l'année académique.
      </p>
    </div>

    <!-- Formulaire d'affectation rapide (Flat Design) -->
    <div class="col-12 mb-4">
      <div class="card border-0 shadow-sm rounded-4">
        <div class="card-header bg-white border-0 pt-4 px-4 pb-0">
          <h5 class="fw-bold text-dark mb-0">
            <i class="bi bi-plus-circle-fill text-primary me-2"></i>Nouvelle Affectation
          </h5>
        </div>
        <div class="card-body p-4">
          <form @submit.prevent="handleAssign">
            <div class="row g-3 align-items-end">
              <!-- Sélection du Formateur -->
              <div class="col-md-3">
                <label class="form-label small fw-semibold text-muted">Formateur</label>
                <select class="form-select bg-light border-0 shadow-sm" v-model="newAssignment.formateurId" required>
                  <option value="">Sélectionner un enseignant</option>
                  <option v-for="f in mockFormateurs" :key="f.id" :value="f.id">
                    {{ f.nom }} {{ f.prenom }}
                  </option>
                </select>
              </div>

              <!-- Sélection du Cours / Matière -->
              <div class="col-md-3">
                <label class="form-label small fw-semibold text-muted">Cours / Matière</label>
                <select class="form-select bg-light border-0 shadow-sm" v-model="newAssignment.matiere" required>
                  <option value="">Sélectionner la matière</option>
                  <option v-for="m in mockMatieres" :key="m" :value="m">{{ m }}</option>
                </select>
              </div>

              <!-- Sélection de la Classe / Cohorte -->
              <div class="col-md-2">
                <label class="form-label small fw-semibold text-muted">Classe</label>
                <select class="form-select bg-light border-0 shadow-sm" v-model="newAssignment.classe" required>
                  <option value="">Sélectionner la classe</option>
                  <option v-for="c in mockClasses" :key="c" :value="c">{{ c }}</option>
                </select>
              </div>

              <!-- Volume Horaire Dédié -->
              <div class="col-md-2">
                <label class="form-label small fw-semibold text-muted">Volume Horaire (Heures)</label>
                <input 
                  type="number" 
                  class="form-control bg-light border-0 shadow-sm" 
                  placeholder="Ex: 45" 
                  v-model.number="newAssignment.heures"
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
          placeholder="Filtrer par formateur, matière ou classe..."
          v-model="searchQuery"
        />
      </div>
      <small class="text-muted fw-semibold">
        {{ filteredAssignments.length }} assignation(s) active(s)
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
                  <th class="ps-4 py-3">Formateur</th>
                  <th>Matière Enseignée</th>
                  <th>Classe / Promotion</th>
                  <th class="text-center">Charge Horaire</th>
                  <th class="text-center">Statut Synchro</th>
                  <th class="text-end pe-4">Actions</th>
                </tr>
              </thead>

              <tbody>
                <tr
                  v-for="assignment in filteredAssignments"
                  :key="assignment.id"
                  class="transition-all"
                >
                  <!-- Formateur -->
                  <td class="ps-4">
                    <div class="d-flex align-items-center">
                      <div class="avatar-initials me-3 bg-soft-primary text-primary">
                        {{ getFormateurInitials(assignment.formateurId) }}
                      </div>
                      <div>
                        <div class="fw-bold text-dark">
                          {{ getFormateurName(assignment.formateurId) }}
                        </div>
                        <small class="text-muted">{{ getFormateurContrat(assignment.formateurId) }}</small>
                      </div>
                    </div>
                  </td>

                  <!-- Matière -->
                  <td>
                    <div class="fw-semibold text-dark">{{ assignment.matiere }}</div>
                  </td>

                  <!-- Classe -->
                  <td>
                    <span class="badge bg-light text-secondary border px-3 py-2 fw-semibold">
                      {{ assignment.classe }}
                    </span>
                  </td>

                  <!-- Heures -->
                  <td class="text-center">
                    <span class="fw-bold text-primary">{{ assignment.heures }} h</span>
                    <small class="text-muted d-block" style="font-size: 10px;">Semestriel</small>
                  </td>

                  <!-- Statut de l'assignation (Actif/Planifié) -->
                  <td class="text-center">
                    <span class="badge rounded-pill px-3 py-2 bg-soft-success text-success">
                      <i class="bi bi-circle-fill me-1" style="font-size: 6px; vertical-align: middle;"></i>
                      Validé
                    </span>
                  </td>

                  <!-- Bouton de suppression de la liaison -->
                  <td class="text-end pe-4">
                    <button 
                      class="btn btn-link text-danger p-0 border-0" 
                      title="Supprimer l'assignation"
                      @click="removeAssignment(assignment.id)"
                    >
                      <i class="bi bi-trash3 fs-5"></i>
                    </button>
                  </td>
                </tr>

                <!-- Liste vide -->
                <tr v-if="filteredAssignments.length === 0">
                  <td colspan="6" class="text-center py-5">
                    <h6 class="text-muted fw-bold">Aucune assignation ne correspond à vos critères</h6>
                    <p class="small text-muted mb-0">Utilisez le formulaire ci-dessus pour lier un enseignant à un cours.</p>
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

// Listes d'options pour alimenter les selects du formulaire
const mockFormateurs = ref([
  { id: 101, nom: 'Dupont', prenom: 'Jean', contrat: 'Permanent' },
  { id: 102, nom: 'Alami', prenom: 'Sanaa', contrat: 'Vacataire' },
  { id: 103, nom: 'Traoré', prenom: 'Moussa', contrat: 'Permanent' },
  { id: 104, nom: 'Muller', prenom: 'Charlotte', contrat: 'Permanent' }
]);

const mockMatieres = ref([
  'Algorithmique & Structures de Données',
  'Architecture des Systèmes Cloud',
  'Marketing Digital & Stratégie',
  'Anglais des Affaires',
  'Management Agile'
]);

const mockClasses = ref(['Master 1 Info', 'Master 2 Info', 'Licence 3 Management', 'Licence 2 Marketing']);

// Liste active des assignations (Mock Data de base)
const mockAssignments = ref([
  { id: 1, formateurId: 101, matiere: 'Algorithmique & Structures de Données', classe: 'Master 1 Info', heures: 42 },
  { id: 2, formateurId: 103, matiere: 'Architecture des Systèmes Cloud', classe: 'Master 2 Info', heures: 60 },
  { id: 3, formateurId: 102, matiere: 'Marketing Digital & Stratégie', classe: 'Licence 3 Management', heures: 30 },
  { id: 4, formateurId: 104, matiere: 'Anglais des Affaires', classe: 'Licence 2 Marketing', heures: 24 }
]);

// État du formulaire et recherche
const searchQuery = ref('');
const newAssignment = ref({
  formateurId: '',
  matiere: '',
  classe: '',
  heures: null
});

// Fonctions utilitaires pour récupérer les infos des formateurs liés
const getFormateurName = (id) => {
  const f = mockFormateurs.value.find(prof => prof.id === id);
  return f ? `${f.nom} ${f.prenom}` : 'Inconnu';
};

const getFormateurInitials = (id) => {
  const f = mockFormateurs.value.find(prof => prof.id === id);
  return f ? `${f.nom[0]}${f.prenom[0]}` : '??';
};

const getFormateurContrat = (id) => {
  const f = mockFormateurs.value.find(prof => prof.id === id);
  return f ? f.contrat : '';
};

// Logique de filtrage en temps réel
const filteredAssignments = computed(() => {
  return mockAssignments.value.filter(assign => {
    const term = searchQuery.value.toLowerCase();
    const profName = getFormateurName(assign.formateurId).toLowerCase();
    return (
      profName.includes(term) ||
      assign.matiere.toLowerCase().includes(term) ||
      assign.classe.toLowerCase().includes(term)
    );
  });
});

// Action : Ajouter une nouvelle assignation
const handleAssign = () => {
  mockAssignments.value.unshift({
    id: Date.now(), // Génère un ID factice unique
    formateurId: Number(newAssignment.value.formateurId),
    matiere: newAssignment.value.matiere,
    classe: newAssignment.value.classe,
    heures: newAssignment.value.heures
  });

  // Reset du formulaire
  newAssignment.value = { formateurId: '', matiere: '', classe: '', heures: null };
};

// Action : Retirer une assignation
const removeAssignment = (id) => {
  if (confirm('Voulez-vous vraiment annuler cette assignation de cours ?')) {
    mockAssignments.value = mockAssignments.value.filter(item => item.id !== id);
  }
};
</script>

<style scoped>
/* Cercles d'avatars simplifiés */
.avatar-initials {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.8rem;
}

/* Couleurs Douces */
.bg-soft-primary {
  background-color: rgba(0, 123, 255, 0.1);
  color: #007bff;
}
.bg-soft-success {
  background-color: rgba(40, 167, 69, 0.12);
  color: #28a745;
}

/* Styles de la table */
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

/* Éléments Flat Design */
.rounded-4 {
  border-radius: 0.2rem !important; /* Harmonisation avec le reste de ton ERP */
}
.form-select, .form-control {
  font-size: 0.9rem;
  padding: 10px 12px;
}
.transition-all {
  transition: all 0.3s ease;
}
</style>
