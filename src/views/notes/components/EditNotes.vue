<template>
  <div class="container-fluid py-2">
    <div class="row mb-3">
      <div class="col-12 d-flex justify-content-end">
        <button 
          class="btn btn-sm btn-light border shadow-sm rounded-pill px-3" 
          @click="$router.back()"
        >
          <i class="bi bi-arrow-left-short fs-5 align-middle"></i>
          <span class="align-middle ms-1">Retour à la liste</span>
        </button>
      </div>
    </div>

    <div class="row">
      <div class="col-md-12 grid-margin stretch-card">
        <div class="card border-0 shadow-sm rounded-4">
          <div class="card-body dashboard-tabs p-0">
            <EditNotes 
              :classe-id="classeId" 
              :semestre="semestre" 
              :type-evaluation="type" 
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import EditNotes from '../components/Notes.vue';

defineProps({
  classeId: String,
  semestre: String,
  type: String
});
</script>