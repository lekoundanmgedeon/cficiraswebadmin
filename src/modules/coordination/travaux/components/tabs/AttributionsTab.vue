<script setup>
import { computed, onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import ItemActions from '@/shared/components/ItemActions.vue';
import ExportMenu from '@/shared/components/ExportMenu.vue';
import EmptyState from '@/shared/components/EmptyState.vue';
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue';
import { useTableExport } from '@/shared/composables/useTableExport';
import { formatDate } from '@/shared/utils/date';
import { useTravailStore } from '../../store';
import { useTravailForm } from '../../composables/useTravailForm';
import {
  STATUT_TRAVAIL_LIST,
  situationInfo,
  statutTravailInfo,
  TYPES_TRAVAIL,
  typeTravailLabel,
} from '../../../constants';

/**
 * Attribution des thèmes : qui travaille sur quoi, sous quelle direction, et
 * pour quelle échéance.
 *
 * Deux alertes sont dérivées des données, jamais écrites d'avance : les travaux
 * **en retard** (échéance passée sans soumission — calculé côté serveur, il
 * change tout seul avec le calendrier) et ceux **sans directeur**, que personne
 * n'encadre.
 */

const store = useTravailStore();
const { items: travaux, loading } = storeToRefs(store);
const { openCreate, openEdit } = useTravailForm();

const recherche = ref('');
const statut = ref('');
const type = ref('');

onMounted(() => Promise.all([store.fetchAll(), store.fetchFinalistes()]));

const filtres = computed(() => {
  const terme = recherche.value.trim().toLowerCase();

  return travaux.value.filter((travail) => {
    if (statut.value && travail.statut !== statut.value) return false;
    if (type.value && travail.type_travail !== type.value) return false;
    if (!terme) return true;

    return [travail.theme, travail.etudiant_nom, travail.etudiant_prenom, travail.matricule]
      .filter(Boolean)
      .some((champ) => String(champ).toLowerCase().includes(terme));
  });
});

const { exportToExcel, exportToPdf } = useTableExport({
  rows: computed(() =>
    filtres.value.map((travail, index) => ({
      'N°': index + 1,
      Matricule: travail.matricule,
      Étudiant: `${travail.etudiant_nom} ${travail.etudiant_prenom}`,
      Thème: travail.theme,
      Nature: typeTravailLabel(travail.type_travail),
      Directeur: travail.directeur_nom
        ? `${travail.directeur_nom} ${travail.directeur_prenom ?? ''}`.trim()
        : 'Non assigné',
      Attribution: formatDate(travail.date_attribution),
      'Durée (sem.)': travail.duree_semaines,
      'Soumission prévue': formatDate(travail.date_soumission_prevue),
      Statut: statutTravailInfo(travail.statut).label,
    }))
  ),
  title: 'Attribution des thèmes de mémoire',
  fileBaseName: 'themes_memoires',
});

const actions = [
  { key: 'edit', label: 'Modifier', icon: 'mdi-pencil-outline' },
  {
    key: 'delete',
    label: 'Retirer l’attribution',
    icon: 'mdi-delete-outline',
    variant: 'danger',
    divider: true,
    confirm: {
      title: 'Retirer l’attribution',
      message:
        'Le thème, son encadrement et son suivi seront supprimés. La soutenance éventuelle, elle, est conservée.',
      confirmLabel: 'Retirer',
      variant: 'danger',
    },
  },
];

/** @param {{key: string, item: any}} event */
function onAction({ key, item }) {
  if (key === 'edit') openEdit(item);
  if (key === 'delete') store.remove(item.id);
}
</script>

<template>
  <div>
    <div class="d-flex justify-content-between align-items-start mb-3 flex-wrap gap-2">
      <div>
        <h4 class="mb-1">Attribution des thèmes</h4>
        <p class="mb-0 text-muted small">
          Sujet, directeur de travaux, durée et date de soumission.
        </p>
      </div>
      <div class="d-flex gap-2">
        <ExportMenu :disabled="!filtres.length" @excel="exportToExcel" @pdf="exportToPdf" />
        <button class="btn btn-sm btn-primary" type="button" @click="openCreate()">
          + Attribuer un thème
        </button>
      </div>
    </div>

    <!-- Ce qui demande une décision -->
    <div class="row g-3 mb-3">
      <div class="col-6 col-lg-3">
        <div class="card border-0 shadow-sm p-3 border-start border-primary border-3">
          <span class="text-muted small text-uppercase d-block mb-1">Thèmes attribués</span>
          <span class="fw-bold font-monospace fs-5">{{ travaux.length }}</span>
        </div>
      </div>
      <div class="col-6 col-lg-3">
        <div class="card border-0 shadow-sm p-3 border-start border-warning border-3">
          <span class="text-muted small text-uppercase d-block mb-1">Sans directeur</span>
          <span class="fw-bold font-monospace fs-5">{{ store.sansDirecteur.length }}</span>
        </div>
      </div>
      <div class="col-6 col-lg-3">
        <div class="card border-0 shadow-sm p-3 border-start border-danger border-3">
          <span class="text-muted small text-uppercase d-block mb-1">En retard</span>
          <span class="fw-bold font-monospace fs-5">{{ store.enRetard.length }}</span>
        </div>
      </div>
      <div class="col-6 col-lg-3">
        <div class="card border-0 shadow-sm p-3 border-start border-secondary border-3">
          <span class="text-muted small text-uppercase d-block mb-1">Finalistes sans sujet</span>
          <span class="fw-bold font-monospace fs-5">
            {{ store.finalistesSansTravail.length }}
          </span>
        </div>
      </div>
    </div>

    <div class="row g-2 align-items-end mb-3">
      <div class="col-md-5">
        <label for="travaux-recherche" class="form-label small fw-semibold text-secondary">
          Rechercher
        </label>
        <input
          id="travaux-recherche"
          v-model="recherche"
          type="search"
          class="form-control form-control-sm"
          placeholder="Thème, étudiant ou matricule"
        />
      </div>
      <div class="col-md-4">
        <label for="travaux-statut" class="form-label small fw-semibold text-secondary">
          Statut
        </label>
        <select id="travaux-statut" v-model="statut" class="form-select form-select-sm">
          <option value="">Tous</option>
          <option v-for="item in STATUT_TRAVAIL_LIST" :key="item.code" :value="item.code">
            {{ item.label }}
          </option>
        </select>
      </div>
      <div class="col-md-3">
        <label for="travaux-type" class="form-label small fw-semibold text-secondary">Nature</label>
        <select id="travaux-type" v-model="type" class="form-select form-select-sm">
          <option value="">Toutes</option>
          <option v-for="item in TYPES_TRAVAIL" :key="item.code" :value="item.code">
            {{ item.label }}
          </option>
        </select>
      </div>
    </div>

    <LoadingSpinner v-if="loading && !travaux.length" />

    <EmptyState
      v-else-if="!travaux.length"
      title="Aucun thème attribué"
      description="Attribuez un premier sujet depuis le bouton ci-dessus : les finalistes sans sujet sont listés dans « Statut étudiant »."
    />

    <EmptyState
      v-else-if="!filtres.length"
      title="Aucun travail ne correspond"
      description="Élargissez la recherche ou retirez un filtre."
      :size="80"
    />

    <div v-else class="table-responsive card border-0 shadow-sm">
      <table class="table table-hover align-middle mb-0">
        <thead class="table-light">
          <tr>
            <th class="ps-3">Étudiant</th>
            <th>Thème</th>
            <th>Directeur</th>
            <th>Échéance</th>
            <th>Situation</th>
            <th>Statut</th>
            <th class="text-end pe-3"><span class="visually-hidden">Actions</span></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="travail in filtres" :key="travail.id">
            <td class="ps-3">
              <span class="fw-semibold text-dark d-block">
                {{ travail.etudiant_nom }} {{ travail.etudiant_prenom }}
              </span>
              <span class="text-muted small font-monospace">{{ travail.matricule }}</span>
            </td>
            <td>
              <span class="fw-semibold text-dark d-block">{{ travail.theme }}</span>
              <span class="text-muted small">{{ typeTravailLabel(travail.type_travail) }}</span>
            </td>
            <td>
              <span v-if="travail.directeur_nom">
                {{ travail.directeur_nom }} {{ travail.directeur_prenom }}
              </span>
              <span v-else class="badge bg-warning-subtle text-warning">Non assigné</span>
            </td>
            <td>
              <span class="d-block small">{{ formatDate(travail.date_soumission_prevue) }}</span>
              <span
                v-if="travail.en_retard"
                class="badge bg-danger-subtle text-danger"
                :title="`Échéance dépassée de ${Math.abs(travail.jours_restants)} jour(s)`"
              >
                en retard
              </span>
              <span
                v-else-if="travail.date_soumission_effective"
                class="badge bg-success-subtle text-success"
              >
                soumis le {{ formatDate(travail.date_soumission_effective) }}
              </span>
              <span v-else class="text-muted small"> {{ travail.jours_restants }} j restants </span>
            </td>
            <td>
              <span
                class="badge"
                :class="`bg-${situationInfo(travail.situation).variant}-subtle text-${situationInfo(travail.situation).variant}`"
              >
                {{ situationInfo(travail.situation).label }}
              </span>
            </td>
            <td>
              <span
                class="badge"
                :class="`bg-${statutTravailInfo(travail.statut).variant}-subtle text-${statutTravailInfo(travail.statut).variant}`"
              >
                {{ statutTravailInfo(travail.statut).label }}
              </span>
            </td>
            <td class="text-end pe-3">
              <ItemActions
                :item="travail"
                :label="travail.theme"
                :actions="actions"
                @action="onAction"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
