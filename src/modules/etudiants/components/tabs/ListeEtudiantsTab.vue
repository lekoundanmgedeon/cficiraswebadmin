<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import ExportMenu from '@/shared/components/ExportMenu.vue';
import EmptyState from '@/shared/components/EmptyState.vue';
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue';
import Pagination from '@/components/shared/Pagination.vue';
import { useTableExport } from '@/shared/composables/useTableExport';
import { statutInfo } from '@/modules/inscriptions/constants';
import { useEtudiantStore } from '../../store';
import { useEtudiantFilters } from '../../composables/useEtudiantFilters';

/**
 * Répertoire des étudiants.
 *
 * L'ancienne version affichait **vingt étudiants codés en dur** (« Diop Moussa »,
 * « Fall Aminata »…), avec un `@edit` câblé sur un `console.log` et une
 * suppression qui retirait la ligne du tableau local sans rien envoyer au serveur.
 *
 * L'annuaire vient de `GET /inscriptions` : le backend n'expose aucun
 * `GET /etudiants`. Il ne propose donc **ni « Modifier » ni « Supprimer »** —
 * `PUT` et `DELETE /etudiants/:id` n'existent pas davantage. Mieux vaut pas de
 * bouton qu'un bouton qui ment.
 *
 * Ces lignes ne portent pas non plus de `sexe` ni de `telephone` : la colonne
 * « Genre » et le filtre associé ont disparu, faute de donnée pour les alimenter.
 */

const etudiantStore = useEtudiantStore();
const { items: etudiants, listLoading } = storeToRefs(etudiantStore);
const { filieres, loadReferences } = useEtudiantFilters();

const searchQuery = ref('');
const filterFiliere = ref('');

const currentPage = ref(1);
const itemsPerPage = 10;

onMounted(() => {
  loadReferences();
  etudiantStore.fetchAll();
});

watch([searchQuery, filterFiliere], () => {
  currentPage.value = 1;
});

const filteredEtudiants = computed(() => {
  const search = searchQuery.value.toLowerCase().trim();

  return etudiants.value.filter((etudiant) => {
    const matchesSearch =
      !search ||
      [etudiant.nom, etudiant.prenom, etudiant.matricule]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(search));

    const matchesFiliere = !filterFiliere.value || etudiant.filiere === filterFiliere.value;

    return matchesSearch && matchesFiliere;
  });
});

const startIndex = computed(() => (currentPage.value - 1) * itemsPerPage);

const paginatedEtudiants = computed(() =>
  filteredEtudiants.value.slice(startIndex.value, startIndex.value + itemsPerPage)
);

const exportRows = computed(() =>
  filteredEtudiants.value.map((etudiant, index) => ({
    Rang: index + 1,
    Matricule: etudiant.matricule,
    Nom: etudiant.nom,
    Prénom: etudiant.prenom,
    'E-mail': etudiant.email ?? '—',
    Filière: etudiant.filiere ?? '—',
    Classe: etudiant.classe ?? '—',
    Année: etudiant.annee_academique ?? '—',
    Statut: statutInfo(etudiant.statut).label,
  }))
);

const { exportToExcel, exportToPdf } = useTableExport({
  rows: exportRows,
  title: 'Répertoire des étudiants',
  fileBaseName: 'etudiants',
});

/** @param {any} etudiant @returns {string} */
function initials(etudiant) {
  return `${etudiant.nom?.[0] ?? ''}${etudiant.prenom?.[0] ?? ''}`.toUpperCase();
}

function resetFilters() {
  searchQuery.value = '';
  filterFiliere.value = '';
}
</script>

<template>
  <div class="row">
    <div class="col-12 mb-4 d-flex justify-content-between align-items-center flex-wrap gap-2">
      <div>
        <h4 class="fw-bold mb-1">Répertoire des étudiants</h4>
        <p class="text-muted small mb-0">
          <i class="mdi mdi-account-group-outline me-1"></i>
          <b>{{ filteredEtudiants.length }}</b> étudiant(s) affiché(s) sur
          {{ etudiants.length }} connu(s).
        </p>
      </div>
      <ExportMenu
        :disabled="filteredEtudiants.length === 0"
        @excel="exportToExcel"
        @pdf="exportToPdf"
      />
    </div>

    <div class="col-12 mb-4">
      <div class="card border-0 shadow-sm bg-light">
        <div class="card-body p-3">
          <div class="row g-3">
            <div class="col-md-6">
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

            <div class="col-md-4">
              <select v-model="filterFiliere" class="form-select border-0 shadow-sm">
                <option value="">Toutes les filières</option>
                <option v-for="filiere in filieres" :key="filiere.id" :value="filiere.designation">
                  {{ filiere.designation }}
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
    </div>

    <div class="col-12">
      <LoadingSpinner v-if="listLoading" />

      <EmptyState
        v-else-if="etudiants.length === 0"
        title="Aucun étudiant"
        description="L'annuaire se remplit à mesure des inscriptions. Importez une liste depuis l'onglet Import, ou depuis le module Inscriptions."
      />

      <EmptyState
        v-else-if="filteredEtudiants.length === 0"
        title="Aucun étudiant trouvé"
        description="Aucun étudiant ne correspond à ces critères."
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
                  <th>Parcours</th>
                  <th>E-mail</th>
                  <th class="text-center">Inscription</th>
                </tr>
              </thead>

              <tbody>
                <tr v-for="(etudiant, index) in paginatedEtudiants" :key="etudiant.id">
                  <td class="ps-4 text-muted small">{{ startIndex + index + 1 }}</td>

                  <td>
                    <div class="d-flex align-items-center">
                      <div class="avatar-circle me-3 bg-soft-primary text-primary">
                        {{ initials(etudiant) }}
                      </div>
                      <div>
                        <RouterLink
                          :to="{ name: 'EtudiantDetails', params: { id: etudiant.id } }"
                          class="fw-bold text-dark text-decoration-none"
                        >
                          {{ etudiant.nom }} {{ etudiant.prenom }}
                        </RouterLink>
                        <small class="text-muted d-block">Voir la fiche</small>
                      </div>
                    </div>
                  </td>

                  <td>
                    <span class="badge bg-light text-primary border fw-bold">
                      {{ etudiant.matricule }}
                    </span>
                  </td>

                  <td>
                    <div class="fw-semibold">{{ etudiant.classe ?? '—' }}</div>
                    <small class="text-muted">
                      {{ etudiant.filiere ?? '—' }} · {{ etudiant.annee_academique ?? '—' }}
                    </small>
                  </td>

                  <td class="small">{{ etudiant.email ?? '—' }}</td>

                  <td class="text-center">
                    <span
                      class="badge rounded-pill px-3 py-2"
                      :class="`bg-${statutInfo(etudiant.statut).variant}-subtle text-${statutInfo(etudiant.statut).variant}`"
                    >
                      {{ statutInfo(etudiant.statut).label }}
                    </span>
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
            :total-items="filteredEtudiants.length"
          />
        </div>
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
