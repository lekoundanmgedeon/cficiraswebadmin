<script setup>
import { computed, onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import EmptyState from '@/shared/components/EmptyState.vue';
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue';
import ExportMenu from '@/shared/components/ExportMenu.vue';
import { useTableExport } from '@/shared/composables/useTableExport';
import { useNotificationStore } from '@/shared/stores/notificationStore';
import { useAuthStore } from '@/core/auth/authStore';
import { useAnneeStore } from '@/modules/structure-academique/annee/store';
import { useSemestreStore } from '@/modules/structure-academique/semestre/store';
import { useBulletinStore } from '@/modules/examens/bulletin/store';
import {
  decisionInfo,
  mentionLabel,
  STATUTS_PUBLICATION,
} from '@/modules/examens/bulletin/constants';
import { useEspaceNotesStore } from '../store';
import { peut } from '../constants';

/**
 * Moyennes et bulletins : calcul, palmarès, publication.
 *
 * ## Un bulletin ne s'écrit pas à la main
 *
 * Il **résulte** des notes : le calcul est fait par le serveur
 * (`POST /resultats/classes/:id/bulletins/generer`), à partir des notes
 * existantes et des pondérations des évaluations. L'écran ne fait que le
 * déclencher, puis lire.
 *
 * ## Le triplet est obligatoire
 *
 * Un bulletin est identifié par **(classe, semestre, année)**, jamais par la
 * seule classe : le serveur répond 400 si l'un des trois manque. D'où les trois
 * sélecteurs, et non un seul.
 *
 * ## Ce qui est calculé n'est pas ce qui est publié
 *
 * Le calcul agrège les notes **quel que soit leur statut**. Publier les
 * bulletins d'une classe dont les notes ne sont pas encore validées rendrait
 * donc officiels des résultats provisoires : l'écran le signale, et la
 * publication reste réservée au directeur.
 */

const espace = useEspaceNotesStore();
const bulletins = useBulletinStore();
const anneeStore = useAnneeStore();
const semestreStore = useSemestreStore();
const auth = useAuthStore();
const notifications = useNotificationStore();

const { classes } = storeToRefs(espace);
const { items: lignes, loading } = storeToRefs(bulletins);
const { items: annees } = storeToRefs(anneeStore);
const { items: semestres } = storeToRefs(semestreStore);

const classeId = ref('');
const semestreId = ref('');
const anneeId = ref('');
const calculEnCours = ref(false);

const peutPublierBulletins = computed(() => peut(auth.user?.role, 'publier_bulletins'));
const tripletComplet = computed(() => Boolean(classeId.value && semestreId.value && anneeId.value));

const anneeActive = computed(() => annees.value.find((annee) => annee.est_active));

/** Semestres de l'année retenue — un semestre appartient à une année. */
const semestresAnnee = computed(() =>
  semestres.value.filter(
    (semestre) => !anneeId.value || String(semestre.annee_id) === String(anneeId.value)
  )
);

const moyenneClasse = computed(() => {
  const valeurs = lignes.value
    .map((bulletin) => Number(bulletin.moyenne_generale))
    .filter((valeur) => !Number.isNaN(valeur));

  if (valeurs.length === 0) return '—';
  return (valeurs.reduce((somme, valeur) => somme + valeur, 0) / valeurs.length).toFixed(2);
});

const admis = computed(
  () => lignes.value.filter((bulletin) => Number(bulletin.moyenne_generale) >= 10).length
);

const { exportToExcel, exportToPdf } = useTableExport({
  rows: computed(() =>
    lignes.value.map((bulletin) => ({
      Rang: bulletin.rang_etudiant ?? '—',
      Matricule: bulletin.matricule ?? '—',
      Étudiant: [bulletin.nom, bulletin.prenom].filter(Boolean).join(' '),
      Moyenne: bulletin.moyenne_generale ?? '—',
      Crédits: bulletin.credits_acquis ?? 0,
      Décision: decisionInfo(bulletin.decision).label,
      Mention: mentionLabel(bulletin.mention),
      Publication: STATUTS_PUBLICATION[bulletin.statut_publication]?.label ?? '—',
    }))
  ),
  title: 'Palmarès de la classe',
  fileBaseName: 'palmares_classe',
});

onMounted(async () => {
  await Promise.all([espace.fetchContexte(), anneeStore.fetchAll(), semestreStore.fetchAll()]);
  anneeId.value = anneeActive.value?.id ?? '';
});

async function charger() {
  if (!tripletComplet.value) return;
  await bulletins.fetchByClasse(classeId.value, semestreId.value, anneeId.value);
}

async function calculer() {
  if (!tripletComplet.value) return;

  calculEnCours.value = true;
  const nb = await bulletins.generer(classeId.value, semestreId.value, anneeId.value);
  calculEnCours.value = false;

  if (nb === undefined) return;

  if (nb === 0) {
    notifications.notifyWarning(
      'Aucun bulletin calculé : aucune note exploitable sur cette période, ou bulletins verrouillés.'
    );
  } else {
    notifications.notifySuccess(`${nb} bulletin(s) calculé(s).`);
  }
}

async function publier() {
  await bulletins.publier();
}
</script>

<template>
  <div>
    <div class="card border-0 shadow-sm mb-3">
      <div class="card-body row g-3 align-items-end">
        <div class="col-md-4">
          <label for="moy-classe" class="form-label small fw-semibold text-secondary">Classe</label>
          <select id="moy-classe" v-model="classeId" class="form-select" @change="charger">
            <option value="">Choisir une classe</option>
            <option v-for="classe in classes" :key="classe.id" :value="classe.id">
              {{ classe.code }} — {{ classe.filiere_nom }}
            </option>
          </select>
        </div>

        <div class="col-md-3">
          <label for="moy-annee" class="form-label small fw-semibold text-secondary">
            Année académique
          </label>
          <select id="moy-annee" v-model="anneeId" class="form-select" @change="charger">
            <option value="">Choisir une année</option>
            <option v-for="annee in annees" :key="annee.id" :value="annee.id">
              {{ annee.code }}{{ annee.est_active ? ' (active)' : '' }}
            </option>
          </select>
        </div>

        <div class="col-md-3">
          <label for="moy-semestre" class="form-label small fw-semibold text-secondary">
            Semestre
          </label>
          <select id="moy-semestre" v-model="semestreId" class="form-select" @change="charger">
            <option value="">Choisir un semestre</option>
            <option v-for="semestre in semestresAnnee" :key="semestre.id" :value="semestre.id">
              {{ semestre.code }}
            </option>
          </select>
        </div>

        <div class="col-md-2 d-grid">
          <button
            class="btn btn-primary"
            type="button"
            :disabled="!tripletComplet || calculEnCours"
            @click="calculer"
          >
            <span
              v-if="calculEnCours"
              class="spinner-border spinner-border-sm me-2"
              aria-hidden="true"
            ></span>
            Calculer
          </button>
        </div>
      </div>
    </div>

    <LoadingSpinner v-if="loading && !lignes.length" />

    <EmptyState
      v-else-if="!tripletComplet"
      title="Choisissez une classe, une année et un semestre"
      description="Un bulletin est identifié par ce triplet : le serveur refuse la demande si l'un des trois manque."
    />

    <EmptyState
      v-else-if="!lignes.length"
      title="Aucun bulletin sur cette période"
      description="Lancez le calcul : il agrège les notes existantes et les pondérations des évaluations."
    />

    <template v-else>
      <div class="row g-3 mb-3">
        <div class="col-6 col-lg-3">
          <div class="card border-0 shadow-sm p-3 h-100">
            <span class="text-muted small text-uppercase d-block">Bulletins</span>
            <span class="fw-bold font-monospace fs-5">{{ lignes.length }}</span>
          </div>
        </div>
        <div class="col-6 col-lg-3">
          <div class="card border-0 shadow-sm p-3 h-100">
            <span class="text-muted small text-uppercase d-block">Moyenne de classe</span>
            <span class="fw-bold font-monospace fs-5">{{ moyenneClasse }}</span>
          </div>
        </div>
        <div class="col-6 col-lg-3">
          <div class="card border-0 shadow-sm p-3 h-100">
            <span class="text-muted small text-uppercase d-block">Moyenne ≥ 10</span>
            <span class="fw-bold font-monospace fs-5">{{ admis }} / {{ lignes.length }}</span>
          </div>
        </div>
        <div class="col-6 col-lg-3 d-flex align-items-center gap-2">
          <ExportMenu :disabled="!lignes.length" @excel="exportToExcel" @pdf="exportToPdf" />
          <button
            v-if="peutPublierBulletins"
            class="btn btn-dark btn-sm"
            type="button"
            :disabled="loading"
            @click="publier"
          >
            <i class="bi bi-megaphone me-1"></i> Publier les bulletins
          </button>
        </div>
      </div>

      <p class="text-muted small">
        <i class="bi bi-info-circle me-1"></i>
        Le calcul agrège les notes <strong>quel que soit leur statut</strong> : vérifiez que les
        grilles concernées sont validées avant de publier des bulletins.
      </p>

      <div class="table-responsive card border-0 shadow-sm">
        <table class="table table-hover align-middle mb-0">
          <thead class="table-light">
            <tr>
              <th class="ps-3" style="width: 70px">Rang</th>
              <th>Matricule</th>
              <th>Étudiant</th>
              <th class="text-center">Moyenne</th>
              <th class="text-center">Crédits</th>
              <th>Décision</th>
              <th>Mention</th>
              <th class="text-end pe-3">Publication</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="bulletin in lignes" :key="bulletin.id">
              <td class="ps-3 fw-bold">{{ bulletin.rang_etudiant ?? '—' }}</td>
              <td class="font-monospace">{{ bulletin.matricule ?? '—' }}</td>
              <td class="fw-semibold text-dark">{{ bulletin.nom }} {{ bulletin.prenom }}</td>
              <td class="text-center font-monospace">{{ bulletin.moyenne_generale ?? '—' }}</td>
              <td class="text-center">{{ bulletin.credits_acquis ?? 0 }}</td>
              <td>
                <span
                  class="badge"
                  :class="`bg-${decisionInfo(bulletin.decision).variant}-subtle text-${decisionInfo(bulletin.decision).variant}`"
                >
                  {{ decisionInfo(bulletin.decision).label }}
                </span>
              </td>
              <td class="small text-muted">{{ mentionLabel(bulletin.mention) }}</td>
              <td class="text-end pe-3">
                <span class="badge bg-light text-dark border">
                  {{ STATUTS_PUBLICATION[bulletin.statut_publication]?.label ?? '—' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>
