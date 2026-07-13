<template>
  <div class="row">
    <div class="col-12 mb-3">
      <h4>Organisation des filières</h4>
      <p class="text-muted">
        Vue d’ensemble des filières par cycle avec suivi des capacités et des effectifs.
      </p>
    </div>

    <div class="col-12">
      <div class="table-responsive card border-0 shadow-sm">
        <table class="table align-middle mb-0 table-hover">
          <thead class="table-light">
            <tr>
              <th class="ps-3">Filière</th>
              <th>Responsable</th>
              <th>Effectifs</th>
              <th>Capacité</th>
              <th>Taux de remplissage</th>
              <th class="text-end pe-3">Statut</th>
            </tr>
          </thead>

          <tbody>
            <tr v-if="loading">
              <td colspan="6" class="text-center py-5">
                <div class="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
                <span class="text-muted">Chargement de l'organisation...</span>
              </td>
            </tr>

            <tr v-else-if="organisationFilieres.length === 0">
              <td colspan="6" class="text-center py-5">
                <div class="d-flex flex-column align-items-center">
                  <img
                    src="/img/empty-box.svg"
                    alt="Aucune donnée"
                    class="mb-2"
                    style="width: 80px"
                  />
                  <div class="text-muted small">Aucune filière trouvée</div>
                </div>
              </td>
            </tr>

            <tr v-for="org in organisationFilieres" v-else :key="org.id">
              <td class="ps-3 fw-bold text-dark">{{ org.filiere }}</td>
              <td>
                <span
                  :class="org.responsable === 'Non assigné' ? 'text-muted italic' : 'fw-medium'"
                >
                  {{ org.responsable }}
                </span>
              </td>
              <td>{{ org.effectif }}</td>
              <td>{{ org.capacite }}</td>
              <td>
                <div class="d-flex align-items-center" style="min-width: 150px">
                  <div class="progress w-100 me-2" style="height: 6px">
                    <div
                      class="progress-bar"
                      :class="getProgressClass(org.taux)"
                      :style="{ width: org.taux + '%' }"
                    ></div>
                  </div>
                  <small class="fw-semibold">{{ org.taux }}%</small>
                </div>
              </td>
              <td class="text-end pe-3">
                <span class="badge rounded-pill px-2 py-1" :class="getBadgeClass(org.statut)">
                  {{ org.statut }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useFiliereStore } from '../../store';

const filiereStore = useFiliereStore();

const loading = computed(() => filiereStore.loading);
const organisationFilieres = computed(() => filiereStore.organisation);

// Attribution d'une couleur à la barre de progression selon le remplissage
const getProgressClass = (taux) => {
  const t = parseFloat(taux);
  if (t < 50) return 'bg-info';
  if (t < 85) return 'bg-success';
  if (t < 100) return 'bg-warning';
  return 'bg-danger';
};

// Style personnalisé pour les badges selon le statut backend
const getBadgeClass = (statut) => {
  const map = {
    OUVERTE: 'bg-success-subtle text-success border border-success',
    VIDE: 'bg-secondary-subtle text-secondary border border-secondary',
    FERMÉE: 'bg-danger-subtle text-danger border border-danger',
  };
  return map[statut] || 'bg-light text-dark';
};

onMounted(() => filiereStore.fetchOrganisation());
</script>
