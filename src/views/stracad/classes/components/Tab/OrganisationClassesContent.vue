<template>
  <div class="row">
    <div class="col-12 mb-3">
      <h4>Arbre d'organisation des classes</h4>
      <p class="text-muted">
        Suivi global des structures pédagogiques : répartition des effectifs par cycle, filière et niveau.
      </p>
    </div>

    <div class="col-12 mb-4" v-if="!loading && organisationTree.length > 0">
      <div class="card border-0 shadow-sm bg-light-subtle">
        <div class="card-body p-3">
          <div class="row g-2">
            <div class="col-md-6">
              <div class="input-group bg-white rounded shadow-sm">
                <span class="input-group-text bg-white border-0">
                  <i class="mdi mdi-magnify text-muted"></i>
                </span>
                <input
                  v-model="searchQuery"
                  type="text"
                  class="form-control border-0"
                  placeholder="Rechercher par classe, filière ou cycle..."
                />
              </div>
            </div>
            <div class="col-md-3">
              <select v-model="filterCycle" class="form-select bg-white border-0 shadow-sm">
                <option value="">Tous les cycles</option>
                <option v-for="c in uniqueCycles" :key="c" :value="c">{{ c }}</option>
              </select>
            </div>
            <div class="col-md-3">
              <select v-model="filterStatut" class="form-select bg-white border-0 shadow-sm">
                <option value="">Tous les statuts</option>
                <option value="OUVERTE">OUVERTE</option>
                <option value="VIDE">VIDE</option>
                <option value="FERMÉE">FERMÉE</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="col-12">
      <div class="table-responsive card border-0 shadow-sm">
        <table class="table align-middle mb-0 table-hover">
          <thead class="table-light">
            <tr>
              <th class="ps-3">Classe & Niveau</th>
              <th>Filière</th>
              <th>Structure / Cycle</th>
              <th class="text-center">Effectif / Capacité</th>
              <th>Remplissage</th>
              <th class="text-end pe-3">Statut</th>
            </tr>
          </thead>

          <tbody>
            <tr v-if="loading">
              <td colspan="6" class="text-center py-5">
                <div class="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
                <span class="text-muted">Chargement de l'arbre d'organisation...</span>
              </td>
            </tr>

            <tr v-else-if="filteredTree.length === 0">
              <td colspan="6" class="text-center py-5">
                <div class="d-flex flex-column align-items-center py-3">
                  <i class="mdi mdi-file-tree-outline text-muted" style="font-size: 3rem; opacity: 0.3"></i>
                  <div class="text-muted mt-2 small">Aucune donnée d'organisation disponible</div>
                </div>
              </td>
            </tr>

            <tr v-else v-for="item in filteredTree" :key="item.id">
              <td class="ps-3">
                <div class="d-flex align-items-center">
                  <span class="badge bg-primary text-white me-2 font-monospace px-2 py-1">{{ item.classe }}</span>
                  <span class="badge bg-secondary-subtle text-secondary font-monospace">{{ item.niveau }}</span>
                </div>
              </td>
              <td>
                <div class="fw-semibold text-dark">{{ item.filiere }}</div>
              </td>
              <td>
                <div class="text-dark small mb-0">{{ item.cycle }}</div>
                <small class="badge bg-light text-muted border font-monospace text-xs">{{ item.cycle_code }}</small>
              </td>
              <td class="text-center">
                <span class="fw-bold text-dark">{{ item.effectif }}</span>
                <span class="text-muted"> / {{ item.capacite }}</span>
              </td>
              <td>
                <div class="d-flex align-items-center" style="min-width: 130px;">
                  <div class="progress w-100 me-2" style="height: 6px;">
                    <div
                      class="progress-bar"
                      :class="getProgressBarClass(item.taux)"
                      :style="{ width: Math.min(parseFloat(item.taux), 100) + '%' }"
                    ></div>
                  </div>
                  <small class="fw-semibold text-muted">{{ item.taux }}%</small>
                </div>
              </td>
              <td class="text-end pe-3">
                <span class="badge rounded-pill px-2 py-1" :class="getStatutBadgeClass(item.statut)">
                  {{ item.statut }}
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
import { ref, computed, onMounted } from 'vue';
// Assure-toi que le chemin d'importation correspond à ton projet
import { useClasseStore } from '@/stores/academiqueStore/classeStore'; 

const classeStore = useClasseStore();

// Filtres
const searchQuery = ref('');
const filterCycle = ref('');
const filterStatut = ref('');

// Cycle de vie : chargement des données depuis le store
onMounted(async () => {
  await classeStore.fetchOrganisationTree();
});

// Réactivité avec Pinia
const loading = computed(() => classeStore.loading);
const organisationTree = computed(() => classeStore.organisationTree || []);

// Génération de la liste unique des cycles pour le filtre dynamique dropdown
const uniqueCycles = computed(() => {
  const cycles = organisationTree.value.map(item => item.cycle_code);
  return [...new Set(cycles)].filter(Boolean);
});

// Logique combinée de recherche et de filtrage
const filteredTree = computed(() => {
  return organisationTree.value.filter((item) => {
    const search = searchQuery.value.toLowerCase();
    
    const matchSearch = 
      item.classe.toLowerCase().includes(search) ||
      item.filiere.toLowerCase().includes(search) ||
      item.cycle.toLowerCase().includes(search);
      
    const matchCycle = !filterCycle.value || item.cycle_code === filterCycle.value;
    const matchStatut = !filterStatut.value || item.statut === filterStatut.value;

    return matchSearch && matchCycle && matchStatut;
  });
});

// Utilities : Classes de couleur de la barre de progression
const getProgressBarClass = (taux) => {
  const t = parseFloat(taux);
  if (t === 0) return 'bg-light';
  if (t < 40) return 'bg-info';
  if (t < 85) return 'bg-success';
  if (t < 100) return 'bg-warning';
  return 'bg-danger';
};

// Utilities : Classes de couleur du badge de statut
const getStatutBadgeClass = (statut) => {
  const map = {
    'OUVERTE': 'bg-success-subtle text-success border border-success-subtle',
    'VIDE': 'bg-secondary-subtle text-secondary border border-secondary-subtle',
    'FERMÉE': 'bg-danger-subtle text-danger border border-danger-subtle'
  };
  return map[statut] || 'bg-light text-dark';
};
</script>

<style scoped>
.text-xs {
  font-size: 0.75rem;
}
</style>