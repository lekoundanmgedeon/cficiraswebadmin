<template>
  <div>
    <!-- Onglets -->
    <ul class="nav nav-tabs px-4" role="tablist">
      <li class="nav-item">
        <a
          class="nav-link active"
          id="tout-tab"
          data-bs-toggle="tab"
          href="#tout"
          role="tab"
          aria-controls="tout"
          aria-selected="true"
        >
          <i class="mdi mdi-format-list-bulleted me-1"></i> Tout
        </a>
      </li>
      <li class="nav-item">
        <a
          class="nav-link"
          id="devoirs-tab"
          data-bs-toggle="tab"
          href="#devoirs"
          role="tab"
          aria-controls="devoirs"
          aria-selected="false"
        >
          <i class="mdi mdi-file-document-edit-outline me-1"></i> Devoirs
        </a>
      </li>
      <li class="nav-item">
        <a
          class="nav-link"
          id="sessions-tab"
          data-bs-toggle="tab"
          href="#sessions"
          role="tab"
          aria-controls="sessions"
          aria-selected="false"
        >
          <i class="mdi mdi-calendar-check me-1"></i> Sessions ordinaires
        </a>
      </li>
      <li class="nav-item">
        <a
          class="nav-link"
          id="rappels-tab"
          data-bs-toggle="tab"
          href="#rappels"
          role="tab"
          aria-controls="rappels"
          aria-selected="false"
        >
          <i class="mdi mdi-calendar-refresh me-1"></i> Sessions de rappels
        </a>
      </li>
    </ul>

    <!-- Contenu des onglets -->
    <div class="tab-content p-4">
      <div
        class="tab-pane fade show active"
        id="tout"
        role="tabpanel"
        aria-labelledby="tout-tab"
      >
        <app-notes />
      </div>
      <div class="tab-pane fade" id="devoirs" role="tabpanel" aria-labelledby="devoirs-tab">
        <app-devoirs />
      </div>
      <div class="tab-pane fade" id="sessions" role="tabpanel" aria-labelledby="sessions-tab">
        <app-sessions />
      </div>
      <div class="tab-pane fade" id="rappels" role="tabpanel" aria-labelledby="rappels-tab">
        <app-rappels />
      </div>
    </div>
  </div>
</template>

<script setup>
// Tu peux garder app-notes partout si tu n’as pas encore les autres composants.
// Ici je montre comment préparer pour modulariser.
import AppNotes from './AppNotes.vue';
import AppDevoirs from './AppDevoirs.vue';
import AppSessions from './AppSessions.vue';
import AppRappels from './AppRappels.vue';
</script>
