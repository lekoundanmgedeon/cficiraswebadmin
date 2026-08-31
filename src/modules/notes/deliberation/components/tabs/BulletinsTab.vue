<script setup>
import { computed, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import EmptyState from '@/shared/components/EmptyState.vue';
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue';
import ExportMenu from '@/shared/components/ExportMenu.vue';
import Pagination from '@/components/shared/Pagination.vue';
import { useTableExport } from '@/shared/composables/useTableExport';
import { usePagination } from '@/shared/composables/usePagination';
import { identiteEtablissement } from '@/shared/utils/parametres';
import { formatDate } from '@/shared/utils/date';
import { useAnneeStore } from '@/modules/structure-academique/annee/store';
import { useSemestreStore } from '@/modules/structure-academique/semestre/store';
import { useClasseStore } from '@/modules/structure-academique/classe/store';
import { useBulletinStore } from '@/modules/examens/bulletin/store';
import BulletinContexte from '@/modules/examens/bulletin/components/BulletinContexte.vue';
import {
  decisionInfo,
  mentionLabel,
  publicationInfo,
} from '@/modules/examens/bulletin/constants';
import { useNoteStore } from '../../../note/store';
import { statutNoteInfo } from '../../../constants';
import { useContexteDeliberation } from '../../composables/useContexteDeliberation';

/**
 * Les bulletins individuels : la liste de la promotion à gauche, le relevé
 * officiel de l'étudiant retenu à droite.
 *
 * ## Ce que l'écran d'origine montrait
 *
 * `ProclamationContent.vue` posait ce gabarit — liste, document, en-tête
 * institutionnel, blocs d'UE, synthèse, signatures — sur **quatre étudiants
 * codés en dur** et deux unités d'enseignement inventées
 * (« UE-INF-1 : Génie Logiciel », « UE-DATA-2 : Data Science »), avec un
 * établissement gravé dans le template. Le bouton d'export produisait une
 * `alert()` décrivant un ZIP qui n'existait pas.
 *
 * Le gabarit est conservé ; tout ce qu'il affiche vient désormais du serveur.
 *
 * ## Deux appels, et pourquoi deux
 *
 * `bulletins_semestriels` porte la **synthèse** — moyenne générale, crédits,
 * rang, effectif, mention, décision. Elle ne porte pas le détail des
 * évaluations : celui-ci se lit par étudiant.
 *
 * ```
 * GET /resultats/classes/:classeId/bulletins?semestreId&anneeId   ← la promotion
 * GET /notes/etudiants/:etudiantId/notes?semestreId               ← le relevé
 * ```
 *
 * Le second n'est appelé qu'à la **sélection d'un étudiant**, jamais pour toute
 * la promotion : une classe de cent étudiants ferait cent requêtes pour un seul
 * document affiché.
 *
 * ## Rien n'est recalculé
 *
 * La maquette recalculait la moyenne en JavaScript à partir de coefficients
 * écrits dans le composant. Ici, `moyenne_generale`, `credits_acquis`, le rang
 * et la mention viennent tels quels de `calculer_bulletins_semestriels` : deux
 * calculs concurrents finiraient par diverger, et c'est le serveur qui fait foi
 * — c'est lui que l'étudiant verra.
 *
 * ## Ce qui a été retiré
 *
 * - Le sélecteur « Relevé de notes / Attestation de réussite » : **aucune route
 *   ne délivre d'attestation**. Les attestations passent par le guichet des
 *   documents administratifs (`/documents`), qui les numérote et les suit.
 * - Le téléchargement groupé « PDF ZIP » : le serveur n'expose rien de tel. Le
 *   relevé affiché s'exporte, lui, pour de vrai.
 */

const bulletinStore = useBulletinStore();
const noteStore = useNoteStore();
const anneeStore = useAnneeStore();
const semestreStore = useSemestreStore();
const classeStore = useClasseStore();

const { items: bulletins, loading } = storeToRefs(bulletinStore);
const { notesEtudiant, loading: chargementNotes } = storeToRefs(noteStore);
const { items: annees } = storeToRefs(anneeStore);
const { items: semestres } = storeToRefs(semestreStore);
const { items: classes } = storeToRefs(classeStore);

const { contexte, complet } = useContexteDeliberation();

/** L'étudiant dont le relevé est à l'écran. */
const actif = ref(null);

const promotion = computed(() =>
  [...bulletins.value].sort((a, b) => Number(a.rang_etudiant ?? 0) - Number(b.rang_etudiant ?? 0))
);

// La liste latérale peut compter l'effectif entier d'une classe : elle se
// pagine comme les autres, et revient en tête au changement de contexte.
const { page, itemsPerPage, paginated } = usePagination(promotion, {
  perPage: 12,
  resetKey: () => [contexte.value.anneeId, contexte.value.semestreId, contexte.value.classeId],
});

const classe = computed(() => classes.value.find((item) => item.id === contexte.value.classeId));
const annee = computed(() => annees.value.find((item) => item.id === contexte.value.anneeId));
const semestre = computed(() =>
  semestres.value.find((item) => item.id === contexte.value.semestreId)
);

const etablissement = computed(() => identiteEtablissement());

/**
 * La sélection suit la promotion : changer de contexte remplace la liste, et un
 * étudiant retenu qui n'en fait plus partie laisserait à l'écran le relevé
 * d'une autre classe.
 */
watch(promotion, (liste) => {
  const encorePresent =
    actif.value && liste.some((bulletin) => bulletin.id === actif.value?.id) ? actif.value : null;

  actif.value = encorePresent ?? liste[0] ?? null;
});

watch(
  [actif, () => contexte.value.semestreId],
  ([bulletin, semestreId]) => {
    // L'action porte la garde : un identifiant manquant vide le relevé plutôt
    // que d'envoyer une requête que le serveur refuserait.
    noteStore.fetchByEtudiant(bulletin?.etudiant_id, semestreId);
  },
  { immediate: true }
);

/** @param {any} bulletin */
const selectionner = (bulletin) => {
  actif.value = bulletin;
};

/** @param {any} value */
const moyenne = (value) => {
  const number = Number(value);
  return Number.isNaN(number) ? '—' : number.toFixed(2);
};

/** @param {any} value */
const nombre = (value) => Number(value ?? 0) || 0;

/**
 * Le relevé, groupé par matière — l'équivalent réel des « blocs d'UE » de la
 * maquette. Une matière peut porter plusieurs évaluations (contrôle continu,
 * examen, projet) : elles apparaissent sous elle.
 */
const releve = computed(() => {
  const parMatiere = new Map();

  for (const note of notesEtudiant.value) {
    const cle = note.matiere_designation ?? 'Matière non renseignée';
    if (!parMatiere.has(cle)) {
      parMatiere.set(cle, { matiere: cle, credit: nombre(note.credit), lignes: [] });
    }
    parMatiere.get(cle).lignes.push(note);
  }

  return [...parMatiere.values()];
});

const nomComplet = computed(() =>
  actif.value ? `${actif.value.nom ?? ''} ${actif.value.prenom ?? ''}`.trim() : ''
);

const exportRows = computed(() =>
  notesEtudiant.value.map((note) => ({
    Matière: note.matiere_designation ?? '—',
    Évaluation: note.evaluation_designation ?? '—',
    Type: note.type_eval ?? '—',
    'Note /20': note.valeur ?? '—',
    'Pondération': note.ponderation ?? '—',
    Crédits: note.credit ?? '—',
    Statut: statutNoteInfo(note.statut).label,
  }))
);

const { exportToExcel, exportToPdf } = useTableExport({
  rows: exportRows,
  title: 'Relevé de notes',
  fileBaseName: 'releve-notes',
  filters: () => [
    { label: 'Étudiant', value: nomComplet.value || '—' },
    { label: 'Matricule', value: actif.value?.matricule ?? '—' },
    { label: 'Classe', value: classe.value?.code ?? '—' },
    { label: 'Année', value: annee.value?.code ?? '—' },
    { label: 'Semestre', value: semestre.value?.code ?? '—' },
    { label: 'Moyenne générale', value: `${moyenne(actif.value?.moyenne_generale)} / 20` },
    { label: 'Décision', value: decisionInfo(actif.value?.decision).label },
  ],
});

const imprimer = () => window.print();
</script>

<template>
  <div class="row">
    <!-- Header de la section -->
    <div class="col-12 mb-4">
      <h3 class="fw-bold mb-1">Bulletins &amp; Documents Officiels</h3>
      <p class="text-muted small mb-0">
        <i class="bi bi-file-earmark-pdf-fill me-1"></i>
        Consultez et exportez les relevés de notes semestriels de la promotion, tels que le jury les
        a arrêtés.
      </p>
    </div>

    <!-- Sélecteur de promotion et actions -->
    <div class="col-12 mb-4">
      <div class="card border-0 shadow-sm bg-light rounded-4">
        <div class="card-body p-3">
          <BulletinContexte v-model="contexte">
            <template #actions>
              <div class="d-flex gap-2 justify-content-md-end">
                <ExportMenu
                  :disabled="!actif || notesEtudiant.length === 0"
                  @excel="exportToExcel"
                  @pdf="exportToPdf"
                />
                <button
                  class="btn btn-white btn-sm border shadow-sm"
                  :disabled="!actif"
                  title="Imprimer le relevé affiché"
                  @click="imprimer"
                >
                  <i class="bi bi-printer-fill"></i>
                </button>
              </div>
            </template>
          </BulletinContexte>
        </div>
      </div>
    </div>

    <div v-if="loading" class="col-12">
      <LoadingSpinner />
    </div>

    <div v-else-if="!complet" class="col-12">
      <EmptyState
        title="Choisissez une classe, un semestre et une année"
        description="Un bulletin appartient au triplet (classe, semestre, année) : le serveur refuse toute requête incomplète."
      />
    </div>

    <div v-else-if="promotion.length === 0" class="col-12">
      <EmptyState
        title="Aucun bulletin"
        description="Aucun bulletin n'a encore été calculé pour cette promotion."
      />
    </div>

    <template v-else>
      <!-- Liste des étudiants de la promotion -->
      <div class="col-md-4 mb-4">
        <div class="card border-0 shadow-sm rounded-4 bg-white overflow-hidden">
          <div class="card-header bg-white border-0 pt-3 px-3 pb-2">
            <h6 class="fw-bold text-muted small text-uppercase mb-0">
              Étudiants de la promotion
              <span class="text-secondary">({{ promotion.length }})</span>
            </h6>
          </div>

          <div class="list-group list-group-flush">
            <button
              v-for="bulletin in paginated"
              :key="bulletin.id"
              type="button"
              class="list-group-item list-group-item-action border-0 px-3 py-2 d-flex justify-content-between align-items-center text-start"
              :class="actif?.id === bulletin.id ? 'bg-primary-subtle fw-bold text-primary' : ''"
              @click="selectionner(bulletin)"
            >
              <div>
                <span class="d-block text-dark">
                  {{ bulletin.nom ?? '—' }} {{ bulletin.prenom ?? '' }}
                </span>
                <small class="text-muted font-monospace" style="font-size: 11px">
                  {{ bulletin.matricule ?? '' }}
                </small>
              </div>
              <span
                class="badge rounded-pill"
                :class="`bg-${decisionInfo(bulletin.decision).variant}-subtle text-${decisionInfo(bulletin.decision).variant}`"
              >
                {{ moyenne(bulletin.moyenne_generale) }}
              </span>
            </button>
          </div>

          <Pagination
            v-model="page"
            v-model:items-per-page="itemsPerPage"
            :total-items="promotion.length"
          />
        </div>
      </div>

      <!-- Relevé officiel de l'étudiant retenu -->
      <div v-if="actif" class="col-md-8 mb-4">
        <div class="card border-0 shadow-sm rounded-4 bg-white p-4">
          <div class="document-print-area p-2 text-dark">
            <!-- Entête institutionnelle -->
            <div class="row border-bottom pb-3 mb-4 text-uppercase text-center text-md-start">
              <div class="col-md-8">
                <h5 class="fw-bold mb-0">{{ etablissement.nom || 'Établissement' }}</h5>
                <small v-if="etablissement.adresse" class="text-muted text-xs">
                  {{ etablissement.adresse }}
                </small>
              </div>
              <div class="col-md-4 text-md-end mt-2 mt-md-0">
                <div class="fw-bold border p-2 text-center text-xs bg-light">Relevé de notes</div>
              </div>
            </div>

            <!-- Métadonnées étudiant et période -->
            <div class="row g-2 small mb-4 bg-light p-3 rounded">
              <div class="col-sm-6">
                <div><strong>Nom &amp; prénom :</strong> {{ nomComplet || '—' }}</div>
                <div><strong>Matricule :</strong> {{ actif.matricule ?? '—' }}</div>
                <div><strong>Inscrit en :</strong> {{ classe?.code ?? '—' }}</div>
              </div>
              <div class="col-sm-6 text-sm-end">
                <div><strong>Année académique :</strong> {{ annee?.code ?? '—' }}</div>
                <div><strong>Période :</strong> {{ semestre?.code ?? '—' }}</div>
                <div>
                  <strong>Publication :</strong>
                  {{ publicationInfo(actif.statut_publication).label }}
                </div>
              </div>
            </div>

            <!-- Détail des évaluations, groupé par matière -->
            <LoadingSpinner v-if="chargementNotes" size="sm" />

            <div v-else-if="releve.length === 0" class="alert alert-light border small mb-4">
              Aucune note n'est enregistrée pour cet étudiant sur ce semestre. La synthèse ci-dessous
              reste celle du bulletin calculé.
            </div>

            <div v-else class="table-responsive mb-4">
              <table class="table table-bordered table-sm align-middle text-xs text-center">
                <thead class="table-secondary">
                  <tr>
                    <th class="text-start ps-2" style="width: 45%">Matières &amp; évaluations</th>
                    <th style="width: 13%">Note /20</th>
                    <th style="width: 13%">Pondération</th>
                    <th style="width: 13%">Crédits</th>
                    <th style="width: 16%">Résultat</th>
                  </tr>
                </thead>

                <tbody>
                  <template v-for="bloc in releve" :key="bloc.matiere">
                    <tr class="fw-bold table-light text-start">
                      <td colspan="4" class="ps-2 text-primary">{{ bloc.matiere }}</td>
                      <td class="fw-bold">{{ bloc.credit || '—' }} ECTS</td>
                    </tr>
                    <tr v-for="ligne in bloc.lignes" :key="ligne.note_id">
                      <td class="text-start ps-3 text-muted">
                        {{ ligne.evaluation_designation ?? '—' }}
                        <span class="badge bg-light text-secondary ms-1">
                          {{ ligne.type_eval ?? '—' }}
                        </span>
                      </td>
                      <td class="fw-bold">{{ ligne.valeur ?? '—' }}</td>
                      <td>{{ ligne.ponderation ?? '—' }}</td>
                      <td>{{ ligne.credit ?? '—' }}</td>
                      <td>
                        <span
                          v-if="ligne.valeur !== null && ligne.valeur !== ''"
                          class="fw-bold"
                          :class="Number(ligne.valeur) >= 10 ? 'text-success' : 'text-danger'"
                        >
                          {{ Number(ligne.valeur) >= 10 ? 'V' : 'NV' }}
                        </span>
                        <span v-else class="text-muted">—</span>
                      </td>
                    </tr>
                  </template>
                </tbody>
              </table>
            </div>

            <!-- Synthèse et décision du jury -->
            <div class="row g-3 align-items-center small pt-2 border-top">
              <div class="col-md-7">
                <table class="table table-sm table-borderless mb-0 bg-light rounded text-xs">
                  <tbody>
                    <tr>
                      <td class="fw-bold ps-2">Moyenne générale pondérée :</td>
                      <td class="fw-bold text-primary">
                        {{ moyenne(actif.moyenne_generale) }} / 20
                      </td>
                    </tr>
                    <tr>
                      <td class="fw-bold ps-2">Crédits capitalisés :</td>
                      <td class="fw-bold text-success">
                        {{ nombre(actif.credits_acquis) }} /
                        {{ nombre(actif.credits_totaux_semestre) }} ECTS
                      </td>
                    </tr>
                    <tr>
                      <td class="fw-bold ps-2">Rang :</td>
                      <td class="fw-bold text-dark">
                        {{ actif.rang_etudiant ?? '—' }}
                        <span v-if="actif.effectif_classe" class="text-muted fw-normal">
                          sur {{ actif.effectif_classe }}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td class="fw-bold ps-2">Mention :</td>
                      <td class="fw-bold text-dark">{{ mentionLabel(actif.mention) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div class="col-md-5 text-md-end">
                <div class="small fw-bold mb-1 text-muted text-uppercase">Décision du jury</div>
                <span
                  class="badge p-2 fw-bold border text-uppercase"
                  :class="`border-${decisionInfo(actif.decision).variant} text-${decisionInfo(actif.decision).variant} bg-${decisionInfo(actif.decision).variant}-subtle`"
                >
                  {{ decisionInfo(actif.decision).label }}
                </span>
              </div>
            </div>

            <!-- Pied de page -->
            <div class="row mt-5 pt-4 text-center text-xs text-muted">
              <div class="col-6">
                Édité le {{ formatDate(new Date()) }}
              </div>
              <div class="col-6 fw-bold text-dark text-decoration-underline">
                Le Directeur des Études
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.text-xs {
  font-size: 11px !important;
}

/* Typographie resserrée, imitant un document officiel. */
.document-print-area {
  background: #fff;
  line-height: 1.5;
}

.table-bordered th,
.table-bordered td {
  border: 1px solid #dee2e6 !important;
}

/* Identité « flat » de l'écran d'origine : des angles nets. */
.rounded-4 {
  border-radius: 0.2rem !important;
}

.btn-white {
  background: #ffffff;
  color: #212529;
}

.list-group-item {
  cursor: pointer;
  font-size: 0.85rem;
  border-bottom: 1px solid #f8f9fa !important;
}

.list-group-item:hover {
  background-color: #f8f9fa;
}
</style>
