<template>
  <div class="card border-0 shadow-sm rounded-4 bg-white p-4">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h6 class="fw-bold text-dark mb-0 small text-uppercase text-secondary tracking-wider">
        <i class="bi bi-trophy text-warning me-2"></i>Comparaison des Classes
      </h6>
      <ExportMenu @excel="exportToExcel" @pdf="exportToPdf" />
    </div>

    <LoadingSpinner v-if="loading && !classementClasses.length" />
    <EmptyState
      v-else-if="!classementClasses.length"
      title="Aucune classe à comparer"
      description="Les classes apparaîtront ici dès que leurs bulletins auront été calculés."
      :size="80"
    />
    <div v-else class="table-responsive">
      <table class="table table-hover align-middle mb-0 text-sm">
        <thead class="bg-light text-secondary text-xs">
          <tr>
            <th class="ps-2">Classe</th>
            <th>Filière</th>
            <th class="text-center">Effectif</th>
            <th class="text-center">Moyenne</th>
            <th class="text-center">Admis</th>
            <th class="pe-2" style="min-width: 140px">Taux de réussite</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="ligne in classementClasses" :key="ligne.classe_id ?? ligne.classe_code">
            <td class="ps-2 fw-bold text-dark text-xs font-monospace">
              {{ ligne.classe_code ?? '—' }}
            </td>
            <td class="text-xs text-muted">{{ ligne.filiere ?? '—' }}</td>
            <td class="text-center font-monospace text-xs">{{ ligne.effectif }}</td>
            <td class="text-center font-monospace text-xs fw-bold">
              {{ formatMoyenne(ligne.moyenne) }}
            </td>
            <td class="text-center font-monospace text-xs">
              {{ ligne.admis }} / {{ ligne.effectif }}
            </td>
            <td class="pe-2">
              <div class="d-flex align-items-center gap-2">
                <div class="progress rounded-pill flex-grow-1" style="height: 6px">
                  <div
                    class="progress-bar"
                    :class="barre(taux(ligne))"
                    role="progressbar"
                    :style="{ width: `${Math.min(taux(ligne), 100)}%` }"
                  ></div>
                </div>
                <span class="font-monospace text-xs fw-bold" style="min-width: 44px">
                  {{ taux(ligne).toFixed(1) }}%
                </span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import EmptyState from '@/shared/components/EmptyState.vue';
import ExportMenu from '@/shared/components/ExportMenu.vue';
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue';
import { useTableExport } from '@/shared/composables/useTableExport';
import { useStatsStore } from '../../store';
import { formatMoyenne, tauxReussite } from '../../constants';

const store = useStatsStore();
const { loading, classementClasses } = storeToRefs(store);

const taux = (ligne) => tauxReussite(ligne.admis, ligne.effectif);

const barre = (valeur) => {
  if (valeur >= 75) return 'bg-success';
  if (valeur >= 50) return 'bg-warning';
  return 'bg-danger';
};

const { exportToExcel, exportToPdf } = useTableExport({
  rows: computed(() =>
    classementClasses.value.map((ligne) => ({
      Classe: ligne.classe_code ?? '—',
      Filière: ligne.filiere ?? '—',
      Effectif: ligne.effectif,
      Moyenne: ligne.moyenne ?? '',
      Admis: ligne.admis,
      'Taux (%)': Number(taux(ligne).toFixed(1)),
    }))
  ),
  title: 'Comparaison des classes',
  fileBaseName: 'comparaison_classes',
});
</script>

<style scoped>
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

.rounded-4 {
  border-radius: 0.2rem !important;
}
</style>
