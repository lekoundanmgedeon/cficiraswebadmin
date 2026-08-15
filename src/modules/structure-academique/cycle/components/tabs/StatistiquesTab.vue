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
import { useCycleStatistiques } from '../../composables/useCycleStatistiques';

/**
 * Statistiques des cycles.
 *
 * L'écran n'affichait qu'un tableau plat de `GET /cycles/stats/distribution` :
 * un code, un diplôme, un effectif, et une colonne « Actif / Inactif » qui ne
 * disait rien de plus que « l'effectif est-il nul ? ». Il affichait aussi un
 * `cycle_nom` **absent de la vue** — la table `cycle` n'a pas de colonne `nom` —,
 * si bien que chaque ligne retombait sur le libellé de secours « Cycle
 * Académique ».
 *
 * Il croise désormais l'identité des cycles, les classes réelles de chaque cycle
 * et le compte serveur des étudiants distincts. Le détail des sources — et
 * pourquoi la capacité ne peut pas venir de `/cycles/stats/organisations` — est
 * documenté dans `useCycleStatistiques`.
 */

const { charger, loading, cyclesEnrichis, cyclesActifs, indicateurs, analyses } =
  useCycleStatistiques();

const recherche = ref('');

const aucuneDonnee = computed(() => !cyclesEnrichis.value.length);

/** Le remplissage ne se lit que sur les cycles dont la capacité est déclarée. */
const cyclesAvecCapacite = computed(() =>
  cyclesEnrichis.value.filter((cycle) => cycle.capacite > 0).sort((a, b) => b.taux - a.taux)
);

const cyclesFiltres = computed(() => {
  const terme = recherche.value.trim().toLowerCase();
  if (!terme) return cyclesEnrichis.value;

  return cyclesEnrichis.value.filter((cycle) =>
    [cycle.code, cycle.diplome, ...cycle.filieres].some((champ) =>
      String(champ ?? '')
        .toLowerCase()
        .includes(terme)
    )
  );
});

const { page, itemsPerPage, startIndex, paginated } = usePagination(cyclesFiltres, {
  perPage: 10,
  resetKey: () => recherche.value,
});

const canvasEffectifs = ref(null);
const canvasRepartition = ref(null);
const canvasRemplissage = ref(null);
/** @type {Record<string, any>} */
const instances = {};

