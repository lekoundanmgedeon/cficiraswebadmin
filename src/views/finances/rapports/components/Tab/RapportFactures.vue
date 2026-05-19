<template>
  <div class="rapport-facture-container">
    <!-- Header de la section -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h3 class="fw-bold mb-1">Rapports & Analyse des Factures</h3>
        <p class="text-muted small mb-0">
          <i class="bi bi-file-earmark-bar-graph me-1"></i>
          Audit du recouvrement, balance âgée des créances et statistiques d'émissions.
        </p>
      </div>

      <!-- Action d'export global -->
      <button @click="exportGlobalAudit" class="btn btn-sm btn-dark border-0 shadow-sm py-2 px-3">
        <i class="bi bi-file-earmark-pdf-fill me-1 text-danger"></i> Exporter le Rapport d'Audit
        (.PDF)
      </button>
    </div>

    <!-- Section 1 : Analyse Chronologique des Impayés (Balance Âgée) -->
    <div class="card border-0 shadow-sm rounded-4 bg-white mb-4">
      <div class="card-header bg-white border-0 pt-4 px-4 pb-1">
        <h5 class="fw-bold text-dark mb-1">
          <i class="bi bi-clock-history text-danger me-2"></i>Balance Âgée des Créances
        </h5>
        <p class="text-muted text-xs mb-0">
          Répartition des sommes facturées non encaissées par ancienneté de dépassement de la date
          d'échéance.
        </p>
      </div>

      <div class="card-body p-4 pt-2">
        <div class="row g-3">
          <!-- Créances Courantes -->
          <div class="col-md-3">
            <div class="p-3 rounded bg-light border-start border-3 border-success">
              <span class="text-muted small fw-semibold d-block mb-1">Saines (-30 jours)</span>
              <h5 class="fw-bold text-dark font-monospace mb-1">
                {{ formatPrice(balanceAgee.saines) }}
              </h5>
              <div class="text-xs text-success">
                <i class="bi bi-shield-check me-1"></i>Risque faible
              </div>
            </div>
          </div>

          <!-- En retard 30-60 Jours -->
          <div class="col-md-3">
            <div class="p-3 rounded bg-light border-start border-3 border-warning">
              <span class="text-muted small fw-semibold d-block mb-1">Retard Modéré (30-60 j)</span>
              <h5 class="fw-bold text-warning font-monospace mb-1">
                {{ formatPrice(balanceAgee.modere) }}
              </h5>
              <div class="text-xs text-warning">
                <i class="bi bi-exclamation-triangle me-1"></i>Relance requise
              </div>
            </div>
          </div>

          <!-- En retard 60-90 Jours -->
          <div class="col-md-3">
            <div class="p-3 rounded bg-light border-start border-3 border-orange">
              <span class="text-muted small fw-semibold d-block mb-1"
                >Retard Critique (60-90 j)</span
              >
              <h5 class="fw-bold text-orange font-monospace mb-1">
                {{ formatPrice(balanceAgee.critique) }}
              </h5>
              <div class="text-xs text-orange">
                <i class="bi bi-telephone-outbound me-1"></i>Relance directe
              </div>
            </div>
          </div>

          <!-- Contentieux +90 Jours -->
          <div class="col-md-3">
            <div class="p-3 rounded bg-light border-start border-3 border-danger">
              <span class="text-muted small fw-semibold d-block mb-1">Contentieux (+90 jours)</span>
              <h5 class="fw-bold text-danger font-monospace mb-1">
                {{ formatPrice(balanceAgee.contentieux) }}
              </h5>
              <div class="text-xs text-danger">
                <i class="bi bi-slash-circle me-1"></i>Blocage académique
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Section 2 : Top des comptes débiteurs à cibler -->
    <div class="card border-0 shadow-sm rounded-4 overflow-hidden bg-white">
      <div class="card-header bg-white border-0 pt-4 px-4 pb-2">
        <h5 class="fw-bold text-dark mb-0">
          <i class="bi bi-list-ol text-primary me-2"></i>Top 5 des Plus Grands Restes à Recouvrer
          Individuels
        </h5>
      </div>

      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0 text-center">
            <thead class="bg-light text-secondary small">
              <tr>
                <th class="ps-4 py-3 text-start">Étudiant / Matricule</th>
                <th class="text-start">Filière & Classe</th>
                <th>Total Facturé</th>
                <th>Déjà Réglé</th>
                <th>Dette Restante</th>
                <th class="text-end pe-4">Niveau de Risque</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in debiteursTop" :key="row.matricule">
                <!-- Identité -->
                <td class="ps-4 text-start">
                  <div class="fw-bold text-dark">{{ row.nom }}</div>
                  <small class="text-muted font-monospace text-xs">{{ row.matricule }}</small>
                </td>
                <!-- Classe -->
                <td class="text-start text-secondary fw-semibold small">
                  <div>{{ row.filiere }}</div>
                  <small class="text-muted">{{ row.classe }}</small>
                </td>
                <!-- Facturé -->
                <td class="font-monospace text-muted small">{{ formatPrice(row.total) }}</td>
                <!-- Réglé -->
                <td class="font-monospace text-success fw-semibold small">
                  {{ formatPrice(row.regle) }}
                </td>
                <!-- Solde restant -->
                <td class="font-monospace fw-bold text-danger">
                  {{ formatPrice(row.total - row.regle) }}
                </td>
                <!-- Niveau d'alerte risque -->
                <td class="text-end pe-4">
                  <span class="badge px-2 py-1 rounded" :class="getRiskBadgeClass(row.joursRetard)">
                    <i class="bi bi-circle-fill me-1" style="font-size: 6px"></i> +{{
                      row.joursRetard
                    }}
                    jours de retard
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

