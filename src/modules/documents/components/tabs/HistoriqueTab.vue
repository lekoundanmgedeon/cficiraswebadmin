<script setup>
import { computed, onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import ExportMenu from '@/shared/components/ExportMenu.vue';
import EmptyState from '@/shared/components/EmptyState.vue';
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue';
import { useTableExport } from '@/shared/composables/useTableExport';
import { formatDate } from '@/shared/utils/date';
import { useDocumentStore } from '../../store';
import { statutDemandeInfo } from '../../constants';

/**
 * Historique : les demandes sorties du circuit — délivrées ou rejetées.
 *
 * « Traitée » ne veut pas dire « prise en charge » : une demande en traitement
 * est encore ouverte, et n'a rien à faire dans un historique. La distinction est
 * la même côté serveur (`?traitees=true`).
 */

const store = useDocumentStore();
const { loading } = storeToRefs(store);

const recherche = ref('');
const issue = ref('');

onMounted(() => Promise.all([store.fetchAll(), store.fetchStatistiques()]));

const filtres = computed(() => {
  const terme = recherche.value.trim().toLowerCase();

  return store.traitees.filter((demande) => {
    if (issue.value && demande.statut !== issue.value) return false;
    if (!terme) return true;

    return [demande.numero, demande.nom, demande.prenom, demande.matricule, demande.type_libelle]
      .filter(Boolean)
      .some((champ) => String(champ).toLowerCase().includes(terme));
  });
});

/** Délai réellement constaté entre le dépôt et la sortie. */
const delaiReel = (demande) => {
  const fin = demande.date_delivrance ?? demande.date_traitement;
  if (!fin || !demande.date_demande) return null;

  const jours = Math.round(
    (new Date(fin).getTime() - new Date(demande.date_demande).getTime()) / 86_400_000
  );
  return Number.isNaN(jours) ? null : Math.max(jours, 0);
};

const delaiMoyen = computed(() => {
  const delais = store.traitees.map(delaiReel).filter((jours) => jours !== null);
  if (!delais.length) return null;
  return delais.reduce((somme, jours) => somme + jours, 0) / delais.length;
});

const { exportToExcel, exportToPdf } = useTableExport({
  rows: computed(() =>
    filtres.value.map((demande) => ({
      Numéro: demande.numero,
      Étudiant: `${demande.nom} ${demande.prenom}`,
      Matricule: demande.matricule,
      Document: demande.type_libelle,
      Déposée: formatDate(demande.date_demande),
      Traitée: demande.date_traitement ? formatDate(demande.date_traitement) : '—',
      Délivrée: demande.date_delivrance ? formatDate(demande.date_delivrance) : '—',
      'Délai (j)': delaiReel(demande) ?? '—',
      Issue: statutDemandeInfo(demande.statut).label,
      Motif: demande.motif_rejet || '—',
    }))
  ),
  title: 'Historique des demandes de documents',
  fileBaseName: 'historique_demandes',
});
</script>

<template>
  <div>
    <div class="d-flex justify-content-between align-items-start mb-3 flex-wrap gap-2">
      <div>
        <h4 class="mb-1">Historique</h4>
        <p class="mb-0 text-muted small">
          Demandes closes : documents délivrés et demandes rejetées, avec leur motif.
        </p>
      </div>
      <ExportMenu :disabled="!filtres.length" @excel="exportToExcel" @pdf="exportToPdf" />
    </div>

    <div class="row g-3 mb-3">
      <div class="col-6 col-lg-4">
        <div class="card border-0 shadow-sm p-3 border-start border-success border-3">
          <span class="text-muted small text-uppercase d-block mb-1">Documents délivrés</span>
          <span class="fw-bold font-monospace fs-5">
            {{ store.traitees.filter((d) => d.statut === 'DELIVREE').length }}
          </span>
        </div>
      </div>
      <div class="col-6 col-lg-4">
        <div class="card border-0 shadow-sm p-3 border-start border-danger border-3">
          <span class="text-muted small text-uppercase d-block mb-1">Demandes rejetées</span>
          <span class="fw-bold font-monospace fs-5">
            {{ store.traitees.filter((d) => d.statut === 'REJETEE').length }}
          </span>
        </div>
      </div>
      <div class="col-12 col-lg-4">
        <div class="card border-0 shadow-sm p-3 border-start border-info border-3">
          <span class="text-muted small text-uppercase d-block mb-1">Délai moyen constaté</span>
          <span class="fw-bold font-monospace fs-5">
            {{ delaiMoyen === null ? '—' : `${delaiMoyen.toFixed(1)} j` }}
          </span>
        </div>
      </div>
    </div>

    <div class="row g-2 align-items-end mb-3">
      <div class="col-md-7">
        <label for="historique-recherche" class="form-label small fw-semibold text-secondary">
          Rechercher
        </label>
        <input
          id="historique-recherche"
          v-model="recherche"
          type="search"
          class="form-control form-control-sm"
          placeholder="Numéro, étudiant ou document"
        />
      </div>
      <div class="col-md-5">
        <label for="historique-issue" class="form-label small fw-semibold text-secondary">
          Issue
        </label>
        <select id="historique-issue" v-model="issue" class="form-select form-select-sm">
          <option value="">Toutes</option>
          <option value="DELIVREE">Délivrées</option>
          <option value="REJETEE">Rejetées</option>
        </select>
      </div>
    </div>

    <LoadingSpinner v-if="loading && !store.items.length" />

    <EmptyState
      v-else-if="!store.traitees.length"
      title="Aucune demande close"
      description="Les demandes délivrées ou rejetées apparaîtront ici."
    />

    <EmptyState
      v-else-if="!filtres.length"
      title="Aucune demande ne correspond"
      description="Élargissez la recherche ou changez l'issue."
      :size="80"
    />

    <div v-else class="table-responsive card border-0 shadow-sm">
      <table class="table table-hover align-middle mb-0">
        <thead class="table-light">
          <tr>
            <th class="ps-3">Numéro</th>
            <th>Étudiant</th>
            <th>Document</th>
            <th>Dépôt → sortie</th>
            <th class="text-center">Délai</th>
            <th>Issue</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="demande in filtres" :key="demande.id">
            <td class="ps-3 font-monospace small fw-semibold">{{ demande.numero }}</td>
            <td>
              <span class="fw-semibold text-dark d-block">
                {{ demande.nom }} {{ demande.prenom }}
              </span>
              <span class="text-muted small font-monospace">{{ demande.matricule }}</span>
            </td>
            <td class="small">{{ demande.type_libelle }}</td>
            <td class="small">
              {{ formatDate(demande.date_demande) }}
              <span class="text-muted">→</span>
              {{
                demande.date_delivrance
                  ? formatDate(demande.date_delivrance)
                  : formatDate(demande.date_traitement)
              }}
              <span
                v-if="demande.traite_par_username"
                class="d-block text-muted"
                style="font-size: 11px"
              >
                par {{ demande.traite_par_username }}
              </span>
            </td>
            <td class="text-center font-monospace small">
              {{ delaiReel(demande) === null ? '—' : `${delaiReel(demande)} j` }}
            </td>
            <td>
              <span
                class="badge"
                :class="`bg-${statutDemandeInfo(demande.statut).variant}-subtle text-${statutDemandeInfo(demande.statut).variant}`"
              >
                {{ statutDemandeInfo(demande.statut).label }}
              </span>
              <span v-if="demande.motif_rejet" class="d-block text-muted" style="font-size: 11px">
                {{ demande.motif_rejet }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
