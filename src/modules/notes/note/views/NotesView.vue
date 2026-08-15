<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import PageHeader from '@/shared/components/PageHeader.vue';
import EmptyState from '@/shared/components/EmptyState.vue';
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue';
import ExportMenu from '@/shared/components/ExportMenu.vue';
import Pagination from '@/components/shared/Pagination.vue';
import { useTableExport } from '@/shared/composables/useTableExport';
import { usePagination } from '@/shared/composables/usePagination';
import { useNotificationStore } from '@/shared/stores/notificationStore';
import { useSessionStore } from '@/modules/examens/session/store';
import { useEpreuveStore } from '@/modules/examens/epreuve/store';
import { ouvrirEspaceNotes, STATUTS_PUBLIABLES } from '@/modules/espace-notes/constants';
import { useNoteStore } from '../store';
import { statutNoteInfo } from '../../constants';

/**
 * Consultation des notes officielles.
 *
 * ## Cet écran ne saisit plus rien — et c'est le but
 *
 * La saisie, la vérification, la validation et la publication vivent désormais
 * dans l'**espace notes**, une fenêtre à part avec sa propre session et ses
 * propres rôles (`@/modules/espace-notes`). Ici, on consulte, on exporte, on
 * imprime : aucun champ n'est modifiable, et aucune action de flux n'est
 * offerte. Le bouton d'accès ouvre l'espace ; l'entrée y exige une connexion.
 *
 * ## Et il ne montre que ce qui est officiel
 *
 * Seules les notes **validées par la scolarité** (`VALIDEE`) et celles
 * **publiées** (`PUBLIEE`) sont affichées. Une note encore en `SAISIE` est un
 * brouillon : la montrer ici reviendrait à diffuser un résultat que personne
 * n'a contrôlé. Le filtre est appliqué sur la grille servie par le serveur —
 * l'API n'expose pas de filtre par statut, et l'ajouter changerait le contrat
 * d'un endpoint dont l'espace notes, lui, a besoin dans son intégralité.
 *
 * ## Le modèle de données, rappelé
 *
 * Une note appartient à un couple **(étudiant, évaluation)** — une épreuve
 * précise d'une session — et non à un triplet (classe, semestre, type). D'où la
 * cascade session → épreuve.
 */

const noteStore = useNoteStore();
const sessionStore = useSessionStore();
const epreuveStore = useEpreuveStore();
const notifications = useNotificationStore();

const { items: notes, loading, parStatut } = storeToRefs(noteStore);
const { items: sessions } = storeToRefs(sessionStore);
const { items: epreuves } = storeToRefs(epreuveStore);

const sessionId = ref('');
const evaluationId = ref('');

onMounted(async () => {
  await Promise.all([sessionStore.fetchAll(), epreuveStore.fetchAll()]);
});

/** Les épreuves de la session retenue. */
const epreuvesSession = computed(() => {
  if (!sessionId.value) return [];
  return epreuves.value.filter((epreuve) => epreuve.session_id === sessionId.value);
});

// Changer de session invalide l'épreuve retenue : elle appartenait à l'autre.
watch(sessionId, () => {
  evaluationId.value = '';
});

watch(evaluationId, (id) => noteStore.fetchByEvaluation(id));

const epreuve = computed(() => epreuves.value.find((item) => item.id === evaluationId.value));

/** Les seules notes que cet écran a le droit de montrer. */
const notesOfficielles = computed(() =>
  notes.value.filter((note) => STATUTS_PUBLIABLES.includes(String(note.statut ?? '').toUpperCase()))
);

/** Notes existantes mais encore en cours de traitement — comptées, jamais montrées. */
const enAttente = computed(() => parStatut.value.SAISIE);

// Une épreuve porte autant de notes que sa classe compte d'inscrits : la page
// revient à 1 quand on change d'épreuve, la liste n'étant plus la même.
const { page, itemsPerPage, startIndex, paginated } = usePagination(notesOfficielles, {
  perPage: 15,
  resetKey: () => evaluationId.value,
});

const stats = computed(() => {
  const valeurs = notesOfficielles.value
    .map((note) => Number(note.valeur))
    .filter((valeur) => !Number.isNaN(valeur));

  if (valeurs.length === 0) return { moyenne: '—', max: '—', min: '—' };

  return {
    moyenne: (valeurs.reduce((somme, valeur) => somme + valeur, 0) / valeurs.length).toFixed(2),
    max: Math.max(...valeurs).toFixed(2),
    min: Math.min(...valeurs).toFixed(2),
  };
});

const { exportToExcel, exportToPdf } = useTableExport({
  rows: computed(() =>
    notesOfficielles.value.map((note, index) => ({
      'N°': index + 1,
      Matricule: note.matricule,
      Nom: note.nom,
      Prénom: note.prenom,
      Note: note.valeur ?? '—',
      Statut: statutNoteInfo(note.statut).label,
    }))
  ),
  title: 'Notes officielles',
  fileBaseName: 'notes',
  filters: () => [
    { label: 'Épreuve', value: epreuve.value?.designation ?? '—' },
    { label: 'Moyenne', value: stats.value.moyenne },
    { label: 'Notes publiées ou validées', value: notesOfficielles.value.length },
  ],
});

function ouvrirEspace() {
  const fenetre = ouvrirEspaceNotes();

  // `window.open` renvoie `null` quand le navigateur bloque la fenêtre. Le taire
  // laisserait l'utilisateur devant un bouton qui « ne fait rien ».
  if (!fenetre) {
    notifications.notifyWarning(
      'La fenêtre a été bloquée par le navigateur. Autorisez les fenêtres surgissantes pour ce site.'
    );
  }
}
</script>

