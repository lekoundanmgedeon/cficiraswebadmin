<template>
  <div>
    <ul class="nav nav-tabs px-4" role="tablist">
      <!-- Onglet Classes -->
      <li class="nav-item">
        <a
          class="nav-link active"
          id="classes-tab"
          data-bs-toggle="tab"
          href="#classes"
          role="tab"
          aria-controls="classes"
          aria-selected="true"
        >
          Classes
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
          Niveaux
        </a>
      </li>
      <!-- Onglet filiere -->
      <li class="nav-item">
        <a
          class="nav-link"
          id="filieres-tab"
          data-bs-toggle="tab"
          href="#filieres"
          role="tab"
          aria-controls="filieres"
          aria-selected="false"
        >
          Filières
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
    </ul>

    <div class="tab-content p-4">
      <!-- Classes -->
      <div
        class="tab-pane fade show active"
        id="classes"
        role="tabpanel"
        aria-labelledby="classes-tab"
      >
        <ClassesContent />
      </div>

      <!-- Niveaux -->
      <div class="tab-pane fade" id="niveaux" role="tabpanel" aria-labelledby="niveaux-tab">
        <NiveauxContent />
      </div>

      <!-- Filières -->
      <div class="tab-pane fade" id="filieres" role="tabpanel" aria-labelledby="filieres-tab">
        <FilieresContent />
      </div>

      <!-- Organisation -->
      <div
        class="tab-pane fade"
        id="organisation"
        role="tabpanel"
        aria-labelledby="organisation-tab"
      >
        <OrganisationClassesContent />
      </div>

      <!-- Statistiques -->
      <div
        class="tab-pane fade"
        id="statistiques"
        role="tabpanel"
        aria-labelledby="statistiques-tab"
      >
        <StatistiquesClassesContent />
      </div>
    </div>
  </div>
</template>
<script setup>
import ClassesContent from './Tab/ClassesContent.vue';
import NiveauxContent from './Tab/NiveauxContent.vue';
import OrganisationClassesContent from './Tab/OrganisationClassesContent.vue';
import StatistiquesClassesContent from './Tab/StatistiquesClassesContent.vue';
import FilieresContent from './Tab/FilieresContent.vue';
</script>
