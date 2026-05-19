<template>
  <div class="row">
    <div class="col-12 mb-4">
      <h3 class="fw-bold mb-1">Résumé Global & Monitoring Académique</h3>
      <p class="text-muted small mb-0">
        <i class="bi bi-speedometer2 me-1"></i>
        Vue d'ensemble stratégique des indicateurs de performance, de validation des ECTS et de
        progression des promotions.
      </p>
    </div>

    <div class="col-12 mb-4">
      <div class="row g-3">
        <div class="col-md-3">
          <div
            class="card border-0 shadow-sm p-3 bg-white rounded-4 border-start border-primary border-3"
          >
            <div class="d-flex align-items-center justify-content-between">
              <div>
                <span class="text-muted small fw-semibold text-uppercase d-block mb-1"
                  >Apprenants Inscrits</span
                >
                <h4 class="fw-bold mb-0 text-dark">1,240</h4>
              </div>
              <div class="bg-soft-primary p-2 rounded">
                <i class="bi bi-people text-primary fs-4"></i>
              </div>
            </div>
          </div>
        </div>

        <div class="col-md-3">
          <div
            class="card border-0 shadow-sm p-3 bg-white rounded-4 border-start border-success border-3"
          >
            <div class="d-flex align-items-center justify-content-between">
              <div>
                <span class="text-muted small fw-semibold text-uppercase d-block mb-1"
                  >Taux de Réussite S1</span
                >
                <h4 class="fw-bold mb-0 text-success">84.2 %</h4>
              </div>
              <div class="bg-soft-success p-2 rounded">
                <i class="bi bi-graph-up-arrow text-success fs-4"></i>
              </div>
            </div>
          </div>
        </div>

        <div class="col-md-3">
          <div
            class="card border-0 shadow-sm p-3 bg-white rounded-4 border-start border-warning border-3"
          >
            <div class="d-flex align-items-center justify-content-between">
              <div>
                <span class="text-muted small fw-semibold text-uppercase d-block mb-1"
                  >Crédits ECTS Délivrés</span
                >
                <h4 class="fw-bold mb-0 text-warning">37,200</h4>
              </div>
              <div class="bg-soft-warning p-2 rounded">
                <i class="bi bi-award text-warning fs-4"></i>
              </div>
            </div>
          </div>
        </div>

        <div class="col-md-3">
          <div
            class="card border-0 shadow-sm p-3 bg-white rounded-4 border-start border-danger border-3"
          >
            <div class="d-flex align-items-center justify-content-between">
              <div>
                <span class="text-muted small fw-semibold text-uppercase d-block mb-1"
                  >Taux de Présence</span
                >
                <h4 class="fw-bold mb-0 text-danger">92.6 %</h4>
              </div>
              <div class="bg-soft-danger p-2 rounded">
                <i class="bi bi-calendar-check text-danger fs-4"></i>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="col-lg-8 mb-4">
      <div class="card border-0 shadow-sm rounded-4 bg-white h-100">
        <div
          class="card-header bg-white border-0 pt-4 px-4 pb-2 d-flex justify-content-between align-items-center"
        >
          <h5 class="fw-bold text-dark mb-0">
            <i class="bi bi-columns-gap text-primary me-2"></i>Performances Comparées par Promotion
          </h5>
          <span class="text-xs text-muted font-monospace">Mise à jour : En direct</span>
        </div>

        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0 text-center">
              <thead class="bg-light text-secondary small">
                <tr>
                  <th class="ps-4 py-3 text-start">Filière / Classe</th>
                  <th>Moyenne Classe</th>
                  <th>ECTS Validés (%)</th>
                  <th>Taux d'Admission</th>
                  <th class="text-end pe-4">Alerte Jury</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in mockPromotionSummary" :key="row.classe">
                  <td class="ps-4 text-startfw-semibold text-dark text-start">
                    <div class="fw-bold">{{ row.classe }}</div>
                    <small class="text-muted">{{ row.effectif }} apprenants</small>
                  </td>
                  <td class="fw-bold text-secondary">{{ row.moyenneGlobal }} / 20</td>
                  <td>
                    <div class="d-flex align-items-center justify-content-center">
                      <span class="me-2 small font-monospace">{{ row.pctEctsAcquis }}%</span>
                      <div
                        class="progress"
                        style="width: 60px; height: 5px; background-color: #f0f2f5"
                      >
                        <div
                          class="progress-bar bg-primary"
                          :style="{ width: row.pctEctsAcquis + '%' }"
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span
                      class="badge px-2 py-1 rounded"
                      :class="
                        row.tauxAdmis >= 80
                          ? 'bg-soft-success text-success'
                          : 'bg-soft-warning text-warning'
                      "
                    >
                      {{ row.tauxAdmis }}% admis
                    </span>
                  </td>
                  <td class="text-end pe-4">
                    <span v-if="row.alertes > 0" class="badge bg-soft-danger text-danger fw-bold">
                      <i class="bi bi-exclamation-triangle-fill me-1"></i>
                      {{ row.alertes }} Dossiers bloqués
                    </span>
                    <span v-else class="badge bg-light text-muted border">Clôturé</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <div class="col-lg-4 mb-4">
      <div class="card border-0 shadow-sm rounded-4 bg-white h-100">
        <div class="card-header bg-white border-0 pt-4 px-4 pb-2">
          <h5 class="fw-bold text-dark mb-0">
            <i class="bi bi-activity text-warning me-2"></i>Santé de la Session
          </h5>
        </div>
        <div class="card-body p-4 pt-2">
          <p class="text-muted small mb-4">
            Analyse répartie des décisions d'attribution de crédits à l'échelle de l'école.
          </p>

          <div class="mb-3">
            <div class="d-flex justify-content-between small fw-semibold text-muted mb-1">
              <span>Parcours sans faute (60 ECTS acquis)</span>
              <span class="text-dark">72%</span>
            </div>
            <div class="progress rounded-pill" style="height: 8px; background-color: #f0f2f5">
              <div class="progress-bar bg-success rounded-pill" style="width: 72%"></div>
            </div>
          </div>

          <div class="mb-3">
            <div class="d-flex justify-content-between small fw-semibold text-muted mb-1">
              <span>Passages conditionnels (Dette de crédits)</span>
              <span class="text-dark">16%</span>
            </div>
            <div class="progress rounded-pill" style="height: 8px; background-color: #f0f2f5">
              <div class="progress-bar bg-warning rounded-pill" style="width: 16%"></div>
            </div>
          </div>

          <div class="mb-4">
            <div class="d-flex justify-content-between small fw-semibold text-muted mb-1">
              <span>Ajournements & Redoublants</span>
              <span class="text-dark">12%</span>
            </div>
            <div class="progress rounded-pill" style="height: 8px; background-color: #f0f2f5">
              <div class="progress-bar bg-danger rounded-pill" style="width: 12%"></div>
            </div>
          </div>

          <div class="p-3 bg-light rounded text-xs text-muted border-0">
            <h6 class="fw-bold text-dark mb-1 small">
              <i class="bi bi-info-circle-fill text-primary me-1"></i> Consolidation des données
            </h6>
            Ce résumé global compile dynamiquement les informations issues des délibérations. Toute
            modification sur les maquettes pédagogiques invalide le cache et recalcule la synthèse.
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

