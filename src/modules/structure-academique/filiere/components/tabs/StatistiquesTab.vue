<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import Chart from 'chart.js/auto';
import { storeToRefs } from 'pinia';
import EmptyState from '@/shared/components/EmptyState.vue';
import ExportMenu from '@/shared/components/ExportMenu.vue';
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue';
import { useTableExport } from '@/shared/composables/useTableExport';
import { useFiliereStore } from '../../store';
import {
  badgeStatut,
  barreTaux,
  classeTaux,
  couleurSerie,
  couleurTaux,
  formatNombre,
  formatTaux,
} from '../../constants';

/**
 * Statistiques des filières.
 *
 * L'écran ne se contentait que de deux compteurs (`nb_etudiants`, `nb_classes`)
 * pour **une** filière choisie dans une liste déroulante : aucune vue
 * d'ensemble, aucun graphique, et la capacité — pourtant servie par
 * `v_organisation_filieres` — n'apparaissait nulle part.
 *
 * Il croise désormais les deux lectures disponibles (voir `filieresEnrichies`),
 * en tire des graphiques, des diagnostics dérivés des chiffres affichés, et
 * conserve le détail par filière en bas d'écran.
 */

const store = useFiliereStore();
const {
  loading,
  stats,
  filieresEnrichies,
  filieresActives,
  repartitionParCycle,
  indicateursFilieres,
  analysesFilieres,
} = storeToRefs(store);

/** Au-delà, le graphique devient illisible : les suivantes passent en tableau. */
const TOP_MAX = 10;

const selectedFiliereId = ref('');

const canvasEffectifs = ref(null);
const canvasCycles = ref(null);
const canvasRemplissage = ref(null);
/** @type {Record<string, any>} */
const instances = {};

const aucuneDonnee = computed(() => !filieresEnrichies.value.length);
const cyclesPeuples = computed(() => repartitionParCycle.value.filter((c) => c.effectif > 0));
const topActives = computed(() => filieresActives.value.slice(0, TOP_MAX));

/** Le remplissage ne se lit que sur les filières dont la capacité est déclarée. */
const filieresAvecCapacite = computed(() =>
  filieresEnrichies.value.filter((filiere) => filiere.capacite > 0).sort((a, b) => b.taux - a.taux)
);

const filiereSelectionnee = computed(() =>
  filieresEnrichies.value.find((filiere) => String(filiere.id) === String(selectedFiliereId.value))
);

const tonClasse = (ton) =>
  ({
    danger: 'border-danger text-danger',
    warning: 'border-warning text-warning',
    info: 'border-info text-info',
    success: 'border-success text-success',
  })[ton] || 'border-secondary text-secondary';

const { exportToExcel, exportToPdf } = useTableExport({
  rows: computed(() =>
    filieresEnrichies.value.map((filiere) => ({
      Code: filiere.code,
      Filière: filiere.designation,
      Cycle: filiere.cycle,
      Classes: filiere.nbClasses,
      Inscrits: filiere.effectif,
      Capacité: filiere.capacite,
      'Places restantes': filiere.placesRestantes,
      'Taux de remplissage': `${filiere.taux.toFixed(1)} %`,
      'Moyenne par classe': filiere.tailleMoyenneClasse.toFixed(1),
      Statut: filiere.statut,
    }))
  ),
  title: 'Statistiques des filières',
  fileBaseName: 'statistiques_filieres',
});

const detruire = () => {
  for (const cle of Object.keys(instances)) {
    instances[cle]?.destroy();
    delete instances[cle];
  }
};

