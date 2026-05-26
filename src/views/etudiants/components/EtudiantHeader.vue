<template>
  <div class="row">
    <div class="col-md-12 grid-margin">
      <div class="d-flex justify-content-between flex-wrap">
        <!-- Partie gauche : titre + breadcrumb -->
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

          <!-- Ajouter / Importer -->
          <div class="btn-group">
            <!-- Ajouter -->
            <button
              type="button"
              class="btn btn-primary"
              data-bs-toggle="modal"
              data-bs-target="#addEtudiantModal"
            >
              + Ajouter un nouveau
            </button>
            <!-- Dropdown -->
            <button
              type="button"
              class="btn btn-primary dropdown-toggle dropdown-toggle-split"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              <span class="visually-hidden">Toggle Dropdown</span>
            </button>

            <!-- Menu Import -->
            <ul class="dropdown-menu">
              <li>
                <a class="dropdown-item" data-bs-toggle="modal" data-bs-target="#importModal">
                  Importer fichier (Excel/CSV)
                </a>
              </li>
              <li>
                <a class="dropdown-item" @click="downloadTemplate">Télécharger modèle</a>
              </li>
              <li>
                <a class="dropdown-item text-danger" @click="bulkDelete">Suppression en masse</a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>

  <AddEtudiant />
  <!-- Le modal d’import est dans un composant séparé pour mieux gérer la logique d’importation et le template de téléchargement 
  <ImportEtudiantsModal @import-complete="handleImport" />
  -->
</template>

<script setup>
import AddEtudiant from './Modal/addEtudiant.vue';
//import ImportEtudiantsModal from './Modal/importEtudiantModal.vue';

const exportData = () => {
  console.log('Export des étudiants');
  // TODO: brancher vers store ou API pour exporter en Excel/PDF
};

const printData = () => {
  window.print();
};

const downloadTemplate = () => {
  console.log('Téléchargement du modèle CSV/Excel');
  // TODO: utiliser la fonction downloadTemplate du composant ImportEtudiantsModal
};

const bulkDelete = () => {
  console.log('Suppression en masse des étudiants sélectionnés');
};

const handleImport = (data) => {
  console.log('Données importées:', data);
  // TODO: envoyer à l’API ou insérer dans le store
};
</script>
