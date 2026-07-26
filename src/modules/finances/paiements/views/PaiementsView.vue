<template>
  <div>
    <div class="row">
      <PaiementHeader />
    </div>
    <div class="row">
      <div class="col-md-12 grid-margin stretch-card">
        <div class="card">
          <SkeletonLoader v-if="loading" type="table" :rows="3" :columns="1" />
          <div v-else class="card-body dashboard-tabs p-0">
            <PaiementTab />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import SkeletonLoader from '@/components/SkeletonLoader.vue';
import PaiementHeader from '../components/PaiementHeader.vue';
import PaiementTab from '../components/PaiementTab.vue';

/**
 * L'écran masquait ses onglets derrière un squelette pendant **trois secondes**,
 * le temps d'un `setTimeout` qui remplissait un tableau `formateurs` — deux
 * enseignants « John Doe » — que rien n'affichait ensuite. Ni le délai ni ces
 * données n'avaient de rapport avec les paiements.
 *
 * Chaque onglet charge désormais ses propres données et gère son état vide :
 * le squelette n'a plus rien à attendre.
 */
const loading = ref(false);
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
