<template>
  <h4 class="fw-bold text-dark mb-1">État Global des Évaluations Académiques</h4>
  <p class="text-muted small mb-4">
    Résumé de la complétude des saisies par classe pour l'année en cours
  </p>

  <div class="table-responsive">
    <table class="table table-hover align-middle">
      <thead class="bg-light">
        <tr>
          <th class="ps-3">Classe</th>
          <th>Filière</th>
          <th class="text-center">Saisie CC</th>
          <th class="text-center">Saisie Examens</th>
          <th class="text-center">Délibération</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="classe in filteredClasses" :key="classe.classe_id">
          <td class="ps-3 fw-bold text-primary">{{ classe.code }}</td>
          <td>{{ classe.filiere_nom || 'N/A' }}</td>
          <td class="text-center">
            <span class="badge bg-soft-success text-success rounded-pill px-3 py-2">Terminée</span>
          </td>
          <td class="text-center">
            <span class="badge bg-soft-warning text-dark rounded-pill px-3 py-2">En cours</span>
          </td>
          <td class="text-center">
            <span class="badge bg-soft-danger text-white rounded-pill px-3 py-2">En attente</span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import SkeletonLoader from '@/components/SkeletonLoader.vue';
import { useClasseStore } from '@/modules/structure-academique/classe/store';

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
<style scoped>
.bg-soft-success {
  background-color: rgba(40, 167, 69, 0.15); /* vert pâle */
  color: #28a745 !important;
}

.bg-soft-warning {
  background-color: rgba(255, 193, 7, 0.15); /* jaune pâle */
  color: #856404 !important;
}

.bg-soft-danger {
  background-color: rgba(220, 53, 69, 0.15); /* rouge pâle */
  color: #dc3545 !important;
}
</style>
