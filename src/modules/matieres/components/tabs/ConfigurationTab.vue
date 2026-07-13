<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import ItemActions from '@/shared/components/ItemActions.vue';
import ExportMenu from '@/shared/components/ExportMenu.vue';
import EmptyState from '@/shared/components/EmptyState.vue';
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue';
import { useTableExport } from '@/shared/composables/useTableExport';
import { useModuleStore } from '../../store';
import AssignationModal from '../AssignationModal.vue';

/**
 * Composition pédagogique d'une classe pour un semestre.
 *
 * `GET /modules/configuration/details` exige **les deux** identifiants
 * (`semestreId` et `classeId`) et répond 400 s'il en manque un : ce n'est pas un
 * annuaire de modules, mais la liste des UE rattachées à un couple précis. D'où
 * le sélecteur de configuration en tête d'onglet.
 *
 * ⚠️ Cette vue backend ne parle pas le même vocabulaire que `GET /modules` :
 * elle renvoie `libelle`, `credits` et `heures` là où la liste renvoie
 * `designation`, `credit` et `volume_horaire`. On lit les deux graphies.
 *
 * Le détachement porte sur `attribution_id` — l'identifiant du **lien**
 * (`ModuleClasse`), et non celui du module : détacher n'est pas supprimer.
 */

const moduleStore = useModuleStore();
const { configurations, ues, loading } = storeToRefs(moduleStore);

const selectedConfigId = ref('');

onMounted(async () => {
  await moduleStore.fetchConfigurations();

  // Une seule configuration dans la plupart des cas : autant l'ouvrir d'emblée.
  if (!selectedConfigId.value && configurations.value.length > 0) {
    selectedConfigId.value = configurations.value[0].id;
  }
});

const selectedConfig = computed(() =>
  configurations.value.find((config) => config.id === selectedConfigId.value)
);

watch(selectedConfig, (config) => {
  moduleStore.fetchUes(config?.semestre_id, config?.classe_id);
});

const totalCredits = computed(() =>
  ues.value.reduce((total, ue) => total + Number(ue.credits ?? ue.credit ?? 0), 0)
);

const totalHeures = computed(() =>
  ues.value.reduce((total, ue) => total + Number(ue.heures ?? ue.volume_horaire ?? 0), 0)
);

const exportRows = computed(() =>
  ues.value.map((ue, index) => ({
    'N°': index + 1,
    Code: ue.code,
    Désignation: ue.libelle ?? ue.designation ?? '—',
    Crédits: ue.credits ?? ue.credit ?? 0,
    'Volume horaire': `${ue.heures ?? ue.volume_horaire ?? 0} h`,
  }))
);

const { exportToExcel, exportToPdf } = useTableExport({
  rows: exportRows,
  title: 'Composition pédagogique',
  fileBaseName: 'composition_pedagogique',
  filters: () => [
    { label: 'Classe', value: selectedConfig.value?.filiere ?? '—' },
    { label: 'Semestre', value: selectedConfig.value?.code ?? '—' },
    { label: 'Niveau', value: selectedConfig.value?.niveau ?? '—' },
    { label: 'Total crédits', value: totalCredits.value },
    { label: 'Volume horaire', value: `${totalHeures.value} h` },
  ],
});

const actions = [
  {
    key: 'detach',
    label: 'Détacher de la classe',
    icon: 'mdi-link-variant-off',
    variant: 'danger',
    confirm: {
      title: 'Détacher l’unité d’enseignement',
      message:
        'Le module sera retiré de cette classe pour ce semestre. Le module lui-même n’est pas supprimé.',
      confirmLabel: 'Détacher',
      variant: 'danger',
    },
  },
];

/** @param {{key: string, item: any}} event */
function onAction({ key, item }) {
  if (key !== 'detach') return;

  moduleStore.detachUe(
    item.attribution_id,
    selectedConfig.value.semestre_id,
    selectedConfig.value.classe_id
  );
}
</script>

