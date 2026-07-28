<template>
  <div class="row">
    <div class="col-md-12 grid-margin">
      <div class="d-flex justify-content-between flex-wrap">
        <div class="d-flex align-items-end flex-wrap">
          <div class="me-md-3 me-xl-5">
            <h2>{{ titre }}</h2>
            <p class="mb-md-0">{{ sousTitre }}</p>
          </div>
          <div class="d-flex">
            <i class="mdi mdi-home text-muted hover-cursor"></i>
            <p class="text-muted mb-0 hover-cursor">&nbsp;/&nbsp;{{ fil }}&nbsp;/&nbsp;</p>
            <p class="text-primary mb-0 hover-cursor">{{ courant }}</p>
          </div>
        </div>
        <div class="d-flex justify-content-between align-items-end flex-wrap">
          <slot name="actions" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * En-tête commun des écrans de plateforme.
 *
 * Le même bloc — titre, sous-titre, fil d'Ariane « accueil / section / page » —
 * était recopié dans chacun des six écrans résiduels, à quelques mots près.
 */
defineProps({
  titre: { type: String, required: true },
  sousTitre: { type: String, default: '' },
  fil: { type: String, default: '' },
  courant: { type: String, default: '' },
});
</script>
