<template>
  <div>
    <ul class="nav nav-tabs px-4" role="tablist">
      <!-- Onglet Semestres -->
      <li class="nav-item">
        <a
          class="nav-link active"
          id="semestres-tab"
          data-bs-toggle="tab"
          href="#semestres"
          role="tab"
          aria-controls="semestres"
          aria-selected="true"
        >
          Semestres
        </a>
      </li>
      <!-- Onglet Organisation -->
      <li class="nav-item">
        <a
          class="nav-link"
          id="organisation-tab"
          data-bs-toggle="tab"
          href="#organisation"
          role="tab"
          aria-controls="organisation"
          aria-selected="false"
        >
          Organisation
        </a>
      </li>
      <!-- Onglet Niveaux -->
      <li class="nav-item">
        <a
          class="nav-link"
          id="niveaux-tab"
          data-bs-toggle="tab"
          href="#niveaux"
          role="tab"
          aria-controls="niveaux"
          aria-selected="false"
        >
          UEs
        </a>
      </li>

      <!-- Onglet Statistiques -->
      <li class="nav-item">
        <a
          class="nav-link"
          id="statistiques-tab"
          data-bs-toggle="tab"
          href="#statistiques"
          role="tab"
          aria-controls="statistiques"
          aria-selected="false"
        >
          Statistiques
        </a>
      </li>
      <!-- Assistant AI -->
      <li class="nav-item">
        <a
          class="nav-link"
          id="assistant-ai-tab"
          data-bs-toggle="tab"
          href="#assistant-ai"
          role="tab"
          aria-controls="assistant-ai"
          aria-selected="false"
        >
          Assistant AI
        </a>
      </li>
    </ul>

    <div class="tab-content p-4">
      <!-- Semestres -->
      <div
        class="tab-pane fade show active"
        id="semestres"
        role="tabpanel"
        aria-labelledby="semestres-tab"
      >
        <SemestresContent />
      </div>

      <!-- Niveaux -->
      <div class="tab-pane fade" id="niveaux" role="tabpanel" aria-labelledby="niveaux-tab">
        <NiveauxContent />
      </div>

      <!-- Organisation -->
      <div
        class="tab-pane fade"
        id="organisation"
        role="tabpanel"
        aria-labelledby="organisation-tab"
      >
        <OrganisationSemestresContent />
      </div>

      <!-- Statistiques -->
      <div
        class="tab-pane fade"
        id="statistiques"
        role="tabpanel"
        aria-labelledby="statistiques-tab"
      >
        <StatistiquesSemestresContent />
      </div>

      <!-- Assistant AI -->
      <div
        class="tab-pane fade"
        id="assistant-ai"
        role="tabpanel"
        aria-labelledby="assistant-ai-tab"
      >
        <AssistantAIContent />
      </div>
    </div>
  </div>
</template>
<script setup>
import SemestresContent from './Tab/SemestresContent.vue';
import NiveauxContent from './Tab/NiveauxContent.vue';
import OrganisationSemestresContent from './Tab/OrganisationSemestresContent.vue';
import StatistiquesSemestresContent from './Tab/StatistiquesSemestresContent.vue';
import AssistantAIContent from './Tab/AssistantAIContent.vue';
</script>
