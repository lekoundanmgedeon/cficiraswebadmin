<template>
  <div class="row">
    <div class="col-md-12 grid-margin">
      <div class="d-flex justify-content-between flex-wrap">
        <div class="d-flex align-items-end flex-wrap">
          <div class="me-md-3 me-xl-5">
            <h2>Gestion des Étudiants</h2>
            <p class="mb-md-0">Suivi, organisation et gestion des étudiants</p>
          </div>
          <div class="d-flex align-items-center">
            <i class="mdi mdi-home text-muted hover-cursor"></i>
            <p class="text-muted mb-0 hover-cursor">&nbsp;/&nbsp;Portail&nbsp;/&nbsp;</p>
            <p class="text-primary mb-0 hover-cursor">Étudiants</p>
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

          <div class="btn-group">
            <button
              type="button"
              class="btn btn-primary"
              data-bs-toggle="modal"
              data-bs-target="#genererRapportModal"
            >
              Générer un rapport
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
  <GenererRapportModal @rapport-genere="handleRapportGenere" />
</template>

<script setup>
import GenererRapportModal from './Modal/GenerationRapport.vue'; // AJOUT : Importation du modal de rapport

const handleRapportGenere = (payload) => {
  console.log('Rapport demandé avec le filtre suivant :', payload);
  // Ici vous pouvez gérer des logs ou intercepter des téléchargements globaux si besoin
};

const exportData = () => {
  console.log('Export des étudiants');
};

const printData = () => {
  window.print();
};
</script>
