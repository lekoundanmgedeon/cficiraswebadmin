<script setup>
import { computed, onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import ExportMenu from '@/shared/components/ExportMenu.vue';
import EmptyState from '@/shared/components/EmptyState.vue';
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue';
import Pagination from '@/components/shared/Pagination.vue';
import ConfirmModal from '@/shared/components/ConfirmModal.vue';
import { useTableExport } from '@/shared/composables/useTableExport';
import { usePagination } from '@/shared/composables/usePagination';
import { formatDate } from '@/shared/utils/date';
import { useDocumentStore } from '../../store';
import { useDemandeForm } from '../../composables/useDemandeForm';
import { statutDemandeInfo, STATUT_DEMANDE_LIST, transitionsDepuis } from '../../constants';

/**
 * Le guichet : les demandes encore dans le circuit.
 *
 * Chaque ligne ne propose que les gestes **réellement possibles** depuis son
 * statut (`transitionsDepuis`) : le serveur refuse les autres par un 409, et
 * afficher un bouton qui échouera ne rend service à personne.
 *
 * Le rejet exige un motif — c'est une contrainte de la base
 * (`demandes_rejet_motive`), pas une politesse : un refus sans explication
 * renvoie l'étudiant au guichet sans que personne sache pourquoi.
 */

const store = useDocumentStore();
const { loading, statistiques } = storeToRefs(store);
const { openCreate } = useDemandeForm();

const recherche = ref('');
const statut = ref('');
const rejet = ref({ visible: false, demande: null, motif: '' });

onMounted(() => Promise.all([store.fetchAll(), store.fetchStatistiques(), store.fetchTypes()]));

const filtres = computed(() => {
  const terme = recherche.value.trim().toLowerCase();

  return store.enCours.filter((demande) => {
    if (statut.value && demande.statut !== statut.value) return false;
    if (!terme) return true;

    return [demande.numero, demande.nom, demande.prenom, demande.matricule, demande.type_libelle]
      .filter(Boolean)
      .some((champ) => String(champ).toLowerCase().includes(terme));
  });
});

// 227 demandes en cours sur le jeu de démonstration, rendues d'un bloc. La page revient à 1 dès qu'un filtre change.
const { page, itemsPerPage, startIndex, paginated } = usePagination(filtres, {
  perPage: 15,
  resetKey: () => [recherche.value, statut.value],
});

const { exportToExcel, exportToPdf } = useTableExport({
  rows: computed(() =>
    filtres.value.map((demande) => ({
      Numéro: demande.numero,
      Étudiant: `${demande.nom} ${demande.prenom}`,
      Matricule: demande.matricule,
      Document: demande.type_libelle,
      Exemplaires: demande.nb_exemplaires,
      Déposée: formatDate(demande.date_demande),
      Échéance: formatDate(demande.date_echeance),
      Statut: statutDemandeInfo(demande.statut).label,
      Urgence: demande.urgence ? 'Oui' : 'Non',
    }))
  ),
  title: 'Demandes de documents en cours',
  fileBaseName: 'demandes_en_cours',
});

/** @param {any} demande @param {string} cible */
async function avancer(demande, cible) {
  if (cible === 'REJETEE') {
    rejet.value = { visible: true, demande, motif: '' };
    return;
  }

  await store.changerStatut(demande.id, cible);
}

async function confirmerRejet() {
  const { demande, motif } = rejet.value;
  if (!motif.trim()) return;

  const result = await store.changerStatut(demande.id, 'REJETEE', { motif_rejet: motif.trim() });
  if (result !== undefined) rejet.value = { visible: false, demande: null, motif: '' };
}
</script>

<template>
  <div>
    <div class="d-flex justify-content-between align-items-start mb-3 flex-wrap gap-2">
      <div>
        <h4 class="mb-1">Demandes en cours</h4>
        <p class="mb-0 text-muted small">
          Attestations, certificats, relevés et diplômes en attente de traitement.
        </p>
      </div>
      <div class="d-flex gap-2">
        <ExportMenu :disabled="!filtres.length" @excel="exportToExcel" @pdf="exportToPdf" />
        <button class="btn btn-sm btn-primary" type="button" @click="openCreate()">
          + Nouvelle demande
        </button>
      </div>
    </div>

    <div v-if="statistiques" class="row g-3 mb-3">
      <div class="col-6 col-lg-3">
        <div class="card border-0 shadow-sm p-3 border-start border-secondary border-3">
          <span class="text-muted small text-uppercase d-block mb-1">Soumises</span>
          <span class="fw-bold font-monospace fs-5">{{ statistiques.soumises }}</span>
        </div>
      </div>
      <div class="col-6 col-lg-3">
        <div class="card border-0 shadow-sm p-3 border-start border-primary border-3">
          <span class="text-muted small text-uppercase d-block mb-1">En traitement</span>
          <span class="fw-bold font-monospace fs-5">{{ statistiques.en_traitement }}</span>
        </div>
      </div>
      <div class="col-6 col-lg-3">
        <div class="card border-0 shadow-sm p-3 border-start border-info border-3">
          <span class="text-muted small text-uppercase d-block mb-1">Prêtes à retirer</span>
          <span class="fw-bold font-monospace fs-5">{{ statistiques.pretes }}</span>
        </div>
      </div>
      <div class="col-6 col-lg-3">
        <div class="card border-0 shadow-sm p-3 border-start border-danger border-3">
          <span class="text-muted small text-uppercase d-block mb-1">En retard</span>
          <span class="fw-bold font-monospace fs-5">{{ statistiques.en_retard }}</span>
        </div>
      </div>
    </div>

    <div class="row g-2 align-items-end mb-3">
      <div class="col-md-6">
        <label for="demande-recherche" class="form-label small fw-semibold text-secondary">
          Rechercher
        </label>
        <input
          id="demande-recherche"
          v-model="recherche"
          type="search"
          class="form-control form-control-sm"
          placeholder="Numéro, étudiant, matricule ou document"
        />
      </div>
      <div class="col-md-4">
        <label for="demande-statut" class="form-label small fw-semibold text-secondary">
          Statut
        </label>
        <select id="demande-statut" v-model="statut" class="form-select form-select-sm">
          <option value="">Tous</option>
          <option
            v-for="item in STATUT_DEMANDE_LIST.filter(
              (s) => !['DELIVREE', 'REJETEE'].includes(s.code)
            )"
            :key="item.code"
            :value="item.code"
          >
            {{ item.label }}
          </option>
        </select>
      </div>
    </div>

    <LoadingSpinner v-if="loading && !store.items.length" />

    <EmptyState
      v-else-if="!store.enCours.length"
      title="Aucune demande en attente"
      description="Toutes les demandes ont été traitées. Déposez-en une nouvelle depuis le bouton ci-dessus."
    />

    <EmptyState
      v-else-if="!filtres.length"
      title="Aucune demande ne correspond"
      description="Élargissez la recherche ou retirez le filtre de statut."
      :size="80"
    />

    <div v-else class="table-responsive card border-0 shadow-sm">
      <table class="table table-hover align-middle mb-0">
        <thead class="table-light">
          <tr>
            <th class="ps-3" style="width: 60px">#</th>
            <th>Numéro</th>
            <th>Étudiant</th>
            <th>Document</th>
            <th>Échéance</th>
            <th>Statut</th>
            <th class="text-end pe-3" style="min-width: 230px">
              <span class="visually-hidden">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(demande, index) in paginated" :key="demande.id">
            <td class="ps-3 text-muted small">{{ startIndex + index + 1 }}</td>
            <td>
              <span class="font-monospace small fw-semibold">{{ demande.numero }}</span>
              <span
                v-if="demande.urgence"
                class="badge bg-danger-subtle text-danger ms-1"
                title="Demande urgente"
              >
                urgent
              </span>
            </td>
            <td>
              <span class="fw-semibold text-dark d-block">
                {{ demande.nom }} {{ demande.prenom }}
              </span>
              <span class="text-muted small font-monospace">{{ demande.matricule }}</span>
            </td>
            <td>
              <span class="d-block small">{{ demande.type_libelle }}</span>
              <span class="text-muted" style="font-size: 11px">
                {{ demande.nb_exemplaires }} exemplaire(s)
                <span v-if="demande.annee_academique"> · {{ demande.annee_academique }}</span>
              </span>
            </td>
            <td>
              <span class="d-block small">{{ formatDate(demande.date_echeance) }}</span>
              <span v-if="demande.en_retard" class="badge bg-danger-subtle text-danger">
                en retard de {{ Math.abs(demande.jours_restants) }} j
              </span>
              <span v-else class="text-muted" style="font-size: 11px">
                {{ demande.jours_restants }} j restants
              </span>
            </td>
            <td>
              <span
                class="badge"
                :class="`bg-${statutDemandeInfo(demande.statut).variant}-subtle text-${statutDemandeInfo(demande.statut).variant}`"
              >
                {{ statutDemandeInfo(demande.statut).label }}
              </span>
            </td>
            <td class="text-end pe-3">
              <button
                v-for="transition in transitionsDepuis(demande.statut)"
                :key="transition.code"
                class="btn btn-sm ms-1"
                :class="`btn-outline-${transition.variant}`"
                type="button"
                :disabled="loading"
                @click="avancer(demande, transition.code)"
              >
                {{ transition.label }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <div class="card-footer bg-white border-top py-3 px-3">
        <Pagination
          v-model="page"
          v-model:items-per-page="itemsPerPage"
          :total-items="filtres.length"
        />
      </div>
    </div>

    <!-- Le rejet demande son motif : la base le refuse sans. -->
    <ConfirmModal
      v-model="rejet.visible"
      title="Rejeter la demande"
      :message="`La demande ${rejet.demande?.numero ?? ''} sera close. Le motif sera conservé et communiqué.`"
      confirm-label="Rejeter"
      variant="danger"
      :loading="loading"
      :disabled="!rejet.motif.trim()"
      @confirm="confirmerRejet"
    >
      <!-- Le slot remplace `message` : on le réécrit ici pour ne pas le perdre. -->
      <p class="mb-3">
        La demande <span class="font-monospace">{{ rejet.demande?.numero ?? '' }}</span> sera close.
        Le motif sera conservé et communiqué à l'étudiant.
      </p>

      <div class="text-start">
        <label for="rejet-motif" class="form-label small fw-semibold">
          Motif du rejet <span class="text-danger">*</span>
        </label>
        <textarea
          id="rejet-motif"
          v-model="rejet.motif"
          class="form-control"
          rows="3"
          placeholder="Ex : dossier incomplet, scolarité non soldée…"
        ></textarea>
      </div>
    </ConfirmModal>
  </div>
</template>
