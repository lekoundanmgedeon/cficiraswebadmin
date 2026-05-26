<template>
  <div class="row">
    <div class="col-md-12 grid-margin">
      <div class="d-flex justify-content-between flex-wrap">
        <!-- Partie gauche : titre + breadcrumb -->
        <div class="d-flex align-items-end flex-wrap">
          <div class="me-md-3 me-xl-5">
            <h2>Délibérations & Proclamation</h2>
            <p class="mb-md-0">Délibération des notes et proclamation des résultats</p>
          </div>

          <div class="d-flex align-items-center">
            <i class="mdi mdi-home text-muted hover-cursor"></i>
            <p class="text-muted mb-0 hover-cursor">&nbsp;/&nbsp;Scolarité&nbsp;/&nbsp;</p>
            <p class="text-primary mb-0 hover-cursor">Résultats</p>
          </div>
        </div>

        <!-- Partie droite : actions -->
        <div class="d-flex justify-content-between align-items-end flex-wrap">
          <!-- Export résultats -->
          <button
            type="button"
            @click="exportResultats"
            class="btn btn-light bg-white btn-icon me-3 d-none d-md-block"
          >
            <i class="mdi mdi-download text-muted"></i>
          </button>

          <!-- Impression PV -->
          <button
            type="button"
            @click="printPV"
            class="btn btn-light bg-white btn-icon me-3 mt-2 mt-xl-0"
          >
            <i class="mdi mdi-printer text-muted"></i>
          </button>

          <!-- Actions principales -->
          <div class="btn-group">
            <!-- Délibérer -->
            <button
              type="button"
              class="btn btn-success"
              @click="delibererNotes"
            >
            Délibération
            </button>

            <!-- Dropdown -->
            <button
              type="button"
              class="btn btn-success dropdown-toggle dropdown-toggle-split"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              <span class="visually-hidden">Toggle Dropdown</span>
            </button>

            <!-- Menu -->
            <ul class="dropdown-menu">
              <li>
                <a class="dropdown-item" @click="proclamerResultats">
                  <i class="mdi mdi-bullhorn me-1"></i> Proclamer résultats
                </a>
              </li>
              <li>
                <a class="dropdown-item" @click="publierRapport">
                  <i class="mdi mdi-file-chart me-1"></i> Publier rapport
                </a>
              </li>
              <li>
                <a class="dropdown-item text-danger" @click="annulerProclamation">
                  <i class="mdi mdi-close-circle-outline me-1"></i> Annuler proclamation
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const exportResultats = () => {
  console.log('Export des résultats');
  // TODO: brancher vers store ou API pour exporter en Excel/PDF
};

const printPV = () => {
  window.print();
};

const delibererNotes = () => {
  console.log('Délibération des notes en cours...');
  // TODO: appel API pour calculer moyennes et délibérer
};

const proclamerResultats = () => {
  console.log('Proclamation des résultats...');
  // TODO: appel API pour proclamer résultats
};

const publierRapport = () => {
  console.log('Publication du rapport...');
  // TODO: générer rapport statistique
};

const annulerProclamation = () => {
  console.log('Proclamation annulée');
  // TODO: rollback ou mise à jour du statut
};
</script>