const dessiner = async () => {
  await nextTick();
  detruire();

  if (canvasEffectifs.value && topActives.value.length) {
    instances.effectifs = new Chart(canvasEffectifs.value, {
      type: 'bar',
      data: {
        labels: topActives.value.map((filiere) => filiere.code || filiere.designation),
        datasets: [
          {
            label: 'Inscrits',
            data: topActives.value.map((filiere) => filiere.effectif),
            backgroundColor: topActives.value.map((filiere) => couleurTaux(filiere.taux)),
            borderRadius: 2,
            maxBarThickness: 42,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              title: (items) => topActives.value[items[0].dataIndex]?.designation ?? '',
              afterLabel: (item) => {
                const filiere = topActives.value[item.dataIndex];
                if (!filiere) return '';
                return filiere.capacite > 0
                  ? `${filiere.taux.toFixed(1)} % de ${filiere.capacite} places · ${filiere.nbClasses} classe(s)`
                  : `Capacité non déclarée · ${filiere.nbClasses} classe(s)`;
              },
            },
          },
        },
        scales: {
          y: { grid: { color: '#f8f9fa' }, ticks: { font: { size: 10 }, precision: 0 } },
          x: { grid: { display: false }, ticks: { font: { size: 11 } } },
        },
      },
    });
  }

  if (canvasCycles.value && cyclesPeuples.value.length) {
    instances.cycles = new Chart(canvasCycles.value, {
      type: 'doughnut',
      data: {
        labels: cyclesPeuples.value.map((cycle) => cycle.cycle),
        datasets: [
          {
            data: cyclesPeuples.value.map((cycle) => cycle.effectif),
            backgroundColor: cyclesPeuples.value.map((_, index) => couleurSerie(index)),
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '62%',
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } },
          tooltip: {
            callbacks: {
              afterLabel: (item) => {
                const cycle = cyclesPeuples.value[item.dataIndex];
                return cycle
                  ? `${cycle.nbFilieresActives}/${cycle.nbFilieres} filière(s) active(s)`
                  : '';
              },
            },
          },
        },
      },
    });
  }

  if (canvasRemplissage.value && filieresAvecCapacite.value.length) {
    instances.remplissage = new Chart(canvasRemplissage.value, {
      type: 'bar',
      data: {
        labels: filieresAvecCapacite.value.map((filiere) => filiere.code || filiere.designation),
        datasets: [
          {
            label: 'Taux de remplissage',
            data: filieresAvecCapacite.value.map((filiere) => Number(filiere.taux.toFixed(1))),
            backgroundColor: filieresAvecCapacite.value.map((filiere) => couleurTaux(filiere.taux)),
            borderRadius: 2,
            maxBarThickness: 26,
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
              title: (items) => filieresAvecCapacite.value[items[0].dataIndex]?.designation ?? '',
              label: (item) => {
                const filiere = filieresAvecCapacite.value[item.dataIndex];
                if (!filiere) return '';
                return `${filiere.taux.toFixed(1)} % — ${filiere.effectif}/${filiere.capacite} places`;
              },
            },
          },
        },
        scales: {
          x: {
            grid: { color: '#f8f9fa' },
            ticks: { font: { size: 10 }, callback: (valeur) => `${valeur} %` },
          },
          y: { grid: { display: false }, ticks: { font: { size: 11 } } },
        },
      },
    });
  }
};

// Un seul déclencheur de tracé : les canvas naissent avec les données (ils sont
// sous `v-else`), et les deux lectures arrivent en parallèle. Redessiner en plus
// après `fetchAnalyse()` construirait six graphiques pour en afficher trois.
watch(filieresEnrichies, dessiner, { immediate: true });

// Le détail par filière reste servi par `GET /filieres/:id/stats` : c'est le
// compte du serveur, et non une projection de la liste.
watch(selectedFiliereId, (id) => {
  if (id) store.fetchStats(id);
});

onMounted(() => store.fetchAnalyse());

onBeforeUnmount(detruire);
</script>

