<template>
  <div>
    <!-- Onglets -->
    <ul class="nav nav-tabs px-4" role="tablist">
      <li class="nav-item">
        <a
          class="nav-link active"
          id="semestre1-tab"
          data-bs-toggle="tab"
          href="#semestre1"
          role="tab"
          aria-controls="semestre1"
          aria-selected="true"
        >
          Semestre I
        </a>
      </li>
      <li class="nav-item">
        <a
          class="nav-link"
          id="semestre2-tab"
          data-bs-toggle="tab"
          href="#semestre2"
          role="tab"
          aria-controls="semestre2"
          aria-selected="false"
        >
         Semestre II
        </a>
      </li>
    </ul>

    <!-- Contenu des onglets -->
    <div class="tab-content p-4">
      <div
        class="tab-pane fade show active"
        id="semestre1"
        role="tabpanel"
        aria-labelledby="semestre1-tab"
      >
        <!-- Composant spécifique au Semestre I -->
        <SemestreI/>
      </div>
      <div
        class="tab-pane fade"
        id="semestre2"
        role="tabpanel"
        aria-labelledby="semestre2-tab"
      >
        <!-- Composant spécifique au Semestre II -->
        <SemestreII/>
      </div>
    </div>
  </div>
</template>

<script setup>
import SemestreI from './semestre-i/SemestreI.vue';
import SemestreII from './semestre-ii/SemestreII.vue';
</script>

