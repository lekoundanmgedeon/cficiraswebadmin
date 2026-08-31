<script setup>
import { computed, ref } from 'vue';
import { storeToRefs } from 'pinia';
import EmptyState from '@/shared/components/EmptyState.vue';
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue';
import { useTableExport } from '@/shared/composables/useTableExport';
import { formatDateTime } from '@/shared/utils/date';
import { useAnneeStore } from '@/modules/structure-academique/annee/store';
import { useSemestreStore } from '@/modules/structure-academique/semestre/store';
import { useClasseStore } from '@/modules/structure-academique/classe/store';
import { useBulletinStore } from '@/modules/examens/bulletin/store';
import BulletinContexte from '@/modules/examens/bulletin/components/BulletinContexte.vue';
import {
  DECISION_LIST,
  MENTIONS,
  decisionInfo,
  mentionLabel,
  publicationInfo,
} from '@/modules/examens/bulletin/constants';
import { useContexteDeliberation } from '../../composables/useContexteDeliberation';

/**
 * Les livrables de la session : documents officiels, statistiques, et l'état
 * réel de publication de la promotion.
 *
 * ## Ce que l'écran d'origine montrait
 *
 * `RapportContents.vue` alignait neuf boutons de génération — PV global, PV par
 * matière en ZIP, registre des admis, analyse des taux, bilan des échecs,
 * tableau d'honneur — dont **aucun ne produisait de fichier** : tous appelaient
 * la même fonction, qui affichait une `alert()` décrivant l'extraction. La
 * table « Historique récent des publications » listait trois entrées
 * (`mockLogs`) inventées, marquées « Scellé & Archivé », avec un bouton
 * « Récupérer » qui écrivait dans la console.
 *
 * `RapportsTab.vue`, l'autre composant d'onglet du même écran, était quant à lui
 * **vide** (`<template></template>`) : son onglet ne rendait rien.
 *
 * ## Ce qui subsiste, et pourquoi
 *
 * Trois des six documents ont un équivalent réel, parce qu'ils se dérivent des
 * bulletins déjà chargés : le procès-verbal, le registre des admis et le tableau
 * d'honneur. Ils s'exportent ici pour de vrai, en Excel comme en PDF.
 *
 * Les trois autres ont été retirés plutôt que maquillés :
 *
 * - **PV par matière (ZIP)** — il faudrait le relevé de chaque étudiant, soit un
 *   appel par étudiant, et aucune route ne rend les notes d'une classe entière.
 * - **Bilan des notes éliminatoires** — même obstacle : la notion de note
 *   éliminatoire n'existe d'ailleurs que dans `maquette_pedagogique`, que le
 *   calcul des bulletins n'utilise pas.
 * - **Historique des publications** — aucun journal d'édition de documents
 *   n'existe côté serveur. Ce que la base sait vraiment, c'est **où en est la
 *   publication** de chaque bulletin (`statut_publication`, `date_publication`) :
 *   c'est cela qui est affiché, à la place d'une archive imaginaire.
 *
 * ## Les statistiques ne viennent pas de `/resultats/statistiques`
 *
 * Cet endpoint existe et sert l'écran `Statistiques` — mais il agrège **tous**
 * les bulletins d'un périmètre, avec ses propres filtres. Ici, le périmètre est
 * déjà celui du triplet retenu, et ses bulletins sont **déjà en mémoire** :
 * refaire un appel réseau pour recompter les mêmes lignes n'apporterait rien, et
 * introduirait une dépendance `notes → stats` sans autre justification.
 */

const bulletinStore = useBulletinStore();
const anneeStore = useAnneeStore();
const semestreStore = useSemestreStore();
const classeStore = useClasseStore();

const { items: bulletins, loading } = storeToRefs(bulletinStore);
const { items: annees } = storeToRefs(anneeStore);
const { items: semestres } = storeToRefs(semestreStore);
const { items: classes } = storeToRefs(classeStore);

const { contexte, complet, charger } = useContexteDeliberation();

/** Le nombre de majors retenus au tableau d'honneur. */
const HONNEUR = 10;

const classe = computed(() => classes.value.find((item) => item.id === contexte.value.classeId));
const annee = computed(() => annees.value.find((item) => item.id === contexte.value.anneeId));
const semestre = computed(() =>
  semestres.value.find((item) => item.id === contexte.value.semestreId)
);

const classement = computed(() =>
  [...bulletins.value].sort((a, b) => Number(a.rang_etudiant ?? 0) - Number(b.rang_etudiant ?? 0))
);

/** @param {any} value */
const moyenne = (value) => {
  const number = Number(value);
  return Number.isNaN(number) ? '—' : number.toFixed(2);
};

