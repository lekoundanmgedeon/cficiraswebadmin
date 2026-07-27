<template>
  <div class="dash-scolarite-container">
    <!-- Section 1 : Métriques de recouvrement -->
    <div class="row g-3 mb-4">
      <div class="col-md-3">
        <div
          class="card bg-white border-0 shadow-sm p-3 border-start border-primary border-3 rounded-4"
        >
          <span class="text-muted small fw-semibold text-uppercase d-block mb-1"
            >Total Facturé Annuel</span
          >
          <h4 class="fw-bold text-dark mb-1 font-monospace">{{ formatPrice(kpi.total_engage) }}</h4>
          <div class="text-xs text-muted">
            Sur {{ formatNombre(kpi.nb_inscriptions) }} inscriptions
          </div>
        </div>
      </div>

      <div class="col-md-3">
        <div
          class="card bg-white border-0 shadow-sm p-3 border-start border-success border-3 rounded-4"
        >
          <span class="text-muted small fw-semibold text-uppercase d-block mb-1"
            >Taux de Recouvrement</span
          >
          <h4 class="fw-bold text-success mb-1 font-monospace">
            {{ kpi.taux_recouvrement.toFixed(1) }} %
          </h4>
          <div class="progress rounded-pill mt-2" style="height: 5px">
            <div
              class="progress-bar bg-success"
              role="progressbar"
              :style="{ width: `${Math.min(kpi.taux_recouvrement, 100)}%` }"
            ></div>
          </div>
        </div>
      </div>

      <div class="col-md-3">
        <div
          class="card bg-white border-0 shadow-sm p-3 border-start border-warning border-3 rounded-4"
        >
          <span class="text-muted small fw-semibold text-uppercase d-block mb-1"
            >Restes à Recouvrer</span
          >
          <h4 class="fw-bold text-warning mb-1 font-monospace">
            {{ formatPrice(kpi.total_restant) }}
          </h4>
          <div class="text-xs text-danger font-semibold">
            <i class="bi bi-clock-history me-1"></i>
            {{ formatNombre(kpi.nb_en_retard) }} échéances dépassées
          </div>
        </div>
      </div>

      <div class="col-md-3">
        <div
          class="card bg-white border-0 shadow-sm p-3 border-start border-danger border-3 rounded-4"
        >
          <span class="text-muted small fw-semibold text-uppercase d-block mb-1">Débiteurs</span>
          <h4 class="fw-bold text-danger mb-1 font-monospace">
            {{ formatNombre(kpi.nb_debiteurs) }}
          </h4>
          <div class="text-xs text-muted">Dossiers présentant un reliquat</div>
        </div>
      </div>
    </div>

    <div class="row g-3">
      <!-- Section 2 : Encaissements par filière -->
      <div class="col-lg-6">
        <div class="card border-0 shadow-sm rounded-4 bg-white p-4 h-100">
          <h6 class="fw-bold text-dark mb-3 small text-uppercase text-secondary tracking-wider">
            <i class="bi bi-bar-chart-fill text-primary me-2"></i>Volume Encaissé par Filière
          </h6>

          <LoadingSpinner v-if="loading && !bilanFilieres.length" />
          <EmptyState
            v-else-if="!bilanFilieres.length"
            title="Aucun encaissement"
            description="Le bilan par filière se remplira dès le premier paiement enregistré."
            :size="80"
          />
          <div v-else class="chart-container position-relative" style="height: 250px; width: 100%">
            <canvas ref="canvasFilieres"></canvas>
          </div>
        </div>
      </div>

      <!-- Section 3 : Retards les plus lourds -->
      <div class="col-lg-6">
        <div class="card border-0 shadow-sm rounded-4 bg-white p-4 h-100 d-flex flex-column">
          <h6 class="fw-bold text-dark mb-3 small text-uppercase text-secondary tracking-wider">
            <i class="bi bi-exclamation-octagon-fill text-danger me-2"></i>Alertes Recouvrement
            Immédiates
          </h6>

          <div class="table-responsive flex-grow-1">
            <LoadingSpinner v-if="loading && !alertes.length" />
            <EmptyState
              v-else-if="!alertes.length"
              title="Aucun retard de paiement"
              description="Toutes les échéances arrivées à terme sont réglées."
              :size="80"
            />
            <table v-else class="table table-hover align-middle mb-0 text-center text-sm">
              <thead class="bg-light text-secondary text-xs">
                <tr>
                  <th class="text-start ps-2">Étudiant</th>
                  <th>Classe</th>
                  <th>Retard</th>
                  <th class="text-end pe-2">Dossier</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="alerte in alertes" :key="alerte.id">
                  <td class="text-start ps-2">
                    <div class="fw-bold text-dark mb-0 text-xs">{{ alerte.nom }}</div>
                    <small class="text-muted font-monospace text-xs">{{ alerte.matricule }}</small>
                  </td>
                  <td class="font-monospace text-xs fw-semibold">{{ alerte.classe }}</td>
                  <td class="font-monospace text-xs text-danger fw-bold">
                    {{ formatPrice(alerte.montant) }}
                  </td>
                  <td class="text-end pe-2">
                    <!--
                      L'ancien bouton « Relancer » affichait « Notification de mise
                      en demeure envoyée par SMS » sans rien envoyer : aucun service
                      de notification n'existe côté serveur. Il cède la place au seul
                      geste réellement disponible — ouvrir le dossier de l'étudiant.
                    -->
                    <RouterLink
                      :to="`/dossiers-scolaires/${alerte.etudiantId}`"
                      class="btn btn-xs btn-light text-primary border-0 font-semibold py-1 px-2"
                      style="font-size: 11px"
                    >
                      <i class="bi bi-folder2-open"></i> Ouvrir
                    </RouterLink>
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

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import Chart from 'chart.js/auto';
import { storeToRefs } from 'pinia';
import { RouterLink } from 'vue-router';
import EmptyState from '@/shared/components/EmptyState.vue';
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue';
import { useRapportStore } from '@/modules/finances/stores/rapports';
import { getSuiviTraites } from '@/modules/finances/api';
import { formatMoney } from '@/modules/finances/constants';

