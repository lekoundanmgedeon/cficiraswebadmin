<script setup>
import { computed, onMounted, watch } from 'vue';
import { storeToRefs } from 'pinia';
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue';
import { useTableExport } from '@/shared/composables/useTableExport';
import { dossierInfo } from '@/modules/scolarite/constants';
import { useEtudiantStore } from '../../store';
import { useEtudiantFilters } from '../../composables/useEtudiantFilters';
import { sexeLabel } from '../../constants';

/**
 * Export filtré des étudiants.
 *
 * L'ancienne version exportait **trois étudiants codés en dur** et redéclarait à
 * la main la liste des colonnes dans chacune de ses trois fonctions d'export —
 * la source classique de désynchronisation. Ici les colonnes sont dérivées des
 * lignes par `useTableExport`, et les lignes viennent de l'API.
 *
 * (Un second composant, `data-io/ExportData.vue`, faisait la même chose en
 * appelant `XLSX.utils.json_to_sheet` **sans importer `XLSX`** : l'export
 * plantait au clic. Il a disparu avec cet onglet.)
 *
 * Les filtres sont ceux que `GET /etudiants` sait appliquer — filière, statut de
 * dossier, recherche. **Pas de filtre par classe** : l'annuaire ne la connaît
 * pas. Pour exporter une classe, passer par l'onglet « Par classe », qui lit les
 * inscriptions.
 */

const etudiantStore = useEtudiantStore();
const { items: etudiants, loading } = storeToRefs(etudiantStore);

const {
  search,
  filiereId,
  statutDossier,
  filieres,
  statuts,
  serverParams,
  labels,
  loadReferences,
} = useEtudiantFilters();

onMounted(async () => {
  await loadReferences();
  load();
});

function load() {
  etudiantStore.fetchAll({ params: serverParams.value });
}

watch(serverParams, load);

const exportRows = computed(() =>
  etudiants.value.map((etudiant, index) => ({
    'N°': index + 1,
    Matricule: etudiant.matricule,
    Nom: etudiant.nom,
    Prénom: etudiant.prenom,
    Sexe: sexeLabel(etudiant.sexe),
    'E-mail': etudiant.email ?? '—',
    Téléphone: etudiant.telephone ?? '—',
    Ville: etudiant.ville ?? '—',
    Filière: etudiant.filiere_nom ?? '—',
    Dossier: dossierInfo(etudiant.statut_dossier).label,
  }))
);

const { exportToExcel, exportToPdf, exportToCsv } = useTableExport({
  rows: exportRows,
  title: 'Liste des étudiants',
  fileBaseName: 'etudiants',
  filters: () => [
    { label: 'Filière', value: labels.value.filiere },
    { label: 'Statut du dossier', value: labels.value.statut },
    { label: 'Total étudiants', value: exportRows.value.length },
    { label: "Date d'édition", value: new Date().toLocaleDateString('fr-FR') },
  ],
});

const formats = [
  {
    key: 'excel',
    title: 'Microsoft Excel',
    hint: 'Format .xlsx, idéal pour l’analyse',
    icon: 'mdi-file-excel',
    variant: 'success',
    run: exportToExcel,
  },
  {
    key: 'pdf',
    title: 'Document PDF',
    hint: 'Mis en page, prêt à imprimer',
    icon: 'mdi-file-pdf-box',
    variant: 'danger',
    run: exportToPdf,
  },
  {
    key: 'csv',
    title: 'Fichier CSV',
    hint: 'Pour un import dans un système tiers',
    icon: 'mdi-file-delimited',
    variant: 'primary',
    run: exportToCsv,
  },
];
</script>

<template>
  <div>
    <div class="d-flex align-items-center justify-content-between mb-4">
      <div>
        <h4 class="fw-bold mb-1">Exportation des étudiants</h4>
        <p class="text-muted small mb-0">
          Filtrez les données, puis choisissez un format de sortie.
        </p>
      </div>
      <i class="mdi mdi-file-export-outline h1 text-primary opacity-25 mb-0"></i>
    </div>

    <div class="card border-0 shadow-sm mb-4">
      <div class="card-header bg-white border-0 py-3">
        <h6 class="mb-0 fw-bold">
          <i class="mdi mdi-filter-variant me-2 text-primary"></i>1. Filtrer les données
        </h6>
      </div>

      <div class="card-body bg-light rounded-bottom">
        <div class="row g-3">
          <div class="col-md-4">
            <label for="export-search" class="small fw-semibold text-muted mb-1">Recherche</label>
            <input
              id="export-search"
              v-model="search"
              type="text"
              class="form-control border-0 shadow-sm"
              placeholder="Nom, prénom, matricule..."
            />
          </div>

          <div class="col-md-4">
            <label for="export-filiere" class="small fw-semibold text-muted mb-1">Filière</label>
            <select id="export-filiere" v-model="filiereId" class="form-select border-0 shadow-sm">
              <option value="">Toutes les filières</option>
              <option v-for="filiere in filieres" :key="filiere.id" :value="filiere.id">
                {{ filiere.designation }}
              </option>
            </select>
          </div>

          <div class="col-md-4">
            <label for="export-dossier" class="small fw-semibold text-muted mb-1">
              Statut du dossier
            </label>
            <select
              id="export-dossier"
              v-model="statutDossier"
              class="form-select border-0 shadow-sm"
            >
              <option value="">Tous les statuts</option>
              <option v-for="statut in statuts" :key="statut.code" :value="statut.code">
                {{ statut.label }}
              </option>
            </select>
          </div>
        </div>

        <div class="mt-3">
          <LoadingSpinner v-if="loading" />
          <p v-else class="mb-0 small text-muted">
            <i class="mdi mdi-information-outline me-1"></i>
            <b class="text-dark">{{ exportRows.length }}</b> étudiant(s) seront exportés.
          </p>
        </div>
      </div>
    </div>

    <div class="card border-0 shadow-sm">
      <div class="card-header bg-white border-0 py-3">
        <h6 class="mb-0 fw-bold">
          <i class="mdi mdi-file-check me-2 text-primary"></i>2. Choisir le format
        </h6>
      </div>

      <div class="card-body">
        <div class="row g-3">
          <div v-for="format in formats" :key="format.key" class="col-md-4">
            <button
              type="button"
              class="format-card d-flex align-items-center p-3 border rounded w-100 text-start"
              :disabled="exportRows.length === 0"
              @click="format.run"
            >
              <div
                class="icon-box p-3 rounded me-3"
                :class="`bg-soft-${format.variant} text-${format.variant}`"
              >
                <i class="mdi mdi-24px" :class="format.icon"></i>
              </div>
              <div>
                <h6 class="mb-0 fw-bold">{{ format.title }}</h6>
                <small class="text-muted">{{ format.hint }}</small>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.format-card {
  background: #fff;
  transition: all 0.2s ease-in-out;
}

.format-card:hover:not(:disabled) {
  border-color: var(--bs-primary) !important;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
}

.format-card:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.bg-soft-success {
  background-color: rgba(25, 135, 84, 0.1);
}

.bg-soft-danger {
  background-color: rgba(220, 53, 69, 0.1);
}

.bg-soft-primary {
  background-color: rgba(13, 110, 253, 0.1);
}
</style>
