<template>
  <div>
    <div class="row">
      <div class="col-md-12 grid-margin">
        <div class="d-flex justify-content-between flex-wrap">
          <div class="d-flex align-items-end flex-wrap">
            <div class="me-md-3 me-xl-5">
              <h3 class="fw-bold text-dark mb-1">Calendrier des Évaluations</h3>
              <p class="text-muted small mb-0">
                Visualisation et gestion chronologique des Examens Normaux et Rattrapages.
              </p>
            </div>
            <div class="d-flex privacy-breadcrumbs alignment-fix">
              <i class="mdi mdi-home text-muted hover-cursor"></i>
              <p class="text-muted mb-0 hover-cursor">&nbsp;/&nbsp;Examens&nbsp;/&nbsp;</p>
              <p class="text-primary mb-0 hover-cursor">Calendrier</p>
            </div>
          </div>
          <div class="d-flex justify-content-between align-items-end flex-wrap">
            <button class="btn btn-outline-secondary btn-sm me-2" @click="goBack">
              <i class="bi bi-arrow-left me-1"></i> Retour
            </button>
            <button class="btn btn-success btn-sm px-3" @click="refreshCalendar">
              <i class="bi bi-arrow-clockwise me-1"></i> Actualiser
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { useNotifier } from '@/stores/messages/useNotifier';

const router = useRouter();

const { notifySuccess, notifyError } = useNotifier();

const refreshCalendar = async () => {
  await fetchCalendarEvents();
  notifySuccess('Calendrier actualisé.');
};
const goBack = () => router.back();
</script>

<style scoped>
.hover-cursor {
  cursor: pointer;
}
.alignment-fix {
  align-items: center;
  padding-bottom: 2px;
}
</style>