// Répartition analytique temporelle des impayés (Balance Âgée)
const balanceAgee = ref({
  saines: 1850000, // Factures récentes non échues
  modere: 750000, // Échéance dépassée de 30-60j
  critique: 450000, // Échéance dépassée de 60-90j
  contentieux: 150000, // Échéance dépassée de +90j
});

// Top des dossiers nécessitant un arbitrage immédiat
const debiteursTop = ref([
  {
    matricule: 'ETU-2026-003',
    nom: 'Modou Fall',
    filiere: 'Informatique',
    classe: 'M1-JV',
    total: 450000,
    regle: 0,
    joursRetard: 95,
  },
  {
    matricule: 'ETU-2026-114',
    nom: 'Ibrahima Diallo',
    filiere: 'Génie Civil',
    classe: 'L3-B',
    total: 600000,
    regle: 200000,
    joursRetard: 64,
  },
  {
    matricule: 'ETU-2026-001',
    nom: 'Amath Sarr',
    filiere: 'Informatique',
    classe: 'L1-A',
    total: 500000,
    regle: 350000,
    joursRetard: 42,
  },
  {
    matricule: 'ETU-2026-088',
    nom: 'Amy Ndiaye',
    filiere: 'Management',
    classe: 'M2-FI',
    total: 750000,
    regle: 600000,
    joursRetard: 35,
  },
  {
    matricule: 'ETU-2026-204',
    nom: 'Oumar Sy',
    filiere: 'Droit',
    classe: 'L2-A',
    total: 300000,
    regle: 150000,
    joursRetard: 12,
  },
]);

const formatPrice = (val) => {
  return new Intl.NumberFormat('fr-FR').format(val) + ' FCFA';
};

// Logique de couleur adaptative selon le palier de la balance âgée
const getRiskBadgeClass = (jours) => {
  if (jours > 90) return 'bg-soft-danger text-danger fw-bold';
  if (jours > 60) return 'bg-soft-orange text-orange fw-bold';
  if (jours > 30) return 'bg-soft-warning text-warning fw-bold';
  return 'bg-soft-success text-success';
};

const exportGlobalAudit = () => {
  alert(
    "Génération du rapport d'audit général des créances.\nCalcul des provisions pour dépréciation inclus."
  );
};
</script>

<style scoped>
/* Nuances Flat UI & Classes d'alerte de l'ERP */
.bg-soft-success {
  background-color: rgba(40, 167, 69, 0.12);
}
.bg-soft-warning {
  background-color: rgba(255, 193, 7, 0.15);
}
.bg-soft-danger {
  background-color: rgba(220, 53, 69, 0.08);
}

/* Nuance Orange intermédiaire pour le retard 60-90j */
.bg-soft-orange {
  background-color: rgba(255, 123, 0, 0.1);
}
.text-orange {
  color: #ff7b00 !important;
}
.border-orange {
  border-color: #ff7b00 !important;
}

.text-xs {
  font-size: 11px !important;
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
}

/* Ligne graphique stricte de l'ERP */
.rounded-4 {
  border-radius: 0.2rem !important;
}
</style>
