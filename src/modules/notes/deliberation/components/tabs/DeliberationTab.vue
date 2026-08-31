<script setup>
import { computed, ref } from 'vue';
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
import { useContexteDeliberation } from '../../composables/useContexteDeliberation';

/**
 * Le procès-verbal de délibération : bulletins d'une classe, décision du jury,
 * publication.
 *
 * ## Ce que l'écran d'origine montrait
 *
 * `DeliberationsContent.vue` posait la bonne mise en page — filtres, quatre
 * indicateurs de jury, table du procès-verbal — mais sur des données
 * **entièrement inventées** : `mockClasses = ref(['Master 1 Info', …])`, quatre
 * étudiants codés en dur, une moyenne recalculée en JavaScript sur trois
 * matières fixes (« Vue/Node », « OOP », « Deep L. ») et des seuils
 * éliminatoires écrits dans le composant. « Clôturer le semestre » ouvrait une
 * `alert()`.
 *
 * La mise en page est conservée ; la donnée vient du serveur.
 *
 * ## Ce qui existe réellement
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
 * ⚠️ Les colonnes par matière de la maquette (« Matière 1 », « Matière 2 »…)
 * **n'ont pas d'équivalent ici** : `bulletins_semestriels` porte une synthèse —
 * moyenne, crédits, rang, décision —, pas le détail des évaluations. Ce détail
 * existe, mais par étudiant (`GET /notes/etudiants/:id/notes`) : c'est l'onglet
 * « Bulletins » qui le sert.
 *
 * Le store des bulletins vit dans `modules/examens/bulletin/` : il y sert déjà
 * l'écran des rapports d'examens. On le réutilise plutôt que de le dupliquer.
 * (Dépendance entre modules : notes → examens, notes → structure-academique.)
 *
 * L'export et la publication sont posés ici, et non dans l'en-tête de l'écran :
 * ils ne valent que pour ce contenu-ci, et n'ont pas de sens sur les onglets
 * voisins.
 */

const bulletinStore = useBulletinStore();
const classeStore = useClasseStore();

const { items: bulletins, loading } = storeToRefs(bulletinStore);
const { items: classes } = storeToRefs(classeStore);

const { contexte, complet, charger } = useContexteDeliberation();

const publication = ref(false);

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

/**
 * Les quatre indicateurs du jury, ceux de la maquette — mais calculés sur les
 * bulletins du serveur.
 *
 * `moyenne_generale` arrive en **chaîne** (`"12.50"`, type `NUMERIC` de
 * PostgreSQL) : sans conversion, la somme concatène et la moyenne de promotion
 * est absurde sans lever d'erreur.
 */
const stats = computed(() => {
  const total = classement.value.length;
  if (total === 0) return null;

  const valides = classement.value.filter(
    (bulletin) => decisionInfo(bulletin.decision).code === 'VALIDE'
  ).length;

  const rattrapages = classement.value.filter(
    (bulletin) => decisionInfo(bulletin.decision).code === 'RATTRAPAGE'
  ).length;

  const somme = classement.value.reduce(
    (cumul, bulletin) => cumul + (Number(bulletin.moyenne_generale) || 0),
    0
  );

  // Le major est le premier au rang. Un palmarès non encore classé n'en a pas :
  // on ne désigne alors personne plutôt que de prendre la première ligne venue.
  const major = classement.value.find((bulletin) => Number(bulletin.rang_etudiant) === 1);

  return {
    total,
    valides,
    enAttente: classement.value.filter(
      (bulletin) => decisionInfo(bulletin.decision).code === 'EN_ATTENTE'
    ).length,
    rattrapages,
    taux: ((valides / total) * 100).toFixed(1),
    moyennePromotion: (somme / total).toFixed(2),
    major: major
      ? `${major.nom ?? ''} ${major.prenom ?? ''}`.trim() || major.matricule
      : 'Non classé',
    majorMoyenne: major ? moyenne(major.moyenne_generale) : null,
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
    { label: 'Bulletins', value: stats.value?.total ?? 0 },
    {
      label: 'Validés',
      value: stats.value ? `${stats.value.valides} (${stats.value.taux} %)` : '—',
    },
    { label: "Date d'édition", value: new Date().toLocaleDateString('fr-FR') },
  ],
});
</script>

