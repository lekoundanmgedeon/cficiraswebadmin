<template>
  <div class="dash-pedagogie-container">
    <!-- Section 1 : Métriques du corps enseignant -->
    <div class="row g-3 mb-4">
      <div class="col-md-4">
        <div
          class="card bg-white border-0 shadow-sm p-3 border-start border-info border-3 rounded-4"
        >
          <span class="text-muted small fw-semibold text-uppercase d-block mb-1"
            >Corps Enseignant</span
          >
          <h4 class="fw-bold text-info mb-1 font-monospace">{{ nbEnseignants }} Formateurs</h4>
          <div class="text-xs text-muted">
            <i class="bi bi-person-badge me-1"></i> Inscrits au répertoire
          </div>
        </div>
      </div>

      <div class="col-md-4">
        <div
          class="card bg-white border-0 shadow-sm p-3 border-start border-primary border-3 rounded-4"
        >
          <span class="text-muted small fw-semibold text-uppercase d-block mb-1"
            >Cours Attribués</span
          >
          <h4 class="fw-bold text-primary mb-1 font-monospace">
            {{ attributions.length }} Affectations
          </h4>
          <div class="text-xs text-muted">
            <i class="bi bi-diagram-3 me-1"></i> Couples matière → formateur
          </div>
        </div>
      </div>

      <div class="col-md-4">
        <div
          class="card bg-white border-0 shadow-sm p-3 border-start border-success border-3 rounded-4"
        >
          <span class="text-muted small fw-semibold text-uppercase d-block mb-1"
            >Volume Horaire Planifié</span
          >
          <h4 class="fw-bold text-success mb-1 font-monospace">{{ totalHeures }} h</h4>
          <div class="text-xs text-muted">
            <i class="bi bi-clock me-1"></i> Cumul des attributions
          </div>
        </div>
      </div>
    </div>

    <div class="row g-3">
      <!-- Section 2 : Charge horaire par formateur -->
      <div class="col-lg-7">
        <div class="card border-0 shadow-sm rounded-4 bg-white p-4 h-100">
          <h6 class="fw-bold text-dark mb-3 small text-uppercase text-secondary tracking-wider">
            <i class="bi bi-bar-chart-fill text-info me-2"></i>Charge Horaire par Formateur
          </h6>

          <LoadingSpinner v-if="loading && !attributions.length" />
          <EmptyState
            v-else-if="!chargesAffichees.length"
            title="Aucune attribution"
            description="La charge horaire se remplira dès qu'un cours sera attribué à un formateur."
            :size="80"
          />
          <div v-else class="chart-container position-relative" style="height: 260px; width: 100%">
            <canvas ref="canvasCharges"></canvas>
          </div>
        </div>
      </div>

      <!-- Section 3 : Détail des attributions -->
      <div class="col-lg-5">
        <div class="card border-0 shadow-sm rounded-4 bg-white p-4 h-100 d-flex flex-column">
          <h6 class="fw-bold text-dark mb-3 small text-uppercase text-secondary tracking-wider">
            <i class="bi bi-list-check text-primary me-2"></i>Dernières Attributions
          </h6>

          <div class="table-responsive flex-grow-1">
            <LoadingSpinner v-if="loading && !attributions.length" />
            <EmptyState
              v-else-if="!attributions.length"
              title="Aucun cours attribué"
              description="Les affectations apparaîtront ici une fois saisies."
              :size="80"
            />
            <table v-else class="table table-hover align-middle mb-0 text-sm">
              <thead class="bg-light text-secondary text-xs">
                <tr>
                  <th class="ps-2">Formateur</th>
                  <th>Matière</th>
                  <th class="text-end pe-2">Heures</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="ligne in attributionsRecentes" :key="ligne.id">
                  <td class="ps-2">
                    <div class="fw-bold text-dark mb-0 text-xs">{{ ligne.formateur }}</div>
                    <small class="text-muted font-monospace text-xs">{{ ligne.classe }}</small>
                  </td>
                  <td class="text-xs">{{ ligne.matiere }}</td>
                  <td class="text-end pe-2 font-monospace text-xs fw-semibold">
                    {{ ligne.heures }} h
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
import EmptyState from '@/shared/components/EmptyState.vue';
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue';
import { useDashboardStore } from '../../store';

const store = useDashboardStore();
const { attributions, loading, nbEnseignants } = storeToRefs(store);

const canvasCharges = ref(null);
let instance = null;

/**
 * `vue_attributions_cours` (migration backend `008`) sert ses libellés déjà
 * résolus — `formateur`, `matiere`, `classe` — et sa clé s'appelle
 * `attribution_id`, non `id`. Seul le repli sur tiret reste utile : une
 * attribution dont le formateur a été supprimé garde une colonne nulle.
 */
const attributionsNormalisees = computed(() =>
  attributions.value.map((ligne) => ({
    id: ligne.attribution_id,
    formateur: ligne.formateur || '—',
    matiere: ligne.matiere || ligne.module_code || '—',
    classe: ligne.classe || '—',
    heures: ligne.heures ?? 0,
  }))
);

const attributionsRecentes = computed(() => attributionsNormalisees.value.slice(0, 6));

const totalHeures = computed(() =>
  attributionsNormalisees.value.reduce((total, ligne) => total + ligne.heures, 0)
);

/** Heures cumulées par formateur, les huit plus chargés. */
const chargesAffichees = computed(() => {
  const parFormateur = new Map();

  for (const ligne of attributionsNormalisees.value) {
    const cle = ligne.formateur || '—';
    parFormateur.set(cle, (parFormateur.get(cle) ?? 0) + ligne.heures);
  }

  return [...parFormateur.entries()]
    .map(([formateur, heures]) => ({ formateur, heures }))
    .filter((ligne) => ligne.heures > 0)
    .sort((a, b) => b.heures - a.heures)
    .slice(0, 8);
});

const dessiner = async () => {
  await nextTick();
  instance?.destroy();
  instance = null;

  if (!canvasCharges.value || !chargesAffichees.value.length) return;

  instance = new Chart(canvasCharges.value, {
    type: 'bar',
    data: {
      labels: chargesAffichees.value.map((ligne) => ligne.formateur),
      datasets: [
        {
          label: 'Heures attribuées',
          data: chargesAffichees.value.map((ligne) => ligne.heures),
          backgroundColor: '#17a2b8',
          borderRadius: 2,
          maxBarThickness: 25,
        },
      ],
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: '#f8f9fa' }, ticks: { font: { size: 10 }, precision: 0 } },
        y: { grid: { display: false }, ticks: { font: { size: 10 } } },
      },
    },
  });
};

watch(chargesAffichees, dessiner);

onMounted(async () => {
  await Promise.all([store.fetchEnseignants(), store.fetchAttributions()]);
  dessiner();
});

onBeforeUnmount(() => {
  instance?.destroy();
  instance = null;
});
</script>

<style scoped>
/* Code couleurs du Design System de l'ERP */
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
