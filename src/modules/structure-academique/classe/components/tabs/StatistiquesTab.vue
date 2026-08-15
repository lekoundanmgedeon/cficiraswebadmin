<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import Chart from 'chart.js/auto';
import EmptyState from '@/shared/components/EmptyState.vue';
import ExportMenu from '@/shared/components/ExportMenu.vue';
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue';
import Pagination from '@/components/shared/Pagination.vue';
import { useTableExport } from '@/shared/composables/useTableExport';
import { usePagination } from '@/shared/composables/usePagination';
import {
  barreTaux,
  classeTaux,
  couleurSerie,
  couleurTaux,
  formatNombre,
  formatTaux,
  tonClasse,
} from '@/shared/utils/remplissage';
import {
  DIMENSIONS,
  regrouperPar,
  useClasseStatistiques,
} from '../../composables/useClasseStatistiques';

/**
 * Statistiques des classes.
 *
 * L'écran se résumait à quatre compteurs et une barre de progression, servis par
 * `GET /classes/analytics/dashboard-global` — dont **trois étaient faux**, la
 * vue gonflant la capacité d'un facteur égal au nombre d'inscrits par classe
 * (36 325 places annoncées pour 5 400 réelles). Le détail est documenté dans
 * `useClasseStatistiques`.
 *
 * Les mêmes indicateurs sont désormais recomposés depuis `v_organisation_classes`,
 * groupée par classe, et l'écran en tire ce que les compteurs seuls ne disaient
 * pas : où sont les tensions, quelles classes restent vides, et comment les
 * effectifs se répartissent par cycle, filière ou niveau.
 */

const { charger, loading, classes, indicateurs, paliers, analyses } = useClasseStatistiques();

/** Au-delà, le graphique des groupes devient illisible. */
const TOP_MAX = 12;

const dimension = ref('filiere');
const recherche = ref('');

const aucuneDonnee = computed(() => !classes.value.length);

const libelleDimension = computed(
  () => DIMENSIONS.find((item) => item.cle === dimension.value) ?? DIMENSIONS[1]
);

const groupes = computed(() => regrouperPar(classes.value, dimension.value));

const groupesFiltres = computed(() => {
  const terme = recherche.value.trim().toLowerCase();
  if (!terme) return groupes.value;
  return groupes.value.filter((groupe) => groupe.libelle.toLowerCase().includes(terme));
});

const groupesGraphique = computed(() => groupes.value.slice(0, TOP_MAX));
const cyclesPeuples = computed(() =>
  regrouperPar(classes.value, 'cycle').filter((groupe) => groupe.effectif > 0)
);

const { page, itemsPerPage, startIndex, paginated } = usePagination(groupesFiltres, {
  perPage: 10,
  resetKey: () => [dimension.value, recherche.value],
});

const canvasGroupes = ref(null);
const canvasCycles = ref(null);
const canvasPaliers = ref(null);
/** @type {Record<string, any>} */
const instances = {};

