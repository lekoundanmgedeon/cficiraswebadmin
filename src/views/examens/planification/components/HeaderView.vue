<template>
  <div>
    <div class="row">
      <div class="col-md-12 grid-margin">
        <div class="d-flex justify-content-between flex-wrap">
          <div class="d-flex align-items-end flex-wrap">
            <div class="me-md-3 me-xl-5">
              <h2>Planification des Évaluations</h2>
              <p class="mb-md-0 text-muted">Gestion, suivi et workflows des sessions d'examens</p>
            </div>
            <div class="d-flex privacy-breadcrumbs alignment-fix">
              <i class="mdi mdi-home text-muted hover-cursor"></i>
              <p class="text-muted mb-0 hover-cursor">&nbsp;/&nbsp;Portail&nbsp;/&nbsp;</p>
              <p class="text-primary mb-0 hover-cursor">Planification</p>
            </div>
          </div>

          <div class="d-flex justify-content-between align-items-end flex-wrap">
            <div class="dropdown me-2">
              <button
                class="btn btn-sm btn-outline-secondary"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <i class="mdi mdi-dots-vertical"></i>
              </button>
              <ul class="dropdown-menu dropdown-menu-end">
                <li>
                  <a class="dropdown-item" href="#" @click.prevent="exportToExcel">
                    <i class="mdi mdi-file-excel me-2 text-success"></i>Exporter Excel
                  </a>
                </li>
                <li>
                  <a class="dropdown-item" href="#" @click.prevent="printTable">
                    <i class="mdi mdi-printer me-2"></i>Imprimer la liste
                  </a>
                </li>
                <li><hr class="dropdown-divider" /></li>
                <li>
                  <a class="dropdown-item" href="#"
                    ><i class="mdi mdi-cog me-2"></i>Configuration</a
                  >
                </li>
              </ul>
            </div>

            <button
              class="btn btn-primary mt-2 mt-xl-0"
              data-bs-toggle="modal"
              data-bs-target="#createSessionModal"
            >
              + Ajouter un nouveau
            </button>

            <CreateSessionModal />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// Importation du nouveau composant créé à l'étape précédente
// Note : Ajustez le chemin d'accès si vos dossiers sont organisés différemment
import CreateSessionModal from '../components/modal/AddSession.vue';

// Fonctions utilitaires pour le menu dropdown
const exportToExcel = () => {
  console.log('Exportation des sessions vers Excel...');
};

const printTable = () => {
  window.print();
};
</script>

<style scoped>
.hover-cursor {
  cursor: pointer;
}
.alignment-fix {
  align-items: center;
  padding-bottom: 2px;
}
</style>
