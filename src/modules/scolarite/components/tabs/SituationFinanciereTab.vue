<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import EmptyState from '@/shared/components/EmptyState.vue';
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue';
import { statutInfo } from '@/modules/inscriptions/constants';
import { formatMoney } from '@/modules/finances/constants';
import { useRapportStore } from '@/modules/finances/stores/rapports';

const props = defineProps({
  etudiantId: { type: String, required: true },
});

/**
 * Situation financière de l'étudiant.
 *
 * Cet onglet affichait des montants faux. Il lisait `GET /inscriptions/finances`,
 * dont la vue serveur exposait les **frais d'inscription** (50 000 F) sous le nom
 * `frais_scolarite`, et plafonnait à ce même montant le versé. Un étudiant devant
 * 575 000 F et en ayant réglé 500 000 s'y affichait « dû 50 000, versé 50 000,
 * reste 0 — 100 % réglé ».
 *
 * La vue est corrigée à la source (migration 005), mais cet onglet interroge
 * désormais le domaine financier lui-même :
 * `GET /finance/rapports/situation/:etudiantId` rend une ligne par inscription
 * avec le dû ventilé, le versé, le reste et le taux de règlement — et, en prime,
 * le plan de paiement de l'étudiant et ses échéances en retard, que l'ancienne
 * source ne connaissait pas.
 */

const store = useRapportStore();
const lignes = ref([]);
const loading = ref(false);

async function charger() {
  loading.value = true;
  try {
    lignes.value = await store.fetchSituationEtudiant(props.etudiantId);
  } finally {
    loading.value = false;
  }
}

onMounted(charger);

// La fiche passe d'un étudiant à l'autre sans être démontée : sans cela, l'onglet
// resterait sur la situation du dossier précédent.
watch(() => props.etudiantId, charger);

/** Les montants arrivent en chaînes (`NUMERIC` PostgreSQL) : d'où le `Number()`. */
const somme = (champ) => lignes.value.reduce((total, l) => total + Number(l[champ] ?? 0), 0);

const totalDu = computed(() => somme('total_du'));
const totalVerse = computed(() => somme('total_verse'));
const totalReste = computed(() => somme('reste'));

const tauxReglement = computed(() => {
  if (totalDu.value <= 0) return 0;
  return Math.round((totalVerse.value / totalDu.value) * 100);
});

/** Échéances dépassées et non soldées, toutes inscriptions confondues. */
const echeancesEnRetard = computed(() => somme('nb_echeances_retard'));
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
      <div
        v-if="echeancesEnRetard > 0"
        class="alert alert-warning border-0 d-flex align-items-center mb-4"
      >
        <i class="mdi mdi-alert-circle-outline me-2"></i>
        <span>
          {{ echeancesEnRetard }} échéance(s) dépassée(s) et non soldée(s) sur l'échéancier de cet
          étudiant.
        </span>
      </div>

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
                  <th>Plan de paiement</th>
                  <th class="text-end">Frais dus</th>
                  <th class="text-end">Versé</th>
                  <th class="text-end">Reste</th>
                  <th class="text-center">Statut</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="ligne in lignes" :key="ligne.inscription_id">
                  <td class="ps-4">
                    <div class="fw-semibold text-dark">{{ ligne.classe_code ?? '—' }}</div>
                    <small class="text-muted">
                      {{ ligne.filiere_code ?? '—' }} · {{ ligne.annee_code ?? '—' }}
                    </small>
                  </td>
                  <td>
                    <div class="fw-semibold text-dark">{{ ligne.plan ?? 'Aucun échéancier' }}</div>
                    <small v-if="ligne.nb_echeances" class="text-muted">
                      {{ ligne.nb_echeances }} échéance(s)
                    </small>
                  </td>
                  <td class="text-end">{{ formatMoney(ligne.total_du) }}</td>
                  <td class="text-end text-success">{{ formatMoney(ligne.total_verse) }}</td>
                  <td
                    class="text-end fw-bold"
                    :class="Number(ligne.reste) > 0 ? 'text-danger' : 'text-muted'"
                  >
                    {{ formatMoney(ligne.reste) }}
                  </td>
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
