<template>
  <div>
    <div class="row">
      <div class="col-md-12 grid-margin">
        <div class="d-flex justify-content-between flex-wrap">
          <div class="d-flex align-items-end flex-wrap">
            <div class="me-md-3 me-xl-5">
              <h2 class="fw-bold text-dark mb-1">Notes & Résultats</h2>
              <p class="text-muted small mb-0">Attributions et suivi des notes de contrôles continus et examens</p>
            </div>
            <div class="d-flex shadow-sm bg-white rounded px-3 py-2 border mb-2 mb-md-0">
              <i class="mdi mdi-home text-muted hover-cursor"></i>
              <p class="text-muted mb-0 hover-cursor">&nbsp;/&nbsp;Scolarité&nbsp;/&nbsp;</p>
              <p class="text-primary mb-0 hover-cursor fw-bold">Notes</p>
            </div>
          </div>
          
          <div class="d-flex justify-content-between align-items-end flex-wrap gap-2">
            <button class="btn btn-outline-dark shadow-sm btn-sm px-3" @click="exportData">
              <i class="mdi mdi-file-export me-1"></i>Exporter
            </button>
            <div class="btn-group shadow-sm">
              <router-link to="/addNotes" class="btn btn-primary btn-sm px-3">
                <i class="mdi mdi-plus-circle me-1"></i> Saisir des notes
              </router-link>
              <button
                type="button"
                class="btn btn-primary btn-sm dropdown-toggle dropdown-toggle-split"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <span class="visually-hidden">Toggle Dropdown</span>
              </button>
              <ul class="dropdown-menu shadow-sm">
                <li><a class="dropdown-item" href="#" @click.prevent="triggerImport('CSV')">Importer un fichier CSV</a></li>
                <li><a class="dropdown-item" href="#" @click.prevent="triggerImport('EXCEL')">Importer un fichier Excel</a></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="row mb-4" v-if="activeTab !== 'overview'">
      <div class="col-12">
        <div class="card border-0 shadow-sm bg-light">
          <div class="card-body p-3 d-flex flex-wrap justify-content-between align-items-center gap-3">
            <div class="btn-group shadow-sm bg-white rounded p-1" role="group">
              <button 
                v-for="semestre in [1, 2]" 
                :key="semestre"
                :class="['btn btn-sm rounded px-4', selectedSemestre === semestre ? 'btn-primary' : 'btn-white border-0 text-muted']"
                @click="selectedSemestre = semestre"
              >
                Semestre {{ semestre }}
              </button>
            </div>
            <div class="input-group bg-white rounded shadow-sm w-50" style="min-width: 250px;">
              <span class="input-group-text bg-white border-0">
                <i class="mdi mdi-magnify text-primary"></i>
              </span>
              <input
                type="text"
                class="form-control border-0"
                placeholder="Rechercher une classe ou filière..."
                v-model="searchQuery"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="row">
      <div class="col-md-12 grid-margin stretch-card">
        <div class="card border-0 shadow-sm rounded-4 overflow-hidden">
          
          <SkeletonLoader v-if="classeStore.loading" type="table" :rows="5" :columns="6" />
          
          <div v-else class="card-body p-0">
            <ul class="nav nav-tabs px-4 pt-3 bg-light" role="tablist">
              <li class="nav-item">
                <a class="nav-link active fw-bold" data-bs-toggle="tab" href="#overview" @click="activeTab = 'overview'">
                  <i class="mdi mdi-view-dashboard me-1"></i>Vue d'ensemble
                </a>
              </li>
              <li class="nav-item">
                <a class="nav-link fw-bold" data-bs-toggle="tab" href="#evaluations-list" @click="activeTab = 'CC'">
                  📚 Contrôles Continus (CC)
                </a>
              </li>
              <li class="nav-item">
                <a class="nav-link fw-bold" data-bs-toggle="tab" href="#evaluations-list" @click="activeTab = 'SESSION_ORDINAIRE'">
                  🎓 Sessions Ordinaires
                </a>
              </li>
              <li class="nav-item">
                <a class="nav-link fw-bold" data-bs-toggle="tab" href="#evaluations-list" @click="activeTab = 'RATTRAPAGE'">
                  🔄 Sessions de Rappel
                </a>
              </li>
            </ul>

            <div class="tab-content p-4">
              <div class="tab-pane fade show active" id="overview" role="tabpanel">
                <h4 class="fw-bold text-dark mb-1">État Global des Évaluations Académiques</h4>
                <p class="text-muted small mb-4">Résumé de la complétude des saisies par classe pour l'année en cours</p>
                
                <div class="table-responsive">
                  <table class="table table-hover align-middle">
                    <thead class="bg-light">
                      <tr>
                        <th class="ps-3">Classe</th>
                        <th>Filière</th>
                        <th class="text-center">Saisie CC</th>
                        <th class="text-center">Saisie Examens</th>
                        <th class="text-center">Délibération</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="classe in filteredClasses" :key="classe.classe_id">
                        <td class="ps-3 fw-bold text-primary">{{ classe.classe_code }}</td>
                        <td>{{ classe.filiere_nom || 'N/A' }}</td>
                        <td class="text-center">
                          <span class="badge bg-soft-success text-success rounded-pill px-3 py-2">Terminée</span>
                        </td>
                        <td class="text-center">
                          <span class="badge bg-soft-warning text-dark rounded-pill px-3 py-2">En cours</span>
                        </td>
                        <td class="text-center">
                          <span class="badge bg-soft-danger text-white rounded-pill px-3 py-2">En attente</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div class="tab-pane fade" id="evaluations-list" role="tabpanel">
                <div class="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <h4 class="fw-bold text-dark mb-0">Classes & Parcours — {{ currentTabLabel }}</h4>
                    <p class="text-muted small mb-0">Suivi du Semestre {{ selectedSemestre }}</p>
                  </div>
                </div>

                <div class="table-responsive">
                  <table class="table table-hover align-middle">
                    <thead class="bg-light">
                      <tr>
                        <th class="ps-3">Code Classe</th>
                        <th>Filière Affectée</th>
                        <th class="text-center">Semestre</th>
                        <th class="text-center">Type Évaluation</th>
                        <th class="text-center">État de Saisie</th>
                        <th class="text-end pe-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="classe in filteredClasses" :key="classe.classe_id">
                        <td class="ps-3 fw-bold text-dark">{{ classe.classe_code }}</td>
                        <td>{{ classe.filiere_nom }}</td>
                        <td class="text-center">
                          <span class="badge bg-light text-dark border px-3 py-1">S{{ selectedSemestre }}</span>
                        </td>
                        <td class="text-center">
                          <small class="fw-semibold text-uppercase text-muted">{{ activeTab }}</small>
                        </td>
                        <td class="text-center">
                          <span :class="['status-badge px-3 py-2 rounded-pill small', classe.effectif_actuel % 2 === 0 ? 'status-active text-success bg-soft-success' : 'status-draft text-warning bg-soft-warning']">
                            {{ classe.effectif_actuel % 2 === 0 ? 'Validé & Clos' : 'Partiel / À compléter' }}
                          </span>
                        </td>
                        <td class="text-end pe-3">
                          <div class="dropdown">
                            <button class="btn btn-sm btn-outline-primary dropdown-toggle px-3" data-bs-toggle="dropdown">
                              <i class="mdi mdi-dots-horizontal me-1"></i> Gérer
                            </button>
                            <ul class="dropdown-menu shadow-sm dropdown-menu-end">
                              <li><a class="dropdown-item" href="#" @click.prevent="consulterNotes(classe)">Voir les notes</a></li>
                              <li><a class="dropdown-item" href="#" @click.prevent="ouvrirSaisieRapide(classe)">Modifier les saisies</a></li>
                              <li class="dropdown-divider"></li>
                              <li><a class="dropdown-item text-success" href="#" @click.prevent="validerNotesSession(classe)">Valider définitivement</a></li>
                            </ul>
                          </div>
                        </td>
                      </tr>
                      <tr v-if="filteredClasses.length === 0">
                        <td colspan="6" class="text-center py-5">
                          <p class="text-muted mb-0">Aucun enregistrement ne correspond aux filtres appliqués.</p>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import SkeletonLoader from '@/components/SkeletonLoader.vue';
