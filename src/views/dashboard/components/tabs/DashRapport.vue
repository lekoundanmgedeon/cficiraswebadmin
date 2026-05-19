<template>
  <div class="dash-rapport-container">
    <!-- Section 1 : Statut des Journaux & Clôtures -->
    <div class="row g-3 mb-4">
      <!-- État de la Caisse Journalière -->
      <div class="col-md-4">
        <div
          class="card bg-white border-0 shadow-sm p-3 border-start border-success border-3 rounded-4"
        >
          <div class="d-flex align-items-center justify-content-between">
            <div>
              <span class="text-muted small fw-semibold text-uppercase d-block mb-1"
                >Journal de Caisse</span
              >
              <h5 class="fw-bold text-success mb-0">Clôturé & Balancé</h5>
            </div>
            <div class="bg-soft-success rounded p-2 text-success text-xs fw-bold font-monospace">
              <i class="bi bi-check-circle-fill me-1"></i> Ce jour
            </div>
          </div>
        </div>
      </div>

      <!-- États Prévus vs Réalisés Semestriels -->
      <div class="col-md-4">
        <div
          class="card bg-white border-0 shadow-sm p-3 border-start border-primary border-3 rounded-4"
        >
          <div class="d-flex align-items-center justify-content-between">
            <div>
              <span class="text-muted small fw-semibold text-uppercase d-block mb-1"
                >Écart Budgétaire</span
              >
              <h5 class="fw-bold text-primary mb-0 font-monospace">-1.4% (Stable)</h5>
            </div>
            <div class="bg-soft-primary rounded p-2 text-primary text-xs">
              <i class="bi bi-shield-fill-check"></i> Conforme
            </div>
          </div>
        </div>
      </div>

      <!-- Alertes d'Intégrité de Données (Audit) -->
      <div class="col-md-4">
        <div
          class="card bg-white border-0 shadow-sm p-3 border-start border-secondary border-3 rounded-4"
        >
          <div class="d-flex align-items-center justify-content-between">
            <div>
              <span class="text-muted small fw-semibold text-uppercase d-block mb-1"
                >Anomalies de Facturation</span
              >
              <h5 class="fw-bold text-secondary mb-0 font-monospace">0 Incident</h5>
            </div>
            <div class="bg-soft-secondary rounded p-2 text-secondary text-xs">
              <i class="bi bi-shield-lock-fill"></i> Sécurisé
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Section 2 : Catalogue des Rapports & Extractions Réglementaires -->
    <div class="card border-0 shadow-sm rounded-4 bg-white p-4">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h6 class="fw-bold text-dark mb-0 small text-uppercase text-secondary tracking-wider">
          <i class="bi bi-folder-fill text-primary me-2"></i>Registre des États Comptables et
          Pédagogiques
        </h6>
        <span class="text-muted text-xs font-monospace"
          >Format d'export standardisé : PDF / XLSX</span
        >
      </div>

      <div class="table-responsive">
        <table class="table table-hover align-middle mb-0 text-center text-sm">
          <thead class="bg-light text-secondary text-xs">
            <tr>
              <th class="text-start ps-3" style="width: 40%">Nom de l'état / Rapport Comptable</th>
              <th>Périodicité</th>
              <th>Date de Calcul</th>
              <th class="text-end pe-3">Actions de téléchargement</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="rapport in catalogueRapports" :key="rapport.id">
              <!-- Libellé du rapport -->
              <td class="text-start ps-3">
                <div class="d-flex align-items-center">
                  <div class="p-2 bg-light rounded text-secondary me-2">
                    <i class="bi fs-6" :class="rapport.icone"></i>
                  </div>
                  <div>
                    <span class="fw-bold text-dark d-block text-xs">{{ rapport.titre }}</span>
                    <small class="text-muted text-xs">{{ rapport.description }}</small>
                  </div>
                </div>
              </td>

              <!-- Période -->
              <td>
                <span
                  class="badge bg-light text-secondary font-monospace border rounded text-xs px-2 py-1"
                >
                  {{ rapport.periode }}
                </span>
              </td>

              <!-- Horodatage -->
              <td class="font-monospace text-xs text-muted">{{ rapport.derniereGen }}</td>

              <!-- Boutons de Sortie d'impression -->
              <td class="text-end pe-3">
                <div class="btn-group shadow-sm rounded overflow-hidden">
                  <button
                    @click="genererRapport(rapport, 'excel')"
                    class="btn btn-xs btn-white border border-end-0 py-1 px-2 text-xs"
                    title="Exporter XLSX"
                  >
                    <i class="bi bi-file-earmark-excel text-success me-1"></i> Excel
                  </button>
                  <button
                    @click="genererRapport(rapport, 'pdf')"
                    class="btn btn-xs btn-white border py-1 px-2 text-xs"
                    title="Générer PDF Acté"
                  >
                    <i class="bi bi-file-earmark-pdf text-danger me-1"></i> PDF
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const catalogueRapports = ref([
  {
    id: 1,
    titre: 'Balance des Comptes Étudiants',
    description: 'État nominatif des restes à recouvrer par promotion et par cohorte.',
    icone: 'bi-file-earmark-ruled',
    periode: 'Mensuel',
    derniereGen: '19/05/2026 08:30',
  },
  {
    id: 2,
    titre: 'Grand Livre de Caisse & Banques',
    description: 'Historique exhaustif des encaissements physiques et dépôts chèques/virements.',
    icone: 'bi-cash-coin',
    periode: 'Journalier',
    derniereGen: '19/05/2026 10:00',
  },
  {
    id: 3,
    titre: 'Bilan de Consommation des Vacations',
    description: 'Évaluation des honoraires dus face au budget provisionnel alloué par pôle.',
    icone: 'bi-calculator',
    periode: 'Trimestriel',
    derniereGen: '15/05/2026 18:00',
  },
  {
    id: 4,
    titre: 'Rapport Annuel des Taux de Rétention',
    description: 'Statistiques de réinscription et taux de démission/abandon inter-cycles.',
    icone: 'bi-graph-up-arrow',
    periode: 'Annuel',
    derniereGen: '30/04/2026 12:00',
  },
]);

const genererRapport = (rapport, type) => {
  alert(
    `Extraction lancée pour le rapport :\n"${rapport.titre}"\nFormat cible : ${type.toUpperCase()}\nStatut : Génération à la volée réussie.`
  );
};
</script>

<style scoped>
/* Couleurs Flat ERP Standard */
.bg-soft-primary {
  background-color: rgba(0, 123, 255, 0.08);
}
.bg-soft-success {
  background-color: rgba(40, 167, 69, 0.12);
}
.bg-soft-secondary {
  background-color: rgba(108, 117, 125, 0.1);
}

.text-xs {
  font-size: 11px !important;
}
.tracking-wider {
  letter-spacing: 0.5px;
}

.table th {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: #6c757d;
  border: none;
}

.table tbody tr {
  border-bottom: 1px solid #f8f9fa;
  transition: background-color 0.1s ease;
}

.btn-white {
  background-color: #ffffff;
  color: #495057;
}
.btn-white:hover {
  background-color: #f8f9fa;
  color: #212529;
}

/* Alignement structurel strict de la charte ERP (Coins adoucis fins) */
.rounded-4 {
  border-radius: 0.2rem !important;
}
</style>