<template>
  <div>
    <div class="d-flex justify-content-between align-items-start mb-3">
      <div>
        <h4 class="mb-1">Statistiques des filières</h4>
        <p class="text-muted mb-0 small">
          Effectifs, capacités et remplissage des filières sur l'année académique active.
        </p>
      </div>
      <ExportMenu :disabled="aucuneDonnee" @excel="exportToExcel" @pdf="exportToPdf" />
    </div>

    <LoadingSpinner v-if="loading && aucuneDonnee" />

    <EmptyState
      v-else-if="aucuneDonnee"
      title="Aucune filière enregistrée"
      description="Créez une filière depuis l'onglet « Liste des filières » pour voir apparaître ses statistiques."
    />

    <template v-else>
      <!-- Indicateurs de tête -->
      <div class="row g-3 mb-4">
        <div class="col-6 col-lg-3">
          <div class="card border-0 shadow-sm p-3 border-start border-primary border-3 h-100">
            <span class="text-muted small fw-semibold text-uppercase d-block mb-1">
              Filières actives
            </span>
            <h4 class="fw-bold text-primary mb-1 font-monospace">
              {{ indicateursFilieres.nbActives }}
            </h4>
            <div class="text-xs text-muted">
              <i class="bi bi-diagram-3 me-1"></i>
              sur {{ indicateursFilieres.nbFilieres }} déclarée(s)
            </div>
          </div>
        </div>

        <div class="col-6 col-lg-3">
          <div class="card border-0 shadow-sm p-3 border-start border-success border-3 h-100">
            <span class="text-muted small fw-semibold text-uppercase d-block mb-1">
              Étudiants inscrits
            </span>
            <h4 class="fw-bold text-success mb-1 font-monospace">
              {{ formatNombre(indicateursFilieres.effectifTotal) }}
            </h4>
            <div class="text-xs text-muted">
              <i class="bi bi-people me-1"></i>
              répartis sur {{ indicateursFilieres.nbClasses }} classe(s)
            </div>
          </div>
        </div>

        <div class="col-6 col-lg-3">
          <div class="card border-0 shadow-sm p-3 border-start border-info border-3 h-100">
            <span class="text-muted small fw-semibold text-uppercase d-block mb-1">
              Remplissage global
            </span>
            <h4
              class="fw-bold mb-1 font-monospace"
              :class="classeTaux(indicateursFilieres.tauxGlobal)"
            >
              {{ formatTaux(indicateursFilieres.tauxGlobal) }}
            </h4>
            <div class="progress rounded-pill mt-1" style="height: 5px">
              <div
                class="progress-bar"
                :class="barreTaux(indicateursFilieres.tauxGlobal)"
                role="progressbar"
                :style="{ width: `${Math.min(indicateursFilieres.tauxGlobal, 100)}%` }"
              ></div>
            </div>
          </div>
        </div>

        <div class="col-6 col-lg-3">
          <div class="card border-0 shadow-sm p-3 border-start border-warning border-3 h-100">
            <span class="text-muted small fw-semibold text-uppercase d-block mb-1">
              Places disponibles
            </span>
            <h4 class="fw-bold text-warning mb-1 font-monospace">
              {{ formatNombre(indicateursFilieres.placesDisponibles) }}
            </h4>
            <div class="text-xs text-muted">
              <i class="bi bi-door-open me-1"></i>
              sur {{ formatNombre(indicateursFilieres.capaciteTotale) }} déclarée(s)
            </div>
          </div>
        </div>
      </div>

      <!-- Effectifs et répartition par cycle -->
      <div class="row g-3 mb-3">
        <div class="col-lg-7">
          <div class="card border-0 shadow-sm bg-white p-4 h-100">
            <h6 class="fw-bold mb-3 small text-uppercase text-secondary tracking-wider">
              <i class="bi bi-bar-chart-fill text-primary me-2"></i>
              Effectifs des filières actives
              <span v-if="filieresActives.length > TOP_MAX" class="fw-normal text-muted">
                (les {{ TOP_MAX }} premières)
              </span>
            </h6>

            <EmptyState
              v-if="!filieresActives.length"
              title="Aucune filière active"
              description="Aucune filière ne compte d'inscrit sur l'année académique active."
              :size="80"
            />
            <div v-else class="chart-container position-relative" style="height: 280px">
              <canvas ref="canvasEffectifs"></canvas>
            </div>
          </div>
        </div>

        <div class="col-lg-5">
          <div class="card border-0 shadow-sm bg-white p-4 h-100">
            <h6 class="fw-bold mb-3 small text-uppercase text-secondary tracking-wider">
              <i class="bi bi-pie-chart-fill text-info me-2"></i>Répartition par cycle
            </h6>

            <EmptyState
              v-if="!cyclesPeuples.length"
              title="Aucun inscrit à répartir"
              description="La répartition apparaîtra dès qu'une filière comptera des inscrits."
              :size="80"
            />
            <div v-else class="chart-container position-relative" style="height: 280px">
              <canvas ref="canvasCycles"></canvas>
            </div>
          </div>
        </div>
      </div>

      <!-- Remplissage et diagnostics -->
      <div class="row g-3 mb-3">
        <div class="col-lg-7">
          <div class="card border-0 shadow-sm bg-white p-4 h-100">
            <h6 class="fw-bold mb-3 small text-uppercase text-secondary tracking-wider">
              <i class="bi bi-speedometer2 text-success me-2"></i>Taux de remplissage
            </h6>

            <EmptyState
              v-if="!filieresAvecCapacite.length"
              title="Aucune capacité déclarée"
              description="Le remplissage se calcule à partir de la capacité des classes rattachées à la filière."
              :size="80"
            />
            <div
              v-else
              class="chart-container position-relative"
              :style="{ height: `${Math.max(filieresAvecCapacite.length * 34, 200)}px` }"
            >
              <canvas ref="canvasRemplissage"></canvas>
            </div>
          </div>
        </div>

        <div class="col-lg-5">
          <div class="card border-0 shadow-sm bg-white p-4 h-100">
            <h6 class="fw-bold mb-3 small text-uppercase text-secondary tracking-wider">
              <i class="bi bi-lightbulb text-warning me-2"></i>Lecture des chiffres
            </h6>

            <!--
              Ces constats sont dérivés des données affichées juste au-dessus :
              aucun n'est écrit d'avance, et chacun disparaît avec la situation
              qu'il décrit.
            -->
            <p v-if="!analysesFilieres.length" class="text-muted small mb-0">
              Rien à signaler sur ce périmètre.
            </p>
            <div
              v-for="analyse in analysesFilieres"
              :key="analyse.titre"
              class="border-start border-3 ps-3 py-1 mb-3"
              :class="tonClasse(analyse.ton)"
            >
              <span class="d-block fw-semibold small">
                <i class="bi me-1" :class="analyse.icone"></i>{{ analyse.titre }}
              </span>
              <span class="text-muted text-xs">{{ analyse.message }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Détail d'une filière -->
      <div class="card border-0 shadow-sm bg-white p-4">
        <div class="row g-3 align-items-end mb-3">
          <div class="col-md-6 col-lg-4">
            <label for="filiereSelect" class="form-label small fw-bold text-secondary">
              Détail d'une filière
            </label>
            <select id="filiereSelect" v-model="selectedFiliereId" class="form-select">
              <option value="">-- Choisir une filière --</option>
              <option v-for="filiere in filieresEnrichies" :key="filiere.id" :value="filiere.id">
                {{ filiere.designation }} ({{ filiere.code }})
              </option>
            </select>
          </div>
          <div v-if="filiereSelectionnee" class="col-md-6 col-lg-8 text-md-end">
            <span
              class="badge rounded-pill px-3 py-2"
              :class="badgeStatut(filiereSelectionnee.statut)"
            >
              {{ filiereSelectionnee.statut }}
            </span>
            <span class="text-muted small ms-2">
              {{ filiereSelectionnee.cycle }} · responsable {{ filiereSelectionnee.responsable }}
            </span>
          </div>
        </div>

        <p v-if="!filiereSelectionnee" class="text-muted small mb-0">
          Sélectionnez une filière pour afficher ses compteurs serveur et son remplissage.
        </p>

        <div v-else class="row g-3">
          <div class="col-6 col-lg-3">
            <div class="border rounded p-3 h-100">
              <span class="text-muted text-xs text-uppercase d-block">Inscrits</span>
              <span class="fw-bold font-monospace fs-5">
                {{ formatNombre(stats?.nb_etudiants ?? filiereSelectionnee.effectif) }}
              </span>
            </div>
          </div>
          <div class="col-6 col-lg-3">
            <div class="border rounded p-3 h-100">
              <span class="text-muted text-xs text-uppercase d-block">Classes</span>
              <span class="fw-bold font-monospace fs-5">
                {{ formatNombre(stats?.nb_classes ?? filiereSelectionnee.nbClasses) }}
              </span>
            </div>
          </div>
          <div class="col-6 col-lg-3">
            <div class="border rounded p-3 h-100">
              <span class="text-muted text-xs text-uppercase d-block">Places restantes</span>
              <span class="fw-bold font-monospace fs-5">
                {{ formatNombre(filiereSelectionnee.placesRestantes) }}
              </span>
              <span class="text-muted text-xs d-block">
                sur {{ formatNombre(filiereSelectionnee.capacite) }}
              </span>
            </div>
          </div>
          <div class="col-6 col-lg-3">
            <div class="border rounded p-3 h-100">
              <span class="text-muted text-xs text-uppercase d-block">Moyenne par classe</span>
              <span class="fw-bold font-monospace fs-5">
                {{ filiereSelectionnee.tailleMoyenneClasse.toFixed(1) }}
              </span>
              <span class="text-muted text-xs d-block">
                remplissage {{ formatTaux(filiereSelectionnee.taux) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.text-xs {
  font-size: 11px !important;
}
.tracking-wider {
  letter-spacing: 0.5px;
}
</style>
