<template>
  <div class="row">
    <!-- Header de la section -->
    <div class="col-12 mb-4">
      <h3 class="fw-bold mb-1">Suivi Pédagogique & Alertes</h3>
      <p class="text-muted small mb-0">
        <i class="bi bi-exclamation-triangle me-1"></i>
        Identifiez les étudiants en difficulté, suivez les décrochages et gérez les actions
        d'accompagnement.
      </p>
    </div>

    <!-- Mini-indicateurs de performance (KPI Cards) -->
    <div class="col-12 mb-4">
      <div class="row g-3">
        <div class="col-md-4">
          <div class="card border-0 shadow-sm bg-soft-danger-card p-3 rounded-4">
            <div class="d-flex align-items-center justify-content-between">
              <div>
                <h6 class="text-danger fw-bold small uppercase mb-1">Alertes Décrochage</h6>
                <h3 class="fw-bold text-dark mb-0">{{ countAlerts('Décrochage') }}</h3>
              </div>
              <div class="icon-box bg-white text-danger rounded-3 p-2 shadow-sm">
                <i class="bi bi-person-exclamation fs-4"></i>
              </div>
            </div>
          </div>
        </div>

        <div class="col-md-4">
          <div class="card border-0 shadow-sm bg-soft-warning-card p-3 rounded-4">
            <div class="d-flex align-items-center justify-content-between">
              <div>
                <h6 class="text-warning-dark fw-bold small uppercase mb-1">
                  Difficultés Académiques
                </h6>
                <h3 class="fw-bold text-dark mb-0">{{ countAlerts('Baisse de notes') }}</h3>
              </div>
              <div class="icon-box bg-white text-warning rounded-3 p-2 shadow-sm">
                <i class="bi bi-graph-down fs-4"></i>
              </div>
            </div>
          </div>
        </div>

        <div class="col-md-4">
          <div class="card border-0 shadow-sm bg-soft-success-card p-3 rounded-4">
            <div class="d-flex align-items-center justify-content-between">
              <div>
                <h6 class="text-success fw-bold small uppercase mb-1">Suivis Clôturés / Résolus</h6>
                <h3 class="fw-bold text-dark mb-0">{{ countAlerts('Résolu') }}</h3>
              </div>
              <div class="icon-box bg-white text-success rounded-3 p-2 shadow-sm">
                <i class="bi bi-check-circle fs-4"></i>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Barre de recherche et Filtres Métiers -->
    <div class="col-12 mb-4">
      <div class="card border-0 shadow-sm bg-light rounded-4">
        <div class="card-body p-3">
          <div class="row g-3">
            <!-- Recherche par nom de l'étudiant -->
            <div class="col-md-5">
              <div class="input-group bg-white rounded shadow-sm">
                <span class="input-group-text bg-white border-0">
                  <i class="bi bi-search text-primary"></i>
                </span>
                <input
                  type="text"
                  class="form-control border-0"
                  placeholder="Rechercher un étudiant par son nom..."
                  v-model="searchQuery"
                />
              </div>
            </div>
            <!-- Filtre par type de gravité / Alerte -->
            <div class="col-md-3">
              <select class="form-select border-0 shadow-sm" v-model="filterStatut">
                <option value="">Tous les statuts d'alerte</option>
                <option value="Décrochage">Alerte Décrochage</option>
                <option value="Baisse de notes">Difficulté Académique</option>
                <option value="Suivi Standard">Suivi Standard</option>
                <option value="Résolu">Dossiers Clos</option>
              </select>
            </div>
            <!-- Filtre par Niveau/Classe -->
            <div class="col-md-2">
              <select class="form-select border-0 shadow-sm" v-model="filterClasse">
                <option value="">Toutes les classes</option>
                <option value="Master 1 Info">Master 1 Info</option>
                <option value="Master 2 Info">Master 2 Info</option>
                <option value="Licence 3 Management">Licence 3 Management</option>
              </select>
            </div>
            <!-- Reset -->
            <div class="col-md-2">
              <button class="btn btn-white w-100 shadow-sm border-0" @click="resetFilters">
                <i class="bi bi-sliders me-1"></i> Reset
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tableau de Suivi Individuel -->
    <div class="col-12">
      <div class="card border-0 shadow-sm rounded-4 overflow-hidden">
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead class="bg-light">
                <tr>
                  <th class="ps-4 py-3">Étudiant</th>
                  <th>Classe</th>
                  <th>Dernière Observation / Motif</th>
                  <th>Statut du Suivi</th>
                  <th>Dernière mise à jour</th>
                  <th class="text-end pe-4">Actions</th>
                </tr>
              </thead>

              <tbody>
                <tr v-for="suivi in filteredSuivis" :key="suivi.id" class="transition-all">
                  <!-- Étudiant -->
                  <td class="ps-4">
                    <div class="d-flex align-items-center">
                      <div class="avatar-initials me-3" :class="getAvatarColor(suivi.statut)">
                        {{ suivi.etudiantNom[0] }}{{ suivi.etudiantPrenom[0] }}
                      </div>
                      <div>
                        <div class="fw-bold text-dark">
                          {{ suivi.etudiantNom }} {{ suivi.etudiantPrenom }}
                        </div>
                        <small class="text-muted">Matricule: {{ suivi.matricule }}</small>
                      </div>
                    </div>
                  </td>

                  <!-- Classe -->
                  <td>
                    <span class="badge bg-light text-secondary border px-2 py-1">{{
                      suivi.classe
                    }}</span>
                  </td>

                  <!-- Commentaire / Constat pédagogique -->
                  <td>
                    <div
                      class="text-dark small fw-medium text-truncate-custom"
                      :title="suivi.observation"
                    >
                      {{ suivi.observation }}
                    </div>
                    <small class="text-muted text-capitalize"
                      >Signalé par : Prof. {{ suivi.signalePar }}</small
                    >
                  </td>

                  <!-- Badge de Statut Évolutif -->
                  <td>
                    <span
                      class="badge rounded-pill px-3 py-2"
                      :class="getStatusClass(suivi.statut)"
                    >
                      {{ suivi.statut }}
                    </span>
                  </td>

                  <!-- Date du constat -->
                  <td>
                    <span class="small text-dark">{{ suivi.dateModif }}</span>
                  </td>

                  <!-- Actions Pédagogiques -->
                  <td class="text-end pe-4">
                    <!-- Ajouter une note / Modifier l'observation -->
                    <button
                      class="btn btn-link text-primary p-0 me-3"
                      title="Mettre à jour le suivi"
                      @click="openEditSuivi(suivi)"
                    >
                      <i class="bi bi-pencil-square fs-5"></i>
                    </button>
                    <!-- Clôturer le suivi (Marquer comme résolu) -->
                    <button
                      v-if="suivi.statut !== 'Résolu'"
                      class="btn btn-link text-success p-0"
                      title="Marquer comme résolu"
                      @click="resolveSuivi(suivi.id)"
                    >
                      <i class="bi bi-check-circle-fill fs-5"></i>
                    </button>
                  </td>
                </tr>

                <!-- Liste vide -->
                <tr v-if="filteredSuivis.length === 0">
                  <td colspan="6" class="text-center py-5">
                    <h6 class="text-muted fw-bold">
                      Aucun dossier de suivi ne correspond à ces critères
                    </h6>
                    <p class="small text-muted mb-0">
                      Tout semble en ordre au niveau des parcours étudiants.
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

