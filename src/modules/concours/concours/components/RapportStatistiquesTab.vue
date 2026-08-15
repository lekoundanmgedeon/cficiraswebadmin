<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import Chart from 'chart.js/auto';
import EmptyState from '@/shared/components/EmptyState.vue';
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue';
import ExportMenu from '@/shared/components/ExportMenu.vue';
import { useTableExport } from '@/shared/composables/useTableExport';
import { formatDate } from '@/shared/utils/date';
import { couleurSerie } from '@/shared/utils/remplissage';
import { useStatistiquesResultats } from '../composables/useStatistiquesResultats';

const props = defineProps({
  concoursId: { type: String, default: '' },
  /** Désignation du concours, pour l'en-tête du document exporté. */
  designation: { type: String, default: '' },
});

/**
 * Statistiques des résultats d'un concours.
 *
 * Rien n'y est inventé : moyennes, paliers, décisions du jury et statistiques
 * par épreuve sont dérivés des trois lectures que le module possède déjà — voir
 * `useStatistiquesResultats`, qui porte le calcul et les tests.
 *
 * ⚠️ **Les décisions du jury n'étaient lisibles nulle part.** `proclamerAdmissions`
 * les écrit dans `admissions_concours`, mais le classement ne les renvoyait pas
 * et le seul autre accès était l'export binaire de la liste des admis. La
 * jointure a été ajoutée côté backend : c'est ce qui permet d'afficher ici la
 * délibération réelle plutôt qu'une simulation à un seuil.
 */

const { charger, loading, classement, indicateurs, paliers, decisions, parEpreuve, parSexe } =
  useStatistiquesResultats(() => props.concoursId);

const canvasPaliers = ref(null);
const canvasDecisions = ref(null);
/** @type {Record<string, any>} */
const instances = {};

const aucuneDonnee = computed(() => classement.value.length === 0);

/** @param {number|null} valeur */
const format = (valeur, unite = '') =>
  valeur === null || valeur === undefined ? '—' : `${valeur.toFixed(2)}${unite}`;

const { exportToExcel, exportToPdf } = useTableExport({
  rows: computed(() =>
    parEpreuve.value.map((epreuve) => ({
      Code: epreuve.code,
      Épreuve: epreuve.designation,
      Coefficient: epreuve.coefficient,
      'Candidats notés': `${epreuve.nbNotes} / ${epreuve.nbCandidats}`,
      Moyenne: epreuve.moyenne === null ? '—' : epreuve.moyenne.toFixed(2),
      'Note la plus haute': epreuve.max === null ? '—' : epreuve.max.toFixed(2),
      'Note la plus basse': epreuve.min === null ? '—' : epreuve.min.toFixed(2),
      'Taux de réussite':
        epreuve.tauxReussite === null ? '—' : `${epreuve.tauxReussite.toFixed(1)} %`,
    }))
  ),
  title: 'Statistiques des résultats',
  fileBaseName: 'statistiques_resultats_concours',
  // Les indicateurs d'ensemble accompagnent le tableau des épreuves : c'est ce
  // qui distingue un rapport d'un simple export de lignes.
  filters: () => [
    { label: 'Concours', value: props.designation || '—' },
    { label: 'Candidats classés', value: indicateurs.value.nbClasses },
    { label: 'Moyenne générale', value: format(indicateurs.value.moyenne) },
    { label: 'Écart-type', value: format(indicateurs.value.ecartType) },
    { label: 'Meilleure moyenne', value: format(indicateurs.value.max) },
    { label: 'Moyenne la plus basse', value: format(indicateurs.value.min) },
    {
      label: 'Décision du jury',
      value: decisions.value.proclame
        ? decisions.value.lignes.map((ligne) => `${ligne.label} : ${ligne.nb}`).join(' · ')
        : 'Non proclamé',
    },
    {
      label: "Taux d'admission",
      value:
        decisions.value.tauxAdmission === null
          ? '—'
          : `${decisions.value.tauxAdmission.toFixed(1)} %`,
    },
    { label: "Date d'édition", value: new Date().toLocaleDateString('fr-FR') },
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

  if (canvasPaliers.value && classement.value.length) {
    const donnees = paliers.value;
    instances.paliers = new Chart(canvasPaliers.value, {
      type: 'bar',
      data: {
        labels: donnees.map((palier) => palier.label),
        datasets: [
          {
            label: 'Candidats',
            data: donnees.map((palier) => palier.nb),
            backgroundColor: donnees.map((_, index) => couleurSerie(index)),
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
                const palier = donnees[item.dataIndex];
                return `${palier.nb} candidat(s) — ${palier.part.toFixed(1)} %`;
              },
            },
          },
        },
        scales: {
          y: { grid: { color: '#f8f9fa' }, ticks: { precision: 0, font: { size: 10 } } },
          x: { grid: { display: false }, ticks: { font: { size: 10 } } },
        },
      },
    });
  }

  if (canvasDecisions.value && decisions.value.proclame) {
    const donnees = decisions.value.lignes;
    instances.decisions = new Chart(canvasDecisions.value, {
      type: 'doughnut',
      data: {
        labels: donnees.map((ligne) => ligne.label),
        datasets: [
          {
            data: donnees.map((ligne) => ligne.nb),
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
              afterLabel: (item) => `${donnees[item.dataIndex].part.toFixed(1)} % des classés`,
            },
          },
        },
      },
    });
  }
};

