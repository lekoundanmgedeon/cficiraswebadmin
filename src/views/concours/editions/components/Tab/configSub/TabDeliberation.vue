<template>
  <div class="animate__animated animate__fadeIn">
    <!-- En-tête de l'onglet -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h5 class="fw-bold mb-1 text-dark">Délibération & Publication du PV</h5>
        <p class="text-muted small mb-0">
          Analysez les performances globales, fixez la note d'admission et générez les résultats
          officiels.
        </p>
      </div>

      <!-- Statut de publication général -->
      <span
        class="badge rounded-pill px-3 py-1.5 text-xs text-uppercase border fw-bold font-monospace shadow-sm"
        :class="
          isPublished
            ? 'bg-success-subtle text-success border-success'
            : 'bg-warning-subtle text-warning border-warning'
        "
      >
        <i class="bi" :class="isPublished ? 'bi-check-all' : 'bi-lock'"></i>
        {{ isPublished ? 'Résultats Publiés' : 'Brouillon / Non Publié' }}
      </span>
    </div>

    <!-- ÉTAPE 1 : Tableau de Bord & Statistiques de Délibération -->
    <div class="row g-3 mb-4">
      <div class="col-12 col-md-4">
        <div class="card border shadow-sm rounded-3 p-3 bg-white h-100">
          <div class="text-muted text-xs text-uppercase fw-semibold mb-1">Moyenne Générale</div>
          <div class="d-flex align-items-baseline gap-2">
            <h2 class="fw-extrabold text-dark mb-0 font-monospace">
              {{ stats.moyenneGenerale || '11.45' }}
            </h2>
            <span class="text-muted text-xs">/ 20</span>
          </div>
          <small class="text-muted text-xs mt-2 d-block">
            <i class="bi bi-graph-up text-primary me-1"></i> Plus haute : <strong>17.80</strong>
          </small>
        </div>
      </div>

      <div class="col-12 col-md-4">
        <div class="card border shadow-sm rounded-3 p-3 bg-white h-100">
          <div class="text-muted text-xs text-uppercase fw-semibold mb-1">
            Taux d'Admissibilité Actuel
          </div>
          <div class="d-flex align-items-baseline gap-2">
            <h2 class="fw-extrabold text-success mb-0 font-monospace">
              {{ stats.tauxReussite || '64.2' }}%
            </h2>
          </div>
          <small class="text-muted text-xs mt-2 d-block">
            Soit <strong>{{ stats.admisCount || 45 }}</strong> candidats sur
            {{ stats.totalCandidats || 70 }}
          </small>
        </div>
      </div>

      <!-- Configuration de la note de coupure -->
      <div class="col-12 col-md-4">
        <div
          class="card border border-primary-subtle shadow-sm rounded-3 p-3 bg-primary-subtle bg-opacity-10 h-100"
        >
          <div class="text-primary text-xs text-uppercase fw-bold mb-1">Seuil d'Admission</div>
          <div class="d-flex align-items-center gap-2 my-1">
            <label class="text-xs text-muted mb-0">Moyenne mini :</label>
            <input
              type="number"
              v-model="seuilAdmission"
              @change="recalculerSimulations"
              class="form-control form-control-sm text-center font-monospace fw-bold"
              style="max-width: 80px"
              min="0"
              max="20"
              step="0.1"
              :disabled="isPublished"
            />
          </div>
          <small class="text-muted text-xs d-block"
            >Modifiez ce seuil pour ajuster automatiquement le classement.</small
          >
        </div>
      </div>
    </div>

    <!-- ÉTAPE 2 : Aperçu du classement dynamique (PV) -->
    <div class="card border shadow-sm rounded-3 mb-4">
      <div class="card-header bg-light d-flex justify-content-between align-items-center py-3">
        <h6 class="fw-bold mb-0 text-dark d-flex align-items-center gap-2">
          <i class="bi bi-list-ol text-secondary"></i>
          <span>Aperçu du Classement des Candidats</span>
        </h6>

        <div class="d-flex gap-2">
          <button class="btn btn-xs btn-white border text-secondary" @click="downloadDraftPV">
            <i class="bi bi-file-pdf me-1"></i> Imprimer le PV Provisoire
          </button>
        </div>
      </div>

      <div class="table-responsive bg-white rounded-bottom-3">
        <table class="table table-hover align-middle mb-0 text-sm">
          <thead class="table-light text-uppercase font-monospace text-xs">
            <tr>
              <th class="ps-3" style="width: 10%">Rang</th>
              <th style="width: 15%">N° Table</th>
              <th style="width: 35%">Nom & Prénoms</th>
              <th class="text-center" style="width: 20%">Moyenne Générale</th>
              <th class="text-end pe-3" style="width: 20%">Décision du Jury</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(cand, index) in simulationList"
              :key="cand.id"
              :class="{
                'table-success-subtle': cand.moyenne >= seuilAdmission,
                'table-danger-subtle': cand.moyenne < seuilAdmission,
              }"
            >
              <!-- Rang -->
              <td class="ps-3 font-monospace fw-bold">
                <span v-if="cand.moyenne >= seuilAdmission" class="text-dark"
                  >#{{ index + 1 }}</span
                >
                <span v-else class="text-muted">—</span>
              </td>

              <!-- N° Table -->
              <td class="font-monospace text-xs text-secondary">{{ cand.num_table }}</td>

              <!-- Nom complet -->
              <td class="fw-semibold text-dark">{{ cand.nom }} {{ cand.prenom }}</td>

              <!-- Moyenne générale calculée -->
              <td class="text-center font-monospace fw-bold fs-6">
                {{ cand.moyenne.toFixed(2) }}
              </td>

              <!-- Décision dynamique -->
              <td class="text-end pe-3">
                <span
                  v-if="cand.moyenne >= seuilAdmission"
                  class="badge bg-success text-white text-xs px-2.5 py-1 fw-bold rounded-pill"
                >
                  Admis
                </span>
                <span
                  v-else
                  class="badge bg-danger text-white text-xs px-2.5 py-1 fw-bold rounded-pill"
                >
                  Ajourné
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ÉTAPE 3 : Zone critique de clôture et publication officielle -->
    <div class="card border border-warning shadow-sm rounded-4 bg-warning-subtle bg-opacity-10 p-4">
      <div class="row align-items-center g-3">
        <div class="col-12 col-md-8">
          <h6 class="fw-bold text-dark mb-1">
            <i class="bi bi-shield-exclamation text-warning me-1"></i> Clôture officielle de la
            délibération
          </h6>
          <p class="text-muted small mb-0">
            La publication fige définitivement les notes, génère les numéros de PV officiels, et
            rend les résultats visibles sur les portails d'affichage ou espaces candidats. Cette
            action est irréversible.
          </p>
        </div>
        <div class="col-12 col-md-4 text-md-end">
          <button
            v-if="!isPublished"
            class="btn btn-warning fw-bold text-dark d-inline-flex align-items-center gap-2 px-3 shadow-sm"
            @click="publierResultatsOfficiels"
          >
            <i class="bi bi-cloud-upload-fill"></i>
            <span>Publier les Résultats</span>
          </button>
          <button
            v-else
            class="btn btn-outline-danger fw-bold d-inline-flex align-items-center gap-2 px-3 bg-white"
            @click="annulerPublication"
          >
            <i class="bi bi-arrow-counterclockwise"></i>
            <span>Dé-publier (Restaurer)</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useNotifier } from '@/stores/messages/useNotifier';

