<script setup>
import { computed, onMounted, ref } from 'vue';
import EmptyState from '@/shared/components/EmptyState.vue';
import ExportMenu from '@/shared/components/ExportMenu.vue';
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue';
import Pagination from '@/components/shared/Pagination.vue';
import { useTableExport } from '@/shared/composables/useTableExport';
import { usePagination } from '@/shared/composables/usePagination';
import { couleurSerie, formatNombre, tonClasse } from '@/shared/utils/remplissage';
import { HEURES_MINIMALES, useSemestreAnalytique } from '../../composables/useSemestreAnalytique';

/**
 * Analytique semestrielle.
 *
 * Deux changements de fond, documentés dans `useSemestreAnalytique` :
 * le sélecteur d'année vient de `GET /annees` — donc **toutes** les années
 * enregistrées, y compris les antérieures — au lieu d'un calcul sur la date du
 * jour limité à deux exercices ; et les trois valeurs fabriquées de la réponse
 * (assiduité constante, moyenne aléatoire, typologie à une seule ligne) ne sont
 * plus affichées : ce qui les remplace est calculé à partir de la matrice.
 */

const {
  charger,
  loading,
  anneeSelectionnee,
  options,
  analytics,
  lignes,
  indicateurs,
  parSemestre,
  parFiliere,
  analyses,
} = useSemestreAnalytique();

const recherche = ref('');
const filtreSemestre = ref('');

const semestresDisponibles = computed(() => [
  ...new Set(lignes.value.map((ligne) => ligne.semestre)),
]);

const lignesFiltrees = computed(() => {
  const terme = recherche.value.trim().toLowerCase();

  return lignes.value.filter((ligne) => {
    const correspondRecherche =
      !terme ||
      [ligne.filiere, ligne.niveau, ligne.semestre].some((champ) =>
        String(champ ?? '')
          .toLowerCase()
          .includes(terme)
      );
    const correspondSemestre = !filtreSemestre.value || ligne.semestre === filtreSemestre.value;

    return correspondRecherche && correspondSemestre;
  });
});

const { page, itemsPerPage, startIndex, paginated } = usePagination(lignesFiltrees, {
  perPage: 10,
  resetKey: () => [recherche.value, filtreSemestre.value, anneeSelectionnee.value],
});

const aucuneDonnee = computed(() => !lignes.value.length);

const { exportToExcel, exportToPdf } = useTableExport({
  rows: computed(() =>
    lignesFiltrees.value.map((ligne) => ({
      Semestre: ligne.semestre,
      Filière: ligne.filiere,
      Niveau: ligne.niveau,
      "Nombre d'UE": ligne.nbUes,
      'Volume total': `${ligne.heures} h`,
      'Moyenne par UE': `${ligne.heuresParUe.toFixed(1)} h`,
      Maquette: ligne.statutMaquette,
    }))
  ),
  title: "Charge d'enseignement par semestre",
  fileBaseName: 'charge_enseignement',
  filters: () => [
    { label: 'Année académique', value: anneeSelectionnee.value || '—' },
    { label: 'Semestre', value: filtreSemestre.value || 'Tous' },
    { label: 'Maquettes', value: lignesFiltrees.value.length },
    { label: 'Volume horaire', value: `${indicateurs.value.volumeHoraire} h` },
  ],
});

onMounted(() => charger());
</script>

