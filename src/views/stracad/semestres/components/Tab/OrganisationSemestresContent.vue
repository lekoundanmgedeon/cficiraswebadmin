<template>
  <div class="semester-organization-container">
    <!-- Section En-tête : Titre et Actions de Configuration -->
    <div class="row mb-4">
      <div class="col-12 d-flex justify-content-between align-items-center flex-wrap gap-3">
        <div>
          <h3 class="fw-bold text-dark mb-1">Architecture des Maquettes & Semestres</h3>
          <p class="text-muted text-sm mb-0">
            Gestion des volumes de crédits, répartition des Unités d'Enseignement (UE) et statuts
            d'activation.
          </p>
        </div>

        <div class="d-flex gap-2">
          <button class="btn btn-primary text-sm px-3 py-2" @click="ouvrirModalCreation">
            <i class="mdi mdi-plus me-1"></i> Configurer un Semestre
          </button>
        </div>
      </div>
    </div>

    <!-- Barre de Filtres Avancés -->
    <div class="row mb-4">
      <div class="col-12">
        <div class="card border-0 shadow-sm bg-white rounded-4">
          <div class="card-body p-3">
            <div class="row g-2 align-items-center">
              <div class="col-md-4">
                <div class="input-group">
                  <span class="input-group-text bg-light border-0 text-muted"
                    ><i class="mdi mdi-magnify"></i
                  ></span>
                  <input
                    v-model="filterQuery"
                    type="text"
                    class="form-control text-sm bg-light border-0 py-2.5 shadow-none"
                    placeholder="Rechercher une UE, un code..."
                  />
                </div>
              </div>
              <div class="col-md-3">
                <select
                  v-model="filterFiliere"
                  class="form-select text-sm bg-light border-0 py-2.5 shadow-none"
                >
                  <option value="">Toutes les filières</option>
                  <option v-for="f in uniqueFilieres" :key="f" :value="f">{{ f }}</option>
                </select>
              </div>
              <div class="col-md-3">
                <select
                  v-model="filterStatut"
                  class="form-select text-sm bg-light border-0 py-2.5 shadow-none"
                >
                  <option value="tous">Tous les statuts</option>
                  <option value="actif">Actifs uniquement</option>
                  <option value="inactif">Inactifs uniquement</option>
                </select>
              </div>
              <div class="col-md-2 text-md-end">
                <span class="text-xs text-muted font-monospace"
                  >{{ filteredSemestres.length }} Semestre(s)</span
                >
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Loader de chargement -->
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status"></div>
      <p class="text-muted text-sm mt-2">Génération de la cartographie pédagogique...</p>
    </div>

    <!-- VUE PROFONDE : Regroupement par Niveau d'étude -->
    <div v-else-if="groupedSemestres.length > 0" class="row g-4">
      <div v-for="group in groupedSemestres" :key="group.niveau" class="col-12">
        <!-- Séparateur / Titre du Niveau -->
        <div class="d-flex align-items-center mb-3">
          <h5 class="fw-bold text-secondary mb-0 text-uppercase tracking-wider fs-6 me-3">
            <i class="mdi mdi-school text-primary me-1"></i> {{ group.niveau }}
          </h5>
          <div class="flex-grow-1 border-bottom border-2 border-light"></div>
        </div>

        <!-- Grille de Cartes de Semestres -->
        <div class="row g-3">
          <div v-for="semestre in group.items" :key="semestre.id" class="col-xl-6">
            <div
              class="card border-0 shadow-sm bg-white rounded-4 h-100 border-top border-3"
              :class="semestre.actif ? 'border-primary' : 'border-secondary'"
            >
              <div class="card-body p-4">
                <!-- Ligne Supérieure : Code, Filière et Statut -->
                <div class="d-flex justify-content-between align-items-start mb-3">
                  <div>
                    <span
                      class="badge bg-soft-primary text-primary font-monospace px-2 py-1.5 fw-bold fs-6 me-2"
                      >{{ semestre.code }}</span
                    >
                    <strong class="text-dark fs-6">{{ semestre.filiere }}</strong>
                    <div class="text-xs text-muted font-monospace mt-1">
                      Période : {{ semestre.periode }}
                    </div>
                  </div>
                  <span
                    class="badge px-2.5 py-1.5 rounded-pill text-xs font-semibold"
                    :class="
                      semestre.actif
                        ? 'bg-soft-success text-success'
                        : 'bg-soft-secondary text-secondary'
                    "
                  >
                    {{ semestre.actif ? 'Actif' : 'Inactif' }}
                  </span>
                </div>

                <!-- Volume des Crédits ECTS (Affichage textuel direct) -->
                <div
                  class="mb-3 py-2 px-3 bg-light-subtle rounded border d-flex justify-content-between align-items-center text-sm"
                >
                  <span class="text-secondary"
                    ><i class="mdi mdi-star-circle-outline me-1"></i> Valeur totale des crédits
                    :</span
                  >
                  <strong
                    :class="semestre.credits >= 30 ? 'text-success' : 'text-dark'"
                    class="font-monospace fs-6"
                  >
                    {{ semestre.credits }} ECTS
                  </strong>
                </div>

                <!-- Liste des UE associées sous forme de puces -->
                <div>
                  <div class="text-xs text-secondary text-uppercase fw-bold mb-2 tracking-wider">
                    Unités d'Enseignement validées
                  </div>
                  <div class="d-flex flex-wrap gap-1.5">
                    <span
                      v-for="(ue, idx) in semestre.ues"
                      :key="idx"
                      class="badge-ue-advanced"
                      v-html="highlightText(ue)"
                    ></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Aucun résultat -->
    <div v-else class="col-12 text-center py-5">
      <i class="mdi mdi-filter-remove-outline fs-1 text-muted d-block mb-2"></i>
      <h5 class="text-secondary fw-bold">Aucune correspondance trouvée</h5>
      <p class="text-muted text-sm">Modifiez vos mots-clés ou réinitialisez vos filtres globaux.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

