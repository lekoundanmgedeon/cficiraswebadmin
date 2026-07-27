<template>
  <div class="card border-0 shadow-sm rounded-4 bg-white p-4">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h6 class="fw-bold text-dark mb-0 small text-uppercase text-secondary tracking-wider">
        <i class="bi bi-list-ol text-primary me-2"></i>Palmarès Nominatif
      </h6>
      <ExportMenu v-if="bulletins.length" @excel="exportToExcel" @pdf="exportToPdf" />
    </div>

    <!--
      Le palmarès est nominatif : il exige les trois filtres. Sans eux, la route
      répond 400 — ce n'est pas un confort d'interface mais la condition d'une
      requête valide. On le dit plutôt que de laisser un tableau vide sans raison.
    -->
    <EmptyState
      v-if="!peutGenerer"
      title="Sélectionnez un périmètre complet"
      description="Le palmarès porte sur une classe, pour un semestre et une année donnés. Choisissez les trois dans l'en-tête."
      :size="80"
    />
    <LoadingSpinner v-else-if="loading && !bulletins.length" />
    <EmptyState
      v-else-if="!bulletins.length"
      title="Aucun bulletin pour ce périmètre"
      description="Lancez le calcul depuis l'en-tête : il agrège les notes saisies sur la période."
      :size="80"
    />
    <div v-else class="table-responsive">
      <table class="table table-hover align-middle mb-0 text-sm">
        <thead class="bg-light text-secondary text-xs">
          <tr>
            <th class="text-center ps-2" style="width: 60px">Rang</th>
            <th>Étudiant</th>
            <th class="text-center">Moyenne</th>
            <th class="text-center">Crédits</th>
            <th class="text-center">Décision</th>
            <th class="text-center pe-2">Mention</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="bulletin in bulletins" :key="bulletin.id">
            <td class="text-center ps-2">
              <span class="badge rounded-pill font-monospace text-xs" :class="rangClasse(bulletin)">
                {{ bulletin.rang_etudiant || '—' }}
              </span>
            </td>
            <td>
              <div class="fw-bold text-dark mb-0 text-xs">
                {{ bulletin.nom }} {{ bulletin.prenom }}
              </div>
              <small class="text-muted font-monospace text-xs">{{ bulletin.matricule }}</small>
            </td>
            <td class="text-center font-monospace text-xs fw-bold">
              {{ formatMoyenne(bulletin.moyenne_generale) }}
            </td>
            <td class="text-center font-monospace text-xs">
              {{ bulletin.credits_acquis }} / {{ bulletin.credits_totaux_semestre }}
            </td>
            <td class="text-center">
              <span class="badge text-xs" :class="infoDecision(bulletin.decision).classe">
                {{ infoDecision(bulletin.decision).label }}
              </span>
            </td>
            <td class="text-center pe-2">
              <span
                v-if="bulletin.mention"
                class="badge text-xs"
                :class="infoMention(bulletin.mention).classe"
              >
                {{ infoMention(bulletin.mention).label }}
              </span>
              <span v-else class="text-muted text-xs">—</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import EmptyState from '@/shared/components/EmptyState.vue';
import ExportMenu from '@/shared/components/ExportMenu.vue';
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue';
import { useTableExport } from '@/shared/composables/useTableExport';
import { useStatsStore } from '../../store';
import { formatMoyenne, infoDecision, infoMention } from '../../constants';

const store = useStatsStore();
const { bulletins, loading, peutGenerer } = storeToRefs(store);

/** Les trois premiers rangs se distinguent ; au-delà, un simple compteur. */
const rangClasse = (bulletin) => {
  if (bulletin.rang_etudiant === 1) return 'bg-soft-success text-success fw-bold';
  if (bulletin.rang_etudiant <= 3) return 'bg-soft-primary text-primary fw-bold';
  return 'bg-light text-dark';
};

const { exportToExcel, exportToPdf } = useTableExport({
  rows: computed(() =>
    bulletins.value.map((bulletin) => ({
      Rang: bulletin.rang_etudiant,
      Matricule: bulletin.matricule,
      Nom: bulletin.nom,
      Prénom: bulletin.prenom,
      Moyenne: bulletin.moyenne_generale,
      'Crédits acquis': bulletin.credits_acquis,
      'Crédits du semestre': bulletin.credits_totaux_semestre,
      Décision: infoDecision(bulletin.decision).label,
      Mention: bulletin.mention ? infoMention(bulletin.mention).label : '',
    }))
  ),
  title: 'Palmarès de la classe',
  fileBaseName: 'palmares_classe',
});

// L'onglet peut être ouvert après que le périmètre a déjà été choisi : il charge
// donc lui-même, plutôt que de compter sur la vue parente.
onMounted(() => store.fetchBulletins());
</script>

<style scoped>
.bg-soft-primary {
  background-color: rgba(0, 123, 255, 0.08);
}
.bg-soft-success {
  background-color: rgba(40, 167, 69, 0.12);
}
.bg-soft-warning {
  background-color: rgba(255, 193, 7, 0.15);
}
.bg-soft-danger {
  background-color: rgba(220, 53, 69, 0.08);
}
.bg-soft-secondary {
  background-color: rgba(108, 117, 125, 0.1);
}

.text-xs {
  font-size: 11px !important;
}
.text-sm {
  font-size: 0.85rem;
}
.tracking-wider {
  letter-spacing: 0.5px;
}

.table th {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: #6c757d;
  border: none;
}

.table tbody tr {
  border-bottom: 1px solid #f8f9fa;
}

.rounded-4 {
  border-radius: 0.2rem !important;
}
</style>