/**
 * Les agrégats financiers viennent du module `finances`, qui les expose déjà.
 * Le dashboard ne duplique donc ni les appels ni les conversions numériques —
 * même montage dirigé que `notes → examens`.
 */
const rapports = useRapportStore();
const { kpi, bilanFilieres, loading } = storeToRefs(rapports);

const alertes = ref([]);
const canvasFilieres = ref(null);
let instance = null;

const formatNombre = (valeur) => new Intl.NumberFormat('fr-FR').format(valeur ?? 0);
// Le formatage monétaire vient du module finances : une seule définition du
// « FCFA » dans l'application, séparateurs et arrondi compris.
const formatPrice = formatMoney;

/** Les cinq filières les mieux encaissées : au-delà, le graphique devient illisible. */
const filieresAffichees = computed(() =>
  [...bilanFilieres.value].sort((a, b) => b.percu - a.percu).slice(0, 5)
);

const dessiner = async () => {
  await nextTick();
  instance?.destroy();
  instance = null;

  if (!canvasFilieres.value || !filieresAffichees.value.length) return;

  instance = new Chart(canvasFilieres.value, {
    type: 'bar',
    data: {
      labels: filieresAffichees.value.map((ligne) => ligne.filiere ?? ligne.filiere_nom ?? '—'),
      datasets: [
        {
          label: 'Montant Encaissé',
          data: filieresAffichees.value.map((ligne) => ligne.percu),
          backgroundColor: 'rgba(0, 123, 255, 0.85)',
          borderRadius: 2,
          maxBarThickness: 30,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (item) => formatPrice(item.raw) } },
      },
      scales: {
        y: { grid: { color: '#f8f9fa' }, ticks: { font: { size: 10 } } },
        x: { grid: { display: false }, ticks: { font: { size: 11 } } },
      },
    },
  });
};

watch(filieresAffichees, dessiner);

/**
 * `/echeanciers/suivi` rend ses lignes **déjà ordonnées par retard** : les
 * quatre premières sont donc les plus urgentes, sans tri côté client.
 *
 * Les noms de champs viennent de la vue `v_finance_echeances` (`etudiant` est
 * déjà concaténé côté serveur, le reste à payer s'appelle `reste` — et non
 * `montant_restant`).
 */
const chargerAlertes = async () => {
  try {
    const reponse = await getSuiviTraites({ statut: 'EN_RETARD', limite: 4 });
    alertes.value = (reponse.data ?? []).slice(0, 4).map((ligne) => ({
      id: ligne.id,
      etudiantId: ligne.etudiant_id,
      matricule: ligne.matricule ?? '—',
      nom: ligne.etudiant || `${ligne.nom ?? ''} ${ligne.prenom ?? ''}`.trim() || '—',
      classe: ligne.classe_code ?? '—',
      montant: Number(ligne.reste ?? 0) || 0,
    }));
  } catch {
    // Le store des rapports notifie déjà les échecs de cet écran ; une seconde
    // alerte pour la même page serait du bruit. Le tableau reste vide.
    alertes.value = [];
  }
};

onMounted(async () => {
  await Promise.all([rapports.fetchKpi(), rapports.fetchBilanFilieres(), chargerAlertes()]);
  dessiner();
});

onBeforeUnmount(() => {
  instance?.destroy();
  instance = null;
});
</script>

<style scoped>
/* Teintes douces Flat Design */
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
.text-sm {
  font-size: 0.85rem;
}
.tracking-wider {
  letter-spacing: 0.5px;
}

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

/* Alignement structurel strict de la charte ERP */
.rounded-4 {
  border-radius: 0.2rem !important;
}
</style>
