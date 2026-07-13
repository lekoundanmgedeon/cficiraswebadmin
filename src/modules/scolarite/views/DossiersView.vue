<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import PageHeader from '@/shared/components/PageHeader.vue';
import ExportMenu from '@/shared/components/ExportMenu.vue';
import EmptyState from '@/shared/components/EmptyState.vue';
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue';
import Pagination from '@/components/shared/Pagination.vue';
import { useTableExport } from '@/shared/composables/useTableExport';
import { useFiliereStore } from '@/modules/structure-academique/filiere/store';
import { useEtudiantStore } from '@/modules/etudiants/store';
import { DOSSIER_STATUT_LIST, dossierInfo } from '../constants';

/**
 * Liste des dossiers scolaires.
 *
 * L'ancien `views/parcours/DossierView.vue` affichait **trois étudiants codés en
 * dur** (« DIOP Moussa », « KANE Awa », « NFAH Jean »), et ses quatre filtres —
 * année, filière, niveau, classe — étaient alimentés par des tableaux littéraux
 * (`['2023-2024', '2024-2025', ...]`). Aucun appel API, aucun store.
 *
 * `GET /etudiants` porte déjà tout ce qu'il faut : chaque étudiant y arrive avec
 * son `dossier_id` et son `statut_dossier` (la jointure sur `dossiers` est même
 * *inner* côté serveur — tout étudiant a un dossier). Un écran de dossiers est
 * donc une **lecture de l'annuaire sous l'angle administratif**, sans endpoint
 * supplémentaire.
 *
 * Les filtres « niveau » et « classe » ont disparu : ni l'un ni l'autre ne
 * figure dans la réponse — un étudiant appartient à une *filière*, sa classe
 * vient de son *inscription*.
 */

const etudiantStore = useEtudiantStore();
const filiereStore = useFiliereStore();

const { items: etudiants, loading } = storeToRefs(etudiantStore);
const { items: filieres } = storeToRefs(filiereStore);

const searchQuery = ref('');
const filterFiliere = ref('');
const filterStatut = ref('');

const currentPage = ref(1);
const itemsPerPage = 10;

onMounted(() => {
  etudiantStore.fetchAll();
  filiereStore.fetchAll();
});

watch([searchQuery, filterFiliere, filterStatut], () => {
  currentPage.value = 1;
});

const filtered = computed(() => {
  const search = searchQuery.value.toLowerCase().trim();

  return etudiants.value.filter((etudiant) => {
    const matchesSearch =
      !search ||
      [etudiant.nom, etudiant.prenom, etudiant.matricule]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(search));

    const matchesFiliere =
      !filterFiliere.value || String(etudiant.filiere_id) === String(filterFiliere.value);

    const matchesStatut =
      !filterStatut.value || dossierInfo(etudiant.statut_dossier).code === filterStatut.value;

    return matchesSearch && matchesFiliere && matchesStatut;
  });
});

const startIndex = computed(() => (currentPage.value - 1) * itemsPerPage);

const paginated = computed(() =>
  filtered.value.slice(startIndex.value, startIndex.value + itemsPerPage)
);

/** Répartition par statut, sur l'ensemble des dossiers — pas sur la page courante. */
const repartition = computed(() =>
  DOSSIER_STATUT_LIST.map((statut) => ({
    ...statut,
    value: etudiants.value.filter(
      (etudiant) => dossierInfo(etudiant.statut_dossier).code === statut.code
    ).length,
  })).filter((statut) => statut.value > 0)
);

const exportRows = computed(() =>
  filtered.value.map((etudiant, index) => ({
    'N°': index + 1,
    Matricule: etudiant.matricule,
    Nom: etudiant.nom,
    Prénom: etudiant.prenom,
    Filière: etudiant.filiere_nom ?? '—',
    'E-mail': etudiant.email ?? '—',
    'Statut du dossier': dossierInfo(etudiant.statut_dossier).label,
  }))
);

const { exportToExcel, exportToPdf } = useTableExport({
  rows: exportRows,
  title: 'Dossiers scolaires',
  fileBaseName: 'dossiers_scolaires',
  filters: () => [
    { label: 'Dossiers', value: filtered.value.length },
    { label: "Date d'édition", value: new Date().toLocaleDateString('fr-FR') },
  ],
});

/** @param {any} etudiant @returns {string} */
function initials(etudiant) {
  return `${etudiant.nom?.[0] ?? ''}${etudiant.prenom?.[0] ?? ''}`.toUpperCase();
}

function resetFilters() {
  searchQuery.value = '';
  filterFiliere.value = '';
  filterStatut.value = '';
}
</script>

