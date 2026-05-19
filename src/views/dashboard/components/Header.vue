<template>
  <div class="row">
    <div class="col-md-12 grid-margin">
      <div class="d-flex justify-content-between flex-wrap">
        <div class="d-flex align-items-end flex-wrap">
          <div class="me-md-3 me-xl-5">
            <h2>Bienvenue !</h2>
            <p class="mb-md-0">Espace d'administration plateforme CFI-CIRAS</p>
          </div>
          <div class="d-flex">
            <i class="mdi mdi-home text-muted hover-cursor"></i>
            <p class="text-muted mb-0 hover-cursor">&nbsp;/&nbsp;Tableau de Bord&nbsp;/&nbsp;</p>
            <p class="text-primary mb-0 hover-cursor">Analytics</p>
          </div>
        </div>
        <div class="d-flex justify-content-between align-items-end flex-wrap">
          <button type="button" class="btn btn-light bg-white btn-icon me-3 d-none d-md-block">
            <i class="mdi mdi-download text-muted"></i>
          </button>
          <button type="button" class="btn btn-light bg-white btn-icon me-3 mt-2 mt-xl-0">
            <i class="mdi mdi-clock-outline text-muted"></i>
          </button>
          <button type="button" class="btn btn-light bg-white btn-icon me-3 mt-2 mt-xl-0">
            <i class="mdi mdi-plus text-muted"></i>
          </button>
          
          <!-- BRANCHEMENT EFFECTUÉ ICI -->
          <button 
            class="btn btn-primary mt-2 mt-xl-0" 
            data-bs-toggle="modal" 
            data-bs-target="#modalGenerationRapport"
          >
            Générer un rapport
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Injection du composant Modal en bas du template -->
  <ModalGenerationRapport />
</template>

<script setup>
// Importation du composant modal développé à l'étape précédente
// Ajustez le chemin relatif si votre fichier est rangé dans un autre sous-dossier
import ModalGenerationRapport from './modal/ModalGeneration.vue';
</script>