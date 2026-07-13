<template>
  <div class="semester-organization-container">
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

    <div class="row mb-4">
      <div class="col-12">
        <div class="card border-0 shadow-sm bg-white rounded-4">
          <div class="card-body p-3">
            <div class="row g-2 align-items-center">
              <div class="col-md-4">
                <div class="input-group">
                  <span class="input-group-text bg-light border-0 text-muted">
                    <i class="mdi mdi-magnify"></i>
                  </span>
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
                <span class="text-xs text-muted font-monospace fw-bold">
                  {{ filteredSemestres.length }} Semestre(s)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status"></div>
      <p class="text-muted text-sm mt-2">Génération de la cartographie pédagogique...</p>
    </div>

    <div v-else-if="groupedSemestres.length > 0" class="row g-4">
      <div v-for="group in groupedSemestres" :key="group.niveau" class="col-12">
        <div class="d-flex align-items-center mb-3">
          <h5 class="fw-bold text-secondary mb-0 text-uppercase tracking-wider fs-6 me-3">
            <i class="mdi mdi-school text-primary me-1"></i> {{ group.niveau }}
          </h5>
          <div class="flex-grow-1 border-bottom border-2 border-light"></div>
        </div>

        <div class="row g-3">
          <div v-for="semestre in group.items" :key="semestre.id" class="col-xl-6">
            <div
              class="card border-0 shadow-sm bg-white rounded-4 h-100 border-top border-3"
              :class="semestre.actif ? 'border-primary' : 'border-secondary'"
            >
              <div class="card-body p-4">
                <div class="d-flex justify-content-between align-items-start mb-3">
                  <div>
                    <span
                      class="badge bg-primary-subtle text-primary font-monospace px-2 py-1.5 fw-bold fs-6 me-2"
                    >
                      {{ semestre.code }}
                    </span>
                    <strong class="text-dark fs-6">{{ semestre.filiere }}</strong>
                    <div class="text-xs text-muted font-monospace mt-1">
                      Période : {{ semestre.periode }}
                    </div>
                  </div>
                  <span
                    class="badge px-2.5 py-1.5 rounded-pill text-xs font-semibold"
                    :class="
                      semestre.actif
                        ? 'bg-success-subtle text-success border border-success-subtle'
                        : 'bg-secondary-subtle text-secondary border border-secondary-subtle'
                    "
                  >
                    {{ semestre.actif ? 'Semestre Activé' : 'Semestre Inactivé' }}
                  </span>
                </div>

                <div
                  class="mb-3 py-2 px-3 bg-light-subtle rounded border d-flex justify-content-between align-items-center text-sm"
                >
                  <span class="text-secondary">
                    <i class="mdi mdi-star-circle-outline me-1"></i> Valeur totale des crédits :
                  </span>
                  <strong
                    :class="semestre.credits >= 30 ? 'text-success' : 'text-dark'"
                    class="font-monospace fs-6"
                  >
                    {{ semestre.credits }} ECTS
                  </strong>
                </div>

                <div>
                  <div class="text-xs text-secondary text-uppercase fw-bold mb-2 tracking-wider">
                    Unités d'Enseignement validées ({{ semestre.ues?.length || 0 }})
                  </div>
                  <div class="d-flex flex-wrap gap-2">
                    <!--
                      `highlight()` échappe la donnée avant d'y insérer le balisage :
                      le seul HTML qui subsiste ici est celui qu'elle produit elle-même.
                      Couvert par shared/utils/text.test.js.
                    -->
                    <!-- eslint-disable vue/no-v-html -->
                    <span
                      v-for="(ue, idx) in semestre.ues"
                      :key="idx"
                      class="badge bg-light text-dark border rounded px-2 py-1 text-xs"
                      v-html="highlightText(ue)"
                    ></span>
                    <!-- eslint-enable vue/no-v-html -->
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="col-12 text-center py-5">
      <i class="mdi mdi-filter-remove-outline fs-1 text-muted d-block mb-2"></i>
      <h5 class="text-secondary fw-bold">Aucune correspondance trouvée</h5>
      <p class="text-muted text-sm">Modifiez vos mots-clés ou réinitialisez vos filtres globaux.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useSemestreStore } from '../../store';
import { useSemestreForm } from '../../composables/useSemestreForm';
import { highlight } from '@/shared/utils/text';

/* ========================================================
    Initialisation du Store Pinia
======================================================== */
const semestreStore = useSemestreStore();

// Filtres locaux
const filterQuery = ref('');
const filterFiliere = ref('');
const filterStatut = ref('tous');

/* ========================================================
    Données Réactives (Computed connectés au Store)
======================================================== */
const loading = computed(() => semestreStore.loading);
const rawSemestres = computed(() => semestreStore.organisation || []);

// Extraction dynamique des filières uniques présentes pour alimenter le select
const uniqueFilieres = computed(() => {
  return [...new Set(rawSemestres.value.map((s) => s.filiere).filter(Boolean))];
});

// Filtrage logique des semestres
const filteredSemestres = computed(() => {
  return rawSemestres.value.filter((s) => {
    const matchesSearch =
      (s.code || '').toLowerCase().includes(filterQuery.value.toLowerCase()) ||
      (s.filiere || '').toLowerCase().includes(filterQuery.value.toLowerCase()) ||
      (s.ues || []).some((ue) => ue.toLowerCase().includes(filterQuery.value.toLowerCase()));

    const matchesFiliere = filterFiliere.value === '' || s.filiere === filterFiliere.value;

    const matchesStatut =
      filterStatut.value === 'tous' ||
      (filterStatut.value === 'actif' && s.actif) ||
      (filterStatut.value === 'inactif' && !s.actif);

    return matchesSearch && matchesFiliere && matchesStatut;
  });
});

// Groupement par niveau d'étude
const SnowyGroup = (items) => {
  const groups = {};
  items.forEach((item) => {
    const key = item.niveau || 'Niveau Non Défini';
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
  });
  return Object.keys(groups).map((key) => ({ niveau: key, items: groups[key] }));
};

const groupedSemestres = computed(() => {
  return SnowyGroup(filteredSemestres.value);
});

// Mise en surbrillance (Highlight) des textes cherchés
/**
 * Surbrillance du terme recherché.
 *
 * L'implémentation précédente construisait la RegExp directement à partir de la
 * saisie (une recherche contenant « ( » faisait planter le filtre) et
 * réinjectait la donnée backend telle quelle dans un `v-html` — une porte
 * ouverte au XSS. `highlight` échappe le texte avant d'y insérer le balisage.
 */
const highlightText = (text) => highlight(text, filterQuery.value);

/* ========================================================
    Actions Utilitaires
======================================================== */
// Ce bouton ne faisait qu'un `console.log` : il ouvre désormais réellement la
// modale de création, partagée avec l'en-tête de l'écran.
const { openCreate: ouvrirModalCreation } = useSemestreForm();

/* ========================================================
    Cycle de vie (Appel de la bonne action du Store)
======================================================== */
onMounted(async () => {
  // Déclenche l'appel API natif défini dans ton store
  await semestreStore.fetchOrganisation();
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
