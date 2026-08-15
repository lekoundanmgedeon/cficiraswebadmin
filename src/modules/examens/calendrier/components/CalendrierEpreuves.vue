<script setup>
import { computed, onMounted, reactive } from 'vue';
import { storeToRefs } from 'pinia';
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue';
import ExportMenu from '@/shared/components/ExportMenu.vue';
import Pagination from '@/components/shared/Pagination.vue';
import { useTableExport } from '@/shared/composables/useTableExport';
import { usePagination } from '@/shared/composables/usePagination';
import { openModal } from '@/shared/utils/modal';
import { formatDate } from '@/shared/utils/date';
import EpreuveFormModal from '../../epreuve/components/EpreuveFormModal.vue';
import PlanningImportModal from '../../epreuve/components/PlanningImportModal.vue';
import { useEpreuveForm } from '../../epreuve/composables/useEpreuveForm';
import { useEpreuveStore } from '../../epreuve/store';
import { useSessionStore } from '../../session/store';
import { PLANNING_IMPORT_MODAL_ID, TYPES_EPREUVE, typeEpreuveLabel } from '../../constants';

const props = defineProps({
  /** `NORMALE` ou `RATTRAPAGE` — le type de session dont on montre les épreuves. */
  typeSession: { type: String, required: true },
});

/**
 * Planning des épreuves d'un type de session.
 *
 * `CalendrierEvaluation.vue` simulait tout : ses filières, ses classes et ses
 * épreuves étaient des `ref([...])` codés en dur.
 *
 * Les épreuves viennent maintenant de `GET /evaluation`, et la date affichée est
 * leur `date_prevue` réelle.
 *
 * ⚠️ **Trois colonnes de la maquette ont disparu, faute de source** : la table
 * `evaluations` ne porte que `module_id`, `session_id`, `type_eval`,
 * `designation`, `ponderation` et `date_prevue`. Il n'y a **ni heure, ni durée,
 * ni salle, ni classe**. Les afficher aurait supposé de les inventer, comme le
 * faisait la version précédente. Elles cèdent la place au module, à la session
 * et à la pondération, qui, eux, existent.
 *
 * De même, les filtres « Filière » et « Classe » n'ont pas de source : une
 * épreuve porte sur un *module*, pas sur une classe. Le filtre par session les
 * remplace.
 */

const epreuveStore = useEpreuveStore();
const sessionStore = useSessionStore();

const { items: epreuves, loading } = storeToRefs(epreuveStore);
const { items: sessions } = storeToRefs(sessionStore);

const filters = reactive({ sessionId: '', typeEval: '', search: '' });

onMounted(() => {
  epreuveStore.fetchAll();
  sessionStore.fetchAll();
});

/** Les sessions du type demandé (normale ou rattrapage). */
const sessionsDuType = computed(() =>
  sessions.value.filter((session) => session.type_session === props.typeSession)
);

const idsSessions = computed(() => new Set(sessionsDuType.value.map((session) => session.id)));

const filtered = computed(() => {
  const search = filters.search.toLowerCase().trim();

  return epreuves.value.filter((epreuve) => {
    if (!idsSessions.value.has(epreuve.session_id)) return false;
    if (filters.sessionId && epreuve.session_id !== filters.sessionId) return false;
    if (filters.typeEval && epreuve.type_eval !== filters.typeEval) return false;

    if (!search) return true;

    return [epreuve.designation, epreuve.code_module, epreuve.designation_module]
      .filter(Boolean)
      .some((field) => String(field).toLowerCase().includes(search));
  });
});

/**
 * Chronologique. Les épreuves sans `date_prevue` — la seule colonne nullable de
 * la table — sont reléguées en fin de liste plutôt que triées comme si elles
 * tombaient au 1ᵉʳ janvier 1970.
 */
const sorted = computed(() =>
  [...filtered.value].sort((a, b) => {
    if (!a.date_prevue) return 1;
    if (!b.date_prevue) return -1;
    return new Date(a.date_prevue) - new Date(b.date_prevue);
  })
);

const estRattrapage = computed(() => props.typeSession === 'RATTRAPAGE');

const libelleType = computed(() => (estRattrapage.value ? 'Rattrapage' : 'Session normale'));