const { exportToExcel, exportToPdf } = useTableExport({
  rows: computed(() =>
    groupesFiltres.value.map((groupe) => ({
      [libelleDimension.value.colonne]: groupe.libelle,
      Classes: groupe.nbClasses,
      Inscrits: groupe.effectif,
      Capacité: groupe.capacite,
      'Places restantes': groupe.placesRestantes,
      'Taux de remplissage': `${groupe.taux.toFixed(1)} %`,
      'Moyenne par classe': groupe.tailleMoyenne.toFixed(1),
      'Classes complètes': groupe.classesPleines,
      'Classes sans inscrit': groupe.classesVides,
    }))
  ),
  title: 'Statistiques des classes',
  fileBaseName: 'statistiques_classes',
  filters: () => [
    { label: 'Regroupement', value: libelleDimension.value.label },
    { label: 'Classes', value: indicateurs.value.nbClasses },
    { label: 'Inscrits', value: indicateurs.value.effectifTotal },
    { label: 'Capacité', value: indicateurs.value.capaciteTotale },
    { label: 'Remplissage', value: formatTaux(indicateurs.value.tauxGlobal) },
  ],
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

  if (canvasGroupes.value && groupesGraphique.value.length) {
    const donnees = groupesGraphique.value;
    instances.groupes = new Chart(canvasGroupes.value, {
      type: 'bar',
      data: {
        labels: donnees.map((groupe) => groupe.libelle),
        datasets: [
          {
            label: 'Inscrits',
            data: donnees.map((groupe) => groupe.effectif),
            backgroundColor: donnees.map((groupe) => couleurTaux(groupe.taux)),
            borderRadius: 2,
            maxBarThickness: 26,
          },
          {
            label: 'Places restantes',
            data: donnees.map((groupe) => groupe.placesRestantes),
            backgroundColor: 'rgba(233, 236, 239, 0.9)',
            borderRadius: 2,
            maxBarThickness: 26,
          },
        ],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          // Empilé : la barre entière est la capacité, sa part colorée l'occupation.
          x: { stacked: true, grid: { color: '#f8f9fa' }, ticks: { font: { size: 10 } } },
          y: { stacked: true, grid: { display: false }, ticks: { font: { size: 11 } } },
        },
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } },
          tooltip: {
            callbacks: {
              afterLabel: (item) => {
                const groupe = donnees[item.dataIndex];
                if (!groupe) return '';
                return `${groupe.nbClasses} classe(s) · remplissage ${groupe.taux.toFixed(1)} %`;
              },
            },
          },
        },
      },
    });
  }

  if (canvasCycles.value && cyclesPeuples.value.length) {
    const donnees = cyclesPeuples.value;
    instances.cycles = new Chart(canvasCycles.value, {
      type: 'doughnut',
      data: {
        labels: donnees.map((groupe) => groupe.libelle),
        datasets: [
          {
            data: donnees.map((groupe) => groupe.effectif),
            backgroundColor: donnees.map((_, index) => couleurSerie(index)),
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
                const groupe = donnees[item.dataIndex];
                return groupe ? `${groupe.nbClasses} classe(s)` : '';
              },
            },
          },
        },
      },
    });
  }

  if (canvasPaliers.value && classes.value.length) {
    const donnees = paliers.value;
    instances.paliers = new Chart(canvasPaliers.value, {
      type: 'bar',
      data: {
        labels: donnees.map((palier) => palier.libelle),
        datasets: [
          {
            label: 'Classes',
            data: donnees.map((palier) => palier.nb),
            backgroundColor: donnees.map((palier) => palier.couleur),
            borderRadius: 2,
            maxBarThickness: 46,
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
              label: (item) => {
                const total = classes.value.length || 1;
                const part = ((item.parsed.y / total) * 100).toFixed(1);
                return `${item.parsed.y} classe(s) — ${part} %`;
              },
            },
          },
        },
        scales: {
          y: { grid: { color: '#f8f9fa' }, ticks: { font: { size: 10 }, precision: 0 } },
          x: { grid: { display: false }, ticks: { font: { size: 10 } } },
        },
      },
    });
  }
};

// Un seul déclencheur : les canvas naissent avec les données. Le changement de
// dimension ne redessine que le premier graphique, mais Chart.js n'a pas de
// mise à jour partielle ici — on retrace les trois, c'est le prix d'un clic.
watch([classes, dimension], dessiner, { immediate: true });

onMounted(() => charger());

onBeforeUnmount(detruire);
</script>