<template>
  <div>
    <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
      <div>
        <h4 class="fw-bold mb-1">Composition pédagogique</h4>
        <p class="text-muted small mb-0">
          Les unités d'enseignement rattachées à une classe pour un semestre donné.
        </p>
      </div>

      <div class="d-flex gap-2">
        <ExportMenu :disabled="ues.length === 0" @excel="exportToExcel" @pdf="exportToPdf" />
        <AssignationModal :config="selectedConfig" />
      </div>
    </div>

    <div class="card border-0 shadow-sm bg-light mb-4">
      <div class="card-body p-3">
        <label for="config-select" class="small fw-semibold text-muted mb-1">
          Classe et semestre
        </label>
        <select
          id="config-select"
          v-model="selectedConfigId"
          class="form-select border-0 shadow-sm"
        >
          <option value="">Choisir une configuration</option>
          <option v-for="config in configurations" :key="config.id" :value="config.id">
            {{ config.code }} — {{ config.filiere }} — {{ config.niveau }} ({{ config.periode }})
          </option>
        </select>
      </div>
    </div>

    <div v-if="selectedConfig && ues.length > 0" class="row g-3 mb-4">
      <div class="col-md-6">
        <div class="card border-0 shadow-sm">
          <div class="card-body">
            <span class="text-muted small fw-semibold text-uppercase d-block mb-1">
              Total crédits
            </span>
            <h3 class="fw-bold text-dark mb-0 font-monospace">{{ totalCredits }} ECTS</h3>
          </div>
        </div>
      </div>

      <div class="col-md-6">
        <div class="card border-0 shadow-sm">
          <div class="card-body">
            <span class="text-muted small fw-semibold text-uppercase d-block mb-1">
              Volume horaire
            </span>
            <h3 class="fw-bold text-dark mb-0 font-monospace">{{ totalHeures }} h</h3>
          </div>
        </div>
      </div>
    </div>

    <LoadingSpinner v-if="loading" />

    <EmptyState
      v-else-if="!selectedConfig"
      title="Choisissez une configuration"
      description="Sélectionnez une classe et un semestre pour voir les unités d'enseignement rattachées."
    />

    <EmptyState
      v-else-if="ues.length === 0"
      title="Aucune unité d'enseignement"
      description="Aucun module n'est encore rattaché à cette classe pour ce semestre."
    />

    <div v-else class="card border-0 shadow-sm overflow-hidden">
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead class="bg-light">
              <tr>
                <th class="ps-4 py-3">Code</th>
                <th>Unité d'enseignement</th>
                <th class="text-center">Crédits</th>
                <th class="text-center">Volume</th>
                <th class="text-end pe-4">Actions</th>
              </tr>
            </thead>

            <tbody>
              <tr v-for="ue in ues" :key="ue.attribution_id">
                <td class="ps-4">
                  <span class="code-box">{{ ue.code }}</span>
                </td>

                <td class="fw-semibold text-dark">
                  {{ ue.libelle ?? ue.designation ?? '—' }}
                </td>

                <td class="text-center">
                  <span class="credit-pill">{{ ue.credits ?? ue.credit ?? 0 }} ECTS</span>
                </td>

                <td class="text-center">{{ ue.heures ?? ue.volume_horaire ?? 0 }} h</td>

                <td class="text-end pe-4">
                  <ItemActions
                    :item="ue"
                    :label="ue.libelle ?? ue.code"
                    :actions="actions"
                    :loading="loading"
                    @action="onAction"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.code-box {
  background: #f1f5f9;
  color: #475569;
  padding: 3px 10px;
  border-radius: 4px;
  font-size: 0.78rem;
  font-weight: 700;
}

.credit-pill {
  background: rgba(75, 73, 172, 0.1);
  color: #4b49ac;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 600;
}

.table thead th {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: #6c757d;
  border: none;
}
</style>
