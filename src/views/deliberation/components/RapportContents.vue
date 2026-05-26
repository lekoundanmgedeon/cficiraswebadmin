<template>
  <div class="container-fluid py-4 animate__animated animate__fadeIn">
    <div
      class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4"
    >
      <div>
        <h4 class="fw-bold text-dark mb-1">
          <i class="bi bi-file-earmark-bar-graph text-primary me-2"></i>Rapports & Procès-Verbaux
        </h4>
        <p class="text-muted small mb-0">
          Génération des livrables réglementaires, statistiques de réussite et synthèses de
          performance par promotion.
        </p>
      </div>
      <div class="d-flex gap-2">
        <button class="btn btn-sm btn-outline-primary rounded-pill px-3" @click="refreshData">
          <i class="bi bi-arrow-clockwise me-1"></i> Actualiser
        </button>
      </div>
    </div>

    <div class="card border-0 shadow-sm bg-light rounded-4 mb-4">
      <div class="card-body p-3">
        <div class="row g-3 align-items-end">
          <div class="col-md-4">
            <label class="form-label small fw-semibold text-muted mb-1">Année Académique</label>
            <select class="form-select border-0 shadow-sm" v-model="filters.annee">
              <option value="2025-2026">2025-2026 (En cours)</option>
              <option value="2024-2025">2024-2025</option>
            </select>
          </div>
          <div class="col-md-4">
            <label class="form-label small fw-semibold text-muted mb-1">Période / Semestre</label>
            <select class="form-select border-0 shadow-sm" v-model="filters.semestre">
              <option :value="1">Semestre Impair (S1)</option>
              <option :value="2">Semestre Pair (S2)</option>
              <option :value="0">Bilan Annuel</option>
            </select>
          </div>
          <div class="col-md-4">
            <label class="form-label small fw-semibold text-muted mb-1">Type de Session</label>
            <select class="form-select border-0 shadow-sm" v-model="filters.session">
              <option value="ORDINAIRE">Session Ordinaire</option>
              <option value="RATTRAPAGE">Session de Rattrapage</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <div class="row g-4">
      <div class="col-lg-6">
        <div class="card border-0 shadow-sm rounded-4 h-100 bg-white">
          <div class="card-header bg-white border-0 pt-4 px-4 pb-2">
            <h5 class="fw-bold text-dark mb-0">
              <i class="bi bi-shield-check text-success me-2"></i>Documents Officiels & PV
            </h5>
            <p class="text-muted small mb-0">
              Documents certifiés conformes pour signature du jury.
            </p>
          </div>
          <div class="card-body px-4">
            <div class="list-group list-group-flush">
              <div
                class="list-group-item px-0 py-3 d-flex justify-content-between align-items-center border-bottom"
              >
                <div class="d-flex align-items-center">
                  <div class="bg-success bg-opacity-10 text-success p-2 rounded-3 me-3">
                    <i class="bi bi-file-earmark-pdf fs-4"></i>
                  </div>
                  <div>
                    <h6 class="fw-bold text-dark mb-0">Procès-Verbal Global de Délibération</h6>
                    <small class="text-muted"
                      >Admissions, ajournements et classements officiels.</small
                    >
                  </div>
                </div>
                <button class="btn btn-sm btn-light border" @click="genererRapport('PV_GLOBAL')">
                  <i class="bi bi-download me-1"></i> PDF
                </button>
              </div>

              <div
                class="list-group-item px-0 py-3 d-flex justify-content-between align-items-center border-bottom"
              >
                <div class="d-flex align-items-center">
                  <div class="bg-success bg-opacity-10 text-success p-2 rounded-3 me-3">
                    <i class="bi bi-folder-symlink fs-4"></i>
                  </div>
                  <div>
                    <h6 class="fw-bold text-dark mb-0">
                      Rapport des Procès-Verbaux par EC/Matière
                    </h6>
                    <small class="text-muted">Notes détaillées signées par enseignant.</small>
                  </div>
                </div>
                <button class="btn btn-sm btn-light border" @click="genererRapport('PV_MATIERES')">
                  <i class="bi bi-download me-1"></i> ZIP
                </button>
              </div>

              <div
                class="list-group-item px-0 py-3 d-flex justify-content-between align-items-center border-0"
              >
                <div class="d-flex align-items-center">
                  <div class="bg-success bg-opacity-10 text-success p-2 rounded-3 me-3">
                    <i class="bi bi-file-earmark-excel fs-4"></i>
                  </div>
                  <div>
                    <h6 class="fw-bold text-dark mb-0">Registre des Étudiants Admis</h6>
                    <small class="text-muted">Export pour l'archivage ou l'affichage public.</small>
                  </div>
                </div>
                <button class="btn btn-sm btn-light border" @click="genererRapport('EXCEL_ADMIS')">
                  <i class="bi bi-download me-1"></i> Excel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="col-lg-6">
        <div class="card border-0 shadow-sm rounded-4 h-100 bg-white">
          <div class="card-header bg-white border-0 pt-4 px-4 pb-2">
            <h5 class="fw-bold text-dark mb-0">
              <i class="bi bi-graph-up-arrow text-primary me-2"></i>Statistiques & Graphiques de
              Session
            </h5>
            <p class="text-muted small mb-0">
              Indicateurs de performance destinés à la direction pédagogique.
            </p>
          </div>
          <div class="card-body px-4">
            <div class="list-group list-group-flush">
              <div
                class="list-group-item px-0 py-3 d-flex justify-content-between align-items-center border-bottom"
              >
                <div class="d-flex align-items-center">
                  <div class="bg-primary bg-opacity-10 text-primary p-2 rounded-3 me-3">
                    <i class="bi bi-pie-chart fs-4"></i>
                  </div>
                  <div>
                    <h6 class="fw-bold text-dark mb-0">Rapport d'Analyse des Taux de Réussite</h6>
                    <small class="text-muted"
                      >Distribution des mentions et pourcentages d'admis.</small
                    >
                  </div>
                </div>
                <button
                  class="btn btn-sm btn-light border"
                  @click="genererRapport('STATS_REUSSITE')"
                >
                  <i class="bi bi-eye me-1"></i> Visualiser
                </button>
              </div>

              <div
                class="list-group-item px-0 py-3 d-flex justify-content-between align-items-center border-bottom"
              >
                <div class="d-flex align-items-center">
                  <div class="bg-danger bg-opacity-10 text-danger p-2 rounded-3 me-3">
                    <i class="bi bi-exclamation-triangle fs-4"></i>
                  </div>
                  <div>
                    <h6 class="fw-bold text-dark mb-0">
                      Bilan des Notes Éliminatoires & Défaillances
                    </h6>
                    <small class="text-muted"
                      >Identification des matières à fort taux d'échec.</small
                    >
                  </div>
                </div>
                <button class="btn btn-sm btn-light border" @click="genererRapport('BILAN_ECHECS')">
                  <i class="bi bi-download me-1"></i> PDF
                </button>
              </div>

              <div
                class="list-group-item px-0 py-3 d-flex justify-content-between align-items-center border-0"
              >
                <div class="d-flex align-items-center">
                  <div class="bg-primary bg-opacity-10 text-primary p-2 rounded-3 me-3">
                    <i class="bi bi-award fs-4"></i>
                  </div>
                  <div>
                    <h6 class="fw-bold text-dark mb-0">Tableau d'Honneur & Majors de Promotion</h6>
                    <small class="text-muted"
                      >Extraction automatique des meilleurs profils par filière.</small
                    >
                  </div>
                </div>
                <button class="btn btn-sm btn-light border" @click="genererRapport('MAJORS')">
                  <i class="bi bi-download me-1"></i> Excel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="col-12 mt-4">
      <div class="card border-0 shadow-sm rounded-4 overflow-hidden bg-white">
        <div class="card-header bg-white border-0 pt-4 px-4 pb-2">
          <h5 class="fw-bold text-dark mb-0">
            <i class="bi bi-clock-history text-secondary me-2"></i>Historique récent des
            publications
          </h5>
        </div>
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead class="bg-light">
                <tr>
                  <th class="ps-4">Document</th>
                  <th>Généré par</th>
                  <th>Date d'édition</th>
                  <th class="text-center">Statut Coffre-Fort</th>
                  <th class="text-end pe-4">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="log in mockLogs" :key="log.id">
                  <td class="ps-4 fw-bold text-dark">
                    <i class="bi bi-file-earmark-check text-success me-2"></i>{{ log.docName }}
                  </td>
                  <td>{{ log.user }}</td>
                  <td>{{ log.date }}</td>
                  <td class="text-center">
                    <span
                      class="badge rounded-pill bg-success bg-opacity-10 text-success px-3 py-1 small"
                    >
                      <i class="bi bi-cloud-check-fill me-1"></i> Scellé & Archivé
                    </span>
                  </td>
                  <td class="text-end pe-4">
                    <button
                      class="btn btn-sm btn-link p-0 text-primary fw-bold"
                      @click="telechargerFichierArchive(log.id)"
                    >
                      Récupérer
                    </button>
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
import { ref } from 'vue';