/**
 * Le planning complet compte plusieurs centaines de lignes — 675 épreuves pour
 * une seule session du jeu de démonstration. Il était rendu d'un bloc.
 */
const { page, itemsPerPage, startIndex, paginated } = usePagination(sorted, {
  perPage: 15,
  resetKey: () => [filters.sessionId, filters.typeEval, filters.search],
});

/** La session retenue dans le filtre, quand il y en a une. */
const sessionFiltree = computed(() =>
  sessionsDuType.value.find((session) => session.id === filters.sessionId)
);

/**
 * Publication officielle du calendrier.
 *
 * L'export porte sur **la sélection affichée**, pas sur la page : un calendrier
 * publié amputé de ses pages suivantes serait pire que pas de calendrier. Les
 * métadonnées (périmètre, session, date d'édition) accompagnent le document —
 * c'est ce qui distingue une pièce affichable d'un tableau exporté à la volée.
 */
const { exportToExcel, exportToPdf } = useTableExport({
  rows: computed(() =>
    sorted.value.map((epreuve, index) => ({
      'N°': index + 1,
      'Date prévue': formatDate(epreuve.date_prevue, 'Non planifiée'),
      Session: epreuve.code_session ?? '—',
      Matière: epreuve.designation_module ?? '—',
      Code: epreuve.code_module ?? '—',
      Épreuve: epreuve.designation,
      Type: typeEpreuveLabel(epreuve.type_eval),
      Pondération: `${Number(epreuve.ponderation)} %`,
    }))
  ),
  title: `Calendrier officiel des épreuves — ${libelleType.value}`,
  fileBaseName: `calendrier_epreuves_${estRattrapage.value ? 'rattrapage' : 'normale'}`,
  filters: () => [
    { label: 'Périmètre', value: libelleType.value },
    { label: 'Session', value: sessionFiltree.value?.designation ?? 'Toutes les sessions' },
    {
      label: "Type d'épreuve",
      value: TYPES_EPREUVE.find((type) => type.code === filters.typeEval)?.label ?? 'Tous',
    },
    { label: 'Épreuves publiées', value: sorted.value.length },
    { label: "Date d'édition", value: new Date().toLocaleDateString('fr-FR') },
  ],
});

const { openCreate } = useEpreuveForm();

const ouvrirImport = () => openModal(PLANNING_IMPORT_MODAL_ID);
</script>

