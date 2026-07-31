<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import EmptyState from '@/shared/components/EmptyState.vue';
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue';
import ExportMenu from '@/shared/components/ExportMenu.vue';
import { useTableExport } from '@/shared/composables/useTableExport';
import { useNotificationStore } from '@/shared/stores/notificationStore';
import { useAuthStore } from '@/core/auth/authStore';
import { useNoteStore } from '@/modules/notes/note/store';
import { NOTE_BORNES, statutNoteInfo } from '@/modules/notes/constants';
import { typeEpreuveLabel } from '@/modules/examens/constants';
import { useEspaceNotesStore } from '../store';
import { peut } from '../constants';
import BandeauEtapes from '../components/BandeauEtapes.vue';

/**
 * Grille de notes d'une évaluation : saisie, contrôle, validation, publication.
 *
 * ## Trois faits du modèle de données commandent tout cet écran
 *
 * 1. **Une note appartient à un couple (étudiant, évaluation)** — jamais à un
 *    triplet (classe, semestre, type). La cascade est donc classe → session →
 *    évaluation, et non l'inverse.
 *
 * 2. **La grille du serveur ne contient que les étudiants déjà notés.**
 *    `GET …/evaluations/:id/notes` lit la table `notes` : au premier
 *    remplissage, elle est vide. L'effectif affiché vient de la classe
 *    (`GET /classes/:id/etudiants`), et la saisie en lot crée les lignes
 *    manquantes — par **matricule**, comme le veut `importer_notes_batch`.
 *
 * 3. **Corriger une note la ramène en `SAISIE`.** Le serveur le fait sur `PUT`
 *    comme sur la saisie en lot : une valeur corrigée ne conserve pas la
 *    validation obtenue par la précédente. L'écran l'annonce avant l'envoi.
 */

const espace = useEspaceNotesStore();
const noteStore = useNoteStore();
const auth = useAuthStore();
const notifications = useNotificationStore();

const { classes, etudiants, loading: chargementContexte } = storeToRefs(espace);
const { items: notes, loading: chargementNotes, statutGlobal, parStatut } = storeToRefs(noteStore);

/** Valeurs saisies, indexées par matricule — la clé qu'attend le serveur. */
const brouillon = ref({});
const enregistrement = ref(false);

const role = computed(() => auth.user?.role ?? null);
const peutSaisir = computed(() => peut(role.value, 'saisir'));
const peutValider = computed(() => peut(role.value, 'valider'));
const peutRenvoyer = computed(() => peut(role.value, 'renvoyer'));
const peutPublier = computed(() => peut(role.value, 'publier'));

/** Une grille publiée ne se modifie plus, quel que soit le rôle. */
const editable = computed(
  () => peutSaisir.value && espace.evaluationId !== '' && statutGlobal.value !== 'PUBLIEE'
);

onMounted(async () => {
  await Promise.all([espace.fetchContexte(), auth.fetchCurrentUser()]);
});

watch(
  () => espace.evaluationId,
  (id) => {
    brouillon.value = {};
    noteStore.fetchByEvaluation(id);
  }
);

/**
 * L'effectif de la classe, augmenté de la note de chacun.
 *
 * Les deux sources sont rapprochées par matricule : la classe donne *qui doit
 * être noté*, la grille *ce qui l'a été*.
 */
const lignes = computed(() => {
  const parMatricule = new Map(
    notes.value.map((note) => [String(note.matricule ?? '').toUpperCase(), note])
  );

  const inscrits = etudiants.value.map((etudiant) => {
    const matricule = String(etudiant.matricule ?? '').toUpperCase();
    const note = parMatricule.get(matricule);
    parMatricule.delete(matricule);

    return {
      matricule: etudiant.matricule,
      nom: etudiant.nom,
      prenom: etudiant.prenom,
      valeurServeur: note?.valeur ?? null,
      statut: note?.statut ?? null,
      commentaire: note?.commentaire ?? '',
      horsClasse: false,
    };
  });

  // Une note dont le matricule n'est plus dans l'effectif : réinscription,
  // changement de classe… On l'affiche plutôt que de la faire disparaître.
  const orphelines = [...parMatricule.values()].map((note) => ({
    matricule: note.matricule,
    nom: note.nom,
    prenom: note.prenom,
    valeurServeur: note.valeur ?? null,
    statut: note.statut ?? null,
    commentaire: note.commentaire ?? '',
    horsClasse: true,
  }));

  return [...inscrits, ...orphelines];
});

