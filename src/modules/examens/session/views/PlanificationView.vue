<script setup>
import { ref } from 'vue';
import ExamenHeader from '../../components/ExamenHeader.vue';
import ExamenList from '../components/ExamenList.vue';
import SessionFormModal from '../components/SessionFormModal.vue';
import { useSessionStore } from '../store';
import { useSessionForm } from '../composables/useSessionForm';

/**
 * Planification des sessions d'examen.
 *
 * Les trois onglets — Tout / Semestres 1 / Semestres 2 — sont conservés tels
 * quels : ce ne sont pas des onglets Bootstrap qui monteraient tous leurs
 * panneaux, mais un simple filtre passé au même tableau. `AppTabs` n'apporterait
 * rien ici, et changerait le rendu pour rien.
 *
 * L'en-tête reprend `planification/components/HeaderView.vue`, dont le menu
 * « Exporter Excel » se contentait d'un `console.log`.
 */

const sessionStore = useSessionStore();
const { openCreate } = useSessionForm();

// 0 = Tout · 1 = Impairs · 2 = Pairs
const activeSemesterGroup = ref(0);

const refresh = () => sessionStore.fetchAll({ force: true });
</script>

<template>
  <div>
    <ExamenHeader
      title="Planification des examens"
      subtitle="Sessions d'évaluation, normales et de rattrapage."
      breadcrumb="Planification"
      :refresh="refresh"
    >
      <template #actions>
        <button class="btn btn-primary btn-sm px-3 ms-2" @click="openCreate">
          + Nouvelle session
        </button>
      </template>
    </ExamenHeader>

    <div class="row">
      <div class="container">
        <div class="row">
          <div class="col-md-12 grid-margin stretch-card">
            <div class="card">
              <div class="card-body dashboard-tabs p-0">
                <ul class="nav nav-tabs px-4" role="tablist">
                  <li class="nav-item" role="presentation">
                    <button
                      type="button"
                      class="nav-link"
                      :class="{ active: activeSemesterGroup === 0 }"
                      @click="activeSemesterGroup = 0"
                    >
                      Tout
                    </button>
                  </li>
                  <li class="nav-item" role="presentation">
                    <button
                      type="button"
                      class="nav-link"
                      :class="{ active: activeSemesterGroup === 1 }"
                      @click="activeSemesterGroup = 1"
                    >
                      Semestres 1
                    </button>
                  </li>
                  <li class="nav-item" role="presentation">
                    <button
                      type="button"
                      class="nav-link"
                      :class="{ active: activeSemesterGroup === 2 }"
                      @click="activeSemesterGroup = 2"
                    >
                      Semestres 2
                    </button>
                  </li>
                </ul>

                <div class="tab-content py-3 px-4">
                  <ExamenList :semestre-group="activeSemesterGroup" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <SessionFormModal />
  </div>
</template>