const loading = ref(false);
const semestres = ref([]);
const filterQuery = ref('');
const filterFiliere = ref('');
const filterStatut = ref('tous');

const uniqueFilieres = computed(() => {
  return [...new Set(semestres.value.map((s) => s.filiere))];
});

const filteredSemestres = computed(() => {
  return semestres.value.filter((s) => {
    const matchesSearch =
      s.code.toLowerCase().includes(filterQuery.value.toLowerCase()) ||
      s.ues.some((ue) => ue.toLowerCase().includes(filterQuery.value.toLowerCase())) ||
      s.filiere.toLowerCase().includes(filterQuery.value.toLowerCase());
    const matchesFiliere = filterFiliere.value === '' || s.filiere === filterFiliere.value;
    const matchesStatut =
      filterStatut.value === 'tous' ||
      (filterStatut.value === 'actif' && s.actif) ||
      (filterStatut.value === 'inactif' && !s.actif);

    return matchesSearch && matchesFiliere && matchesStatut;
  });
});

const SnowyGroup = (items) => {
  const groups = {};
  items.forEach((item) => {
    if (!groups[item.niveau]) {
      groups[item.niveau] = [];
    }
    groups[item.niveau].push(item);
  });
  return Object.keys(groups).map((key) => ({ niveau: key, items: groups[key] }));
};

const groupedSemestres = computed(() => {
  return SnowyGroup(filteredSemestres.value);
});

const highlightText = (text) => {
  if (!filterQuery.value) return text;
  const regex = new RegExp(`(${filterQuery.value})`, 'gi');
  return text.replace(regex, '<mark class="bg-warning-subtle text-dark p-0">$1</mark>');
};

const fetchOrganisationSemestres = async () => {
  loading.value = true;
  await new Promise((resolve) => setTimeout(resolve, 300));

  semestres.value = [
    {
      id: 1,
      code: 'SEM-1',
      designation: 'Semestre 1',
      niveau: 'Licence 1 (Tronc Commun)',
      filiere: 'Informatique',
      credits: 30,
      ues: ['Mathématiques Algébriques', 'Informatique Générale', 'Anglais Technique'],
      periode: '2025-2026',
      actif: true,
    },
    {
      id: 2,
      code: 'SEM-2',
      designation: 'Semestre 2',
      niveau: 'Licence 1 (Tronc Commun)',
      filiere: 'Informatique',
      credits: 26,
      ues: ['Algorithmique Procédurale', 'Bases de Données Relationnelles', 'Physique Quantique'],
      periode: '2025-2026',
      actif: true,
    },
    {
      id: 3,
      code: 'SEM-1',
      designation: 'Semestre 1',
      niveau: 'Master 1 Spécialisé',
      filiere: 'Data Science',
      credits: 30,
      ues: [
        'Statistiques Inférentielles',
        'Machine Learning Foundations',
        'Python Avancé & Big Data',
      ],
      periode: '2025-2026',
      actif: false,
    },
    {
      id: 4,
      code: 'SEM-1',
      designation: 'Semestre 1',
      niveau: 'Master 1 Spécialisé',
      filiere: 'Génie Logiciel',
      credits: 30,
      ues: ['Modélisation UML/SGBD', 'DevOps & CI/CD', 'Architectures Microservices'],
      periode: '2025-2026',
      actif: true,
    },
  ];
  loading.value = false;
};

onMounted(() => {
  fetchOrganisationSemestres();
});
</script>

<style scoped>
.bg-soft-primary {
  background-color: rgba(0, 123, 255, 0.08);
}
.bg-soft-success {
  background-color: rgba(40, 167, 69, 0.08);
}
.bg-soft-secondary {
  background-color: rgba(108, 117, 125, 0.08);
}

.bg-light-subtle {
  background-color: #f8f9fa;
}

.text-sm {
  font-size: 13px !important;
}
.text-xs {
  font-size: 11.5px !important;
}
.tracking-wider {
  letter-spacing: 0.8px;
}

.badge-ue-advanced {
  background-color: #fdfdfd;
  color: #212529;
  border: 1px solid #e2e8f0;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12.5px;
  font-weight: 500;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
  display: inline-block;
}

/* Alignement structurel (Coins fins standardisés) */
.rounded-4 {
  border-radius: 0.2rem !important;
}
.form-select,
.form-control {
  border-radius: 0.15rem;
}
</style>
