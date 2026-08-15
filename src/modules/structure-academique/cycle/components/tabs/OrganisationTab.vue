<script setup>
import { computed, onMounted, ref } from 'vue';
import EmptyState from '@/shared/components/EmptyState.vue';
import ExportMenu from '@/shared/components/ExportMenu.vue';
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue';
import Pagination from '@/components/shared/Pagination.vue';
import { useTableExport } from '@/shared/composables/useTableExport';
import { usePagination } from '@/shared/composables/usePagination';
import { barreTaux, classeTaux, SEUILS } from '@/shared/utils/remplissage';
import { useCycleStatistiques } from '../../composables/useCycleStatistiques';

/**
 * Organisation des cycles : effectifs, capacités d'accueil et remplissage.
 *
 * ### Deux défauts corrigés ici
 *
 * 1. **La capacité affichée était fausse.** L'onglet lisait
 *    `GET /cycles/stats/organisations`, dont la vue somme `capacite_max` après
 *    une jointure sur `inscriptions` : chaque classe y compte autant de fois
 *    qu'elle a d'inscrits. Relevé en base, 11 130 places annoncées là où il y en
 *    a 1 800, et un taux de remplissage de 2,45 % pour **tous** les cycles.
 *    Les agrégats viennent maintenant de `v_organisation_classes`, groupée par
 *    classe — la même source que l'onglet « Statistiques », pour que les deux
 *    onglets d'un même écran ne se contredisent pas.
 *
 * 2. **La colonne « Filières disponibles » affichait un nombre.**
 *    `filieres_disponibles` est un `COUNT`, servi en chaîne par `pg` ; le code
 *    le traitait comme une liste séparée par des virgules et rendait donc un
 *    badge unique contenant « 3 ». Les filières réellement rattachées sont
 *    désormais nommées.
 */

const { charger, loading, cyclesEnrichis, indicateurs } = useCycleStatistiques();

const recherche = ref('');

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

/** @param {ReturnType<typeof cyclesEnrichis.value.at>} cycle */
const statut = (cycle) => {
  if (cycle.capacite === 0) return 'Aucune capacité';
  if (cycle.effectif === 0) return 'Vide';
  return cycle.taux >= SEUILS.SATUREE ? 'Complet' : 'Partiel';
};

const badgeStatut = (valeur) =>
  ({
    Complet: 'bg-success-subtle text-success',
    Partiel: 'bg-warning-subtle text-warning-emphasis',
    Vide: 'bg-secondary-subtle text-secondary',
    'Aucune capacité': 'bg-light text-muted border',
  })[valeur] || 'bg-light text-dark';

const { exportToExcel, exportToPdf } = useTableExport({
  rows: computed(() =>
    cyclesFiltres.value.map((cycle) => ({
      Code: cycle.code,
      Cycle: cycle.diplome,
      Filières: cycle.filieres.join(', ') || '—',
      Classes: cycle.nbClasses,
      Effectifs: cycle.effectif,
      Capacité: cycle.capacite,
      'Taux de remplissage': `${cycle.taux.toFixed(1)} %`,
      Statut: statut(cycle),
    }))
  ),
  title: 'Organisation des cycles',
  fileBaseName: 'organisation_cycles',
});

onMounted(() => charger());
</script>

