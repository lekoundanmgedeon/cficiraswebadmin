<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue';
import ConfirmModal from '@/shared/components/ConfirmModal.vue';
import { useConcoursStore } from '../store';
import { SEUIL_ADMISSION_DEFAUT } from '../../constants';

const props = defineProps({
  concoursId: { type: String, required: true },
});

/**
 * Délibération et publication.
 *
 * `TabDeliberation.vue` était **entièrement simulé** : ses statistiques et sa
 * « simulation de classement » étaient trois candidats codés en dur (« TRAORE
 * Moussa », « SOW Fatoumata », « COULIBALY Amadou »). Il cumulait trois défauts :
 *
 * - `const concoursId = Number(route.params.id)` — l'identifiant est un **UUID** :
 *   `Number(uuid)` vaut `NaN`. Rien n'aurait pu être chargé.
 * - Il testait `concours.statut === 'PROCLAMÉ'` pour savoir si les résultats
 *   étaient publiés. **Ce statut n'existe pas** (`PLANIFIE`, `OUVERT`, `CLOTURE`,
 *   `ANNULE`) : la condition était toujours fausse.
 * - `downloadDraftPV` était un `console.log`.
 *
 * Or `GET /concours/:id/classement` renvoie la moyenne générale et le rang de
 * chaque candidat : la simulation à un seuil donné se calcule **sur les vraies
 * données**, sans le moindre endpoint supplémentaire.
 */

const concoursStore = useConcoursStore();
const { classement, loading } = storeToRefs(concoursStore);

const seuil = ref(SEUIL_ADMISSION_DEFAUT);
const commentaire = ref('');
const confirmation = ref(false);

onMounted(() => concoursStore.fetchClassement(props.concoursId));

watch(
  () => props.concoursId,
  (id) => concoursStore.fetchClassement(id)
);

/** @param {any} value */
const moyenne = (value) => {
  const number = Number(value);
  return Number.isNaN(number) ? null : number;
};

/** Classement trié par rang, tel que le serveur le calcule. */
const classes = computed(() =>
  [...classement.value].sort((a, b) => Number(a.rang ?? 0) - Number(b.rang ?? 0))
);

/** Simulation : qui serait admis au seuil saisi. Calculée sur les vraies moyennes. */
const admis = computed(() =>
  classes.value.filter((candidat) => (moyenne(candidat.moyenne_generale) ?? -1) >= seuil.value)
);

const stats = computed(() => {
  const total = classes.value.length;
  const moyennes = classes.value.map((c) => moyenne(c.moyenne_generale)).filter((m) => m !== null);

  const moyenneGenerale =
    moyennes.length > 0
      ? (moyennes.reduce((somme, m) => somme + m, 0) / moyennes.length).toFixed(2)
      : '—';

  return {
    total,
    moyenneGenerale,
    admisCount: admis.value.length,
    tauxReussite: total > 0 ? ((admis.value.length / total) * 100).toFixed(1) : '0.0',
  };
});

async function proclamer() {
  const result = await concoursStore.proclamer(props.concoursId, {
    seuil_admission: Number(seuil.value),
    commentaire: commentaire.value.trim() || null,
  });

  if (result !== undefined) confirmation.value = false;
}

const telechargerPV = () => concoursStore.downloadAdmisList(props.concoursId, 'pdf');
</script>

