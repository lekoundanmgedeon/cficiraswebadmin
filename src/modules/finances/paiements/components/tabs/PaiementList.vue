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

        <!--
          Le périmètre chargé est dit, et il se choisit : sans cela, l'écran
          affichait les 200 derniers encaissements en laissant croire qu'il les
          montrait tous — et son cumul portait sur ces 200.
        -->
        <div class="row g-2 align-items-center mt-1">
          <div class="col-md-4 d-flex align-items-center gap-2">
            <label for="profondeur-registre" class="text-muted small text-nowrap mb-0">
              Périmètre chargé :
            </label>
            <select
              id="profondeur-registre"
              v-model.number="profondeur"
              class="form-select form-select-sm border-0 shadow-sm"
              :disabled="loading"
            >
              <option v-for="option in PROFONDEURS" :key="option.valeur" :value="option.valeur">
                {{ option.label }}
              </option>
            </select>
          </div>
          <div class="col-md-8 text-md-end">
            <span class="text-muted small">
              <i class="bi bi-info-circle me-1"></i>
              {{ paiements.length }} encaissement(s) chargé(s) ·
              {{ filteredPaiements.length }} après filtres. Les filtres ci-dessus s'appliquent au
              périmètre chargé.
            </span>
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
                <th class="ps-4 py-3 text-start" style="width: 70px">#</th>
                <th class="text-start">Matricule</th>
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
              <tr v-for="(paiement, index) in paginated" :key="paiement.id">
                <td class="ps-4 text-start text-muted small">{{ startIndex + index + 1 }}</td>
                <td class="text-start font-monospace fw-bold text-primary">
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

              <!-- Cumul de la sélection entière, et non de la page affichée -->
              <tr v-if="filteredPaiements.length > 0" class="table-light border-top fw-bold">
                <td colspan="3" class="ps-4 text-start py-3 text-uppercase text-muted small">
                  Total collecté sur le périmètre chargé ({{ filteredPaiements.length }}
                  encaissement(s)) :
                </td>
                <td class="text-primary fs-6">{{ formatCurrency(totalFiltré) }}</td>
                <td colspan="5"></td>
              </tr>

              <!-- Aucun paiement trouvé -->
              <tr v-if="filteredPaiements.length === 0">
                <td colspan="9" class="text-center py-5 text-muted">
                  <i class="bi bi-folder-x display-4 text-light d-block mb-2"></i>
                  <p class="small mb-0">Aucun paiement ne correspond à ces critères.</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div v-if="filteredPaiements.length" class="card-footer bg-white border-0 py-3 px-4">
        <Pagination
          v-model="page"
          v-model:items-per-page="itemsPerPage"
          :total-items="filteredPaiements.length"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { storeToRefs } from 'pinia';
import Pagination from '@/components/shared/Pagination.vue';
import { useNotificationStore } from '@/shared/stores/notificationStore';
import { useTableExport } from '@/shared/composables/useTableExport';
import { usePagination } from '@/shared/composables/usePagination';
import { usePaiementStore } from '@/modules/finances/stores/paiements';
import { imprimerRecu } from '@/modules/finances/utils/recu';
import { formatMontant } from '@/shared/utils/parametres';

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
const { items: paiements, loading } = storeToRefs(store);

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

/**
 * Profondeur de chargement.
 *
 * ⚠️ **Le serveur plafonne à 200 lignes** quand `limite` n'est pas transmis
 * (`paiement.model.js` : `values.push(Number(limite) > 0 ? Number(limite) : 200)`).
 * L'écran affichait donc les 200 encaissements les plus récents **sans le dire**,
 * et son « total collecté » ne portait que sur eux — un chiffre faux présenté
 * comme le total.
 *
 * Le registre complet pèse 8 Mo pour 7 497 lignes : le charger d'office à chaque
 * ouverture serait payer cher une exhaustivité dont on n'a pas toujours besoin.
 * La profondeur est donc **choisie**, et affichée.
 */
const PROFONDEURS = [
  { valeur: 200, label: '200 derniers' },
  { valeur: 1000, label: '1 000 derniers' },
  { valeur: 5000, label: '5 000 derniers' },
  { valeur: 100000, label: 'Tout le registre' },
];

const profondeur = ref(200);

const charger = () => store.fetchAll({ params: { limite: profondeur.value } });

onMounted(charger);

// Recharger, et non filtrer : la profondeur est une question posée au serveur.
watch(profondeur, charger);

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

/**
 * Le registre rendait toutes les lignes chargées d'un bloc. La page revient à 1
 * dès qu'un filtre ou la profondeur change : la page 40 du registre complet n'a
 * aucun sens une fois le mois de mars retenu.
 */
const { page, itemsPerPage, startIndex, paginated } = usePagination(filteredPaiements, {
  perPage: 15,
  resetKey: () => [
    filters.value.cycle,
    filters.value.filiere,
    filters.value.mois,
    filters.value.classe,
    profondeur.value,
  ],
});

// Les montants arrivent en chaînes (`NUMERIC` PostgreSQL) : sans `Number()`,
// l'addition les concaténerait.
// ⚠️ Le cumul porte sur **toute la sélection**, pas sur la page affichée : un
// total qui changerait en tournant les pages ne voudrait rien dire.
const totalFiltré = computed(() =>
  filteredPaiements.value.reduce((total, paiement) => total + Number(paiement.montant ?? 0), 0)
);

// Devise réglée depuis l'écran Paramètres, plus « FCFA » en dur.
const formatCurrency = (value) => formatMontant(value);

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
