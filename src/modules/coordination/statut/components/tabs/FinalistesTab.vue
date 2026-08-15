<script setup>
import { computed, onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import ExportMenu from '@/shared/components/ExportMenu.vue';
import EmptyState from '@/shared/components/EmptyState.vue';
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue';
import Pagination from '@/components/shared/Pagination.vue';
import { useTableExport } from '@/shared/composables/useTableExport';
import { usePagination } from '@/shared/composables/usePagination';
import { formatDate } from '@/shared/utils/date';
import { useTravailStore } from '../../../travaux/store';
import { useTravailForm } from '../../../travaux/composables/useTravailForm';
import { SITUATION_LIST, situationInfo, statutTravailInfo } from '../../../constants';

/**
 * Les finalistes : qui termine son cycle cette année, et où il en est.
 *
 * ## « Finaliste » se déduit du cycle, jamais d'un libellé
 *
 * La vue `v_finalistes` retient les étudiants dont le niveau porte le dernier
 * rang de son cycle (`niveau.ordre = cycle.duree_annees`) : L3 pour une licence
 * de trois ans, M2 pour un master de deux, dernière année d'un cycle
 * d'ingénieur. Aucune liste de codes à tenir à jour, et un nouveau cycle est
 * pris en compte sans toucher au code.
 *
 * ## Ce que l'écran cherche vraiment
 *
 * Les finalistes **sans sujet attribué** : ce sont eux qui bloquent, et rien
 * d'autre ne les signale. On peut leur attribuer un thème d'ici.
 */

const store = useTravailStore();
const { finalistes, loading } = storeToRefs(store);
const { openCreate } = useTravailForm();

const recherche = ref('');
const situation = ref('');
const sansSujet = ref(false);

onMounted(() => store.fetchFinalistes());

const filtres = computed(() => {
  const terme = recherche.value.trim().toLowerCase();

  return finalistes.value.filter((etudiant) => {
    if (sansSujet.value && etudiant.travail_id) return false;
    if (situation.value && String(etudiant.situation ?? 'AUCUNE') !== situation.value) return false;
    if (!terme) return true;

    return [etudiant.nom, etudiant.prenom, etudiant.matricule, etudiant.theme, etudiant.classe_code]
      .filter(Boolean)
      .some((champ) => String(champ).toLowerCase().includes(terme));
  });
});
// 291 finalistes : la promotion entière était rendue d'un bloc.
const { page, itemsPerPage, startIndex, paginated } = usePagination(filtres, {
  perPage: 15,
  resetKey: () => [recherche.value, situation.value, sansSujet.value],
});

const { exportToExcel, exportToPdf } = useTableExport({
  rows: computed(() =>
    filtres.value.map((etudiant, index) => ({
      'N°': index + 1,
      Matricule: etudiant.matricule,
      Nom: etudiant.nom,
      Prénom: etudiant.prenom,
      Classe: etudiant.classe_code,
      Filière: etudiant.filiere,
      Cycle: `${etudiant.cycle} (${etudiant.niveau_code})`,
      Thème: etudiant.theme || 'Non attribué',
      Directeur: etudiant.directeur_nom
        ? `${etudiant.directeur_nom} ${etudiant.directeur_prenom ?? ''}`.trim()
        : '—',
      Situation: situationInfo(etudiant.situation).label,
      Avancement: `${etudiant.progression ?? 0} %`,
      Soutenance: etudiant.date_soutenance ? formatDate(etudiant.date_soutenance) : '—',
    }))
  ),
  title: 'Étudiants finalistes',
  fileBaseName: 'finalistes',
});
</script>

<template>
  <div>
    <div class="d-flex justify-content-between align-items-start mb-3 flex-wrap gap-2">
      <div>
        <h4 class="mb-1">Étudiants finalistes</h4>
        <p class="mb-0 text-muted small">
          Dernière année de cycle sur l'année académique active — licence 3, master 2, dernière
          année d'ingénieur.
        </p>
      </div>
      <ExportMenu :disabled="!filtres.length" @excel="exportToExcel" @pdf="exportToPdf" />
    </div>

    <div class="row g-3 mb-3">
      <div class="col-6 col-lg-3">
        <div class="card border-0 shadow-sm p-3 border-start border-primary border-3">
          <span class="text-muted small text-uppercase d-block mb-1">Finalistes</span>
          <span class="fw-bold font-monospace fs-5">{{ finalistes.length }}</span>
        </div>
      </div>
      <div class="col-6 col-lg-3">
        <div class="card border-0 shadow-sm p-3 border-start border-warning border-3">
          <span class="text-muted small text-uppercase d-block mb-1">Sans sujet</span>
          <span class="fw-bold font-monospace fs-5">
            {{ store.finalistesSansTravail.length }}
          </span>
        </div>
      </div>
      <div class="col-6 col-lg-3">
        <div class="card border-0 shadow-sm p-3 border-start border-info border-3">
          <span class="text-muted small text-uppercase d-block mb-1">En stage</span>
          <span class="fw-bold font-monospace fs-5">{{ store.parSituation.STAGE }}</span>
        </div>
      </div>
      <div class="col-6 col-lg-3">
        <div class="card border-0 shadow-sm p-3 border-start border-success border-3">
          <span class="text-muted small text-uppercase d-block mb-1">En recherche</span>
          <span class="fw-bold font-monospace fs-5">{{ store.parSituation.RECHERCHE }}</span>
        </div>
      </div>
    </div>

    <div class="row g-2 align-items-end mb-3">
      <div class="col-md-5">
        <label for="finaliste-recherche" class="form-label small fw-semibold text-secondary">
          Rechercher
        </label>
        <input
          id="finaliste-recherche"
          v-model="recherche"
          type="search"
          class="form-control form-control-sm"
          placeholder="Nom, matricule, classe ou thème"
        />
      </div>
      <div class="col-md-4">
        <label for="finaliste-situation" class="form-label small fw-semibold text-secondary">
          Situation
        </label>
        <select id="finaliste-situation" v-model="situation" class="form-select form-select-sm">
          <option value="">Toutes</option>
          <option v-for="item in SITUATION_LIST" :key="item.code" :value="item.code">
            {{ item.label }}
          </option>
        </select>
      </div>
      <div class="col-md-3">
        <div class="form-check">
          <input
            id="finaliste-sans-sujet"
            v-model="sansSujet"
            class="form-check-input"
            type="checkbox"
          />
          <label class="form-check-label small" for="finaliste-sans-sujet">
            Sans sujet attribué
          </label>
        </div>
      </div>
    </div>

    <LoadingSpinner v-if="loading && !finalistes.length" />

    <EmptyState
      v-else-if="!finalistes.length"
      title="Aucun finaliste sur l'année active"
      description="Aucune classe de dernière année de cycle ne compte d'inscrit sur l'année académique active."
    />

    <EmptyState
      v-else-if="!filtres.length"
      title="Aucun étudiant ne correspond"
      description="Élargissez la recherche ou retirez un filtre."
      :size="80"
    />

    <div v-else class="table-responsive card border-0 shadow-sm">
      <table class="table table-hover align-middle mb-0">
        <thead class="table-light">
          <tr>
            <th class="ps-3" style="width: 60px">#</th>
            <th>Étudiant</th>
            <th>Classe & cycle</th>
            <th>Sujet</th>
            <th>Situation</th>
            <th style="width: 150px">Avancement</th>
            <th class="text-end pe-3" style="width: 140px">
              <span class="visually-hidden">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(etudiant, index) in paginated" :key="etudiant.etudiant_id">
            <td class="ps-3 text-muted small">{{ startIndex + index + 1 }}</td>
            <td>
              <span class="fw-semibold text-dark d-block">
                {{ etudiant.nom }} {{ etudiant.prenom }}
              </span>
              <span class="text-muted small font-monospace">{{ etudiant.matricule }}</span>
            </td>
            <td>
              <span class="d-block">{{ etudiant.classe_code }}</span>
              <span class="text-muted small">
                {{ etudiant.cycle }} — {{ etudiant.niveau_code }}
              </span>
            </td>
            <td>
              <span v-if="etudiant.theme" class="d-block small">{{ etudiant.theme }}</span>
              <span v-else class="badge bg-warning-subtle text-warning">Non attribué</span>
              <span
                v-if="etudiant.statut_travail"
                class="badge mt-1"
                :class="`bg-${statutTravailInfo(etudiant.statut_travail).variant}-subtle text-${statutTravailInfo(etudiant.statut_travail).variant}`"
              >
                {{ statutTravailInfo(etudiant.statut_travail).label }}
              </span>
            </td>
            <td>
              <span
                class="badge"
                :class="`bg-${situationInfo(etudiant.situation).variant}-subtle text-${situationInfo(etudiant.situation).variant}`"
              >
                {{ situationInfo(etudiant.situation).label }}
              </span>
              <span v-if="etudiant.lieu_travail" class="d-block text-muted" style="font-size: 11px">
                {{ etudiant.lieu_travail }}
              </span>
            </td>
            <td>
              <div class="d-flex align-items-center gap-2">
                <div class="progress flex-grow-1" style="height: 5px">
                  <div
                    class="progress-bar bg-primary"
                    :style="{ width: `${etudiant.progression ?? 0}%` }"
                  ></div>
                </div>
                <span class="small font-monospace">{{ etudiant.progression ?? 0 }} %</span>
              </div>
              <span v-if="etudiant.date_soutenance" class="text-muted" style="font-size: 11px">
                soutenance : {{ formatDate(etudiant.date_soutenance) }}
              </span>
            </td>
            <td class="text-end pe-3">
              <button
                v-if="!etudiant.travail_id"
                class="btn btn-sm btn-outline-primary"
                type="button"
                @click="openCreate(etudiant)"
              >
                Attribuer un thème
              </button>
              <span v-else class="text-muted small">—</span>
            </td>
          </tr>
        </tbody>
      </table>

      <div class="card-footer bg-white border-top py-3 px-3">
        <Pagination
          v-model="page"
          v-model:items-per-page="itemsPerPage"
          :total-items="filtres.length"
        />
      </div>
    </div>
  </div>
</template>
