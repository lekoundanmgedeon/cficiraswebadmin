<template>
  <section class="container-fluid p-0">
    <!-- Header -->
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

    <!-- Loading -->
    <div v-if="loading" class="card border-0 shadow-sm rounded-4">
      <div class="card-body text-center py-5">
        <div class="spinner-border text-primary mb-3" role="status">
          <span class="visually-hidden">Chargement...</span>
        </div>
        <p class="text-muted mb-0 small">Chargement des concours...</p>
      </div>
    </div>

    <!-- Content -->
    <div v-else class="card border-0 shadow-sm rounded-4 overflow-hidden">
      <!-- Toolbar -->
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

      <!-- Table -->
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
            <tr v-for="(concoursItem, index) in paginatedConcours" :key="concoursItem.id">
              <td class="ps-4 text-muted small">
                {{ getRowNumber(index) }}
              </td>

              <td>
                <div class="fw-semibold text-dark">
                  {{ concoursItem.designation }}
                </div>
                <div class="text-muted small">
                  Année : {{ concoursItem.code_annee || 'Non renseignée' }}
                </div>
              </td>

              <td>
                <span
                  class="badge rounded-pill bg-secondary-subtle text-secondary fw-medium px-3 py-2"
                >
                  {{ concoursItem.libelle_type || concoursItem.type_concours || 'Non défini' }}
                </span>
              </td>

              <td>
                <div class="small text-secondary">
                  <div>
                    <span class="text-muted">Du :</span>
                    <span class="ms-1">{{ formatDate(concoursItem.date_debut) }}</span>
                  </div>
                  <div>
                    <span class="text-muted">Au :</span>
                    <span class="ms-1">{{ formatDate(concoursItem.date_fin) }}</span>
                  </div>
                </div>
              </td>

              <td>
                <span
                  class="badge rounded-pill badge-status"
                  :class="getStatusClass(concoursItem.statut)"
                >
                  {{ getStatusLabel(concoursItem.statut) }}
                </span>
              </td>

              <td class="text-end pe-4">
                <div class="d-flex justify-content-end align-items-center gap-2">
                  <RouterLink
                    :to="`/edition-concours/${concoursItem.id}/configurations`"
                    class="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1"
                  >
                    <i class="mdi mdi-cog-outline"></i>
                    <span class="d-none d-lg-inline">Configurer</span>
                  </RouterLink>

                  <ItemActions
                    :item="concoursItem"
                    :showAdd="false"
                    editModalTarget="#editModuleModal"
                    @edit="editModule"
                    @delete="confirmDelete"
                    @change-status="handleChangeStatus"
                  />
                </div>
              </td>
            </tr>

            <!-- Empty State -->
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

      <!-- Pagination -->
      <div class="card-footer bg-white border-top py-3">
        <Pagination
          v-model="currentPage"
          :items-per-page="itemsPerPage"
          :total-items="filteredConcours.length"
          @update:itemsPerPage="itemsPerPage = $event"
        />
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import dayjs from 'dayjs';

import { useConcoursStore } from '@/stores/gestionStores/concourStore';
import ItemActions from '../details/ItemActions.vue';
import Pagination from '@/components/shared/Pagination.vue';

const concoursStore = useConcoursStore();

const currentPage = ref(1);
const itemsPerPage = ref(10);
const searchQuery = ref('');

const loading = computed(() => concoursStore.loading);

const concoursList = computed(() => concoursStore.concoursList || []);

const filteredConcours = computed(() => {
  const query = searchQuery.value.toLowerCase().trim();

  if (!query) {
    return concoursList.value;
  }

  return concoursList.value.filter((concoursItem) => {
    return [
      concoursItem.designation,
      concoursItem.code_annee,
      concoursItem.statut,
      concoursItem.libelle_type,
      concoursItem.type_concours,
    ]
      .filter(Boolean)
      .some((value) => value.toString().toLowerCase().includes(query));
  });
});

const totalPages = computed(() => {
  return Math.max(1, Math.ceil(filteredConcours.value.length / itemsPerPage.value));
});

const paginatedConcours = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;

  return filteredConcours.value.slice(start, end);
});

const normalizeStatus = (status) => {
  return status ? status.toString().toUpperCase().trim() : '';
};

const getRowNumber = (index) => {
  return (currentPage.value - 1) * itemsPerPage.value + index + 1;
};

const formatDate = (date) => {
  return date ? dayjs(date).format('DD/MM/YYYY') : '—';
};

const getStatusLabel = (status) => {
  const normalizedStatus = normalizeStatus(status);

  const labels = {
    PLANIFIE: 'Planifié',
    OUVERT: 'Ouvert',
    CLOTURE: 'Clôturé',
    ANNULE: 'Annulé',
  };

  return labels[normalizedStatus] || 'Inconnu';
};

const getStatusClass = (status) => {
  const normalizedStatus = normalizeStatus(status);

  const classes = {
    PLANIFIE: 'badge-planifie',
    OUVERT: 'badge-ouvert',
    CLOTURE: 'badge-cloture',
    ANNULE: 'badge-annule',
  };

  return classes[normalizedStatus] || 'badge-default';
};

const handleChangeStatus = async ({ id, statut }) => {
  await concoursStore.updateConcoursStatus(id, {
    statut,
  });

  await concoursStore.fetchConcours();
};

const editModule = (item) => {
  console.log('Modifier :', item);
};

const confirmDelete = async (item) => {
  const confirmed = confirm(`Voulez-vous vraiment supprimer le concours "${item.designation}" ?`);

  if (!confirmed) return;

  await concoursStore.removeConcours(item.id);
};

watch([searchQuery, itemsPerPage], () => {
  currentPage.value = 1;
});

watch(totalPages, (pages) => {
  if (currentPage.value > pages) {
    currentPage.value = pages;
  }
});

onMounted(async () => {
  await concoursStore.fetchConcours();
});
</script>

<style scoped>
.card {
  transition: box-shadow 0.2s ease;
}

.table thead th {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  white-space: nowrap;
}

.table tbody td {
  vertical-align: middle;
}

.table-hover tbody tr:hover {
  background-color: #f8f9fa;
}

.input-group-text,
.form-control {
  border-color: #e9ecef;
}

.form-control:focus {
  box-shadow: none;
  border-color: #86b7fe;
}

.empty-state {
  max-width: 360px;
  margin: 0 auto;
}

.empty-icon {
  font-size: 2.5rem;
  color: #adb5bd;
}

/* Badges statut */
.badge-status {
  min-width: 88px;
  padding: 0.45rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.01em;
  border: 1px solid transparent;
}

/* PLANIFIE */
.badge-planifie {
  background-color: #e7f1ff;
  color: #0d6efd;
  border-color: #b6d4fe;
}

/* OUVERT */
.badge-ouvert {
  background-color: #e9f7ef;
  color: #198754;
  border-color: #badbcc;
}

/* CLOTURE */
.badge-cloture {
  background-color: #f1f3f5;
  color: #495057;
  border-color: #dee2e6;
}

/* ANNULE */
.badge-annule {
  background-color: #fdecea;
  color: #dc3545;
  border-color: #f5c2c7;
}

/* Statut inconnu */
.badge-default {
  background-color: #f8f9fa;
  color: #6c757d;
  border-color: #e9ecef;
}
</style>
