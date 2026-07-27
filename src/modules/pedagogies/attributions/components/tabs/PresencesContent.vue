<template>
  <div class="row">
    <div class="col-12">
      <div class="card border-0 shadow-sm rounded-4 p-5 text-center bg-white">
        <i class="bi bi-calendar-check display-5 text-muted mb-3"></i>
        <h6 class="text-muted fw-bold mb-1">Suivi des présences</h6>
        <p class="small text-muted mb-0">
          Le suivi des présences n'est pas encore disponible : aucun service de présence
          n'est exposé côté serveur.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
// Ce composant était un `<template></template>` vide (il ne rendait rien). Il
// affiche désormais un état honnête : il n'existe aucun backend de présences
// (voir docs/ETAT-REFACTORISATION.md § questions ouvertes). À brancher le jour
// où le serveur expose la ressource.
</script>
