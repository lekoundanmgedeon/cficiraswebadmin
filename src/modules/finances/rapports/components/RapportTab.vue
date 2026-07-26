<template>
  <div>
    <ul class="nav nav-tabs px-4" role="tablist">
      <!-- Rapport des paiements -->
      <li class="nav-item">
        <a
          class="nav-link active"
          id="paiements-tab"
          data-bs-toggle="tab"
          href="#paiements"
          role="tab"
          aria-controls="paiements"
          aria-selected="true"
        >
          Rapports Paiements
        </a>
      </li>

      <!-- Rapport des factures -->
      <li class="nav-item">
        <a
          class="nav-link"
          id="factures-tab"
          data-bs-toggle="tab"
          href="#factures"
          role="tab"
          aria-controls="factures"
          aria-selected="false"
        >
          Rapports Factures
        </a>
      </li>

      <!-- Rapport global / bilans -->
      <li class="nav-item">
        <a
          class="nav-link"
          id="bilans-tab"
          data-bs-toggle="tab"
          href="#bilans"
          role="tab"
          aria-controls="bilans"
          aria-selected="false"
        >
          Bilans Financiers
        </a>
      </li>

      <li class="nav-item">
        <a
          class="nav-link"
          id="simulations-tab"
          data-bs-toggle="tab"
          href="#simulations"
          role="tab"
          aria-controls="simulations"
          aria-selected="false"
        >
          Simulations & Projections
        </a>
      </li>
      <!-- Assistant IA -->
      <li class="nav-item">
        <a
          class="nav-link"
          id="assistant-tab"
          data-bs-toggle="tab"
          href="#assistant"
          role="tab"
          aria-controls="assistant"
          aria-selected="false"
        >
          Assistant IA
        </a>
      </li>
    </ul>

    <div class="tab-content p-4">
      <!-- Rapport des paiements -->
      <div
        class="tab-pane fade show active"
        id="paiements"
        role="tabpanel"
        aria-labelledby="paiements-tab"
      >
        <RapportPaiements />
      </div>

      <!-- Rapport des factures -->
      <div class="tab-pane fade" id="factures" role="tabpanel" aria-labelledby="factures-tab">
        <RapportFactures />
      </div>

      <!-- Bilans financiers -->
      <div class="tab-pane fade" id="bilans" role="tabpanel" aria-labelledby="bilans-tab">
        <RapportBilans />
      </div>

      <!-- Simulations & Projections -->
      <div class="tab-pane fade" id="simulations" role="tabpanel" aria-labelledby="simulations-tab">
        <RapportSimulations />
      </div>
      <!-- Assistant IA -->
      <div class="tab-pane fade" id="assistant" role="tabpanel" aria-labelledby="assistant-tab">
        <AssistantIA />
      </div>
    </div>
  </div>
</template>

<script setup>
import RapportPaiements from './tabs/RapportPaiements.vue';
import RapportFactures from './tabs/RapportFactures.vue';
import RapportBilans from './tabs/RapportBilans.vue';
import RapportSimulations from './tabs/RapportSimulations.vue';
import AssistantIA from './tabs/AssistantIA.vue';
</script>

<style scoped>
.drag-drop-area {
  background: #f8f9fa;
  border: 2px dashed #007bff;
  cursor: pointer;
}
.drag-drop-area.drag-over {
  background: #e9ecef;
}
</style>

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