<template>
  <div>
    <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
      <div>
        <h5 class="fw-bold mb-1 text-dark">Délibération & Publication</h5>
        <p class="text-muted small mb-0">
          Simulez les admissions à un seuil donné, puis proclamez les résultats.
        </p>
      </div>

      <button
        class="btn btn-sm btn-light border text-secondary"
        :disabled="classes.length === 0"
        @click="telechargerPV"
      >
        <i class="bi bi-file-pdf me-1"></i> Télécharger le PV des admis
      </button>
    </div>

    <LoadingSpinner v-if="loading && classes.length === 0" />

    <div v-else-if="classes.length === 0" class="text-center py-5 text-muted">
      <i class="bi bi-award d-block mb-2 fs-3"></i>
      <h6 class="fw-bold text-dark">Aucun classement disponible</h6>
      <p class="small mb-0">
        Lancez d'abord le calcul des moyennes et des rangs depuis l'onglet « Résultats ».
      </p>
    </div>

    <div v-else>
      <div class="row g-3 mb-4">
        <div class="col-md-3">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-body">
              <span class="text-muted small fw-semibold text-uppercase d-block mb-1">
                Candidats classés
              </span>
              <h3 class="fw-bold text-dark mb-0 font-monospace">{{ stats.total }}</h3>
            </div>
          </div>
        </div>

        <div class="col-md-3">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-body">
              <span class="text-muted small fw-semibold text-uppercase d-block mb-1">
                Moyenne générale
              </span>
              <h3 class="fw-bold text-dark mb-0 font-monospace">{{ stats.moyenneGenerale }}</h3>
            </div>
          </div>
        </div>

        <div class="col-md-3">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-body">
              <span class="text-muted small fw-semibold text-uppercase d-block mb-1">
                Admis au seuil
              </span>
              <h3 class="fw-bold text-success mb-0 font-monospace">{{ stats.admisCount }}</h3>
            </div>
          </div>
        </div>

        <div class="col-md-3">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-body">
              <span class="text-muted small fw-semibold text-uppercase d-block mb-1">
                Taux de réussite
              </span>
              <h3 class="fw-bold text-dark mb-0 font-monospace">{{ stats.tauxReussite }} %</h3>
            </div>
          </div>
        </div>
      </div>

      <div class="card border-0 shadow-sm mb-4">
        <div class="card-body">
          <div class="row g-3 align-items-end">
            <div class="col-md-4">
              <label for="seuil" class="form-label fw-bold small">Seuil d'admission</label>
              <div class="input-group input-group-sm">
                <input
                  id="seuil"
                  v-model.number="seuil"
                  type="number"
                  class="form-control font-monospace"
                  min="0"
                  max="20"
                  step="0.25"
                />
                <span class="input-group-text">/ 20</span>
              </div>
              <div class="form-text text-xs">
                La simulation ci-dessous se met à jour instantanément.
              </div>
            </div>

            <div class="col-md-5">
              <label for="commentaire" class="form-label fw-bold small">
                Commentaire de délibération
              </label>
              <input
                id="commentaire"
                v-model="commentaire"
                type="text"
                class="form-control form-control-sm"
                placeholder="Facultatif"
              />
            </div>

            <div class="col-md-3 text-md-end">
              <button
                class="btn btn-sm btn-success px-3"
                :disabled="loading || admis.length === 0"
                @click="confirmation = true"
              >
                <i class="bi bi-bullhorn me-1"></i> Proclamer
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="table-responsive border rounded-3 shadow-sm bg-white">
        <table class="table table-hover align-middle mb-0 text-sm">
          <thead class="table-light text-uppercase text-xs text-muted">
            <tr>
              <th class="ps-3" style="width: 80px">Rang</th>
              <th>N° table</th>
              <th>Candidat</th>
              <th class="text-center">Moyenne</th>
              <th class="text-center pe-3">Simulation</th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="candidat in classes"
              :key="candidat.candidat_id"
              :class="{
                'table-success-subtle': (moyenne(candidat.moyenne_generale) ?? -1) >= seuil,
              }"
            >
              <td class="ps-3 fw-bold text-secondary">{{ candidat.rang }}</td>
              <td>
                <span class="font-monospace fw-bold text-secondary">{{ candidat.num_table }}</span>
              </td>
              <td class="fw-semibold text-dark">{{ candidat.nom }} {{ candidat.prenom }}</td>
              <td class="text-center fw-bold font-monospace">
                {{ moyenne(candidat.moyenne_generale)?.toFixed(2) ?? '—' }}
              </td>
              <td class="text-center pe-3">
                <span
                  class="badge"
                  :class="
                    (moyenne(candidat.moyenne_generale) ?? -1) >= seuil
                      ? 'bg-success-subtle text-success'
                      : 'bg-secondary-subtle text-secondary'
                  "
                >
                  {{ (moyenne(candidat.moyenne_generale) ?? -1) >= seuil ? 'Admis' : 'Non admis' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <ConfirmModal
      v-model="confirmation"
      title="Proclamer les admissions"
      :message="`${admis.length} candidat(s) seront déclarés admis, au seuil de ${seuil}/20. Cette action publie officiellement les résultats.`"
      confirm-label="Proclamer"
      variant="success"
      :loading="loading"
      @confirm="proclamer"
    />
  </div>
</template>

<style scoped>
.text-xs {
  font-size: 0.72rem;
}
.text-sm {
  font-size: 0.875rem;
}
</style>