<template>
  <div>
    <PageHeader
      title="Dossiers scolaires"
      subtitle="Suivi administratif des dossiers et de leurs pièces justificatives"
      :breadcrumb="['portail', 'scolarité', 'dossiers']"
    >
      <template #actions>
        <ExportMenu :disabled="filtered.length === 0" @excel="exportToExcel" @pdf="exportToPdf" />
      </template>
    </PageHeader>

    <div v-if="repartition.length > 0" class="row g-3 mb-4">
      <div v-for="statut in repartition" :key="statut.code" class="col-md-3">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-body">
            <span class="text-muted small fw-semibold text-uppercase d-block mb-1">
              {{ statut.label }}
            </span>
            <h3 class="fw-bold mb-0 font-monospace" :class="`text-${statut.variant}`">
              {{ statut.value }}
            </h3>
          </div>
        </div>
      </div>
    </div>

    <div class="card border-0 shadow-sm bg-light mb-4">
      <div class="card-body p-3">
        <div class="row g-3">
          <div class="col-md-5">
            <div class="input-group bg-white rounded shadow-sm">
              <span class="input-group-text bg-white border-0">
                <i class="mdi mdi-magnify text-primary"></i>
              </span>
              <input
                v-model="searchQuery"
                type="text"
                class="form-control border-0"
                placeholder="Rechercher par nom, prénom, matricule..."
              />
            </div>
          </div>

          <div class="col-md-3">
            <select v-model="filterFiliere" class="form-select border-0 shadow-sm">
              <option value="">Toutes les filières</option>
              <option v-for="filiere in filieres" :key="filiere.id" :value="filiere.id">
                {{ filiere.designation }}
              </option>
            </select>
          </div>

          <div class="col-md-2">
            <select v-model="filterStatut" class="form-select border-0 shadow-sm">
              <option value="">Tous les statuts</option>
              <option v-for="statut in DOSSIER_STATUT_LIST" :key="statut.code" :value="statut.code">
                {{ statut.label }}
              </option>
            </select>
          </div>

          <div class="col-md-2">
            <button class="btn btn-white w-100 shadow-sm border-0" @click="resetFilters">
              <i class="mdi mdi-filter-variant me-1"></i> Réinitialiser
            </button>
          </div>
        </div>
      </div>
    </div>

    <LoadingSpinner v-if="loading" />

    <EmptyState
      v-else-if="filtered.length === 0"
      title="Aucun dossier"
      description="Aucun dossier ne correspond à ces critères."
    />

    <div v-else class="card border-0 shadow-sm overflow-hidden">
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead class="bg-light">
              <tr>
                <th class="ps-4 py-3">#</th>
                <th>Étudiant</th>
                <th>Matricule</th>
                <th>Filière</th>
                <th class="text-center">Statut du dossier</th>
                <th class="text-end pe-4">Actions</th>
              </tr>
            </thead>

            <tbody>
              <tr v-for="(etudiant, index) in paginated" :key="etudiant.id">
                <td class="ps-4 text-muted small">{{ startIndex + index + 1 }}</td>

                <td>
                  <div class="d-flex align-items-center">
                    <div class="avatar-circle me-3 bg-soft-primary text-primary">
                      {{ initials(etudiant) }}
                    </div>
                    <div>
                      <div class="fw-bold text-dark">{{ etudiant.nom }} {{ etudiant.prenom }}</div>
                      <small class="text-muted">{{ etudiant.email ?? '—' }}</small>
                    </div>
                  </div>
                </td>

                <td>
                  <span class="badge bg-light text-primary border fw-bold">
                    {{ etudiant.matricule }}
                  </span>
                </td>

                <td class="small">{{ etudiant.filiere_nom ?? '—' }}</td>

                <td class="text-center">
                  <span
                    class="badge rounded-pill px-3 py-2"
                    :class="`bg-${dossierInfo(etudiant.statut_dossier).variant}-subtle text-${dossierInfo(etudiant.statut_dossier).variant}`"
                  >
                    {{ dossierInfo(etudiant.statut_dossier).label }}
                  </span>
                </td>

                <td class="text-end pe-4">
                  <RouterLink
                    :to="{ name: 'DossierScolaire', params: { id: etudiant.id } }"
                    class="btn btn-sm btn-outline-primary"
                  >
                    Ouvrir le dossier
                  </RouterLink>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="card-footer bg-white border-0 py-3">
        <Pagination
          v-model="currentPage"
          :items-per-page="itemsPerPage"
          :total-items="filtered.length"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.avatar-circle {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.85rem;
}

.bg-soft-primary {
  background-color: rgba(75, 73, 172, 0.1);
}

.table thead th {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: #6c757d;
  border: none;
}

.btn-white {
  background: #fff;
  border: 1px solid #edf2f9;
}
</style>
