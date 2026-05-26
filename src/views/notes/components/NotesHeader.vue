<template>
 <div class="row">
      <div class="col-md-12 grid-margin">
        <div class="d-flex justify-content-between flex-wrap">
          <div class="d-flex align-items-end flex-wrap">
            <div class="me-md-3 me-xl-5">
              <h2 class="fw-bold text-dark mb-1">Notes & Résultats</h2>
              <p class="text-muted small mb-0">Attributions et suivi des notes de contrôles continus et examens</p>
            </div>
            <div class="d-flex shadow-sm bg-white rounded px-3 py-2 border mb-2 mb-md-0">
              <i class="mdi mdi-home text-muted hover-cursor"></i>
              <p class="text-muted mb-0 hover-cursor">&nbsp;/&nbsp;Scolarité&nbsp;/&nbsp;</p>
              <p class="text-primary mb-0 hover-cursor fw-bold">Notes</p>
            </div>
          </div>
          
          <div class="d-flex justify-content-between align-items-end flex-wrap gap-2">
            <button class="btn btn-outline-dark shadow-sm btn-sm px-3" >
              <i class="mdi mdi-file-export me-1"></i>Exporter
            </button>
            <div class="btn-group shadow-sm">
              <router-link to="/addNotes" class="btn btn-primary btn-sm px-3">
                <i class="mdi mdi-plus-circle me-1"></i> Saisir des notes
              </router-link>
              <button
                type="button"
                class="btn btn-primary btn-sm dropdown-toggle dropdown-toggle-split"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <span class="visually-hidden">Toggle Dropdown</span>
              </button>
              <ul class="dropdown-menu shadow-sm">
                <li><a class="dropdown-item" href="#" >Importer un fichier CSV</a></li>
                <li><a class="dropdown-item" href="#">Importer un fichier Excel</a></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
</template>
