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
            <a href="#" class="text-secondary me-4"
              ><span class="feather-icon"
                ><svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="feather feather-printer"
                >
                  <polyline points="6 9 6 2 18 2 18 9"></polyline>
                  <path
                    d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"
                  ></path>
                  <rect x="6" y="14" width="12" height="8"></rect></svg></span
            ></a>
            <a href="#" class="text-secondary me-4"
              ><span class="feather-icon"
                ><svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="feather feather-download"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line></svg></span
            ></a>
            <router-link class="btn btn-outline-secondary" to="/edition-concours"
              >⬅ Retour</router-link
            >
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
