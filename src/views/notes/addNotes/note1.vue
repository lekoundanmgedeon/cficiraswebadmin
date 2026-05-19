<template>
  <div class="notes-results-container">
    <!-- Section En-tête : Fil d'ariane et Actions Principales -->
    <div class="row mb-4">
      <div class="col-md-12 grid-margin">
        <div class="d-flex justify-content-between align-items-center flex-wrap gap-3">
          
          <!-- Titre et Fil d'Ariane -->
          <div class="d-flex align-items-center flex-wrap gap-md-4">
            <div>
              <h4 class="fw-bold text-dark mb-1">Notes & Résultats</h4>
              <p class="text-muted text-xs mb-0">Attributions des notes de devoirs, examens et sessions de rattrapage.</p>
            </div>
            <div class="d-flex text-xs bg-light px-3 py-2 rounded font-monospace">
              <span class="text-muted">Scolarité</span>
              <span class="text-muted mx-2">/</span>
              <span class="text-primary fw-bold">Notes</span>
            </div>
          </div>

          <!-- Bloc Boutons d'Action Haut -->
          <div class="d-flex align-items-center gap-2 flex-wrap">
            <button @click="exporterDonneesGlobal" class="btn btn-sm btn-light border text-xs px-3">
              <i class="bi bi-file-earmark-arrow-up me-1"></i> Exporter
            </button>
            
            <!-- Bouton Split Droite : Attribution de notes -->
            <div class="btn-group shadow-sm">
              <button
                type="button"
                class="btn btn-sm btn-primary text-xs"
                data-bs-toggle="modal"
                data-bs-target="#exampleModal"
                data-bs-backdrop="static"
                data-bs-keyboard="false"
              >
                <i class="bi bi-plus-lg me-1"></i> Attribuer des notes
              </button>
              <button
                type="button"
                class="btn btn-sm btn-primary dropdown-toggle dropdown-toggle-split shadow-none"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <span class="visually-hidden">Toggle Dropdown</span>
              </button>
              <ul class="dropdown-menu dropdown-menu-end text-xs shadow border-0 py-1">
                <li><a class="dropdown-item py-2" href="#overview"><i class="bi bi-person me-2"></i>Par classe</a></li>
                <li><a class="dropdown-item py-2" href="#overview"><i class="bi bi-tags me-2"></i>Par filière</a></li>
                <li><hr class="dropdown-divider my-1"></li>
                <li><a class="dropdown-item py-2 text-primary fw-semibold" href="#!"><i class="bi bi-cloud-upload me-2"></i>Importer un fichier (Excel)</a></li>
              </ul>
            </div>
          </div>

        </div>
      </div>
    </div>

    <!-- Section Principale : Onglets & Tableaux -->
    <div class="row">
      <div class="col-md-12 grid-margin stretch-card">
        <div class="card border-0 shadow-sm rounded-4 overflow-hidden bg-white">
          
          <!-- Loader d'attente réseau -->
          <SkeletonLoader v-if="loading" type="table" :rows="4" :columns="6" class="p-4" />
          
          <div v-else class="card-body p-0">
            <!-- Barre de Navigation des Onglets Harmonisée -->
            <ul class="nav nav-tabs px-4 pt-3 bg-light border-bottom" role="tablist">
              <li class="nav-item">
                <a class="nav-link active text-xs fw-bold px-3 py-2" id="overview-tab" data-bs-toggle="tab" href="#overview" role="tab" aria-selected="true">Tout</a>
              </li>
              <li class="nav-item">
                <a class="nav-link text-xs fw-bold px-3 py-2" id="devoirf-tab" data-bs-toggle="tab" href="#devoirf" role="tab" aria-selected="false">Devoirs</a>
              </li>
              <li class="nav-item">
                <a class="nav-link text-xs fw-bold px-3 py-2" id="sales-tab" data-bs-toggle="tab" href="#sales" role="tab" aria-selected="false">Sessions Ordinaires</a>
              </li>
              <li class="nav-item">
                <a class="nav-link text-xs fw-bold px-3 py-2" id="rappels-tab" data-bs-toggle="tab" href="#sessions-rappels" role="tab" aria-selected="false">Sessions de Rappels</a>
              </li>
              <li class="nav-item">
                <a class="nav-link text-xs fw-bold px-3 py-2" id="publications-tab" data-bs-toggle="tab" href="#publications" role="tab" aria-selected="false">Publications</a>
              </li>
            </ul>

            <!-- Contenus des Onglets -->
            <div class="tab-content p-4">
              
              <!-- ONGLET 1 : TOUT (Liste des étudiants) -->
              <div class="tab-pane fade show active" id="overview" role="tabpanel" aria-labelledby="overview-tab">
                <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                  <div>
                    <h5 class="card-title text-dark fw-bold mb-1">Registre Général des Apprenants</h5>
                    <p class="text-muted text-xs mb-0">Liste des étudiants inscrits rattachés aux procès-verbaux de notes.</p>
                  </div>
                  <div class="d-flex gap-2">
                    <button class="btn btn-xs btn-light border text-xs px-2" title="Filtrer la liste"><i class="bi bi-filter"></i></button>
                    <button class="btn btn-xs btn-light border text-xs px-2" title="Exporter XLSX"><i class="bi bi-file-earmark-excel"></i></button>
                    <a href="/addNotes" class="btn btn-xs btn-primary text-xs font-semibold px-3">Saisir Directe</a>
                  </div>
                </div>

                <div class="table-responsive">
                  <table class="table table-hover align-middle mb-0 text-center text-sm">
                    <thead class="bg-light text-secondary text-xs">
                      <tr>
                        <th class="text-start ps-3">Matricule</th>
                        <th>Nom Complet</th>
                        <th>Adresse Email</th>
                        <th>Téléphone</th>
                        <th class="text-end pe-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="etu in etudiants" :key="etu.id">
                        <td class="text-start ps-3 font-monospace fw-bold text-xs text-primary">{{ etu.matricule }}</td>
                        <td class="fw-bold text-dark text-xs text-uppercase">{{ etu.nom }} {{ etu.prenom }}</td>
                        <td class="text-muted text-xs font-monospace">{{ etu.email }}</td>
                        <td class="text-muted text-xs font-monospace">{{ etu.telephone }}</td>
                        <td class="text-end pe-3">
                          <button class="btn btn-xs btn-light p-1 text-secondary border-0" title="Consulter le livret scolaire">
                            <i class="bi bi-eye-fill"></i>
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- ONGLET 2 : DEVOIRS -->
              <div class="tab-pane fade" id="devoirf" role="tabpanel" aria-labelledby="devoirf-tab">
                <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
                  <div>
                    <h5 class="card-title text-dark fw-bold mb-1">Suivi Évaluations Continues (Devoirs)</h5>
                    <p class="text-muted text-xs mb-0">Clôture et état d'avancement des notes de contrôle continu.</p>
                  </div>
                  <div class="btn-group btn-group-sm rounded overflow-hidden">
                    <button class="btn btn-outline-dark text-xs px-3 active">Semestre 1</button>
                    <button class="btn btn-outline-dark text-xs px-3">Semestre 2</button>
                  </div>
                </div>
                <div class="table-responsive">
                  <table class="table table-hover align-middle mb-0 text-center text-sm">
                    <thead class="bg-light text-secondary text-xs">
                      <tr>
                        <th>Code</th>
                        <th>Désignation de la Classe</th>
                        <th>Niveau d'Étude</th>
                        <th>Type Éval.</th>
                        <th>Statut Clôture</th>
                        <th class="text-end pe-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="classe in classesParcours.filter(c => c.type === 'Devoir')" :key="classe.id">
                        <td class="font-monospace text-xs fw-bold">{{ classe.id }}</td>
                        <td class="fw-bold text-dark text-xs text-start">{{ classe.designation }}</td>
                        <td class="text-muted text-xs">{{ classe.niveau }}</td>
                        <td><span class="badge bg-light text-dark border text-xs px-2">{{ classe.examen }}</span></td>
                        <td>
                          <span class="badge text-xs px-2 py-1 rounded font-semibold" :class="classe.complet ? 'bg-soft-success text-success' : 'bg-soft-warning text-warning'">
                            {{ classe.complet ? 'Validé & Figé' : 'Saisie En Cours' }}
                          </span>
                        </td>
                        <td class="text-end pe-3">
                          <button class="btn btn-xs btn-light border-0 p-1 text-primary"><i class="bi bi-pencil-square"></i></button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- ONGLET 3 : SESSIONS ORDINAIRES -->
              <div class="tab-pane fade" id="sales" role="tabpanel" aria-labelledby="sales-tab">
                <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
                  <div>
                    <h5 class="card-title text-dark fw-bold mb-1">Examens Terminaux (Partiels)</h5>
                    <p class="text-muted text-xs mb-0">Comptes rendus et validation des épreuves de fin de semestre ordinaires.</p>
                  </div>
                  <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-dark text-xs px-3 active">Semestre 1</button>
                    <button class="btn btn-outline-dark text-xs px-3">Semestre 2</button>
                  </div>
                </div>
                <div class="table-responsive">
                  <table class="table table-hover align-middle mb-0 text-center text-sm">
                    <thead class="bg-light text-secondary text-xs">
                      <tr>
                        <th>N°</th>
                        <th>Désignation Classe</th>
                        <th>Niveau</th>
                        <th>Épreuve</th>
                        <th>Validation</th>
                        <th class="text-end pe-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="classe in classesParcours.filter(c => c.type === 'Ordinaire')" :key="classe.id">
                        <td class="font-monospace text-xs">{{ classe.id }}</td>
                        <td class="fw-bold text-dark text-xs text-start">{{ classe.designation }}</td>
                        <td class="text-muted text-xs">{{ classe.niveau }}</td>
                        <td><span class="badge bg-light text-dark border text-xs px-2">{{ classe.examen }}</span></td>
                        <td>
                          <span class="badge text-xs px-2 py-1 rounded font-semibold" :class="classe.complet ? 'bg-soft-success text-success' : 'bg-soft-secondary text-secondary'">
                            {{ classe.complet ? 'Complet' : 'N/A (En attente)' }}
                          </span>
                        </td>
                        <td class="text-end pe-3">
                          <div class="dropdown">
                            <button class="btn btn-sm btn-light border text-xs px-2 py-1" data-bs-toggle="dropdown">⚙️ ...</button>
                            <ul class="dropdown-menu dropdown-menu-end text-xs shadow border-0">
                              <li><a class="dropdown-item py-2" href="#!"><i class="bi bi-info-circle me-2"></i>Détails PV</a></li>
                              <li><a class="dropdown-item py-2" href="#!"><i class="bi bi-plus-circle me-2"></i>Ajouter Éléments</a></li>
                              <li><hr class="dropdown-divider"></li>
                              <li><a class="dropdown-item py-2 text-danger fw-semibold" href="#!"><i class="bi bi-trash me-2"></i>Réinitialiser</a></li>
                            </ul>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- ONGLET 4 : SESSIONS DE RAPPELS (ID Corrigé et distinct) -->
              <div class="tab-pane fade" id="sessions-rappels" role="tabpanel" aria-labelledby="rappels-tab">
                <div class="d-flex justify-content-between align-items-center mb-4">
                  <div>
                    <h5 class="card-title text-dark fw-bold mb-1">Rattrapages & Sessions de Rappels</h5>
                    <p class="text-muted text-xs mb-0">Registre d'attribution des notes de seconde chance.</p>
                  </div>
                </div>
                <div class="text-center text-muted py-5 text-xs">
                  <i class="bi bi-calendar2-x fs-3 d-block mb-2 text-secondary"></i>
                  Aucun procès-verbal de rattrapage ouvert pour le semestre en cours.
                </div>
              </div>

              <!-- ONGLET 5 : PUBLICATIONS (ID Corrigé et distinct) -->
              <div class="tab-pane fade" id="publications" role="tabpanel" aria-labelledby="publications-tab">
                <div class="d-flex justify-content-between align-items-center mb-4">
                  <div>
                    <h5 class="card-title text-dark fw-bold mb-1">Déploiement & Visibilité Étudiante</h5>
                    <p class="text-muted text-xs mb-0">Contrôle de la publication des notes sur les portails webs mobiles des apprenants.</p>
                  </div>
                </div>
                <div class="text-center text-muted py-5 text-xs">
                  <i class="bi bi-cloud-check fs-3 d-block mb-2 text-success"></i>
                  Toutes les notes validées du Semestre 1 sont actuellement en ligne et visibles.
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
import { ref, onMounted } from 'vue';
import SkeletonLoader from '@/components/SkeletonLoader.vue';

