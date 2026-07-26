<template>
  <div class="paiement-list-container">
    <!-- Header de la section -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h3 class="fw-bold mb-1">Gestion des Paiements & Scolarités</h3>
        <p class="text-muted small mb-0">
          <i class="bi bi-wallet2 me-1"></i>
          Consultez, filtrez et exportez les rapports de paiement des étudiants.
        </p>
      </div>

      <!-- Groupe d'exportation standardisé -->
      <div class="btn-group shadow-sm">
        <button @click="exportData('csv')" class="btn btn-sm btn-white border">
          <i class="bi bi-filetype-csv text-secondary me-1"></i> CSV
        </button>
        <button @click="exportData('excel')" class="btn btn-sm btn-white border mx-1">
          <i class="bi bi-file-earmark-spreadsheet text-success me-1"></i> Excel
        </button>
        <button @click="exportData('pdf')" class="btn btn-sm btn-white border">
          <i class="bi bi-file-earmark-pdf text-danger me-1"></i> PDF
        </button>
      </div>
    </div>

    <!-- Zone des Filtres Multi-critères -->
    <div class="card mb-4 border-0 shadow-sm bg-light rounded-4">
      <div class="card-body p-3">
        <div class="row g-3">
          <div class="col-md-3">
            <select v-model="filters.cycle" class="form-select border-0 shadow-sm">
              <option value="">Tous les Cycles</option>
              <option v-for="c in cycles" :key="c" :value="c">{{ c }}</option>
            </select>
          </div>
          <div class="col-md-3">
            <select v-model="filters.filiere" class="form-select border-0 shadow-sm">
              <option value="">Toutes les Filières</option>
              <option v-for="f in filieres" :key="f" :value="f">{{ f }}</option>
            </select>
          </div>
          <div class="col-md-3">
            <select v-model="filters.mois" class="form-select border-0 shadow-sm">
              <option value="">Tous les Mois</option>
              <option v-for="(nom, index) in moisListe" :key="index" :value="index + 1">
                {{ nom }}
              </option>
            </select>
          </div>
          <div class="col-md-3">
            <select v-model="filters.classe" class="form-select border-0 shadow-sm">
              <option value="">Toutes les Classes</option>
              <option v-for="cl in classes" :key="cl" :value="cl">{{ cl }}</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- Grand Registre des Encaissements -->
    <div class="card mb-4 border-0 shadow-sm rounded-4 overflow-hidden bg-white">
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0 text-center">
            <thead class="bg-light text-secondary small">
              <tr>
                <th class="ps-4 py-3 text-start">Matricule</th>
                <th class="text-start">Nom & Prénom</th>
                <th>Montant</th>
                <th>Type de frais</th>
                <th>Statut</th>
                <th>Date</th>
                <th>Mode</th>
                <th class="text-end pe-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="paiement in filteredPaiements" :key="paiement.id">
                <td class="ps-4 text-start font-monospace fw-bold text-primary">
                  {{ paiement.matricule }}
                </td>
                <td class="text-start fw-semibold text-dark">
                  {{ paiement.nom }} {{ paiement.prenom }}
                </td>
                <td class="fw-bold">{{ formatCurrency(paiement.montant) }}</td>
                <td>
                  <span class="badge bg-light text-dark border">{{ paiement.type }}</span>
                </td>
                <td>
                  <span
                    class="badge px-2 py-1 rounded-pill fw-bold"
                    :class="
                      paiement.statut === 'Payé'
                        ? 'bg-soft-success text-success'
                        : 'bg-soft-warning text-warning'
                    "
                  >
                    <i
                      class="bi me-1"
                      :class="
                        paiement.statut === 'Payé' ? 'bi-check-circle-fill' : 'bi-clock-history'
                      "
                    ></i>
                    {{ paiement.statut }}
                  </span>
                </td>
                <td class="small text-muted">{{ paiement.date }}</td>
                <td>
                  <span class="small font-monospace bg-light px-2 py-1 rounded">{{
                    paiement.mode
                  }}</span>
                </td>
                <td class="text-end pe-4">
                  <button
                    @click="generateReceipt(paiement)"
                    class="btn btn-soft-primary btn-sm rounded-circle p-2 border-0"
                    title="Imprimer le reçu officiel"
                  >
                    <i class="bi bi-printer"></i>
                  </button>
                </td>
              </tr>

              <!-- Ligne de Résumé Financier (Cumul dynamique) -->
              <tr v-if="filteredPaiements.length > 0" class="table-light border-top fw-bold">
                <td colspan="2" class="ps-4 text-start py-3 text-uppercase text-muted small">
                  Total Collecté Filtré :
                </td>
                <td class="text-primary fs-6">{{ formatCurrency(totalFiltré) }}</td>
                <td colspan="5"></td>
              </tr>

              <!-- Aucun paiement trouvé -->
              <tr v-if="filteredPaiements.length === 0">
                <td colspan="8" class="text-center py-5 text-muted">
                  <i class="bi bi-folder-x display-4 text-light d-block mb-2"></i>
                  <p class="small mb-0">Aucun paiement ne correspond à ces critères.</p>
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
import { ref, computed, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useNotificationStore } from '@/shared/stores/notificationStore';
import { useTableExport } from '@/shared/composables/useTableExport';
import { usePaiementStore } from '@/modules/finances/stores/paiements';
import { imprimerRecu } from '@/modules/finances/utils/recu';

