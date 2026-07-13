<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import PageHeader from '@/shared/components/PageHeader.vue';
import EmptyState from '@/shared/components/EmptyState.vue';
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue';
import ExportMenu from '@/shared/components/ExportMenu.vue';
import ConfirmModal from '@/shared/components/ConfirmModal.vue';
import { useTableExport } from '@/shared/composables/useTableExport';
import { useNotificationStore } from '@/shared/stores/notificationStore';
import { useSessionStore } from '@/modules/examens/session/store';
import { useEpreuveStore } from '@/modules/examens/epreuve/store';
import { useNoteStore } from '../store';
import { NOTE_BORNES, statutNoteInfo } from '../../constants';

/**
 * Saisie des notes d'une évaluation.
 *
 * ## L'écran précédent n'enregistrait rien
 *
 * `Notes.vue` servait **quatre étudiants codés en dur** (« Ndiaye Fatou »,
 * « Camara Ibrahima »…) et trois matières inventées. Son bouton « Valider le PV »
 * appelait :
 *
 * ```js
 * const saveAllNotes = () => { alert(`Validation du PV pour la classe […]`); };
 * ```
 *
 * Un `alert()`. Rien n'était envoyé nulle part.
 *
 * ## Et le modèle de données était faux
 *
 * L'URL était `/notes/:classeId/:semestre/:type/edit` : une note aurait donc
 * appartenu à un triplet (classe, semestre, type d'évaluation). **Ce n'est pas
 * le modèle du serveur** : une note appartient à un couple **(étudiant,
 * évaluation)** — une *épreuve* précise d'une *session*. D'où la cascade
 * session → épreuve ci-dessous, qui reflète, elle, la réalité.
 *
 * ## Une note ne se crée pas
 *
 * Il n'existe **pas de `POST /notes`** : les notes préexistent (une ligne par
 * couple étudiant / évaluation) et l'écran ne fait que les corriger. Un étudiant
 * sans ligne de note n'apparaît donc pas dans la grille.
 */

const noteStore = useNoteStore();
const sessionStore = useSessionStore();
const epreuveStore = useEpreuveStore();
const notifications = useNotificationStore();

const { items: notes, loading, moyenne, estPubliee } = storeToRefs(noteStore);
const { items: sessions } = storeToRefs(sessionStore);
const { items: epreuves } = storeToRefs(epreuveStore);

const sessionId = ref('');
const evaluationId = ref('');
const publication = ref(false);
const saving = ref(false);

/** Valeurs saisies, indexées par identifiant de note. */
const brouillon = ref({});

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

watch(evaluationId, (id) => {
  brouillon.value = {};
  noteStore.fetchByEvaluation(id);
});

// La grille du serveur fait foi : toute relecture réinitialise le brouillon.
watch(notes, (rows) => {
  brouillon.value = Object.fromEntries(
    rows.map((note) => [note.note_id, note.valeur === null ? '' : String(note.valeur)])
  );
});

const epreuve = computed(() => epreuves.value.find((item) => item.id === evaluationId.value));

/** @param {any} note @returns {string|null} */
function erreurDe(note) {
  const brut = brouillon.value[note.note_id];
  if (brut === '' || brut === undefined) return null;

  const valeur = Number(brut);
  if (Number.isNaN(valeur) || valeur < NOTE_BORNES.MIN || valeur > NOTE_BORNES.MAX) {
    return `La note doit être comprise entre ${NOTE_BORNES.MIN} et ${NOTE_BORNES.MAX}.`;
  }
  return null;
}

/** Notes dont la valeur diffère de celle du serveur. */
const modifiees = computed(() =>
  notes.value.filter((note) => {
    const brut = brouillon.value[note.note_id];
    if (brut === undefined || brut === '') return false;
    return Number(brut) !== Number(note.valeur);
  })
);

const enErreur = computed(() => notes.value.some((note) => erreurDe(note) !== null));

const stats = computed(() => {
  const valeurs = notes.value
    .map((note) => Number(brouillon.value[note.note_id]))
    .filter((v) => !Number.isNaN(v) && brouillon.value !== '');

  if (valeurs.length === 0) return { moyenne: '—', max: '—', min: '—' };

  return {
    moyenne: (valeurs.reduce((s, v) => s + v, 0) / valeurs.length).toFixed(2),
    max: Math.max(...valeurs).toFixed(2),
    min: Math.min(...valeurs).toFixed(2),
  };
});

async function enregistrer() {
  if (enErreur.value) {
    notifications.notifyError('Corrigez les notes invalides avant d’enregistrer.');
    return;
  }

  if (modifiees.value.length === 0) {
    notifications.notifyInfo('Aucune modification à enregistrer.');
    return;
  }

  saving.value = true;

  // On compte les vrais succès : `run()` renvoie `undefined` en cas d'échec.
  // L'écran précédent se contentait d'un `alert()` de succès, quoi qu'il arrive.
  let succes = 0;

  for (const note of modifiees.value) {
    const result = await noteStore.update(note.note_id, {
      valeur: Number(brouillon.value[note.note_id]),
      commentaire: note.commentaire ?? null,
    });

    if (result !== undefined) succes += 1;
  }

  saving.value = false;

  const echecs = modifiees.value.length - succes;

  if (echecs === 0) {
    notifications.notifySuccess(`${succes} note(s) enregistrée(s).`);
  } else {
    notifications.notifyWarning(`${succes} note(s) enregistrée(s), ${echecs} en échec.`);
  }

  await noteStore.fetchByEvaluation(evaluationId.value);
}