const { exportToExcel, exportToPdf } = useTableExport({
  rows: computed(() =>
    cyclesFiltres.value.map((cycle) => ({
      Code: cycle.code,
      Diplôme: cycle.diplome,
      'Durée (ans)': cycle.dureeAnnees,
      Crédits: cycle.creditsTotal,
      Filières: cycle.nbFilieres,
      Classes: cycle.nbClasses,
      Inscrits: cycle.effectif,
      'Étudiants distincts': cycle.etudiantsDistincts,
      Capacité: cycle.capacite,
      'Places restantes': cycle.placesRestantes,
      'Taux de remplissage': `${cycle.taux.toFixed(1)} %`,
      'Moyenne par classe': cycle.tailleMoyenneClasse.toFixed(1),
    }))
  ),
  title: 'Statistiques des cycles',
  fileBaseName: 'statistiques_cycles',
  filters: () => [
    { label: 'Cycles', value: indicateurs.value.nbCycles },
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

  if (canvasEffectifs.value && cyclesActifs.value.length) {
    const actifs = cyclesActifs.value;
    instances.effectifs = new Chart(canvasEffectifs.value, {
      type: 'bar',
      data: {
        labels: actifs.map((cycle) => cycle.code),
        datasets: [
          {
            label: 'Inscrits',
            data: actifs.map((cycle) => cycle.effectif),
            backgroundColor: actifs.map((cycle) => couleurTaux(cycle.taux)),
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
              title: (items) => actifs[items[0].dataIndex]?.diplome ?? '',
              afterLabel: (item) => {
                const cycle = actifs[item.dataIndex];
                if (!cycle) return '';
                return cycle.capacite > 0
                  ? `${cycle.taux.toFixed(1)} % de ${cycle.capacite} places · ${cycle.nbClasses} classe(s)`
                  : `Capacité non déclarée · ${cycle.nbClasses} classe(s)`;
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

  if (canvasRepartition.value && cyclesActifs.value.length) {
    const actifs = cyclesActifs.value;
    instances.repartition = new Chart(canvasRepartition.value, {
      type: 'doughnut',
      data: {
        labels: actifs.map((cycle) => cycle.code),
        datasets: [
          {
            data: actifs.map((cycle) => cycle.effectif),
            backgroundColor: actifs.map((_, index) => couleurSerie(index)),
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
              title: (items) => actifs[items[0].dataIndex]?.diplome ?? '',
              afterLabel: (item) => {
                const cycle = actifs[item.dataIndex];
                return cycle ? `${cycle.nbFilieres} filière(s) · ${cycle.nbClasses} classe(s)` : '';
              },
            },
          },
        },
      },
    });
  }

  if (canvasRemplissage.value && cyclesAvecCapacite.value.length) {
    const avecCapacite = cyclesAvecCapacite.value;
    instances.remplissage = new Chart(canvasRemplissage.value, {
      type: 'bar',
      data: {
        labels: avecCapacite.map((cycle) => cycle.code),
        datasets: [
          {
            label: 'Taux de remplissage',
            data: avecCapacite.map((cycle) => Number(cycle.taux.toFixed(1))),
            backgroundColor: avecCapacite.map((cycle) => couleurTaux(cycle.taux)),
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
              title: (items) => avecCapacite[items[0].dataIndex]?.diplome ?? '',
              label: (item) => {
                const cycle = avecCapacite[item.dataIndex];
                if (!cycle) return '';
                return `${cycle.taux.toFixed(1)} % — ${cycle.effectif}/${cycle.capacite} places`;
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
// sous `v-else`), et les trois lectures arrivent en parallèle. Redessiner après
// chacune construirait neuf graphiques pour en afficher trois.
watch(cyclesEnrichis, dessiner, { immediate: true });

onMounted(() => charger());

onBeforeUnmount(detruire);
</script>

<template>
  <div>
    <div class="d-flex justify-content-between align-items-start mb-3 flex-wrap gap-2">
      <div>
        <h4 class="mb-1">Statistiques des cycles</h4>
        <p class="text-muted mb-0 small">
          Effectifs, capacités et remplissage des cycles sur l'année académique active.
        </p>
      </div>
      <ExportMenu :disabled="aucuneDonnee" @excel="exportToExcel" @pdf="exportToPdf" />
    </div>

    <LoadingSpinner v-if="loading && aucuneDonnee" />

    <EmptyState
      v-else-if="aucuneDonnee"
      title="Aucun cycle configuré"
      description="Créez un cycle depuis l'onglet « Liste des cycles » pour voir apparaître ses statistiques."
    />

    <template v-else>
      <!-- Indicateurs de tête -->
      <div class="row g-3 mb-4">
        <div class="col-6 col-lg-3">
          <div class="card border-0 shadow-sm p-3 border-start border-primary border-3 h-100">
            <span class="text-muted small fw-semibold text-uppercase d-block mb-1">
              Cycles actifs
            </span>
            <h4 class="fw-bold text-primary mb-1 font-monospace">{{ indicateurs.nbActifs }}</h4>
            <div class="text-xs text-muted">
              <i class="bi bi-layers me-1"></i>
              sur {{ indicateurs.nbCycles }} déclaré(s) · {{ indicateurs.nbFilieres }} filière(s)
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
              répartis sur {{ indicateurs.nbClasses }} classe(s)
            </div>
          </div>
        </div>

        <div class="col-6 col-lg-3">
          <div class="card border-0 shadow-sm p-3 border-start border-info border-3 h-100">
            <span class="text-muted small fw-semibold text-uppercase d-block mb-1">
              Remplissage global
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

      <!-- Effectifs et répartition -->
      <div class="row g-3 mb-3">
        <div class="col-lg-7">
          <div class="card border-0 shadow-sm bg-white p-4 h-100">
            <h6 class="fw-bold mb-3 small text-uppercase text-secondary tracking-wider">
              <i class="bi bi-bar-chart-fill text-primary me-2"></i>Effectifs des cycles actifs
            </h6>

            <EmptyState
              v-if="!cyclesActifs.length"
              title="Aucun cycle actif"
              description="Aucun cycle ne compte d'inscrit sur l'année académique active."
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
              <i class="bi bi-pie-chart-fill text-info me-2"></i>Répartition des inscrits
            </h6>

            <EmptyState
              v-if="!cyclesActifs.length"
              title="Aucun inscrit à répartir"
              description="La répartition apparaîtra dès qu'un cycle comptera des inscrits."
              :size="80"
            />
            <div v-else class="chart-container position-relative" style="height: 280px">
              <canvas ref="canvasRepartition"></canvas>
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
              v-if="!cyclesAvecCapacite.length"
              title="Aucune capacité déclarée"
              description="Le remplissage se calcule à partir de la capacité des classes rattachées au cycle."
              :size="80"
            />
            <div
              v-else
              class="chart-container position-relative"
              :style="{ height: `${Math.max(cyclesAvecCapacite.length * 34, 200)}px` }"
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

      <!-- Détail par cycle -->
      <div class="card border-0 shadow-sm bg-white">
        <div
          class="card-header bg-white border-0 pt-4 px-4 d-flex justify-content-between align-items-center flex-wrap gap-2"
        >
          <h6 class="fw-bold mb-0 small text-uppercase text-secondary tracking-wider">
            <i class="bi bi-table text-secondary me-2"></i>Détail par cycle
          </h6>
          <div class="input-group input-group-sm" style="max-width: 320px">
            <span class="input-group-text bg-white border-end-0 text-muted">
              <i class="bi bi-search"></i>
            </span>
            <input
              v-model="recherche"
              type="text"
              class="form-control border-start-0 ps-0"
              placeholder="Rechercher un cycle, un diplôme, une filière…"
            />
          </div>
        </div>

        <div class="card-body px-4 pt-3">
          <EmptyState
            v-if="!cyclesFiltres.length"
            title="Aucun cycle ne correspond"
            description="Modifiez votre recherche pour retrouver un cycle."
            :size="80"
          />

          <div v-else class="table-responsive">
            <table class="table align-middle mb-0 table-hover">
              <thead class="table-light">
                <tr>
                  <th class="ps-3" style="width: 60px">#</th>
                  <th>Cycle</th>
                  <th class="text-center">Filières</th>
                  <th class="text-center">Classes</th>
                  <th class="text-center">Effectif / Capacité</th>
                  <th style="min-width: 170px">Remplissage</th>
                  <th class="text-end pe-3">Moy. / classe</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(cycle, index) in paginated" :key="cycle.id">
                  <td class="ps-3 text-muted">{{ startIndex + index + 1 }}</td>
                  <td>
                    <div class="d-flex align-items-center">
                      <span
                        class="badge bg-primary-subtle text-primary me-2 font-monospace fw-bold px-2 py-1"
                      >
                        {{ cycle.code }}
                      </span>
                      <div>
                        <div class="fw-semibold text-dark">{{ cycle.diplome }}</div>
                        <div class="text-xs text-muted">
                          {{ cycle.dureeAnnees }} an(s) · {{ cycle.creditsTotal }} crédits
                        </div>
                      </div>
                    </div>
                  </td>
                  <td class="text-center">
                    <span class="badge bg-light text-dark border px-2 py-1">
                      {{ cycle.nbFilieres }}
                    </span>
                  </td>
                  <td class="text-center">
                    <span class="badge bg-light text-dark border px-2 py-1">
                      {{ cycle.nbClasses }}
                    </span>
                    <div v-if="cycle.classesVides" class="text-xs text-muted mt-1">
                      dont {{ cycle.classesVides }} vide(s)
                    </div>
                  </td>
                  <td class="text-center">
                    <span class="fw-bold text-dark font-monospace">{{ cycle.effectif }}</span>
                    <span class="text-muted"> / {{ cycle.capacite }}</span>
                    <div
                      v-if="cycle.etudiantsDistincts && cycle.etudiantsDistincts !== cycle.effectif"
                      class="text-xs text-muted"
                      title="Étudiants distincts comptés par le serveur"
                    >
                      {{ cycle.etudiantsDistincts }} étudiant(s) distinct(s)
                    </div>
                  </td>
                  <td>
                    <div class="d-flex align-items-center gap-2">
                      <div class="progress flex-grow-1" style="height: 6px">
                        <div
                          class="progress-bar"
                          :class="barreTaux(cycle.taux)"
                          role="progressbar"
                          :style="{ width: `${Math.min(cycle.taux, 100)}%` }"
                        ></div>
                      </div>
                      <small class="font-monospace" :class="classeTaux(cycle.taux)">
                        {{ cycle.taux.toFixed(1) }} %
                      </small>
                    </div>
                  </td>
                  <td class="text-end pe-3 font-monospace">
                    {{ cycle.tailleMoyenneClasse.toFixed(1) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div v-if="cyclesFiltres.length" class="card-footer bg-white border-0 py-3 px-4">
          <Pagination
            v-model="page"
            v-model:items-per-page="itemsPerPage"
            :total-items="cyclesFiltres.length"
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
