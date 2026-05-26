<template>
  <div class="container-fluid py-4 animate__animated animate__fadeIn">
    <!-- En-tête de la page -->
    <div
      class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4"
    >
      <div>
        <h4 class="fw-bold text-dark mb-1">
          <i class="bi bi-archive text-secondary me-2"></i>Archives des Concours
        </h4>
        <p class="text-muted small mb-0">
          Consultez l'historique complet des sessions passées, les classements définitifs et les
          procès-verbaux officiels.
        </p>
      </div>

      <!-- Barre d'outils globale -->
      <div class="d-flex gap-2">
        <button
          class="btn btn-sm btn-light border text-secondary"
          @click="refreshArchives"
          title="Actualiser la liste"
        >
          <i class="bi bi-arrow-clockwise"></i>
        </button>
      </div>
    </div>

    <!-- Barre de Recherche et Filtres -->
    <div class="card border shadow-sm rounded-3 mb-4 bg-white">
      <div class="card-body p-3">
        <div class="row g-3">
          <!-- Recherche par mot-clé -->
          <div class="col-12 col-md-5">
            <div class="input-group input-group-sm">
              <span class="input-group-text bg-light text-muted border-end-0">
                <i class="bi bi-search"></i>
              </span>
              <input
                v-model="filters.search"
                type="text"
                class="form-control form-control-sm border-start-0"
                placeholder="Rechercher par libellé ou code..."
              />
            </div>
          </div>

          <!-- Filtre par Année / Session -->
          <div class="col-12 col-sm-6 col-md-3">
            <select
              v-model="filters.year"
              class="form-select form-select-sm fw-medium text-secondary"
            >
              <option value="">Toutes les années</option>
              <option v-for="year in availableYears" :key="year" :value="year">
                Session {{ year }}
              </option>
            </select>
          </div>

          <!-- Filtre par Statut d'archivage -->
          <div class="col-12 col-sm-6 col-md-4 col-lg-4">
            <select
              v-model="filters.status"
              class="form-select form-select-sm fw-medium text-secondary"
            >
              <option value="">Tous les statuts d'archive</option>
              <option value="Clôturé">Clôturés officiellement</option>
              <option value="Annulé">Annulés / Incomplets</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- Tableau de la liste des archives -->
    <div class="table-responsive border rounded-3 shadow-sm bg-white">
      <table class="table table-hover align-middle mb-0 text-sm">
        <thead class="table-light text-uppercase font-monospace text-xs">
          <tr>
            <th class="ps-3" style="width: 10%">Session</th>
            <th style="width: 15%">Code</th>
            <th style="width: 35%">Intitulé du Concours</th>
            <th class="text-center" style="width: 15%">Candidats inscrits</th>
            <th style="width: 13%">Statut Final</th>
            <th class="text-end pe-3" style="width: 12%">Actions</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="item in filteredArchives" :key="item.id">
            <!-- Session -->
            <td class="ps-3 font-monospace fw-bold text-dark">
              {{ item.session }}
            </td>

            <!-- Code -->
            <td>
              <span class="badge bg-light text-secondary border font-monospace">{{
                item.code
              }}</span>
            </td>

            <!-- Intitulé -->
            <td>
              <div class="fw-semibold text-dark mb-0 line-clamp-1">{{ item.libelle }}</div>
              <small class="text-xs text-muted"
                >Archivé le {{ formatDate(item.date_archivage) }}</small
              >
            </td>

            <!-- Nombre de candidats -->
            <td class="text-center font-monospace fw-semibold text-secondary">
              {{ item.total_candidats }}
            </td>

            <!-- Statut Final -->
            <td>
              <span
                class="badge px-2.5 py-1 text-xs fw-semibold"
                :class="getStatusClass(item.statut_final)"
              >
                <i
                  class="bi me-1"
                  :class="
                    item.statut_final === 'Clôturé' ? 'bi-check-circle-fill' : 'bi-x-circle-fill'
                  "
                ></i>
                {{ item.statut_final }}
              </span>
            </td>

            <!-- Actions de consultation -->
            <td class="text-end pe-3">
              <div class="d-flex justify-content-end gap-1">
                <button
                  class="btn btn-sm btn-link text-primary p-1"
                  @click="viewDetails(item)"
                  title="Consulter le classement final et statistiques"
                >
                  <i class="bi bi-eye"></i>
                </button>
                <button
                  class="btn btn-sm btn-link text-danger p-1"
                  @click="downloadFinalPV(item)"
                  title="Télécharger le PV de délibération officiel (PDF)"
                >
                  <i class="bi bi-file-pdf"></i>
                </button>
                <button
                  class="btn btn-sm btn-link text-secondary p-1"
                  @click="unarchiveConcours(item)"
                  title="Désarchiver (Restaurer)"
                >
                  <i class="bi bi-arrow-counterclockwise"></i>
                </button>
              </div>
            </td>
          </tr>

          <!-- État de la table vide -->
          <tr v-if="filteredArchives.length === 0">
            <td colspan="6" class="text-center text-muted py-5">
              <i class="bi bi-folder-x display-6 text-muted d-block mb-2"></i>
              Aucun concours archivé ne correspond à vos critères de recherche.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useNotifier } from '@/stores/messages/useNotifier';

