<script setup>
import { computed, onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import ExportMenu from '@/shared/components/ExportMenu.vue';
import EmptyState from '@/shared/components/EmptyState.vue';
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue';
import { useTableExport } from '@/shared/composables/useTableExport';
import { useClasseStore } from '@/modules/structure-academique/classe/store';
import ClasseEtudiantsModal from '../ClasseEtudiantsModal.vue';

/**
 * Capacité d'accueil des classes.
 *
 * `ClasseNiveau.vue` portait trois boutons morts : « Importer des étudiants »
 * appelait `openImport(classe)`, **fonction jamais définie** ; « Imprimer listes »
 * et « + Nouvelle Classe » n'avaient aucun `@click`. Les deux derniers relevaient
 * de toute façon du module Structure académique, qui gère déjà la création de
 * classes — les proposer ici dédoublait la responsabilité.
 *
 * Ce qui reste est ce que l'onglet apporte réellement : voir, avant d'inscrire,
 * quelle classe a encore de la place.
 */

const classeStore = useClasseStore();
const { items: classes, loading } = storeToRefs(classeStore);

const searchQuery = ref('');
const selectedClasse = ref(null);

onMounted(() => classeStore.fetchAll());

/** @param {any} classe */
const effectif = (classe) => Number(classe.nb_etudiants ?? 0);

/** @param {any} classe */
const capacite = (classe) => Number(classe.capacite_max ?? 0);

/** @param {any} classe @returns {number} Taux de remplissage en %, 0 si capacité inconnue. */
function taux(classe) {
  const max = capacite(classe);
  if (max <= 0) return 0;
  return Math.round((effectif(classe) / max) * 100);
}

/** Une classe est surchargée dès que son effectif dépasse sa capacité déclarée. */
const estSurchargee = (classe) => capacite(classe) > 0 && effectif(classe) > capacite(classe);

const filtered = computed(() => {
  const search = searchQuery.value.toLowerCase().trim();
  if (!search) return classes.value;

  return classes.value.filter((classe) =>
    [classe.code, classe.filiere_nom, classe.niveau_code]
      .filter(Boolean)
      .some((field) => String(field).toLowerCase().includes(search))
  );
});

const totalCapacite = computed(() =>
  filtered.value.reduce((total, classe) => total + capacite(classe), 0)
);

const totalEffectif = computed(() =>
  filtered.value.reduce((total, classe) => total + effectif(classe), 0)
);

const surchargees = computed(() => filtered.value.filter(estSurchargee).length);

/** @param {any} classe @returns {string} */
function progressClass(classe) {
  if (estSurchargee(classe)) return 'bg-danger';

  const value = taux(classe);
  if (value >= 90) return 'bg-warning';
  if (value >= 50) return 'bg-success';
  return 'bg-primary';
}

const exportRows = computed(() =>
  filtered.value.map((classe) => ({
    Classe: classe.code,
    Filière: classe.filiere_nom ?? '—',
    Niveau: classe.niveau_code ?? '—',
    Effectif: effectif(classe),
    Capacité: capacite(classe) || '—',
    'Taux de remplissage': capacite(classe) > 0 ? `${taux(classe)} %` : '—',
    Surchargée: estSurchargee(classe) ? 'Oui' : 'Non',
  }))
);

const { exportToExcel, exportToPdf } = useTableExport({
  rows: exportRows,
  title: 'Capacité d’accueil des classes',
  fileBaseName: 'classes_capacite',
});
</script>

<template>
  <div>
    <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
      <div>
        <h4 class="fw-bold mb-1">Capacité des classes</h4>
        <p class="text-muted small mb-0">
          Effectifs, capacités et places restantes, avant d'affecter de nouveaux inscrits.
        </p>
      </div>
      <ExportMenu :disabled="filtered.length === 0" @excel="exportToExcel" @pdf="exportToPdf" />
    </div>

    <div class="row g-3 mb-4">
      <div class="col-md-4">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-body">
            <span class="text-muted small fw-semibold text-uppercase d-block mb-1"> Classes </span>
            <h3 class="fw-bold text-dark mb-0 font-monospace">{{ filtered.length }}</h3>
          </div>
        </div>
      </div>

      <div class="col-md-4">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-body">
            <span class="text-muted small fw-semibold text-uppercase d-block mb-1">
              Places occupées
            </span>
            <h3 class="fw-bold text-dark mb-0 font-monospace">
              {{ totalEffectif }}
              <small class="text-muted fs-6">/ {{ totalCapacite || '—' }}</small>
            </h3>
          </div>
        </div>
      </div>

      <div class="col-md-4">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-body">
            <span class="text-muted small fw-semibold text-uppercase d-block mb-1">
              Classes surchargées
            </span>
            <h3
              class="fw-bold mb-0 font-monospace"
              :class="surchargees > 0 ? 'text-danger' : 'text-dark'"
            >
              {{ surchargees }}
            </h3>
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
      v-else-if="filtered.length === 0"
      title="Aucune classe"
      description="Aucune classe ne correspond à ces critères."
    />

    <div v-else class="card border-0 shadow-sm overflow-hidden">
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead class="bg-light">
              <tr>
                <th class="ps-4 py-3">Classe</th>
                <th>Filière</th>
                <th>Niveau</th>
                <th class="text-center">Effectif / Capacité</th>
                <th style="width: 220px">Remplissage</th>
                <th class="text-end pe-4">Actions</th>
              </tr>
            </thead>

            <tbody>
              <tr v-for="classe in filtered" :key="classe.id">
                <td class="ps-4">
                  <span class="code-box">{{ classe.code }}</span>
                  <span
                    v-if="estSurchargee(classe)"
                    class="badge bg-danger-subtle text-danger ms-2"
                  >
                    Surchargée
                  </span>
                </td>

                <td class="small">{{ classe.filiere_nom ?? '—' }}</td>
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
                        :class="progressClass(classe)"
                        :style="{ width: Math.min(taux(classe), 100) + '%' }"
                        :aria-valuenow="taux(classe)"
                        aria-valuemin="0"
                        aria-valuemax="100"
                      ></div>
                    </div>
                  </div>
                  <span v-else class="text-muted small">Capacité non renseignée</span>
                </td>

                <td class="text-end pe-4">
                  <button class="btn btn-sm btn-outline-primary" @click="selectedClasse = classe">
                    Voir les étudiants
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <ClasseEtudiantsModal :classe="selectedClasse" @update:classe="selectedClasse = $event" />
  </div>
</template>

<style scoped>
.code-box {
  background: #f1f5f9;
  color: #475569;
  padding: 3px 10px;
  border-radius: 4px;
  font-size: 0.78rem;
  font-weight: 700;
}

.table thead th {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: #6c757d;
  border: none;
}
</style>
