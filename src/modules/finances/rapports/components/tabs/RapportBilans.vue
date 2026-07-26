<template>
  <div class="bilan-financier-container">
    <!-- Header de la section -->
    <div class="col-12 mb-4">
      <h3 class="fw-bold mb-1">Bilan Financier & Consolidation</h3>
      <p class="text-muted small mb-0">
        <i class="bi bi-pie-chart-fill me-1"></i>
        Analyse globale en temps réel de la trésorerie : balance des encaissements, suivi des
        impayés et arbitrage des charges (vacations).
      </p>
    </div>

    <!-- Section KPI Flash : Santé financière globale -->
    <div class="col-12 mb-4">
      <div class="row g-3">
        <!-- Chiffre d'Affaires Théorique (Engagé) -->
        <div class="col-md-3">
          <div
            class="card border-0 shadow-sm p-3 bg-white rounded-4 border-start border-primary border-3"
          >
            <div class="d-flex align-items-center justify-content-between">
              <div>
                <span class="text-muted small fw-semibold text-uppercase d-block mb-1"
                  >Total Engagé</span
                >
                <h4 class="fw-bold mb-0 text-dark font-monospace">
                  {{ formatPrice(kpi.totalEngage) }}
                </h4>
              </div>
              <div class="bg-soft-primary p-2 rounded">
                <i class="bi bi-calculator text-primary fs-4"></i>
              </div>
            </div>
          </div>
        </div>

        <!-- Trésorerie Encaissée (Recettes Réelles) -->
        <div class="col-md-3">
          <div
            class="card border-0 shadow-sm p-3 bg-white rounded-4 border-start border-success border-3"
          >
            <div class="d-flex align-items-center justify-content-between">
              <div>
                <span class="text-muted small fw-semibold text-uppercase d-block mb-1"
                  >Recettes (Encaissé)</span
                >
                <h4 class="fw-bold mb-0 text-success font-monospace">
                  {{ formatPrice(kpi.totalEncaisse) }}
                </h4>
              </div>
              <div class="bg-soft-success p-2 rounded">
                <i class="bi bi-cash-coin text-success fs-4"></i>
              </div>
            </div>
          </div>
        </div>

        <!-- Masse des Émoluments Formateurs (Charges Réelles) -->
        <div class="col-md-3">
          <div
            class="card border-0 shadow-sm p-3 bg-white rounded-4 border-start border-danger border-3"
          >
            <div class="d-flex align-items-center justify-content-between">
              <div>
                <span class="text-muted small fw-semibold text-uppercase d-block mb-1"
                  >Charges (Honoraires)</span
                >
                <h4 class="fw-bold mb-0 text-danger font-monospace">
                  {{ formatPrice(kpi.totalCharges) }}
                </h4>
              </div>
              <div class="bg-soft-danger p-2 rounded">
                <i class="bi bi-person-badge text-danger fs-4"></i>
              </div>
            </div>
          </div>
        </div>

        <!-- Trésorerie Nette Disponible -->
        <div class="col-md-3">
          <div
            class="card border-0 shadow-sm p-3 bg-white rounded-4 border-start border-warning border-3"
          >
            <div class="d-flex align-items-center justify-content-between">
              <div>
                <span class="text-muted small fw-semibold text-uppercase d-block mb-1"
                  >Trésorerie Nette</span
                >
                <h4 class="fw-bold mb-0 text-warning font-monospace">
                  {{ formatPrice(soldeNet) }}
                </h4>
              </div>
              <div class="bg-soft-warning p-2 rounded">
                <i class="bi bi-wallet2 text-warning fs-4"></i>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="row">
      <!-- Répartition et Performance par Filière -->
      <div class="col-lg-8 mb-4">
        <div class="card border-0 shadow-sm rounded-4 bg-white h-100">
          <div
            class="card-header bg-white border-0 pt-4 px-4 pb-2 d-flex justify-content-between align-items-center"
          >
            <h5 class="fw-bold text-dark mb-0">
              <i class="bi bi-columns-gap text-primary me-2"></i>Analyse de Recouvrement par Filière
            </h5>
            <span class="badge bg-light text-muted border font-monospace">Année Courante</span>
          </div>

          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="table table-hover align-middle mb-0 text-center">
                <thead class="bg-light text-secondary small">
                  <tr>
                    <th class="ps-4 py-3 text-start">Filière</th>
                    <th>Attendu</th>
                    <th>Perçu</th>
                    <th>Taux d'Efficacité</th>
                    <th class="text-end pe-4">Reste à Recouvrer</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in balanceFilières" :key="item.filiere">
                    <td class="ps-4 text-start fw-bold text-dark">{{ item.filiere }}</td>
                    <td class="font-monospace text-muted small">{{ formatPrice(item.attendu) }}</td>
                    <td class="font-monospace fw-semibold text-success">
                      {{ formatPrice(item.percu) }}
                    </td>
                    <td>
                      <div class="d-flex align-items-center justify-content-center">
                        <span class="me-2 small font-monospace fw-bold">{{ item.taux }}%</span>
                        <div
                          class="progress"
                          style="width: 60px; height: 5px; background-color: #f0f2f5"
                        >
                          <div
                            class="progress-bar bg-success"
                            :style="{ width: item.taux + '%' }"
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td class="text-end pe-4 font-monospace fw-bold text-danger">
                      {{ formatPrice(item.attendu - item.percu) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- Section d'Arbitrage et Alertes Risques -->
      <div class="col-lg-4 mb-4">
        <div class="card border-0 shadow-sm rounded-4 bg-white h-100">
          <div class="card-header bg-white border-0 pt-4 px-4 pb-2">
            <h5 class="fw-bold text-dark mb-0">
              <i class="bi bi-shield-exclamation text-danger me-2"></i>Ratios & Indicateurs
              Prudentiels
            </h5>
          </div>
          <div class="card-body p-4 pt-2">
            <p class="text-muted small mb-4">
              Vérification automatique des seuils de rentabilité et d'exposition aux risques de
              défaut.
            </p>

            <!-- Ratio Charges / Produits -->
            <div class="mb-3">
              <div class="d-flex justify-content-between small fw-semibold text-muted mb-1">
                <span>Poids des charges (Honoraires / Recettes)</span>
                <span class="text-dark fw-bold">{{ ratioCharges }}%</span>
              </div>
              <div class="progress rounded-pill" style="height: 8px; background-color: #f0f2f5">
                <div
                  class="progress-bar rounded-pill"
                  :class="ratioCharges > 40 ? 'bg-danger' : 'bg-primary'"
                  :style="{ width: ratioCharges + '%' }"
                ></div>
              </div>
            </div>

            <!-- Taux Globale de Crances -->
            <div class="mb-4">
              <div class="d-flex justify-content-between small fw-semibold text-muted mb-1">
                <span>Taux de pertes sur créances courantes</span>
                <span class="text-dark fw-bold">{{ ratioCreances }}%</span>
              </div>
              <div class="progress rounded-pill" style="height: 8px; background-color: #f0f2f5">
                <div
                  class="progress-bar bg-danger rounded-pill"
                  :style="{ width: ratioCreances + '%' }"
                ></div>
              </div>
            </div>

            <!-- Note d'Analyse Executive -->
            <div class="p-3 bg-light rounded text-xs text-muted border-0">
              <h6 class="fw-bold text-dark mb-1 small">
                <i class="bi bi-info-circle-fill text-primary me-1"></i> Conseil de Gestion
              </h6>
              Le solde disponible prend en compte l'ensemble des règlements d'étudiants reçus à ce
              jour, moins le cumul brut des fiches de vacation validées. Les créances non perçues ne
              sont pas comptabilisées dans le disponible net.
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useRapportStore } from '@/modules/finances/stores/rapports';

/**
 * Bilans financiers.
 *
 * Les KPI et la balance par filière étaient des constantes. Ils viennent
 * maintenant de `GET /finance/rapports/kpi` et `/rapports/bilan-filieres`, qui
 * portent sur l'année académique **active**.
 *
 * ## Les charges n'ont pas de source
 *
 * `totalCharges` — et donc le solde net et le ratio de charges qui en découlent —
 * valait 11 450 000 F en dur. Aucune table ne porte les charges de
 * l'établissement : le backend ne connaît que les **recettes** étudiantes
 * (tarifs, échéanciers, paiements). Les honoraires des formateurs, qui en
 * constitueraient l'essentiel, relèvent de la paie et n'ont pas de modèle.
 *
 * Le champ est donc à zéro plutôt que faux : afficher un résultat net calculé
 * sur une charge inventée serait pire qu'afficher zéro. Le jour où un module de
 * charges existe, il suffit de brancher `totalCharges` dessus — les deux calculs
 * ci-dessous suivront.
 */

const store = useRapportStore();

onMounted(() => {
  store.fetchKpi();
  store.fetchBilanFilieres();
});

const kpi = computed(() => ({
  totalEngage: store.kpi.total_engage,
  totalEncaisse: store.kpi.total_encaisse,
  totalCharges: 0,
}));

const balanceFilières = computed(() => store.bilanFilieres);

const soldeNet = computed(() => kpi.value.totalEncaisse - kpi.value.totalCharges);

const ratioCharges = computed(() => {
  if (kpi.value.totalEncaisse === 0) return 0;
  return ((kpi.value.totalCharges / kpi.value.totalEncaisse) * 100).toFixed(1);
});

const ratioCreances = computed(() => {
  if (kpi.value.totalEngage === 0) return 0;
  const restant = kpi.value.totalEngage - kpi.value.totalEncaisse;
  return ((restant / kpi.value.totalEngage) * 100).toFixed(1);
});

const formatPrice = (val) => new Intl.NumberFormat('fr-FR').format(Number(val ?? 0)) + ' FCFA';
</script>

<style scoped>
/* Nuances Flat Design pour l'identité visuelle */
.bg-soft-primary {
  background-color: rgba(0, 123, 255, 0.08);
}
.bg-soft-success {
  background-color: rgba(40, 167, 69, 0.12);
}
.bg-soft-warning {
  background-color: rgba(255, 193, 7, 0.15);
}
.bg-soft-danger {
  background-color: rgba(220, 53, 69, 0.08);
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
.progress {
  box-shadow: none;
}
</style>