// Données consolidées de synthèse académique globale
const mockPromotionSummary = ref([
  {
    classe: 'Master 1 Informatique',
    effectif: 45,
    moyenneGlobal: 13.45,
    pctEctsAcquis: 88,
    tauxAdmis: 82,
    alertes: 2,
  },
  {
    classe: 'Master 2 Informatique',
    effectif: 38,
    moyenneGlobal: 14.12,
    pctEctsAcquis: 94,
    tauxAdmis: 91,
    alertes: 0,
  },
  {
    classe: 'Licence 3 Management',
    effectif: 110,
    moyenneGlobal: 11.2,
    pctEctsAcquis: 76,
    tauxAdmis: 70,
    alertes: 7,
  },
  {
    classe: 'Licence 2 Génie Civil',
    effectif: 64,
    moyenneGlobal: 12.05,
    pctEctsAcquis: 82,
    tauxAdmis: 78,
    alertes: 1,
  },
]);
</script>

<style scoped>
/* Palettes d'accents Flat & Douces */
.bg-soft-primary {
  background-color: rgba(0, 123, 255, 0.08);
}
.bg-soft-success {
  background-color: rgba(40, 167, 69, 0.1);
}
.bg-soft-warning {
  background-color: rgba(255, 193, 7, 0.12);
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
