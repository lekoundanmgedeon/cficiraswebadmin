<script setup>
import { computed, onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { formatMonthYear } from '@/shared/utils/date';
import { useAnneeStore } from '../../store';
import {
  STATUT_HISTORIQUE,
  STATUTS_EN_COURS,
  STATUTS_PASSES,
  mapStatutHistorique,
} from '../../constants';

/**
 * Historique chronologique des années académiques.
 *
 * Les libellés et couleurs de statut vivent désormais dans `constants.js` :
 * l'endpoint `/history` utilise un vocabulaire différent du CRUD, et le mélange
 * des deux dans les composants était une source de bugs silencieux (un badge
 * « Inconnu » s'affichait dès qu'un statut d'un vocabulaire arrivait dans un
 * composant écrit pour l'autre).
 */

const anneeStore = useAnneeStore();
const { history, loading } = storeToRefs(anneeStore);

const searchQuery = ref('');
const filterStatut = ref('');
const filterPeriode = ref('');

onMounted(() => anneeStore.fetchHistory());

const anneesFiltrees = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();

  return history.value.filter((annee) => {
    // `code` peut manquer sur une ligne mal formée : on ne veut pas planter le
    // filtre entier pour autant.
    const matchesSearch = !query || (annee.code ?? '').toLowerCase().includes(query);
    const matchesStatut = !filterStatut.value || annee.statut === filterStatut.value;

    let matchesPeriode = true;
    if (filterPeriode.value === 'current') {
      matchesPeriode = STATUTS_EN_COURS.includes(annee.statut);
    } else if (filterPeriode.value === 'previous') {
      matchesPeriode = STATUTS_PASSES.includes(annee.statut);
    }

    return matchesSearch && matchesStatut && matchesPeriode;
  });
});

function resetFilters() {
  searchQuery.value = '';
  filterStatut.value = '';
  filterPeriode.value = '';
}

/**
 * Avancement de l'année, en pourcentage.
 * @param {any} annee
 * @returns {number}
 */
function calculateProgress(annee) {
  if (STATUTS_PASSES.includes(annee.statut)) return 100;
  if (annee.statut === STATUT_HISTORIQUE.EN_PREPARATION) return 0;

  const debut = new Date(annee.debut).getTime();
  const fin = new Date(annee.fin).getTime();
  const maintenant = Date.now();

  if (Number.isNaN(debut) || Number.isNaN(fin) || fin <= debut) return 0;
  if (maintenant <= debut) return 0;
  if (maintenant >= fin) return 100;

  return Math.round(((maintenant - debut) / (fin - debut)) * 100);
}

/** @param {string} statut */
const getProgressBarClass = (statut) =>
  statut === STATUT_HISTORIQUE.ACTIVE ? 'bg-success' : 'bg-secondary';

/** @param {any} annee @param {'nb_etudiants'|'nb_classes'} key @param {[string, string]} labels */
function pluralize(annee, key, [singular, plural]) {
  const count = annee[key] ?? 0;
  return `${count} ${count > 1 ? plural : singular}`;
}
</script>

<template>
  <div class="row">
    <div class="col-12 mb-4">
      <h4 class="fw-bold mb-1">Historique des années académiques</h4>
      <p class="text-muted small mb-0">Consultez et archivez les cycles d'enseignement.</p>
    </div>

    <div class="col-12 mb-4">
      <div class="card border-0 shadow-sm">
        <div class="card-body bg-light rounded">
          <div class="row g-3">
            <div class="col-md-5">
              <div class="input-group bg-white rounded shadow-sm">
                <span class="input-group-text bg-white border-0">
                  <i class="mdi mdi-magnify"></i>
                </span>
                <input
                  v-model="searchQuery"
                  type="search"
                  class="form-control border-0"
                  placeholder="Rechercher par code (ex : 2024)…"
                  aria-label="Rechercher une année"
                />
              </div>
            </div>

            <div class="col-md-3">
              <select
                v-model="filterStatut"
                class="form-select border-0 shadow-sm"
                aria-label="Filtrer par statut"
              >
                <option value="">Tous les statuts</option>
                <option :value="STATUT_HISTORIQUE.ACTIVE">Année active</option>
                <option :value="STATUT_HISTORIQUE.EN_PREPARATION">En préparation</option>
                <option :value="STATUT_HISTORIQUE.TERMINEE">Terminée</option>
                <option :value="STATUT_HISTORIQUE.ARCHIVEE">Archivée</option>
              </select>
            </div>

            <div class="col-md-2">
              <select
                v-model="filterPeriode"
                class="form-select border-0 shadow-sm"
                aria-label="Filtrer par période"
              >
                <option value="">Toutes périodes</option>
                <option value="current">En cours</option>
                <option value="previous">Passées</option>
              </select>
            </div>

            <div class="col-md-2">
              <button class="btn btn-white w-100 shadow-sm border-0" @click="resetFilters">
                <i class="mdi mdi-filter-off-outline me-1"></i> Réinitialiser
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="col-12">
      <div v-if="loading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Chargement…</span>
        </div>
      </div>

      <div v-else-if="anneesFiltrees.length" class="timeline-container">
        <div
          v-for="annee in anneesFiltrees"
          :key="annee.id"
          class="annee-card mb-3 position-relative"
        >
          <div
            class="card border-0 shadow-sm overflow-hidden"
            :class="{
              'border-start border-4 border-success': annee.statut === STATUT_HISTORIQUE.ACTIVE,
            }"
          >
            <div class="card-body p-3">
              <div class="row align-items-center">
                <div class="col-md-2 border-end d-flex flex-column align-items-center text-center">
                  <span class="h5 fw-bold mb-0 text-primary">{{ annee.code }}</span>
                  <small class="text-muted fw-semibold">Session</small>
                </div>

                <div class="col-md-4 px-4">
                  <div class="d-flex justify-content-between mb-1">
                    <span class="small fw-bold">{{ formatMonthYear(annee.debut) }}</span>
                    <span class="small fw-bold">{{ formatMonthYear(annee.fin) }}</span>
                  </div>
                  <div class="progress" style="height: 6px">
                    <div
                      class="progress-bar"
                      :class="getProgressBarClass(annee.statut)"
                      :style="{ width: `${calculateProgress(annee)}%` }"
                    ></div>
                  </div>
                  <small class="text-muted mt-1 d-block text-center">Période académique</small>
                </div>

                <div class="col-md-3 text-center">
                  <span :class="mapStatutHistorique(annee.statut).class" class="px-3 py-2 rounded-pill">
                    {{ mapStatutHistorique(annee.statut).label }}
                  </span>
                </div>

                <div class="col-md-3 text-muted small border-start px-3">
                  <div>
                    <i class="mdi mdi-account-group me-1"></i>
                    {{ pluralize(annee, 'nb_etudiants', ['Étudiant', 'Étudiants']) }}
                  </div>
                  <div>
                    <i class="mdi mdi-school me-1"></i>
                    {{ pluralize(annee, 'nb_classes', ['Classe', 'Classes']) }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="text-center py-5 bg-white rounded shadow-sm">
        <img src="/img/empty-box.svg" alt="" style="width: 120px" class="mb-3 opacity-50" />
        <h5 class="text-muted">Aucune archive trouvée</h5>
        <p class="text-muted small mb-0">
          Modifiez vos filtres ou créez une nouvelle année académique.
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.annee-card {
  transition: transform 0.2s ease;
}

.annee-card:hover {
  transform: translateX(5px);
}

.btn-white {
  background: #fff;
}

.progress {
  background-color: #f0f2f4;
  border-radius: 10px;
}
</style>
