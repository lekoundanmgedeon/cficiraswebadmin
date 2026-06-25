<template>
  <section class="container-fluid p-0">
    <!-- Header -->
    <div
      class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4"
    >
      <div>
        <h4 class="fw-bold text-dark mb-1">Résultats et proclamations des concours</h4>
        <p class="text-muted mb-0">
          Gérez les délibérations, calculez les moyennes, proclamez les résultats et téléchargez les
          listes officielles des admis.
        </p>
      </div>
    </div>

    <!-- Content -->
    <div class="card border-0 shadow-sm rounded-4 overflow-hidden">
      <!-- Loading -->
      <div v-if="loading" class="card-body">
        <SkeletonLoader type="table" :rows="3" :columns="6" />
      </div>

      <template v-else>
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
                  placeholder="Rechercher par désignation, session ou statut..."
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
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead class="table-light">
              <tr class="text-uppercase small text-muted">
                <th scope="col" class="ps-4" style="width: 5%">#</th>
                <th scope="col">Désignation</th>
                <th scope="col">Session</th>
                <th scope="col">Date de clôture</th>
                <th scope="col" class="text-center">Statut actuel</th>
                <th scope="col" class="text-end pe-4" style="width: 28%">
                  Actions de délibération
                </th>
              </tr>
            </thead>

            <tbody>
              <tr v-for="(resultat, index) in filteredConcours" :key="resultat.id">
                <td class="ps-4 text-muted small">
                  {{ index + 1 }}
                </td>

                <td>
                  <div class="fw-semibold text-dark">
                    {{ resultat.designation }}
                  </div>
                  <div class="text-muted small">
                    {{ resultat.libelle_type || resultat.type_concours || 'Type non défini' }}
                  </div>
                </td>

                <td>
                  <span
                    class="badge rounded-pill bg-light text-secondary border fw-medium px-3 py-2"
                  >
                    {{ resultat.code_annee || 'Non renseignée' }}
                  </span>
                </td>

                <td class="small text-secondary">
                  {{ formatDate(resultat.date_fin) }}
                </td>

                <td class="text-center">
                  <span
                    class="badge rounded-pill badge-status"
                    :class="getStatusBadgeClass(resultat.statut)"
                  >
                    {{ getStatusLabel(resultat.statut) }}
                  </span>
                </td>

                <td class="text-end pe-4">
                  <div
                    class="btn-group btn-group-sm"
                    role="group"
                    aria-label="Actions de délibération"
                  >
                    <button
                      type="button"
                      @click="handleCalculerRangs(resultat.id)"
                      class="btn btn-outline-info d-inline-flex align-items-center gap-1"
                      title="Calculer les moyennes et générer les rangs"
                    >
                      <i class="mdi mdi-calculator"></i>
                      <span class="d-none d-xl-inline">Rangs</span>
                    </button>

                    <button
                      v-if="canProclaim(resultat.statut)"
                      type="button"
                      @click="handleProclamer(resultat.id)"
                      class="btn btn-outline-success d-inline-flex align-items-center gap-1"
                      title="Proclamer officiellement les admissions"
                    >
                      <i class="mdi mdi-bullhorn-outline"></i>
                      <span class="d-none d-xl-inline">Proclamer</span>
                    </button>

                    <button
                      type="button"
                      @click="handleDownloadAdmis(resultat.id)"
                      class="btn btn-outline-danger d-inline-flex align-items-center gap-1"
                      title="Télécharger la liste des admis en PDF"
                    >
                      <i class="mdi mdi-file-pdf-box"></i>
                      <span class="d-none d-xl-inline">PDF</span>
                    </button>
                  </div>
                </td>
              </tr>

              <!-- Empty State -->
              <tr v-if="filteredConcours.length === 0">
                <td colspan="6" class="text-center py-5">
                  <div class="empty-state">
                    <i class="mdi mdi-file-search-outline empty-icon"></i>
                    <h6 class="fw-semibold text-dark mb-1">Aucun concours trouvé</h6>
                    <p class="text-muted mb-0 small">
                      Essayez de modifier votre recherche ou vérifiez les concours disponibles.
                    </p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import dayjs from 'dayjs';

import { useConcoursStore } from '@/stores/gestionStores/concourStore';
import SkeletonLoader from '@/components/SkeletonLoader.vue';

const concoursStore = useConcoursStore();

const searchQuery = ref('');

const loading = computed(() => concoursStore.loading);
const concoursList = computed(() => concoursStore.concoursList || []);

const filteredConcours = computed(() => {
  const query = searchQuery.value.toLowerCase().trim();

  if (!query) {
    return concoursList.value;
  }

  return concoursList.value.filter((concours) => {
    return [
      concours.designation,
      concours.libelle_type,
      concours.type_concours,
      concours.code_annee,
      concours.statut,
      getStatusLabel(concours.statut),
    ]
      .filter(Boolean)
      .some((value) => value.toString().toLowerCase().includes(query));
  });
});

const normalizeStatus = (status) => {
  return status
    ? status
        .toString()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase()
        .trim()
    : '';
};

const formatDate = (date) => {
  return date ? dayjs(date).format('DD/MM/YYYY') : 'Non définie';
};

const getStatusLabel = (status) => {
  const normalizedStatus = normalizeStatus(status);

  const labels = {
    PLANIFIE: 'Planifié',
    OUVERT: 'Ouvert',
    CLOTURE: 'Clôturé',
    ANNULE: 'Annulé',
    PROCLAME: 'Proclamé',
  };

  return labels[normalizedStatus] || 'Inconnu';
};

const getStatusBadgeClass = (status) => {
  const normalizedStatus = normalizeStatus(status);

  const classes = {
    PLANIFIE: 'badge-planifie',
    OUVERT: 'badge-ouvert',
    CLOTURE: 'badge-cloture',
    ANNULE: 'badge-annule',
    PROCLAME: 'badge-proclame',
  };

  return classes[normalizedStatus] || 'badge-default';
};

const canProclaim = (status) => {
  const normalizedStatus = normalizeStatus(status);

  return normalizedStatus !== 'PROCLAME' && normalizedStatus !== 'ANNULE';
};

const handleCalculerRangs = async (id) => {
  const confirmed = confirm(
    "Voulez-vous lancer le calcul des moyennes globales et l'attribution des rangs ?"
  );

  if (!confirmed) return;

  await concoursStore.fetchMoyennesRangs(id);
};

const handleProclamer = async (id) => {
  const confirmed = confirm(
    'Attention : cette action va figer les notes et publier officiellement la liste des candidats admis. Continuer ?'
  );

  if (!confirmed) return;

  await concoursStore.proclaimAdmissions(id);
};

const handleDownloadAdmis = async (id) => {
  await concoursStore.downloadAdmisList(id);
};

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

.btn-sm {
  padding: 0.35rem 0.6rem;
  font-size: 0.8rem;
  font-weight: 500;
}
.btn-group-sm > .btn {
  padding: 0.35rem 0.6rem;
  font-size: 0.8rem;
  font-weight: 500;
}

.btn-group .btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn-group .mdi {
  font-size: 1rem;
}
.empty-state {
  max-width: 380px;
  margin: 0 auto;
}

.empty-icon {
  font-size: 2.5rem;
  color: #adb5bd;
}

/* Badges statut */
.badge-status {
  min-width: 92px;
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

/* PROCLAME */
.badge-proclame {
  background-color: #e6f4ea;
  color: #146c43;
  border-color: #a3cfbb;
}

/* Statut inconnu */
.badge-default {
  background-color: #f8f9fa;
  color: #6c757d;
  border-color: #e9ecef;
}
</style>