async function publier() {
  const result = await noteStore.publier();
  if (result !== undefined) publication.value = false;
}

const exportRows = computed(() =>
  notes.value.map((note, index) => ({
    'N°': index + 1,
    Matricule: note.matricule,
    Nom: note.nom,
    Prénom: note.prenom,
    Note: note.valeur ?? '—',
    Statut: statutNoteInfo(note.statut).label,
  }))
);

const { exportToExcel, exportToPdf } = useTableExport({
  rows: exportRows,
  title: 'Grille de notes',
  fileBaseName: 'notes',
  filters: () => [
    { label: 'Épreuve', value: epreuve.value?.designation ?? '—' },
    { label: 'Moyenne', value: moyenne.value?.toFixed(2) ?? '—' },
    { label: 'Notes', value: notes.value.length },
  ],
});
</script>

<template>
  <div>
    <PageHeader
      title="Saisie des notes"
      subtitle="Notes d'une épreuve, session par session"
      :breadcrumb="['évaluations', 'notes']"
    >
      <template #actions>
        <ExportMenu :disabled="notes.length === 0" @excel="exportToExcel" @pdf="exportToPdf" />
      </template>
    </PageHeader>

    <div class="row">
      <div class="col-md-12 grid-margin stretch-card">
        <div class="card">
          <div class="card-body">
            <div class="row g-3 align-items-end mb-4">
              <div class="col-md-4">
                <label class="form-label fw-bold small">Session d'évaluation</label>
                <select v-model="sessionId" class="form-select form-select-sm">
                  <option value="">— Sélectionnez une session —</option>
                  <option v-for="session in sessions" :key="session.id" :value="session.id">
                    {{ session.code }} — {{ session.designation }}
                  </option>
                </select>
              </div>

              <div class="col-md-5">
                <label class="form-label fw-bold small">Épreuve</label>
                <select
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

              <div class="col-md-3 text-md-end">
                <button
                  class="btn btn-sm btn-primary px-3 me-2"
                  :disabled="saving || modifiees.length === 0 || enErreur"
                  @click="enregistrer"
                >
                  <span
                    v-if="saving"
                    class="spinner-border spinner-border-sm me-1"
                    aria-hidden="true"
                  ></span>
                  {{ saving ? 'Enregistrement...' : 'Enregistrer' }}
                </button>

                <button
                  class="btn btn-sm btn-success px-3"
                  :disabled="loading || notes.length === 0 || estPubliee"
                  @click="publication = true"
                >
                  <i class="bi bi-megaphone me-1"></i> Publier
                </button>
              </div>
            </div>

            <LoadingSpinner v-if="loading" />

            <EmptyState
              v-else-if="!evaluationId"
              title="Choisissez une épreuve"
              description="Les notes appartiennent à une épreuve précise, pas à une classe : sélectionnez une session, puis son épreuve."
            />

            <EmptyState
              v-else-if="notes.length === 0"
              title="Aucune note"
              description="Aucune ligne de note n'existe pour cette épreuve. Les notes sont créées avec l'évaluation ; l'application ne peut que les corriger."
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
                    <span class="text-muted small fw-semibold text-uppercase"
                      >Note la plus basse</span
                    >
                    <h4 class="fw-bold mt-1 mb-0 text-danger">{{ stats.min }} / 20</h4>
                  </div>
                </div>
              </div>

              <div v-if="modifiees.length > 0" class="alert alert-warning py-2 small">
                <i class="bi bi-exclamation-triangle-fill me-1"></i>
                {{ modifiees.length }} note(s) modifiée(s) et non enregistrée(s).
              </div>

              <div class="table-responsive">
                <table class="table table-hover align-middle mb-0">
                  <thead class="table-light">
                    <tr>
                      <th class="ps-4">Matricule</th>
                      <th>Étudiant</th>
                      <th style="width: 160px">Note / 20</th>
                      <th class="text-center">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="note in notes" :key="note.note_id">
                      <td class="ps-4">
                        <span class="badge bg-light text-dark border font-monospace">
                          {{ note.matricule }}
                        </span>
                      </td>

                      <td class="fw-semibold text-dark">{{ note.nom }} {{ note.prenom }}</td>

                      <td>
                        <input
                          v-model="brouillon[note.note_id]"
                          type="number"
                          class="form-control form-control-sm font-monospace"
                          :class="{ 'is-invalid': erreurDe(note) }"
                          :min="NOTE_BORNES.MIN"
                          :max="NOTE_BORNES.MAX"
                          step="0.25"
                        />
                        <div v-if="erreurDe(note)" class="invalid-feedback d-block small">
                          {{ erreurDe(note) }}
                        </div>
                      </td>

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
            </div>
          </div>
        </div>
      </div>
    </div>

    <ConfirmModal
      v-model="publication"
      title="Publier les notes"
      message="Toutes les notes de cette épreuve passeront au statut « Publiée » et deviendront visibles."
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
