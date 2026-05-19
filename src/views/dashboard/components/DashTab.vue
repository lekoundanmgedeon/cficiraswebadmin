<template>
  <div>
    <ul class="nav nav-tabs px-4" role="tablist">
      <li class="nav-item">
        <a
          class="nav-link active"
          id="overview-tab"
          data-bs-toggle="tab"
          href="#overview"
          role="tab"
          aria-controls="overview"
          aria-selected="true"
          >Vue d'ensemble</a
        >
      </li>
      <li class="nav-item">
        <a
          class="nav-link"
          id="devoirf-tab"
          data-bs-toggle="tab"
          href="#devoirf"
          role="tab"
          aria-controls="devoirf"
          aria-selected="false"
          >Scolarites</a
        >
      </li>
      <li class="nav-item">
        <a
          class="nav-link"
          id="sales-tab"
          data-bs-toggle="tab"
          href="#sales"
          role="tab"
          aria-controls="sales"
          aria-selected="false"
          >Pedagogies</a
        >
      </li>
      <li class="nav-item">
        <a
          class="nav-link"
          id="purchases-tab"
          data-bs-toggle="tab"
          href="#purchases"
          role="tab"
          aria-controls="purchases"
          aria-selected="false"
          >Cycles</a
        >
      </li>
      <li class="nav-item">
        <a
          class="nav-link"
          id="rapports-tab"
          data-bs-toggle="tab"
          href="#rapports"
          role="tab"
          aria-controls="rapports"
          aria-selected="false"
          >Rapports</a
        >
      </li>
    </ul>
    <div class="tab-content p-4">
      <div
        class="tab-pane fade show active"
        id="overview"
        role="tabpanel"
        aria-labelledby="overview-tab"
      >
        <DashOverview />
      </div>
      <div class="tab-pane fade" id="devoirf" role="tabpanel" aria-labelledby="devoirf-tab">
        <DashScolarite />
      </div>
      <div class="tab-pane fade" id="sales" role="tabpanel" aria-labelledby="sales-tab">
        <DashPedagogie />
      </div>
      <div class="tab-pane fade" id="purchases" role="tabpanel" aria-labelledby="purchases-tab">
        <DashCycles />
      </div>
      <div class="tab-pane fade" id="rapports" role="tabpanel" aria-labelledby="rapports-tab">
        <DashRapport />
      </div>
    </div>
  </div>
</template>

<script setup>
import DashScolarite from './tabs/DashScol.vue';
import DashOverview from './tabs/DashOverview.vue';
import DashPedagogie from './tabs/DashPedgie.vue';
import DashCycles from './tabs/DashCycles.vue';
import DashRapport from './tabs/DashRapport.vue';
</script>
