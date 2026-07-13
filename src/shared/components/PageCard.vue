<script setup>
/**
 * Carte pleine largeur qui accueille le contenu d'un écran (le plus souvent des
 * onglets).
 *
 * Reprend le triple emboîtement `row > col > card > card-body` que chaque vue
 * du projet recopiait à l'identique, accompagné d'un bloc `<style scoped>`
 * inopérant (il redéfinissait `body`, `.card` et `.btn-primary` — des sélecteurs
 * globaux qu'un style *scoped* ne peut pas atteindre).
 */
</script>

<template>
  <div class="row">
    <div class="col-md-12 grid-margin stretch-card">
      <div class="card">
        <div class="card-body dashboard-tabs p-0">
          <slot />
        </div>
      </div>
    </div>
  </div>
</template>
