<template>
  <div>
    <!-- Barre d'onglets -->
    <ul class="nav nav-tabs px-4" role="tablist">
      <li class="nav-item">
        <a
          class="nav-link active"
          id="programme-tab"
          data-bs-toggle="tab"
          href="#programme"
          role="tab"
          aria-controls="programme"
          aria-selected="true"
        >
          <i class="bi bi-journal-bookmark me-2"></i>Programme des cours
        </a>
      </li>
      <li class="nav-item">
        <a
          class="nav-link"
          id="credits-tab"
          data-bs-toggle="tab"
          href="#credits"
          role="tab"
          aria-controls="credits"
          aria-selected="false"
        >
          <i class="bi bi-award me-2"></i>Crédits académiques
        </a>
      </li>
      <li class="nav-item">
        <a
          class="nav-link"
          id="ects-tab"
          data-bs-toggle="tab"
          href="#ects"
          role="tab"
          aria-controls="ects"
          aria-selected="false"
        >
          <i class="bi bi-mortarboard me-2"></i>Crédits ECTS
        </a>
      </li>
      <li class="nav-item">
        <a
          class="nav-link"
          id="resume-tab"
          data-bs-toggle="tab"
          href="#resume"
          role="tab"
          aria-controls="resume"
          aria-selected="false"
        >
          <i class="bi bi-clipboard-data me-2"></i>Résumé global
        </a>
      </li>
    </ul>

    <!-- Contenu des onglets -->
    <div class="tab-content p-4">
      <!-- 1. Programme des cours -->
      <div class="tab-pane fade show active" id="programme" role="tabpanel" aria-labelledby="programme-tab">
        <ProgrammeCours />
      </div>

      <!-- 2. Crédits académiques -->
      <div class="tab-pane fade" id="credits" role="tabpanel" aria-labelledby="credits-tab">
        <CreditsAcademiques />
      </div>

      <!-- 3. Crédits ECTS -->
      <div class="tab-pane fade" id="ects" role="tabpanel" aria-labelledby="ects-tab">
        <CreditsECTS />
      </div>

      <!-- 4. Résumé global -->
      <div class="tab-pane fade" id="resume" role="tabpanel" aria-labelledby="resume-tab">
        <ResumeProgramme />
      </div>
    </div>
  </div>
</template>

<script setup>
import ProgrammeCours from './Tab/ProgrammeCours.vue';
import CreditsAcademiques from './Tab/CreditsAcademiques.vue';
import CreditsECTS from './Tab/CreditsECTS.vue';
import ResumeProgramme from './Tab/ResumeProgramme.vue';
</script>
