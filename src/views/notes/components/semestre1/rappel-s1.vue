<template>
  <div class="animate__animated animate__fadeIn">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <div>
        <h5 class="fw-bold text-secondary mb-0">
          <i class="bi bi-calendarme-2"></i>Liste des Classes — {{ currentTabLabel }}
        </h5>
        <p class="text-muted small mb-0">Suivi du Semestre {{ semestre }}</p>
      </div>
    </div>

    <div class="table-responsive bg-white rounded shadow-sm">
      <table class="table table-hover align-middle mb-0">
        <thead class="table-light">
          <tr>
            <th class="ps-3" style="width: 15%">Code Classe</th>
            <th style="width: 35%">Filière Affectée</th>
            <th class="text-center" style="width: 12%">Semestre</th>
            <th class="text-center" style="width: 13%">Type Évaluation</th>
            <th class="text-center" style="width: 15%">État de Saisie</th>
            <th class="text-end pe-3" style="width: 10%">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="classe in filteredClasses" :key="classe.id || classe.classe_id">
            <td class="ps-3 fw-bold text-dark">
              {{ classe.classe_code || classe.code }}
            </td>
            <td>{{ classe.filiere_nom }}</td>
            <td class="text-center">
              <span class="badge bg-light text-dark border px-3 py-1">S{{ semestre }}</span>
            </td>
            <td class="text-center">
              <small class="fw-semibold text-uppercase text-muted">{{ activeTab }}</small>
            </td>
            <td class="text-center">
              <span
                :class="[
                  'badge rounded-pill px-3 py-2 small',
                  classe.effectif_actuel % 2 === 0
                    ? 'text-success bg-success bg-opacity-10'
                    : 'text-warning bg-warning bg-opacity-10',
                ]"
              >
                <i
                  :class="[
                    'bi me-1',
                    classe.effectif_actuel % 2 === 0
                      ? 'bi-check-circle-fill'
                      : 'bi-exclamation-circle-fill',
                  ]"
                ></i>
                {{ classe.effectif_actuel % 2 === 0 ? 'Validé & Clos' : 'En cours' }}
              </span>
            </td>
            <td class="text-end pe-3">
              <div class="dropdown">
                <button
                  class="btn btn-sm btn-outline-primary dropdown-toggle px-3"
                  type="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <i class="bi bi-three-dots me-1"></i> Gérer
                </button>
                <ul class="dropdown-menu shadow-sm dropdown-menu-end">
                  <li>
                    <a class="dropdown-item" href="#" @click.prevent="consulterNotes(classe)">
                      <i class="bi bi-eye me-2 text-muted"></i>Voir les rattrapages
                    </a>
                  </li>
                  <li>
                    <a class="dropdown-item" href="#" @click.prevent="ouvrirSaisieRapide(classe)">
                      <i class="bi bi-pencil me-2 text-muted"></i>Saisir les rattrapages
                    </a>
                  </li>
                  <li><hr class="dropdown-divider" /></li>
                  <li>
                    <a
                      class="dropdown-item text-success"
                      href="#"
                      @click.prevent="validerNotesSession(classe)"
                    >
                      <i class="bi bi-lock-fill me-2"></i>Clôturer les rattrapages
                    </a>
                  </li>
                </ul>
              </div>
            </td>
          </tr>

          <tr v-if="filteredClasses.length === 0">
            <td colspan="6" class="text-center py-5">
              <i class="bi bi-inbox text-muted display-6 d-block mb-2"></i>
              <p class="text-muted mb-0">
                Aucune session de rattrapage ne correspond à votre recherche.
              </p>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useClasseStore } from '@/modules/structure-academique/classe/store';

// Définition des Props reçues du parent
const props = defineProps({
  searchQuery: {
    type: String,
    default: '',
  },
  semestre: {
    type: Number,
    default: 1,
  },
});

const classeStore = useClasseStore();

// Contexte pour la session de rappel / rattrapage
const activeTab = 'RATTRAPAGE';
const currentTabLabel = 'Sessions de Rattrapage';

// Récupération sécurisée du Store
const classes = computed(() => (Array.isArray(classeStore.classes) ? classeStore.classes : []));

// Filtrage basé sur la Prop du parent
const filteredClasses = computed(() => {
  return classes.value.filter((c) => {
    const q = props.searchQuery.toLowerCase().trim();

    const codeClasse = (c.classe_code || c.code || '').toLowerCase();
    const nomFiliere = (c.filiere_nom || '').toLowerCase();

    return !q || codeClasse.includes(q) || nomFiliere.includes(q);
  });
});

// Chargement initial au besoin
onMounted(() => {
  if (classes.value.length === 0) {
    classeStore.fetchClasses();
  }
});

/* ===================== Fonctions métiers réadaptées ===================== */
const consulterNotes = (classe) => {
  const code = classe.classe_code || classe.code;
  console.log(`Consultation des rattrapages de la classe: ${code} (Semestre: ${props.semestre})`);
};

const abrirSaisieRapide = (classe) => {
  // Correction de la typo originale
  ouvrirSaisieRapide(classe);
};

const ouvrirSaisieRapide = (classe) => {
  const code = classe.classe_code || classe.code;
  console.log(`Grille de saisie des rattrapages pour la classe: ${code}`);
};

const validerNotesSession = (classe) => {
  const code = classe.classe_code || classe.code;
  console.log(`Verrouillage officiel de la session de rattrapage pour la classe: ${code}`);
};
</script>
