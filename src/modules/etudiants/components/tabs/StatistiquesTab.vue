<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import Chart from 'chart.js/auto';
import EmptyState from '@/shared/components/EmptyState.vue';
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue';
import { useEtudiantStore } from '../../store';

/**
 * Statistiques des étudiants.
 *
 * L'ancienne version affichait quatre étudiants codés en dur et construisait ses
 * graphiques avec `new Chart(document.getElementById(...))` — sans jamais les
 * détruire. Sous `AppTabs`, qui garde les onglets visités en vie via `KeepAlive`,
 * un second montage aurait échoué sur « Canvas is already in use ». Les instances
 * sont donc référencées, mises à jour à chaud et détruites au démontage.
 *
 * Aucun endpoint de statistiques n'existe pour les étudiants : les indicateurs
 * sont dérivés de la liste réelle, servie par `GET /etudiants`.
 */

const etudiantStore = useEtudiantStore();
const { items: etudiants, loading } = storeToRefs(etudiantStore);

/**
 * Deux teintes, validées pour la déficience de vision des couleurs
 * (ΔE protan 127, cible ≥ 12). Le jaune passe sous 3:1 de contraste sur fond
 * clair : la règle de relief impose des libellés visibles — d'où les effectifs
 * et pourcentages écrits en toutes lettres sur la barre de répartition.
 */
const HUE_PRIMARY = '#4b49ac';
const HUE_ACCENT = '#eda100';

const filiereCanvas = ref(null);
const classeCanvas = ref(null);

/** @type {{filiere: Chart|null, classe: Chart|null}} */
const charts = { filiere: null, classe: null };

onMounted(() => etudiantStore.fetchAll());

const total = computed(() => etudiants.value.length);

/**
 * Compte les occurrences d'une clé, du plus fréquent au moins fréquent.
 * @param {string} key @returns {Array<{label: string, value: number}>}
 */
function countBy(key) {
  const counts = new Map();

  for (const etudiant of etudiants.value) {
    const label = etudiant[key] ?? 'Non renseigné';
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

const parFiliere = computed(() => countBy('filiere'));

/** Les classes sont nombreuses : au-delà de 10, le reste est agrégé en « Autres ». */
const parClasse = computed(() => {
  const all = countBy('classe');
  if (all.length <= 10) return all;

  const top = all.slice(0, 10);
  const reste = all.slice(10).reduce((sum, item) => sum + item.value, 0);
  return [...top, { label: 'Autres', value: reste }];
});

const hommes = computed(() => etudiants.value.filter((e) => e.sexe === 'M').length);
const femmes = computed(() => etudiants.value.filter((e) => e.sexe === 'F').length);

/** @param {number} value @returns {number} */
const pourcentage = (value) => (total.value === 0 ? 0 : Math.round((value / total.value) * 100));

const totalFilieres = computed(() => parFiliere.value.length);
const totalClasses = computed(() => countBy('classe').length);

/**
 * Barres horizontales, une seule série : la couleur ne porte aucune identité,
 * une seule teinte suffit et aucune légende n'est nécessaire — le titre nomme
 * la série.
 *
 * @param {HTMLCanvasElement} canvas
 * @param {Array<{label: string, value: number}>} data
 */
function buildBarChart(canvas, data) {
  return new Chart(canvas, {
    type: 'bar',
    data: {
      labels: data.map((item) => item.label),
      datasets: [
        {
          data: data.map((item) => item.value),
          backgroundColor: HUE_PRIMARY,
          borderRadius: 4,
          borderSkipped: 'start',
          barThickness: 14,
        },
      ],
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context) => `${context.parsed.x} étudiant(s)`,
          },
        },
      },
      scales: {
        x: {
          beginAtZero: true,
          ticks: { precision: 0, color: '#6c757d' },
          grid: { color: '#eef2f7' },
        },
        y: {
          ticks: { color: '#52514e' },
          grid: { display: false },
        },
      },
    },
  });
}

function renderCharts() {
  if (filiereCanvas.value) {
    charts.filiere?.destroy();
    charts.filiere = buildBarChart(filiereCanvas.value, parFiliere.value);
  }

  if (classeCanvas.value) {
    charts.classe?.destroy();
    charts.classe = buildBarChart(classeCanvas.value, parClasse.value);
  }
}

