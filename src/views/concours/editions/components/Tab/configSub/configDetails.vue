<template>
  <div class="">
    <div class="row">
      <div class="col-12">
        <!-- En-tête -->
        <div class="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 class="page-title">Editions concours --</h2>
            <p class="page-subtitle text-muted">
              Details des concours et editions candidatss, epreuves et resultats
            </p>
          </div>
          <div class="d-flex gap-2">
            <button
          class="btn btn-sm btn-light border shadow-sm rounded-pill px-3"
          @click="$router.back()"
        >
          <i class="bi bi-arrow-left-short fs-5 align-middle"></i>
          <span class="align-middle ms-1">Retour au concours</span>
        </button>
          </div>
        </div>
        <!-- Carte Principale -->
        <div class="card">
          <div class="card-body dashboard-tabs p-0">
            <TabDetail />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import TabDetail from './configTab.vue';
</script>

<style scoped>
.planification-container {
  padding: 20px;
}

.page-title {
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 0;
}

.page-subtitle {
  font-size: 0.9rem;
}

.filter-section {
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
}

.nav-tabs .nav-link {
  color: #495057;
  font-weight: 500;
  border: none;
  padding: 0.75rem 1.5rem;
}

.nav-tabs .nav-link.active {
  color: #4c74f4;
  border-bottom: 3px solid #4c74f4;
  background-color: transparent;
}

.table th {
  font-weight: 600;
  text-transform: uppercase;
  font-size: 0.8rem;
  color: #6c757d;
}

.badge {
  padding: 0.35em 0.65em;
  font-size: 0.75em;
  font-weight: 500;
  border-radius: 50rem;
}
</style>
