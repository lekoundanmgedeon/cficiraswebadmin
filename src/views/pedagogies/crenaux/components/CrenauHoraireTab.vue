<template>
  <div>
    <ul class="nav nav-tabs px-4" role="tablist">
      <!-- Onglet Créneaux/Horaires -->
      <li class="nav-item">
        <a
          class="nav-link active"
          id="creneaux-tab"
          data-bs-toggle="tab"
          href="#creneaux-horaires"
          role="tab"
          aria-controls="creneaux-horaires"
          aria-selected="true"
        >
          Créneaux & Horaires
        </a>
      </li>

      <!-- Onglet Emploi du temps -->
      <li class="nav-item">
        <a
          class="nav-link"
          id="edt-tab"
          data-bs-toggle="tab"
          href="#emplois-temps"
          role="tab"
          aria-controls="emplois-temps"
          aria-selected="false"
        >
          Emploi du temps
        </a>
      </li>

      <!-- Onglet TP -->
      <li class="nav-item">
        <a
          class="nav-link"
          id="tp-tab"
          data-bs-toggle="tab"
          href="#tp"
          role="tab"
          aria-controls="tp"
          aria-selected="false"
        >
          Rapports
        </a>
      </li>

      <!-- Onglet TD -->
      <li class="nav-item">
        <a
          class="nav-link"
          id="td-tab"
          data-bs-toggle="tab"
          href="#td"
          role="tab"
          aria-controls="td"
          aria-selected="false"
        >
        Archives
        </a>
      </li>
    </ul>

    <!-- Contenu des Onglets -->
    <div class="tab-content p-4">
      <!-- 1. Créneaux & Horaires -->
      <div class="tab-pane fade show active" id="creneaux-horaires" role="tabpanel" aria-labelledby="creneaux-tab">
        <CreneauxHoraires />
      </div>

      <!-- 2. Emploi du temps -->
      <div class="tab-pane fade" id="emplois-temps" role="tabpanel" aria-labelledby="edt-tab">
        <EmploisDuTemps/>
      </div>

      <!-- 3. TP -->
      <div class="tab-pane fade" id="tp" role="tabpanel" aria-labelledby="tp-tab">
        <TravauxPratiques />
      </div>

      <!-- 4. TD -->
      <div class="tab-pane fade" id="td" role="tabpanel" aria-labelledby="td-tab">
        <TravauxDiriges />
      </div>
    </div>
  </div>
</template>

<script setup>
import CreneauxHoraires from './Tab/CreneauxHoraires.vue';
import EmploisDuTemps from './Tab/EmploisDuTemps.vue';
import TravauxPratiques from './Tab/TravauxPratiques.vue';
import TravauxDiriges from './Tab/TravauxDiriges.vue';
</script>
