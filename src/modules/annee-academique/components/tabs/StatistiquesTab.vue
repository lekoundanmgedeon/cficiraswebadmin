<script setup>
import { computed, onMounted } from 'vue';
import { useAnneeStore } from '../../store/anneeStore';
import { useNotificationStore } from '@/shared/stores/notificationStore';
import { exportExcel } from '@/shared/utils/exportExcel';
import { exportPDF } from '@/shared/utils/exportPDF';
import logoCFI from '@/assets/logoBase64';

/**
 * Statistiques de performance de l'année courante.
 *
 * La version précédente appelait `messageStore.error(...)` sur un objet issu de
 * `useNotifier()`, qui n'expose pas de méthode `error` (mais `notifyError`) :
 * l'absence d'année active provoquait un TypeError au lieu du message attendu.
 */

const anneeStore = useAnneeStore();
const notifications = useNotificationStore();

const stats = computed(() => anneeStore.stats ?? {});
const filieres = computed(() => stats.value.filieres ?? []);
const currentAnnee = computed(() => anneeStore.current);

// Une seule action : le store enchaîne « année courante » puis « statistiques »
// et réutilise l'année déjà en mémoire si elle est connue.
onMounted(async () => {
  await anneeStore.loadCurrentStats();
  if (!currentAnnee.value) {
    notifications.notifyWarning("Aucune année académique active n'a été trouvée.");
  }
});

/** @param {number} moyenne */
function getMoyenneColor(moyenne) {
  if (moyenne >= 14) return 'bg-success';
  if (moyenne >= 10) return 'bg-info';
  return 'bg-danger';
}

/** Lignes d'export, partagées par l'export Excel et l'export PDF. */
const exportRows = computed(() =>
  filieres.value.map((filiere, index) => ({
    Rang: index + 1,
    Filière: filiere.designation,
    Code: filiere.code || '-',
    'Effectif étudiants': filiere.nb_etudiants ?? 0,
    'Moyenne générale': filiere.moyenne_generale ?? '-',
    Progression: filiere.progression ?? '-',
    Statut: filiere.moyenne_generale ? 'Validé' : 'En cours',
  }))
);

/** @returns {boolean} `false` et notifie si aucune donnée n'est exportable. */
function ensureExportable() {
  if (filieres.value.length === 0) {
    notifications.notifyWarning("Aucune donnée disponible pour l'export.");
    return false;
  }
  return true;
}

function exportFilieresExcel() {
  if (!ensureExportable()) return;

  exportExcel({
    data: exportRows.value,
    sheetName: 'Statistiques Filières',
    fileName: `statistiques_filieres_${Date.now()}.xlsx`,
  });
}

function exportFilieresPDF() {
  if (!ensureExportable()) return;

  const columns = Object.keys(exportRows.value[0]);

  exportPDF({
    logoBase64: logoCFI,
    title: 'Statistiques de performance par filière',
    filters: [
      { label: 'Année académique', value: stats.value.annee ?? '-' },
      { label: 'Filières exportées', value: filieres.value.length },
      { label: "Date d'export", value: new Date().toLocaleDateString('fr-FR') },
    ],
    columns,
    rows: exportRows.value.map((row) => columns.map((column) => row[column])),
    fileName: `statistiques_filieres_${Date.now()}.pdf`,
  });
}

async function exportRapport() {
  if (!currentAnnee.value?.id) {
    notifications.notifyWarning("Impossible d'exporter : aucune année active détectée.");
    return;
  }
  await anneeStore.exportData(currentAnnee.value.id);
}
</script>

