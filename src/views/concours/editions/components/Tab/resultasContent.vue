<template>
  <div class="container-fluid p-0">
    <div class="row">
      <div class="col-12 mb-3">
        <h4 class="fw-bold mb-1">Résultats et Proclamations des Concours</h4>
        <p class="text-muted">
          Gérez les délibérations : calculez les moyennes, proclamez officiellement les résultats et
          téléchargez les listes des admis.
        </p>
      </div>

      <div class="col-md-12 grid margin stretch-card">
        <SkeletonLoader v-if="loading" type="table" :rows="3" :columns="4" />

        <table v-else class="table table-hover align-middle">
          <thead class="table-light">
            <tr>
              <th style="width: 5%">#</th>
              <th>Désignation</th>
              <th>Session</th>
              <th>Date de Clôture</th>
              <th class="text-center">Statut Actuel</th>
              <th class="text-end" style="width: 25%">Actions de Délibération</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="(resultat, index) in concoursList" :key="resultat.id">
              <td class="font-monospace">{{ index + 1 }}</td>

              <td>
                <div class="fw-semibold text-dark">{{ resultat.designation }}</div>
                <small class="text-muted">{{ resultat.libelle_type }}</small>
              </td>

              <td>
                <span class="badge bg-light text-secondary border font-monospace">
                  {{ resultat.code_annee }}
                </span>
              </td>

              <td class="font-monospace text-sm">
                {{ formatDate(resultat.date_fin) }}
              </td>

              <td class="text-center">
                <span
                  :class="[
                    'badge rounded-pill px-2.5 py-1.5 text-uppercase fw-bold text-xs',
                    getStatusBadgeClass(resultat.statut),
                  ]"
                >
                  {{ resultat.statut }}
                </span>
              </td>

              <td class="text-end">
                <div class="d-flex justify-content-end gap-1.5">
                  <button
                    @click="handleCalculerRangs(resultat.id)"
                    class="btn btn-sm btn-outline-info d-inline-flex align-items-center gap-1"
                    title="Calculer les moyennes et générer les rangs"
                  >
                    <i class="mdi mdi-calculator"></i> Rangs
                  </button>

                  <button
                    v-if="resultat.statut !== 'PROCLAMÉ'"
                    @click="handleProclamer(resultat.id)"
                    class="btn btn-sm btn-outline-success d-inline-flex align-items-center gap-1"
                    title="Proclamer officiellement les admissions"
                  >
                    <i class="mdi mdi-bullhorn-outline"></i> Proclamer
                  </button>

                  <button
                    @click="handleDownloadAdmis(resultat.id)"
                    class="btn btn-sm btn-danger d-inline-flex align-items-center gap-1"
                    title="Télécharger la liste des admis en PDF"
                  >
                    <i class="mdi mdi-file-pdf-box"></i> PDF
                  </button>
                </div>
              </td>
            </tr>

            <tr v-if="concoursList.length === 0">
              <td colspan="6" class="text-center text-muted py-4">
                Aucun concours enregistré dans le système.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import dayjs from 'dayjs';
import { useConcoursStore } from '@/stores/gestionStores/concourStore';
import SkeletonLoader from '@/components/SkeletonLoader.vue';

/* ========================================================
    Store Pinia
======================================================== */
const concoursStore = useConcoursStore();

const loading = computed(() => concoursStore.loading);
const concoursList = computed(() => concoursStore.concoursList || []);

/* ========================================================
    Formatages & Classes Graphiques
======================================================== */
const formatDate = (date) => {
  return date ? dayjs(date).format('DD/MM/YYYY') : 'Non définie';
};

// Alignement visuel sur les statuts réels du cycle de vie du concours
const getStatusBadgeClass = (status) => {
  switch (status?.toUpperCase()) {
    case 'PROCLAMÉ':
      return 'bg-success text-white'; // Clôturé et validé
    case 'OUVERT':
      return 'bg-warning text-dark'; // En cours de traitement / inscriptions actives
    case 'FERMÉ':
      return 'bg-danger text-white'; // Inscriptions closes, en attente de délibération
    default:
      return 'bg-secondary text-white';
  }
};

/* ========================================================
    Traitements Métiers reliés au Store
======================================================== */
const handleCalculerRangs = async (id) => {
  if (
    confirm(
      "Voulez-vous lancer l'algorithme de calcul des moyennes globales et d'attribution des rangs ?"
    )
  ) {
    await concoursStore.fetchMoyennesRangs(id);
  }
};

const handleProclamer = async (id) => {
  if (
    confirm(
      '🚨 ATTENTION : Cette action va figer les notes et publier officiellement la liste des candidats admis. Continuer ?'
    )
  ) {
    await concoursStore.proclaimAdmissions(id);
  }
};

const handleDownloadAdmis = async (id) => {
  await concoursStore.downloadAdmisList(id);
};

/* ========================================================
    Cycle de vie
======================================================== */
onMounted(async () => {
  // Charge la liste fraîche des concours à l'ouverture du volet des résultats
  await concoursStore.fetchConcours();
});
</script>

<style scoped>
.gap-1\.5 {
  gap: 0.375rem;
}
.btn-sm {
  padding: 0.3rem 0.5rem;
  font-size: 0.825rem;
}
</style>
