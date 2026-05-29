<template>
  <div>
    <ul class="nav nav-tabs px-4" role="tablist">
      <li class="nav-item">
        <a
          class="nav-link active"
          id="editions-tab"
          data-bs-toggle="tab"
          href="#editions"
          role="tab"
          aria-controls="editions"
          aria-selected="true"
          >Listes concours</a
        >
      </li>
      <li class="nav-item">
        <a
          class="nav-link"
          id="resultas-tab"
          data-bs-toggle="tab"
          href="#resultas"
          role="tab"
          aria-controls="resultas"
          aria-selected="false"
          >Resultats</a
        >
      </li>
      <li class="nav-item">
        <a
          class="nav-link"
          id="historique-tab"
          data-bs-toggle="tab"
          href="#historique"
          role="tab"
          aria-controls="historique"
          aria-selected="false"
        >
          Historique
        </a>
      </li>
    </ul>
    <div class="tab-content p-4">
      <div
        class="tab-pane fade show active"
        id="editions"
        role="tabpanel"
        aria-labelledby="editions-tab"
      >
        <editionsAnneesContent />
      </div>
      <div class="tab-pane fade" id="resultas" role="tabpanel" aria-labelledby="resultas-tab">
        <resultasContent />
      </div>
      <div
        class="tab-pane fade"
        id="statistiques"
        role="tabpanel"
        aria-labelledby="statistiques-tab"
      >
        <StatistiquesContent />
      </div>
      <div class="tab-pane fade" id="historique" role="tabpanel" aria-labelledby="historique-tab">
        <HistoriqueContent />
      </div>
    </div>
  </div>
</template>

<script setup>
import editionsAnneesContent from './Tab/editionsContent.vue';
import resultasContent from './Tab/resultasContent.vue';
import HistoriqueContent from './Tab/HistoriqueContent.vue';
</script>

<style scoped>
body {
  background-color: #f8f9fa;
  color: #212529;
}
.card {
  background-color: #ffffff;
  border: 1px solid #dee2e6;
  border-radius: 12px;
}
.btn-primary {
  background-color: #007bff;
  border-color: #007bff;
  color: #fff;
}
.btn-primary:hover {
  background-color: #0056b3;
  border-color: #004080;
}
.status-badge {
  padding: 0.5em 1em;
  border-radius: 20px;
  font-size: 0.85rem;
  color: #fff;
}
.status-draft {
  background-color: #6c757d;
}
.status-active {
  background-color: #0d6efd;
}
.table thead th {
  border-bottom: 2px solid #dee2e6;
}
</style>
