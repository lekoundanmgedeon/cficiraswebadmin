<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import PageHeader from '@/shared/components/PageHeader.vue';
import EmptyState from '@/shared/components/EmptyState.vue';
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue';
import ExportMenu from '@/shared/components/ExportMenu.vue';
import { useTableExport } from '@/shared/composables/useTableExport';
import { useConcoursStore } from '../store';

/**
 * Rapport de concours : le classement des candidats.
 *
 * `RapportConcours.vue` affichait — dans un « rapport de concours » — une liste
 * de **formateurs** codés en dur (« John Doe », « Anna Smith »), servie après un
 * `setTimeout(3000)`. C'est exactement le même copier-coller que l'on trouvait
 * dans `RapportExamens.vue` : ni l'un ni l'autre n'avait de rapport avec des
 * résultats.
 *
 * Le classement, lui, est réel : `GET /concours/:id/classement` renvoie la
 * moyenne générale et le rang de chaque candidat.
 */

const concoursStore = useConcoursStore();
const { items: concoursList, classement, loading } = storeToRefs(concoursStore);

const concoursId = ref('');

onMounted(() => concoursStore.fetchAll());

watch(concoursId, (id) => concoursStore.fetchClassement(id));

const concours = computed(() => concoursList.value.find((item) => item.id === concoursId.value));

/** @param {any} value */
const moyenne = (value) => {
  const number = Number(value);
  return Number.isNaN(number) ? '—' : number.toFixed(2);
};

const classes = computed(() =>
  [...classement.value].sort((a, b) => Number(a.rang ?? 0) - Number(b.rang ?? 0))
);

const exportRows = computed(() =>
  classes.value.map((candidat) => ({
    Rang: candidat.rang,
    'N° table': candidat.num_table,
    Nom: candidat.nom,
    Prénom: candidat.prenom,
    'Moyenne générale': moyenne(candidat.moyenne_generale),
  }))
);

const { exportToExcel, exportToPdf } = useTableExport({
  rows: exportRows,
  title: 'Classement du concours',
  fileBaseName: 'classement_concours',
  filters: () => [
    { label: 'Concours', value: concours.value?.designation ?? '—' },
    { label: 'Candidats classés', value: classes.value.length },
    { label: "Date d'édition", value: new Date().toLocaleDateString('fr-FR') },
  ],
});

const telechargerAdmis = () => concoursStore.downloadAdmisList(concoursId.value, 'pdf');
</script>

<template>
  <div>
    <PageHeader
      title="Rapports de concours"
      subtitle="Classement des candidats et liste des admis"
      :breadcrumb="['concours', 'rapports']"
    />

    <div class="row">
      <div class="col-md-12 grid-margin stretch-card">
        <div class="card">
          <div class="card-body">
            <div class="row g-3 align-items-end mb-4">
              <div class="col-md-5">
                <label class="form-label fw-bold small">Concours</label>
                <select v-model="concoursId" class="form-select form-select-sm">
                  <option value="">— Sélectionnez un concours —</option>
                  <option v-for="item in concoursList" :key="item.id" :value="item.id">
                    {{ item.designation }} ({{ item.code_annee }})
                  </option>
                </select>
              </div>

              <div class="col-md-7 text-md-end">
                <ExportMenu
                  :disabled="classes.length === 0"
                  @excel="exportToExcel"
                  @pdf="exportToPdf"
                />
                <button
                  class="btn btn-sm btn-outline-danger ms-2"
                  :disabled="!concoursId || loading"
                  @click="telechargerAdmis"
                >
                  <i class="mdi mdi-file-pdf-box me-1"></i> Liste des admis (PDF)
                </button>
              </div>
            </div>

            <LoadingSpinner v-if="loading" />

            <EmptyState
              v-else-if="!concoursId"
              title="Choisissez un concours"
              description="Le classement ne se consulte qu'au sein d'un concours."
            />

            <EmptyState
              v-else-if="classes.length === 0"
              title="Aucun classement"
              description="Ce concours n'a pas encore de classement. Lancez le calcul des moyennes et des rangs depuis l'onglet « Résultats »."
            />

            <div v-else class="table-responsive">
              <table class="table table-hover align-middle mb-0 text-sm">
                <thead class="table-light text-uppercase text-xs text-muted">
                  <tr>
                    <th class="ps-3" style="width: 80px">Rang</th>
                    <th>N° table</th>
                    <th>Candidat</th>
                    <th class="text-center pe-3">Moyenne générale</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="candidat in classes" :key="candidat.candidat_id">
                    <td class="ps-3 fw-bold text-secondary">{{ candidat.rang }}</td>
                    <td>
                      <span class="font-monospace fw-bold text-secondary">
                        {{ candidat.num_table }}
                      </span>
                    </td>
                    <td class="fw-semibold text-dark">{{ candidat.nom }} {{ candidat.prenom }}</td>
                    <td class="text-center pe-3 fw-bold font-monospace">
                      {{ moyenne(candidat.moyenne_generale) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
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
