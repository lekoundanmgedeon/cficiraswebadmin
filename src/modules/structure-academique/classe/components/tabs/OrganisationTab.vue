<script setup>
import { computed, onMounted, ref } from 'vue';
import EmptyState from '@/shared/components/EmptyState.vue';
import ExportMenu from '@/shared/components/ExportMenu.vue';
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue';
import Pagination from '@/components/shared/Pagination.vue';
import { useTableExport } from '@/shared/composables/useTableExport';
import { usePagination } from '@/shared/composables/usePagination';
import { barreTaux, classeTaux } from '@/shared/utils/remplissage';
import { useClasseStatistiques } from '../../composables/useClasseStatistiques';

/**
 * Arbre d'organisation des classes : une ligne par classe, avec son cycle, sa
 * filière, son niveau et son remplissage.
 *
 * Le tableau affichait ses **135 lignes d'un bloc**. Il est désormais paginé, et
 * les filtres ramènent à la première page — sans quoi filtrer depuis la page 4
 * laissait l'utilisateur devant un tableau vide.
 *
 * Le filtre par statut proposait par ailleurs « VIDE », que `v_organisation_classes`
 * ne produit jamais, et omettait « COMPLÈTE », qu'elle produit : les trois
 * valeurs réelles de la vue sont `OUVERTE`, `COMPLÈTE` et `FERMÉE` (une classe
 * sans inscrit y est dite fermée). Les options sont maintenant déduites des
 * données plutôt qu'écrites d'avance.
 */

const { charger, loading, classes, indicateurs } = useClasseStatistiques();

const recherche = ref('');
const filtreCycle = ref('');
const filtreStatut = ref('');

const cyclesDisponibles = computed(() => [
  ...new Set(classes.value.map((classe) => classe.cycleCode).filter(Boolean)),
]);

const statutsDisponibles = computed(() => [
  ...new Set(classes.value.map((classe) => classe.statut).filter(Boolean)),
]);

const classesFiltrees = computed(() => {
  const terme = recherche.value.trim().toLowerCase();

  return classes.value.filter((classe) => {
    const correspondRecherche =
      !terme ||
      [classe.classe, classe.filiere, classe.cycle, classe.niveau].some((champ) =>
        String(champ ?? '')
          .toLowerCase()
          .includes(terme)
      );

    const correspondCycle = !filtreCycle.value || classe.cycleCode === filtreCycle.value;
    const correspondStatut = !filtreStatut.value || classe.statut === filtreStatut.value;

    return correspondRecherche && correspondCycle && correspondStatut;
  });
});

const { page, itemsPerPage, startIndex, paginated } = usePagination(classesFiltrees, {
  perPage: 15,
  resetKey: () => [recherche.value, filtreCycle.value, filtreStatut.value],
});

const badgeStatut = (statut) =>
  ({
    OUVERTE: 'bg-success-subtle text-success border border-success-subtle',
    COMPLÈTE: 'bg-danger-subtle text-danger border border-danger-subtle',
    FERMÉE: 'bg-secondary-subtle text-secondary border border-secondary-subtle',
  })[statut] || 'bg-light text-dark';

const { exportToExcel, exportToPdf } = useTableExport({
  rows: computed(() =>
    classesFiltrees.value.map((classe, index) => ({
      'N°': index + 1,
      Classe: classe.classe,
      Niveau: classe.niveau,
      Filière: classe.filiere,
      Cycle: classe.cycle,
      Effectif: classe.effectif,
      Capacité: classe.capacite,
      Remplissage: `${classe.taux.toFixed(1)} %`,
      Statut: classe.statut,
    }))
  ),
  title: 'Organisation des classes',
  fileBaseName: 'organisation_classes',
  filters: () => [
    { label: 'Cycle', value: filtreCycle.value || 'Tous' },
    { label: 'Statut', value: filtreStatut.value || 'Tous' },
    { label: 'Classes', value: classesFiltrees.value.length },
  ],
});

onMounted(() => charger());
</script>

