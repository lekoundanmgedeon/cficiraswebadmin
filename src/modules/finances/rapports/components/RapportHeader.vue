<template>
  <div class="row">
    <div class="col-md-12 grid-margin">
      <div class="d-flex justify-content-between flex-wrap">
        <!-- Partie gauche : titre et fil d’Ariane -->
        <div class="d-flex align-items-end flex-wrap">
          <div class="me-md-3 me-xl-5">
            <h2>Rapports Financiers</h2>
            <p class="mb-md-0">Suivi des paiements, facturations et bilans</p>
          </div>
          <div class="d-flex">
            <i class="mdi mdi-home text-muted hover-cursor"></i>
            <p class="text-muted mb-0 hover-cursor">&nbsp;/&nbsp;Finances&nbsp;/&nbsp;</p>
            <p class="text-primary mb-0 hover-cursor">Rapports</p>
          </div>
        </div>

        <!-- Partie droite : actions rapides -->
        <div class="d-flex justify-content-between align-items-end flex-wrap">
          <!-- Exporter les rapports -->
          <button type="button" class="btn btn-light bg-white btn-icon me-3 d-none d-md-block">
            <i class="mdi mdi-download text-muted"></i>
          </button>
          <!-- Voir les rapports récents -->
          <button type="button" class="btn btn-light bg-white btn-icon me-3 mt-2 mt-xl-0">
            <i class="mdi mdi-clock-outline text-muted"></i>
          </button>
          <!-- Créer un nouveau rapport -->
          <button type="button" class="btn btn-light bg-white btn-icon me-3 mt-2 mt-xl-0">
            <i class="mdi mdi-plus text-muted"></i>
          </button>
          <!-- Générer un rapport financier -->
          <button class="btn btn-primary mt-2 mt-xl-0">Générer un rapport</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// Pas de logique spécifique ici, juste la structure du header
</script>
