<template>
  <div>
    <ul class="nav nav-tabs px-4" role="tablist">
      <li class="nav-item">
        <a
          class="nav-link active"
          id="cours-tab"
          data-bs-toggle="tab"
          href="#cours-matieres"
          role="tab"
          aria-controls="cours-matieres"
          aria-selected="true"
        >
          <i class="bi bi-book me-2"></i>Cours & Matières
        </a>
      </li>
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
          <i class="bi bi-person-check me-2"></i>Assignations
        </a>
      </li>
      <li class="nav-item">
        <a
          class="nav-link"
          id="ressources-tab"
          data-bs-toggle="tab"
          href="#ressources-pedagogiques"
          role="tab"
          aria-controls="ressources-pedagogiques"
          aria-selected="false"
        >
          <i class="bi bi-folder-symlink me-2"></i>Ressources pédagogiques
        </a>
      </li>
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
          <i class="bi bi-clock-history me-2"></i>Charges horaires
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
          <i class="bi bi-file-earmark-bar-graph me-2"></i>Rapports
        </a>
      </li>
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
          <i class="bi bi-archive me-2"></i>Archives
        </a>
      </li>
    </ul>

    <!-- Contenu des Onglets -->
    <div class="tab-content p-4">
      <!-- 1. Cours & Matières -->
      <div class="tab-pane fade show active" id="cours-matieres" role="tabpanel" aria-labelledby="cours-tab">
        <CoursMatieres />
      </div>

      <!-- 2. Assignations -->
      <div class="tab-pane fade" id="assignations" role="tabpanel" aria-labelledby="assignations-tab">
        <AssignationsContent />
      </div>

      <!-- 3. Présences -->
      <div class="tab-pane fade" id="presences" role="tabpanel" aria-labelledby="presences-tab">
        <PresencesContent />
      </div>

      <!-- 4. Ressources pédagogiques -->
      <div class="tab-pane fade" id="ressources-pedagogiques" role="tabpanel" aria-labelledby="ressources-tab">
        <RessourcesPedagogiques />
      </div>

      <!-- 5. Charges horaires -->
      <div class="tab-pane fade" id="charges" role="tabpanel" aria-labelledby="charges-tab">
        <ChargesHoraires />
      </div>

      <!-- 6. Rapports -->
      <div class="tab-pane fade" id="rapports" role="tabpanel" aria-labelledby="rapports-tab">
        <RapportsAcademiques />
      </div>

      <!-- 7. Archives -->
      <div class="tab-pane fade" id="archives" role="tabpanel" aria-labelledby="archives-tab">
        <ArchivesPedagogiques />
      </div>
    </div>
  </div>
</template>

<script setup>
import CoursMatieres from './Tab/CoursMatieres.vue';
import AssignationsContent from './Tab/AssignationsContent.vue';
import PresencesContent from './Tab/PresencesContent.vue';
import RessourcesPedagogiques from './Tab/RessourcesPedagogiques.vue';
import ChargesHoraires from './Tab/ChargesHoraires.vue';
import RapportsAcademiques from './Tab/RapportsAcademiques.vue';
import ArchivesPedagogiques from './Tab/ArchivesPedagogiques.vue';
</script>
