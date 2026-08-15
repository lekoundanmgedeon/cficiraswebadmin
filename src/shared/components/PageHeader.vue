<script setup>
/**
 * En-tête d'écran : titre, sous-titre, fil d'Ariane et actions.
 *
 * Le même bloc (titre + fil d'Ariane + boutons exporter/imprimer/ajouter) était
 * réécrit dans chaque `*Header.vue` de module, avec des variations d'alignement
 * et un fil d'Ariane codé en dur.
 */
defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },

  /**
   * Fil d'Ariane. Le dernier élément est affiché comme position courante.
   * @type {import('vue').PropType<string[]>}
   */
  breadcrumb: { type: Array, default: () => [] },
});
</script>

<template>
  <div class="row">
    <div class="col-md-12 grid-margin">
      <div class="d-flex justify-content-between flex-wrap">
        <div class="d-flex align-items-end flex-wrap">
          <div class="me-md-3 me-xl-5">
            <h2>{{ title }}</h2>
            <p v-if="subtitle" class="mb-md-0">{{ subtitle }}</p>
          </div>

          <div v-if="breadcrumb.length" class="d-flex">
            <i class="mdi mdi-home text-muted"></i>
            <p class="text-muted mb-0">&nbsp;/&nbsp;</p>
            <template v-for="(step, index) in breadcrumb" :key="step">
              <p
                class="mb-0"
                :class="index === breadcrumb.length - 1 ? 'text-primary' : 'text-muted'"
              >
                {{ step }}
              </p>
              <p v-if="index < breadcrumb.length - 1" class="text-muted mb-0">&nbsp;/&nbsp;</p>
            </template>
          </div>
        </div>

        <div class="d-flex justify-content-between align-items-end flex-wrap">
          <slot name="actions" />
        </div>
      </div>
    </div>
  </div>
</template>
