<template>
  <div>
    <ul class="nav nav-tabs px-4" role="tablist">
      <!-- Liste des factures -->
      <li class="nav-item">
        <a
          class="nav-link active"
          id="factures-tab"
          data-bs-toggle="tab"
          href="#factures"
          role="tab"
          aria-controls="factures"
          aria-selected="true"
        >
          Factures
        </a>
      </li>

      <!-- Création d'une nouvelle facture -->
      <li class="nav-item">
        <a
          class="nav-link"
          id="nouveau-tab"
          data-bs-toggle="tab"
          href="#nouveau"
          role="tab"
          aria-controls="nouveau"
          aria-selected="false"
        >
          Etats honoraires
        </a>
      </li>

      <!-- Archives des factures -->
      <li class="nav-item">
        <a
          class="nav-link"
          id="archives-tab"
          data-bs-toggle="tab"
          href="#archives"
          role="tab"
          aria-controls="archives"
          aria-selected="false"
        >
          Transactions
        </a>
      </li>
    </ul>

    <div class="tab-content p-4">
      <!-- Liste des factures -->
      <div
        class="tab-pane fade show active"
        id="factures"
        role="tabpanel"
        aria-labelledby="factures-tab"
      >
        <FacturationList />
      </div>

      <!-- Formulaire de création -->
      <div class="tab-pane fade" id="nouveau" role="tabpanel" aria-labelledby="nouveau-tab">
        <FacturationForm />
      </div>

      <!-- Historique / Archives -->
      <div class="tab-pane fade" id="archives" role="tabpanel" aria-labelledby="archives-tab">
        <FacturationArchives />
      </div>
    </div>
  </div>
</template>

<script setup>
import FacturationList from './tabs/FacturationList.vue';
import FacturationForm from './tabs/FacturationForm.vue';
import FacturationArchives from './tabs/FacturationArchives.vue';
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