const searchQuery = ref('');
const filterStatut = ref('');
const filterClasse = ref('');

// Jeu de données factices orienté suivi académique
const mockSuivis = ref([
  {
    id: 1,
    etudiantNom: 'Kaboré',
    etudiantPrenom: 'Idrissa',
    matricule: 'ETU-2026-08',
    classe: 'Master 1 Info',
    observation: 'Absences répétées depuis 2 semaines et note de 05/20 au dernier livrable.',
    statut: 'Décrochage',
    signalePar: 'Dupont',
    dateModif: '14/05/2026',
  },
  {
    id: 2,
    etudiantNom: 'Mendy',
    etudiantPrenom: 'Marie',
    matricule: 'ETU-2026-14',
    classe: 'Master 1 Info',
    observation: 'Chute brutale des résultats au second semestre en Algorithmique. À convoquer.',
    statut: 'Baisse de notes',
    signalePar: 'Dupont',
    dateModif: '16/05/2026',
  },
  {
    id: 3,
    etudiantNom: 'Diallo',
    etudiantPrenom: 'Ousmane',
    matricule: 'ETU-2025-99',
    classe: 'Master 2 Info',
    observation: 'Étudiant à besoins spécifiques (Tiers-temps accordé pour les examens).',
    statut: 'Suivi Standard',
    signalePar: 'Traoré',
    dateModif: '02/05/2026',
  },
  {
    id: 4,
    etudiantNom: 'Dubois',
    etudiantPrenom: 'Lucas',
    matricule: 'ETU-2026-55',
    classe: 'Licence 3 Management',
    observation: 'Difficultés méthodologiques résolues après la mise en place du tutorat.',
    statut: 'Résolu',
    signalePar: 'Alami',
    dateModif: '10/05/2026',
  },
]);

