<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import EmptyState from '@/shared/components/EmptyState.vue';
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue';
import ExportMenu from '@/shared/components/ExportMenu.vue';
import Pagination from '@/components/shared/Pagination.vue';
import { useTableExport } from '@/shared/composables/useTableExport';
import { openModal } from '@/shared/utils/modal';
import { useAnneeStore } from '@/modules/structure-academique/annee/store';
import { useInscriptionStore } from '../../store';
import { IMPORT_REINSCRIPTIONS_MODAL_ID, statutInfo } from '../../constants';
import ImportModal from '../ImportModal.vue';
import ReinscrireModal from '../ReinscrireModal.vue';

/**
 * Candidats à la réinscription.
 *
 * L'onglet lisait `inscriptionStore.candidatsPourReinscription` et appelait
 * `inscriptionStore.fetchCandidatsReinscription()` — **ni la propriété ni
 * l'action n'existaient**. Un garde `typeof === 'function'` masquait l'appel
 * manquant, si bien que la liste affichait « Aucun candidat éligible » en
 * permanence, sans la moindre erreur visible. Ses filtres retombaient de leur
 * côté sur des valeurs codées en dur (`['2023-2024', ...]`, `['GI','GTR','IDA']`).
 *
 * Le backend n'expose aucun endpoint « candidats éligibles ». Mais il n'en a pas
 * besoin : un candidat à la réinscription est un étudiant **déjà inscrit une
 * année précédente et pas encore inscrit sur l'année cible**. C'est une
 * projection de `GET /inscriptions`, calculée ici.
 */

const store = useInscriptionStore();
const anneeStore = useAnneeStore();

const { items: inscriptions, loading } = storeToRefs(store);
const { items: annees } = storeToRefs(anneeStore);

/** Année vers laquelle on réinscrit. Les candidats sont ceux qui n'y sont pas encore. */
const anneeCibleId = ref('');
const searchQuery = ref('');
const currentPage = ref(1);
const itemsPerPage = 10;

const selectedEtudiant = ref(null);

onMounted(async () => {
  await Promise.all([store.fetchAll(), anneeStore.fetchAll()]);
  anneeCibleId.value = annees.value.find((annee) => annee.est_active)?.id ?? '';
});

watch([anneeCibleId, searchQuery], () => {
  currentPage.value = 1;
});

const anneeCible = computed(() => annees.value.find((annee) => annee.id === anneeCibleId.value));

/** Codes d'année déjà couverts par une inscription, par étudiant. */
const anneesParEtudiant = computed(() => {
  const map = new Map();

  for (const inscription of inscriptions.value) {
    const id = inscription.etudiant_id;
    if (!id) continue;

    if (!map.has(id)) map.set(id, new Set());
    map.get(id).add(inscription.annee_code);
  }

  return map;
});

/**
 * Un candidat est un étudiant connu qui n'a pas d'inscription sur l'année cible.
 * Sans année cible sélectionnée, on ne peut rien affirmer : la liste reste vide.
 */
const candidats = computed(() => {
  const cible = anneeCible.value?.code;
  if (!cible) return [];

  return store.etudiants.filter(
    (etudiant) => !anneesParEtudiant.value.get(etudiant.id)?.has(cible)
  );
});

const filtered = computed(() => {
  const search = searchQuery.value.toLowerCase().trim();
  if (!search) return candidats.value;

  return candidats.value.filter((etudiant) =>
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
    'Classe précédente': etudiant.classe ?? '—',
    'Année précédente': etudiant.annee_academique ?? '—',
    Filière: etudiant.filiere ?? '—',
    'Dernier statut': statutInfo(etudiant.statut).label,
  }))
);

const { exportToExcel, exportToPdf } = useTableExport({
  rows: exportRows,
  title: 'Candidats à la réinscription',
  fileBaseName: 'candidats_reinscription',
  filters: () => [
    { label: 'Année cible', value: anneeCible.value?.code ?? '—' },
    { label: 'Candidats', value: filtered.value.length },
    { label: "Date d'édition", value: new Date().toLocaleDateString('fr-FR') },
  ],
});

