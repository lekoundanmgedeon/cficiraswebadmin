<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import ItemActions from '@/shared/components/ItemActions.vue';
import ExportMenu from '@/shared/components/ExportMenu.vue';
import EmptyState from '@/shared/components/EmptyState.vue';
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue';
import Pagination from '@/components/shared/Pagination.vue';
import { useTableExport } from '@/shared/composables/useTableExport';
import { formatDate } from '@/shared/utils/date';
import { useFiliereStore } from '@/modules/structure-academique/filiere/store';
import { useInscriptionStore } from '../../store';
import { STATUT_LIST, normalizeStatut, statutInfo } from '../../constants';
import InscriptionDetailsModal from '../InscriptionDetailsModal.vue';

/**
 * Liste des inscriptions.
 *
 * L'ancien `InscriptionForm.vue` — qui n'était pas un formulaire malgré son nom —
 * souffrait de trois défauts :
 *  - son bouton « Détails » posait `selectedInscription` et `showModal`, mais
 *    **aucune modale n'était montée dans le fichier** pour les exploiter ;
 *  - son bouton « Supprimer » appelait `store.removeInscription(id)`, action
 *    absente du store *et* sans endpoint côté serveur, le tout protégé par un
 *    garde `typeof === 'function'` qui en faisait un no-op silencieux ;
 *  - son template référençait `<InscriptionClasse />` et `<AjouterTuteur />`
 *    sans les importer — Vue les rendait comme des éléments inconnus.
 *
 * Les filières venaient par ailleurs de `localStorage.getItem('filieres')`, en
 * pariant sur le fait qu'un *autre* écran les y avait déposées : ouvrir cet
 * onglet en premier laissait le filtre vide. Elles viennent maintenant de leur
 * store.
 */

const store = useInscriptionStore();
const filiereStore = useFiliereStore();

const { items: inscriptions, loading } = storeToRefs(store);
const { items: filieres } = storeToRefs(filiereStore);

const searchQuery = ref('');
const filterFiliere = ref('');
const filterStatut = ref('');

const currentPage = ref(1);
const itemsPerPage = 10;

const selected = ref(null);

onMounted(() => {
  store.fetchAll();
  filiereStore.fetchAll();
});

watch([searchQuery, filterFiliere, filterStatut], () => {
  currentPage.value = 1;
});

const filtered = computed(() => {
  const search = searchQuery.value.toLowerCase().trim();

  return inscriptions.value.filter((inscription) => {
    const matchesSearch =
      !search ||
      [inscription.etudiant_nom, inscription.etudiant_prenom, inscription.etudiant_matricule]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(search));

    const matchesFiliere = !filterFiliere.value || inscription.filiere_nom === filterFiliere.value;

    const matchesStatut =
      !filterStatut.value || normalizeStatut(inscription.inscription_statut) === filterStatut.value;

    return matchesSearch && matchesFiliere && matchesStatut;
  });
});

const startIndex = computed(() => (currentPage.value - 1) * itemsPerPage);

const paginated = computed(() =>
  filtered.value.slice(startIndex.value, startIndex.value + itemsPerPage)
);

const exportRows = computed(() =>
  filtered.value.map((inscription, index) => ({
    'N°': index + 1,
    Matricule: inscription.etudiant_matricule,
    Nom: inscription.etudiant_nom,
    Prénom: inscription.etudiant_prenom,
    Classe: inscription.classe_code ?? '—',
    Filière: inscription.filiere_nom ?? '—',
    Année: inscription.annee_code ?? '—',
    Statut: statutInfo(inscription.inscription_statut).label,
    'Date d’inscription': formatDate(inscription.date_inscription),
  }))
);

const { exportToExcel, exportToPdf } = useTableExport({
  rows: exportRows,
  title: 'Liste des inscriptions',
  fileBaseName: 'inscriptions',
});

/**
 * Le backend n'expose pas de suppression : la sortie d'un dossier est un
 * changement de statut. « Rejeter » et « Abandon » ne sont donc proposés que
 * lorsqu'ils ont un sens, et « Valider » disparaît sur un dossier déjà traité.
 * @param {any} inscription
 */