// Filtrage
const filteredSuivis = computed(() => {
  return mockSuivis.value.filter((suivi) => {
    const matchesSearch =
      suivi.etudiantNom.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      suivi.etudiantPrenom.toLowerCase().includes(searchQuery.value.toLowerCase());
    const matchesStatut = filterStatut.value === '' || suivi.statut === filterStatut.value;
    const matchesClasse = filterClasse.value === '' || suivi.classe === filterClasse.value;

    return matchesSearch && matchesStatut && matchesClasse;
  });
});

// Compteur pour les cartes KPI
const countAlerts = (type) => {
  return mockSuivis.value.filter((s) => s.statut === type).length;
};

// Actions
const resetFilters = () => {
  searchQuery.value = '';
  filterStatut.value = '';
  filterClasse.value = '';
};

const resolveSuivi = (id) => {
  const target = mockSuivis.value.find((s) => s.id === id);
  if (target) {
    target.statut = 'Résolu';
    target.observation += ' [Alerte résolue le ' + new Date().toLocaleDateString('fr-FR') + ']';
    target.dateModif = new Date().toLocaleDateString('fr-FR');
  }
};

const openEditSuivi = (suivi) => {
  const nouvelleObs = prompt(
    `Mettre à jour l'observation pour ${suivi.etudiantNom} :`,
    suivi.observation
  );
  if (nouvelleObs !== null) {
    suivi.observation = nouvelleObs;
    suivi.dateModif = new Date().toLocaleDateString('fr-FR');
  }
};

// Design dynamique des avatars et badges
const getStatusClass = (statut) => {
  switch (statut) {
    case 'Décrochage':
      return 'bg-soft-danger text-danger';
    case 'Baisse de notes':
      return 'bg-soft-warning text-warning-dark';
    case 'Suivi Standard':
      return 'bg-soft-primary text-primary';
    case 'Résolu':
      return 'bg-soft-success text-success';
    default:
      return 'bg-light text-secondary';
  }
};

const getAvatarColor = (statut) => {
  switch (statut) {
    case 'Décrochage':
      return 'bg-soft-danger text-danger';
    case 'Baisse de notes':
      return 'bg-soft-warning text-warning-dark';
    default:
      return 'bg-soft-secondary text-secondary';
  }
};
</script>

<style scoped>
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

/* Formatage des cartes d'alertes en couleurs adoucies */
.bg-soft-danger-card {
  background-color: rgba(220, 53, 69, 0.06);
  border: 1px solid rgba(220, 53, 69, 0.1) !important;
}
.bg-soft-warning-card {
  background-color: rgba(255, 193, 7, 0.08);
  border: 1px solid rgba(255, 193, 7, 0.15) !important;
}
.bg-soft-success-card {
  background-color: rgba(40, 167, 69, 0.06);
  border: 1px solid rgba(40, 167, 69, 0.1) !important;
}

/* Couleurs des Badges Soft */
.bg-soft-danger {
  background-color: rgba(220, 53, 69, 0.12);
  color: #dc3545;
}
.bg-soft-warning {
  background-color: rgba(255, 193, 7, 0.15);
  color: #997404;
}
.bg-soft-primary {
  background-color: rgba(0, 123, 255, 0.1);
  color: #007bff;
}
.bg-soft-success {
  background-color: rgba(40, 167, 69, 0.12);
  color: #28a745;
}
.bg-soft-secondary {
  background-color: rgba(108, 117, 125, 0.1);
  color: #6c757d;
}

.text-warning-dark {
  color: #997404;
}

/* Raccourcir le texte de l'observation si trop long */
.text-truncate-custom {
  max-width: 320px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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

.btn-white {
  background: #fff;
  border: 1px solid #edf2f9;
}
.rounded-4 {
  border-radius: 0.2rem !important;
}
.transition-all {
  transition: all 0.3s ease;
}
</style>