const props = defineProps({
  concours: { type: Object, default: () => ({}) },
});

const route = useRoute();
const concoursId = Number(route.params.id);
const { notifySuccess, notifyError } = useNotifier();

const seuilAdmission = ref(10.0);
const isPublished = ref(false);
const stats = ref({});
const simulationList = ref([]);

onMounted(() => {
  // Synchronise le statut de publication initial depuis le store ou l'objet concours parent
  isPublished.value = props.concours?.statut?.toUpperCase() === 'PROCLAMÉ';
  loadDeliberationData();
});

const loadDeliberationData = async () => {
  try {
    // Remplacer par tes appels réels de calculs SQL / agrégats backend
    stats.value = {
      moyenneGenerale: '12.18',
      tauxReussite: '66.6',
      admisCount: 2,
      totalCandidats: 3,
    };

    simulationList.value = [
      { id: 101, num_table: 'NUM-5092', nom: 'TRAORE', prenom: 'Moussa', moyenne: 15.25 },
      { id: 102, num_table: 'NUM-1104', nom: 'SOW', prenom: 'Fatoumata', moyenne: 11.8 },
      { id: 103, num_table: 'NUM-8841', nom: 'COULIBALY', prenom: 'Amadou', moyenne: 8.45 },
    ];
  } catch (err) {
    notifyError('Impossible de charger les données de délibération.');
  }
};

const recalculerSimulations = () => {
  // Logique locale de recalcul rapide des KPIs de la vue selon le seuil saisi
  const admis = simulationList.value.filter((c) => c.moyenne >= seuilAdmission.value).length;
  stats.value.admisCount = admis;
  stats.value.tauxReussite = ((admis / simulationList.value.length) * 100).toFixed(1);
  notifySuccess('Simulation du classement mise à jour.');
};

const publierResultatsOfficiels = async () => {
  if (
    confirm(
      'Attention : En publiant ces résultats, vous scellez définitivement le Procès-Verbal de délibération. Confirmer ?'
    )
  ) {
    try {
      // Action store pour modifier le statut du concours à "PROCLAMÉ" en base de données
      // await concoursStore.proclamerResultats(concoursId, { seuil: seuilAdmission.value })

      isPublished.value = true;
      notifySuccess('Le PV a été clôturé et les résultats sont désormais officiels et publiés !');
    } catch (err) {
      notifyError('Erreur lors du processus de publication.');
    }
  }
};

const annulerPublication = () => {
  if (
    confirm("Restaurer l'état de brouillon ? (Les résultats ne seront plus visibles publiquement)")
  ) {
    isPublished.value = false;
    notifySuccess("Le concours est repassé en phase d'édition.");
  }
};

const downloadDraftPV = () => console.log("Génération du PDF du PV d'examen...");
</script>

<style scoped>
.text-xs {
  font-size: 0.75rem;
}
.text-sm {
  font-size: 0.875rem;
}
.fw-extrabold {
  font-weight: 800;
}

.table-success-subtle {
  background-color: rgba(25, 135, 84, 0.04);
}
.table-danger-subtle {
  background-color: rgba(220, 53, 69, 0.03);
}

.btn-white {
  background-color: #fff;
}
.btn-white:hover {
  background-color: #f8f9fa;
}

.btn-xs {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  border-radius: 0.375rem;
}
</style>
