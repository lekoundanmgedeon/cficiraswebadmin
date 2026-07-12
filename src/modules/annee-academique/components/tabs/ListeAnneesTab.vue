<script setup>
import { onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { formatDate } from '@/shared/utils/date';
import { useAnneeStore } from '../../store/anneeStore';
import { useAnneeForm } from '../../composables/useAnneeForm';
import { mapStatut } from '../../constants';
import AnneeItemActions from '../AnneeItemActions.vue';

const anneeStore = useAnneeStore();
const { items: annees, loading } = storeToRefs(anneeStore);
const { openEdit } = useAnneeForm();

// Le store sert le cache s'il est encore valide : revenir sur cet onglet ne
// redéclenche pas d'appel réseau.
onMounted(() => anneeStore.fetchAll());
</script>

<template>
  <div class="row">
    <h4>Liste des années académiques</h4>
    <p>Consultez, modifiez ou activez les années académiques déclarées.</p>

    <div class="table-responsive">
      <table class="table table-striped">
        <thead>
          <tr>
            <th>#</th>
            <th>Code</th>
            <th>Début</th>
            <th>Fin</th>
            <th>Statut</th>
            <th>Active</th>
            <th><span class="visually-hidden">Actions</span></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="7" class="text-center py-4">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Chargement…</span>
              </div>
            </td>
          </tr>

          <tr v-else-if="annees.length === 0">
            <td colspan="7" class="text-center py-4">
              <div class="d-flex flex-column align-items-center">
                <img src="/img/empty-box.svg" alt="" class="mb-2" />
                <div class="text-muted">Aucune année académique enregistrée</div>
              </div>
            </td>
          </tr>

          <tr v-for="(annee, index) in annees" v-else :key="annee.id">
            <td>{{ index + 1 }}</td>
            <td class="fw-bold">{{ annee.code }}</td>
            <td>{{ formatDate(annee.date_debut) }}</td>
            <td>{{ formatDate(annee.date_fin) }}</td>
            <td>
              <span :class="mapStatut(annee.statut).class">
                {{ mapStatut(annee.statut).label }}
              </span>
            </td>
            <td>
              <span :class="annee.est_active ? 'badge bg-success' : 'badge bg-secondary'">
                {{ annee.est_active ? 'Actif' : 'Inactif' }}
              </span>
            </td>
            <td>
              <AnneeItemActions
                :item="annee"
                @edit="openEdit"
                @delete="anneeStore.remove($event.id)"
                @toggle-status="anneeStore.activate($event.id)"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
