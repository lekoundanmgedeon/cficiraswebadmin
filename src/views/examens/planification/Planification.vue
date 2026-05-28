<template>
  <HeaderView />
  <div class="row">
    <div class="container">
      <div class="row">
        <div class="col-md-12 grid-margin stretch-card">
          <div class="card">
            <div class="card-body dashboard-tabs p-0">
              <ul class="nav nav-tabs px-4" role="tablist">
                <li class="nav-item" role="presentation">
                  <button
                    class="nav-link"
                    :class="{ active: activeSemesterGroup === 0 }"
                    @click="activeSemesterGroup = 0"
                    type="button"
                  >
                    Tout
                  </button>
                </li>
                <li class="nav-item" role="presentation">
                  <button
                    class="nav-link"
                    :class="{ active: activeSemesterGroup === 1 }"
                    @click="activeSemesterGroup = 1"
                    type="button"
                  >
                    Semestres 1
                  </button>
                </li>
                <li class="nav-item" role="presentation">
                  <button
                    class="nav-link"
                    :class="{ active: activeSemesterGroup === 2 }"
                    @click="activeSemesterGroup = 2"
                    type="button"
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
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useSessionStore } from '@/stores/evaluationStore/sessionStore.js';
import HeaderView from './components/HeaderView.vue';
import ExamenList from './components/tabs/ExamenList.vue';

// 0: Tout, 1: Impairs, 2: Pairs
const activeSemesterGroup = ref(0);
const sessionStore = useSessionStore();

onMounted(() => {
  sessionStore.fetchSessions();
});
</script>