<template>
  <div class="row">
    <!-- Header de la section -->
    <div class="col-12 mb-4">
      <h3 class="fw-bold mb-1">Délibérations &amp; Jury du Semestre</h3>
      <p class="text-muted small mb-0">
        <i class="bi bi-shield-check me-1"></i>
        Consultez le procès-verbal, arrêtez les décisions du jury et publiez officiellement les
        résultats de la promotion.
      </p>
    </div>

    <!-- Outils de filtrage et d'action du jury -->
    <div class="col-12 mb-4">
      <div class="card border-0 shadow-sm bg-light rounded-4">
        <div class="card-body p-3">
          <BulletinContexte v-model="contexte">
            <template #actions>
              <div class="d-flex gap-2 justify-content-md-end">
                <ExportMenu
                  :disabled="classement.length === 0"
                  @excel="exportToExcel"
                  @pdf="exportToPdf"
                />
                <button
                  class="btn btn-warning btn-sm border-0 shadow-sm text-dark fw-bold px-3"
                  :disabled="classement.length === 0 || loading"
                  @click="publication = true"
                >
                  <i class="bi bi-lock-fill me-1"></i> Publier
                </button>
                <button
                  class="btn btn-white btn-sm border shadow-sm"
                  :disabled="!complet || loading"
                  title="Recharger le procès-verbal"
                  @click="charger"
                >
                  <i class="bi bi-arrow-clockwise"></i>
                </button>
              </div>
            </template>
          </BulletinContexte>
        </div>
      </div>
    </div>

    <!-- Statistiques globales de réussite du jury -->
    <div v-if="stats" class="col-12 mb-4">
      <div class="row g-3">
        <div class="col-md-3">
          <div class="card border-0 shadow-sm p-3 bg-white rounded-4 text-center">
            <span class="text-muted small fw-semibold text-uppercase">Taux d'admission</span>
            <h4 class="fw-bold mt-1 mb-0 text-success">{{ stats.taux }} %</h4>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card border-0 shadow-sm p-3 bg-white rounded-4 text-center">
            <span class="text-muted small fw-semibold text-uppercase">Moyenne de promotion</span>
            <h4 class="fw-bold mt-1 mb-0 text-primary">{{ stats.moyennePromotion }} / 20</h4>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card border-0 shadow-sm p-3 bg-white rounded-4 text-center">
            <span class="text-muted small fw-semibold text-uppercase">Rattrapages</span>
            <h4 class="fw-bold mt-1 mb-0 text-warning">{{ stats.rattrapages }} étudiant(s)</h4>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card border-0 shadow-sm p-3 bg-white rounded-4 text-center">
            <span class="text-muted small fw-semibold text-uppercase">Major de promotion</span>
            <h6 class="fw-bold mt-2 mb-0 text-dark text-truncate" :title="stats.major">
              {{ stats.major }}
              <small v-if="stats.majorMoyenne" class="text-muted">
                ({{ stats.majorMoyenne }}/20)
              </small>
            </h6>
          </div>
        </div>
      </div>
    </div>

    <!-- Tableau du procès-verbal de délibération -->
    <div class="col-12">
      <div class="card border-0 shadow-sm rounded-4 overflow-hidden bg-white">
        <div class="card-header bg-white border-0 pt-4 px-4 pb-2">
          <h5 class="fw-bold text-dark mb-0">
            <i class="bi bi-table text-warning me-2"></i>Procès-verbal de délibération officiel
            <span v-if="stats" class="text-muted fw-normal small ms-2">
              — {{ stats.total }} bulletin(s)
            </span>
          </h5>
        </div>

        <div class="card-body p-0">
          <LoadingSpinner v-if="loading" />

          <EmptyState
            v-else-if="!complet"
            title="Choisissez une classe, un semestre et une année"
            description="Un bulletin appartient au triplet (classe, semestre, année) : le serveur refuse toute requête incomplète."
          />

          <EmptyState
            v-else-if="classement.length === 0"
            title="Aucun bulletin"
            description="Aucun bulletin n'a encore été calculé pour cette promotion. Les bulletins résultent des notes saisies et validées."
          />

          <div v-else class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead class="table-light">
                <tr>
                  <th class="ps-4" style="width: 80px">Rang</th>
                  <th>Étudiant</th>
                  <th class="text-center">Moyenne</th>
                  <th class="text-center">Crédits ECTS</th>
                  <th class="text-center">Mention</th>
                  <th class="text-center">Décision du jury</th>
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
                    <span
                      class="badge rounded-pill fw-bold"
                      :class="
                        Number(bulletin.credits_acquis ?? 0) >=
                        Number(bulletin.credits_totaux_semestre ?? 0)
                          ? 'bg-success-subtle text-success'
                          : 'bg-secondary-subtle text-secondary'
                      "
                    >
                      {{ bulletin.credits_acquis ?? 0 }} /
                      {{ bulletin.credits_totaux_semestre ?? 0 }}
                    </span>
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
        </div>
      </div>
    </div>

    <ConfirmModal
      v-model="publication"
      title="Publier les bulletins"
      message="Les bulletins de cette promotion passeront au statut « Publié » et deviendront consultables par les étudiants."
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

/* Reprend l'identité « flat » de l'écran d'origine : des angles nets plutôt
   que les coins très arrondis de Bootstrap. */
.rounded-4 {
  border-radius: 0.2rem !important;
}

.btn-white {
  background: #ffffff;
  color: #212529;
}
</style>
