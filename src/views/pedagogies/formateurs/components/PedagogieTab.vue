<template>
  <div>
    <ul class="nav nav-tabs px-4" role="tablist">
      <!-- Formateurs -->
      <li class="nav-item">
        <a
          class="nav-link active"
          id="formateurs-tab"
          data-bs-toggle="tab"
          href="#formateurs"
          role="tab"
          aria-controls="formateurs"
          aria-selected="true"
        >
          Formateurs
        </a>
      </li>

      <!-- Assignations -->
      <li class="nav-item">
        <a
          class="nav-link"
          id="assignations-tab"
          data-bs-toggle="tab"
          href="#assignations"
          role="tab"
          aria-controls="assignations"
          aria-selected="false"
        >
          Assignations
        </a>
      </li>
      <!-- Suivi pédagogique -->
      <li class="nav-item">
        <a
          class="nav-link"
          id="suivi-tab"
          data-bs-toggle="tab"
          href="#suivi"
          role="tab"
          aria-controls="suivi"
          aria-selected="false"
        >
          Suivi pédagogique
        </a>
      </li>
      <!-- Charges horaires -->
      <li class="nav-item">
        <a
          class="nav-link"
          id="charges-tab"
          data-bs-toggle="tab"
          href="#charges"
          role="tab"
          aria-controls="charges"
          aria-selected="false"
        >
          Charges horaires
        </a>
      </li>
      <!-- Rapports -->
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
      <!-- Archives -->
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
          Archives
        </a>
      </li>
    </ul>
    <!-- CONTENU -->
    <div class="tab-content p-4">
      <div
        class="tab-pane fade show active"
        id="formateurs"
        role="tabpanel"
        aria-labelledby="formateurs-tab"
      >
        <FormateursContent />
      </div>

      <div
        class="tab-pane fade"
        id="assignations"
        role="tabpanel"
        aria-labelledby="assignations-tab"
      >
        <AssignationsContent />
      </div>

      <div class="tab-pane fade" id="suivi" role="tabpanel" aria-labelledby="suivi-tab">
        <SuiviPedagogique />
      </div>

      <div class="tab-pane fade" id="charges" role="tabpanel" aria-labelledby="charges-tab">
        <ChargesHoraires />
      </div>

      <div class="tab-pane fade" id="rapports" role="tabpanel" aria-labelledby="rapports-tab">
        <RapportsAcademiques />
      </div>

      <div class="tab-pane fade" id="archives" role="tabpanel" aria-labelledby="archives-tab">
        <ArchivesPedagogiques />
      </div>
    </div>
  </div>
</template>

<script setup>
import FormateursContent from './Tab/FormateursContent.vue';
import AssignationsContent from './Tab/AssignationsContent.vue';
import SuiviPedagogique from './Tab/SuiviPedagogique.vue';
import ChargesHoraires from './Tab/ChargesHoraires.vue';
import RapportsAcademiques from './Tab/RapportsAcademiques.vue';
import ArchivesPedagogiques from './Tab/ArchivesPedagogiques.vue';
</script>