/**
 * Registre des encaissements.
 *
 * Les deux paiements affichés étaient codés en dur, comme les listes de cycles,
 * de filières et de classes des filtres : on filtrait donc un tableau constant
 * de deux lignes sur des valeurs (« Doctorat », « L1-A ») qui n'existaient nulle
 * part en base. Les trois boutons d'export et le bouton « Reçu » se contentaient
 * d'un `alert()`.
 *
 * Tout vient désormais de `GET /finance/paiements`, dont la vue serveur
 * (`v_finance_paiements`) rend précisément les colonnes attendues ici —
 * `matricule`, `nom`, `prenom`, `montant`, `type`, `statut`, `date`, `mode`,
 * `cycle`, `filiere`, `classe`. Le balisage n'a pas bougé.
 */

const store = usePaiementStore();
const notifications = useNotificationStore();
const { items: paiements } = storeToRefs(store);

const moisListe = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
];

const filters = ref({
  cycle: '',
  filiere: '',
  mois: '',
  classe: '',
});

onMounted(() => store.fetchAll());

/**
 * Les options des filtres sont déduites des paiements chargés, et non d'une
 * liste figée : elles ne peuvent donc pas proposer une classe qui n'existe pas,
 * ni omettre une classe qui existe.
 *
 * @param {string} champ
 */
const valeursDistinctes = (champ) =>
  [...new Set(paiements.value.map((paiement) => paiement[champ]).filter(Boolean))].sort();

const cycles = computed(() => valeursDistinctes('cycle'));
const filieres = computed(() => valeursDistinctes('filiere'));
const classes = computed(() => valeursDistinctes('classe'));

const filteredPaiements = computed(() =>
  paiements.value.filter((p) => {
    // `date` est servie au format JJ/MM/AAAA : le mois est le second segment.
    const moisPaiement = parseInt(String(p.date ?? '').split('/')[1], 10);

    return (
      (filters.value.cycle === '' || p.cycle === filters.value.cycle) &&
      (filters.value.filiere === '' || p.filiere === filters.value.filiere) &&
      (filters.value.classe === '' || p.classe === filters.value.classe) &&
      (filters.value.mois === '' || moisPaiement === parseInt(filters.value.mois, 10))
    );
  })
);

// Les montants arrivent en chaînes (`NUMERIC` PostgreSQL) : sans `Number()`,
// l'addition les concaténerait.
const totalFiltré = computed(() =>
  filteredPaiements.value.reduce((total, paiement) => total + Number(paiement.montant ?? 0), 0)
);

const formatCurrency = (value) =>
  new Intl.NumberFormat('fr-FR').format(Number(value ?? 0)) + ' FCFA';

const exportRows = computed(() =>
  filteredPaiements.value.map((paiement) => ({
    Matricule: paiement.matricule,
    Nom: paiement.nom,
    Prénom: paiement.prenom,
    Montant: Number(paiement.montant ?? 0),
    'Type de frais': paiement.type,
    Statut: paiement.statut,
    Date: paiement.date,
    Mode: paiement.mode,
    Classe: paiement.classe ?? '—',
    Filière: paiement.filiere ?? '—',
  }))
);

const { exportToExcel, exportToPdf, exportToCsv } = useTableExport({
  rows: exportRows,
  title: 'Registre des encaissements',
  fileBaseName: 'paiements',
});

/** @param {'csv'|'excel'|'pdf'} format */
const exportData = (format) => {
  if (format === 'csv') return exportToCsv();
  if (format === 'excel') return exportToExcel();
  return exportToPdf();
};

/**
 * Le reçu n'est pas fabriqué ici : le serveur l'a émis au moment de
 * l'encaissement. On le récupère, puis on l'imprime.
 *
 * @param {any} paiement
 */
const generateReceipt = async (paiement) => {
  const recu = await store.fetchRecu(paiement.id);
  if (!recu) return;

  try {
    await imprimerRecu(recu);
  } catch (error) {
    notifications.notifyError(error, 'Impossible d’ouvrir la fenêtre d’impression.');
  }
};
</script>

<style scoped>
/* Nuances de couleurs douces / Flat Design */
.bg-soft-success {
  background-color: rgba(40, 167, 69, 0.12);
}
.bg-soft-warning {
  background-color: rgba(255, 193, 7, 0.15);
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

.btn-soft-primary {
  background-color: rgba(0, 123, 255, 0.08);
  color: #007bff;
}
.btn-soft-primary:hover {
  background-color: #007bff;
  color: white;
}

.btn-white {
  background-color: #ffffff;
}

/* Identité ERP */
.rounded-4 {
  border-radius: 0.2rem !important;
}
.form-select {
  font-size: 0.85rem;
}
.form-select:focus {
  box-shadow: none;
  background-color: #fff;
}
</style>
