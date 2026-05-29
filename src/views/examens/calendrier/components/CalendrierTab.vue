<template>
  <div>
    <ul class="nav nav-tabs px-4" role="tablist">
      <li class="nav-item">
        <a
          class="nav-link active"
          id="session-normal-tab"
          data-bs-toggle="tab"
          href="#session-normal"
          role="tab"
          aria-controls="session-normal"
          aria-selected="true"
        >
          Session normal
        </a>
      </li>
      <li class="nav-item">
        <a
          class="nav-link"
          id="session-rattrapage-tab"
          data-bs-toggle="tab"
          href="#session-rattrapage"
          role="tab"
          aria-controls="session-rattrapage"
          aria-selected="false"
        >
          Session rattrapage
        </a>
      </li>
    </ul>

    <div class="tab-content p-4">
      <div
        class="tab-pane fade show active"
        id="session-normal"
        role="tabpanel"
        aria-labelledby="session-normal-tab"
      >
        <CalendrierExamen/>
      </div>
      <div
        class="tab-pane fade"
        id="session-rattrapage"
        role="tabpanel"
        aria-labelledby="session-rattrapage-tab"
      >
        <CalendrierRappel />
      </div>
    </div>
  </div>
</template>

<script setup>
import CalendrierExamen from './tab/CalendrierEvaluation.vue';
import CalendrierRappel from './tab/CalendrierRappel.vue';
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
</style>