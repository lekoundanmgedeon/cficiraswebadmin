<script setup>
import { onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { formatDate } from '@/shared/utils/date';
import ItemActions from '@/shared/components/ItemActions.vue';
import EmptyState from '@/shared/components/EmptyState.vue';
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue';
import { useAnneeStore } from '../../store';
import { useAnneeForm } from '../../composables/useAnneeForm';
import { mapStatut } from '../../constants';
import AnneeDetailsModal from '../AnneeDetailsModal.vue';

const anneeStore = useAnneeStore();
const { items: annees, loading } = storeToRefs(anneeStore);
const { openEdit } = useAnneeForm();

// Le store sert le cache s'il est encore valide : revenir sur cet onglet ne
// redéclenche pas d'appel réseau.
onMounted(() => anneeStore.fetchAll());

const detailsItem = ref(null);

/** @param {any} annee */
const actionsFor = (annee) => [
  { key: 'details', label: 'Détails', icon: 'mdi-information-outline' },
  { key: 'edit', label: 'Modifier', icon: 'mdi-pencil-outline' },
  {
    key: 'toggle',
    label: annee.est_active ? 'Désactiver' : 'Activer',
    icon: 'mdi-toggle-switch',
    variant: annee.est_active ? 'warning' : 'success',
    confirm: {
      title: annee.est_active ? 'Désactivation' : 'Activation',
      variant: annee.est_active ? 'warning' : 'success',
    },
  },
  {
    key: 'delete',
    label: 'Supprimer',
    icon: 'mdi-delete-outline',
    variant: 'danger',
    divider: true,
    confirm: {
      title: 'Confirmation de suppression',
      message: `Voulez-vous vraiment supprimer l'année « ${annee.code} » ? Cette action est irréversible.`,
    },
  },
];

/** @param {{key: string, item: any}} event */
function onAction({ key, item }) {
  const handlers = {
    details: () => (detailsItem.value = item),
    edit: () => openEdit(item),
    toggle: () => anneeStore.activate(item.id),
    delete: () => anneeStore.remove(item.id),
  };
  handlers[key]?.();
}
</script>

<template>
  <div>
    <h4>Liste des années académiques</h4>
    <p>Consultez, modifiez ou activez les années académiques déclarées.</p>

    <LoadingSpinner v-if="loading" />

    <EmptyState
      v-else-if="annees.length === 0"
      title="Aucune année académique enregistrée"
      description="Créez une première année depuis le bouton « Ajouter un nouveau »."
    />

    <div v-else class="table-responsive">
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
          <tr v-for="(annee, index) in annees" :key="annee.id">
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
              <ItemActions
                :item="annee"
                :label="annee.code"
                :actions="actionsFor(annee)"
                @action="onAction"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <AnneeDetailsModal
      :model-value="detailsItem !== null"
      :item="detailsItem"
      @update:model-value="detailsItem = null"
    />
  </div>
</template>