const openImport = () => openModal(IMPORT_REINSCRIPTIONS_MODAL_ID);
</script>

<template>
  <div>
    <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
      <div>
        <h4 class="fw-bold mb-1">Réinscriptions</h4>
        <p class="text-muted small mb-0">
          Les étudiants déjà connus du système qui n'ont pas encore d'inscription sur l'année cible.
        </p>
      </div>

      <div class="d-flex gap-2">
        <ExportMenu :disabled="filtered.length === 0" @excel="exportToExcel" @pdf="exportToPdf" />
        <button class="btn btn-primary" @click="openImport">
          <i class="mdi mdi-upload me-1"></i> Réinscrire un lot
        </button>
      </div>
    </div>

    <div class="card border-0 shadow-sm bg-light mb-4">
      <div class="card-body p-3">
        <div class="row g-3">
          <div class="col-md-4">
            <label for="reins-annee" class="small fw-semibold text-muted mb-1">
              Année académique cible
            </label>
            <select id="reins-annee" v-model="anneeCibleId" class="form-select border-0 shadow-sm">
              <option value="">Choisir une année</option>
              <option v-for="annee in annees" :key="annee.id" :value="annee.id">
                {{ annee.code }}
              </option>
            </select>
          </div>

          <div class="col-md-8">
            <label for="reins-search" class="small fw-semibold text-muted mb-1">Recherche</label>
            <div class="input-group bg-white rounded shadow-sm">
              <span class="input-group-text bg-white border-0">
                <i class="mdi mdi-magnify text-primary"></i>
              </span>
              <input
                id="reins-search"
                v-model="searchQuery"
                type="text"
                class="form-control border-0"
                placeholder="Rechercher par nom, prénom, matricule..."
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <LoadingSpinner v-if="loading" />

    <EmptyState
      v-else-if="!anneeCible"
      title="Choisissez une année cible"
      description="Les candidats sont les étudiants qui ne sont pas encore inscrits sur l'année sélectionnée."
    />

    <EmptyState
      v-else-if="filtered.length === 0"
      title="Aucun candidat"
      :description="`Tous les étudiants connus sont déjà inscrits sur ${anneeCible.code}, ou aucun ne correspond à la recherche.`"
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
                <th>Parcours précédent</th>
                <th class="text-center">Dernier statut</th>
                <th class="text-end pe-4">Action</th>
              </tr>
            </thead>

            <tbody>
              <tr v-for="(etudiant, index) in paginated" :key="etudiant.id">
                <td class="ps-4 text-muted small">{{ startIndex + index + 1 }}</td>

                <td>
                  <span class="badge bg-light text-primary border fw-bold">
                    {{ etudiant.matricule }}
                  </span>
                </td>

                <td class="fw-bold text-dark">{{ etudiant.nom }} {{ etudiant.prenom }}</td>

                <td>
                  <div class="fw-semibold">{{ etudiant.classe ?? '—' }}</div>
                  <small class="text-muted">
                    {{ etudiant.filiere ?? '—' }} · {{ etudiant.annee_academique ?? '—' }}
                  </small>
                </td>

                <td class="text-center">
                  <span
                    class="badge rounded-pill px-3 py-2"
                    :class="`bg-${statutInfo(etudiant.statut).variant}-subtle text-${statutInfo(etudiant.statut).variant}`"
                  >
                    {{ statutInfo(etudiant.statut).label }}
                  </span>
                </td>

                <td class="text-end pe-4">
                  <button
                    class="btn btn-sm btn-outline-primary"
                    @click="selectedEtudiant = etudiant"
                  >
                    Réinscrire
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

    <ReinscrireModal :etudiant="selectedEtudiant" @update:etudiant="selectedEtudiant = $event" />

    <ImportModal kind="reinscriptions" :modal-id="IMPORT_REINSCRIPTIONS_MODAL_ID" />
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
</style>
