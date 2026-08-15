<template>
  <div class="echeancier-container">
    <!-- Header de la section -->
    <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
      <div>
        <h3 class="fw-bold mb-1">Plans d'échelonnement &amp; échéanciers</h3>
        <p class="text-muted small mb-0">
          <i class="bi bi-calendar-range-fill text-primary me-1"></i>
          Modalités de fractionnement de la scolarité, et suivi des traites étudiant par étudiant.
        </p>
      </div>

      <ExportMenu
        :disabled="traitesFiltrees.length === 0"
        @excel="exportToExcel"
        @pdf="exportToPdf"
      />
    </div>

    <!-- Section 1 : les plans réellement déclarés -->
    <LoadingSpinner v-if="loadingPlans && plans.length === 0" />

    <div v-else class="row g-3 mb-4">
      <div v-for="(plan, index) in plans" :key="plan.id" class="col-md-4">
        <div
          class="card border-0 shadow-sm rounded-4 bg-white p-3 border-top border-3 h-100"
          :class="`border-${couleurPlan(index)}`"
        >
          <div class="d-flex justify-content-between align-items-start mb-2">
            <h6 class="fw-bold text-dark mb-0">{{ plan.nom }}</h6>
            <span class="badge bg-light text-dark border font-monospace text-xs">
              {{ plan.nombre_traites }} échéance(s)
            </span>
          </div>

          <p class="text-muted text-xs mb-3">{{ plan.description }}</p>

          <div class="d-flex flex-wrap gap-2 mb-3">
            <span class="badge bg-light text-secondary border font-monospace text-xs">
              {{ plan.code }}
            </span>
            <span class="badge bg-light text-secondary border text-xs">
              Périodicité : {{ plan.periodicite }}
            </span>
            <span class="badge bg-light text-secondary border text-xs">
              Assiette : {{ plan.assiette }}
            </span>
            <span v-if="plan.jour_echeance" class="badge bg-light text-secondary border text-xs">
              Échéance le {{ plan.jour_echeance }}
            </span>
            <span
              class="badge text-xs"
              :class="plan.actif ? 'bg-soft-success text-success' : 'bg-light text-muted border'"
            >
              {{ plan.actif ? 'Actif' : 'Inactif' }}
            </span>
          </div>

          <!--
            `classes_associees` est une chaîne de codes séparés par des virgules,
            et elle peut en compter plus de cent : on annonce le nombre, et on
            détaille au survol plutôt que de noyer la carte.
          -->
          <div class="text-xs text-muted mt-auto pt-2 border-top">
            <span :title="plan.classes_associees || 'Aucune classe rattachée'">
              <i class="bi bi-diagram-3 me-1"></i>
              {{ nbClassesAssociees(plan) }} classe(s) rattachée(s)
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Section 2 : registre de suivi des traites -->
    <div class="card shadow-sm border-0 rounded-4 overflow-hidden bg-white">
      <div class="card-header bg-white border-0 pt-4 px-4 pb-2">
        <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div>
            <h5 class="fw-bold text-dark mb-0">
              <i class="bi bi-person-lines-fill text-secondary me-2"></i>
              État des échéances individuelles
            </h5>
            <p class="text-muted text-xs mb-0">
              {{ compteurs.enRetard }} traite(s) en retard sur {{ traites.length }} échéance(s)
              suivies.
            </p>
          </div>

          <div class="d-flex gap-2 flex-wrap">
            <select
              v-model="filtreStatut"
              class="form-select form-select-sm text-xs shadow-none border"
              style="width: 160px"
            >
              <option value="">Tous les statuts</option>
              <option
                v-for="statut in STATUT_ECHEANCE_LIST"
                :key="statut.code"
                :value="statut.code"
              >
                {{ statut.label }}
              </option>
            </select>

            <select
              v-model="filtreFiliere"
              class="form-select form-select-sm text-xs shadow-none border"
              style="width: 190px"
            >
              <option value="">Toutes les filières</option>
              <option v-for="filiere in filieres" :key="filiere" :value="filiere">
                {{ filiere }}
              </option>
            </select>

            <select
              v-model="filtrePlan"
              class="form-select form-select-sm text-xs shadow-none border"
              style="width: 200px"
            >
              <option value="">Tous les plans</option>
              <option v-for="plan in plansPresents" :key="plan" :value="plan">{{ plan }}</option>
            </select>
          </div>
        </div>
      </div>

      <div class="card-body p-0">
        <LoadingSpinner v-if="loadingTraites && traites.length === 0" />

        <EmptyState
          v-else-if="traites.length === 0"
          title="Aucune échéance suivie"
          description="Aucun échéancier n'a encore été généré. Ils se créent depuis l'écran des paiements, à l'inscription de l'étudiant."
        />

        <EmptyState
          v-else-if="traitesFiltrees.length === 0"
          title="Aucune traite ne correspond"
          description="Modifiez les filtres pour retrouver une échéance."
          :size="80"
        />

        <div v-else class="table-responsive">
          <table class="table table-hover align-middle mb-0 text-center">
            <thead class="bg-light text-secondary small">
              <tr>
                <th class="ps-4 py-3 text-start" style="width: 70px">#</th>
                <th class="text-start">Étudiant &amp; plan</th>
                <th>Traite n°</th>
                <th>Montant</th>
                <th>Réglé</th>
                <th>Date d'échéance</th>
                <th>Statut</th>
                <th class="text-end pe-4">Retard</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(traite, index) in paginated" :key="traite.id">
                <td class="ps-4 text-start text-muted small">{{ startIndex + index + 1 }}</td>

                <td class="text-start">
                  <div class="fw-bold text-dark mb-0">{{ traite.etudiant }}</div>
                  <small class="text-muted font-monospace text-xs">
                    {{ traite.matricule }} • {{ traite.plan }}
                  </small>
                  <div class="text-xs text-muted">
                    {{ traite.classe_code }} · {{ traite.filiere }}
                  </div>
                </td>

                <td>
                  <span class="badge bg-light text-secondary border font-monospace">
                    T{{ traite.numero }} / {{ traite.total_traites }}
                  </span>
                  <div class="text-xs text-muted mt-1">{{ traite.libelle }}</div>
                </td>

                <td class="font-monospace fw-bold">{{ formatMoney(traite.montant) }}</td>

                <td class="font-monospace text-success">{{ formatMoney(traite.montant_regle) }}</td>

                <td class="font-monospace text-muted small">{{ traite.date_echeance_fr }}</td>

                <td>
                  <span
                    class="badge px-2 py-1 rounded-pill fw-bold"
                    :class="`bg-soft-${infoStatut(traite.statut).variant} text-${infoStatut(traite.statut).variant}`"
                  >
                    {{ traite.statut_libelle || infoStatut(traite.statut).label }}
                  </span>
                </td>

                <td class="text-end pe-4 font-monospace text-xs fw-bold text-danger">
                  {{ Number(traite.jours_retard) > 0 ? `+${traite.jours_retard} j` : '—' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div v-if="traitesFiltrees.length" class="card-footer bg-white border-0 py-3 px-4">
        <Pagination
          v-model="page"
          v-model:items-per-page="itemsPerPage"
          :total-items="traitesFiltrees.length"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import EmptyState from '@/shared/components/EmptyState.vue';
import ExportMenu from '@/shared/components/ExportMenu.vue';
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue';
import Pagination from '@/components/shared/Pagination.vue';
import { useTableExport } from '@/shared/composables/useTableExport';
import { usePagination } from '@/shared/composables/usePagination';
import { useEcheancierStore } from '@/modules/finances/stores/echeanciers';
import { usePlanStore } from '@/modules/finances/stores/plans';
import {
  formatMoney,
  statutInfo,
  STATUTS_ECHEANCE,
  STATUT_ECHEANCE_LIST,
} from '@/modules/finances/constants';

/**
 * Plans d'échelonnement et suivi des traites.
 *
 * ## L'écran était intégralement simulé
 *
 * Ses trois « plans types » (« Plan Standard Classique », « Plan Executive
 * Master ») et ses quatre traites (« Moussa Diallo », « ETU-2026-001 ») étaient
 * des `ref([...])` codés en dur. Le filtre par filière proposait deux valeurs
 * écrites dans le balisage, « Informatique » et « Management ». Et ses trois
 * boutons ne faisaient rien d'autre qu'un `alert()` — `encaisserTraite`
 * modifiait l'objet local puis annonçait « Le grand livre comptable a été mis à
 * jour », sans qu'aucune requête ne parte.
 *
 * Or **les deux lectures existaient déjà** et sont servies par le store du
 * module : `GET /finance/plans` (7 plans réels, avec leur périodicité, leur
 * assiette et leurs classes rattachées) et `GET /finance/echeanciers/suivi`
 * (6 223 échéances, avec le reste dû, le statut et les jours de retard). C'est
 * la même source que la balance âgée de l'onglet « Factures ».
 *
 * ## Ce qui a été retiré, et pourquoi
 *
 * Les boutons « Encaisser » et « Relancer » ont disparu : l'encaissement a son
 * écran — Paiements → Encaisser — qui passe par `POST /finance/paiements` et
 * émet un reçu, et **aucune route de relance n'existe** (ni SMS, ni e-mail) dans
 * le backend. Mieux vaut pas de bouton qu'un bouton qui ment. « Définir un
 * nouveau plan » suit le même sort : `POST /finance/plans` existe, mais le
 * bouton n'ouvrait aucun formulaire — il annonçait l'ouverture d'un panneau
 * inexistant.
 */

const echeancierStore = useEcheancierStore();
const planStore = usePlanStore();

const { items: plans, loading: loadingPlans } = storeToRefs(planStore);
const { traites, loading: loadingTraites } = storeToRefs(echeancierStore);

const filtreStatut = ref('');
const filtreFiliere = ref('');
const filtrePlan = ref('');

onMounted(() => {
  planStore.fetchAll();
  // Le défaut serveur plafonne à 500 lignes : le suivi complet en compte 6 223,
  // et les compteurs affichés ici porteraient sinon sur un échantillon.
  echeancierStore.fetchSuivi({ limite: 10000 });
});

/** Teintes de bordure des cartes de plan, sans signification métier. */
const COULEURS = ['primary', 'success', 'warning', 'info', 'dark', 'danger', 'secondary'];
const couleurPlan = (index) => COULEURS[index % COULEURS.length];

/** @param {any} plan */
const nbClassesAssociees = (plan) =>
  String(plan.classes_associees ?? '')
    .split(',')
    .map((code) => code.trim())
    .filter(Boolean).length;

const infoStatut = (statut) => statutInfo(STATUTS_ECHEANCE, statut);

const valeursDistinctes = (champ) =>
  [...new Set(traites.value.map((traite) => traite[champ]).filter(Boolean))].sort();

const filieres = computed(() => valeursDistinctes('filiere'));
const plansPresents = computed(() => valeursDistinctes('plan'));

const traitesFiltrees = computed(() =>
  traites.value.filter(
    (traite) =>
      (!filtreStatut.value || traite.statut === filtreStatut.value) &&
      (!filtreFiliere.value || traite.filiere === filtreFiliere.value) &&
      (!filtrePlan.value || traite.plan === filtrePlan.value)
  )
);

const compteurs = computed(() => ({
  enRetard: traites.value.filter((traite) => traite.statut === 'EN_RETARD').length,
}));

const { page, itemsPerPage, startIndex, paginated } = usePagination(traitesFiltrees, {
  perPage: 15,
  resetKey: () => [filtreStatut.value, filtreFiliere.value, filtrePlan.value],
});

const { exportToExcel, exportToPdf } = useTableExport({
  rows: computed(() =>
    traitesFiltrees.value.map((traite) => ({
      Matricule: traite.matricule,
      Étudiant: traite.etudiant,
      Classe: traite.classe_code ?? '—',
      Filière: traite.filiere ?? '—',
      Plan: traite.plan ?? '—',
      Traite: `${traite.numero}/${traite.total_traites}`,
      Libellé: traite.libelle ?? '—',
      Montant: Number(traite.montant ?? 0),
      Réglé: Number(traite.montant_regle ?? 0),
      Reste: Number(traite.reste ?? 0),
      Échéance: traite.date_echeance_fr,
      Statut: traite.statut_libelle || infoStatut(traite.statut).label,
      'Jours de retard': Number(traite.jours_retard ?? 0),
    }))
  ),
  title: 'Suivi des traites',
  fileBaseName: 'suivi_traites',
  filters: () => [
    { label: 'Statut', value: filtreStatut.value || 'Tous' },
    { label: 'Filière', value: filtreFiliere.value || 'Toutes' },
    { label: 'Plan', value: filtrePlan.value || 'Tous' },
    { label: 'Traites', value: traitesFiltrees.value.length },
  ],
});
</script>

<style scoped>
/* Classes Soft UI ERP standard */
.bg-soft-success {
  background-color: rgba(40, 167, 69, 0.12);
}
.bg-soft-warning {
  background-color: rgba(255, 193, 7, 0.15);
}
.bg-soft-danger {
  background-color: rgba(220, 53, 69, 0.08);
}
.bg-soft-primary {
  background-color: rgba(0, 123, 255, 0.08);
}
.bg-soft-secondary {
  background-color: rgba(108, 117, 125, 0.1);
}

.text-xs {
  font-size: 11px !important;
}

.table th {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: #6c757d;
  border: none;
}

.table tbody tr {
  border-bottom: 1px solid #f8f9fa;
}

/* Ligne graphique stricte de l'ERP */
.rounded-4 {
  border-radius: 0.2rem !important;
}
</style>