/** @param {any} ligne */
const valeurCourante = (ligne) => {
  const brut = brouillon.value[ligne.matricule];
  if (brut !== undefined) return brut;
  return ligne.valeurServeur === null ? '' : String(ligne.valeurServeur);
};

/** @param {any} ligne @returns {string|null} */
function erreurDe(ligne) {
  const brut = valeurCourante(ligne);
  if (brut === '') return null;

  const valeur = Number(brut);
  if (Number.isNaN(valeur) || valeur < NOTE_BORNES.MIN || valeur > NOTE_BORNES.MAX) {
    return `Note attendue entre ${NOTE_BORNES.MIN} et ${NOTE_BORNES.MAX}`;
  }
  return null;
}

/** Lignes dont la valeur diffère de celle du serveur. */
const modifiees = computed(() =>
  lignes.value.filter((ligne) => {
    const brut = brouillon.value[ligne.matricule];
    if (brut === undefined || brut === '') return false;
    return Number(brut) !== Number(ligne.valeurServeur);
  })
);

/**
 * Contrôles de conformité — l'étape « vérification ».
 *
 * Recalculés à chaque affichage : rien n'est stocké, donc rien ne peut mentir
 * sur l'état réel de la grille.
 */
const conformite = computed(() => {
  const sansNote = lignes.value.filter((ligne) => valeurCourante(ligne) === '');
  const invalides = lignes.value.filter((ligne) => erreurDe(ligne) !== null);
  const horsClasse = lignes.value.filter((ligne) => ligne.horsClasse);

  return {
    effectif: lignes.value.length,
    saisies: lignes.value.length - sansNote.length,
    sansNote,
    invalides,
    horsClasse,
    conforme:
      lignes.value.length > 0 &&
      sansNote.length === 0 &&
      invalides.length === 0 &&
      horsClasse.length === 0,
  };
});

/** Calculs faits sur les valeurs **à l'écran**, brouillon compris : ce sont
 * celles que l'utilisateur s'apprête à enregistrer. */
const statistiques = computed(() => {
  const notees = lignes.value
    .filter((ligne) => valeurCourante(ligne) !== '' && erreurDe(ligne) === null)
    .map((ligne) => Number(valeurCourante(ligne)));

  if (notees.length === 0) return { moyenne: '—', min: '—', max: '—', reussite: '—' };

  const moyenne = notees.reduce((somme, valeur) => somme + valeur, 0) / notees.length;
  const admis = notees.filter((valeur) => valeur >= 10).length;

  return {
    moyenne: moyenne.toFixed(2),
    min: Math.min(...notees).toFixed(2),
    max: Math.max(...notees).toFixed(2),
    reussite: `${((admis / notees.length) * 100).toFixed(1)} %`,
  };
});

const { exportToExcel, exportToPdf } = useTableExport({
  rows: computed(() =>
    lignes.value.map((ligne, index) => ({
      'N°': index + 1,
      Matricule: ligne.matricule,
      Nom: ligne.nom,
      Prénom: ligne.prenom,
      Note: valeurCourante(ligne) || '—',
      Statut: ligne.statut ? statutNoteInfo(ligne.statut).label : 'Non saisie',
    }))
  ),
  title: 'Grille de notes',
  fileBaseName: 'grille_notes',
  filters: () => [
    { label: 'Classe', value: espace.classe?.code ?? '—' },
    { label: 'Évaluation', value: espace.evaluation?.designation ?? '—' },
    { label: 'Moyenne', value: statistiques.value.moyenne },
    { label: 'Effectif noté', value: `${conformite.value.saisies}/${conformite.value.effectif}` },
  ],
});

