<template>
  <div>
    <!-- Onglets -->
    <ul class="nav nav-tabs px-4" role="tablist">
      <li class="nav-item">
        <a
          class="nav-link active"
          id="deliberations-tab"
          data-bs-toggle="tab"
          href="#deliberations"
          role="tab"
          aria-controls="deliberations"
          aria-selected="true"
        >
          Délibérations
        </a>
      </li>
      <li class="nav-item">
        <a
          class="nav-link"
          id="proclamation-tab"
          data-bs-toggle="tab"
          href="#proclamation"
          role="tab"
          aria-controls="proclamation"
          aria-selected="false"
        >
          Bulletins
        </a>
      </li>
      <li class="nav-item">
        <a
          class="nav-link"
          id="rapports-tab"
          data-bs-toggle="tab"
          href="#rapports"
          role="tab"
          aria-controls="rapports"
          aria-selected="false"
        >
          Rapports
        </a>
      </li>
      <!-- Assistant Ai -->
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

    <!-- Contenu des onglets -->
    <div class="tab-content p-4">
      <div
        class="tab-pane fade show active"
        id="deliberations"
        role="tabpanel"
        aria-labelledby="deliberations-tab"
      >
        <!-- Composant spécifique aux délibérations -->
        <Deliberations />
      </div>
      <div
        class="tab-pane fade"
        id="proclamation"
        role="tabpanel"
        aria-labelledby="proclamation-tab"
      >
        <!-- Composant spécifique à la proclamation -->
        <Proclamation />
      </div>
      <div class="tab-pane fade" id="rapports" role="tabpanel" aria-labelledby="rapports-tab">
        <!-- Composant spécifique aux rapports -->
        <Rapports />
      </div>
      <div class="tab-pane fade" id="assistant" role="tabpanel" aria-labelledby="assistant-tab">
        <!-- Composant spécifique à l'assistant IA -->
        <AssistantIA />
      </div>
    </div>
  </div>
</template>

<script setup>
import Deliberations from './DeliberationsContent.vue';
import Proclamation from './ProclamationContent.vue';
import Rapports from './RapportContents.vue';
import AssistantIA from './AssistantIAContent.vue';
</script>
