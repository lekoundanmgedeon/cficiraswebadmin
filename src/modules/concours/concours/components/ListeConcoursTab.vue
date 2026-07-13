<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import ItemActions from '@/shared/components/ItemActions.vue';
import Pagination from '@/components/shared/Pagination.vue';
import { formatDate } from '@/shared/utils/date';
import { useConcoursStore } from '../store';
import { useConcoursForm } from '../composables/useConcoursForm';
import { STATUT_CONCOURS_LIST, statutConcoursInfo } from '../../constants';

/**
 * Liste des concours.
 *
 * Le tableau, la barre de recherche et la pagination sont ceux de l'original.
 * Deux boutons y étaient morts :
 *
 * - `@edit="editModule"` → `console.log('Modifier :', item)`. Le bouton
 *   « Modifier » ne faisait **rien**, et son `editModalTarget="#editModuleModal"`
 *   visait une modale qui n'existait pas.
 * - `@change-status` appelait `concoursStore.updateConcoursStatus(...)`, alors
 *   que l'action du store s'appelle `changeStatut` : **`TypeError` au clic**.
 *   Changer le statut d'un concours n'a jamais fonctionné.
 *
 * La suppression passait par un `confirm()` natif bloquant ; `ItemActions`
 * fournit la confirmation.
 */

const concoursStore = useConcoursStore();
const { items: concoursList, loading } = storeToRefs(concoursStore);
const { openEdit } = useConcoursForm();

const searchQuery = ref('');
const currentPage = ref(1);
const itemsPerPage = ref(10);

onMounted(() => concoursStore.fetchAll());

const filteredConcours = computed(() => {
  const query = searchQuery.value.toLowerCase().trim();
  if (!query) return concoursList.value;

  return concoursList.value.filter((item) =>
    [item.designation, item.code_annee, item.statut, item.libelle_type, item.type_concours]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query))
  );
});

const totalPages = computed(() =>
  Math.max(1, Math.ceil(filteredConcours.value.length / itemsPerPage.value))
);

const paginatedConcours = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  return filteredConcours.value.slice(start, start + itemsPerPage.value);
});

const getRowNumber = (index) => (currentPage.value - 1) * itemsPerPage.value + index + 1;

