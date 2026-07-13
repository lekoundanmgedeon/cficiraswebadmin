<script setup>
import { onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import EmptyState from '@/shared/components/EmptyState.vue';
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue';
import { useDossierStore } from '../../store';

const props = defineProps({
  etudiantId: { type: String, required: true },
});

/**
 * Parcours académique, année par année.
 *
 * `ParcoursAcademique.vue` servait un `historique` codé en dur. L'endpoint
 * existait pourtant depuis toujours — `GET /etudiants/:id/parcours` — et
 * renvoie, pour chaque année : `periode`, `classe`, `moyenne`, `resultat` et le
 * détail des `matieres`. Aucune vue ne l'appelait.
 */

const dossierStore = useDossierStore();
const { parcours, loading } = storeToRefs(dossierStore);

onMounted(() => dossierStore.fetchParcours(props.etudiantId));

/** @param {string} resultat @returns {string} */
function resultatVariant(resultat) {
  const value = String(resultat ?? '').toLowerCase();
  if (value.includes('admis') || value.includes('valid')) return 'success';
  if (value.includes('attente')) return 'warning';
  if (value.includes('redouble') || value.includes('exclu') || value.includes('echec'))
    return 'danger';
  return 'secondary';
}

/** Le backend renvoie les moyennes en chaînes (« 0.00 »). */
const formatMoyenne = (moyenne) => {
  const value = Number(moyenne);
  return Number.isNaN(value) ? '—' : value.toFixed(2);
};
</script>

<template>
  <div>
    <LoadingSpinner v-if="loading && parcours.length === 0" />

    <EmptyState
      v-else-if="parcours.length === 0"
      title="Aucun parcours enregistré"
      description="Le parcours académique de cet étudiant n'a pas encore été renseigné."
    />

    <div v-else class="d-flex flex-column gap-4">
      <div
        v-for="(etape, index) in parcours"
        :key="etape.periode ?? index"
        class="card border-0 shadow-sm"
      >
        <div
          class="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center flex-wrap gap-2"
        >
          <div>
            <h6 class="mb-0 fw-bold text-primary">{{ etape.periode ?? '—' }}</h6>
            <small class="text-muted">{{ etape.classe ?? '—' }}</small>
          </div>

          <div class="d-flex align-items-center gap-3">
            <div class="text-end">
              <span class="text-muted small d-block">Moyenne</span>
              <span class="fw-bold text-dark font-monospace">
                {{ formatMoyenne(etape.moyenne) }}
              </span>
            </div>

            <span
              class="badge rounded-pill px-3 py-2"
              :class="`bg-${resultatVariant(etape.resultat)}-subtle text-${resultatVariant(etape.resultat)}`"
            >
              {{ (etape.resultat ?? '—').replace(/_/g, ' ') }}
            </span>
          </div>
        </div>

        <div class="card-body p-0">
          <p
            v-if="!etape.matieres || etape.matieres.length === 0"
            class="text-muted small p-3 mb-0"
          >
            Aucune note enregistrée pour cette période.
          </p>

          <div v-else class="table-responsive">
            <table class="table align-middle mb-0">
              <thead class="table-light">
                <tr>
                  <th class="ps-4">Matière</th>
                  <th class="text-center">Coefficient</th>
                  <th class="text-center">Note</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(matiere, i) in etape.matieres" :key="matiere.code ?? i">
                  <td class="ps-4">
                    <span class="fw-semibold text-dark">
                      {{ matiere.designation ?? matiere.libelle ?? matiere.code ?? '—' }}
                    </span>
                  </td>
                  <td class="text-center">{{ matiere.coefficient ?? '—' }}</td>
                  <td class="text-center fw-bold">
                    {{ matiere.note != null ? formatMoyenne(matiere.note) : '—' }}
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
