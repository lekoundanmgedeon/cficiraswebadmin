<script setup>
import { computed, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import EmptyState from '@/shared/components/EmptyState.vue';
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue';
import { useInscriptionStore } from '@/modules/inscriptions/store';
import { formatMoney, statutInfo } from '@/modules/inscriptions/constants';

const props = defineProps({
  etudiantId: { type: String, required: true },
});

/**
 * Situation financière de l'étudiant.
 *
 * `SituationFinanciere.vue` servait des `paiements` et un `echeancier` codés en
 * dur. Il n'existe pas d'endpoint « finances d'un étudiant », mais
 * `GET /inscriptions/finances` renvoie **une ligne par dossier d'inscription**,
 * avec `etudiant_id`, les frais, le montant versé et le reste : il suffit d'y
 * retenir les lignes de cet étudiant.
 *
 * (Le domaine `/finance` du backend, qui exposerait l'échéancier détaillé, est
 * **commenté dans `index.routes.js`** — donc désactivé. L'échéancier de la
 * maquette n'a donc aucune source réelle et n'est pas repris.)
 */

const inscriptionStore = useInscriptionStore();
const { finances, loading } = storeToRefs(inscriptionStore);

onMounted(() => inscriptionStore.fetchFinances());

const lignes = computed(() =>
  finances.value.filter((ligne) => String(ligne.etudiant_id) === String(props.etudiantId))
);

const totalDu = computed(() =>
  lignes.value.reduce((total, ligne) => total + Number(ligne.frais_scolarite ?? 0), 0)
);

const totalVerse = computed(() =>
  lignes.value.reduce((total, ligne) => total + Number(ligne.montant_verse ?? 0), 0)
);

const totalReste = computed(() =>
  lignes.value.reduce((total, ligne) => total + Number(ligne.reste ?? 0), 0)
);

const tauxReglement = computed(() => {
  if (totalDu.value <= 0) return 0;
  return Math.round((totalVerse.value / totalDu.value) * 100);
});
</script>

<template>
  <div>
    <LoadingSpinner v-if="loading && lignes.length === 0" />

    <EmptyState
      v-else-if="lignes.length === 0"
      title="Aucune donnée financière"
      description="Cet étudiant n'a pas encore de dossier d'inscription porteur de frais."
    />

    <div v-else>
      <div class="row g-3 mb-4">
        <div class="col-md-4">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-body">
              <span class="text-muted small fw-semibold text-uppercase d-block mb-1">
                Frais dus
              </span>
              <h4 class="fw-bold text-dark mb-0">{{ formatMoney(totalDu) }}</h4>
            </div>
          </div>
        </div>

        <div class="col-md-4">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-body">
              <span class="text-muted small fw-semibold text-uppercase d-block mb-1">
                Montant versé
              </span>
              <h4 class="fw-bold text-success mb-0">{{ formatMoney(totalVerse) }}</h4>
            </div>
          </div>
        </div>

        <div class="col-md-4">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-body">
              <span class="text-muted small fw-semibold text-uppercase d-block mb-1">
                Reste à payer
              </span>
              <h4 class="fw-bold mb-0" :class="totalReste > 0 ? 'text-danger' : 'text-success'">
                {{ formatMoney(totalReste) }}
              </h4>
              <div class="progress mt-2" style="height: 5px">
                <div
                  class="progress-bar bg-success rounded"
                  role="progressbar"
                  :style="{ width: Math.min(tauxReglement, 100) + '%' }"
                  :aria-valuenow="tauxReglement"
                  aria-valuemin="0"
                  aria-valuemax="100"
                ></div>
              </div>
              <small class="text-muted">{{ tauxReglement }} % réglé</small>
            </div>
          </div>
        </div>
      </div>

      <div class="card border-0 shadow-sm overflow-hidden">
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table align-middle mb-0">
              <thead class="table-light">
                <tr>
                  <th class="ps-4 py-3">Classe</th>
                  <th class="text-end">Frais</th>
                  <th class="text-end">Versé</th>
                  <th class="text-end">Reste</th>
                  <th class="text-center">Statut</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="ligne in lignes" :key="ligne.id">
                  <td class="ps-4">
                    <div class="fw-semibold text-dark">{{ ligne.classe_code ?? '—' }}</div>
                    <small class="text-muted">{{ ligne.filiere_code ?? '—' }}</small>
                  </td>
                  <td class="text-end">{{ formatMoney(ligne.frais_scolarite) }}</td>
                  <td class="text-end text-success">{{ formatMoney(ligne.montant_verse) }}</td>
                  <td class="text-end fw-bold text-danger">{{ formatMoney(ligne.reste) }}</td>
                  <td class="text-center">
                    <span
                      class="badge rounded-pill px-3 py-2"
                      :class="`bg-${statutInfo(ligne.statut).variant}-subtle text-${statutInfo(ligne.statut).variant}`"
                    >
                      {{ statutInfo(ligne.statut).label }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.table thead th {
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: #5c677d;
  border-bottom: 1px solid #e2e8f0;
}
</style>