// Un seul déclencheur : les canvas naissent avec les données (ils sont sous un
// `v-else`), et les deux séries dépendent du même classement.
watch([classement, decisions], dessiner, { immediate: true });

watch(() => props.concoursId, charger);

onMounted(charger);
onBeforeUnmount(detruire);
</script>

<template>
  <div>
    <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
      <div>
        <h5 class="fw-bold mb-1 text-dark">Statistiques des résultats</h5>
        <p class="text-muted small mb-0">
          Distribution des moyennes, décision du jury et performance épreuve par épreuve.
        </p>
      </div>

      <ExportMenu :disabled="aucuneDonnee" @excel="exportToExcel" @pdf="exportToPdf" />
    </div>

    <LoadingSpinner v-if="loading && aucuneDonnee" />

    <EmptyState
      v-else-if="aucuneDonnee"
      title="Aucun résultat à analyser"
      description="Ce concours n'a pas encore de classement. Lancez le calcul des moyennes et des rangs depuis l'onglet « Résultats »."
    />

    <template v-else>
      <!-- Indicateurs de tête -->
      <div class="row g-3 mb-4">
        <div class="col-6 col-lg-3">
          <div class="card border-0 shadow-sm p-3 border-start border-primary border-3 h-100">
            <span class="text-muted small fw-semibold text-uppercase d-block mb-1">
              Candidats classés
            </span>
            <h4 class="fw-bold text-primary mb-0 font-monospace">
              {{ indicateurs.nbClasses }}
            </h4>
          </div>
        </div>

        <div class="col-6 col-lg-3">
          <div class="card border-0 shadow-sm p-3 border-start border-info border-3 h-100">
            <span class="text-muted small fw-semibold text-uppercase d-block mb-1">
              Moyenne générale
            </span>
            <h4 class="fw-bold text-info mb-0 font-monospace">
              {{ format(indicateurs.moyenne) }}
            </h4>
            <div class="text-xs text-muted mt-1">
              écart-type {{ format(indicateurs.ecartType) }}
            </div>
          </div>
        </div>

        <div class="col-6 col-lg-3">
          <div class="card border-0 shadow-sm p-3 border-start border-success border-3 h-100">
            <span class="text-muted small fw-semibold text-uppercase d-block mb-1">
              Meilleure moyenne
            </span>
            <h4 class="fw-bold text-success mb-0 font-monospace">
              {{ format(indicateurs.max) }}
            </h4>
            <div class="text-xs text-muted mt-1">la plus basse : {{ format(indicateurs.min) }}</div>
          </div>
        </div>

        <div class="col-6 col-lg-3">
          <div class="card border-0 shadow-sm p-3 border-start border-warning border-3 h-100">
            <span class="text-muted small fw-semibold text-uppercase d-block mb-1">
              Taux d'admission
            </span>
            <h4 class="fw-bold text-warning mb-0 font-monospace">
              {{
                decisions.tauxAdmission === null ? '—' : `${decisions.tauxAdmission.toFixed(1)} %`
              }}
            </h4>
            <div class="text-xs text-muted mt-1">
              <template v-if="decisions.proclame">
                proclamé le {{ formatDate(decisions.date, '—') }}
              </template>
              <template v-else>résultats non proclamés</template>
            </div>
          </div>
        </div>
      </div>

      <!-- Distribution et décisions -->
      <div class="row g-3 mb-3">
        <div class="col-lg-7">
          <div class="card border-0 shadow-sm bg-white p-4 h-100">
            <h6 class="fw-bold mb-3 small text-uppercase text-secondary tracking-wider">
              <i class="bi bi-bar-chart-fill text-primary me-2"></i>
              Distribution des moyennes
            </h6>
            <div class="chart-container position-relative" style="height: 260px">
              <canvas ref="canvasPaliers"></canvas>
            </div>
          </div>
        </div>

        <div class="col-lg-5">
          <div class="card border-0 shadow-sm bg-white p-4 h-100">
            <h6 class="fw-bold mb-3 small text-uppercase text-secondary tracking-wider">
              <i class="bi bi-pie-chart-fill text-info me-2"></i>Décision du jury
            </h6>

            <EmptyState
              v-if="!decisions.proclame"
              title="Résultats non proclamés"
              description="La délibération n'a pas encore été prononcée : aucune décision n'est enregistrée pour ce concours."
              :size="80"
            />

            <template v-else>
              <div class="chart-container position-relative" style="height: 200px">
                <canvas ref="canvasDecisions"></canvas>
              </div>

              <ul class="list-unstyled mb-0 mt-3 small">
                <li
                  v-for="ligne in decisions.lignes"
                  :key="ligne.code"
                  class="d-flex justify-content-between border-bottom py-1"
                >
                  <span class="text-dark">{{ ligne.label }}</span>
                  <span class="font-monospace text-muted">
                    {{ ligne.nb }} · {{ ligne.part.toFixed(1) }} %
                  </span>
                </li>
              </ul>
            </template>
          </div>
        </div>
      </div>

      <!-- Statistiques par épreuve -->
      <div class="card border-0 shadow-sm bg-white mb-3">
        <div class="card-header bg-white border-0 pt-4 px-4 pb-2">
          <h6 class="fw-bold mb-0 small text-uppercase text-secondary tracking-wider">
            <i class="bi bi-list-columns text-secondary me-2"></i>Performance par épreuve
          </h6>
        </div>

        <div class="card-body px-4 pt-2">
          <EmptyState
            v-if="parEpreuve.length === 0"
            title="Aucune épreuve"
            description="Aucune épreuve n'est déclarée pour ce concours."
            :size="80"
          />

          <div v-else class="table-responsive">
            <table class="table align-middle mb-0 text-sm">
              <thead class="table-light text-uppercase text-xs text-muted">
                <tr>
                  <th class="ps-3">Épreuve</th>
                  <th class="text-center">Coef.</th>
                  <th class="text-center">Notés</th>
                  <th class="text-center">Moyenne</th>
                  <th class="text-center">Min — Max</th>
                  <th class="text-end pe-3">Taux de réussite</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="epreuve in parEpreuve" :key="epreuve.code">
                  <td class="ps-3">
                    <span class="font-monospace fw-bold text-secondary me-2">
                      {{ epreuve.code }}
                    </span>
                    <span class="fw-semibold text-dark">{{ epreuve.designation }}</span>
                  </td>
                  <td class="text-center">{{ epreuve.coefficient }}</td>
                  <td class="text-center font-monospace">
                    {{ epreuve.nbNotes }} / {{ epreuve.nbCandidats }}
                  </td>
                  <td class="text-center fw-bold font-monospace">
                    {{ format(epreuve.moyenne) }}
                  </td>
                  <td class="text-center font-monospace text-muted">
                    {{ format(epreuve.min) }} — {{ format(epreuve.max) }}
                  </td>
                  <td class="text-end pe-3">
                    <span
                      v-if="epreuve.tauxReussite !== null"
                      class="badge rounded-pill px-3 py-2"
                      :class="
                        epreuve.tauxReussite >= 50
                          ? 'bg-success-subtle text-success'
                          : 'bg-danger-subtle text-danger'
                      "
                    >
                      {{ epreuve.tauxReussite.toFixed(1) }} %
                    </span>
                    <span v-else class="text-muted small">Non notée</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Répartition par sexe -->
      <div v-if="parSexe.length" class="card border-0 shadow-sm bg-white p-4">
        <h6 class="fw-bold mb-3 small text-uppercase text-secondary tracking-wider">
          <i class="bi bi-people-fill text-secondary me-2"></i>Répartition par sexe
        </h6>

        <div class="row g-3">
          <div v-for="ligne in parSexe" :key="ligne.code" class="col-md-6">
            <div class="border rounded p-3 h-100">
              <div class="d-flex justify-content-between align-items-center">
                <span class="fw-semibold text-dark">{{ ligne.label }}</span>
                <span class="font-monospace text-muted">{{ ligne.nb }} candidat(s)</span>
              </div>
              <div v-if="decisions.proclame" class="text-xs text-muted mt-1">
                {{ ligne.admis }} admis · taux d'admission
                {{ ligne.tauxAdmission === null ? '—' : `${ligne.tauxAdmission.toFixed(1)} %` }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.text-xs {
  font-size: 0.72rem;
}
.text-sm {
  font-size: 0.875rem;
}
.tracking-wider {
  letter-spacing: 0.5px;
}
</style>