<template>
  <div>
    <div class="d-flex justify-content-between align-items-start mb-3 flex-wrap gap-2">
      <div>
        <h4 class="mb-1">Arbre d'organisation des classes</h4>
        <p class="text-muted mb-0 small">
          Suivi global des structures pédagogiques : répartition des effectifs par cycle, filière et
          niveau.
        </p>
      </div>
      <ExportMenu
        :disabled="classesFiltrees.length === 0"
        @excel="exportToExcel"
        @pdf="exportToPdf"
      />
    </div>

    <LoadingSpinner v-if="loading && !classes.length" />

    <EmptyState
      v-else-if="!classes.length"
      title="Aucune donnée d'organisation"
      description="Créez une classe depuis l'onglet « Liste des classes » pour voir apparaître son organisation."
    />

    <template v-else>
      <div class="card border-0 shadow-sm bg-light-subtle mb-3">
        <div class="card-body p-3">
          <div class="row g-2">
            <div class="col-md-5">
              <div class="input-group bg-white rounded shadow-sm">
                <span class="input-group-text bg-white border-0">
                  <i class="mdi mdi-magnify text-muted"></i>
                </span>
                <input
                  v-model="recherche"
                  type="text"
                  class="form-control border-0"
                  placeholder="Rechercher par classe, filière, niveau ou cycle…"
                />
              </div>
            </div>
            <div class="col-md-3">
              <select v-model="filtreCycle" class="form-select bg-white border-0 shadow-sm">
                <option value="">Tous les cycles</option>
                <option v-for="code in cyclesDisponibles" :key="code" :value="code">
                  {{ code }}
                </option>
              </select>
            </div>
            <div class="col-md-2">
              <select v-model="filtreStatut" class="form-select bg-white border-0 shadow-sm">
                <option value="">Tous les statuts</option>
                <option v-for="statut in statutsDisponibles" :key="statut" :value="statut">
                  {{ statut }}
                </option>
              </select>
            </div>
            <div class="col-md-2 d-flex align-items-center justify-content-md-end">
              <span class="text-muted small font-monospace">
                {{ classesFiltrees.length }} / {{ indicateurs.nbClasses }} classe(s)
              </span>
            </div>
          </div>
        </div>
      </div>

      <EmptyState
        v-if="!classesFiltrees.length"
        title="Aucune classe ne correspond"
        description="Modifiez vos filtres ou votre recherche pour retrouver une classe."
        :size="80"
      />

      <template v-else>
        <div class="table-responsive card border-0 shadow-sm">
          <table class="table align-middle mb-0 table-hover">
            <thead class="table-light">
              <tr>
                <th class="ps-3" style="width: 60px">#</th>
                <th>Classe &amp; Niveau</th>
                <th>Filière</th>
                <th>Structure / Cycle</th>
                <th class="text-center">Effectif / Capacité</th>
                <th style="min-width: 160px">Remplissage</th>
                <th class="text-end pe-3">Statut</th>
              </tr>
            </thead>

            <tbody>
              <tr v-for="(classe, index) in paginated" :key="classe.id">
                <td class="ps-3 text-muted">{{ startIndex + index + 1 }}</td>
                <td>
                  <div class="d-flex align-items-center">
                    <span class="badge bg-primary text-white me-2 font-monospace px-2 py-1">
                      {{ classe.classe }}
                    </span>
                    <span class="badge bg-secondary-subtle text-secondary font-monospace">
                      {{ classe.niveau }}
                    </span>
                  </div>
                </td>
                <td>
                  <div class="fw-semibold text-dark">{{ classe.filiere }}</div>
                </td>
                <td>
                  <div class="text-dark small mb-0">{{ classe.cycle }}</div>
                  <small class="badge bg-light text-muted border font-monospace text-xs">
                    {{ classe.cycleCode }}
                  </small>
                </td>
                <td class="text-center font-monospace">
                  <span class="fw-bold text-dark">{{ classe.effectif }}</span>
                  <span class="text-muted"> / {{ classe.capacite }}</span>
                </td>
                <td>
                  <div class="d-flex align-items-center gap-2" style="min-width: 130px">
                    <div class="progress flex-grow-1" style="height: 6px">
                      <div
                        class="progress-bar"
                        :class="barreTaux(classe.taux)"
                        :style="{ width: `${Math.min(classe.taux, 100)}%` }"
                      ></div>
                    </div>
                    <small class="fw-semibold font-monospace" :class="classeTaux(classe.taux)">
                      {{ classe.taux.toFixed(0) }} %
                    </small>
                  </div>
                </td>
                <td class="text-end pe-3">
                  <span class="badge rounded-pill px-2 py-1" :class="badgeStatut(classe.statut)">
                    {{ classe.statut }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <Pagination
          v-model="page"
          v-model:items-per-page="itemsPerPage"
          :total-items="classesFiltrees.length"
        />
      </template>
    </template>
  </div>
</template>

<style scoped>
.text-xs {
  font-size: 0.75rem;
}
</style>
