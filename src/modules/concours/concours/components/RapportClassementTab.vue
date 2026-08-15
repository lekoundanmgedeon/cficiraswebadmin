<script setup>
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import EmptyState from '@/shared/components/EmptyState.vue';
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue';
import ExportMenu from '@/shared/components/ExportMenu.vue';
import Pagination from '@/components/shared/Pagination.vue';
import { useTableExport } from '@/shared/composables/useTableExport';
import { usePagination } from '@/shared/composables/usePagination';
import { useConcoursStore } from '../store';
import { decisionJuryInfo } from '../../constants';

const props = defineProps({
  concoursId: { type: String, default: '' },
  /** Désignation du concours, pour l'en-tête du document exporté. */
  designation: { type: String, default: '' },
});

/**
 * Classement des candidats — l'onglet historique de l'écran des rapports.
 *
 * Le chargement est fait par la vue : les deux onglets lisent le même
 * classement, et le recharger à chaque bascule d'onglet serait une requête pour
 * rien.
 *
 * La colonne « Décision » n'existait pas : les décisions du jury étaient écrites
 * en base par la proclamation sans qu'aucune lecture ne les expose (voir
 * `decisionJuryInfo`).
 */

const concoursStore = useConcoursStore();
const { classement, loading } = storeToRefs(concoursStore);

const classes = computed(() =>
  [...classement.value].sort((a, b) => Number(a.rang ?? 0) - Number(b.rang ?? 0))
);

/** @param {any} value */
const moyenne = (value) => {
  const number = Number(value);
  return Number.isNaN(number) ? '—' : number.toFixed(2);
};

/**
 * Le classement est rendu page par page — 132 candidats pour le concours du jeu
 * de démonstration. Changer de concours repart de la première page : le rang 40
 * de l'un ne dit rien de l'autre.
 *
 * ⚠️ L'export, lui, porte sur **tout** le classement : un rapport amputé de ses
 * pages suivantes ne serait pas un rapport.
 */
const { page, itemsPerPage, paginated } = usePagination(classes, {
  perPage: 20,
  resetKey: () => props.concoursId,
});

const { exportToExcel, exportToPdf } = useTableExport({
  rows: computed(() =>
    classes.value.map((candidat) => ({
      Rang: candidat.rang,
      'N° table': candidat.num_table,
      Nom: candidat.nom,
      Prénom: candidat.prenom,
      'Moyenne générale': moyenne(candidat.moyenne_generale),
      Décision: decisionJuryInfo(candidat.decision_jury).label,
    }))
  ),
  title: 'Classement du concours',
  fileBaseName: 'classement_concours',
  filters: () => [
    { label: 'Concours', value: props.designation || '—' },
    { label: 'Candidats classés', value: classes.value.length },
    { label: "Date d'édition", value: new Date().toLocaleDateString('fr-FR') },
  ],
});

defineExpose({ classes });
</script>

<template>
  <div>
    <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
      <div>
        <h5 class="fw-bold mb-1 text-dark">Classement</h5>
        <p class="text-muted small mb-0">
          Moyenne pondérée et rang de chaque candidat, tels que le serveur les calcule.
        </p>
      </div>

      <ExportMenu :disabled="classes.length === 0" @excel="exportToExcel" @pdf="exportToPdf" />
    </div>

    <LoadingSpinner v-if="loading && classes.length === 0" />

    <EmptyState
      v-else-if="classes.length === 0"
      title="Aucun classement"
      description="Ce concours n'a pas encore de classement. Lancez le calcul des moyennes et des rangs depuis l'onglet « Résultats »."
    />

    <div v-else class="table-responsive">
      <table class="table table-hover align-middle mb-0 text-sm">
        <thead class="table-light text-uppercase text-xs text-muted">
          <tr>
            <th class="ps-3" style="width: 80px">Rang</th>
            <th>N° table</th>
            <th>Candidat</th>
            <th class="text-center">Moyenne générale</th>
            <th class="text-center pe-3">Décision</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="candidat in paginated" :key="candidat.candidat_id">
            <td class="ps-3 fw-bold text-secondary">{{ candidat.rang }}</td>
            <td>
              <span class="font-monospace fw-bold text-secondary">{{ candidat.num_table }}</span>
            </td>
            <td class="fw-semibold text-dark">{{ candidat.nom }} {{ candidat.prenom }}</td>
            <td class="text-center fw-bold font-monospace">
              {{ moyenne(candidat.moyenne_generale) }}
            </td>
            <td class="text-center pe-3">
              <span
                class="badge rounded-pill px-3 py-2"
                :class="`bg-${decisionJuryInfo(candidat.decision_jury).variant}-subtle text-${decisionJuryInfo(candidat.decision_jury).variant}`"
              >
                {{ decisionJuryInfo(candidat.decision_jury).label }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>

      <Pagination
        v-model="page"
        v-model:items-per-page="itemsPerPage"
        :total-items="classes.length"
      />
    </div>
  </div>
</template>

<style scoped>
.text-xs {
  font-size: 0.72rem;
}
.text-sm {
  font-size: 0.875rem;
}
</style>
