<script setup>
import { computed, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import EmptyState from '@/shared/components/EmptyState.vue';
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue';
import ExportMenu from '@/shared/components/ExportMenu.vue';
import ConfirmModal from '@/shared/components/ConfirmModal.vue';
import ItemActions from '@/shared/components/ItemActions.vue';
import Pagination from '@/components/shared/Pagination.vue';
import { useTableExport } from '@/shared/composables/useTableExport';
import { usePagination } from '@/shared/composables/usePagination';
import { useClasseStore } from '@/modules/structure-academique/classe/store';
import { useBulletinStore } from '@/modules/examens/bulletin/store';
import BulletinContexte from '@/modules/examens/bulletin/components/BulletinContexte.vue';
import {
  DECISION_LIST,
  decisionInfo,
  mentionLabel,
  publicationInfo,
} from '@/modules/examens/bulletin/constants';

/**
 * Le procès-verbal de délibération : bulletins d'une classe, décision du jury,
 * publication.
 *
 * ## Les quatre écrans précédents étaient simulés, sans exception
 *
 * `DeliberationsContent`, `ProclamationContent`, `RapportContents` et
 * `AssistantIAContent` servaient tous des `ref([...])` codés en dur — jusqu'à
 * `mockClasses = ref(['Master 1 Info', 'Master 2 Info', 'Licence 3 Management'])`.
 * `RapportsTab.vue` était par ailleurs **vide** (`<template></template>`) : son
 * onglet ne rendait rien.
 *
 * ## Ce qui existe réellement
 *
 * Les quatre routes de résultats étaient là depuis toujours, ainsi que leur
 * store (`resultStore.js`) : **aucune vue ne les appelait**.
 *
 * ```
 * GET   /resultats/classes/:classeId/bulletins?semestreId&anneeId
 * PUT   /resultats/bulletins/:id/decision
 * PATCH /resultats/classes/:classeId/bulletins/publier
 * ```
 *
 * ⚠️ Un bulletin appartient au triplet **(classe, semestre, année)** — il
 * n'existe pas d'endpoint « tous les bulletins », et une requête à laquelle
 * manque le semestre ou l'année reçoit un `400`. D'où les trois sélecteurs.
 *
 * Le store des bulletins vit dans `modules/examens/bulletin/` : il y sert déjà
 * l'écran des rapports d'examens. On le réutilise plutôt que de le dupliquer.
 * (Dépendance entre modules : notes → examens, notes → structure-academique.)
 *
 * L'export et la publication sont posés ici, et non dans l'en-tête de l'écran :
 * ils ne valent que pour ce contenu-ci, et n'ont plus de sens sur l'onglet
 * voisin de l'assistant.
 */

const bulletinStore = useBulletinStore();
const classeStore = useClasseStore();

const { items: bulletins, loading } = storeToRefs(bulletinStore);
const { items: classes } = storeToRefs(classeStore);

const contexte = ref({ anneeId: '', semestreId: '', classeId: '' });
const publication = ref(false);

const complet = computed(() =>
  Boolean(contexte.value.anneeId && contexte.value.semestreId && contexte.value.classeId)
);

watch(
  contexte,
  () =>
    bulletinStore.fetchByClasse(
      contexte.value.classeId,
      contexte.value.semestreId,
      contexte.value.anneeId
    ),
  { deep: true }
);

const classe = computed(() => classes.value.find((item) => item.id === contexte.value.classeId));

/** Palmarès : par rang, tel que le serveur le calcule. */
const classement = computed(() =>
  [...bulletins.value].sort((a, b) => Number(a.rang_etudiant ?? 0) - Number(b.rang_etudiant ?? 0))
);

// Le palmarès d'une classe tient sur plusieurs dizaines de lignes ; on revient
// en première page dès que le contexte (année, semestre, classe) change.
const { page, itemsPerPage, paginated } = usePagination(classement, {
  perPage: 15,
  resetKey: () => [contexte.value.anneeId, contexte.value.semestreId, contexte.value.classeId],
});

/** @param {any} value */
const moyenne = (value) => {
  const number = Number(value);
  return Number.isNaN(number) ? '—' : number.toFixed(2);
};

const stats = computed(() => {
  const total = classement.value.length;
  const valides = classement.value.filter(
    (bulletin) => decisionInfo(bulletin.decision).code === 'VALIDE'
  ).length;

  return {
    total,
    valides,
    enAttente: classement.value.filter(
      (bulletin) => decisionInfo(bulletin.decision).code === 'EN_ATTENTE'
    ).length,
    taux: total > 0 ? ((valides / total) * 100).toFixed(1) : '0.0',
  };
});

/** @param {any} bulletin */
function actionsFor(bulletin) {
  const decision = decisionInfo(bulletin.decision).code;

  return DECISION_LIST.filter((cible) => cible.code !== decision).map((cible) => ({
    key: `decision:${cible.code}`,
    label: `Décider « ${cible.label} »`,
    icon: 'mdi-gavel',
    confirm: {
      title: 'Décision du jury',
      message: `Enregistrer la décision « ${cible.label} » pour ce bulletin ?`,
      confirmLabel: 'Enregistrer',
      variant: cible.variant,
    },
  }));
}

/** @param {{key: string, item: any}} event */
function onAction({ key, item }) {
  if (!key.startsWith('decision:')) return;

  bulletinStore.setDecision(item.id, { decision: key.slice('decision:'.length) });
}

async function publier() {
  const result = await bulletinStore.publier();
  if (result !== undefined) publication.value = false;
}

const exportRows = computed(() =>
  classement.value.map((bulletin) => ({
    Rang: bulletin.rang_etudiant ?? '—',
    Matricule: bulletin.matricule ?? '—',
    Nom: bulletin.nom ?? '—',
    Prénom: bulletin.prenom ?? '—',
    Moyenne: moyenne(bulletin.moyenne_generale),
    Crédits: `${bulletin.credits_acquis ?? 0} / ${bulletin.credits_totaux_semestre ?? 0}`,
    Mention: mentionLabel(bulletin.mention),
    Décision: decisionInfo(bulletin.decision).label,
    Publication: publicationInfo(bulletin.statut_publication).label,
  }))
);

const { exportToExcel, exportToPdf } = useTableExport({
  rows: exportRows,
  title: 'Procès-verbal de délibération',
  fileBaseName: 'deliberation',
  filters: () => [
    { label: 'Classe', value: classe.value?.code ?? '—' },
    { label: 'Bulletins', value: stats.value.total },
    { label: 'Validés', value: `${stats.value.valides} (${stats.value.taux} %)` },
    { label: "Date d'édition", value: new Date().toLocaleDateString('fr-FR') },
  ],
});
</script>

<template>
  <div>
    <BulletinContexte v-model="contexte">
      <template #actions>
        <div class="text-md-end">
          <ExportMenu
            :disabled="classement.length === 0"
            @excel="exportToExcel"
            @pdf="exportToPdf"
          />
          <button
            class="btn btn-success btn-sm px-3 ms-2"
            :disabled="classement.length === 0 || loading"
            @click="publication = true"
          >
            <i class="bi bi-megaphone me-1"></i> Publier
          </button>
        </div>
      </template>
    </BulletinContexte>

    <div v-if="classement.length > 0" class="row g-3 mb-4">
      <div class="col-md-3">
        <div class="card border-0 shadow-sm p-3 text-center">
          <span class="text-muted small fw-semibold text-uppercase">Bulletins</span>
          <h4 class="fw-bold mt-1 mb-0 text-dark">{{ stats.total }}</h4>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card border-0 shadow-sm p-3 text-center">
          <span class="text-muted small fw-semibold text-uppercase">Validés</span>
          <h4 class="fw-bold mt-1 mb-0 text-success">{{ stats.valides }}</h4>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card border-0 shadow-sm p-3 text-center">
          <span class="text-muted small fw-semibold text-uppercase">En attente</span>
          <h4 class="fw-bold mt-1 mb-0 text-warning">{{ stats.enAttente }}</h4>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card border-0 shadow-sm p-3 text-center">
          <span class="text-muted small fw-semibold text-uppercase">Taux de réussite</span>
          <h4 class="fw-bold mt-1 mb-0 text-primary">{{ stats.taux }} %</h4>
        </div>
      </div>
    </div>

    <LoadingSpinner v-if="loading" />

    <EmptyState
      v-else-if="!complet"
      title="Choisissez une classe, un semestre et une année"
      description="Un bulletin appartient au triplet (classe, semestre, année) : le serveur refuse toute requête incomplète."
    />

    <EmptyState
      v-else-if="classement.length === 0"
      title="Aucun bulletin"
      description="Aucun bulletin n'a encore été généré pour cette classe. Les bulletins résultent des notes saisies et publiées."
    />

    <div v-else class="table-responsive">
      <table class="table table-hover align-middle mb-0">
        <thead class="table-light">
          <tr>
            <th class="ps-4" style="width: 80px">Rang</th>
            <th>Étudiant</th>
            <th class="text-center">Moyenne</th>
            <th class="text-center">Crédits</th>
            <th class="text-center">Mention</th>
            <th class="text-center">Décision</th>
            <th class="text-center">Publication</th>
            <th class="text-end pe-4">Actions</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="bulletin in paginated" :key="bulletin.id">
            <td class="ps-4 fw-bold text-secondary">{{ bulletin.rang_etudiant ?? '—' }}</td>

            <td>
              <div class="fw-semibold text-dark">
                {{ bulletin.nom ?? '—' }} {{ bulletin.prenom ?? '' }}
              </div>
              <small class="text-muted font-monospace">{{ bulletin.matricule ?? '' }}</small>
            </td>

            <td class="text-center fw-bold font-monospace">
              {{ moyenne(bulletin.moyenne_generale) }}
            </td>

            <td class="text-center small">
              {{ bulletin.credits_acquis ?? 0 }} /
              {{ bulletin.credits_totaux_semestre ?? 0 }}
            </td>

            <td class="text-center small">{{ mentionLabel(bulletin.mention) }}</td>

            <td class="text-center">
              <span
                class="badge rounded-pill px-3 py-2"
                :class="`bg-${decisionInfo(bulletin.decision).variant}-subtle text-${decisionInfo(bulletin.decision).variant}`"
              >
                {{ decisionInfo(bulletin.decision).label }}
              </span>
            </td>

            <td class="text-center">
              <span
                class="badge rounded-pill px-3 py-2"
                :class="`bg-${publicationInfo(bulletin.statut_publication).variant}-subtle text-${publicationInfo(bulletin.statut_publication).variant}`"
              >
                {{ publicationInfo(bulletin.statut_publication).label }}
              </span>
            </td>

            <td class="text-end pe-4">
              <ItemActions
                :item="bulletin"
                :label="`${bulletin.nom ?? ''} ${bulletin.prenom ?? ''}`.trim()"
                :actions="actionsFor(bulletin)"
                :loading="loading"
                @action="onAction"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <Pagination
      v-if="classement.length"
      v-model="page"
      v-model:items-per-page="itemsPerPage"
      :total-items="classement.length"
    />

    <ConfirmModal
      v-model="publication"
      title="Publier les bulletins"
      message="Les bulletins de cette classe passeront au statut « Publié » et deviendront consultables par les étudiants."
      confirm-label="Publier"
      variant="success"
      :loading="loading"
      @confirm="publier"
    />
  </div>
</template>

<style scoped>
.table thead th {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: #6c757d;
  border: none;
}
</style>
