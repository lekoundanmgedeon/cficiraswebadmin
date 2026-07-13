<script setup>
import { computed, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import ItemActions from '@/shared/components/ItemActions.vue';
import ExportMenu from '@/shared/components/ExportMenu.vue';
import EmptyState from '@/shared/components/EmptyState.vue';
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue';
import { useTableExport } from '@/shared/composables/useTableExport';
import { formatDate } from '@/shared/utils/date';
import { useSemestreStore } from '../../store';
import { useSemestreForm } from '../../composables/useSemestreForm';

const semestreStore = useSemestreStore();
const { loading } = storeToRefs(semestreStore);
const { openEdit } = useSemestreForm();

onMounted(() => semestreStore.fetchAll());

/**
 * Projection des champs de l'API vers des noms lisibles par le template.
 * Le backend renvoie `annee_academique_code`, `est_actif`, etc.
 */
const semestres = computed(() =>
  semestreStore.items.map((semestre) => ({
    id: semestre.id,
    code: semestre.code,
    annee: semestre.annee_academique_code,
    dateDebut: semestre.date_debut,
    dateFin: semestre.date_fin,
    actif: semestre.est_actif,
  }))
);

const exportRows = computed(() =>
  semestres.value.map((semestre, index) => ({
    Rang: index + 1,
    Code: semestre.code,
    'Année académique': semestre.annee,
    'Date début': formatDate(semestre.dateDebut),
    'Date fin': formatDate(semestre.dateFin),
    Statut: semestre.actif ? 'Actif' : 'Inactif',
  }))
);

const { exportToExcel, exportToPdf } = useTableExport({
  rows: exportRows,
  title: 'Liste des semestres',
  fileBaseName: 'semestres',
});

/** @param {any} semestre */
const actionsFor = (semestre) => [
  { key: 'edit', label: 'Modifier', icon: 'mdi-pencil-outline' },
  {
    key: 'toggle',
    label: semestre.actif ? 'Désactiver' : 'Activer',
    icon: 'mdi-toggle-switch',
    variant: semestre.actif ? 'warning' : 'success',
    confirm: {
      title: semestre.actif ? 'Désactivation' : 'Activation',
      variant: semestre.actif ? 'warning' : 'success',
    },
  },
  {
    key: 'delete',
    label: 'Supprimer',
    icon: 'mdi-delete-outline',
    variant: 'danger',
    divider: true,
    confirm: { title: 'Confirmation de suppression' },
  },
];

/**
 * L'ancienne version câblait `@edit` sur un `editSemestre` réduit à un
 * `console.log` : modifier un semestre était sans effet.
 * @param {{key: string, item: any}} event
 */
function onAction({ key, item }) {
  const handlers = {
    edit: () => openEdit(semestreStore.getById(item.id) ?? item),
    toggle: () => semestreStore.changeStatus(item.id, { est_actif: !item.actif }),
    delete: () => semestreStore.remove(item.id),
  };
  handlers[key]?.();
}
</script>

<template>
  <div>
    <div class="d-flex justify-content-between align-items-center mb-3">
      <div>
        <h4>Liste des semestres</h4>
        <p class="text-muted small mb-0">
          Suivi et gestion des semestres académiques enregistrés.
        </p>
      </div>
      <ExportMenu @excel="exportToExcel" @pdf="exportToPdf" />
    </div>

    <LoadingSpinner v-if="loading" />

    <EmptyState
      v-else-if="semestres.length === 0"
      title="Aucun semestre enregistré"
      description="Créez un premier semestre depuis le bouton « Ajouter un nouveau »."
    />

    <div v-else class="table-responsive card border-0 shadow-sm">
      <table class="table align-middle mb-0 table-hover">
        <thead class="table-light">
          <tr>
            <th class="ps-3" style="width: 60px">#</th>
            <th>Code</th>
            <th>Année académique</th>
            <th>Date début</th>
            <th>Date fin</th>
            <th class="text-center">Statut</th>
            <th class="text-end pe-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(semestre, index) in semestres" :key="semestre.id">
            <td class="ps-3 text-muted">{{ index + 1 }}</td>
            <td>
              <strong class="text-dark">{{ semestre.code }}</strong>
            </td>
            <td>{{ semestre.annee || '-' }}</td>
            <td>{{ formatDate(semestre.dateDebut) }}</td>
            <td>{{ formatDate(semestre.dateFin) }}</td>
            <td class="text-center">
              <span class="badge" :class="semestre.actif ? 'bg-success' : 'bg-secondary'">
                {{ semestre.actif ? 'Actif' : 'Inactif' }}
              </span>
            </td>
            <td class="text-end pe-3">
              <ItemActions
                :item="semestre"
                :label="semestre.code"
                :actions="actionsFor(semestre)"
                @action="onAction"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