/** @param {any} item */
function actionsFor(item) {
  const statut = statutConcoursInfo(item.statut).code;

  return [
    { key: 'edit', label: 'Modifier', icon: 'mdi-pencil-outline' },
    ...STATUT_CONCOURS_LIST.filter((cible) => cible.code !== statut).map((cible) => ({
      key: `statut:${cible.code}`,
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
  if (key === 'delete') return concoursStore.remove(item.id);

  if (key.startsWith('statut:')) {
    concoursStore.changeStatut(item.id, key.slice('statut:'.length));
  }
}

watch([searchQuery, itemsPerPage], () => {
  currentPage.value = 1;
});

watch(totalPages, (pages) => {
  if (currentPage.value > pages) currentPage.value = pages;
});
</script>

<template>
  <section class="container-fluid p-0">
    <div
      class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4"
    >
      <div>
        <h4 class="fw-bold text-dark mb-1">Liste des concours</h4>
        <p class="text-muted mb-0">
          Consultez, recherchez et configurez les concours ainsi que leurs différentes étapes.
        </p>
      </div>
    </div>

    <div v-if="loading" class="card border-0 shadow-sm rounded-4">
      <div class="card-body text-center py-5">
        <div class="spinner-border text-primary mb-3" role="status">
          <span class="visually-hidden">Chargement...</span>
        </div>
        <p class="text-muted mb-0 small">Chargement des concours...</p>
      </div>
    </div>

    <div v-else class="card border-0 shadow-sm rounded-4 overflow-hidden">
      <div class="card-header bg-white border-bottom py-3">
        <div class="row g-3 align-items-center justify-content-between">
          <div class="col-12 col-md-5 col-lg-4">
            <div class="input-group input-group-sm">
              <span class="input-group-text bg-light border-end-0 text-muted">
                <i class="mdi mdi-magnify"></i>
              </span>
              <input
                v-model="searchQuery"
                type="text"
                class="form-control bg-light border-start-0"
                placeholder="Rechercher par désignation, année, type ou statut..."
              />
            </div>
          </div>

          <div class="col-auto">
            <span class="badge bg-light text-secondary border fw-medium">
              {{ filteredConcours.length }} concours trouvé(s)
            </span>
          </div>
        </div>
      </div>

      <div class="table-md">
        <table class="table table-hover align-middle mb-0">
          <thead class="table-light">
            <tr class="text-uppercase small text-muted">
              <th scope="col" class="ps-4" style="width: 5%">#</th>
              <th scope="col">Désignation</th>
              <th scope="col">Type</th>
              <th scope="col">Période</th>
              <th scope="col">Statut</th>
              <th scope="col" class="text-end pe-4" style="width: 20%">Actions</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="(item, index) in paginatedConcours" :key="item.id">
              <td class="ps-4 text-muted small">{{ getRowNumber(index) }}</td>

              <td>
                <div class="fw-semibold text-dark">{{ item.designation }}</div>
                <div class="text-muted small">
                  Année : {{ item.code_annee || 'Non renseignée' }}
                </div>
              </td>

              <td>
                <span
                  class="badge rounded-pill bg-secondary-subtle text-secondary fw-medium px-3 py-2"
                >
                  {{ item.libelle_type || item.type_concours || 'Non défini' }}
                </span>
              </td>

              <td>
                <div class="small text-secondary">
                  <div>
                    <span class="text-muted">Du :</span>
                    <span class="ms-1">{{ formatDate(item.date_debut, '—') }}</span>
                  </div>
                  <div>
                    <span class="text-muted">Au :</span>
                    <span class="ms-1">{{ formatDate(item.date_fin, '—') }}</span>
                  </div>
                </div>
              </td>

              <td>
                <span
                  class="badge rounded-pill px-3 py-2"
                  :class="`bg-${statutConcoursInfo(item.statut).variant}-subtle text-${statutConcoursInfo(item.statut).variant}`"
                >
                  {{ statutConcoursInfo(item.statut).label }}
                </span>
              </td>

              <td class="text-end pe-4">
                <div class="d-flex justify-content-end align-items-center gap-2">
                  <RouterLink
                    :to="`/edition-concours/${item.id}/configurations`"
                    class="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1"
                  >
                    <i class="mdi mdi-cog-outline"></i>
                    <span class="d-none d-lg-inline">Configurer</span>
                  </RouterLink>

                  <ItemActions
                    :item="item"
                    :label="item.designation"
                    :actions="actionsFor(item)"
                    :loading="loading"
                    @action="onAction"
                  />
                </div>
              </td>
            </tr>

            <tr v-if="paginatedConcours.length === 0">
              <td colspan="6" class="text-center py-5">
                <div class="empty-state">
                  <i class="mdi mdi-folder-search-outline empty-icon"></i>
                  <h6 class="fw-semibold text-dark mb-1">Aucun concours trouvé</h6>
                  <p class="text-muted mb-0 small">
                    Essayez de modifier votre recherche ou vérifiez les données disponibles.
                  </p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="card-footer bg-white border-top py-3">
        <Pagination
          v-model="currentPage"
          :items-per-page="itemsPerPage"
          :total-items="filteredConcours.length"
          @update:items-per-page="itemsPerPage = $event"
        />
      </div>
    </div>
  </section>
</template>

<style scoped>
.card {
  transition: box-shadow 0.2s ease;
}

.table thead th {
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.03em;
}

.empty-icon {
  font-size: 2.5rem;
  color: #ced4da;
  display: block;
  margin-bottom: 0.5rem;
}
</style>
