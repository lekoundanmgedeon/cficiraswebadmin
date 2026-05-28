<template>
  <div class="row">
    
  </div>
  <div class="row">
    <div class="row align-items-center">
      <div class="col-md-8">
        <nav aria-label="breadcrumb">
          <ol class="breadcrumb mb-2">
            <li class="breadcrumb-item"><a href="#" class="text-decoration-none">Sessions</a></li>
            <li class="breadcrumb-item active" aria-current="page">Planification</li>
          </ol>
        </nav>
        <h3 class="fw-bold text-dark mb-1">
          {{ currentSession?.designation || 'Chargement de la session...' }}
        </h3>
        <p class="text-muted small mb-0" v-if="currentSession">
          <span class="badge bg-light text-dark border me-2">Code: {{ currentSession.code }}</span>
          <i class="bi bi-clock me-1"></i> Période : 
          <strong class="text-secondary">{{ formatDate(currentSession.date_debut) }}</strong> au 
          <strong class="text-secondary">{{ formatDate(currentSession.date_fin) }}</strong>
        </p>
      </div>
      <div class="col-md-4 text-md-end mt-3 mt-md-0">
        <button class="btn btn-outline-secondary btn-sm me-2" @click="goBack">
          <i class="bi bi-arrow-left me-1"></i> Retour
        </button>
        <button class="btn btn-primary btn-sm px-3" :disabled="globalSaving" @click="saveAllPlanifications">
          <span v-if="globalSaving" class="spinner-border spinner-border-sm me-1"></span>
          <i v-else class="bi bi-cloud-arrow-up me-1"></i> Enregistrer tout
        </button>
      </div>
    </div>
  <div class="row">
      <div class="container my-2">
        <div class="col-md-12 grid margin stretch-card">
          <div class="card">
            <div class="card-body dashboard-tabs p-0">
                  <div class="row">
      
      <div class="col-lg-4 col-md-5">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-header bg-white border-0 py-3">
            <h6 class="fw-bold text-dark mb-0">
              <i class="bi bi-collection me-2 text-secondary"></i>Modules à configurer
            </h6>
          </div>
          <div class="list-group list-group-flush overflow-auto custom-scrollbar" style="max-height: 600px;">
            <button
              v-for="module in modules"
              :key="module.id"
              type="button"
              class="list-group-item list-group-item-action p-3 border-bottom position-relative d-flex justify-content-between align-items-start"
              :class="{ 'active bg-primary-subtle border-start border-primary border-4 text-dark': selectedModule?.id === module.id }"
              @click="selectModule(module)"
            >
              <div class="me-auto pe-2">
                <div class="fw-bold small mb-1" :class="{ 'text-primary': selectedModule?.id === module.id }">
                  {{ module.code }} - {{ module.nom }}
                </div>
                <span class="text-muted text-xs d-block">Crédits: {{ module.credits }} | Coeff: {{ module.coefficient }}</span>
              </div>
              
              <span 
                class="badge rounded-pill text-xs px-2 py-1 mt-1"
                :class="getModuleStatusClass(module.id)"
              >
                {{ getModuleStatusLabel(module.id) }}
              </span>
            </button>
          </div>
        </div>
      </div>

      <div class="col-lg-8 col-md-7">
        <div class="card border-0 shadow-sm h-100" v-if="selectedModule">
          <div class="card-header bg-light border-0 py-3 d-flex justify-content-between align-items-center">
            <div>
              <span class="text-xs text-uppercase fw-bold text-primary">Configuration active</span>
              <h5 class="fw-bold text-dark mb-0">{{ selectedModule.nom }}</h5>
            </div>
            <span class="badge bg-white text-dark border font-monospace text-xs px-2 py-1">
              {{ selectedModule.code }}
            </span>
          </div>

          <div class="card-body p-4">
            <div class="alert alert-warning-subtle border border-warning-subtle text-dark p-2 rounded mb-4 text-xs d-flex align-items-center">
              <i class="bi bi-exclamation-circle-fill text-warning me-2 fs-5"></i>
              <div>
                Toutes les dates d'évaluation doivent être programmées entre le 
                <strong>{{ formatDate(currentSession?.date_debut) }}</strong> et le 
                <strong>{{ formatDate(currentSession?.date_fin) }}</strong>.
              </div>
            </div>

            <div v-for="type in typesEvaluation" :key="type.key" class="eval-card border p-3 rounded mb-3 bg-light-subtle">
              <div class="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
                <div class="form-check form-switch mb-0">
                  <input 
                    class="form-check-input cursor-pointer" 
                    type="checkbox" 
                    :id="'switch-' + type.key"
                    v-model="activeEvaluations[selectedModule.id][type.key].enabled"
                  >
                  <label class="form-check-label fw-bold small text-dark cursor-pointer" :for="'switch-' + type.key">
                    {{ type.label }}
                  </label>
                </div>
                <span class="badge bg-light text-secondary text-xs">{{ type.key }}</span>
              </div>

              <div class="row g-3" v-if="activeEvaluations[selectedModule.id][type.key].enabled">
                <div class="col-md-4">
                  <label class="form-label text-xs fw-semibold">Date de l'épreuve *</label>
                  <input 
                    type="date" 
                    class="form-control form-control-sm"
                    v-model="activeEvaluations[selectedModule.id][type.key].date"
                    :min="currentSession?.date_debut"
                    :max="currentSession?.date_fin"
                    :class="{ 'is-invalid': activeEvaluations[selectedModule.id][type.key].dateError }"
                    @change="validateEvalDates(type.key)"
                    required
                  >
                  <div class="invalid-feedback text-xs">Hors période session.</div>
                </div>
                <div class="col-md-4">
                  <label class="form-label text-xs fw-semibold">Heure de début *</label>
                  <input 
                    type="time" 
                    class="form-control form-control-sm"
                    v-model="activeEvaluations[selectedModule.id][type.key].heure_debut"
                    required
                  >
                </div>
                <div class="col-md-4">
                  <label class="form-label text-xs fw-semibold">Durée (Minutes) *</label>
                  <input 
                    type="number" 
                    class="form-control form-control-sm"
                    placeholder="Ex: 90, 120"
                    v-model.number="activeEvaluations[selectedModule.id][type.key].duree"
                    min="1"
                    required
                  >
                </div>
                <div class="col-md-6">
                  <label class="form-label text-xs fw-semibold">Pondération / Pourcentage (%) *</label>
                  <input 
                    type="number" 
                    class="form-control form-control-sm"
                    placeholder="Ex: 40"
                    v-model.number="activeEvaluations[selectedModule.id][type.key].ponderation"
                    min="0"
                    max="100"
                    required
                  >
                </div>
                <div class="col-md-6">
                  <label class="form-label text-xs fw-semibold">Lieu / Salle d'examen</label>
                  <input 
                    type="text" 
                    class="form-control form-control-sm"
                    placeholder="Ex: Amphi A, Salle 102"
                    v-model="activeEvaluations[selectedModule.id][type.key].salle"
                  >
                </div>
              </div>
              <div class="text-muted text-xs px-2" v-else>
                <i class="bi bi-dash-circle me-1"></i> Ce type d'évaluation n'est pas programmé pour ce module.
              </div>
            </div>
          </div>

          <div class="card-footer bg-white text-end py-3">
            <button 
              class="btn btn-primary btn-sm px-4" 
              :disabled="hasLocalErrors" 
              @click="saveModuleConfig"
            >
              <i class="bi bi-check-circle me-1"></i> Valider ce module
            </button>
          </div>
        </div>

        <div class="card border-0 shadow-sm h-100 bg-white text-center p-5 d-flex flex-column justify-content-center align-items-center" v-else>
          <div class="rounded-circle bg-light p-4 mb-3">
            <i class="bi bi-arrow-left-right text-primary fs-2"></i>
          </div>
          <h5 class="fw-bold text-dark">Aucun module sélectionné</h5>
          <p class="text-muted small max-w-sm">
            Veuillez cliquer sur un module dans la liste de gauche pour configurer ses contrôles continus, examens normaux et rattrapages.
          </p>
        </div>
      </div>

    </div>
            </div>
          </div>
        </div>
      </div>
  </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useNotifier } from '@/stores/messages/useNotifier';

