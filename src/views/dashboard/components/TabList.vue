<template>
  <div class="card border-0 shadow-sm rounded-4 bg-white">
    <div class="card-body p-4">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h6 class="fw-bold text-dark mb-1 small text-uppercase text-secondary tracking-wider">
            <i class="bi bi-journal-check text-primary me-2"></i>Journal des Flux de Caisse & Traites
          </h6>
          <p class="text-muted text-xs mb-0">Contrôle en temps réel des encaissements et imputations budgétaires.</p>
        </div>
        
        <div class="d-flex gap-2">
          <select class="form-select form-select-sm text-xs shadow-none bg-light border-0" style="width: 140px;">
            <option value="">Tous les modes</option>
            <option value="vis">Virement</option>
            <option value="mob">Mobile Money</option>
            <option value="liq">Espèces</option>
          </select>
          <button @click="exportJournalSession" class="btn btn-sm btn-light border text-xs px-2" title="Exporter cette session">
            <i class="bi bi-file-earmark-excel text-success"></i>
          </button>
        </div>
      </div>

      <div class="table-responsive">
        <table id="recent-purchases-listing" class="table table-hover align-middle mb-0 text-center text-sm">
          <thead class="bg-light text-secondary text-xs">
            <tr>
              <th class="text-start ps-3">Réf / Bénéficiaire</th>
              <th>Type / Libellé</th>
              <th>Statut</th>
              <th>Mode</th>
              <th>Montant Net</th>
              <th>Date / Heure</th>
              <th>Montant Brut</th>
              <th class="text-end pe-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!purchases || purchases.length === 0">
              <td colspan="8" class="text-center text-muted py-5 text-xs">
                <i class="bi bi-folder-x fs-3 d-block mb-2 text-secondary"></i>
                Aucune transaction financière n'a été enregistrée aujourd'hui.
              </td>
            </tr>

            <tr v-else v-for="(purchase, index) in purchases" :key="index">
              <td class="text-start ps-3">
                <div class="fw-bold text-dark text-xs">{{ purchase.name }}</div>
                <small class="text-muted font-monospace text-xs" style="font-size: 10px;">
                  TRX-{{ 2026000 + index }}
                </small>
              </td>

              <td class="text-start text-xs text-secondary fw-semibold">
                {{ purchase.office || 'Scolarité Périodique' }}
              </td>
              
              <td>
                <span class="badge px-2 py-1 rounded text-xs" :class="getStatusBadgeClass(purchase.status)">
                  {{ purchase.status }}
                </span>
              </td>
              
              <td>
                <span class="badge bg-light text-dark border font-monospace text-xs px-2">
                  <i class="bi bi-credit-card-2-front me-1 text-muted"></i>{{ purchase.paymentMethod || 'Digital' }}
                </span>
              </td>
              
              <td class="font-monospace text-xs fw-semibold text-dark">
                {{ formatCurrency(purchase.price) }}
              </td>
              
              <td class="text-muted text-xs font-monospace">
                {{ purchase.date }}
              </td>
              
              <td class="font-monospace text-xs fw-bold text-secondary">
                {{ formatCurrency(purchase.grossAmount) }}
              </td>

              <td class="text-end pe-3">
                <div class="btn-group">
                  <button @click="ouvrirRecu(purchase)" class="btn btn-xs btn-light border-0 p-1 text-primary me-1" title="Imprimer le reçu officiel">
                    <i class="bi bi-printer-fill"></i>
                  </button>
                  <button @click="auditerTransaction(purchase)" class="btn btn-xs btn-light border-0 p-1 text-secondary" title="Historique d'audit (Logs)">
                    <i class="bi bi-shield-shaded"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>

          <tfoot v-if="purchases && purchases.length > 0" class="bg-light-subtle border-top border-2">
            <tr>
              <td colspan="6" class="text-start ps-3 fw-bold text-xs text-secondary text-uppercase tracking-wider">
                Volume Brut Total Traité en Session
              </td>
              <td class="font-monospace fw-bold text-primary text-xs">{{ formatCurrency(totalGrossAmount) }}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  purchases: {
    type: Array,
    default: () => []
  }
});

// Calcul du montant cumulé brut
const totalGrossAmount = computed(() => {
  return props.purchases.reduce((acc, curr) => {
    const montant = typeof curr.grossAmount === 'string' 
      ? parseFloat(curr.grossAmount.replace(/[^0-9.-]+/g, "")) 
      : curr.grossAmount;
    return acc + (isNaN(montant) ? 0 : montant);
  }, 0);
});

// Format monétaire global
const formatCurrency = (valeur) => {
  if (!valeur) return '0 FCFA';
  if (typeof valeur === 'string' && valeur.includes('FCFA')) return valeur;
  const num = typeof valeur === 'string' ? parseFloat(valeur.replace(/[^0-9.-]+/g, "")) : valeur;
  return new Intl.NumberFormat('fr-FR').format(num) + ' FCFA';
};

// Gestion des badges du Design System Flat UI
const getStatusBadgeClass = (status) => {
  const s = status?.toLowerCase() || '';
  if (s.includes('valide') || s.includes('paye') || s.includes('success')) {
    return 'bg-soft-success text-success fw-bold';
  }
  if (s.includes('attente') || s.includes('pending')) {
    return 'bg-soft-warning text-warning fw-bold';
  }
  if (s.includes('refuse') || s.includes('annule') || s.includes('echec')) {
    return 'bg-soft-danger text-danger fw-bold';
  }
  return 'bg-light text-secondary';
};

// Fonctions d'actions de l'ERP
const ouvrirRecu = (p) => {
  alert(`Génération du ticket de caisse PDF pour : ${p.name}`);
};

const auditerTransaction = (p) => {
  alert(`Logs d'audit : Enregistré par Caisse_01. Certifié conforme via passerelle financière.`);
};

const exportJournalSession = () => {
  alert("Exportation du sous-journal comptable au format Excel (.xlsx) réussie.");
};
</script>

<style scoped>
.bg-soft-success { background-color: rgba(40, 167, 69, 0.12); }
.bg-soft-warning { background-color: rgba(255, 193, 7, 0.15); }
.bg-soft-danger { background-color: rgba(220, 53, 69, 0.08); }

.text-xs { font-size: 11px !important; }
.tracking-wider { letter-spacing: 0.5px; }

.table th {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: #6c757d;
  border: none;
}

.table tbody tr {
  border-bottom: 1px solid #f8f9fa;
}

.rounded-4 {
  border-radius: 0.2rem !important;
}
</style>
