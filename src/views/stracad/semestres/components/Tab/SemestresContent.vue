<template>
  <div class="row">
    <div class="col-12 mb-3">
      <h4>Liste des semestres</h4>
      <p class="text-muted small">
        Suivi et gestion de tous les semestres académiques enregistrés dans l'établissement.
      </p>
    </div>

    <div class="col-12">
      <div class="table-responsive card border-0 shadow-sm">
        <table class="table align-middle mb-0 table-hover">
          <thead class="table-light">
            <tr>
              <th class="ps-3" style="width: 60px">#</th>
              <th>Code</th>
              <th>Année Académique</th>
              <th>Date début</th>
              <th>Date fin</th>
              <th class="text-center">Statut</th>
              <th class="text-end pe-3">Actions</th>
            </tr>
          </thead>

          <tbody>
            <tr v-if="loading">
              <td colspan="7" class="text-center py-5">
                <div class="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
                <span class="text-muted">Chargement des semestres...</span>
              </td>
            </tr>

            <template v-else-if="semestres.length > 0">
              <tr v-for="(semestre, index) in semestres" :key="semestre.id">
                <td class="ps-3 text-muted small">{{ index + 1 }}</td>
                <td>
                  <span
                    class="badge bg-primary-subtle text-primary font-monospace fw-bold px-2 py-1"
                  >
                    {{ semestre.code }}
                  </span>
                </td>
                <td>
                  <div class="d-flex align-items-center gap-2">
                    <span class="fw-semibold text-dark">{{ semestre.annee }}</span>
                    <span
                      v-if="semestre.anneeActive"
                      class="badge bg-success-subtle text-success text-xs rounded-pill"
                    >
                      Année Active
                    </span>
                  </div>
                </td>
                <td>
                  <div class="text-dark small">
                    <i class="mdi mdi-calendar-play text-muted me-1"></i
                    >{{ formatDate(semestre.dateDebut) }}
                  </div>
                </td>
                <td>
                  <div class="text-dark small">
                    <i class="mdi mdi-calendar-stop text-muted me-1"></i
                    >{{ formatDate(semestre.dateFin) }}
                  </div>
                </td>
                <td class="text-center">
                  <span
                    class="badge rounded-pill px-3 py-1 fw-bold text-uppercase text-xs"
                    :class="
                      semestre.actif
                        ? 'bg-success-subtle text-success border border-success-subtle'
                        : 'bg-secondary-subtle text-secondary border border-secondary-subtle'
                    "
                  >
                    {{ semestre.actif ? 'Semestre Activé' : 'Semestre Inactivé' }}
                  </span>
                </td>
                <td class="text-end pe-3">
                  <ItemActions
                    :item="semestre"
                    concourRoute="/edition-semestre/"
                    :showAdd="false"
                    @edit="editSemestre"
                    @delete="confirmDelete"
                  />
                </td>
              </tr>
            </template>

            <tr v-else>
              <td colspan="7" class="text-center py-5">
                <div class="d-flex flex-column align-items-center py-3">
                  <i
                    class="mdi mdi-calendar-clock text-muted"
                    style="font-size: 3rem; opacity: 0.3"
                  ></i>
                  <div class="text-muted mt-2 small">Aucun semestre enregistré pour le moment</div>
                </div>
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
import ItemActions from '../details/ItemActions.vue';
import { useSemestreStore } from '@/stores/academiqueStore/semestreStore';

/* =====================
   Store
===================== */
const semestreStore = useSemestreStore();

/* =====================
   Computed (Mapping rigoureux avec l'API)
===================== */
const loading = computed(() => semestreStore.loading);

const semestres = computed(() => {
  const listeRaw = semestreStore.semestres || [];
  return listeRaw.map((s) => ({
    id: s.id,
    code: s.code,
    annee: s.annee_academique_code, // Correction clé API : annee_academique_code
    anneeActive: s.annee_est_active, // Récupération de l'état de l'année
    dateDebut: s.date_debut, // API: date_debut
    dateFin: s.date_fin, // API: date_fin
    actif: s.est_actif, // API: est_actif
  }));
});

/* =====================
   Méthodes
===================== */
const editSemestre = (semestre) => {
  console.log('Édition du semestre :', semestre);
};

const confirmDelete = (semestre) => {
  if (confirm(`Voulez-vous vraiment supprimer le semestre ${semestre.code} ?`)) {
    semestreStore.removeSemestre(semestre.id);
  }
};

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

/* =====================
   Lifecycle
===================== */
onMounted(() => {
  semestreStore.fetchSemestres();
});
</script>

<style scoped>
.text-xs {
  font-size: 0.725rem;
}
</style>
