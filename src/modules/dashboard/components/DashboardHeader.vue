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

        <!--
          Trois boutons-icônes (téléchargement, historique, ajout) occupaient cet
          espace sans le moindre `@click` : ils ne faisaient rien. Et « Générer un
          rapport » ouvrait une modale qui attendait 1,5 s avant d'annoncer « Le
          fichier a été généré avec succès par le noyau de l'ERP » — sans appeler
          la moindre API ni produire de fichier. C'est exactement ce qui avait été
          retiré du module étudiants (§1.4).

          Les extractions réelles vivent désormais dans l'onglet « Rapports », qui
          interroge le serveur puis produit le fichier. Le bouton y renvoie.
        -->
        <div class="d-flex justify-content-between align-items-end flex-wrap">
          <button
            type="button"
            class="btn btn-light bg-white btn-icon me-3 mt-2 mt-xl-0"
            title="Actualiser les données"
            @click="$emit('rafraichir')"
          >
            <i class="mdi mdi-refresh text-muted"></i>
          </button>

          <button class="btn btn-primary mt-2 mt-xl-0" @click="$emit('ouvrir-rapports')">
            Générer un rapport
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineEmits(['rafraichir', 'ouvrir-rapports']);
</script>
