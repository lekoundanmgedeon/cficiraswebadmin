<template>
  <div class="rapport-paiements-container">
    <!-- Header de la section -->
    <div class="col-12 mb-4">
      <h3 class="fw-bold mb-1">Rapport de Performance des Paiements</h3>
      <p class="text-muted small mb-0">
        <i class="bi bi-bar-chart-line-fill me-1"></i>
        Visualisation analytique des flux de trésorerie, répartition des modes de règlement et
        historique des encaissements.
      </p>
    </div>

    <!-- Section Graphique Analytics -->
    <div class="row mb-4 g-3">
      <!-- Camembert : répartition par mode de paiement -->
      <div class="col-md-5">
        <div class="card border-0 shadow-sm rounded-4 bg-white p-3 h-100">
          <h6 class="fw-bold text-dark mb-3 small text-uppercase text-secondary tracking-wider">
            <i class="bi bi-pie-chart text-primary me-2"></i>Modes de Règlement
          </h6>
          <div class="chart-container position-relative m-auto" style="height: 220px; width: 100%">
            <canvas id="chartModePaiement"></canvas>
          </div>
        </div>
      </div>

      <!-- Histogramme : montants encaissés par mois -->
      <div class="col-md-7">
        <div class="card border-0 shadow-sm rounded-4 bg-white p-3 h-100">
          <h6 class="fw-bold text-dark mb-3 small text-uppercase text-secondary tracking-wider">
            <i class="bi bi-graph-up-arrow text-success me-2"></i>Volume des Encaissements Mensuels
          </h6>
          <div class="chart-container position-relative" style="height: 220px; width: 100%">
            <canvas id="chartMontants"></canvas>
          </div>
        </div>
      </div>
    </div>

    <!-- Extrait du registre : les graphiques, eux, portent sur tout l'exercice -->
    <div class="card shadow-sm border-0 rounded-4 overflow-hidden bg-white">
      <div class="card-header bg-white border-0 pt-4 px-4 pb-2">
        <h5 class="fw-bold text-dark mb-0">
          <i class="bi bi-list-check text-primary me-2"></i>Détail des flux comptabilisés
        </h5>
        <p class="text-muted small mb-0">
          Les {{ PROFONDEUR_APERCU }} encaissements les plus récents. Les graphiques ci-dessus, eux,
          portent sur l'intégralité du registre ; le registre complet se consulte dans « Paiements
          ».
        </p>
      </div>
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
                <th class="text-end pe-4">Mode</th>
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
                <td class="fw-bold font-monospace">{{ formatCurrency(paiement.montant) }}</td>
                <td>
                  <span class="badge bg-light text-dark border">{{ paiement.type }}</span>
                </td>
                <td>
                  <span
                    class="badge px-3 py-1 rounded-pill fw-bold"
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
                <td class="small text-muted font-monospace">{{ formatDate(paiement.date) }}</td>
                <td class="text-end pe-4">
                  <span class="small font-monospace bg-light px-2 py-1 rounded text-secondary">{{
                    paiement.mode
                  }}</span>
                </td>
              </tr>
              <tr v-if="paiements.length === 0">
                <td colspan="8" class="text-center py-5 text-muted">
                  <i class="bi bi-folder-x display-4 text-light d-block mb-2"></i>
                  <p class="small mb-0">Aucun paiement enregistré pour générer le rapport.</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div v-if="paiements.length" class="card-footer bg-white border-0 py-3 px-4">
        <Pagination
          v-model="page"
          v-model:items-per-page="itemsPerPage"
          :total-items="paiements.length"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue';
import { storeToRefs } from 'pinia';
import Chart from 'chart.js/auto';
import Pagination from '@/components/shared/Pagination.vue';
import { usePagination } from '@/shared/composables/usePagination';
import { usePaiementStore } from '@/modules/finances/stores/paiements';
import { useRapportStore } from '@/modules/finances/stores/rapports';
import { formatMontant } from '@/shared/utils/parametres';

/**
 * Rapport des paiements.
 *
 * Les trois paiements et les deux graphiques étaient bâtis sur un tableau écrit
 * dans le `onMounted`. Ils viennent maintenant de `GET /finance/paiements`.
 *
 * Les graphiques ne peuvent plus être construits dans `onMounted` : à ce moment,
 * la requête n'est pas revenue et la liste est vide. Ils sont donc (re)dessinés
 * dès que les données arrivent, et détruits avant chaque redessin — sans quoi
 * Chart.js empile ses instances sur le même `<canvas>` et fuit.
 */

const store = usePaiementStore();
const rapportStore = useRapportStore();
const { items: paiements } = storeToRefs(store);

/** @type {import('vue').Ref<Chart|null>} */
const chartModeInstance = ref(null);
/** @type {import('vue').Ref<Chart|null>} */
const chartMontantsInstance = ref(null);