function actionsFor(inscription) {
  const statut = normalizeStatut(inscription.inscription_statut);
  const enAttente = statut === 'EN_ATTENTE';
  const clos = ['REJETEE', 'ABANDON', 'EXCLU', 'DIPLOME'].includes(statut);

  return [
    { key: 'details', label: 'Voir le détail', icon: 'mdi-eye-outline' },
    {
      key: 'valider',
      label: 'Valider',
      icon: 'mdi-check-circle-outline',
      hidden: !enAttente,
      confirm: {
        title: 'Valider l’inscription',
        confirmLabel: 'Valider',
        variant: 'success',
      },
    },
    {
      key: 'rejeter',
      label: 'Rejeter',
      icon: 'mdi-close-circle-outline',
      variant: 'danger',
      hidden: !enAttente,
      confirm: { title: 'Rejeter le dossier', confirmLabel: 'Rejeter', variant: 'danger' },
    },
    {
      key: 'abandon',
      label: 'Déclarer un abandon',
      icon: 'mdi-account-off-outline',
      variant: 'danger',
      divider: true,
      hidden: enAttente || clos,
      confirm: { title: 'Déclarer un abandon', confirmLabel: 'Confirmer', variant: 'danger' },
    },
  ];
}

/** @param {{key: string, item: any}} event */
function onAction({ key, item }) {
  const id = item.inscription_id ?? item.id;

  if (key === 'details') {
    selected.value = item;
    return;
  }

  const statuts = { valider: 'VALIDEE', rejeter: 'REJETEE', abandon: 'ABANDON' };
  if (statuts[key]) store.changeStatut(id, statuts[key]);
}

function resetFilters() {
  searchQuery.value = '';
  filterFiliere.value = '';
  filterStatut.value = '';
}
</script>

<template>
  <div class="row">
    <div class="col-12 mb-4 d-flex justify-content-between align-items-center flex-wrap gap-2">
      <div>
        <h4 class="fw-bold mb-1">Liste des inscriptions</h4>
        <p class="text-muted small mb-0">
          <b>{{ filtered.length }}</b> inscription(s) affichée(s) sur
          {{ inscriptions.length }} enregistrée(s).
        </p>
      </div>
      <ExportMenu :disabled="filtered.length === 0" @excel="exportToExcel" @pdf="exportToPdf" />
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
                />
              </div>
            </div>

            <div class="col-md-3">
              <select v-model="filterFiliere" class="form-select border-0 shadow-sm">
                <option value="">Toutes les filières</option>
                <option v-for="filiere in filieres" :key="filiere.id" :value="filiere.designation">
                  {{ filiere.designation }}
                </option>
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
    </div>

    <div class="col-12">
      <LoadingSpinner v-if="loading" />

      <EmptyState
        v-else-if="inscriptions.length === 0"
        title="Aucune inscription"
        description="Importez un lot d'inscriptions depuis le bouton « Importer des inscriptions »."
      />

      <EmptyState
        v-else-if="filtered.length === 0"
        title="Aucun résultat"
        description="Aucune inscription ne correspond à ces critères."
      />

      <div v-else class="card border-0 shadow-sm overflow-hidden">
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead class="bg-light">
                <tr>
                  <th class="ps-4 py-3">#</th>
                  <th>Matricule</th>
                  <th>Étudiant</th>
                  <th>Classe & filière</th>
                  <th>Année</th>
                  <th class="text-center">Statut</th>
                  <th class="text-end pe-4">Actions</th>
                </tr>
              </thead>

              <tbody>
                <tr
                  v-for="(inscription, index) in paginated"
                  :key="inscription.inscription_id ?? inscription.id"
                >
                  <td class="ps-4 text-muted small">{{ startIndex + index + 1 }}</td>

                  <td>
                    <span class="badge bg-light text-primary border fw-bold">
                      {{ inscription.etudiant_matricule }}
                    </span>
                  </td>

                  <td>
                    <div class="fw-bold text-dark">
                      {{ inscription.etudiant_nom }} {{ inscription.etudiant_prenom }}
                    </div>
                    <small class="text-muted">
                      Inscrit le {{ formatDate(inscription.date_inscription) }}
                    </small>
                  </td>

                  <td>
                    <div class="fw-semibold">{{ inscription.classe_code ?? '—' }}</div>
                    <small class="text-muted">{{ inscription.filiere_nom ?? '—' }}</small>
                  </td>

                  <td class="small">{{ inscription.annee_code ?? '—' }}</td>

                  <td class="text-center">
                    <span
                      class="badge rounded-pill px-3 py-2"
                      :class="`bg-${statutInfo(inscription.inscription_statut).variant}-subtle text-${statutInfo(inscription.inscription_statut).variant}`"
                    >
                      {{ statutInfo(inscription.inscription_statut).label }}
                    </span>
                  </td>

                  <td class="text-end pe-4">
                    <ItemActions
                      :item="inscription"
                      :label="`${inscription.etudiant_nom} ${inscription.etudiant_prenom}`"
                      :actions="actionsFor(inscription)"
                      :loading="loading"
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
            :total-items="filtered.length"
          />
        </div>
      </div>
    </div>

    <InscriptionDetailsModal :inscription="selected" @update:inscription="selected = $event" />
  </div>
</template>

<style scoped>
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
