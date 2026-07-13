<script setup>
import { computed, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import EmptyState from '@/shared/components/EmptyState.vue';
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue';
import { useEtudiantStore } from '../store';

const props = defineProps({
  etudiantId: { type: [String, Number], required: true },
});

/**
 * Parcours académique d'un étudiant.
 *
 * `GET /etudiants/:id/parcours` existait côté API, et `etudiantStore.fetchParcours()`
 * existait côté store — mais **aucune vue ne l'appelait**. L'écran « Dossier
 * académique » simulait ses données au lieu de consommer l'endpoint. Le voici
 * enfin branché.
 */

const etudiantStore = useEtudiantStore();
const { parcours, loading } = storeToRefs(etudiantStore);

onMounted(() => etudiantStore.fetchParcours(props.etudiantId));

/**
 * L'API peut renvoyer soit une liste d'étapes, soit un objet qui les enveloppe.
 * On normalise ici plutôt que de laisser le template s'en accommoder.
 */
const etapes = computed(() => {
  const value = parcours.value;
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return value.parcours ?? value.etapes ?? [];
});
</script>

<template>
  <div>
    <LoadingSpinner v-if="loading" />

    <EmptyState
      v-else-if="etapes.length === 0"
      title="Aucun parcours enregistré"
      description="Le parcours académique de cet étudiant n'a pas encore été renseigné."
    />

    <div v-else class="table-responsive">
      <table class="table align-middle mb-0">
        <thead class="table-light">
          <tr>
            <th class="ps-4 py-3">Année académique</th>
            <th>Filière</th>
            <th>Classe</th>
            <th class="text-center">Moyenne</th>
            <th class="text-center">Résultat</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="(etape, index) in etapes" :key="etape.id ?? index">
            <td class="ps-4 fw-semibold text-dark">{{ etape.annee_academique ?? '—' }}</td>
            <td>{{ etape.filiere ?? '—' }}</td>
            <td>{{ etape.classe ?? '—' }}</td>
            <td class="text-center">
              <span class="fw-bold">{{ etape.moyenne ?? '—' }}</span>
            </td>
            <td class="text-center">
              <span
                v-if="etape.resultat"
                class="badge rounded-pill px-3 py-2"
                :class="
                  etape.resultat?.toLowerCase().includes('admis')
                    ? 'bg-success-subtle text-success'
                    : 'bg-secondary-subtle text-secondary'
                "
              >
                {{ etape.resultat }}
              </span>
              <span v-else class="text-muted">—</span>
            </td>
          </tr>
        </tbody>
      </table>
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
