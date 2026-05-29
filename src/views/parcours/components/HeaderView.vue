<template>
  <div class="row">
    <div class="col-md-12 grid-margin">
      <div class="d-flex justify-content-between flex-wrap">
        <!-- Partie gauche : titre + breadcrumb -->
        <div class="d-flex align-items-end flex-wrap">
          <div class="me-md-3 me-xl-5">
            <h2>Dossiers academiques</h2>
            <p class="mb-md-0">Suivi, organisation et gestion des étudiants</p>
          </div>
          <div class="d-flex align-items-center">
            <i class="mdi mdi-home text-muted hover-cursor"></i>
            <p class="text-muted mb-0 hover-cursor">&nbsp;/&nbsp;structures&nbsp;/&nbsp;</p>
            <p class="text-primary mb-0 hover-cursor">etudiants</p>
          </div>
        </div>
        <!-- Partie droite : actions -->
        <div class="d-flex justify-content-between align-items-end flex-wrap">
          <!-- Export -->
          <button
            type="button"
            @click="exportData"
            class="btn btn-light bg-white btn-icon me-3 d-none d-md-block"
          >
            <i class="mdi mdi-download text-muted"></i>
          </button>

          <!-- Impression -->
          <button
            type="button"
            @click="printData"
            class="btn btn-light bg-white btn-icon me-3 mt-2 mt-xl-0"
          >
            <i class="mdi mdi-printer text-muted"></i>
          </button>
          <!-- Ajouter -->
          <button
            type="button"
            class="btn btn-primary"
            data-bs-toggle="modal"
            data-bs-target="#addEtudiantModal"
          >
            Generer un rapport
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const exportData = () => {
  console.log('Export des étudiants');
  // TODO: brancher vers store ou API pour exporter en Excel/PDF
};

const printData = () => {
  window.print();
};
</script>
