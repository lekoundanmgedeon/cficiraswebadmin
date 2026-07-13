<script setup>
import { useRouter } from 'vue-router';
import { useNotificationStore } from '@/shared/stores/notificationStore';

/**
 * En-tête des écrans du module Examens : titre, fil d'Ariane, Retour, Actualiser.
 *
 * `calendrier/components/HeaderView.vue` et `salles/components/HeaderView.vue`
 * étaient **deux copies du même fichier**, au titre près. Toutes deux appelaient
 *
 * ```js
 * const refreshCalendar = async () => {
 *   await fetchCalendarEvents();       // ← jamais définie, jamais importée
 *   notifySuccess('Calendrier actualisé.');
 * };
 * ```
 *
 * `fetchCalendarEvents` n'existait **nulle part** : cliquer sur « Actualiser »
 * levait un `ReferenceError` sur les deux écrans. Elles déclaraient de surcroît
 * un `notifyError` jamais utilisé.
 *
 * L'action de rafraîchissement est désormais fournie par l'écran appelant, qui
 * seul sait ce qu'il doit recharger.
 */

const props = defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },

  /** Dernier segment du fil d'Ariane (« Examens / <ici> »). */
  breadcrumb: { type: String, default: '' },

  /**
   * Ce qu'il faut recharger. Le bouton « Actualiser » n'apparaît que si elle
   * est fournie — plutôt que d'afficher un bouton qui ne fait rien.
   * @type {import('vue').PropType<(() => Promise<any>|any) | null>}
   */
  refresh: { type: Function, default: null },
});

const router = useRouter();
const notifications = useNotificationStore();

const goBack = () => router.back();

async function onRefresh() {
  await props.refresh();
  notifications.notifySuccess('Données actualisées.');
}
</script>

<template>
  <div>
    <div class="row">
      <div class="col-md-12 grid-margin">
        <div class="d-flex justify-content-between flex-wrap">
          <div class="d-flex align-items-end flex-wrap">
            <div class="me-md-3 me-xl-5">
              <h3 class="fw-bold text-dark mb-1">{{ title }}</h3>
              <p v-if="subtitle" class="text-muted small mb-0">{{ subtitle }}</p>
            </div>
            <div class="d-flex privacy-breadcrumbs alignment-fix">
              <i class="mdi mdi-home text-muted hover-cursor"></i>
              <p class="text-muted mb-0 hover-cursor">&nbsp;/&nbsp;Examens&nbsp;/&nbsp;</p>
              <p class="text-primary mb-0 hover-cursor">{{ breadcrumb }}</p>
            </div>
          </div>

          <div class="d-flex justify-content-between align-items-end flex-wrap">
            <button class="btn btn-outline-secondary btn-sm me-2" @click="goBack">
              <i class="bi bi-arrow-left me-1"></i> Retour
            </button>

            <button v-if="refresh" class="btn btn-success btn-sm px-3" @click="onRefresh">
              <i class="bi bi-arrow-clockwise me-1"></i> Actualiser
            </button>

            <slot name="actions" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.hover-cursor {
  cursor: pointer;
}
.alignment-fix {
  align-items: center;
  padding-bottom: 2px;
}
</style>
