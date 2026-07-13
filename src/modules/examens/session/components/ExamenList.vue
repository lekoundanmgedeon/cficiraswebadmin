<script setup>
import { computed, onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import ItemActions from '@/shared/components/ItemActions.vue';
import { formatDate } from '@/shared/utils/date';
import { useSessionStore } from '../store';
import { useSessionForm } from '../composables/useSessionForm';
import { ETAT_SESSION_LIST, TYPES_SESSION, etatSessionInfo, numeroSemestre } from '../../constants';

const props = defineProps({
  /** 0 = Tout · 1 = Semestres impairs · 2 = Semestres pairs. */
  semestreGroup: { type: Number, required: true },
});

/**
 * Liste des sessions d'examen.
 *
 * Le tableau et ses filtres sont ceux de l'original. Trois défauts corrigés :
 *
 * - `@edit="handleEdit"` appelait `fetchSessionById()` **sans ouvrir de modale** —
 *   et le `editModalTarget="#editExamModal"` visait une modale **qui n'existait
 *   nulle part**. On ne pouvait pas modifier une session.
 * - `exam.etat.toLowerCase()` était appelé **sans garde** : une session dont
 *   l'état est `null` faisait planter le rendu de toute la ligne.
 * - La suppression passait par un `confirm()` natif bloquant ; `ItemActions`
 *   fournit la confirmation.
 *
 * S'ajoute le changement d'état (`ACTIVE` / `INACTIVE` / `ARCHIVE`), que le
 * store savait faire mais qu'aucun bouton n'exposait — et qui, de toute façon,
 * répondait 404 : le chemin de la route était doublé côté serveur.
 */

const sessionStore = useSessionStore();
const { items: sessions, loading } = storeToRefs(sessionStore);
const { openEdit } = useSessionForm();

const types = TYPES_SESSION;
const selectedType = ref('NORMALE');

onMounted(() => sessionStore.fetchAll());

const filteredExams = computed(() =>
  sessions.value.filter((exam) => {
    if (exam.type_session !== selectedType.value) return false;

    // Onglet « Tout » : pas de tri pair / impair.
    if (props.semestreGroup === 0) return true;

    const numero = numeroSemestre(exam.semestre_code);
    if (numero === null) return false;

    const impair = numero % 2 !== 0;
    return props.semestreGroup === 1 ? impair : !impair;
  })
);

const setType = (value) => {
  selectedType.value = value;
};

/** @param {any} exam */
function actionsFor(exam) {
  const etat = etatSessionInfo(exam.etat).code;

  return [
    { key: 'edit', label: 'Modifier', icon: 'mdi-pencil-outline' },
    ...ETAT_SESSION_LIST.filter((cible) => cible.code !== etat).map((cible) => ({
      key: `etat:${cible.code}`,
      label: `Passer à « ${cible.label} »`,
      icon: 'mdi-swap-horizontal',
    })),
    {
      key: 'delete',
      label: 'Supprimer',
      icon: 'mdi-delete-outline',
      variant: 'danger',
      divider: true,
      confirm: { title: 'Confirmation de suppression' },
    },
  ];
}

/** @param {{key: string, item: any}} event */
function onAction({ key, item }) {
  if (key === 'edit') return openEdit(item);
  if (key === 'delete') return sessionStore.remove(item.id);

  if (key.startsWith('etat:')) {
    sessionStore.changeEtat(item.id, key.slice('etat:'.length));
  }
}
</script>

<template>
  <div class="d-flex flex-wrap justify-content-xl-between">
    <div class="card-body p-0">
      <h4 class="card-title">
        Examens —
        <span v-if="semestreGroup === 0">Tous les semestres</span>
        <span v-else-if="semestreGroup === 1">Semestres Impairs</span>
        <span v-else>Semestres Pairs</span>
      </h4>
      <p class="card-description text-muted">
        Liste filtrée selon la période de l'année universitaire.
      </p>

      <div class="d-flex mb-3">
        <button
          v-for="type in types"
          :key="type.code"
          :class="['btn', type.code === selectedType ? 'btn-primary' : 'btn-outline-dark', 'me-2']"
          @click="setType(type.code)"
        >
          {{ type.label }}
        </button>
      </div>

      <div v-if="loading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Chargement...</span>
        </div>
      </div>

      <div v-else class="table-scrollable">
        <table class="table table-hover align-middle">
          <thead>
            <tr>
              <th>Code</th>
              <th>Désignation</th>
              <th>État</th>
              <th>Date début</th>
              <th>Date fin</th>
              <th>Responsable</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="exam in filteredExams" :key="exam.id">
              <td>
                <span class="badge bg-light text-dark border">{{ exam.semestre_code }}</span>
              </td>
              <td>{{ exam.designation }}</td>
              <td>
                <!-- `exam.etat.toLowerCase()` sans garde faisait planter la ligne
                     entière sur un état nul. `etatSessionInfo` absorbe le cas. -->
                <span
                  class="status-badge"
                  :class="
                    etatSessionInfo(exam.etat).code === 'ACTIVE' ? 'status-active' : 'status-draft'
                  "
                >
                  {{ etatSessionInfo(exam.etat).label }}
                </span>
              </td>
              <td>{{ formatDate(exam.date_debut, 'Non défini') }}</td>
              <td>{{ formatDate(exam.date_fin, 'Non défini') }}</td>
              <td>{{ exam.responsable || 'Non assigné' }}</td>
              <td>
                <ItemActions
                  :item="exam"
                  :label="exam.designation"
                  :actions="actionsFor(exam)"
                  :loading="loading"
                  @action="onAction"
                />
              </td>
            </tr>

            <tr v-if="filteredExams.length === 0">
              <td colspan="7" class="text-center py-4">
                <div class="d-flex flex-column align-items-center">
                  <img src="/img/empty-box.svg" alt="Aucune donnée" class="mb-2" width="64" />
                  <div class="text-secondary">Aucun examen ne correspond à ces critères.</div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.status-badge {
  padding: 0.4em 0.8em;
  border-radius: 20px;
  font-size: 0.8rem;
  color: #fff;
  display: inline-block;
  text-transform: capitalize;
}
.status-draft {
  background-color: #6c757d;
}
.status-active {
  background-color: #0d6efd;
}
.table thead th {
  border-bottom: 2px solid #dee2e6;
  font-weight: 600;
}
</style>
