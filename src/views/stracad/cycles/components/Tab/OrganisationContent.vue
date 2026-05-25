<template>
  <div class="row">
    <h4>Vue d'ensemble</h4>
    <p>Vous pouvez consulter les détails de chaque examen en cliquant sur le lien correspondant.</p>

    <div class="table-responsive">
      <table class="table table-striped align-middle">
        <thead>
          <tr>
            <th>Cycle</th>
            <th>Filiere disponible</th>
            <th>Effectifs</th>
            <th>Capacités</th>
            <th>Taux remplissage</th>
            <th>Statut</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="6" class="text-center py-4">
              <div class="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
              Chargement en cours...
            </td>
          </tr>

          <tr v-else-if="organisations.length === 0">
            <td colspan="6" class="text-center py-4">
              <div class="d-flex flex-column align-items-center">
                <img
                  src="/img/empty-box.svg"
                  alt="Aucune donnée"
                  class="mb-2"
                  style="width: 80px"
                />
                <div class="text-muted">Aucune donnée disponible</div>
              </div>
            </td>
          </tr>

          <tr v-else v-for="item in organisations" :key="item.cycle_id">
            <td>
              <strong>{{ item.cycle_designation }}</strong>
              <small class="text-muted">({{ item.cycle_code }})</small>
            </td>
            <td>{{ item.filieres_disponibles }}</td>
            <td>{{ item.effectifs }}</td>
            <td>{{ item.capacite_totale }}</td>
            <td>
              <span v-if="Number(item.capacite_totale) > 0"> {{ item.taux_remplissage }} % </span>
              <span v-else class="text-muted">-</span>
            </td>
            <td>
              <span
                class="badge"
                :class="{
                  'bg-success': item.statut === 'Complet',
                  'bg-warning text-dark':
                    item.statut === 'Partiel' /* text-dark pour le contraste du jaune Bootstrap */,
                  'bg-secondary': item.statut === 'Vide' || item.statut === 'Aucune capacité',
                }"
              >
                {{ item.statut }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
<script setup>
import { onMounted, computed } from 'vue';
import { useCycleStore } from '@/stores/academiqueStore/cycleStore';
import { useNotifier } from '@/stores/messages/useNotifier';

const cycleStore = useCycleStore();
const messageStore = useNotifier();

// 1. Branchement sur la bonne variable de ton store : organisationStats
const loading = computed(() => cycleStore.loading);
const organisations = computed(() => cycleStore.organisationStats || []);

// 2. Appel propre de l'action sans les doubles parenthèses ()
onMounted(async () => {
  await cycleStore.fetchCycleOrganisation();
});
</script>