// Routeurs & Paramètres d'URL
const route = useRoute();
const router = useRouter();
const sessionId = route.params.id;
const { notifyError, notifySuccess } = useNotifier();

// États de données fictifs/Simulés (À lier avec vos stores respectifs)
const currentSession = ref(null);
const modules = ref([]);
const globalSaving = ref(false);
const selectedModule = ref(null);

// Configuration des types d'évaluations structurelles demandées
const typesEvaluation = [
  { key: 'CC', label: 'Contrôle Continu (CC)' },
  { key: 'NORMAL', label: 'Examen de Session Normale' },
  { key: 'RATTRAPAGE', label: 'Examen de Rattrapage' }
];

// Arbre d'état réactif indexé par [moduleId][typeEvaluationKey]
const activeEvaluations = reactive({});

onMounted(async () => {
  await fetchSessionDetails();
  await fetchModulesForSession();
  initializeEvaluationsMap();
});

/* =========================================================================
   📦 CHARGEMENT DES DONNÉES DE CONFIGURATION
   ========================================================================= */

const fetchSessionDetails = async () => {
  // Simulation d'appel API de votre SessionStore
  currentSession.value = {
    id: sessionId,
    code: 'S1_NORM_2026',
    designation: 'Session Normale & Rattrapage Semestre 1 2025-2026',
    date_debut: '2026-06-01',
    date_fin: '2026-06-25',
  };
};

