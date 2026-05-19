<template>
  <div>
    <div class="row">
      <ProgrammeHeader />
    </div>
    <div class="row">
      <div class="col-md-12 grid-margin stretch-card">
        <div class="card">
          <SkeletonLoader v-if="loading" type="table" :rows="3" :columns="1" />
          <div v-else class="card-body dashboard-tabs p-0">
            <ProgrammeTab />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import SkeletonLoader from '@/components/SkeletonLoader.vue';
import ProgrammeHeader from './components/ProgrammeHeader.vue';
import ProgrammeTab from './components/ProgrammeTab.vue';

const loading = ref(true);
const formateurs = ref([]);

onMounted(() => {
  setTimeout(() => {
    formateurs.value = [
      {
        id: 1,
        matricule: 'F001',
        nom: 'Doe',
        prenom: 'John',
        email: 'john@example.com',
        telephone: '0123456789',
      },
      {
        id: 2,
        matricule: 'F002',
        nom: 'Smith',
        prenom: 'Anna',
        email: 'anna@example.com',
        telephone: '0987654321',
      },
    ];
    loading.value = false;
  }, 3000);
});
</script>
<style scoped>
.drag-drop-area {
  background: #f8f9fa;
  border: 2px dashed #007bff;
  cursor: pointer;
}
.drag-drop-area.drag-over {
  background: #e9ecef;
}
</style>

<style scoped>
body {
  background-color: #f8f9fa;
  color: #212529;
}
.card {
  background-color: #ffffff;
  border: 1px solid #dee2e6;
  border-radius: 12px;
}
.btn-primary {
  background-color: #007bff;
  border-color: #007bff;
  color: #fff;
}
.btn-primary:hover {
  background-color: #0056b3;
  border-color: #004080;
}
.status-badge {
  padding: 0.5em 1em;
  border-radius: 20px;
  font-size: 0.85rem;
  color: #fff;
}
.status-draft {
  background-color: #6c757d;
}
.status-active {
  background-color: #0d6efd;
}
.table thead th {
  border-bottom: 2px solid #dee2e6;
}
</style>