const admis = computed(() =>
  classement.value.filter((bulletin) => decisionInfo(bulletin.decision).code === 'VALIDE')
);

const honneur = computed(() =>
  classement.value.filter((bulletin) => Number(bulletin.rang_etudiant) > 0).slice(0, HONNEUR)
);

/** Répartition des décisions, dans l'ordre du référentiel. */
const parDecision = computed(() =>
  DECISION_LIST.map((decision) => {
    const effectif = classement.value.filter(
      (bulletin) => decisionInfo(bulletin.decision).code === decision.code
    ).length;

    return {
      ...decision,
      effectif,
      part: classement.value.length ? (effectif / classement.value.length) * 100 : 0,
    };
  })
);

/**
 * Répartition des mentions.
 *
 * `mention` est **nullable** en base : un bulletin sans mention n'est pas une
 * anomalie, c'est le cas de tout étudiant non admis. On le compte à part plutôt
 * que de le ranger sous « Passable ».
 */
const parMention = computed(() => {
  const lignes = Object.values(MENTIONS).map((mention) => ({
    code: mention.code,
    label: mention.label,
    effectif: classement.value.filter((bulletin) => bulletin.mention === mention.code).length,
  }));

  const sansMention = classement.value.filter((bulletin) => !bulletin.mention).length;
  if (sansMention > 0) {
    lignes.push({ code: 'AUCUNE', label: 'Sans mention', effectif: sansMention });
  }

  return lignes.filter((ligne) => ligne.effectif > 0);
});

/** L'état de publication, tel que la base le porte. */
const publication = computed(() => {
  if (classement.value.length === 0) return null;

  const publies = classement.value.filter(
    (bulletin) => publicationInfo(bulletin.statut_publication).code === 'PUBLIE'
  );

  const verrouilles = classement.value.filter(
    (bulletin) => publicationInfo(bulletin.statut_publication).code === 'VERROUILLE'
  );

  // La date de publication est la même pour toute la classe — la publication est
  // un geste d'ensemble —, mais on prend la plus récente plutôt que la première
  // venue : un bulletin ajouté après coup décalerait la lecture.
  const dates = classement.value
    .map((bulletin) => bulletin.date_publication)
    .filter(Boolean)
    .sort();

  return {
    total: classement.value.length,
    publies: publies.length,
    verrouilles: verrouilles.length,
    brouillons: classement.value.length - publies.length - verrouilles.length,
    derniere: dates.at(-1) ?? null,
  };
});

/** Métadonnées reprises en tête de chaque document exporté. */
const entete = () => [
  { label: 'Classe', value: classe.value?.code ?? '—' },
  { label: 'Année académique', value: annee.value?.code ?? '—' },
  { label: 'Semestre', value: semestre.value?.code ?? '—' },
  { label: 'Effectif', value: classement.value.length },
  { label: "Date d'édition", value: new Date().toLocaleDateString('fr-FR') },
];

/** @param {any[]} bulletinsExportes */
const lignesPalmares = (bulletinsExportes) =>
  bulletinsExportes.map((bulletin) => ({
    Rang: bulletin.rang_etudiant ?? '—',
    Matricule: bulletin.matricule ?? '—',
    Nom: bulletin.nom ?? '—',
    Prénom: bulletin.prenom ?? '—',
    Moyenne: moyenne(bulletin.moyenne_generale),
    Crédits: `${bulletin.credits_acquis ?? 0} / ${bulletin.credits_totaux_semestre ?? 0}`,
    Mention: mentionLabel(bulletin.mention),
    Décision: decisionInfo(bulletin.decision).label,
  }));

// Un jeu d'export par document : `useTableExport` porte le logo, l'en-tête de
// l'établissement, la dérivation des colonnes depuis les lignes et
// l'avertissement quand il n'y a rien à exporter. Trois instances valent mieux
// qu'une fonction d'export réécrite ici.
const exportPv = useTableExport({
  rows: computed(() => lignesPalmares(classement.value)),
  title: 'Procès-verbal de délibération',
  fileBaseName: 'proces-verbal',
  filters: entete,
});

const exportAdmis = useTableExport({
  rows: computed(() => lignesPalmares(admis.value)),
  title: 'Registre des étudiants admis',
  fileBaseName: 'registre-admis',
  filters: entete,
});

const exportHonneur = useTableExport({
  rows: computed(() => lignesPalmares(honneur.value)),
  title: "Tableau d'honneur",
  fileBaseName: 'tableau-honneur',
  filters: entete,
});