const fetchModulesForSession = async () => {
  // Simulation d'appel API de récupération de votre offre de formation / modules
  modules.value = [
    { id: 'm1', code: 'INF110', nom: 'Algorithmique et Structures de Données', credits: 4, coefficient: 2 },
    { id: 'm2', code: 'MTH111', nom: 'Analyse Mathématique I', credits: 3, coefficient: 1.5 },
    { id: 'm3', code: 'INF112', nom: 'Systèmes d’Exploitation & Linux', credits: 4, coefficient: 2 },
    { id: 'm4', code: 'ENG101', nom: 'Anglais Technique', credits: 2, coefficient: 1 },
  ];
};

// Initialisation de la matrice de données réactives
const initializeEvaluationsMap = () => {
  modules.value.forEach(mod => {
    activeEvaluations[mod.id] = {};
    typesEvaluation.forEach(type => {
      activeEvaluations[mod.id][type.key] = {
        enabled: false,
        date: '',
        heure_debut: '',
        duree: 90,
        ponderation: type.key === 'CC' ? 40 : type.key === 'NORMAL' ? 60 : 100,
        salle: '',
        dateError: false,
        isConfigured: false // Marqueur de validation locale
      };
    });
  });
  
  // Sélectionner le premier module par défaut si disponible
  if (modules.value.length > 0) {
    selectedModule.value = modules.value[0];
  }
};

const selectModule = (module) => {
  selectedModule.value = module;
};

/* =========================================================================
   ⏳ CONTROLES ET VALIDATIONS DES DATES D'EVALUATIONS
   ========================================================================= */
const validateEvalDates = (typeKey) => {
  const evalObj = activeEvaluations[selectedModule.value.id][typeKey];
  if (evalObj.date && currentSession.value) {
    const dEval = new Date(evalObj.date);
    const dDebut = new Date(currentSession.value.date_debut);
    const dFin = new Date(currentSession.value.date_fin);
    
    // Alerte si la date n'est pas incluse dans la session globale
    evalObj.dateError = dEval < dDebut || dEval > dFin;
  }
};