<template>
  <div>
    <div class="row align-items-center mb-3 g-2">
      <div class="col-lg-6">
        <h4 class="fw-bold text-dark mb-1">Planification — {{ libelleType }}</h4>
        <p class="text-muted small mb-0">
          Visualisation chronologique des épreuves, d'après leur date prévue.
        </p>
      </div>

      <div class="col-lg-6 d-flex justify-content-lg-end align-items-center gap-2 flex-wrap">
        <!-- Publication officielle : le document reprend la sélection entière,
             pas la page affichée. -->
        <ExportMenu
          label="Publier le calendrier"
          :disabled="sorted.length === 0"
          @excel="exportToExcel"
          @pdf="exportToPdf"
        />

        <div class="btn-group" role="group" aria-label="Ajouter des épreuves">
          <button type="button" class="btn btn-sm btn-primary" @click="openCreate">
            <i class="bi bi-calendar-plus me-1"></i> Planifier une épreuve
          </button>
          <button type="button" class="btn btn-sm btn-outline-primary" @click="ouvrirImport">
            <i class="bi bi-file-earmark-arrow-up me-1"></i> Importer un planning
          </button>
        </div>
      </div>
    </div>

    <div class="card border-0 shadow-sm p-3 mb-4 bg-white">
      <div class="row g-3">
        <div class="col-12 col-sm-6 col-md-4">
          <label class="form-label text-xs fw-semibold text-muted mb-1">Session</label>
          <select v-model="filters.sessionId" class="form-select form-select-sm text-secondary">
            <option value="">Toutes les sessions</option>
            <option v-for="session in sessionsDuType" :key="session.id" :value="session.id">
              {{ session.code }} — {{ session.designation }}
            </option>
          </select>
        </div>

        <div class="col-12 col-sm-6 col-md-4">
          <label class="form-label text-xs fw-semibold text-muted mb-1">Type d'épreuve</label>
          <select v-model="filters.typeEval" class="form-select form-select-sm text-secondary">
            <option value="">Tous les types</option>
            <option v-for="type in TYPES_EPREUVE" :key="type.code" :value="type.code">
              {{ type.label }}
            </option>
          </select>
        </div>

        <div class="col-12 col-md-4">
          <label class="form-label text-xs fw-semibold text-muted mb-1">Recherche rapide</label>
          <div class="input-group input-group-sm">
            <span class="input-group-text bg-white">
              <i class="bi bi-search text-muted"></i>
            </span>
            <input
              v-model="filters.search"
              type="text"
              class="form-control"
              placeholder="Code matière, désignation..."
            />
          </div>
        </div>
      </div>
    </div>

    <div class="row">
      <div class="col-md-12">
        <div class="card border-0 shadow-sm bg-white">
          <div
            class="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center"
          >
            <h6 class="fw-bold text-dark mb-0">
              <i class="bi bi-calendar3 me-2 text-primary"></i>Planning des épreuves planifiées
            </h6>
            <span class="badge bg-primary-subtle text-primary text-xs px-2 py-1">
              {{ sorted.length }} Épreuve(s) trouvée(s)
            </span>
          </div>

          <div class="card-body p-0">
            <LoadingSpinner v-if="loading" />

            <div v-else-if="sorted.length === 0" class="text-center p-5 text-muted">
              <i class="bi bi-calendar-x d-block mb-3 fs-1 text-secondary"></i>
              <h5 class="fw-bold">Aucune épreuve planifiée</h5>
              <p class="small mx-auto">
                Aucune épreuve ne correspond aux critères, ou aucune n'a encore été créée pour cette
                session.
              </p>
            </div>

            <div v-else class="table-responsive">
              <table class="table table-hover align-middle mb-0 text-sm">
                <thead class="table-light text-secondary text-uppercase text-xs">
                  <tr>
                    <th class="ps-4" style="width: 60px">#</th>
                    <th>Date prévue</th>
                    <th>Matière</th>
                    <th>Épreuve</th>
                    <th>Type</th>
                    <th class="text-center">Pondération</th>
                    <th class="pe-4">Session</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(epreuve, index) in paginated"
                    :key="epreuve.id"
                    :class="{ 'table-warning-subtle': estRattrapage }"
                  >
                    <td class="ps-4 text-muted">{{ startIndex + index + 1 }}</td>

                    <td>
                      <div class="fw-bold text-dark">
                        {{ formatDate(epreuve.date_prevue, 'Non planifiée') }}
                      </div>
                    </td>

                    <td>
                      <div class="fw-semibold text-dark">
                        {{ epreuve.designation_module ?? '—' }}
                      </div>
                      <small class="text-muted font-monospace text-xs">
                        {{ epreuve.code_module ?? '' }}
                      </small>
                    </td>

                    <td>{{ epreuve.designation }}</td>

                    <td>
                      <span
                        class="badge text-xs"
                        :class="
                          estRattrapage
                            ? 'bg-warning-subtle text-warning'
                            : 'bg-success-subtle text-success'
                        "
                      >
                        {{ typeEpreuveLabel(epreuve.type_eval) }}
                      </span>
                    </td>

                    <td class="text-center">{{ Number(epreuve.ponderation) }} %</td>

                    <td class="pe-4">
                      <span class="badge bg-light text-dark border fw-medium">
                        {{ epreuve.code_session ?? '—' }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div v-if="sorted.length" class="px-4 py-3 border-top">
              <Pagination
                v-model="page"
                v-model:items-per-page="itemsPerPage"
                :total-items="sorted.length"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Planification unitaire : la session se choisit dans la modale, cet écran
         n'en fixant aucune. Le type d'onglet restreint la liste proposée. -->
    <EpreuveFormModal :type-session="typeSession" />
    <PlanningImportModal />
  </div>
</template>

<style scoped>
.text-xs {
  font-size: 11px;
}
.text-sm {
  font-size: 0.875rem;
}
</style>