const documents = computed(() => [
  {
    cle: 'pv',
    icone: 'bi-file-earmark-pdf',
    titre: 'Procès-verbal de délibération',
    description: 'Le palmarès complet, avec décisions du jury et mentions.',
    disponible: classement.value.length > 0,
    export: exportPv,
  },
  {
    cle: 'admis',
    icone: 'bi-file-earmark-excel',
    titre: 'Registre des étudiants admis',
    description: `Les seuls bulletins dont le jury a arrêté « Validé » (${admis.value.length}).`,
    disponible: admis.value.length > 0,
    export: exportAdmis,
  },
  {
    cle: 'honneur',
    icone: 'bi-award',
    titre: "Tableau d'honneur",
    description: `Les ${HONNEUR} premiers au rang de la promotion.`,
    disponible: honneur.value.length > 0,
    export: exportHonneur,
  },
]);

/** Onglet de statistiques déplié. */
const detail = ref('decisions');
</script>

<template>
  <div class="row">
    <!-- Header de la section -->
    <div class="col-12 mb-4">
      <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
        <div>
          <h3 class="fw-bold mb-1">
            <i class="bi bi-file-earmark-bar-graph text-primary me-2"></i>Rapports &amp;
            Procès-Verbaux
          </h3>
          <p class="text-muted small mb-0">
            Livrables de la session et indicateurs de réussite de la promotion retenue.
          </p>
        </div>
        <button
          class="btn btn-sm btn-outline-primary rounded-pill px-3"
          :disabled="!complet || loading"
          @click="charger"
        >
          <i class="bi bi-arrow-clockwise me-1"></i> Actualiser
        </button>
      </div>
    </div>

    <!-- Périmètre -->
    <div class="col-12 mb-4">
      <div class="card border-0 shadow-sm bg-light rounded-4">
        <div class="card-body p-3">
          <BulletinContexte v-model="contexte" />
        </div>
      </div>
    </div>

    <div v-if="loading" class="col-12">
      <LoadingSpinner />
    </div>

    <div v-else-if="!complet" class="col-12">
      <EmptyState
        title="Choisissez une classe, un semestre et une année"
        description="Les livrables portent sur une promotion précise : le triplet (classe, semestre, année) est la condition d'une requête valide."
      />
    </div>

    <div v-else-if="classement.length === 0" class="col-12">
      <EmptyState
        title="Aucun bulletin à éditer"
        description="Aucun bulletin n'a encore été calculé pour cette promotion : il n'y a rien à rapporter."
      />
    </div>

    <template v-else>
      <!-- Documents officiels -->
      <div class="col-lg-6 mb-4">
        <div class="card border-0 shadow-sm rounded-4 h-100 bg-white">
          <div class="card-header bg-white border-0 pt-4 px-4 pb-2">
            <h5 class="fw-bold text-dark mb-0">
              <i class="bi bi-shield-check text-success me-2"></i>Documents officiels
            </h5>
            <p class="text-muted small mb-0">
              Édités depuis les bulletins arrêtés par le jury, prêts pour signature.
            </p>
          </div>

          <div class="card-body px-4">
            <div class="list-group list-group-flush">
              <div
                v-for="document in documents"
                :key="document.cle"
                class="list-group-item px-0 py-3 d-flex justify-content-between align-items-center"
              >
                <div class="d-flex align-items-center">
                  <div class="bg-success bg-opacity-10 text-success p-2 rounded-3 me-3">
                    <i class="bi fs-4" :class="document.icone"></i>
                  </div>
                  <div>
                    <h6 class="fw-bold text-dark mb-0">{{ document.titre }}</h6>
                    <small class="text-muted">{{ document.description }}</small>
                  </div>
                </div>

                <div class="btn-group flex-shrink-0 ms-2">
                  <button
                    class="btn btn-sm btn-light border"
                    :disabled="!document.disponible"
                    @click="document.export.exportToPdf()"
                  >
                    <i class="bi bi-download me-1"></i> PDF
                  </button>
                  <button
                    class="btn btn-sm btn-light border"
                    :disabled="!document.disponible"
                    @click="document.export.exportToExcel()"
                  >
                    <i class="bi bi-download me-1"></i> Excel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Statistiques de session -->
      <div class="col-lg-6 mb-4">
        <div class="card border-0 shadow-sm rounded-4 h-100 bg-white">
          <div class="card-header bg-white border-0 pt-4 px-4 pb-2">
            <h5 class="fw-bold text-dark mb-0">
              <i class="bi bi-graph-up-arrow text-primary me-2"></i>Statistiques de session
            </h5>
            <p class="text-muted small mb-0">
              Calculées sur les {{ classement.length }} bulletins de la promotion.
            </p>
          </div>

          <div class="card-body px-4">
            <ul class="nav nav-pills nav-pills-sm mb-3 gap-2">
              <li class="nav-item">
                <button
                  class="nav-link btn-sm px-3"
                  :class="detail === 'decisions' ? 'active' : 'text-secondary'"
                  @click="detail = 'decisions'"
                >
                  Décisions du jury
                </button>
              </li>
              <li class="nav-item">
                <button
                  class="nav-link btn-sm px-3"
                  :class="detail === 'mentions' ? 'active' : 'text-secondary'"
                  @click="detail = 'mentions'"
                >
                  Mentions
                </button>
              </li>
            </ul>

            <div v-if="detail === 'decisions'">
              <div v-for="ligne in parDecision" :key="ligne.code" class="mb-3">
                <div class="d-flex justify-content-between small mb-1">
                  <span class="fw-semibold text-dark">{{ ligne.label }}</span>
                  <span class="text-muted">
                    {{ ligne.effectif }} — {{ ligne.part.toFixed(1) }} %
                  </span>
                </div>
                <div class="progress" style="height: 8px">
                  <div
                    class="progress-bar"
                    :class="`bg-${ligne.variant}`"
                    role="progressbar"
                    :style="{ width: `${ligne.part}%` }"
                    :aria-valuenow="ligne.effectif"
                    aria-valuemin="0"
                    :aria-valuemax="classement.length"
                  ></div>
                </div>
              </div>
            </div>

            <div v-else>
              <table class="table table-sm align-middle mb-0">
                <tbody>
                  <tr v-for="ligne in parMention" :key="ligne.code">
                    <td class="ps-0 small fw-semibold text-dark">{{ ligne.label }}</td>
                    <td class="text-end pe-0 small text-muted">
                      {{ ligne.effectif }} étudiant(s)
                    </td>
                  </tr>
                </tbody>
              </table>
              <p v-if="parMention.length === 0" class="text-muted small mb-0">
                Aucune mention n'a encore été attribuée sur cette promotion.
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- État de publication -->
      <div v-if="publication" class="col-12">
        <div class="card border-0 shadow-sm rounded-4 bg-white">
          <div class="card-header bg-white border-0 pt-4 px-4 pb-2">
            <h5 class="fw-bold text-dark mb-0">
              <i class="bi bi-clock-history text-secondary me-2"></i>État de publication
            </h5>
            <p class="text-muted small mb-0">
              Ce que la base porte réellement — il n'existe pas de journal d'édition des documents.
            </p>
          </div>

          <div class="card-body px-4 pb-4">
            <div class="row g-3">
              <div class="col-md-3">
                <div class="border rounded-4 p-3 text-center">
                  <span class="text-muted small fw-semibold text-uppercase">Bulletins</span>
                  <h4 class="fw-bold mt-1 mb-0 text-dark">{{ publication.total }}</h4>
                </div>
              </div>
              <div class="col-md-3">
                <div class="border rounded-4 p-3 text-center">
                  <span class="text-muted small fw-semibold text-uppercase">Publiés</span>
                  <h4 class="fw-bold mt-1 mb-0 text-success">{{ publication.publies }}</h4>
                </div>
              </div>
              <div class="col-md-3">
                <div class="border rounded-4 p-3 text-center">
                  <span class="text-muted small fw-semibold text-uppercase">Brouillons</span>
                  <h4 class="fw-bold mt-1 mb-0 text-secondary">{{ publication.brouillons }}</h4>
                </div>
              </div>
              <div class="col-md-3">
                <div class="border rounded-4 p-3 text-center">
                  <span class="text-muted small fw-semibold text-uppercase">Verrouillés</span>
                  <h4 class="fw-bold mt-1 mb-0 text-dark">{{ publication.verrouilles }}</h4>
                </div>
              </div>
            </div>

            <p class="text-muted small mb-0 mt-3">
              <template v-if="publication.derniere">
                Dernière publication le {{ formatDateTime(publication.derniere) }}.
              </template>
              <template v-else>
                Cette promotion n'a pas encore été publiée : ses bulletins ne sont pas consultables
                par les étudiants.
              </template>
            </p>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.list-group-item {
  transition: background-color 0.2s ease-in-out;
  border-bottom: 1px solid #f1f3f5;
}

.list-group-item:last-child {
  border-bottom: 0;
}

.list-group-item:hover {
  background-color: var(--bs-light);
}

/* Identité « flat » de l'écran d'origine : des angles nets. */
.rounded-4 {
  border-radius: 0.2rem !important;
}

.nav-pills .nav-link {
  font-size: 0.8rem;
  border-radius: 0.2rem;
}
</style>