// Propriété calculée pour désactiver le bouton si le module actif contient des erreurs de date
const hasLocalErrors = computed(() => {
  if (!selectedModule.value) return false;
  const evals = activeEvaluations[selectedModule.value.id];
  return Object.values(evals).some(e => e.enabled && e.dateError);
});

/* =========================================================================
   📈 SUIVI DU STATUT ET DE LA PROGRESSION UI
   ========================================================================= */
const getModuleStatusClass = (moduleId) => {
  const evals = activeEvaluations[moduleId];
  if (!evals) return 'bg-light text-muted';
  
  const totalEnabled = Object.values(evals).filter(e => e.enabled).length;
  const totalValidated = Object.values(evals).filter(e => e.enabled && e.isConfigured).length;

  if (totalEnabled > 0 && totalValidated === totalEnabled) return 'bg-success-subtle text-success';
  if (totalEnabled > 0) return 'bg-warning-subtle text-warning';
  return 'bg-light text-muted';
};

const getModuleStatusLabel = (moduleId) => {
  const evals = activeEvaluations[moduleId];
  if (!evals) return 'En attente';
  
  const totalEnabled = Object.values(evals).filter(e => e.enabled).length;
  const totalValidated = Object.values(evals).filter(e => e.enabled && e.isConfigured).length;

  if (totalEnabled > 0 && totalValidated === totalEnabled) return 'Planifié';
  if (totalEnabled > 0) return 'Modifié';
  return 'Vide';
};

// Calcul global de la complétion pour la barre de progression
const completionRate = computed(() => {
  if (modules.value.length === 0) return 0;
  let plannedCount = 0;
  modules.value.forEach(m => {
    if (getModuleStatusLabel(m.id) === 'Planifié') plannedCount++;
  });
  return Math.round((plannedCount / modules.value.length) * 100);
});

/* =========================================================================
   🚀 SAUVEGARDES / ACTIONS SUBMIT
   ========================================================================= */
const saveModuleConfig = () => {
  const evals = activeEvaluations[selectedModule.value.id];
  
  // Validation de sécurité : Vérifier si au moins une évaluation est cochée et configurée
  const anyEnabled = Object.values(evals).some(e => e.enabled);
  if (!anyEnabled) {
    return notifyError("Veuillez activer au moins un type d'évaluation (CC, Normal, Rattrapage) pour ce module.");
  }

  // Marquer toutes les évaluations actives cochées comme validées localement
  Object.keys(evals).forEach(key => {
    if (evals[key].enabled) {
      evals[key].isConfigured = true;
    }
  });

  notifySuccess(`Planification locale validée pour le module ${selectedModule.value.code}.`);
};

const saveAllPlanifications = async () => {
  globalSaving.value = true;
  try {
    // Transformer l'objet réactif en charge utile propre pour votre API SQL/NoSQL
    const payload = {
      session_id: sessionId,
      planifications: activeEvaluations
    };
    
    console.log("Envoi payload de planification complète :", payload);
    // await evaluationStore.bulkCreatePlanifications(payload);

    notifySuccess("Toutes les planifications d'examens ont été enregistrées sur le serveur.");
  } catch (err) {
    notifyError("Erreur d'enregistrement global.");
  } finally {
    globalSaving.value = false;
  }
};

const goBack = () => router.back();
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
};
</script>

<style scoped>
.text-xs {
  font-size: 11px !important;
}
.cursor-pointer {
  cursor: pointer;
}
.bg-primary-subtle {
  background-color: rgba(13, 110, 253, 0.12) !important;
}
.alert-warning-subtle {
  background-color: #fff3cd;
  color: #664d03;
}
.eval-card {
  transition: all 0.2s ease-in-out;
}
.eval-card:hover {
  border-color: #0d6efd !important;
}
.animate-fade-in {
  animation: fadeIn 0.35s ease-out;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Custom Scrollbar pour la liste des modules */
.custom-scrollbar::-webkit-scrollbar {
  width: 5px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: #f1f1f1;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}
</style>