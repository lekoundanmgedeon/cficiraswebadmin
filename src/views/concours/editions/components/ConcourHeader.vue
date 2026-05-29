<template>
  <div class="row">
    <div class="col-md-12 grid-margin">
      <div class="d-flex justify-content-between flex-wrap">
        <div class="d-flex align-items-end flex-wrap">
          <div class="me-md-3 me-xl-5">
            <h2>Gestion de concours</h2>
            <p class="mb-md-0">Organisation, suivi et administration des concours académiques</p>
          </div>
          <div class="d-flex align-items-center">
            <i class="mdi mdi-home text-muted hover-cursor"></i>
            <p class="text-muted mb-0 hover-cursor">&nbsp;/&nbsp;Concours&nbsp;/&nbsp;</p>
            <p class="text-primary mb-0 hover-cursor">Gestion</p>
          </div>
        </div>

        <div class="d-flex justify-content-between align-items-end flex-wrap">
          <button
            type="button"
            @click="exportData"
            class="btn btn-light bg-white btn-icon me-3 d-none d-md-block"
          >
            <i class="mdi mdi-download text-muted"></i>
          </button>

          <button
            type="button"
            @click="printData"
            class="btn btn-light bg-white btn-icon me-3 mt-2 mt-xl-0"
          >
            <i class="mdi mdi-printer text-muted"></i>
          </button>

          <button class="btn btn-primary mt-2 mt-xl-0" @click="openAddModal">
            + Ajouter un nouveau
          </button>
          
          <AddConcour />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import AddConcour from './modal/AddConcour.vue';

const exportData = () => {
  console.log('Export des concours');
};

const printData = () => {
  window.print();
};

// Fonction pour ouvrir le modal Bootstrap
const openAddModal = () => {
  // Cibler le modal par son ID défini dans AddConcour.vue
  const modalElement = document.getElementById('exampleModal');
  
  if (modalElement) {
    // Récupérer l'instance existante ou en créer une nouvelle, puis l'afficher
    const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
    modal.show();
  } else {
    console.error("Le modal avec l'ID 'exampleModal' est introuvable.");
  }
};
</script>