const loading = ref(true);

// Jeux de données standardisés et typés pour l'ERP
const etudiants = ref([]);
const classesParcours = ref([]);

onMounted(() => {
  // Simulation de la latence du serveur CFI-CIRAS
  setTimeout(() => {
    etudiants.value = [
      { id: 1, matricule: 'ETU-2026-001', nom: 'DOE', prenom: 'John', email: 'johdoe@gmail.com', telephone: '+242066034357' },
      { id: 2, matricule: 'ETU-2026-002', nom: 'DIALLO', prenom: 'Ibrahima', email: 'i.diallo@cficiras.sn', telephone: '+221771234567' },
      { id: 3, matricule: 'ETU-2026-003', nom: 'NDIAYE', prenom: 'Awa', email: 'a.ndiaye@cficiras.sn', telephone: '+221789876543' }
    ];

    classesParcours.value = [
      { id: 1, designation: 'LIC A1', niveau: '1ère Année', examen: 'Partiel S1', complet: true, type: 'Ordinaire' },
      { id: 2, designation: 'LIC B1', niveau: '1ère Année', examen: 'Partiel S1', complet: false, type: 'Ordinaire' },
      { id: 3, designation: 'LIC A2', niveau: '2ème Année', examen: 'Partiel S1', complet: true, type: 'Ordinaire' },
      { id: 4, designation: 'MASTER 1-INFO', niveau: 'M1 Professionnel', examen: 'Contrôle Continu', complet: false, type: 'Devoir' },
      { id: 5, designation: 'MASTER 2-MGMT', niveau: 'M2 Exécutif', examen: 'Étude de cas', complet: true, type: 'Devoir' }
    ];
    
    loading.value = false;
  }, 1500);
});

const exporterDonneesGlobal = () => {
  alert("Génération et téléchargement de la synthèse globale Excel (.xlsx) lancée.");
};
</script>

<style scoped>
/* Design System harmonisé (Teintes douces Flat UI) */
.bg-soft-success { background-color: rgba(40, 167, 69, 0.12); }
.bg-soft-warning { background-color: rgba(255, 193, 7, 0.15); }
.bg-soft-secondary { background-color: rgba(108, 117, 125, 0.1); }

.text-xs { font-size: 11px !important; }
.tracking-wider { letter-spacing: 0.5px; }

/* Entêtes strictes de l'ERP */
.table th {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: #6c757d;
  border: none;
  background-color: #f8f9fa;
}

.table tbody tr {
  border-bottom: 1px solid #f8f9fa;
  transition: background-color 0.15s ease;
}
.table tbody tr:hover {
  background-color: rgba(0, 123, 255, 0.01);
}

.nav-tabs .nav-link {
  color: #6c757d;
  border: none;
  border-bottom: 2px solid transparent;
}
.nav-tabs .nav-link.active {
  color: #007bff !important;
  background-color: transparent;
  border-bottom: 2px solid #007bff;
}

.rounded-4 {
  border-radius: 0.2rem !important;
}
</style>