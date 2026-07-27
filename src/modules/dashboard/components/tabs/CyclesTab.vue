<template>
  <div class="dash-cycles-container">
    <div class="row g-3">
      <!-- Section 1 : Effectifs par cycle -->
      <div class="col-lg-7">
        <div class="card border-0 shadow-sm rounded-4 bg-white p-4 h-100">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <h6 class="fw-bold text-dark mb-0 small text-uppercase text-secondary tracking-wider">
              <i class="bi bi-diagram-2 text-primary me-2"></i>Effectifs par Cycle
            </h6>
            <ExportMenu @excel="exportToExcel" @pdf="exportToPdf" />
          </div>

          <LoadingSpinner v-if="loading && !cycles.length" />
          <EmptyState
            v-else-if="!cyclesPeuples.length"
            title="Aucun étudiant réparti"
            description="Les cycles apparaîtront ici dès qu'ils compteront des inscrits."
            :size="80"
          />
          <div v-else class="chart-container position-relative" style="height: 260px; width: 100%">
            <canvas ref="canvasCycles"></canvas>
          </div>
        </div>
      </div>

      <!-- Section 2 : Remplissage des filières -->
      <div class="col-lg-5">
        <div class="card border-0 shadow-sm rounded-4 bg-white p-4 h-100 d-flex flex-column">
          <h6 class="fw-bold text-dark mb-3 small text-uppercase text-secondary tracking-wider">
            <i class="bi bi-speedometer2 text-success me-2"></i>Remplissage des Filières
          </h6>

          <LoadingSpinner v-if="loading && !filieres.length" />
          <EmptyState
            v-else-if="!filieres.length"
            title="Aucune filière"
            description="Créez une filière pour suivre son taux de remplissage."
            :size="80"
          />
          <div v-else class="flex-grow-1">
            <div v-for="filiere in filieresParEffectif" :key="filiere.id" class="mb-3">
              <div class="d-flex justify-content-between text-xs mb-1">
                <span class="fw-semibold text-muted">{{ filiere.filiere }}</span>
                <span class="font-monospace fw-bold" :class="classeTaux(filiere.taux)">
                  {{ filiere.taux.toFixed(1) }}%
                </span>
              </div>
              <div class="progress rounded-pill" style="height: 6px">
                <div
                  class="progress-bar"
                  :class="barreTaux(filiere.taux)"
                  role="progressbar"
                  :style="{ width: `${Math.min(filiere.taux, 100)}%` }"
                ></div>
              </div>
              <div class="text-xs text-muted mt-1">
                {{ filiere.effectif }} / {{ filiere.capacite }} places · responsable
                {{ filiere.responsable }}
              </div>
            </div>
          </div>

          <!--
            L'ancienne « Note Secrétariat » commentait des chiffres inventés et
            créditait « le module de suivi des émargements et présences » — un
            module qui n'existe pas : aucun backend d'absences n'est exposé
            (§1.7, §2.5.7). Elle est remplacée par une lecture des données réelles.
          -->
          <div
            class="p-3 bg-light rounded text-xs text-muted border-start border-3 border-primary mt-auto"
          >
            <span class="fw-bold text-dark d-block mb-1">
              <i class="bi bi-info-circle me-1"></i>Lecture :
            </span>
            {{ lecture }}
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
import ExportMenu from '@/shared/components/ExportMenu.vue';
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue';
import { useTableExport } from '@/shared/composables/useTableExport';
import { useDashboardStore } from '../../store';

const store = useDashboardStore();
const { cycles, filieres, loading, cyclesPeuples, filieresParEffectif } = storeToRefs(store);

const canvasCycles = ref(null);
let instance = null;

const classeTaux = (taux) => {
  if (taux >= 80) return 'text-danger';
  if (taux >= 50) return 'text-success';
  return 'text-warning';
};

const barreTaux = (taux) => {
  if (taux >= 80) return 'bg-danger';
  if (taux >= 50) return 'bg-success';
  return 'bg-warning';
};

/** Commentaire dérivé des données affichées, et non d'un texte figé. */
const lecture = computed(() => {
  if (!filieres.value.length) return 'Aucune filière enregistrée.';

  const peuplees = filieresParEffectif.value.filter((filiere) => filiere.effectif > 0);
  if (!peuplees.length) {
    return `Les ${filieres.value.length} filières enregistrées sont encore sans effectif.`;
  }

  const tete = peuplees[0];
  return (
    `${peuplees.length} filière(s) sur ${filieres.value.length} comptent des inscrits. ` +
    `La plus fournie est ${tete.filiere}, à ${tete.taux.toFixed(1)}% de sa capacité.`
  );
});

const { exportToExcel, exportToPdf } = useTableExport({
  rows: computed(() =>
    cyclesPeuples.value.map((cycle) => ({
      Cycle: cycle.cycle_code,
      Diplôme: cycle.diplome,
      Étudiants: cycle.nb_etudiants,
    }))
  ),
  title: 'Effectifs par cycle',
  fileBaseName: 'effectifs_par_cycle',
});

const dessiner = async () => {
  await nextTick();
  instance?.destroy();
  instance = null;

  if (!canvasCycles.value || !cyclesPeuples.value.length) return;

  instance = new Chart(canvasCycles.value, {
    type: 'doughnut',
    data: {
      labels: cyclesPeuples.value.map((cycle) => cycle.cycle_code),
      datasets: [
        {
          data: cyclesPeuples.value.map((cycle) => cycle.nb_etudiants),
          backgroundColor: [
            'rgba(0, 123, 255, 0.85)',
            'rgba(255, 193, 7, 0.85)',
            'rgba(40, 167, 69, 0.85)',
            'rgba(23, 162, 184, 0.85)',
            'rgba(108, 117, 125, 0.85)',
          ],
          borderWidth: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '62%',
      plugins: {
        legend: { position: 'right', labels: { boxWidth: 12, font: { size: 11 } } },
        tooltip: {
          callbacks: {
            title: (items) => cyclesPeuples.value[items[0].dataIndex]?.diplome ?? '',
          },
        },
      },
    },
  });
};

watch(cyclesPeuples, dessiner);

onMounted(async () => {
  await Promise.all([store.fetchCycles(), store.fetchFilieres()]);
  dessiner();
});

onBeforeUnmount(() => {
  instance?.destroy();
  instance = null;
});
</script>

<style scoped>
/* Teintes douces Flat Design harmonisées */
.bg-soft-primary {
  background-color: rgba(0, 123, 255, 0.08);
}
.bg-soft-warning {
  background-color: rgba(255, 193, 7, 0.15);
}
.bg-soft-success {
  background-color: rgba(40, 167, 69, 0.12);
}

.text-xs {
  font-size: 11px !important;
}
.tracking-wider {
  letter-spacing: 0.5px;
}

/* Alignement structurel strict de la charte ERP */
.rounded-4 {
  border-radius: 0.2rem !important;
}
</style>
