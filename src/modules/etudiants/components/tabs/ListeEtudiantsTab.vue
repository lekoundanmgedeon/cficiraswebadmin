<script setup>
import { computed, onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import ItemActions from '@/shared/components/ItemActions.vue';
import ExportMenu from '@/shared/components/ExportMenu.vue';
import EmptyState from '@/shared/components/EmptyState.vue';
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue';
import Pagination from '@/components/shared/Pagination.vue';
import { useTableExport } from '@/shared/composables/useTableExport';
import { useEtudiantStore } from '../../store';
import { useEtudiantForm } from '../../composables/useEtudiantForm';
import { useEtudiantFilters } from '../../composables/useEtudiantFilters';
import { SEXES, sexeLabel } from '../../constants';

/**
 * Répertoire des étudiants.
 *
 * L'ancienne version affichait **vingt étudiants codés en dur** (« Diop
 * Moussa », « Fall Aminata »…) : aucun appel API, et un `@edit` câblé sur un
 * `console.log`. La suppression, elle, retirait la ligne du tableau local sans
 * jamais rien envoyer au serveur — elle réapparaissait au rechargement.
 */

const etudiantStore = useEtudiantStore();
const { items: etudiants, loading } = storeToRefs(etudiantStore);
const { openEdit } = useEtudiantForm();
const { filieres, loadReferences } = useEtudiantFilters();

const searchQuery = ref('');
const filterFiliere = ref('');
const filterSexe = ref('');

const currentPage = ref(1);
const itemsPerPage = 10;

onMounted(() => {
  loadReferences();
  etudiantStore.fetchAll();
});

const filteredEtudiants = computed(() => {
  const search = searchQuery.value.toLowerCase().trim();

  return etudiants.value.filter((etudiant) => {
    const matchesSearch =
      !search ||
      [etudiant.nom, etudiant.prenom, etudiant.matricule]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(search));

    const matchesFiliere =
      !filterFiliere.value || String(etudiant.filiere_id) === String(filterFiliere.value);
    const matchesSexe = !filterSexe.value || etudiant.sexe === filterSexe.value;

    return matchesSearch && matchesFiliere && matchesSexe;
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
    Sexe: sexeLabel(etudiant.sexe),
    'E-mail': etudiant.email ?? '—',
    Téléphone: etudiant.telephone ?? '—',
    Filière: etudiant.filiere ?? '—',
    Classe: etudiant.classe ?? '—',
  }))
);

const { exportToExcel, exportToPdf } = useTableExport({
  rows: exportRows,
  title: 'Répertoire des étudiants',
  fileBaseName: 'etudiants',
});

const actions = [
  { key: 'edit', label: 'Modifier', icon: 'mdi-pencil-outline' },
  {
    key: 'delete',
    label: 'Supprimer',
    icon: 'mdi-delete-outline',
    variant: 'danger',
    divider: true,
    confirm: { title: 'Confirmation de suppression' },
  },
];

/** @param {{key: string, item: any}} event */
function onAction({ key, item }) {
  if (key === 'edit') openEdit(item);
  if (key === 'delete') etudiantStore.remove(item.id);
}

/** @param {any} etudiant @returns {string} */
function initials(etudiant) {
  return `${etudiant.nom?.[0] ?? ''}${etudiant.prenom?.[0] ?? ''}`.toUpperCase();
}

function resetFilters() {
  searchQuery.value = '';
  filterFiliere.value = '';
  filterSexe.value = '';
  currentPage.value = 1;
}
</script>

<template>
  <div class="row">
    <div class="col-12 mb-4 d-flex justify-content-between align-items-center">
      <div>
        <h4 class="fw-bold mb-1">Répertoire des étudiants</h4>
        <p class="text-muted small mb-0">
          <i class="mdi mdi-account-group-outline me-1"></i>
          <b>{{ filteredEtudiants.length }}</b> étudiant(s) affiché(s) sur
          {{ etudiants.length }} enregistré(s).
        </p>
      </div>
      <ExportMenu @excel="exportToExcel" @pdf="exportToPdf" />
    </div>

    <div class="col-12 mb-4">
      <div class="card border-0 shadow-sm bg-light">
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
                  @input="currentPage = 1"
                />
              </div>
            </div>

            <div class="col-md-3">
              <select
                v-model="filterFiliere"
                class="form-select border-0 shadow-sm"
                @change="currentPage = 1"
              >
                <option value="">Toutes les filières</option>
                <option v-for="filiere in filieres" :key="filiere.id" :value="filiere.id">
                  {{ filiere.designation }}
                </option>
              </select>
            </div>

            <div class="col-md-2">
              <select
                v-model="filterSexe"
                class="form-select border-0 shadow-sm"
                @change="currentPage = 1"
              >
                <option value="">Genre</option>
                <option v-for="sexe in SEXES" :key="sexe.code" :value="sexe.code">
                  {{ sexe.label }}
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
      <LoadingSpinner v-if="loading" />

      <EmptyState
        v-else-if="etudiants.length === 0"
        title="Aucun étudiant enregistré"
        description="Créez un premier étudiant depuis le bouton « Ajouter un étudiant », ou importez une liste depuis l'onglet Import."
      />

      <EmptyState
        v-else-if="filteredEtudiants.length === 0"
        title="Aucun étudiant trouvé"
        description="Aucun étudiant ne correspond à ces critères. Essayez de les élargir."
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
                  <th class="text-center">Genre</th>
                  <th>Parcours</th>
                  <th>Contact</th>
                  <th class="text-end pe-4">Actions</th>
                </tr>
              </thead>

              <tbody>
                <tr v-for="(etudiant, index) in paginatedEtudiants" :key="etudiant.id">
                  <td class="ps-4 text-muted small">{{ startIndex + index + 1 }}</td>

                  <td>
                    <div class="d-flex align-items-center">
                      <div
                        class="avatar-circle me-3"
                        :class="
                          etudiant.sexe === 'M'
                            ? 'bg-soft-info text-info'
                            : 'bg-soft-warning text-warning'
                        "
                      >
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

                  <td class="text-center">
                    <span
                      class="badge rounded-pill px-3 py-2"
                      :class="
                        etudiant.sexe === 'M'
                          ? 'bg-soft-info text-info'
                          : 'bg-soft-warning text-warning'
                      "
                    >
                      {{ sexeLabel(etudiant.sexe) }}
                    </span>
                  </td>

                  <td>
                    <div class="fw-semibold">{{ etudiant.classe ?? '—' }}</div>
                    <small class="text-muted">{{ etudiant.filiere ?? '—' }}</small>
                  </td>

                  <td>
                    <div class="small">{{ etudiant.email ?? '—' }}</div>
                    <small class="text-muted">{{ etudiant.telephone ?? '—' }}</small>
                  </td>

                  <td class="text-end pe-4">
                    <ItemActions
                      :item="etudiant"
                      :label="`${etudiant.nom} ${etudiant.prenom}`"
                      :actions="actions"
                      @action="onAction"
                    />
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

.bg-soft-info {
  background-color: rgba(13, 202, 240, 0.12);
  color: #0dcaf0;
}

.bg-soft-warning {
  background-color: rgba(255, 193, 7, 0.15);
  color: #997404;
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
