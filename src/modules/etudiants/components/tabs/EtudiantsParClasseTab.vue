<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import ExportMenu from '@/shared/components/ExportMenu.vue';
import EmptyState from '@/shared/components/EmptyState.vue';
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue';
import Pagination from '@/components/shared/Pagination.vue';
import { useTableExport } from '@/shared/composables/useTableExport';
import { useEtudiantStore } from '../../store';
import { useEtudiantFilters } from '../../composables/useEtudiantFilters';
import { sexeLabel } from '../../constants';

/**
 * Étudiants filtrés par année / filière / classe.
 *
 * L'onglet appelait `etudiantStore.fetchEtudiantsByClasseFiliereAnnee(...)` et
 * lisait `etudiantStore.filteredEtudiants` : **aucun des deux n'existait** dans
 * le store. Le premier changement de filtre levait donc un `TypeError` et le
 * tableau restait désespérément vide. La recherche passe maintenant par
 * `fetchAll({ params })`.
 *
 * Le tableau portait par ailleurs `v-else-if` et `v-for` sur la même ligne, ce
 * qui rendait le `v-else` « aucun résultat » inatteignable.
 */

const etudiantStore = useEtudiantStore();
const { items: etudiants, loading } = storeToRefs(etudiantStore);

const {
  anneeId,
  filiereId,
  classeId,
  annees,
  filieres,
  classes,
  params,
  hasFilter,
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
  etudiantStore.fetchAll({ params: params.value });
}

// Un seul point de rechargement : toute modification d'un filtre relance la
// requête. L'ancienne version câblait trois `@change` distincts, dont l'un
// oubliait de remettre la pagination à zéro.
watch(params, load);

watch(searchQuery, () => {
  currentPage.value = 1;
});

const filteredEtudiants = computed(() => {
  const search = searchQuery.value.toLowerCase().trim();
  if (!search) return etudiants.value;

  return etudiants.value.filter((etudiant) =>
    [etudiant.nom, etudiant.prenom, etudiant.matricule]
      .filter(Boolean)
      .some((field) => String(field).toLowerCase().includes(search))
  );
});

const startIndex = computed(() => (currentPage.value - 1) * itemsPerPage);

const paginatedEtudiants = computed(() =>
  filteredEtudiants.value.slice(startIndex.value, startIndex.value + itemsPerPage)
);

const statsHommes = computed(
  () => filteredEtudiants.value.filter((etudiant) => etudiant.sexe === 'M').length
);

const statsFemmes = computed(
  () => filteredEtudiants.value.filter((etudiant) => etudiant.sexe === 'F').length
);

const exportRows = computed(() =>
  filteredEtudiants.value.map((etudiant, index) => ({
    'N°': index + 1,
    Matricule: etudiant.matricule,
    Nom: etudiant.nom,
    Prénom: etudiant.prenom,
    Sexe: sexeLabel(etudiant.sexe),
    Année: etudiant.annee_academique ?? labels.value.annee,
    Filière: etudiant.filiere ?? labels.value.filiere,
    Classe: etudiant.classe ?? labels.value.classe,
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
    { label: 'Total étudiants', value: filteredEtudiants.value.length },
    { label: "Date d'édition", value: new Date().toLocaleDateString('fr-FR') },
  ],
});
</script>

<template>
  <div class="row">
    <div class="col-12 mb-3 d-flex justify-content-between align-items-center">
      <div>
        <h4>Étudiants par classe</h4>
        <p class="text-muted mb-0">
          Filtrez les étudiants par année académique, filière et classe.
        </p>
      </div>
      <ExportMenu
        :disabled="filteredEtudiants.length === 0"
        @excel="exportToExcel"
        @pdf="exportToPdf"
      />
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

    <div v-if="filteredEtudiants.length > 0" class="col-12 mb-3">
      <div class="card bg-light border-0">
        <div class="card-body py-2">
          <div class="row text-center">
            <div class="col-md-4"><strong>Total :</strong> {{ filteredEtudiants.length }}</div>
            <div class="col-md-4"><strong>Hommes :</strong> {{ statsHommes }}</div>
            <div class="col-md-4"><strong>Femmes :</strong> {{ statsFemmes }}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="col-12">
      <LoadingSpinner v-if="loading" />

      <EmptyState
        v-else-if="filteredEtudiants.length === 0"
        title="Aucun étudiant trouvé"
        :description="
          hasFilter
            ? 'Aucun étudiant ne correspond à ces critères.'
            : 'Aucun étudiant enregistré pour le moment.'
        "
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
                <th>Sexe</th>
                <th>Année académique</th>
                <th>Filière</th>
                <th>Classe</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(etudiant, index) in paginatedEtudiants" :key="etudiant.id">
                <td>{{ startIndex + index + 1 }}</td>
                <td class="fw-bold">{{ etudiant.matricule }}</td>
                <td>{{ etudiant.nom }}</td>
                <td>{{ etudiant.prenom }}</td>
                <td>
                  <span
                    class="badge"
                    :class="etudiant.sexe === 'M' ? 'bg-info' : 'bg-warning text-dark'"
                  >
                    {{ sexeLabel(etudiant.sexe) }}
                  </span>
                </td>
                <td>{{ etudiant.annee_academique ?? '—' }}</td>
                <td>{{ etudiant.filiere ?? '—' }}</td>
                <td>{{ etudiant.classe ?? '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <Pagination
          v-model="currentPage"
          :items-per-page="itemsPerPage"
          :total-items="filteredEtudiants.length"
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