// Les canevas n'existent qu'une fois les données chargées (ils sont sous un
// `v-else`), d'où le rendu piloté par la donnée plutôt que par `onMounted`.
watch(
  [parFiliere, parClasse],
  async () => {
    if (total.value === 0) return;
    // Laisse Vue poser les canevas dans le DOM avant de les instancier.
    await new Promise((resolve) => requestAnimationFrame(resolve));
    renderCharts();
  },
  { flush: 'post' }
);

onBeforeUnmount(() => {
  charts.filiere?.destroy();
  charts.classe?.destroy();
});
</script>

<template>
  <div>
    <div class="mb-4">
      <h4 class="fw-bold mb-1">Statistiques des étudiants</h4>
      <p class="text-muted small mb-0">
        Vue d'ensemble des effectifs par filière, classe et genre.
      </p>
    </div>

    <LoadingSpinner v-if="loading" />

    <EmptyState
      v-else-if="total === 0"
      title="Aucune donnée à analyser"
      description="Les statistiques apparaîtront dès qu'au moins un étudiant sera enregistré."
    />

    <div v-else>
      <div class="row g-3 mb-4">
        <div class="col-md-4">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-body">
              <span class="text-muted small fw-semibold text-uppercase d-block mb-1">
                Effectif global
              </span>
              <h3 class="fw-bold text-dark mb-0 font-monospace">{{ total }}</h3>
            </div>
          </div>
        </div>

        <div class="col-md-4">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-body">
              <span class="text-muted small fw-semibold text-uppercase d-block mb-1">
                Filières représentées
              </span>
              <h3 class="fw-bold text-dark mb-0 font-monospace">{{ totalFilieres }}</h3>
            </div>
          </div>
        </div>

        <div class="col-md-4">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-body">
              <span class="text-muted small fw-semibold text-uppercase d-block mb-1">
                Classes occupées
              </span>
              <h3 class="fw-bold text-dark mb-0 font-monospace">{{ totalClasses }}</h3>
            </div>
          </div>
        </div>
      </div>

      <!-- Deux catégories seulement : une barre de proportion dit tout ce qu'un
           camembert dirait, en se lisant d'un coup d'œil. -->
      <div class="card border-0 shadow-sm mb-4">
        <div class="card-body">
          <h6 class="fw-bold mb-3">Répartition par genre</h6>

          <div class="proportion-bar mb-3">
            <div
              class="proportion-segment"
              :style="{ width: pourcentage(hommes) + '%', background: HUE_PRIMARY }"
              :title="`Hommes : ${hommes}`"
            ></div>
            <div
              class="proportion-segment"
              :style="{ width: pourcentage(femmes) + '%', background: HUE_ACCENT }"
              :title="`Femmes : ${femmes}`"
            ></div>
          </div>

          <div class="d-flex gap-4 flex-wrap">
            <div class="d-flex align-items-center">
              <span class="legend-dot me-2" :style="{ background: HUE_PRIMARY }"></span>
              <span class="text-muted small me-2">Hommes</span>
              <span class="fw-bold text-dark">{{ hommes }}</span>
              <span class="text-muted small ms-1">({{ pourcentage(hommes) }} %)</span>
            </div>

            <div class="d-flex align-items-center">
              <span class="legend-dot me-2" :style="{ background: HUE_ACCENT }"></span>
              <span class="text-muted small me-2">Femmes</span>
              <span class="fw-bold text-dark">{{ femmes }}</span>
              <span class="text-muted small ms-1">({{ pourcentage(femmes) }} %)</span>
            </div>
          </div>
        </div>
      </div>

      <div class="row g-4">
        <div class="col-lg-6">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-body">
              <h6 class="fw-bold mb-3">Étudiants par filière</h6>
              <div class="chart-holder">
                <canvas ref="filiereCanvas"></canvas>
              </div>
            </div>
          </div>
        </div>

        <div class="col-lg-6">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-body">
              <h6 class="fw-bold mb-3">Étudiants par classe</h6>
              <div class="chart-holder">
                <canvas ref="classeCanvas"></canvas>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chart-holder {
  position: relative;
  height: 320px;
}

.proportion-bar {
  display: flex;
  height: 14px;
  border-radius: 4px;
  overflow: hidden;
  /* Un filet de surface sépare les deux segments : sans lui, deux teintes
     adjacentes se touchent et la frontière devient ambiguë en vision déficiente. */
  gap: 2px;
  background: #eef2f7;
}

.proportion-segment {
  height: 100%;
  transition: width 0.3s ease;
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
}
</style>
