<template>
  <div class="archive-finances-container">
    <!-- Header de la section -->
    <div class="col-12 mb-4">
      <h3 class="fw-bold mb-1">Archives Financières</h3>
      <p class="text-muted small mb-0">
        <i class="bi bi-archive-fill me-1"></i>
        Consultez les grands livres consolidés, les bilans de scolarité clos et les historiques
        d'encaissement des exercices passés.
      </p>
    </div>

    <!-- Sélecteur d'Exercice Fiscal / Académique -->
    <div class="card mb-4 border-0 shadow-sm bg-light rounded-4">
      <div class="card-body p-3">
        <div class="row g-3 align-items-center">
          <div class="col-md-4">
            <label class="form-label small fw-semibold text-muted mb-1"
              >Choisir un exercice archivé</label
            >
            <select
              v-model="selectedExercice"
              @change="loadArchiveData"
              class="form-select border-0 shadow-sm"
            >
              <option value="">Sélectionner une année...</option>
              <option v-for="annee in exercices" :key="annee" :value="annee">
                Exercice {{ annee }}
              </option>
            </select>
          </div>
          <div class="col-md-8 text-md-end pt-3" v-if="selectedExercice">
            <span class="badge bg-soft-secondary text-secondary border fw-bold p-2">
              <i class="bi bi-lock-fill me-1"></i> Cet exercice est définitivement scellé et non
              modifiable.
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Contenu des Archives (uniquement si une année est sélectionnée) -->
    <div class="row" v-if="selectedExercice">
      <!-- Cartes de synthèse de l'année sélectionnée -->
      <div class="col-md-4 mb-4">
        <div class="card border-0 shadow-sm rounded-4 bg-white p-3 mb-3">
          <span class="text-muted small fw-semibold text-uppercase d-block mb-1"
            >Total Encaissé</span
          >
          <h4 class="fw-bold text-dark font-monospace mb-0">{{ formatCurrency(summary.total) }}</h4>
        </div>
      </div>
      <div class="col-md-4 mb-4">
        <div class="card border-0 shadow-sm rounded-4 bg-white p-3 mb-3">
          <span class="text-muted small fw-semibold text-uppercase d-block mb-1"
            >Taux de Recouvrement</span
          >
          <h4 class="fw-bold text-success mb-0">{{ summary.tauxRecouvrement }} %</h4>
        </div>
      </div>
      <div class="col-md-4 mb-4">
        <div class="card border-0 shadow-sm rounded-4 bg-white p-3 mb-3">
          <span class="text-muted small fw-semibold text-uppercase d-block mb-1"
            >Restes à Recouvrer (Pertes)</span
          >
          <h4 class="fw-bold text-danger font-monospace mb-0">
            {{ formatCurrency(summary.creances) }}
          </h4>
        </div>
      </div>

      <!-- Tableau des archives consolidées par classe de cette année-là -->
      <div class="col-12">
        <div class="card border-0 shadow-sm rounded-4 overflow-hidden bg-white">
          <div
            class="card-header bg-white border-0 pt-4 px-4 pb-2 d-flex justify-content-between align-items-center"
          >
            <h5 class="fw-bold text-dark mb-0">
              <i class="bi bi-journal-check text-primary me-2"></i>Rapport de Clôture Annuel par
              Promotion
            </h5>
            <button
              @click="downloadGlobalReport"
              class="btn btn-outline-dark btn-xs border shadow-sm"
            >
              <i class="bi bi-download me-1"></i> Télécharger le Grand Livre (PDF)
            </button>
          </div>

          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="table table-hover align-middle mb-0 text-center">
                <thead class="bg-light text-secondary small">
                  <tr>
                    <th class="ps-4 py-3 text-start" style="width: 70px">#</th>
                    <th class="text-start">Classe / Promotion</th>
                    <th>Effectif</th>
                    <th>Total Attendu</th>
                    <th>Total Perçu</th>
                    <th>Reliquats Impayés</th>
                    <th class="text-end pe-4">Statut Comptable</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, index) in paginated" :key="item.classe">
                    <td class="ps-4 text-start text-muted small">{{ startIndex + index + 1 }}</td>
                    <td class="text-start fw-bold text-dark">{{ item.classe }}</td>
                    <td class="text-muted small">{{ item.effectif }} étudiants</td>
                    <td class="font-monospace fw-semibold text-secondary">
                      {{ formatCurrency(item.attendu) }}
                    </td>
                    <td class="font-monospace fw-bold text-success">
                      {{ formatCurrency(item.percu) }}
                    </td>
                    <td class="font-monospace text-danger">
                      {{ formatCurrency(item.attendu - item.percu) }}
                    </td>
                    <td class="text-end pe-4">
                      <span
                        class="badge rounded-pill px-2 py-1 small"
                        :class="
                          item.attendu === item.percu
                            ? 'bg-soft-success text-success'
                            : 'bg-soft-warning text-warning'
                        "
                      >
                        {{ item.attendu === item.percu ? 'Équilibré' : 'Solde Débiteur Clôturé' }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div v-if="archiveRecords.length" class="border-top py-3 px-4">
              <Pagination
                v-model="page"
                v-model:items-per-page="itemsPerPage"
                :total-items="archiveRecords.length"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- État Hors Sélection -->
    <div class="col-12 py-5 text-center text-muted" v-else>
      <i class="bi bi-box-seam display-4 text-light d-block mb-3"></i>
      <h6 class="fw-bold">Aucun exercice ciblé</h6>
      <p class="small mb-0">
        Sélectionnez une année académique passée pour extraire son grand livre comptable scellé.
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import Pagination from '@/components/shared/Pagination.vue';
import { useTableExport } from '@/shared/composables/useTableExport';
import { usePagination } from '@/shared/composables/usePagination';
import { useAnneeStore } from '@/modules/structure-academique/annee/store';
import { useRapportStore } from '@/modules/finances/stores/rapports';
import { formatMontant } from '@/shared/utils/parametres';

/**
 * Archives : la clôture d'un exercice, ventilée classe par classe.
 *
 * Les trois exercices de la liste, la synthèse et les quatre classes du tableau
 * étaient tous codés en dur — `loadArchiveData` réaffectait les mêmes constantes
 * quel que soit l'exercice choisi.
 *
 * Les exercices viennent des années académiques ; la synthèse et la ventilation
 * viennent de `GET /finance/rapports/kpi?annee_id=` et `/rapports/bilan-classes`,
 * qui acceptent une année précise (par défaut, ils portent sur l'année active —
 * ce qui n'aurait aucun sens pour consulter un exercice clos).
 */

const anneeStore = useAnneeStore();
const store = useRapportStore();

const selectedExercice = ref('');

onMounted(() => anneeStore.fetchAll());

/** Le `<select>` liste des codes d'année (« 2024-2025 »). */
const exercisces = computed(() => anneeStore.items.map((annee) => annee.code));

const summary = computed(() => ({
  total: store.kpi.total_encaisse,
  tauxRecouvrement: store.kpi.taux_recouvrement,
  creances: store.kpi.total_restant,
}));

const archiveRecords = computed(() => store.bilanClasses);

// Une ligne par classe : 135 sur le jeu de démonstration, rendues d'un bloc.
// Changer d'exercice repart de la première page.
const { page, itemsPerPage, startIndex, paginated } = usePagination(archiveRecords, {
  perPage: 15,
  resetKey: () => selectedExercice.value,
});

const loadArchiveData = async () => {
  if (!selectedExercice.value) {
    store.bilanClasses = [];
    return;
  }

  const annee = anneeStore.items.find((item) => item.code === selectedExercice.value);
  if (!annee) return;

  await Promise.all([
    store.fetchKpi({ annee_id: annee.id }),
    store.fetchBilanClasses({ annee_id: annee.id }),
  ]);
};

// La devise vient du réglage `finances.devise_symbole` (écran Paramètres),
// et non plus d'un « FCFA » écrit en dur dans chaque onglet.
const formatCurrency = (value) => formatMontant(value);

const exportRows = computed(() =>
  archiveRecords.value.map((ligne) => ({
    Classe: ligne.classe,
    Filière: ligne.filiere ?? '—',
    Effectif: ligne.effectif,
    'Total attendu': ligne.attendu,
    'Total perçu': ligne.percu,
    'Reste à recouvrer': ligne.reste,
    'Taux (%)': ligne.taux,
  }))
);

const { exportToPdf } = useTableExport({
  rows: exportRows,
  title: 'Grand livre — synthèse par classe',
  fileBaseName: 'archives-financieres',
  filters: () => [
    { label: 'Exercice', value: selectedExercice.value },
    { label: 'Total encaissé', value: formatCurrency(summary.value.total) },
    { label: 'Taux de recouvrement', value: `${summary.value.tauxRecouvrement} %` },
    { label: 'Restes à recouvrer', value: formatCurrency(summary.value.creances) },
  ],
});

const downloadGlobalReport = () => exportToPdf();
</script>

<style scoped>
.bg-soft-success {
  background-color: rgba(40, 167, 69, 0.12);
}
.bg-soft-warning {
  background-color: rgba(255, 193, 7, 0.15);
}
.bg-soft-secondary {
  background-color: rgba(108, 117, 125, 0.1);
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

.rounded-4 {
  border-radius: 0.2rem !important;
}
.form-select {
  font-size: 0.85rem;
}
.btn-xs {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
}
</style>
