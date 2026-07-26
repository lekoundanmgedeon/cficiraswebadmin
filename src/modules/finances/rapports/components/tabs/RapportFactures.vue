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
import { computed, onMounted } from 'vue';
import { useTableExport } from '@/shared/composables/useTableExport';
import { useEcheancierStore } from '@/modules/finances/stores/echeanciers';

/**
 * Créances : balance âgée et principaux débiteurs.
 *
 * Les quatre paliers et les cinq débiteurs étaient codés en dur.
 *
 * Les deux se déduisent du **suivi des traites** (`GET
 * /finance/echeanciers/suivi`), qui porte, échéance par échéance, ce qui reste
 * dû et depuis combien de jours. C'est la seule source qui date une créance :
 * une facture, elle, ne connaît que son solde global, pas son ancienneté.
 */

const store = useEcheancierStore();

onMounted(() => store.fetchSuivi());

/** Les échéances encore dues, en montants convertis (`NUMERIC` → nombre). */
const impayees = computed(() =>
  store.traites
    .map((traite) => ({
      ...traite,
      reste: Number(traite.reste ?? 0),
      montant: Number(traite.montant ?? 0),
      montant_regle: Number(traite.montant_regle ?? 0),
      jours_retard: Number(traite.jours_retard ?? 0),
    }))
    .filter((traite) => traite.reste > 0)
);

/**
 * Balance âgée : le reste dû, ventilé par ancienneté du retard.
 *
 * « Saines » regroupe les échéances non encore échues (aucun jour de retard) :
 * elles sont dues, mais rien ne les rend exigibles aujourd'hui.
 */
const balanceAgee = computed(() => {
  const paliers = { saines: 0, modere: 0, critique: 0, contentieux: 0 };

  for (const echeance of impayees.value) {
    const jours = echeance.jours_retard;

    if (jours === 0) paliers.saines += echeance.reste;
    else if (jours <= 60) paliers.modere += echeance.reste;
    else if (jours <= 90) paliers.critique += echeance.reste;
    else paliers.contentieux += echeance.reste;
  }

  return paliers;
});

/**
 * Les dossiers les plus en retard.
 *
 * Un étudiant a plusieurs échéances : on les regroupe. Le « niveau de risque »
 * retenu est celui de sa créance la plus ancienne — c'est elle qui déclenche
 * l'arbitrage, pas la moyenne.
 */
const debiteursTop = computed(() => {
  const parEtudiant = new Map();

  for (const echeance of impayees.value) {
    const cle = echeance.matricule;
    const existant = parEtudiant.get(cle) ?? {
      matricule: echeance.matricule,
      nom: echeance.etudiant,
      filiere: echeance.filiere,
      classe: echeance.classe_code,
      total: 0,
      regle: 0,
      joursRetard: 0,
    };

    existant.total += echeance.montant;
    existant.regle += echeance.montant_regle;
    existant.joursRetard = Math.max(existant.joursRetard, echeance.jours_retard);

    parEtudiant.set(cle, existant);
  }

  return [...parEtudiant.values()]
    .sort((a, b) => b.joursRetard - a.joursRetard || b.total - b.regle - (a.total - a.regle))
    .slice(0, 10);
});

const formatPrice = (val) => new Intl.NumberFormat('fr-FR').format(Number(val ?? 0)) + ' FCFA';

const getRiskBadgeClass = (jours) => {
  if (jours > 90) return 'bg-soft-danger text-danger fw-bold';
  if (jours > 60) return 'bg-soft-orange text-orange fw-bold';
  if (jours > 30) return 'bg-soft-warning text-warning fw-bold';
  return 'bg-soft-success text-success';
};

const exportRows = computed(() =>
  debiteursTop.value.map((debiteur) => ({
    Matricule: debiteur.matricule,
    Étudiant: debiteur.nom,
    Filière: debiteur.filiere ?? '—',
    Classe: debiteur.classe ?? '—',
    Facturé: debiteur.total,
    'Déjà réglé': debiteur.regle,
    'Dette restante': debiteur.total - debiteur.regle,
    'Jours de retard': debiteur.joursRetard,
  }))
);

const { exportToPdf } = useTableExport({
  rows: exportRows,
  title: 'Audit des créances',
  fileBaseName: 'creances',
  filters: () => [
    { label: 'Non échu', value: formatPrice(balanceAgee.value.saines) },
    { label: 'Retard ≤ 60 j', value: formatPrice(balanceAgee.value.modere) },
    { label: 'Retard 61–90 j', value: formatPrice(balanceAgee.value.critique) },
    { label: 'Contentieux (+90 j)', value: formatPrice(balanceAgee.value.contentieux) },
  ],
});

/**
 * L'audit exporte la balance âgée et les débiteurs. Le calcul des « provisions
 * pour dépréciation » qu'annonçait l'`alert()` d'origine n'existe nulle part :
 * il supposerait un taux de provisionnement par palier, que rien ne définit.
 */
const exportGlobalAudit = () => exportToPdf();
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