const { notifySuccess, notifyError } = useNotifier();

// États réactifs
const archives = ref([]);
const availableYears = ref([2026, 2025, 2024, 2023]);
const filters = ref({
  search: '',
  year: '',
  status: '',
});

onMounted(() => {
  loadArchives();
});

// Chargement des données fictives / API
const loadArchives = async () => {
  try {
    // Remplacer par l'appel à ton service d'archives Node.js
    archives.value = [
      {
        id: 1,
        session: 2025,
        code: 'CONC-INFO-2025',
        libelle: "Concours d'Entrée en Génie Informatique",
        total_candidats: 145,
        statut_final: 'Clôturé',
        date_archivage: '2025-09-15T14:30:00Z',
      },
      {
        id: 2,
        session: 2025,
        code: 'CONC-MGT-2025',
        libelle: 'Concours Licence Management des Organisations',
        total_candidats: 89,
        statut_final: 'Clôturé',
        date_archivage: '2025-10-02T10:15:00Z',
      },
      {
        id: 3,
        session: 2024,
        code: 'CONC-MED-2024',
        libelle: "Concours Spécial d'Accès aux Études Médicales",
        total_candidats: 320,
        statut_final: 'Clôturé',
        date_archivage: '2024-07-20T16:00:00Z',
      },
      {
        id: 4,
        session: 2024,
        code: 'CONC-X-2024',
        libelle: "Concours d'Admission Session Extraordinaire (Annulé)",
        total_candidats: 12,
        statut_final: 'Annulé',
        date_archivage: '2024-08-05T11:00:00Z',
      },
    ];
  } catch (err) {
    notifyError('Erreur lors de la récupération des archives.');
  }
};

// Algorithme de filtrage cumulatif
const filteredArchives = computed(() => {
  return archives.value.filter((item) => {
    const matchSearch =
      !filters.value.search ||
      item.libelle.toLowerCase().includes(filters.value.search.toLowerCase()) ||
      item.code.toLowerCase().includes(filters.value.search.toLowerCase());

    const matchYear = !filters.value.year || item.session === Number(filters.value.year);
    const matchStatus = !filters.value.status || item.statut_final === filters.value.status;

    return matchSearch && matchYear && matchStatus;
  });
});

const getStatusClass = (status) => {
  if (status === 'Clôturé') return 'bg-success-subtle text-success border border-success-subtle';
  return 'bg-danger-subtle text-danger border border-danger-subtle';
};

const formatDate = (isoString) => {
  if (!isoString) return '—';
  return new Date(isoString).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const refreshArchives = () => {
  loadArchives();
  notifySuccess('Données des archives actualisées.');
};

const viewDetails = (item) => {
  console.log('Consultation du concours ID:', item.id);
  // Rediriger ou ouvrir un modal de statistiques historiques
};

const downloadFinalPV = (item) => {
  console.log("Téléchargement du PV signé pour l'ID:", item.id);
  notifySuccess('Téléchargement du PV officiel démarré.');
};

const unarchiveConcours = async (item) => {
  if (confirm(`Voulez-vous restaurer le concours "${item.libelle}" dans le registre actif ?`)) {
    try {
      // Intégrer la logique d'écriture en DB (Node/Express trigger ou update de statut)
      notifySuccess('Le concours a été remis à disposition dans la section active.');
      loadArchives(); // Rechargement
    } catch (err) {
      notifyError('Impossible de restaurer ce concours.');
    }
  }
};
</script>

<style scoped>
.text-xs {
  font-size: 0.75rem;
}
.text-sm {
  font-size: 0.875rem;
}

.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.bg-light-subtle {
  background-color: #f8fafc;
}

.btn-link:hover {
  text-decoration: none;
}
</style>
