<template>
  <div class="py-4 px-2">
    <!-- Header Page -->
    <div class="mb-4">
      <h3 class="fw-bold text-dark mb-2">Architecture Académique</h3>
      <p class="text-muted">Explorez la hiérarchie des cycles, filières et niveaux d'études.</p>
    </div>

    <!-- Accordéon Principal (Cycles) -->
    <div class="accordion custom-robust-accordion" id="cyclesAccordion">
      <div
        v-for="(cycle, cIndex) in cycles"
        :key="cycle.name"
        class="accordion-item mb-3 border shadow-sm"
      >
        <h2 class="accordion-header" :id="'heading' + cIndex">
          <button
            class="accordion-button collapsed py-3 px-4"
            type="button"
            data-bs-toggle="collapse"
            :data-bs-target="'#collapse' + cIndex"
            aria-expanded="false"
            :aria-controls="'collapse' + cIndex"
          >
            <div class="d-flex justify-content-between align-items-center w-100 me-3">
              <div class="d-flex align-items-center">
                <div class="cycle-icon-box me-3">
                  <i class="mdi mdi-layers-outline"></i>
                </div>
                <div>
                  <span class="fw-bold text-dark fs-6">{{ cycle.name }}</span>
                  <div class="text-muted x-small text-uppercase fw-semibold">
                    Cycle Universitaire
                  </div>
                </div>
              </div>
              <span class="badge-count">{{ cycle.filieres?.length || 0 }} Filières</span>
            </div>
          </button>
        </h2>

        <div
          :id="'collapse' + cIndex"
          class="accordion-collapse collapse"
          :aria-labelledby="'heading' + cIndex"
          data-bs-parent="#cyclesAccordion"
        >
          <div class="accordion-body bg-light-subtle p-4">
            <!-- Liste des Filières (Style Cartes Plates) -->
            <div class="row g-3">
              <div v-for="(filiere, fIndex) in cycle.filieres" :key="filiere.name" class="col-12">
                <div
                  class="filiere-card p-3 border-start border-primary border-4 bg-white shadow-sm"
                >
                  <div class="d-flex justify-content-between align-items-start mb-3">
                    <h6 class="fw-bold text-dark mb-0">
                      <i class="mdi mdi-arrow-right-drop-circle-outline text-primary me-2"></i>
                      {{ filiere.name }}
                    </h6>
                  </div>

                  <!-- Grille des Niveaux -->
                  <div class="row g-2 ms-4">
                    <div
                      v-if="filiere.niveaux && filiere.niveaux.length"
                      v-for="niveau in filiere.niveaux"
                      :key="niveau.name"
                      class="col-md-4 col-lg-3"
                    >
                      <div class="niveau-pill d-flex justify-content-between align-items-center">
                        <span class="fw-medium text-dark">{{ niveau.name }}</span>
                        <span class="student-count"
                          >{{ niveau.etudiants }} <i class="mdi mdi-account-group-outline"></i
                        ></span>
                      </div>
                    </div>
                    <div v-else class="col-12 text-muted small italic ps-2">
                      <i class="mdi mdi-information-outline me-1"></i> Aucun niveau configuré
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { computed, onMounted } from 'vue';
import { useCycleStore } from '@/stores/academiqueStore/cycleStore';

const cycleStore = useCycleStore();

// Architecture des cycles et filières
const cycles = computed(() => cycleStore.cycles_architecture);

// Charger les données au montage
onMounted(async () => {
  await cycleStore.fetchCycleArchitecture();
});
</script>

<style scoped>
/* Structure Globale */
.custom-robust-accordion .accordion-item {
  border-radius: 4px !important;
  border: 1px solid #e2e8f0 !important;
  overflow: hidden;
}

.custom-robust-accordion .accordion-button {
  background-color: #ffffff;
  box-shadow: none;
}

.custom-robust-accordion .accordion-button:not(.collapsed) {
  background-color: #f8faff;
  color: #4b49ac;
  border-bottom: 1px solid #eef2f7;
}

/* Cycle Icon Box */
.cycle-icon-box {
  width: 42px;
  height: 42px;
  background: #f1f5f9;
  color: #4b49ac;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  font-size: 1.2rem;
}

/* Badge Count */
.badge-count {
  background: #f1f5f9;
  color: #475569;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
}

/* Filiere Card (Remplace le 2ème accordéon pour plus de clarté) */
.filiere-card {
  border-radius: 4px;
  transition: transform 0.2s;
}

.filiere-card:hover {
  transform: translateX(5px);
}

/* Niveau Pill */
.niveau-pill {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 0.85rem;
}

.student-count {
  font-size: 0.75rem;
  color: #4b49ac;
  font-weight: 700;
  background: rgba(75, 73, 172, 0.1);
  padding: 2px 6px;
  border-radius: 2px;
}

/* Helpers */
.x-small {
  font-size: 0.7rem;
}

.border-primary {
  border-color: #4b49ac !important;
}
</style>
