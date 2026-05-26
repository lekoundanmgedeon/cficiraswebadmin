<template>
  <div class="container-fluid py-4 animate__animated animate__fadeIn">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <div>
        <h4 class="fw-bold text-dark mb-0">Classes & Parcours — {{ currentTabLabel }}</h4>
        <p class="text-muted small mb-0">Suivi du Semestre {{ selectedSemestre }}</p>
      </div>
    </div>

    <div class="table-responsive">
      <table class="table table-hover align-middle">
        <thead class="bg-light">
          <tr>
            <th class="ps-3">Code Classe</th>
            <th>Filière Affectée</th>
            <th class="text-center">Semestre</th>
            <th class="text-center">Type Évaluation</th>
            <th class="text-center">État de Saisie</th>
            <th class="text-end pe-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="classe in filteredClasses" :key="classe.classe_id">
            <td class="ps-3 fw-bold text-dark">{{ classe.classe_code }}</td>
            <td>{{ classe.filiere_nom }}</td>
            <td class="text-center">
              <span class="badge bg-light text-dark border px-3 py-1">S{{ selectedSemestre }}</span>
            </td>
            <td class="text-center">
              <small class="fw-semibold text-uppercase text-muted">{{ activeTab }}</small>
            </td>
            <td class="text-center">
              <span
                :class="[
                  'status-badge px-3 py-2 rounded-pill small',
                  classe.effectif_actuel % 2 === 0
                    ? 'status-active text-success bg-soft-success'
                    : 'status-draft text-warning bg-soft-warning',
                ]"
              >
                {{ classe.effectif_actuel % 2 === 0 ? 'Validé & Clos' : 'Partiel / À compléter' }}
              </span>
            </td>
            <td class="text-end pe-3">
              <div class="dropdown">
                <button
                  class="btn btn-sm btn-outline-primary dropdown-toggle px-3"
                  data-bs-toggle="dropdown"
                >
                  <i class="mdi mdi-dots-horizontal me-1"></i> Gérer
                </button>
                <ul class="dropdown-menu shadow-sm dropdown-menu-end">
                  <li>
                    <a class="dropdown-item" href="#" @click.prevent="consulterNotes(classe)"
                      >Voir les notes</a
                    >
                  </li>
                  <li>
                    <a class="dropdown-item" href="#" @click.prevent="ouvrirSaisieRapide(classe)"
                      >Modifier les saisies</a
                    >
                  </li>
                  <li class="dropdown-divider"></li>
                  <li>
                    <a
                      class="dropdown-item text-success"
                      href="#"
                      @click.prevent="validerNotesSession(classe)"
                      >Valider définitivement</a
                    >
                  </li>
                </ul>
              </div>
            </td>
          </tr>
          <tr v-if="filteredClasses.length === 0">
            <td colspan="6" class="text-center py-5">
              <p class="text-muted mb-0">
                Aucun enregistrement ne correspond aux filtres appliqués.
              </p>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import SkeletonLoader from '@/components/SkeletonLoader.vue';
import { useClasseStore } from '@/stores/academiqueStore/classeStore';

const classeStore = useClasseStore();

// Filtres et États réactifs locaux
const activeTab = ref('overview'); // Types gérés : 'overview', 'CC', 'SESSION_ORDINAIRE', 'RATTRAPAGE'
const selectedSemestre = ref(1);
const searchQuery = ref('');

// Libellé dynamique pour l'affichage textuel de l'onglet courant
const currentTabLabel = computed(() => {
  switch (activeTab.value) {
    case 'CC':
      return 'Contrôles Continus';
    case 'SESSION_ORDINAIRE':
      return 'Examens Partiels (Ordinaires)';
    case 'RATTRAPAGE':
      return 'Sessions de Rattrapage';
    default:
      return 'Général';
  }
});

// Récupération sécurisée et centralisée des classes via le store existant
const classes = computed(() => (Array.isArray(classeStore.classes) ? classeStore.classes : []));

// Filtrage multi-critères : Recherche textuelle unifiée (Code classe ou Nom Filière)
const filteredClasses = computed(() => {
  return classes.value.filter((c) => {
    const q = searchQuery.value.toLowerCase().trim();
    const matchSearch =
      !q || c.classe_code?.toLowerCase().includes(q) || c.filiere_nom?.toLowerCase().includes(q);
    return matchSearch;
  });
});

// Lifecycle : Chargement initial unifié
onMounted(() => {
  classeStore.fetchClasses();
});

// Reset des recherches lors du changement de contexte d'onglets
watch(activeTab, () => {
  searchQuery.value = '';
});

/* ===================== Logique métier & placeholders d'intégration backend ===================== */
const consulterNotes = (classe) => {
  console.log(
    `Consultation des notes de la classe: ${classe.classe_code} (Type: ${activeTab.value}, Semestre: ${selectedSemestre.value})`
  );
};

const ouvrirSaisieRapide = (classe) => {
  console.log(
    `Redirection ou ouverture de la grille d'édition pour la classe: ${classe.classe_code}`
  );
};

const validerNotesSession = (classe) => {
  console.log(`Verrouillage et envoi des validations pour la classe: ${classe.classe_code}`);
};

const triggerImport = (format) => {
  console.log(`Déclenchement du flux d'importation au format : ${format}`);
};

const exportData = () => {
  console.log(`Génération des fichiers d'extraction pour le type : ${activeTab.value}`);
};
</script>
