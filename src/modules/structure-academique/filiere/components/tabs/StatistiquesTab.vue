<template>
  <div class="row">
    <div class="col-12 mb-4">
      <h4>Statistiques des filières</h4>
      <p class="text-muted">Sélectionnez une filière pour consulter ses indicateurs clés.</p>

      <div class="col-md-6 col-lg-4 mt-2">
        <label for="filiereSelect" class="form-label small fw-bold text-secondary">Filière</label>
        <select
          id="filiereSelect"
          v-model="selectedFiliereId"
          class="form-select form-select-md"
          :disabled="filiereStore.loading"
        >
          <option value="" disabled>-- Choisir une filière --</option>
          <option v-for="filiere in filiereStore.filieres" :key="filiere.id" :value="filiere.id">
            {{ filiere.designation }} ({{ filiere.code }})
          </option>
        </select>
      </div>
    </div>

    <hr class="my-3 opacity-25" />

    <div v-if="filiereStore.loading && selectedFiliereId" class="col-12 text-center py-5">
      <div class="spinner-border text-primary spinner-border-sm" role="status">
        <span class="visually-hidden">Chargement...</span>
      </div>
    </div>

    <div v-else-if="selectedFiliereId && filiereStore.stats" class="col-12">
      <div class="row g-3">
        <div class="col-md-6">
          <div class="stat-card">
            <div class="stat-icon bg-info-soft text-info">
              <i class="bi bi-people"></i>
            </div>
            <div class="stat-content">
              <h3>{{ filiereStore.stats.nb_etudiants ?? '0' }}</h3>
              <p>Étudiants inscrits (Année active)</p>
            </div>
          </div>
        </div>

        <div class="col-md-6">
          <div class="stat-card">
            <div class="stat-icon bg-primary-soft text-primary">
              <i class="bi bi-door-open"></i>
            </div>
            <div class="stat-content">
              <h3>{{ filiereStore.stats.nb_classes ?? '0' }}</h3>
              <p>Classes associées</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="col-12 text-center py-5">
      <div class="d-flex flex-column align-items-center">
        <img
          src="/img/empty-box.svg"
          alt="Sélectionner"
          class="mb-2 text-muted"
          style="width: 80px; opacity: 0.6"
        />
        <p class="text-muted small">
          Veuillez sélectionner une filière dans la liste pour afficher ses statistiques.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useFiliereStore } from '../../store';

const filiereStore = useFiliereStore();
const selectedFiliereId = ref('');

onMounted(async () => {
  // La liste est servie par le cache du store si elle a déjà été chargée par
  // l'onglet « Liste » : ouvrir cet onglet ne relance pas la requête.
  await filiereStore.fetchAll();
  selectedFiliereId.value = filiereStore.items[0]?.id ?? '';
});

// Le changement de sélection déclenche le chargement des statistiques associées.
watch(selectedFiliereId, (id) => {
  if (id) filiereStore.fetchStats(id);
});
</script>

<style scoped>
.stat-card {
  background: #fff;
  border-radius: 12px;
  padding: 1.25rem;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
  display: flex;
  align-items: center;
  gap: 1rem;
  border: 1px solid #f0f0f0;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-icon i {
  font-size: 22px;
}

.stat-content h3 {
  margin: 0;
  font-size: 1.6rem;
  font-weight: 600;
  color: #2c3e50;
}

.stat-content p {
  margin: 0;
  color: #6c757d;
  font-size: 0.85rem;
}

.bg-primary-soft {
  background-color: rgba(13, 110, 253, 0.1);
}
.bg-info-soft {
  background-color: rgba(13, 202, 240, 0.1);
}
</style>