async function enregistrer() {
  if (conformite.value.invalides.length > 0) {
    notifications.notifyError('Corrigez les notes hors bornes avant d’enregistrer.');
    return;
  }

  if (modifiees.value.length === 0) {
    notifications.notifyInfo('Aucune modification à enregistrer.');
    return;
  }

  enregistrement.value = true;

  const rapport = await noteStore.saisirLot(
    espace.evaluationId,
    modifiees.value.map((ligne) => ({
      matricule: ligne.matricule,
      note: Number(brouillon.value[ligne.matricule]),
      commentaire: ligne.commentaire || null,
    }))
  );

  enregistrement.value = false;

  if (rapport === undefined) return;

  brouillon.value = {};

  // Le serveur ne fait pas échouer le lot sur un matricule inconnu : il le
  // range dans `erreurs`. Taire ces lignes laisserait croire à un succès plein.
  if (rapport.total_echecs > 0) {
    notifications.notifyWarning(
      `${rapport.total_succes} note(s) enregistrée(s), ${rapport.total_echecs} rejetée(s) : ` +
        `${(rapport.erreurs ?? []).map((erreur) => erreur.matricule).join(', ')}.`
    );
  } else {
    notifications.notifySuccess(`${rapport.total_succes} note(s) enregistrée(s).`);
  }
}

/** @param {'SAISIE'|'VALIDEE'|'PUBLIEE'} statut */
async function changerStatut(statut) {
  if (statut === 'VALIDEE' && !conformite.value.conforme) {
    notifications.notifyError(
      'La grille n’est pas conforme : complétez ou corrigez les notes signalées avant validation.'
    );
    return;
  }

  await noteStore.changerStatut(statut);
}
</script>

