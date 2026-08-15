<script setup>
import { computed, onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import EmptyState from '@/shared/components/EmptyState.vue';
import ExportMenu from '@/shared/components/ExportMenu.vue';
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue';
import Pagination from '@/components/shared/Pagination.vue';
import { useTableExport } from '@/shared/composables/useTableExport';
import { usePagination } from '@/shared/composables/usePagination';
import { useFiliereStore } from '../../store';
import { badgeStatut } from '../../constants';

/**
 * Organisation des filières.
 *
 * ⚠️ Les colonnes « Capacité » et « Taux de remplissage » viennent de
 * `v_organisation_filieres`, dont la capacité est **gonflée** : la vue somme
 * `classe.capacite_max` après une jointure sur `inscriptions`, donc chaque
 * classe y compte autant de fois qu'elle a d'inscrits. C'est ce qui explique un
 * taux d'environ 2,45 % pour toutes les filières. Le correctif est côté base ;
 * les onglets « Organisation » et « Statistiques » des cycles et des classes
 * contournent la vue en recomposant leurs agrégats depuis `v_organisation_classes`.
 */

const filiereStore = useFiliereStore();
const { organisation, loading } = storeToRefs(filiereStore);

const recherche = ref('');

const organisationFiltree = computed(() => {
  const terme = recherche.value.trim().toLowerCase();
  if (!terme) return organisation.value;

  return organisation.value.filter((org) =>
    [org.filiere, org.responsable, org.statut].some((champ) =>
      String(champ ?? '')
        .toLowerCase()
        .includes(terme)
    )
  );
});

const { page, itemsPerPage, startIndex, paginated } = usePagination(organisationFiltree, {
  perPage: 10,
  resetKey: () => recherche.value,
});

// Attribution d'une couleur à la barre de progression selon le remplissage
const getProgressClass = (taux) => {
  const t = parseFloat(taux);
  if (t < 50) return 'bg-info';
  if (t < 85) return 'bg-success';
  if (t < 100) return 'bg-warning';
  return 'bg-danger';
};

const { exportToExcel, exportToPdf } = useTableExport({
  rows: computed(() =>
    organisationFiltree.value.map((org, index) => ({
      'N°': index + 1,
      Filière: org.filiere,
      Responsable: org.responsable,
      Effectifs: org.effectif,
      Capacité: org.capacite,
      'Taux de remplissage': `${org.taux} %`,
      Statut: org.statut,
    }))
  ),
  title: 'Organisation des filières',
  fileBaseName: 'organisation_filieres',
});

onMounted(() => filiereStore.fetchOrganisation());
</script>

<template>
  <div>
    <div class="d-flex justify-content-between align-items-start mb-3 flex-wrap gap-2">
      <div>
        <h4 class="mb-1">Organisation des filières</h4>
        <p class="text-muted mb-0 small">
          Vue d’ensemble des filières par cycle avec suivi des capacités et des effectifs.
        </p>
      </div>
      <ExportMenu
        :disabled="organisationFiltree.length === 0"
        @excel="exportToExcel"
        @pdf="exportToPdf"
      />
    </div>

    <LoadingSpinner v-if="loading && !organisation.length" />

    <EmptyState
      v-else-if="!organisation.length"
      title="Aucune filière trouvée"
      description="Créez une filière depuis l'onglet « Liste des filières » pour voir apparaître son organisation."
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
              placeholder="Rechercher une filière, un responsable…"
            />
          </div>
        </div>
      </div>

      <EmptyState
        v-if="!organisationFiltree.length"
        title="Aucune filière ne correspond"
        description="Modifiez votre recherche pour retrouver une filière."
        :size="80"
      />

      <template v-else>
        <div class="table-responsive card border-0 shadow-sm">
          <table class="table align-middle mb-0 table-hover">
            <thead class="table-light">
              <tr>
                <th class="ps-3" style="width: 60px">#</th>
                <th>Filière</th>
                <th>Responsable</th>
                <th>Effectifs</th>
                <th>Capacité</th>
                <th>Taux de remplissage</th>
                <th class="text-end pe-3">Statut</th>
              </tr>
            </thead>

            <tbody>
              <tr v-for="(org, index) in paginated" :key="org.id">
                <td class="ps-3 text-muted">{{ startIndex + index + 1 }}</td>
                <td class="fw-bold text-dark">{{ org.filiere }}</td>
                <td>
                  <span
                    :class="org.responsable === 'Non assigné' ? 'text-muted italic' : 'fw-medium'"
                  >
                    {{ org.responsable }}
                  </span>
                </td>
                <td class="font-monospace">{{ org.effectif }}</td>
                <td class="font-monospace">{{ org.capacite }}</td>
                <td>
                  <div class="d-flex align-items-center" style="min-width: 150px">
                    <div class="progress w-100 me-2" style="height: 6px">
                      <div
                        class="progress-bar"
                        :class="getProgressClass(org.taux)"
                        :style="{ width: `${Math.min(Number(org.taux) || 0, 100)}%` }"
                      ></div>
                    </div>
                    <small class="fw-semibold font-monospace">{{ org.taux }} %</small>
                  </div>
                </td>
                <td class="text-end pe-3">
                  <span class="badge rounded-pill px-2 py-1" :class="badgeStatut(org.statut)">
                    {{ org.statut }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <Pagination
          v-model="page"
          v-model:items-per-page="itemsPerPage"
          :total-items="organisationFiltree.length"
        />
      </template>
    </template>
  </div>
</template>