import { useClasseStore } from '@/stores/academiqueStore/classeStore';

const classeStore = useClasseStore();

// Filtres et États réactifs locaux
const activeTab = ref('overview'); // Types gérés : 'overview', 'CC', 'SESSION_ORDINAIRE', 'RATTRAPAGE'
const selectedSemestre = ref(1);
const searchQuery = ref('');

// Libellé dynamique pour l'affichage textuel de l'onglet courant
const currentTabLabel = computed(() => {
  switch (activeTab.value) {
    case 'CC': return 'Contrôles Continus';
    case 'SESSION_ORDINAIRE': return 'Examens Partiels (Ordinaires)';
    case 'RATTRAPAGE': return 'Sessions de Rattrapage';
    default: return 'Général';
  }
});

// Récupération sécurisée et centralisée des classes via le store existant
const classes = computed(() => Array.isArray(classeStore.classes) ? classeStore.classes : []);

// Filtrage multi-critères : Recherche textuelle unifiée (Code classe ou Nom Filière)
const filteredClasses = computed(() => {
  return classes.value.filter((c) => {
    const q = searchQuery.value.toLowerCase().trim();
    const matchSearch = !q || 
                        c.classe_code?.toLowerCase().includes(q) || 
                        c.filiere_nom?.toLowerCase().includes(q);
    return matchSearch;
  });
});

// Lifecycle : Chargement initial unifié
onMounted(() => {
  classeStore.fetchClasses();
});

// Reset des recherches lors du changement de contexte d'onglets
watch(activeTab, () => {
  searchQuery.value = '';
});

/* ===================== Logique métier & placeholders d'intégration backend ===================== */
const consulterNotes = (classe) => {
  console.log(`Consultation des notes de la classe: ${classe.classe_code} (Type: ${activeTab.value}, Semestre: ${selectedSemestre.value})`);
};

const ouvrirSaisieRapide = (classe) => {
  console.log(`Redirection ou ouverture de la grille d'édition pour la classe: ${classe.classe_code}`);
};

const validerNotesSession = (classe) => {
  console.log(`Verrouillage et envoi des validations pour la classe: ${classe.classe_code}`);
};

const triggerImport = (format) => {
  console.log(`Déclenchement du flux d'importation au format : ${format}`);
};

const exportData = () => {
  console.log(`Génération des fichiers d'extraction pour le type : ${activeTab.value}`);
};
</script>

