<template>
  <div class="container-fluid p-0">
    
    <div v-if="!selectedConcoursToConfigure">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 class="fw-bold mb-1">Listes de concours</h4>
          <p class="text-muted mb-0">
            Consultez les détails de chaque examen ou cliquez sur "Configurer" pour gérer ses étapes (épreuves, candidats, notes).
          </p>
        </div>
      </div>

      <div v-if="loading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status"></div>
        <p class="text-muted text-sm mt-2 font-monospace">Chargement du registre...</p>
      </div>

      <div v-else class="table-responsive mt-3">
        <table class="table table-hover align-middle">
          <thead>
            <tr>
              <th style="width: 5%">#</th>
              <th>Désignation</th>
              <th>Type concours</th>
              <th>Date de début</th>
              <th>Date de fin</th>
              <th>Statut</th>
              <th class="text-end" style="width: 25%">Actions</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="(concour, index) in paginatedConcours" :key="concour.id">
              <td class="font-monospace">
                {{ (currentPage - 1) * itemsPerPage + index + 1 }}
              </td>
              <td>
                <div class="fw-semibold text-dark">{{ concour.designation }}</div>
                <small class="text-muted font-monospace text-xs">{{ concour.code_annee }}</small>
              </td>
              <td>
                <span class="badge bg-light text-secondary border px-2 py-1">
                  {{ concour.libelle_type || concour.type_concours }}
                </span>
              </td>
              <td class="font-monospace text-sm">{{ formatDate(concour.date_debut) }}</td>
              <td class="font-monospace text-sm">{{ formatDate(concour.date_fin) }}</td>
              <td>
                <span class="status-badge" :class="getStatusClass(concour.statut)">
                  {{ concour.statut }}
                </span>
              </td>
              <td class="text-end">
                <div class="d-flex justify-content-end align-items-center gap-2">
                  
                  <RouterLink 
                    :to="`/edition-concours/${concour.id}/configurations`" 
                    class="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1"
                  >
                    <i class="mdi mdi-cog-outline"></i>
                    <span>Configurer</span>
                  </RouterLink>

                  <ItemActions
                    :item="concour"
                    concourRoute="/edition-concours/"
                    :showAdd="false"
                    editModalTarget="#editModuleModal"
                    @edit="editModule"
                    @delete="confirmDelete"
                  />
                </div>
              </td>
            </tr>
            <tr v-if="filteredConcours.length === 0">
              <td colspan="7" class="text-center text-muted py-4">Aucun concours disponible</td>
            </tr>
          </tbody>
        </table>

        <Pagination
          v-model="currentPage"
          :items-per-page="itemsPerPage"
          :total-items="filteredConcours.length"
          @update:itemsPerPage="itemsPerPage = $event"
        />
      </div>
    </div>

    <div v-else>
      <ConcoursConfigDetails 
        :concours="selectedConcoursToConfigure" 
        @close="fermerConfiguration" 
      />
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import dayjs from 'dayjs';
import { useConcoursStore } from '@/stores/gestionStores/concourStore';

// Importations des composants standards
import ItemActions from '../details/ItemActions.vue';
import Pagination from '@/components/shared/Pagination.vue';

// IMPORTATION DE LA NOUVELLE SUB-PAGE
import ConcoursConfigDetails from './configSub/configDetails.vue';

/* ========================================================
    États de branchement de la Sous-Page
======================================================== */
// Sert de tampon : vaut `null` (affiche la liste) ou contient un `Object` (affiche les onglets)
const selectedConcoursToConfigure = ref(null);

const ouvrirConfiguration = (concours) => {
  selectedConcoursToConfigure.value = concours;
};

const fermerConfiguration = () => {
  selectedConcoursToConfigure.value = null;
  // Optionnel : Tu peux rafraîchir la liste si des calculs ont changé le statut global
  concoursStore.fetchConcours();
};

/* ========================================================
    Store & Pagination standard
======================================================== */
const concoursStore = useConcoursStore();
const currentPage = ref(1);
const itemsPerPage = ref(10);

const loading = computed(() => concoursStore.loading);
const filteredConcours = computed(() => concoursStore.concoursList || []);

const paginatedConcours = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return filteredConcours.value.slice(start, end);
});

/* ========================================================
    Utilitaires & Cycle de vie
======================================================== */
const formatDate = (date) => date ? dayjs(date).format('DD-MM-YYYY') : 'Non définie';

const getStatusClass = (status) => {
  const norm = status ? status.toLowerCase().trim() : '';
  if (norm === 'ouvert') return 'status-active';
  if (norm === 'planifié') return 'status-warning';
  return 'status-draft';
};

const editModule = (item) => console.log('Modifier :', item);
const confirmDelete = (item) => {
  if (confirm(`Supprimer "${item.designation}" ?`)) {
    concoursStore.removeConcours(item.id);
  }
};

onMounted(async () => {
  await concoursStore.fetchConcours();
});
</script>

<style scoped>
.status-badge {
  padding: 0.4em 0.8em;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  color: #fff;
  display: inline-block;
  text-transform: uppercase;
}
.status-draft { background-color: #c34f49; }
.status-active { background-color: #198754; }
.status-warning { background-color: #ffc107; color: #000; }
</style>