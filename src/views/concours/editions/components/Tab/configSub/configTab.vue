<template>
  <div>
    <ul class="nav nav-tabs px-4" role="tablist">
      <li class="nav-item">
        <a
          class="nav-link active"
          id="epreuves-tab"
          data-bs-toggle="tab"
          href="#epreuves"
          role="tab"
          aria-controls="epreuves"
          aria-selected="true"
        >
         <i class="bi bi-journal-text"></i>
          1. Épreuves & Coeffs
        </a>
      </li>

      <li class="nav-item">
        <a
          class="nav-link"
          id="candidatures-tab"
          data-bs-toggle="tab"
          href="#candidatures"
          role="tab"
          aria-controls="candidatures"
          aria-selected="false"
        >
        <i class="bi bi-people"></i>
          2. Candidatures
        </a>
      </li>

      <li class="nav-item">
        <a
          class="nav-link"
          id="notes-tab"
          data-bs-toggle="tab"
          href="#notes"
          role="tab"
          aria-controls="notes"
          aria-selected="false"
        >
        <i class="bi bi-pencil-square"></i>
          3. Saisie des Notes
        </a>
      </li>

      <li class="nav-item">
        <a
          class="nav-link"
          id="deliberation-tab"
          data-bs-toggle="tab"
          href="#deliberation"
          role="tab"
          aria-controls="deliberation"
          aria-selected="false"
        >
        <i class="bi bi-award"></i>
          4. Délibération & Publication
        </a>
      </li>
    </ul>

    <div class="tab-content p-4">
      <div
        class="tab-pane fade show active"
        id="epreuves"
        role="tabpanel"
        aria-labelledby="epreuves-tab"
      >
        <TabEpreuves/>
      </div>

      <div
        class="tab-pane fade"
        id="candidatures"
        role="tabpanel"
        aria-labelledby="candidatures-tab"
      >
        <TabCandidats />
      </div>

      <div
        class="tab-pane fade"
        id="notes"
        role="tabpanel"
        aria-labelledby="notes-tab"
      >
        <TabNotes/>
      </div>

      <div
        class="tab-pane fade"
        id="deliberation"
        role="tabpanel"
        aria-labelledby="deliberation-tab"
      >
        <TabDeliberation />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

import TabEpreuves from './TabEpreuves.vue';
import TabCandidats from './TabCandidats.vue';
import TabNotes from './TabNotes.vue';
import TabDeliberation from './TabDeliberation.vue';
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