// Filtres de recherche/génération
const filters = ref({
  annee: '2025-2026',
  semestre: 1,
  session: 'ORDINAIRE',
});

// Logs fictifs pour l'auditabilité des PV (Trame ERP Scolarité)
const mockLogs = ref([
  {
    id: 'R-901',
    docName: 'PV Semestre 1 - M1 Informatique',
    user: 'Admin Scolarité',
    date: '25/05/2026 14:32',
  },
  {
    id: 'R-902',
    docName: 'Rapport Statistiques Annuel - L3 Management',
    user: 'Secrétaire Jury',
    date: '24/05/2026 09:15',
  },
  {
    id: 'R-903',
    docName: "Tableau d'Honneur National - Bachelor",
    user: 'Direction Pédagogique',
    date: '22/05/2026 11:04',
  },
]);

// Fonction centrale pour le déclenchement des exports
const genererRapport = (typeDoc) => {
  console.log(`[Rapport Engine] Requête lancée pour le type : ${typeDoc}`);
  alert(
    `Extraction en cours...\nDocument demandé : ${typeDoc}\nPériode sélectionnée : ${filters.value.annee} - Semestre ${filters.value.semestre}\nSession : ${filters.value.session}`
  );
};

const telechargerFichierArchive = (id) => {
  console.log(`Téléchargement du document archivé ID : ${id}`);
};

const refreshData = () => {
  console.log('Mise à jour des caches des rapports effectuée.');
};
</script>

<style scoped>
/* Effet de survol élégant pour les éléments de liste */
.list-group-item {
  transition: background-color 0.2s ease-in-out;
}
.list-group-item:hover {
  background-color: var(--bs-light);
}
</style>