<template>
  <div>
    <div class="d-flex justify-content-between align-items-start mb-3 flex-wrap gap-2">
      <div>
        <h4 class="mb-1">Statistiques des classes</h4>
        <p class="text-muted mb-0 small">
          Effectifs, capacités et remplissage des classes sur l'année académique active. Seules les
          inscriptions actives ou validées sont comptées.
        </p>
      </div>
      <ExportMenu :disabled="aucuneDonnee" @excel="exportToExcel" @pdf="exportToPdf" />
    </div>

    <LoadingSpinner v-if="loading && aucuneDonnee" />

    <EmptyState
      v-else-if="aucuneDonnee"
      title="Aucune classe enregistrée"
      description="Créez une classe depuis l'onglet « Liste des classes » pour voir apparaître ses statistiques."
    />

    <template v-else>
      <!-- Indicateurs de tête -->
      <div class="row g-3 mb-4">
        <div class="col-6 col-lg-3">
          <div class="card border-0 shadow-sm p-3 border-start border-primary border-3 h-100">
            <span class="text-muted small fw-semibold text-uppercase d-block mb-1">
              Classes ouvertes
            </span>
            <h4 class="fw-bold text-primary mb-1 font-monospace">
              {{ indicateurs.nbClassesOccupees }}
            </h4>
            <div class="text-xs text-muted">
              <i class="bi bi-collection me-1"></i>
              sur {{ indicateurs.nbClasses }} déclarée(s) · {{ indicateurs.nbFilieres }} filière(s)
            </div>
          </div>
        </div>

        <div class="col-6 col-lg-3">
          <div class="card border-0 shadow-sm p-3 border-start border-success border-3 h-100">
            <span class="text-muted small fw-semibold text-uppercase d-block mb-1">
              Étudiants inscrits
            </span>
            <h4 class="fw-bold text-success mb-1 font-monospace">
              {{ formatNombre(indicateurs.effectifTotal) }}
            </h4>
            <div class="text-xs text-muted">
              <i class="bi bi-people me-1"></i>
              répartis sur {{ indicateurs.nbNiveaux }} niveau(x)
            </div>
          </div>
        </div>

        <div class="col-6 col-lg-3">
          <div class="card border-0 shadow-sm p-3 border-start border-info border-3 h-100">
            <span class="text-muted small fw-semibold text-uppercase d-block mb-1">
              Taux d'occupation
            </span>
            <h4 class="fw-bold mb-1 font-monospace" :class="classeTaux(indicateurs.tauxGlobal)">
              {{ formatTaux(indicateurs.tauxGlobal) }}
            </h4>
            <div class="progress rounded-pill mt-1" style="height: 5px">
              <div
                class="progress-bar"
                :class="barreTaux(indicateurs.tauxGlobal)"
                role="progressbar"
                :style="{ width: `${Math.min(indicateurs.tauxGlobal, 100)}%` }"
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
              {{ formatNombre(indicateurs.placesDisponibles) }}
            </h4>
            <div class="text-xs text-muted">
              <i class="bi bi-door-open me-1"></i>
              sur {{ formatNombre(indicateurs.capaciteTotale) }} déclarée(s)
            </div>
          </div>
        </div>
      </div>

      <!-- Occupation par dimension et répartition par cycle -->
      <div class="row g-3 mb-3">
        <div class="col-lg-7">
          <div class="card border-0 shadow-sm bg-white p-4 h-100">
            <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
              <h6 class="fw-bold mb-0 small text-uppercase text-secondary tracking-wider">
                <i class="bi bi-bar-chart-fill text-primary me-2"></i>
                Occupation par {{ libelleDimension.label.toLowerCase() }}
                <span v-if="groupes.length > TOP_MAX" class="fw-normal text-muted">
                  (les {{ TOP_MAX }} premiers)
                </span>
              </h6>
              <div class="btn-group btn-group-sm" role="group">
                <button
                  v-for="item in DIMENSIONS"
                  :key="item.cle"
                  type="button"
                  class="btn"
                  :class="dimension === item.cle ? 'btn-primary' : 'btn-outline-secondary'"
                  @click="dimension = item.cle"
                >
                  {{ item.label }}
                </button>
              </div>
            </div>

            <div
              class="chart-container position-relative"
              :style="{ height: `${Math.max(groupesGraphique.length * 34, 220)}px` }"
            >
              <canvas ref="canvasGroupes"></canvas>
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
              description="La répartition apparaîtra dès qu'une classe comptera des inscrits."
              :size="80"
            />
            <div v-else class="chart-container position-relative" style="height: 280px">
              <canvas ref="canvasCycles"></canvas>
            </div>
          </div>
        </div>
      </div>

      <!-- Paliers de remplissage et diagnostics -->
      <div class="row g-3 mb-3">
        <div class="col-lg-7">
          <div class="card border-0 shadow-sm bg-white p-4 h-100">
            <h6 class="fw-bold mb-1 small text-uppercase text-secondary tracking-wider">
              <i class="bi bi-speedometer2 text-success me-2"></i>Où en sont les classes
            </h6>
            <p class="text-muted text-xs mb-3">
              Nombre de classes par palier de remplissage — ce qu'un taux moyen ne montre pas.
            </p>

            <div class="chart-container position-relative" style="height: 240px">
              <canvas ref="canvasPaliers"></canvas>
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
            <p v-if="!analyses.length" class="text-muted small mb-0">
              Rien à signaler sur ce périmètre.
            </p>
            <div
              v-for="analyse in analyses"
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

      <!-- Détail du regroupement -->
      <div class="card border-0 shadow-sm bg-white">
        <div
          class="card-header bg-white border-0 pt-4 px-4 d-flex justify-content-between align-items-center flex-wrap gap-2"
        >
          <h6 class="fw-bold mb-0 small text-uppercase text-secondary tracking-wider">
            <i class="bi bi-table text-secondary me-2"></i>
            Détail par {{ libelleDimension.label.toLowerCase() }}
          </h6>
          <div class="input-group input-group-sm" style="max-width: 320px">
            <span class="input-group-text bg-white border-end-0 text-muted">
              <i class="bi bi-search"></i>
            </span>
            <input
              v-model="recherche"
              type="text"
              class="form-control border-start-0 ps-0"
              :placeholder="`Rechercher un ${libelleDimension.label.toLowerCase()}…`"
            />
          </div>
        </div>

        <div class="card-body px-4 pt-3">
          <EmptyState
            v-if="!groupesFiltres.length"
            title="Aucun résultat"
            description="Modifiez votre recherche pour retrouver une ligne."
            :size="80"
          />

          <div v-else class="table-responsive">
            <table class="table align-middle mb-0 table-hover">
              <thead class="table-light">
                <tr>
                  <th class="ps-3" style="width: 60px">#</th>
                  <th>{{ libelleDimension.colonne }}</th>
                  <th class="text-center">Classes</th>
                  <th class="text-center">Effectif / Capacité</th>
                  <th style="min-width: 170px">Remplissage</th>
                  <th class="text-center">Moy. / classe</th>
                  <th class="text-end pe-3">Alertes</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(groupe, index) in paginated" :key="groupe.libelle">
                  <td class="ps-3 text-muted">{{ startIndex + index + 1 }}</td>
                  <td class="fw-semibold text-dark">{{ groupe.libelle }}</td>
                  <td class="text-center">
                    <span class="badge bg-light text-dark border px-2 py-1">
                      {{ groupe.nbClasses }}
                    </span>
                  </td>
                  <td class="text-center font-monospace">
                    <span class="fw-bold text-dark">{{ groupe.effectif }}</span>
                    <span class="text-muted"> / {{ groupe.capacite }}</span>
                  </td>
                  <td>
                    <div class="d-flex align-items-center gap-2">
                      <div class="progress flex-grow-1" style="height: 6px">
                        <div
                          class="progress-bar"
                          :class="barreTaux(groupe.taux)"
                          role="progressbar"
                          :style="{ width: `${Math.min(groupe.taux, 100)}%` }"
                        ></div>
                      </div>
                      <small class="font-monospace" :class="classeTaux(groupe.taux)">
                        {{ groupe.taux.toFixed(1) }} %
                      </small>
                    </div>
                  </td>
                  <td class="text-center font-monospace">{{ groupe.tailleMoyenne.toFixed(1) }}</td>
                  <td class="text-end pe-3">
                    <span
                      v-if="groupe.classesPleines"
                      class="badge bg-danger-subtle text-danger px-2 py-1 me-1"
                      :title="`${groupe.classesPleines} classe(s) au complet`"
                    >
                      {{ groupe.classesPleines }} pleine(s)
                    </span>
                    <span
                      v-if="groupe.classesVides"
                      class="badge bg-secondary-subtle text-secondary px-2 py-1"
                      :title="`${groupe.classesVides} classe(s) sans inscrit`"
                    >
                      {{ groupe.classesVides }} vide(s)
                    </span>
                    <span
                      v-if="!groupe.classesPleines && !groupe.classesVides"
                      class="text-muted small"
                    >
                      —
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div v-if="groupesFiltres.length" class="card-footer bg-white border-0 py-3 px-4">
          <Pagination
            v-model="page"
            v-model:items-per-page="itemsPerPage"
            :total-items="groupesFiltres.length"
          />
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