<template>
  <div>
    <PageHeader
      title="Notes officielles"
      subtitle="Consultation des notes validées et publiées"
      :breadcrumb="['évaluations', 'notes']"
    >
      <template #actions>
        <ExportMenu
          class="me-2"
          :disabled="notesOfficielles.length === 0"
          @excel="exportToExcel"
          @pdf="exportToPdf"
        />
        <button class="btn btn-primary mt-2 mt-xl-0" type="button" @click="ouvrirEspace">
          <i class="bi bi-box-arrow-up-right me-1"></i>
          Ouvrir l'espace de gestion des notes
        </button>
      </template>
    </PageHeader>

    <div class="row">
      <div class="col-md-12 grid-margin stretch-card">
        <div class="card">
          <div class="card-body">
            <div class="alert alert-light border d-flex align-items-start gap-2 small">
              <i class="bi bi-lock text-secondary mt-1"></i>
              <div>
                <strong>Consultation seule.</strong>
                Cet écran n'affiche que les notes validées par la scolarité, puis publiées. La
                saisie, la vérification, la validation et la publication se font dans l'espace de
                gestion des notes, qui s'ouvre dans une fenêtre dédiée et demande une connexion.
              </div>
            </div>

            <div class="row g-3 align-items-end mb-4">
              <div class="col-md-5">
                <label for="notes-session" class="form-label fw-bold small">
                  Session d'évaluation
                </label>
                <select id="notes-session" v-model="sessionId" class="form-select form-select-sm">
                  <option value="">— Sélectionnez une session —</option>
                  <option v-for="session in sessions" :key="session.id" :value="session.id">
                    {{ session.code }} — {{ session.designation }}
                  </option>
                </select>
              </div>

              <div class="col-md-5">
                <label for="notes-epreuve" class="form-label fw-bold small">Épreuve</label>
                <select
                  id="notes-epreuve"
                  v-model="evaluationId"
                  class="form-select form-select-sm"
                  :disabled="!sessionId"
                >
                  <option value="">— Sélectionnez une épreuve —</option>
                  <option v-for="item in epreuvesSession" :key="item.id" :value="item.id">
                    {{ item.code_module }} — {{ item.designation }}
                  </option>
                </select>
                <div
                  v-if="sessionId && epreuvesSession.length === 0"
                  class="form-text text-warning"
                >
                  Aucune épreuve n'est définie pour cette session.
                </div>
              </div>
            </div>

            <LoadingSpinner v-if="loading" />

            <EmptyState
              v-else-if="!evaluationId"
              title="Choisissez une épreuve"
              description="Les notes appartiennent à une épreuve précise, pas à une classe : sélectionnez une session, puis son épreuve."
            />

            <EmptyState
              v-else-if="notesOfficielles.length === 0 && enAttente > 0"
              title="Notes en cours de traitement"
              :description="`${enAttente} note(s) sont saisies mais pas encore validées par la scolarité : elles ne sont pas consultables ici.`"
            />

            <EmptyState
              v-else-if="notesOfficielles.length === 0"
              title="Aucune note officielle"
              description="Aucune note validée ni publiée pour cette épreuve."
            />

            <div v-else>
              <div class="row g-3 mb-4">
                <div class="col-md-4">
                  <div class="card border-0 shadow-sm p-3 text-center">
                    <span class="text-muted small fw-semibold text-uppercase">Moyenne</span>
                    <h4 class="fw-bold mt-1 mb-0 text-primary">{{ stats.moyenne }} / 20</h4>
                  </div>
                </div>
                <div class="col-md-4">
                  <div class="card border-0 shadow-sm p-3 text-center">
                    <span class="text-muted small fw-semibold text-uppercase">Meilleure note</span>
                    <h4 class="fw-bold mt-1 mb-0 text-success">{{ stats.max }} / 20</h4>
                  </div>
                </div>
                <div class="col-md-4">
                  <div class="card border-0 shadow-sm p-3 text-center">
                    <span class="text-muted small fw-semibold text-uppercase">
                      Note la plus basse
                    </span>
                    <h4 class="fw-bold mt-1 mb-0 text-danger">{{ stats.min }} / 20</h4>
                  </div>
                </div>
              </div>

              <p v-if="enAttente > 0" class="text-muted small">
                <i class="bi bi-hourglass-split me-1"></i>
                {{ enAttente }} note(s) de cette épreuve sont encore en saisie et n'apparaissent pas
                ci-dessous.
              </p>

              <div class="table-responsive">
                <table class="table table-hover align-middle mb-0">
                  <thead class="table-light">
                    <tr>
                      <th class="ps-4" style="width: 60px">#</th>
                      <th>Matricule</th>
                      <th>Étudiant</th>
                      <th style="width: 140px">Note / 20</th>
                      <th class="text-center">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(note, index) in paginated" :key="note.note_id">
                      <td class="ps-4 text-muted small">{{ startIndex + index + 1 }}</td>

                      <td class="ps-4">
                        <span class="badge bg-light text-dark border font-monospace">
                          {{ note.matricule }}
                        </span>
                      </td>

                      <td class="fw-semibold text-dark">{{ note.nom }} {{ note.prenom }}</td>

                      <td class="font-monospace fw-bold">{{ note.valeur ?? '—' }}</td>

                      <td class="text-center">
                        <span
                          class="badge rounded-pill px-3 py-2"
                          :class="`bg-${statutNoteInfo(note.statut).variant}-subtle text-${statutNoteInfo(note.statut).variant}`"
                        >
                          {{ statutNoteInfo(note.statut).label }}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <Pagination
                v-model="page"
                v-model:items-per-page="itemsPerPage"
                :total-items="notesOfficielles.length"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
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