<template>
  <div class="semester-stats-container">
    <div class="row mb-4">
      <div class="col-12 d-flex justify-content-between align-items-center flex-wrap gap-3">
        <div>
          <h3 class="fw-bold text-dark mb-1">Analytique &amp; statistiques semestrielles</h3>
          <p class="text-muted text-sm mb-0">
            Volume horaire, unités d'enseignement et couverture des maquettes, année académique par
            année académique.
          </p>
        </div>

        <div class="d-flex align-items-center gap-2">
          <ExportMenu :disabled="aucuneDonnee" @excel="exportToExcel" @pdf="exportToPdf" />
          <label for="annee-analytique" class="text-xs text-muted text-uppercase fw-bold mb-0">
            Année :
          </label>
          <select
            id="annee-analytique"
            v-model="anneeSelectionnee"
            class="form-select text-sm bg-white border border-secondary-subtle py-1.5 px-3 shadow-none style-select"
            style="width: auto"
            :disabled="loading || !options.length"
          >
            <option v-if="!options.length" value="">Aucune année enregistrée</option>
            <option v-for="option in options" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </div>
      </div>
    </div>

    <LoadingSpinner v-if="loading && !analytics" />

    <EmptyState
      v-else-if="!options.length"
      title="Aucune année académique enregistrée"
      description="Créez une année académique pour consulter la charge d'enseignement d'une période."
    />

    <EmptyState
      v-else-if="aucuneDonnee"
      :title="`Aucune donnée pour ${anneeSelectionnee}`"
      description="Aucun module n'est rattaché à un semestre de cette année académique. Rattachez des unités d'enseignement depuis l'onglet « Unités d'enseignement »."
    />

    <template v-else>
      <!-- Indicateurs de tête -->
      <div class="row g-3 mb-4">
        <div class="col-xl-3 col-sm-6">
          <div
            class="card border-0 shadow-sm bg-white rounded-4 p-3 h-100 border-start border-4 border-primary"
          >
            <div class="d-flex align-items-center justify-content-between">
              <div>
                <span class="text-xs text-muted text-uppercase fw-bold tracking-wider d-block mb-1">
                  Volume horaire global
                </span>
                <h3 class="fw-bold text-dark mb-0 font-monospace">
                  {{ formatNombre(indicateurs.volumeHoraire) }}
                  <small class="fs-6 text-muted">h</small>
                </h3>
              </div>
              <div class="kpi-icon-wrapper bg-soft-primary text-primary">
                <i class="mdi mdi-clock-outline"></i>
              </div>
            </div>
            <div class="mt-2 text-xs text-muted">
              Heures cumulées sur {{ indicateurs.nbSemestres }} semestre(s)
            </div>
          </div>
        </div>

        <div class="col-xl-3 col-sm-6">
          <div
            class="card border-0 shadow-sm bg-white rounded-4 p-3 h-100 border-start border-4 border-warning"
          >
            <div class="d-flex align-items-center justify-content-between">
              <div>
                <span class="text-xs text-muted text-uppercase fw-bold tracking-wider d-block mb-1">
                  Unités d'enseignement
                </span>
                <h3 class="fw-bold text-dark mb-0 font-monospace">
                  {{ formatNombre(indicateurs.totalUes) }}
                  <small class="fs-6 text-muted">UE</small>
                </h3>
              </div>
              <div class="kpi-icon-wrapper bg-soft-warning text-warning">
                <i class="mdi mdi-book-open-variant"></i>
              </div>
            </div>
            <div class="mt-2 text-xs text-muted">
              {{ indicateurs.heuresParUe.toFixed(1) }} h en moyenne par unité programmée
            </div>
          </div>
        </div>

        <div class="col-xl-3 col-sm-6">
          <div
            class="card border-0 shadow-sm bg-white rounded-4 p-3 h-100 border-start border-4 border-info"
          >
            <div class="d-flex align-items-center justify-content-between">
              <div>
                <span class="text-xs text-muted text-uppercase fw-bold tracking-wider d-block mb-1">
                  Corps enseignant
                </span>
                <h3 class="fw-bold text-dark mb-0 font-monospace">
                  {{ formatNombre(indicateurs.corpsEnseignant) }}
                  <small class="fs-6 text-muted">ens.</small>
                </h3>
              </div>
              <div class="kpi-icon-wrapper bg-soft-info text-info">
                <i class="mdi mdi-tie"></i>
              </div>
            </div>
            <div class="mt-2 text-xs text-muted">Intervenants distincts sur la période</div>
          </div>
        </div>

        <div class="col-xl-3 col-sm-6">
          <div
            class="card border-0 shadow-sm bg-white rounded-4 p-3 h-100 border-start border-4"
            :class="
              indicateurs.nbConformes === indicateurs.nbMaquettes
                ? 'border-success'
                : 'border-danger'
            "
          >
            <div class="d-flex align-items-center justify-content-between">
              <div>
                <span class="text-xs text-muted text-uppercase fw-bold tracking-wider d-block mb-1">
                  Maquettes conformes
                </span>
                <h3
                  class="fw-bold mb-0 font-monospace"
                  :class="
                    indicateurs.nbConformes === indicateurs.nbMaquettes
                      ? 'text-success'
                      : 'text-danger'
                  "
                >
                  {{ indicateurs.nbConformes }}
                  <small class="fs-6 text-muted">/ {{ indicateurs.nbMaquettes }}</small>
                </h3>
              </div>
              <div class="kpi-icon-wrapper bg-soft-success text-success">
                <i class="mdi mdi-clipboard-check-outline"></i>
              </div>
            </div>
            <!--
              L'ancien encart annonçait un « taux d'assiduité global » de 92,4 % :
              la fonction SQL renvoie cette constante en dur, et aucune table de
              présence n'existe en base. Il cède la place au seul contrôle que la
              réponse permet vraiment.
            -->
            <div class="mt-2 text-xs text-muted">
              Volume minimal attendu : {{ HEURES_MINIMALES }} h par maquette
            </div>
          </div>
        </div>
      </div>

      <div class="row g-4 mb-4">
        <!-- Charge d'enseignement -->
        <div class="col-xl-8">
          <div class="card border-0 shadow-sm bg-white rounded-4 p-4 h-100">
            <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
              <h5 class="fw-bold text-dark mb-0">Charge d'enseignement par semestre</h5>
              <span class="badge bg-light text-secondary border font-monospace text-xs px-2 py-1">
                {{ lignesFiltrees.length }} maquette(s)
              </span>
            </div>

            <div class="row g-2 mb-3">
              <div class="col-md-7">
                <div class="input-group input-group-sm">
                  <span class="input-group-text bg-white border-end-0 text-muted">
                    <i class="mdi mdi-magnify"></i>
                  </span>
                  <input
                    v-model="recherche"
                    type="text"
                    class="form-control border-start-0 ps-0"
                    placeholder="Rechercher une filière, un niveau…"
                  />
                </div>
              </div>
              <div class="col-md-5">
                <select v-model="filtreSemestre" class="form-select form-select-sm">
                  <option value="">Tous les semestres</option>
                  <option v-for="code in semestresDisponibles" :key="code" :value="code">
                    {{ code }}
                  </option>
                </select>
              </div>
            </div>

            <EmptyState
              v-if="!lignesFiltrees.length"
              title="Aucune maquette ne correspond"
              description="Modifiez votre recherche ou changez de semestre."
              :size="80"
            />

            <template v-else>
              <div class="table-responsive">
                <table class="table align-middle text-center mb-0">
                  <thead class="table-light-header text-secondary">
                    <tr>
                      <th class="text-start ps-3" style="width: 60px">#</th>
                      <th class="text-start" style="width: 12%">Semestre</th>
                      <th class="text-start" style="width: 28%">Filière cible</th>
                      <th style="width: 12%">Nombre d'UE</th>
                      <th style="width: 14%">Volume total</th>
                      <th style="width: 14%">Moy. par UE</th>
                      <th class="text-end pe-3" style="width: 16%">Maquette</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(ligne, index) in paginated" :key="ligne.cle" class="stats-row">
                      <td class="text-start ps-3 text-muted">{{ startIndex + index + 1 }}</td>

                      <td class="text-start font-monospace fw-bold text-primary">
                        {{ ligne.semestre }}
                      </td>

                      <td class="text-start">
                        <div
                          class="fw-bold text-dark text-truncate"
                          style="max-width: 220px"
                          :title="ligne.filiere"
                        >
                          {{ ligne.filiere }}
                        </div>
                        <small class="text-xs text-muted">{{ ligne.niveau }}</small>
                      </td>

                      <td class="font-monospace fw-bold text-secondary">{{ ligne.nbUes }}</td>

                      <td class="font-monospace text-dark fw-bold">{{ ligne.heures }} h</td>

                      <!--
                        L'ancienne colonne « Moy. Validation » affichait
                        `moyenne_generale`, que la fonction SQL tire d'un
                        `RANDOM()` : deux affichages successifs ne donnaient pas
                        le même chiffre. Le volume moyen par UE, lui, se déduit
                        des deux colonnes précédentes.
                      -->
                      <td class="font-monospace text-secondary">
                        {{ ligne.heuresParUe.toFixed(1) }} h
                      </td>

                      <td class="text-end pe-3">
                        <span
                          class="badge text-xs px-2 py-1 rounded-pill fw-semibold"
                          :class="
                            ligne.conforme
                              ? 'bg-success-subtle text-success border border-success-subtle'
                              : 'bg-danger-subtle text-danger border border-danger-subtle'
                          "
                          :title="`Seuil de conformité : ${HEURES_MINIMALES} h`"
                        >
                          {{ ligne.statutMaquette }}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <Pagination
                v-model="page"
                v-model:items-per-page="itemsPerPage"
                :total-items="lignesFiltrees.length"
              />
            </template>
          </div>
        </div>

        <!-- Répartition du volume -->
        <div class="col-xl-4">
          <div class="card border-0 shadow-sm bg-white rounded-4 p-4 h-100">
            <h5 class="fw-bold text-dark mb-1">Répartition du volume horaire</h5>
            <!--
              L'encadré « Typologie des enseignements » présentait
              `analyticsData.typology` comme une répartition par type d'unité.
              La fonction SQL ne groupe sur rien : elle renvoie une ligne unique,
              donc toujours « Volume Groupe 1 — 100 % ». La matrice, elle, permet
              une vraie répartition.
            -->
            <p class="text-muted text-xs mb-3">
              Part de chaque semestre, puis des filières les plus chargées.
            </p>

            <div class="d-flex flex-column gap-3 mb-4">
              <div v-for="(groupe, index) in parSemestre" :key="groupe.libelle">
                <div class="d-flex justify-content-between align-items-center text-sm mb-1">
                  <span class="text-dark fw-bold">
                    <i
                      class="mdi mdi-circle me-2 text-xs"
                      :style="{ color: couleurSerie(index) }"
                    ></i>
                    {{ groupe.libelle }}
                  </span>
                  <span class="text-muted font-monospace text-xs">
                    {{ groupe.heures }} h ({{ groupe.part.toFixed(1) }} %)
                  </span>
                </div>
                <div class="progress" style="height: 6px">
                  <div
                    class="progress-bar"
                    role="progressbar"
                    :style="{ width: `${groupe.part}%`, backgroundColor: couleurSerie(index) }"
                    :aria-valuenow="groupe.part"
                    aria-valuemin="0"
                    aria-valuemax="100"
                  ></div>
                </div>
                <div class="text-xs text-muted mt-1">
                  {{ groupe.nbUes }} UE · {{ groupe.nbConformes }}/{{ groupe.nbLignes }} maquette(s)
                  conforme(s)
                </div>
              </div>
            </div>

            <h6 class="fw-bold text-secondary text-uppercase text-xs tracking-wider mb-2">
              Filières les plus chargées
            </h6>
            <ul class="list-unstyled mb-0">
              <li
                v-for="groupe in parFiliere.slice(0, 5)"
                :key="groupe.libelle"
                class="d-flex justify-content-between align-items-center py-1 border-bottom"
              >
                <span class="text-dark text-sm text-truncate" :title="groupe.libelle">
                  {{ groupe.libelle }}
                </span>
                <span class="text-muted font-monospace text-xs ms-2">
                  {{ groupe.heures }} h · {{ groupe.part.toFixed(1) }} %
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Lecture des chiffres -->
      <div class="card border-0 shadow-sm bg-white rounded-4 p-4">
        <h6 class="fw-bold mb-3 small text-uppercase text-secondary tracking-wider">
          <i class="bi bi-lightbulb text-warning me-2"></i>Lecture des chiffres
        </h6>

        <div class="row g-3">
          <div v-for="analyse in analyses" :key="analyse.titre" class="col-md-6">
            <div class="border-start border-3 ps-3 py-1 h-100" :class="tonClasse(analyse.ton)">
              <span class="d-block fw-semibold small">
                <i class="bi me-1" :class="analyse.icone"></i>{{ analyse.titre }}
              </span>
              <span class="text-muted text-xs">{{ analyse.message }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.bg-soft-primary {
  background-color: rgba(0, 123, 255, 0.08);
}
.bg-soft-success {
  background-color: rgba(40, 167, 69, 0.08);
}
.bg-soft-info {
  background-color: rgba(23, 162, 184, 0.08);
}
.bg-soft-warning {
  background-color: rgba(255, 193, 7, 0.08);
}

.text-sm {
  font-size: 13px !important;
}
.text-xs {
  font-size: 11.5px !important;
}
.tracking-wider {
  letter-spacing: 0.8px;
}

.kpi-icon-wrapper {
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  font-size: 20px;
}

.table-light-header th {
  font-size: 11.5px;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  background-color: #f8f9fa;
  font-weight: 700;
  border: none;
}

.table tbody tr td {
  padding-top: 13px !important;
  padding-bottom: 13px !important;
}
.stats-row {
  border-bottom: 1px solid #f1f3f5;
  transition: background-color 0.1s ease;
}
.stats-row:hover {
  background-color: rgba(0, 0, 0, 0.005);
}

.rounded-4 {
  border-radius: 0.2rem !important;
}
.style-select {
  border-radius: 0.15rem;
}
</style>