<template>
  <div class="row g-4">
    <div class="col-12 d-flex justify-content-between align-items-center mb-2">
      <h5 class="fw-bold mb-0">Performances de l'année académique</h5>
      <span v-if="currentAnnee" class="badge bg-soft-primary text-primary px-3 py-2">
        <i class="mdi mdi-calendar-check me-1"></i> {{ currentAnnee.code }}
      </span>
    </div>

    <div class="col-lg-3 col-md-6">
      <div class="stat-card border-0 shadow-sm bg-white">
        <div class="stat-icon bg-primary-soft">
          <i class="mdi mdi-account-group text-primary"></i>
        </div>
        <div class="stat-content">
          <h3>{{ stats.nb_etudiants ?? '-' }}</h3>
          <p class="text-uppercase small fw-bold">Effectif total</p>
        </div>
      </div>
    </div>

    <div class="col-lg-3 col-md-6">
      <div class="stat-card border-0 shadow-sm bg-white">
        <div class="stat-icon bg-success-soft">
          <i class="mdi mdi-trending-up text-success"></i>
        </div>
        <div class="stat-content">
          <h3>{{ stats.reussite?.taux_reussite ?? '-' }}%</h3>
          <p class="text-uppercase small fw-bold">Taux de réussite</p>
        </div>
      </div>
    </div>

    <div class="col-lg-3 col-md-6">
      <div class="stat-card border-0 shadow-sm bg-white">
        <div class="stat-icon bg-info-soft">
          <i class="mdi mdi-book-open-variant text-info"></i>
        </div>
        <div class="stat-content">
          <h3>{{ stats.nb_modules ?? '-' }}</h3>
          <p class="text-uppercase small fw-bold">Modules actifs</p>
        </div>
      </div>
    </div>

    <div class="col-lg-3 col-md-6">
      <div class="stat-card border-0 shadow-sm bg-white">
        <div class="stat-icon bg-warning-soft">
          <i class="mdi mdi-door-open text-warning"></i>
        </div>
        <div class="stat-content">
          <h3>{{ stats.nb_classes ?? '-' }}</h3>
          <p class="text-uppercase small fw-bold">Classes ouvertes</p>
        </div>
      </div>
    </div>

    <div class="col-12">
      <div class="card border-0 shadow-sm">
        <div class="card-header bg-white py-3">
          <div class="d-flex justify-content-between align-items-center">
            <h6 class="mb-0 fw-bold text-dark">Rapport de performance par filière</h6>
            <div class="d-flex gap-2">
              <button
                class="btn btn-sm btn-light border"
                :disabled="anneeStore.loading"
                @click="exportRapport"
              >
                <i class="mdi mdi-download me-1"></i> Rapport complet
              </button>

              <div class="btn-group">
                <button
                  class="btn btn-sm btn-outline-dark dropdown-toggle"
                  type="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  Exporter
                </button>
                <ul class="dropdown-menu dropdown-menu-end">
                  <li>
                    <button class="dropdown-item" type="button" @click="exportFilieresExcel">
                      <i class="mdi mdi-file-excel-box me-2"></i> Excel
                    </button>
                  </li>
                  <li>
                    <button class="dropdown-item" type="button" @click="exportFilieresPDF">
                      <i class="mdi mdi-file-pdf-box me-2"></i> PDF
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead class="bg-light">
                <tr>
                  <th class="ps-4 py-3">Désignation filière</th>
                  <th class="text-center">Effectif</th>
                  <th class="text-center" style="width: 250px">Moyenne & progression</th>
                  <th class="text-center">Statut</th>
                </tr>
              </thead>

              <tbody v-if="filieres.length">
                <tr v-for="filiere in filieres" :key="filiere.id">
                  <td class="ps-4">
                    <div class="fw-bold text-dark">{{ filiere.designation }}</div>
                    <small class="text-muted">Code : {{ filiere.code }}</small>
                  </td>
                  <td class="text-center">
                    <span class="badge rounded-pill bg-light text-dark px-3">
                      {{ filiere.nb_etudiants }} étudiants
                    </span>
                  </td>
                  <td class="text-center">
                    <div v-if="filiere.moyenne_generale">
                      <div class="d-flex justify-content-between mb-1">
                        <small class="fw-bold">{{ filiere.moyenne_generale }} / 20</small>
                        <small class="text-muted">
                          {{ (filiere.moyenne_generale * 5).toFixed(0) }}%
                        </small>
                      </div>
                      <div class="progress" style="height: 6px">
                        <div
                          class="progress-bar"
                          :class="getMoyenneColor(filiere.moyenne_generale)"
                          :style="{ width: `${filiere.moyenne_generale * 5}%` }"
                        ></div>
                      </div>
                    </div>
                    <span v-else class="text-muted small">Attente de délibération</span>
                  </td>
                  <td class="text-center">
                    <span
                      v-if="filiere.moyenne_generale"
                      class="badge bg-soft-success text-success px-3"
                    >
                      <i class="mdi mdi-check-circle-outline me-1"></i> Validé
                    </span>
                    <span v-else class="badge bg-soft-warning text-warning px-3">
                      <i class="mdi mdi-alert-circle-outline me-1"></i> En cours
                    </span>
                  </td>
                </tr>
              </tbody>

              <tbody v-else>
                <tr>
                  <td colspan="4" class="text-center py-5">
                    <img
                      src="/img/empty-box.svg"
                      alt=""
                      style="width: 80px"
                      class="mb-3 opacity-50"
                    />
                    <p class="text-muted mb-0">
                      Aucune donnée statistique disponible pour cette période.
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

<style scoped>
.stat-card {
  padding: 1.25rem;
  border-radius: 15px;
  display: flex;
  align-items: center;
  gap: 1.25rem;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1) !important;
}

.stat-icon {
  width: 55px;
  height: 55px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-icon i {
  font-size: 1.8rem;
}

.stat-content h3 {
  margin: 0;
  font-size: 1.6rem;
  font-weight: 700;
  letter-spacing: -0.5px;
}

.stat-content p {
  margin: 0;
  color: #8a929a;
  letter-spacing: 0.5px;
}

.bg-primary-soft {
  background: rgba(13, 110, 253, 0.1);
}
.bg-success-soft {
  background: rgba(25, 135, 84, 0.1);
}
.bg-info-soft {
  background: rgba(13, 202, 240, 0.1);
}
.bg-warning-soft {
  background: rgba(255, 193, 7, 0.1);
}

.bg-soft-success {
  background: rgba(25, 135, 84, 0.15);
}
.bg-soft-warning {
  background: rgba(255, 193, 7, 0.15);
}
.bg-soft-primary {
  background: rgba(13, 110, 253, 0.1);
}

.table thead th {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border: none;
}

.table tbody tr {
  border-bottom: 1px solid #f1f3f5;
  transition: background 0.2s;
}

.table tbody tr:hover {
  background-color: #fcfdfe;
}

.progress {
  background-color: #f0f2f4;
  border-radius: 10px;
}
</style>
