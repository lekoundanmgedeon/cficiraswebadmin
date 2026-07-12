<script setup>
import AnneeHeader from '../components/AnneeHeader.vue';
import AnneeTabs from '../components/AnneeTabs.vue';
import AnneeFormModal from '../components/AnneeFormModal.vue';

/**
 * Écran « Années académiques ».
 *
 * La modale est montée ici, au-dessus des onglets : header et liste la pilotent
 * tous deux via `useAnneeForm`, et elle survit donc au changement d'onglet.
 */
</script>

<template>
  <div>
    <AnneeHeader />

    <div class="row">
      <div class="col-md-12 grid-margin stretch-card">
        <div class="card">
          <div class="card-body dashboard-tabs p-0">
            <AnneeTabs />
          </div>
        </div>
      </div>
    </div>

    <AnneeFormModal />
  </div>
</template>