<template>
  <div>
    <!-- Contexte : classe → session → évaluation -->
    <div class="card border-0 shadow-sm mb-3">
      <div class="card-body row g-3">
        <div class="col-md-4">
          <label for="grille-classe" class="form-label small fw-semibold text-secondary">
            Classe
          </label>
          <select
            id="grille-classe"
            class="form-select"
            :value="espace.classeId"
            @change="espace.selectClasse($event.target.value)"
          >
            <option value="">Choisir une classe</option>
            <option v-for="classe in classes" :key="classe.id" :value="classe.id">
              {{ classe.code }} — {{ classe.filiere_nom }} ({{ classe.niveau_code }})
            </option>
          </select>
        </div>

        <div class="col-md-4">
          <label for="grille-session" class="form-label small fw-semibold text-secondary">
            Session d'évaluation
          </label>
          <select
            id="grille-session"
            class="form-select"
            :value="espace.sessionId"
            @change="espace.selectSession($event.target.value)"
          >
            <option value="">Choisir une session</option>
            <option v-for="session in espace.sessionsActives" :key="session.id" :value="session.id">
              {{ session.code }} — {{ session.designation }}
            </option>
          </select>
          <div class="form-text" style="font-size: 11px">
            Seules les sessions à l'état « active » sont proposées.
          </div>
        </div>

        <div class="col-md-4">
          <label for="grille-evaluation" class="form-label small fw-semibold text-secondary">
            Épreuve ou devoir
          </label>
          <select
            id="grille-evaluation"
            class="form-select"
            :value="espace.evaluationId"
            :disabled="!espace.classeId || !espace.sessionId"
            @change="espace.selectEvaluation($event.target.value)"
          >
            <option value="">Choisir une évaluation</option>
            <option
              v-for="evaluation in espace.evaluationsClasse"
              :key="evaluation.id"
              :value="evaluation.id"
            >
              {{ evaluation.code_module }} — {{ evaluation.designation }} ({{
                typeEpreuveLabel(evaluation.type_eval)
              }})
            </option>
          </select>
        </div>
      </div>
    </div>

    <LoadingSpinner v-if="chargementContexte && !classes.length" />

    <EmptyState
      v-else-if="!espace.classeId"
      title="Choisissez une classe"
      description="Toutes les évaluations de ses modules, pour la session active, s'afficheront ensuite."
    />

    <EmptyState
      v-else-if="!espace.sessionsActives.length"
      title="Aucune session d'évaluation active"
      description="Une session doit être passée à l'état « active » depuis l'écran des examens avant toute saisie."
    />

    <EmptyState
      v-else-if="!espace.evaluationsClasse.length"
      title="Aucune évaluation pour cette classe"
      :description="`Aucun module de ${espace.classe?.code ?? 'cette classe'} ne porte d'évaluation sur cette session.`"
    />

    <EmptyState
      v-else-if="!espace.evaluationId"
      title="Choisissez une évaluation"
      description="Examens et devoirs de la session apparaissent dans la liste ci-dessus."
    />

    <template v-else>
      <BandeauEtapes :statut="statutGlobal" :conforme="conformite.conforme" class="mb-3" />

      <!-- Indicateurs de la grille -->
      <div class="row g-3 mb-3">
        <div class="col-6 col-lg-3">
          <div class="card border-0 shadow-sm p-3 h-100">
            <span class="text-muted small text-uppercase d-block">Notes saisies</span>
            <span class="fw-bold font-monospace fs-5">
              {{ conformite.saisies }} / {{ conformite.effectif }}
            </span>
          </div>
        </div>
        <div class="col-6 col-lg-3">
          <div class="card border-0 shadow-sm p-3 h-100">
            <span class="text-muted small text-uppercase d-block">Moyenne</span>
            <span class="fw-bold font-monospace fs-5">{{ statistiques.moyenne }}</span>
          </div>
        </div>
        <div class="col-6 col-lg-3">
          <div class="card border-0 shadow-sm p-3 h-100">
            <span class="text-muted small text-uppercase d-block">Min / Max</span>
            <span class="fw-bold font-monospace fs-5">
              {{ statistiques.min }} / {{ statistiques.max }}
            </span>
          </div>
        </div>
        <div class="col-6 col-lg-3">
          <div class="card border-0 shadow-sm p-3 h-100">
            <span class="text-muted small text-uppercase d-block">Taux ≥ 10</span>
            <span class="fw-bold font-monospace fs-5">{{ statistiques.reussite }}</span>
          </div>
        </div>
      </div>

      <!-- Contrôles de conformité -->
      <div
        class="alert d-flex justify-content-between align-items-start flex-wrap gap-2"
        :class="conformite.conforme ? 'alert-success' : 'alert-warning'"
        role="status"
      >
        <div>
          <strong>
            <i
              class="bi me-1"
              :class="conformite.conforme ? 'bi-check-circle' : 'bi-exclamation-triangle'"
            ></i>
            {{ conformite.conforme ? 'Grille conforme' : 'Grille non conforme' }}
          </strong>
          <ul class="mb-0 small mt-1">
            <li v-if="conformite.sansNote.length">
              {{ conformite.sansNote.length }} étudiant(s) sans note :
              {{
                conformite.sansNote
                  .slice(0, 5)
                  .map((l) => l.matricule)
                  .join(', ')
              }}{{ conformite.sansNote.length > 5 ? '…' : '' }}
            </li>
            <li v-if="conformite.invalides.length">
              {{ conformite.invalides.length }} note(s) hors bornes [{{ NOTE_BORNES.MIN }} –
              {{ NOTE_BORNES.MAX }}]
            </li>
            <li v-if="conformite.horsClasse.length">
              {{ conformite.horsClasse.length }} note(s) rattachée(s) à un matricule absent de
              l'effectif de la classe
            </li>
            <li v-if="conformite.conforme">
              Toutes les notes sont saisies et dans les bornes. La vérification n'est pas un statut
              enregistré : ce contrôle est rejoué à chaque ouverture.
            </li>
          </ul>
        </div>

        <span class="badge bg-dark align-self-center">
          {{ parStatut.SAISIE }} saisie · {{ parStatut.VALIDEE }} validée ·
          {{ parStatut.PUBLIEE }} publiée
        </span>
      </div>

      <!-- Actions du flux, selon le rôle -->
      <div class="d-flex flex-wrap gap-2 mb-3">
        <button
          v-if="peutSaisir"
          class="btn btn-primary btn-sm"
          type="button"
          :disabled="!editable || enregistrement || modifiees.length === 0"
          @click="enregistrer"
        >
          <span
            v-if="enregistrement"
            class="spinner-border spinner-border-sm me-2"
            aria-hidden="true"
          ></span>
          Enregistrer {{ modifiees.length ? `(${modifiees.length})` : '' }}
        </button>

        <button
          v-if="peutValider"
          class="btn btn-success btn-sm"
          type="button"
          :disabled="statutGlobal !== 'SAISIE' || !conformite.conforme"
          @click="changerStatut('VALIDEE')"
        >
          <i class="bi bi-check2-square me-1"></i> Valider la grille
        </button>

        <button
          v-if="peutRenvoyer"
          class="btn btn-outline-warning btn-sm"
          type="button"
          :disabled="statutGlobal !== 'VALIDEE'"
          @click="changerStatut('SAISIE')"
        >
          <i class="bi bi-arrow-counterclockwise me-1"></i> Renvoyer en correction
        </button>

        <button
          v-if="peutPublier"
          class="btn btn-dark btn-sm"
          type="button"
          :disabled="statutGlobal !== 'VALIDEE'"
          @click="changerStatut('PUBLIEE')"
        >
          <i class="bi bi-megaphone me-1"></i> Publier
        </button>

        <ExportMenu
          class="ms-auto"
          :disabled="lignes.length === 0"
          @excel="exportToExcel"
          @pdf="exportToPdf"
        />
      </div>

      <p v-if="editable && statutGlobal === 'VALIDEE'" class="text-warning small">
        <i class="bi bi-info-circle me-1"></i>
        Cette grille est validée : toute correction la ramènera au statut « saisie » et devra être
        validée de nouveau.
      </p>

      <LoadingSpinner v-if="chargementNotes && !lignes.length" />

      <EmptyState
        v-else-if="!lignes.length"
        title="Aucun étudiant inscrit"
        description="Cette classe ne compte aucun inscrit sur l'année académique active : il n'y a personne à noter."
      />

      <div v-else class="table-responsive card border-0 shadow-sm">
        <table class="table table-hover align-middle mb-0">
          <thead class="table-light">
            <tr>
              <th class="ps-3" style="width: 60px">#</th>
              <th>Matricule</th>
              <th>Étudiant</th>
              <th style="width: 140px">Note / 20</th>
              <th style="width: 130px">Statut</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(ligne, index) in lignes" :key="ligne.matricule">
              <td class="ps-3 text-muted">{{ index + 1 }}</td>
              <td class="font-monospace">
                {{ ligne.matricule }}
                <span
                  v-if="ligne.horsClasse"
                  class="badge bg-warning-subtle text-warning ms-1"
                  title="Ce matricule n'est pas dans l'effectif de la classe"
                >
                  hors effectif
                </span>
              </td>
              <td class="fw-semibold text-dark">{{ ligne.nom }} {{ ligne.prenom }}</td>
              <td>
                <input
                  v-if="editable"
                  :value="valeurCourante(ligne)"
                  type="number"
                  class="form-control form-control-sm"
                  :class="{ 'is-invalid': erreurDe(ligne) }"
                  :min="NOTE_BORNES.MIN"
                  :max="NOTE_BORNES.MAX"
                  step="0.25"
                  :aria-label="`Note de ${ligne.nom} ${ligne.prenom}`"
                  @input="brouillon[ligne.matricule] = $event.target.value"
                />
                <span v-else class="font-monospace">
                  {{ valeurCourante(ligne) || '—' }}
                </span>
                <div v-if="erreurDe(ligne)" class="invalid-feedback d-block">
                  {{ erreurDe(ligne) }}
                </div>
              </td>
              <td>
                <span
                  class="badge"
                  :class="`bg-${ligne.statut ? statutNoteInfo(ligne.statut).variant : 'light'}-subtle text-${ligne.statut ? statutNoteInfo(ligne.statut).variant : 'muted'}`"
                >
                  {{ ligne.statut ? statutNoteInfo(ligne.statut).label : 'Non saisie' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>
