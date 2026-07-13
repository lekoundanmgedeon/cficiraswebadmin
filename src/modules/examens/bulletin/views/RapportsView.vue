<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import EmptyState from '@/shared/components/EmptyState.vue';
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue';
import ExportMenu from '@/shared/components/ExportMenu.vue';
import { useTableExport } from '@/shared/composables/useTableExport';
import { useClasseStore } from '@/modules/structure-academique/classe/store';
import ExamenHeader from '../../components/ExamenHeader.vue';
import { useBulletinStore } from '../store';

/**
 * Rapports d'examens : le palmarès d'une classe.
 *
 * `RapportExamens.vue` affichait — dans un « rapport d'examens » — une liste de
 * **formateurs** codés en dur (« John Doe », « Anna Smith »), servie après un
 * `setTimeout(3000)`. Rien à voir avec des résultats d'examen, et aucun appel
 * API.
 *
 * Les bulletins viennent de `GET /resultats/classes/:classeId/bulletins`. Cet
 * endpoint, son store (`resultStore.js`) et les trois autres routes de résultats
 * existaient déjà : **aucune vue ne les appelait**.
 *
 * ⚠️ Les bulletins ne se listent qu'**au sein d'une classe** — d'où le sélecteur
 * en tête d'écran. Il n'existe pas d'endpoint « tous les bulletins ».
 */

const bulletinStore = useBulletinStore();
const classeStore = useClasseStore();

const { items: bulletins, loading } = storeToRefs(bulletinStore);
const { items: classes } = storeToRefs(classeStore);

const classeId = ref('');

onMounted(() => classeStore.fetchAll());

watch(classeId, (id) => bulletinStore.fetchByClasse(id));

const classe = computed(() => classes.value.find((item) => item.id === classeId.value));

/** Classé par moyenne décroissante : c'est un palmarès. */
const classement = computed(() =>
  [...bulletins.value].sort((a, b) => Number(b.moyenne ?? 0) - Number(a.moyenne ?? 0))
);

/** @param {any} value */
const moyenne = (value) => {
  const number = Number(value);
  return Number.isNaN(number) ? '—' : number.toFixed(2);
};

const exportRows = computed(() =>
  classement.value.map((bulletin, index) => ({
    Rang: index + 1,
    Matricule: bulletin.matricule ?? '—',
    Nom: bulletin.nom ?? '—',
    Prénom: bulletin.prenom ?? '—',
    Moyenne: moyenne(bulletin.moyenne),
    Décision: bulletin.decision ?? 'En attente',
    Statut: bulletin.publie ? 'Publié' : 'Non publié',
  }))
);

const { exportToExcel, exportToPdf } = useTableExport({
  rows: exportRows,
  title: 'Palmarès de la classe',
  fileBaseName: 'palmares',
  filters: () => [
    { label: 'Classe', value: classe.value?.code ?? '—' },
    { label: 'Bulletins', value: classement.value.length },
    { label: "Date d'édition", value: new Date().toLocaleDateString('fr-FR') },
  ],
});

const refresh = () => bulletinStore.fetchByClasse(classeId.value);

const publier = () => bulletinStore.publier();
</script>

<template>
  <div>
    <ExamenHeader
      title="Rapports & résultats"
      subtitle="Palmarès et publication des bulletins, par classe."
      breadcrumb="Rapports"
      :refresh="classeId ? refresh : null"
    />

    <div class="row">
      <div class="col-md-12 grid-margin stretch-card">
        <div class="card">
          <div class="card-body">
            <div class="row g-3 align-items-end mb-4">
              <div class="col-md-5">
                <label class="form-label text-xs fw-semibold text-muted mb-1">Classe</label>
                <select v-model="classeId" class="form-select form-select-sm">
                  <option value="">— Sélectionnez une classe —</option>
                  <option v-for="item in classes" :key="item.id" :value="item.id">
                    {{ item.code }} — {{ item.filiere_nom }}
                  </option>
                </select>
              </div>

              <div class="col-md-7 text-md-end">
                <ExportMenu
                  :disabled="classement.length === 0"
                  @excel="exportToExcel"
                  @pdf="exportToPdf"
                />
                <button
                  class="btn btn-success btn-sm px-3 ms-2"
                  :disabled="classement.length === 0 || loading"
                  @click="publier"
                >
                  <i class="bi bi-megaphone me-1"></i> Publier les bulletins
                </button>
              </div>
            </div>

            <LoadingSpinner v-if="loading" />

            <EmptyState
              v-else-if="!classeId"
              title="Choisissez une classe"
              description="Les bulletins ne se consultent qu'au sein d'une classe."
            />

            <EmptyState
              v-else-if="classement.length === 0"
              title="Aucun bulletin"
              description="Aucun bulletin n'a encore été généré pour cette classe. Les bulletins résultent des notes saisies."
            />

            <div v-else class="table-responsive">
              <table class="table table-hover align-middle mb-0 text-sm">
                <thead class="table-light text-secondary text-uppercase text-xs">
                  <tr>
                    <th class="ps-4" style="width: 80px">Rang</th>
                    <th>Étudiant</th>
                    <th class="text-center">Moyenne</th>
                    <th class="text-center">Décision</th>
                    <th class="text-center pe-4">Publication</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(bulletin, index) in classement" :key="bulletin.id">
                    <td class="ps-4 fw-bold text-secondary">{{ index + 1 }}</td>
                    <td>
                      <div class="fw-bold text-dark">
                        {{ bulletin.nom ?? '—' }} {{ bulletin.prenom ?? '' }}
                      </div>
                      <small class="text-muted font-monospace text-xs">
                        {{ bulletin.matricule ?? '' }}
                      </small>
                    </td>
                    <td class="text-center fw-bold">{{ moyenne(bulletin.moyenne) }}</td>
                    <td class="text-center">
                      <span class="badge bg-light text-dark border">
                        {{ bulletin.decision ?? 'En attente' }}
                      </span>
                    </td>
                    <td class="text-center pe-4">
                      <span
                        class="badge"
                        :class="
                          bulletin.publie
                            ? 'bg-success-subtle text-success'
                            : 'bg-secondary-subtle text-secondary'
                        "
                      >
                        {{ bulletin.publie ? 'Publié' : 'Non publié' }}
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
  </div>
</template>

<style scoped>
.text-xs {
  font-size: 11px;
}
.text-sm {
  font-size: 0.875rem;
}
</style>
