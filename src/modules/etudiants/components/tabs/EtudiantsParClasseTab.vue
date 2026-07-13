<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import ExportMenu from '@/shared/components/ExportMenu.vue';
import EmptyState from '@/shared/components/EmptyState.vue';
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue';
import Pagination from '@/components/shared/Pagination.vue';
import { useTableExport } from '@/shared/composables/useTableExport';
import { useAnneeStore } from '@/modules/structure-academique/annee/store';
import { useFiliereStore } from '@/modules/structure-academique/filiere/store';
import { useClasseStore } from '@/modules/structure-academique/classe/store';
import { useInscriptionStore } from '@/modules/inscriptions/store';
import { statutInfo } from '@/modules/inscriptions/constants';

/**
 * Étudiants d'une classe, pour une année.
 *
 * L'onglet appelait `etudiantStore.fetchEtudiantsByClasseFiliereAnnee(...)` et
 * lisait `etudiantStore.filteredEtudiants` : **aucun des deux n'existait** dans
 * le store. Le premier changement de filtre levait un `TypeError` et le tableau
 * restait vide en toutes circonstances. Le tableau portait de surcroît
 * `v-else-if` et `v-for` sur la même ligne, ce qui rendait le « aucun résultat »
 * inatteignable.
 *
 * Il interroge les **inscriptions**, et non l'annuaire : `GET /etudiants` ne
 * renvoie ni classe ni année académique. Un étudiant appartient à une *filière* ;
 * sa *classe* est un fait d'inscription. C'est donc bien la bonne source.
 *
 * L'année et la classe sont filtrées **par le serveur** (`annee_academique_id`,
 * `classe_id`) ; la filière **par le client** : `listerInscriptions` ne la lit pas.
 */

const inscriptionStore = useInscriptionStore();
const anneeStore = useAnneeStore();
const filiereStore = useFiliereStore();
const classeStore = useClasseStore();

const { items: inscriptions, loading } = storeToRefs(inscriptionStore);
const { items: annees } = storeToRefs(anneeStore);
const { items: filieres } = storeToRefs(filiereStore);

const anneeId = ref('');
const filiereId = ref('');
const classeId = ref('');
const searchQuery = ref('');

const currentPage = ref(1);
const itemsPerPage = 10;

/** Les classes de la filière retenue ; toutes si aucune n'est choisie. */
const classes = computed(() => {
  if (!filiereId.value) return classeStore.items;
  return classeStore.items.filter(
    (classe) => String(classe.filiere_id) === String(filiereId.value)
  );
});

const filiereNom = computed(
  () => filieres.value.find((filiere) => filiere.id === filiereId.value)?.designation ?? ''
);

onMounted(async () => {
  await Promise.all([anneeStore.fetchAll(), filiereStore.fetchAll(), classeStore.fetchAll()]);

  anneeId.value = annees.value.find((annee) => annee.est_active)?.id ?? '';
  load();
});

/** Ce que le serveur sait filtrer. */
const serverParams = computed(() => {
  const query = {};
  if (anneeId.value) query.annee_academique_id = anneeId.value;
  if (classeId.value) query.classe_id = classeId.value;
  return query;
});

function load() {
  currentPage.value = 1;
  inscriptionStore.fetchAll({ params: serverParams.value });
}

// Un seul point de rechargement. L'ancienne version câblait trois `@change`
// distincts, dont l'un oubliait de remettre la pagination à zéro.
watch(serverParams, load);

// Changer de filière invalide la classe retenue : elle appartenait à l'autre.
watch(filiereId, () => {
  classeId.value = '';
  currentPage.value = 1;
});

watch(searchQuery, () => {
  currentPage.value = 1;
});

const filtered = computed(() => {
  const search = searchQuery.value.toLowerCase().trim();

  return inscriptions.value.filter((inscription) => {
    const matchesFiliere = !filiereNom.value || inscription.filiere_nom === filiereNom.value;

    const matchesSearch =
      !search ||
      [inscription.etudiant_nom, inscription.etudiant_prenom, inscription.etudiant_matricule]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(search));

    return matchesFiliere && matchesSearch;
  });
});

const startIndex = computed(() => (currentPage.value - 1) * itemsPerPage);

const paginated = computed(() =>
  filtered.value.slice(startIndex.value, startIndex.value + itemsPerPage)
);

const labels = computed(() => ({
  annee: annees.value.find((annee) => annee.id === anneeId.value)?.code ?? 'Toutes',
  filiere: filiereNom.value || 'Toutes',
  classe: classes.value.find((classe) => classe.id === classeId.value)?.code ?? 'Toutes',
}));

const exportRows = computed(() =>
  filtered.value.map((inscription, index) => ({
    'N°': index + 1,
    Matricule: inscription.etudiant_matricule,
    Nom: inscription.etudiant_nom,
    Prénom: inscription.etudiant_prenom,
    'E-mail': inscription.etudiant_email ?? '—',
    Année: inscription.annee_code ?? '—',
    Filière: inscription.filiere_nom ?? '—',
    Classe: inscription.classe_code ?? '—',
    Inscription: statutInfo(inscription.inscription_statut).label,
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
          Vue des inscriptions : c'est l'inscription qui rattache un étudiant à une classe.
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
      <LoadingSpinner v-if="loading" />

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
                <th>Année</th>
                <th>Filière</th>
                <th>Classe</th>
                <th class="text-center">Inscription</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(inscription, index) in paginated"
                :key="inscription.inscription_id ?? inscription.id"
              >
                <td>{{ startIndex + index + 1 }}</td>
                <td class="fw-bold">{{ inscription.etudiant_matricule }}</td>
                <td>{{ inscription.etudiant_nom }}</td>
                <td>{{ inscription.etudiant_prenom }}</td>
                <td>{{ inscription.annee_code ?? '—' }}</td>
                <td>{{ inscription.filiere_nom ?? '—' }}</td>
                <td>{{ inscription.classe_code ?? '—' }}</td>
                <td class="text-center">
                  <span
                    class="badge rounded-pill px-3 py-2"
                    :class="`bg-${statutInfo(inscription.inscription_statut).variant}-subtle text-${statutInfo(inscription.inscription_statut).variant}`"
                  >
                    {{ statutInfo(inscription.inscription_statut).label }}
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
