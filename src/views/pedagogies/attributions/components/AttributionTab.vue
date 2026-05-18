<template>
  <div>
    <!-- Barre d'onglets complète (Défilement horizontal activé si nécessaire) -->
    <ul class="nav nav-tabs px-4 flex-nowrap overflow-x-auto text-nowrap" role="tablist">
      <li class="nav-item">
        <a
          class="nav-link"
          id="cours-tab"
          data-bs-toggle="tab"
          href="#cours-matieres"
          role="tab"
          aria-controls="cours-matieres"
          aria-selected="false"
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
          href="#ressources"
          role="tab"
          aria-controls="ressources"
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
      <!-- 2. Cours & Matières -->
      <div class="tab-pane fade" id="cours-matieres" role="tabpanel" aria-labelledby="cours-tab">
        <CoursMatieres />
      </div>

      <!-- 3. Emplois du temps -->
      <div class="tab-pane fade" id="emplois-temps" role="tabpanel" aria-labelledby="edt-tab">
        <EmploisDuTemps />
      </div>

      <!-- 4. Assignations -->
      <div
        class="tab-pane fade"
        id="assignations"
        role="tabpanel"
        aria-labelledby="assignations-tab"
      >
        <AssignationsContent />
      </div>
      <!-- 7. Présences -->
      <div class="tab-pane fade" id="presences" role="tabpanel" aria-labelledby="presences-tab">
        <PresencesContent />
      </div>

      <!-- 8. Ressources pédagogiques -->
      <div class="tab-pane fade" id="ressources" role="tabpanel" aria-labelledby="ressources-tab">
        <RessourcesPedagogiques />
      </div>

      <!-- 10. Charges horaires -->
      <div class="tab-pane fade" id="charges" role="tabpanel" aria-labelledby="charges-tab">
        <ChargesHoraires />
      </div>

      <!-- 11. Rapports -->
      <div class="tab-pane fade" id="rapports" role="tabpanel" aria-labelledby="rapports-tab">
        <RapportsAcademiques />
      </div>

      <!-- 12. Archives -->
      <div class="tab-pane fade" id="archives" role="tabpanel" aria-labelledby="archives-tab">
        <ArchivesPedagogiques />
      </div>
    </div>
  </div>
</template>

<script setup>
import CoursMatieres from './Tab/CoursMatieres.vue';
import EmploisDuTemps from './Tab/EmploisDuTemps.vue';
import PresencesContent from './Tab/PresencesContent.vue';
import ChargesHoraires from './Tab/ChargesHoraires.vue';
import RapportsAcademiques from './Tab/RapportsAcademiques.vue';
import ArchivesPedagogiques from './Tab/ArchivesPedagogiques.vue';
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
