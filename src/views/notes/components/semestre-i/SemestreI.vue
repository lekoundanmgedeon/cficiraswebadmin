<template>
  <div>
    <ul class="nav nav-tabs px-4" role="tablist">
      <li class="nav-item">
        <a
          class="nav-link active"
          id="devoirs-s1-tab"
          data-bs-toggle="tab"
          href="#devoirs-s1"
          role="tab"
          aria-selected="true"
        >
          <i class="bi bi-file-earmark-text me-1"></i> Devoirs
        </a>
      </li>
      <li class="nav-item">
        <a
          class="nav-link"
          id="sessions-s1-tab"
          data-bs-toggle="tab"
          href="#sessions-s1"
          role="tab"
          aria-selected="false"
        >
          <i class="bi bi-calendar-check me-1"></i> Sessions ordinaires
        </a>
      </li>
      <li class="nav-item">
        <a
          class="nav-link"
          id="rappels-s1-tab"
          data-bs-toggle="tab"
          href="#rappels-s1"
          role="tab"
          aria-selected="false"
        >
          <i class="bi bi-calendar-arrow-clockwise me-1"></i> Sessions de rappels
        </a>
      </li>
    </ul>

    <div class="tab-content p-4">
      <div
        class="tab-pane fade show active"
        id="devoirs-s1"
        role="tabpanel"
        aria-labelledby="devoirs-s1-tab"
      >
        <app-devoirs />
      </div>
      <div class="tab-pane fade" id="sessions-s1" role="tabpanel" aria-labelledby="sessions-s1-tab">
        <app-sessions />
      </div>
      <div class="tab-pane fade" id="rappels-s1" role="tabpanel" aria-labelledby="rappels-s1-tab">
        <app-rappels />
      </div>
    </div>
  </div>
</template>

<script setup>
// Tu peux garder app-notes partout si tu n’as pas encore les autres composants.
// Ici je montre comment préparer pour modulariser.
import AppDevoirs from './AppDevoirs.vue';
import AppSessions from './AppSessions.vue';
import AppRappels from './AppRappels.vue';
</script>
<style scoped>
/* Supprime la bordure supérieure ou globale de la navigation imbriquée */
.nav-tabs {
  border-top: none !important; /* Si la ligne vient de l'onglet lui-même */
  border-left: none !important;
  border-right: none !important;
}

/* Ou si c'est le conteneur global qui injecte une bordure */
:deep(.tab-content) {
  border: none !important;
}
</style>