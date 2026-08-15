<script setup>
import { computed, onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import ExportMenu from '@/shared/components/ExportMenu.vue';
import EmptyState from '@/shared/components/EmptyState.vue';
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue';
import Pagination from '@/components/shared/Pagination.vue';
import { useTableExport } from '@/shared/composables/useTableExport';
import { usePagination } from '@/shared/composables/usePagination';
import { useClasseStore } from '@/modules/structure-academique/classe/store';

/**
 * Répartition des étudiants dans les classes.
 *
 * Remplace l'ancien onglet « Organisation », qui présentait des groupes
 * pédagogiques (« Groupe TP1 », « Projet Web », « Club Robotique ») **entièrement
 * fictifs** : aucun endpoint backend n'expose de groupes, les étudiants venaient
 * d'un `setTimeout`, et le bouton « Assigner » d'une ligne affectait en réalité
 * *le premier étudiant de la liste filtrée* — pas celui sur lequel on cliquait
 * (`ajouterAuGroupe` était appelé avec deux arguments mais n'en déclarait qu'un).
 *
 * Ce que l'API expose réellement, c'est l'effectif et la capacité de chaque
 * classe : `GET /classes` renvoie `nb_etudiants` et `capacite_max`. C'est donc
 * la vraie répartition qui est affichée ici, sans requête supplémentaire — le
 * store des classes est déjà en cache pour les autres onglets.
 */

const classeStore = useClasseStore();
const { items: classes, loading } = storeToRefs(classeStore);

const searchQuery = ref('');

onMounted(() => classeStore.fetchAll());

/** @param {any} classe @returns {number} */
const effectif = (classe) => Number(classe.nb_etudiants ?? 0);

/** @param {any} classe @returns {number} */
const capacite = (classe) => Number(classe.capacite_max ?? 0);

/** @param {any} classe @returns {number} Taux de remplissage en %, 0 si la capacité est inconnue. */
function taux(classe) {
  const max = capacite(classe);
  if (max <= 0) return 0;
  return Math.round((effectif(classe) / max) * 100);
}

const filteredClasses = computed(() => {
  const search = searchQuery.value.toLowerCase().trim();
  if (!search) return classes.value;

  return classes.value.filter((classe) =>
    [classe.code, classe.filiere_nom, classe.niveau_code]
      .filter(Boolean)
      .some((field) => String(field).toLowerCase().includes(search))
  );
});

/** Classes groupées par filière, pour rendre la répartition lisible. */
const groupes = computed(() => {
  const parFiliere = new Map();

  for (const classe of filteredClasses.value) {
    const filiere = classe.filiere_nom ?? 'Filière non renseignée';
    if (!parFiliere.has(filiere)) parFiliere.set(filiere, []);
    parFiliere.get(filiere).push(classe);
  }

  return [...parFiliere.entries()]
    .map(([filiere, items]) => ({
      filiere,
      classes: items,
      effectif: items.reduce((total, classe) => total + effectif(classe), 0),
      capacite: items.reduce((total, classe) => total + capacite(classe), 0),
    }))
    .sort((a, b) => b.effectif - a.effectif);
});

// La pagination porte sur les **groupes** (une carte par filière) et non sur les
// classes : couper un groupe en deux afficherait un cumul d'en-tête qui ne
// correspondrait à aucune des lignes visibles.
const {
  page,
  itemsPerPage,
  paginated: groupesPagines,
} = usePagination(groupes, {
  perPage: 5,
  resetKey: () => searchQuery.value,
});

const totalEtudiants = computed(() =>
  filteredClasses.value.reduce((total, classe) => total + effectif(classe), 0)
);

const totalCapacite = computed(() =>
  filteredClasses.value.reduce((total, classe) => total + capacite(classe), 0)
);

const tauxGlobal = computed(() => {
  if (totalCapacite.value <= 0) return 0;
  return Math.round((totalEtudiants.value / totalCapacite.value) * 100);
});

/** @param {number} value @returns {string} */
function progressClass(value) {
  if (value >= 90) return 'bg-danger';
  if (value >= 70) return 'bg-success';
  if (value >= 40) return 'bg-primary';
  return 'bg-warning';
}

const exportRows = computed(() =>
  filteredClasses.value.map((classe) => ({
    Classe: classe.code,
    Filière: classe.filiere_nom ?? '—',
    Niveau: classe.niveau_code ?? '—',
    Effectif: effectif(classe),
    Capacité: capacite(classe) || '—',
    'Taux de remplissage': capacite(classe) > 0 ? `${taux(classe)} %` : '—',
  }))
);

const { exportToExcel, exportToPdf } = useTableExport({
  rows: exportRows,
  title: 'Répartition des étudiants par classe',
  fileBaseName: 'repartition_etudiants',
  filters: () => [
    { label: 'Total étudiants', value: totalEtudiants.value },
    { label: 'Capacité totale', value: totalCapacite.value },
    { label: 'Taux global', value: `${tauxGlobal.value} %` },
    { label: "Date d'édition", value: new Date().toLocaleDateString('fr-FR') },
  ],
});
</script>

<template>
  <div>
    <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
      <div>
        <h4 class="fw-bold mb-1">Répartition des étudiants</h4>
        <p class="text-muted small mb-0">
          Effectifs et taux de remplissage de chaque classe, groupés par filière.
        </p>
      </div>
      <ExportMenu
        :disabled="filteredClasses.length === 0"
        @excel="exportToExcel"
        @pdf="exportToPdf"
      />
    </div>

    <div class="row g-3 mb-4">
      <div class="col-md-4">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-body d-flex align-items-center justify-content-between">
            <div>
              <span class="text-muted small fw-semibold text-uppercase d-block mb-1">
                Étudiants répartis
              </span>
              <h3 class="fw-bold text-dark mb-0 font-monospace">{{ totalEtudiants }}</h3>
            </div>
            <div class="stat-icon bg-soft-primary text-primary">
              <i class="mdi mdi-account-group"></i>
            </div>
          </div>
        </div>
      </div>

      <div class="col-md-4">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-body d-flex align-items-center justify-content-between">
            <div>
              <span class="text-muted small fw-semibold text-uppercase d-block mb-1">
                Capacité totale
              </span>
              <h3 class="fw-bold text-dark mb-0 font-monospace">{{ totalCapacite || '—' }}</h3>
            </div>
            <div class="stat-icon bg-soft-success text-success">
              <i class="mdi mdi-seat-outline"></i>
            </div>
          </div>
        </div>
      </div>

      <div class="col-md-4">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-body d-flex align-items-center justify-content-between">
            <div>
              <span class="text-muted small fw-semibold text-uppercase d-block mb-1">
                Taux global
              </span>
              <h3 class="fw-bold text-dark mb-0 font-monospace">{{ tauxGlobal }} %</h3>
            </div>
            <div class="stat-icon bg-soft-warning text-warning">
              <i class="mdi mdi-chart-donut"></i>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="mb-4">
      <div class="input-group shadow-sm" style="max-width: 420px">
        <span class="input-group-text bg-white border-0">
          <i class="mdi mdi-magnify text-primary"></i>
        </span>
        <input
          v-model="searchQuery"
          type="text"
          class="form-control border-0"
          placeholder="Rechercher une classe, une filière, un niveau..."
        />
      </div>
    </div>

    <LoadingSpinner v-if="loading" />

    <EmptyState
      v-else-if="filteredClasses.length === 0"
      title="Aucune classe"
      description="Aucune classe ne correspond à ces critères, ou aucune classe n'est encore déclarée."
    />

    <div v-else class="d-flex flex-column gap-4">
      <div v-for="groupe in groupesPagines" :key="groupe.filiere" class="card border-0 shadow-sm">
        <div
          class="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center"
        >
          <h6 class="mb-0 fw-bold text-primary">{{ groupe.filiere }}</h6>
          <span class="badge bg-light text-dark border">
            {{ groupe.effectif }} étudiant(s) · {{ groupe.classes.length }} classe(s)
          </span>
        </div>

        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead class="table-light">
                <tr>
                  <th class="ps-4 py-3">Classe</th>
                  <th>Niveau</th>
                  <th class="text-center">Effectif / Capacité</th>
                  <th style="width: 240px">Taux de remplissage</th>
                </tr>
              </thead>

              <tbody>
                <tr v-for="classe in groupe.classes" :key="classe.id">
                  <td class="ps-4">
                    <span class="code-box">{{ classe.code }}</span>
                  </td>

                  <td class="small text-muted">{{ classe.niveau_code ?? '—' }}</td>

                  <td class="text-center">
                    <span class="fw-semibold text-dark">{{ effectif(classe) }}</span>
                    <span class="text-muted px-1">/</span>
                    <span class="text-secondary small">{{ capacite(classe) || '—' }}</span>
                  </td>

                  <td>
                    <div v-if="capacite(classe) > 0">
                      <div class="small fw-medium text-dark mb-1">{{ taux(classe) }} %</div>
                      <div class="progress" style="height: 6px">
                        <div
                          class="progress-bar rounded"
                          role="progressbar"
                          :class="progressClass(taux(classe))"
                          :style="{ width: Math.min(taux(classe), 100) + '%' }"
                          :aria-valuenow="taux(classe)"
                          aria-valuemin="0"
                          aria-valuemax="100"
                        ></div>
                      </div>
                    </div>
                    <span v-else class="text-muted small">Capacité non renseignée</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Pagination
        v-model="page"
        v-model:items-per-page="itemsPerPage"
        :total-items="groupes.length"
        :items-per-page-options="[5, 10, 15, 20]"
      />
    </div>
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

.bg-soft-primary {
  background: rgba(75, 73, 172, 0.1);
}

.bg-soft-success {
  background: rgba(25, 135, 84, 0.12);
}

.bg-soft-warning {
  background: rgba(255, 193, 7, 0.15);
}

.code-box {
  background: #f1f5f9;
  color: #475569;
  padding: 3px 10px;
  border-radius: 4px;
  font-size: 0.78rem;
  font-weight: 700;
}

.table thead th {
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: #5c677d;
  border-bottom: 1px solid #e2e8f0;
}
</style>
