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
 * Étudiants filtrés par année / filière / classe.
 *
 * L'onglet appelait `etudiantStore.fetchEtudiantsByClasseFiliereAnnee(...)` et
 * lisait `etudiantStore.filteredEtudiants` : **aucun des deux n'existait** dans
 * le store. Le premier changement de filtre levait un `TypeError` et le tableau
 * restait vide en toutes circonstances. Le tableau portait de surcroît
 * `v-else-if` et `v-for` sur la même ligne, ce qui rendait le « aucun résultat »
 * inatteignable.
 *
 * L'année et la classe sont filtrées **par le serveur** (`annee_academique_id`,
 * `classe_id`), la filière **par le client** : `listerInscriptions` ne la lit pas.
 */

const etudiantStore = useEtudiantStore();
const { items: etudiants, listLoading } = storeToRefs(etudiantStore);

const {
  anneeId,
  filiereId,
  classeId,
  annees,
  filieres,
  classes,
  serverParams,
  applyClientFilters,
  labels,
  loadReferences,
} = useEtudiantFilters();

const searchQuery = ref('');
const currentPage = ref(1);
const itemsPerPage = 10;

onMounted(async () => {
  await loadReferences();
  load();
});

function load() {
  currentPage.value = 1;
  etudiantStore.fetchAll({ params: serverParams.value });
}

// Un seul point de rechargement. L'ancienne version câblait trois `@change`
// distincts, dont l'un oubliait de remettre la pagination à zéro.
watch(serverParams, load);

watch([searchQuery, filiereId], () => {
  currentPage.value = 1;
});

const filtered = computed(() => {
  const search = searchQuery.value.toLowerCase().trim();
  const rows = applyClientFilters(etudiants.value);

  if (!search) return rows;

  return rows.filter((etudiant) =>
    [etudiant.nom, etudiant.prenom, etudiant.matricule]
      .filter(Boolean)
      .some((field) => String(field).toLowerCase().includes(search))
  );
});

const startIndex = computed(() => (currentPage.value - 1) * itemsPerPage);

const paginated = computed(() =>
  filtered.value.slice(startIndex.value, startIndex.value + itemsPerPage)
);

const exportRows = computed(() =>
  filtered.value.map((etudiant, index) => ({
    'N°': index + 1,
    Matricule: etudiant.matricule,
    Nom: etudiant.nom,
    Prénom: etudiant.prenom,
    'E-mail': etudiant.email ?? '—',
    Année: etudiant.annee_academique ?? '—',
    Filière: etudiant.filiere ?? '—',
    Classe: etudiant.classe ?? '—',
  }))
);

const { exportToExcel, exportToPdf } = useTableExport({
  rows: exportRows,
  title: 'Liste des étudiants par classe',
  fileBaseName: 'etudiants_par_classe',
  filters: () => [
    { label: 'Année académique', value: labels.value.annee },
    { label: 'Filière', value: labels.value.filiere },
    { label: 'Classe', value: labels.value.classe },
    { label: 'Total étudiants', value: filtered.value.length },
    { label: "Date d'édition", value: new Date().toLocaleDateString('fr-FR') },
  ],
});
</script>

<template>
  <div class="row">
    <div class="col-12 mb-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
      <div>
        <h4>Étudiants par classe</h4>
        <p class="text-muted mb-0">
          Filtrez les étudiants par année académique, filière et classe.
        </p>
      </div>
      <ExportMenu :disabled="filtered.length === 0" @excel="exportToExcel" @pdf="exportToPdf" />
    </div>

    <div class="col-12 mb-4">
      <div class="card border-0 shadow-sm">
        <div class="card-body bg-light rounded">
          <div class="row g-3">
            <div class="col-md-3">
              <select v-model="anneeId" class="form-select">
                <option value="">Toutes les années</option>
                <option v-for="annee in annees" :key="annee.id" :value="annee.id">
                  {{ annee.code }}
                </option>
              </select>
            </div>

            <div class="col-md-3">
              <select v-model="filiereId" class="form-select">
                <option value="">Toutes les filières</option>
                <option v-for="filiere in filieres" :key="filiere.id" :value="filiere.id">
                  {{ filiere.designation }}
                </option>
              </select>
            </div>

            <div class="col-md-3">
              <select v-model="classeId" class="form-select">
                <option value="">Toutes les classes</option>
                <option v-for="classe in classes" :key="classe.id" :value="classe.id">
                  {{ classe.code }}
                </option>
              </select>
            </div>

            <div class="col-md-3">
              <div class="input-group">
                <span class="input-group-text bg-primary text-white border-0">
                  <i class="mdi mdi-magnify"></i>
                </span>
                <input
                  v-model="searchQuery"
                  type="text"
                  class="form-control border-start-0"
                  placeholder="Rechercher (matricule, nom...)"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="filtered.length > 0" class="col-12 mb-3">
      <div class="card bg-light border-0">
        <div class="card-body py-2 text-center">
          <strong>{{ filtered.length }}</strong> étudiant(s) correspondant(s).
        </div>
      </div>
    </div>

    <div class="col-12">
      <LoadingSpinner v-if="listLoading" />

      <EmptyState
        v-else-if="filtered.length === 0"
        title="Aucun étudiant trouvé"
        description="Aucun étudiant ne correspond à ces critères."
      />

      <div v-else>
        <div class="table-responsive">
          <table class="table table-striped align-middle">
            <thead>
              <tr>
                <th>#</th>
                <th>Matricule</th>
                <th>Nom</th>
                <th>Prénom</th>
                <th>E-mail</th>
                <th>Année</th>
                <th>Filière</th>
                <th>Classe</th>
                <th class="text-center">Statut</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(etudiant, index) in paginated" :key="etudiant.id">
                <td>{{ startIndex + index + 1 }}</td>
                <td class="fw-bold">{{ etudiant.matricule }}</td>
                <td>{{ etudiant.nom }}</td>
                <td>{{ etudiant.prenom }}</td>
                <td class="small">{{ etudiant.email ?? '—' }}</td>
                <td>{{ etudiant.annee_academique ?? '—' }}</td>
                <td>{{ etudiant.filiere ?? '—' }}</td>
                <td>{{ etudiant.classe ?? '—' }}</td>
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
.table th {
  background-color: #f8f9fa;
  font-weight: 600;
  text-transform: uppercase;
  font-size: 0.85rem;
}
</style>
