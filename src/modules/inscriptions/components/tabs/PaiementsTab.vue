<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import ExportMenu from '@/shared/components/ExportMenu.vue';
import EmptyState from '@/shared/components/EmptyState.vue';
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue';
import Pagination from '@/components/shared/Pagination.vue';
import { useTableExport } from '@/shared/composables/useTableExport';
import { useInscriptionStore } from '../../store';
import { STATUT_LIST, formatMoney, normalizeStatut, statutInfo } from '../../constants';
import PaiementModal from '../PaiementModal.vue';

/**
 * Suivi financier des inscriptions.
 *
 * L'onglet définissait deux fonctions — `validerInscription` et `imprimerRecu` —
 * qu'aucun bouton du template n'appelait : du code mort qui donnait l'illusion
 * d'un workflow de validation en place. La validation se fait ici depuis la
 * modale de dossier, comme le backend l'entend (`PATCH /:id/statut`).
 *
 * Ses filières venaient, là encore, de `localStorage.getItem('filieres')`.
 */

const store = useInscriptionStore();
const { finances, financeTotals, loading } = storeToRefs(store);

const searchQuery = ref('');
const filterStatut = ref('');
const currentPage = ref(1);
const itemsPerPage = 10;

const selected = ref(null);

onMounted(() => store.fetchFinances());

watch([searchQuery, filterStatut], () => {
  currentPage.value = 1;
});

/** Les filières viennent des lignes elles-mêmes : le suivi financier ne renvoie
 *  que le code (`filiere_code`), pas l'identifiant qui permettrait un rapprochement. */
const filieres = computed(() =>
  [...new Set(finances.value.map((ligne) => ligne.filiere_code).filter(Boolean))].sort()
);

const filterFiliere = ref('');

const filtered = computed(() => {
  const search = searchQuery.value.toLowerCase().trim();

  return finances.value.filter((ligne) => {
    const matchesSearch =
      !search ||
      [ligne.nom, ligne.prenom, ligne.matricule]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(search));

    const matchesFiliere = !filterFiliere.value || ligne.filiere_code === filterFiliere.value;
    const matchesStatut =
      !filterStatut.value || normalizeStatut(ligne.statut) === filterStatut.value;

    return matchesSearch && matchesFiliere && matchesStatut;
  });
});

const startIndex = computed(() => (currentPage.value - 1) * itemsPerPage);

const paginated = computed(() =>
  filtered.value.slice(startIndex.value, startIndex.value + itemsPerPage)
);

const exportRows = computed(() =>
  filtered.value.map((ligne, index) => ({
    'N°': index + 1,
    Matricule: ligne.matricule,
    Nom: ligne.nom,
    Prénom: ligne.prenom,
    Classe: ligne.classe_code ?? '—',
    Filière: ligne.filiere_code ?? '—',
    'Frais de scolarité': Number(ligne.frais_scolarite ?? 0),
    'Montant versé': Number(ligne.montant_verse ?? 0),
    Reste: Number(ligne.reste ?? 0),
    Statut: statutInfo(ligne.statut).label,
  }))
);

const { exportToExcel, exportToPdf } = useTableExport({
  rows: exportRows,
  title: 'Suivi financier des inscriptions',
  fileBaseName: 'suivi_financier',
  filters: () => [
    { label: 'Total collecté', value: formatMoney(financeTotals.value.total_collecte) },
    { label: 'En attente', value: formatMoney(financeTotals.value.total_attente) },
    { label: 'Dossiers', value: filtered.value.length },
    { label: "Date d'édition", value: new Date().toLocaleDateString('fr-FR') },
  ],
});

function resetFilters() {
  searchQuery.value = '';
  filterFiliere.value = '';
  filterStatut.value = '';
}
</script>

<template>
  <div>
    <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
      <div>
        <h4 class="fw-bold mb-1">Frais et paiements</h4>
        <p class="text-muted small mb-0">
          Suivi des montants dus, versés et restants, et validation des dossiers.
        </p>
      </div>
      <ExportMenu :disabled="filtered.length === 0" @excel="exportToExcel" @pdf="exportToPdf" />
    </div>

    <div class="row g-3 mb-4">
      <div class="col-md-6">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-body d-flex align-items-center justify-content-between">
            <div>
              <span class="text-muted small fw-semibold text-uppercase d-block mb-1">
                Total collecté
              </span>
              <h3 class="fw-bold text-success mb-0">
                {{ formatMoney(financeTotals.total_collecte) }}
              </h3>
            </div>
            <div class="stat-icon bg-success-subtle text-success">
              <i class="mdi mdi-cash-check"></i>
            </div>
          </div>
        </div>
      </div>

      <div class="col-md-6">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-body d-flex align-items-center justify-content-between">
            <div>
              <span class="text-muted small fw-semibold text-uppercase d-block mb-1">
                En attente de règlement
              </span>
              <h3 class="fw-bold text-warning mb-0">
                {{ formatMoney(financeTotals.total_attente) }}
              </h3>
            </div>
            <div class="stat-icon bg-warning-subtle text-warning">
              <i class="mdi mdi-clock-outline"></i>
            </div>
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
                placeholder="Rechercher un étudiant..."
              />
            </div>
          </div>

          <div class="col-md-3">
            <select v-model="filterFiliere" class="form-select border-0 shadow-sm">
              <option value="">Toutes les filières</option>
              <option v-for="code in filieres" :key="code" :value="code">{{ code }}</option>
            </select>
          </div>

          <div class="col-md-2">
            <select v-model="filterStatut" class="form-select border-0 shadow-sm">
              <option value="">Tous les statuts</option>
              <option v-for="statut in STATUT_LIST" :key="statut.code" :value="statut.code">
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
      description="Aucun dossier financier ne correspond à ces critères."
    />

    <div v-else class="card border-0 shadow-sm overflow-hidden">
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead class="bg-light">
              <tr>
                <th class="ps-4 py-3">Étudiant</th>
                <th>Classe</th>
                <th class="text-end">Frais</th>
                <th class="text-end">Versé</th>
                <th class="text-end">Reste</th>
                <th class="text-center">Statut</th>
                <th class="text-end pe-4">Actions</th>
              </tr>
            </thead>

            <tbody>
              <tr v-for="ligne in paginated" :key="ligne.id">
                <td class="ps-4">
                  <div class="fw-bold text-dark">{{ ligne.nom }} {{ ligne.prenom }}</div>
                  <small class="text-muted">{{ ligne.matricule }}</small>
                </td>

                <td>
                  <div class="fw-semibold">{{ ligne.classe_code ?? '—' }}</div>
                  <small class="text-muted">{{ ligne.filiere_code ?? '—' }}</small>
                </td>

                <td class="text-end">{{ formatMoney(ligne.frais_scolarite) }}</td>
                <td class="text-end text-success">{{ formatMoney(ligne.montant_verse) }}</td>
                <td class="text-end fw-bold text-danger">{{ formatMoney(ligne.reste) }}</td>

                <td class="text-center">
                  <span
                    class="badge rounded-pill px-3 py-2"
                    :class="`bg-${statutInfo(ligne.statut).variant}-subtle text-${statutInfo(ligne.statut).variant}`"
                  >
                    {{ statutInfo(ligne.statut).label }}
                  </span>
                </td>

                <td class="text-end pe-4">
                  <button class="btn btn-sm btn-outline-primary" @click="selected = ligne">
                    Gérer le dossier
                  </button>
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

    <PaiementModal :inscription="selected" @update:inscription="selected = $event" />
  </div>
</template>

<style scoped>
.stat-icon {
  width: 42px;
  height: 42px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
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