<template>
  <div>
    <div class="d-flex justify-content-between align-items-start mb-3 flex-wrap gap-2">
      <div>
        <h4 class="mb-1">Vue d'ensemble de l'organisation</h4>
        <p class="text-muted mb-0 small">
          Suivi opérationnel des effectifs, des capacités d'accueil et du taux de remplissage par
          cycle.
        </p>
      </div>
      <ExportMenu
        :disabled="cyclesEnrichis.length === 0"
        @excel="exportToExcel"
        @pdf="exportToPdf"
      />
    </div>

    <LoadingSpinner v-if="loading && !cyclesEnrichis.length" />

    <EmptyState
      v-else-if="!cyclesEnrichis.length"
      title="Aucun cycle configuré"
      description="Créez un cycle depuis l'onglet « Liste des cycles » pour voir apparaître son organisation."
    />

    <template v-else>
      <div class="row g-2 align-items-center mb-3">
        <div class="col-md-5">
          <div class="input-group input-group-sm">
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
        <div class="col-md-7 text-md-end">
          <span class="badge bg-primary-subtle text-primary px-3 py-2 me-1">
            {{ indicateurs.nbClasses }} classe(s)
          </span>
          <span class="badge bg-success-subtle text-success px-3 py-2 me-1">
            {{ indicateurs.effectifTotal }} inscrit(s)
          </span>
          <span class="badge bg-info-subtle text-info px-3 py-2">
            {{ indicateurs.placesDisponibles }} place(s) libre(s) sur
            {{ indicateurs.capaciteTotale }}
          </span>
        </div>
      </div>

      <EmptyState
        v-if="!cyclesFiltres.length"
        title="Aucun cycle ne correspond"
        description="Modifiez votre recherche pour retrouver un cycle."
        :size="80"
      />

      <template v-else>
        <div class="table-responsive border rounded bg-white">
          <table class="table table-hover align-middle mb-0">
            <thead class="table-light">
              <tr>
                <th class="py-3 ps-3" style="width: 60px">#</th>
                <th class="py-3">Cycle</th>
                <th class="py-3">Filières rattachées</th>
                <th class="py-3 text-center">Effectifs / Capacité</th>
                <th class="py-3" style="width: 200px">Taux de remplissage</th>
                <th class="py-3 text-center" style="width: 140px">Statut</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(cycle, index) in paginated" :key="cycle.id">
                <td class="ps-3 text-muted">{{ startIndex + index + 1 }}</td>

                <td>
                  <div class="fw-bold text-dark">{{ cycle.diplome }}</div>
                  <small class="text-muted text-uppercase fw-semibold text-xs">
                    Codification : {{ cycle.code }} · {{ cycle.nbClasses }} classe(s)
                  </small>
                </td>

                <td>
                  <div v-if="cycle.filieres.length" class="d-flex flex-wrap gap-1">
                    <span
                      v-for="filiere in cycle.filieres"
                      :key="filiere"
                      class="badge bg-light text-dark border px-2 py-1 fw-normal"
                    >
                      {{ filiere }}
                    </span>
                  </div>
                  <span v-else class="text-muted small fst-italic">Aucune classe rattachée</span>
                </td>

                <td class="text-center">
                  <span class="fw-semibold text-dark font-monospace">{{ cycle.effectif }}</span>
                  <span class="text-muted px-1">/</span>
                  <span class="text-secondary small font-monospace">{{ cycle.capacite }}</span>
                </td>

                <td>
                  <div v-if="cycle.capacite > 0">
                    <div class="d-flex align-items-center justify-content-between mb-1">
                      <span class="fw-medium small" :class="classeTaux(cycle.taux)">
                        {{ cycle.taux.toFixed(1) }} %
                      </span>
                      <span class="text-muted text-xs">
                        {{ cycle.placesRestantes }} place(s) libre(s)
                      </span>
                    </div>
                    <div class="progress" style="height: 6px">
                      <div
                        class="progress-bar rounded"
                        role="progressbar"
                        :class="barreTaux(cycle.taux)"
                        :style="{ width: `${Math.min(cycle.taux, 100)}%` }"
                        :aria-valuenow="cycle.taux"
                        aria-valuemin="0"
                        aria-valuemax="100"
                      ></div>
                    </div>
                  </div>
                  <span v-else class="text-muted small">-</span>
                </td>

                <td class="text-center">
                  <span
                    class="badge rounded-pill px-3 py-2 text-xs fw-semibold"
                    :class="badgeStatut(statut(cycle))"
                  >
                    {{ statut(cycle) }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <Pagination
          v-model="page"
          v-model:items-per-page="itemsPerPage"
          :total-items="cyclesFiltres.length"
        />
      </template>
    </template>
  </div>
</template>

<style scoped>
.text-xs {
  font-size: 0.72rem;
}

.table th {
  font-size: 0.82rem;
  letter-spacing: 0.5px;
  font-weight: 700;
  color: #5c677d;
}
</style>