/**
 * ⚠️ **`GET /finance/paiements` plafonne à 200 lignes** quand `limite` n'est pas
 * transmis. Les deux graphiques, qui étaient recomposés à partir de cette liste,
 * ne portaient donc que sur les 200 encaissements les plus récents — pour 7 497
 * en base — sans que rien ne le signale.
 *
 * Les deux agrégats existent côté serveur, et le store les servait déjà sans
 * qu'aucun écran ne les appelle : `GET /finance/rapports/repartition-modes` et
 * `/rapports/encaissements-mensuels`. Ils portent sur **tout** le registre, pour
 * quelques centaines d'octets — là où charger les 7 497 lignes coûterait 8 Mo.
 *
 * Le tableau, lui, reste un extrait : c'est un aperçu du registre, et il le dit.
 */
const PROFONDEUR_APERCU = 200;

onMounted(() => {
  store.fetchAll({ params: { limite: PROFONDEUR_APERCU } });
  rapportStore.fetchRepartitionModes();
  rapportStore.fetchEncaissementsMensuels();
});

const { page, itemsPerPage, startIndex, paginated } = usePagination(paiements, { perPage: 15 });

/** Répartition par mode, en nombre de versements — sur tout le registre. */
const repartitionModes = computed(() => {
  const compteurs = {};
  for (const ligne of rapportStore.repartitionModes) {
    if (!ligne.mode) continue;
    compteurs[ligne.mode] = Number(ligne.nb_paiements ?? 0);
  }
  return compteurs;
});

/**
 * Volume encaissé par mois — sur tout le registre.
 *
 * Le serveur rend `mois` au format `AAAA-MM`, du plus récent au plus ancien :
 * on le remet dans l'ordre chronologique et on l'écrit en toutes lettres.
 */
const volumeParMois = computed(() => {
  const totaux = {};

  for (const ligne of [...rapportStore.encaissementsMensuels].reverse()) {
    const [annee, mois] = String(ligne.mois ?? '').split('-');
    if (!annee || !mois) continue;

    const date = new Date(Number(annee), Number(mois) - 1, 1);
    const libelle = date.toLocaleString('fr-FR', { month: 'long', year: 'numeric' });
    totaux[libelle.charAt(0).toUpperCase() + libelle.slice(1)] = Number(ligne.total ?? 0);
  }

  return totaux;
});

function dessinerGraphiques() {
  chartModeInstance.value?.destroy();
  chartMontantsInstance.value?.destroy();

  const ctxMode = document.getElementById('chartModePaiement');
  if (ctxMode) {
    chartModeInstance.value = new Chart(ctxMode, {
      type: 'doughnut',
      data: {
        labels: Object.keys(repartitionModes.value),
        datasets: [
          {
            data: Object.values(repartitionModes.value),
            backgroundColor: ['#007bff', '#ffc107', '#28a745', '#dc3545', '#6f42c1', '#20c997'],
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } },
        },
      },
    });
  }

  const ctxMontants = document.getElementById('chartMontants');
  if (ctxMontants) {
    chartMontantsInstance.value = new Chart(ctxMontants, {
      type: 'bar',
      data: {
        labels: Object.keys(volumeParMois.value),
        datasets: [
          {
            label: 'Volume encaissé',
            data: Object.values(volumeParMois.value),
            backgroundColor: 'rgba(40, 167, 69, 0.85)',
            borderRadius: 4,
            barThickness: 25,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { grid: { display: true, drawBorder: false }, ticks: { font: { size: 10 } } },
          x: { grid: { display: false } },
        },
      },
    });
  }
}

// `nextTick` : les `<canvas>` sont sous un `v-if` sur la liste ; ils n'existent
// dans le DOM qu'au rendu qui suit l'arrivée des données.
// Les graphiques suivent désormais les **agrégats**, et non la liste paginée :
// les observer aurait redessiné sur une donnée qui ne les alimente plus.
watch([repartitionModes, volumeParMois], async () => {
  await nextTick();
  dessinerGraphiques();
});

onBeforeUnmount(() => {
  chartModeInstance.value?.destroy();
  chartMontantsInstance.value?.destroy();
});

// Devise réglée depuis l'écran Paramètres, plus « FCFA » en dur.
const formatCurrency = (value) => formatMontant(value);

/**
 * Le serveur sert déjà la date au format JJ/MM/AAAA. La reformater la
 * casserait : `new Date('20/10/2023')` est invalide. On ne convertit donc que
 * ce qui ne l'est pas déjà.
 *
 * @param {string} dateStr
 */
const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return dateStr;

  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;

  return date.toLocaleDateString('fr-FR', { year: 'numeric', month: '2-digit', day: '2-digit' });
};
</script>

<style scoped>
/* Teintes douces Flat Design */
.bg-soft-success {
  background-color: rgba(40, 167, 69, 0.12);
}
.bg-soft-warning {
  background-color: rgba(255, 193, 7, 0.15);
}

.tracking-wider {
  letter-spacing: 0.5px;
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

/* Identité visuelle ERP */
.rounded-4 {
  border-radius: 0.2rem !important;
}
</style>
