<script setup>
import { computed, onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import ItemActions from '@/shared/components/ItemActions.vue';
import ExportMenu from '@/shared/components/ExportMenu.vue';
import EmptyState from '@/shared/components/EmptyState.vue';
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue';
import Pagination from '@/components/shared/Pagination.vue';
import { usePagination } from '@/shared/composables/usePagination';
import { useTableExport } from '@/shared/composables/useTableExport';
import { formatDate } from '@/shared/utils/date';
import { useSoutenanceStore } from '../../store';
import { useSoutenanceForm } from '../../composables/useSoutenanceForm';
import { STATUT_SOUTENANCE_LIST, statutPvInfo, statutSoutenanceInfo } from '../../../constants';

/**
 * Planning des soutenances : le jour, l'heure, la salle et l'état du dossier.
 *
 * Les soutenances sont groupées **par jour** : c'est ainsi qu'on organise une
 * session, pas en liste continue. Le jury et le procès-verbal se consultent
 * dans l'onglet « Dossiers », où le détail est chargé à la demande.
 */

const store = useSoutenanceStore();
const { items: soutenances, loading, statistiques } = storeToRefs(store);
const { openCreate, openEdit } = useSoutenanceForm();

const recherche = ref('');
const statut = ref('');

onMounted(() => Promise.all([store.fetchAll(), store.fetchStatistiques()]));

const filtres = computed(() => {
  const terme = recherche.value.trim().toLowerCase();

  return soutenances.value.filter((soutenance) => {
    if (statut.value && soutenance.statut !== statut.value) return false;
    if (!terme) return true;

    return [soutenance.theme, soutenance.nom, soutenance.prenom, soutenance.matricule]
      .filter(Boolean)
      .some((champ) => String(champ).toLowerCase().includes(terme));
  });
});

/** Regroupement par date : une session se lit par journée. */
const jourDe = (soutenance) => String(soutenance.date_soutenance ?? '').slice(0, 10);

/**
 * Le planning, à plat, dans l'ordre où il s'affiche : jour le plus récent
 * d'abord, puis par horaire. C'est cette liste que l'on pagine — et non les
 * journées : une session de soutenances tient couramment sur **une seule
 * journée** (208 sur le même jour dans le jeu de démonstration), si bien que
 * paginer par jour ne découperait rien du tout.
 */
const triees = computed(() =>
  [...filtres.value].sort((a, b) => {
    const parJour = jourDe(b).localeCompare(jourDe(a));
    if (parJour !== 0) return parJour;
    return String(a.heure_debut).localeCompare(String(b.heure_debut));
  })
);

const { page, itemsPerPage, paginated } = usePagination(triees, {
  perPage: 20,
  resetKey: () => [recherche.value, statut.value],
});

/** Nombre total de séances par journée, toutes pages confondues. */
const totalParJour = computed(() => {
  const compteur = new Map();
  for (const soutenance of triees.value) {
    const jour = jourDe(soutenance);
    compteur.set(jour, (compteur.get(jour) ?? 0) + 1);
  }
  return compteur;
});

/**
 * Le regroupement porte sur la **page** affichée, et non sur la collection
 * entière : grouper d'abord puis paginer aurait coupé une journée sans jamais
 * en montrer la suite. L'en-tête dit alors combien de séances de la journée sont
 * visibles ici, sur son total.
 */
const journees = computed(() => {
  const parJour = new Map();

  for (const soutenance of paginated.value) {
    const jour = jourDe(soutenance);
    if (!parJour.has(jour)) parJour.set(jour, []);
    parJour.get(jour).push(soutenance);
  }

  return [...parJour.entries()].map(([jour, seances]) => ({
    jour,
    seances,
    total: totalParJour.value.get(jour) ?? seances.length,
  }));
});

const heure = (valeur) => String(valeur ?? '').slice(0, 5);

const { exportToExcel, exportToPdf } = useTableExport({
  rows: computed(() =>
    filtres.value.map((soutenance, index) => ({
      'N°': index + 1,
      Date: formatDate(soutenance.date_soutenance),
      Horaire: `${heure(soutenance.heure_debut)} – ${heure(soutenance.heure_fin)}`,
      Étudiant: `${soutenance.nom} ${soutenance.prenom}`,
      Matricule: soutenance.matricule,
      Sujet: soutenance.theme,
      Salle: soutenance.code_salle || 'À définir',
      Jury: soutenance.nb_jurys,
      Statut: statutSoutenanceInfo(soutenance.statut).label,
      'Procès-verbal': soutenance.pv_numero || 'Aucun',
    }))
  ),
  title: 'Planning des soutenances',
  fileBaseName: 'planning_soutenances',
});

const actions = [
  { key: 'edit', label: 'Modifier', icon: 'mdi-pencil-outline' },
  {
    key: 'delete',
    label: 'Supprimer',
    icon: 'mdi-delete-outline',
    variant: 'danger',
    divider: true,
    confirm: {
      title: 'Supprimer la soutenance',
      message:
        'La soutenance, son jury et son procès-verbal seront supprimés. Le mémoire, lui, est conservé.',
      confirmLabel: 'Supprimer',
      variant: 'danger',
    },
  },
];

/** @param {{key: string, item: any}} event */
function onAction({ key, item }) {
  if (key === 'edit') openEdit(item);
  if (key === 'delete') store.remove(item.id);
}
</script>

<template>
  <div>
    <div class="d-flex justify-content-between align-items-start mb-3 flex-wrap gap-2">
      <div>
        <h4 class="mb-1">Planning des soutenances</h4>
        <p class="mb-0 text-muted small">
          Jour, horaire, salle et jury. Le dossier complet se consulte dans l'onglet « Dossiers ».
        </p>
      </div>
      <div class="d-flex gap-2">
        <ExportMenu :disabled="!filtres.length" @excel="exportToExcel" @pdf="exportToPdf" />
        <button class="btn btn-sm btn-primary" type="button" @click="openCreate">
          + Planifier une soutenance
        </button>
      </div>
    </div>

    <div v-if="statistiques" class="row g-3 mb-3">
      <div class="col-6 col-lg-3">
        <div class="card border-0 shadow-sm p-3 border-start border-primary border-3">
          <span class="text-muted small text-uppercase d-block mb-1">À venir</span>
          <span class="fw-bold font-monospace fs-5">{{ statistiques.a_venir }}</span>
        </div>
      </div>
      <div class="col-6 col-lg-3">
        <div class="card border-0 shadow-sm p-3 border-start border-success border-3">
          <span class="text-muted small text-uppercase d-block mb-1">Tenues</span>
          <span class="fw-bold font-monospace fs-5">{{ statistiques.tenues }}</span>
        </div>
      </div>
      <div class="col-6 col-lg-3">
        <div class="card border-0 shadow-sm p-3 border-start border-warning border-3">
          <span class="text-muted small text-uppercase d-block mb-1">Sans procès-verbal</span>
          <span class="fw-bold font-monospace fs-5">{{ statistiques.sans_pv }}</span>
        </div>
      </div>
      <div class="col-6 col-lg-3">
        <div class="card border-0 shadow-sm p-3 border-start border-danger border-3">
          <span class="text-muted small text-uppercase d-block mb-1">Reportées / annulées</span>
          <span class="fw-bold font-monospace fs-5">
            {{ statistiques.reportees + statistiques.annulees }}
          </span>
        </div>
      </div>
    </div>

    <div class="row g-2 align-items-end mb-3">
      <div class="col-md-6">
        <label for="soutenance-recherche" class="form-label small fw-semibold text-secondary">
          Rechercher
        </label>
        <input
          id="soutenance-recherche"
          v-model="recherche"
          type="search"
          class="form-control form-control-sm"
          placeholder="Étudiant, sujet ou matricule"
        />
      </div>
      <div class="col-md-4">
        <label for="soutenance-statut" class="form-label small fw-semibold text-secondary">
          Statut
        </label>
        <select id="soutenance-statut" v-model="statut" class="form-select form-select-sm">
          <option value="">Tous</option>
          <option v-for="item in STATUT_SOUTENANCE_LIST" :key="item.code" :value="item.code">
            {{ item.label }}
          </option>
        </select>
      </div>
    </div>

    <LoadingSpinner v-if="loading && !soutenances.length" />

    <EmptyState
      v-else-if="!soutenances.length"
      title="Aucune soutenance planifiée"
      description="Planifiez la première depuis le bouton ci-dessus : elle part d'un mémoire attribué."
    />

    <EmptyState
      v-else-if="!filtres.length"
      title="Aucune soutenance ne correspond"
      description="Élargissez la recherche ou retirez le filtre de statut."
      :size="80"
    />

    <div v-else>
      <div v-for="journee in journees" :key="journee.jour" class="mb-4">
        <h6 class="text-uppercase text-secondary small fw-bold mb-2">
          <i class="bi bi-calendar-event me-1"></i>
          {{ formatDate(journee.jour) }}
          <span class="text-muted fw-normal">
            — {{ journee.seances.length }} soutenance(s)
            <template v-if="journee.total !== journee.seances.length">
              affichée(s) sur {{ journee.total }}
            </template>
          </span>
        </h6>

        <div class="table-responsive card border-0 shadow-sm">
          <table class="table table-hover align-middle mb-0">
            <thead class="table-light">
              <tr>
                <th class="ps-3" style="width: 130px">Horaire</th>
                <th>Étudiant</th>
                <th>Sujet</th>
                <th style="width: 120px">Salle</th>
                <th class="text-center" style="width: 80px">Jury</th>
                <th style="width: 130px">Statut</th>
                <th style="width: 150px">Procès-verbal</th>
                <th class="text-end pe-3"><span class="visually-hidden">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="seance in journee.seances" :key="seance.id">
                <td class="ps-3 font-monospace small">
                  {{ heure(seance.heure_debut) }} – {{ heure(seance.heure_fin) }}
                </td>
                <td>
                  <span class="fw-semibold text-dark d-block">
                    {{ seance.nom }} {{ seance.prenom }}
                  </span>
                  <span class="text-muted small">{{ seance.filiere }}</span>
                </td>
                <td class="small">{{ seance.theme }}</td>
                <td>
                  <span v-if="seance.code_salle" class="badge bg-light text-dark border">
                    {{ seance.code_salle }}
                  </span>
                  <span v-else class="text-muted small">à définir</span>
                </td>
                <td class="text-center">
                  <span
                    class="badge"
                    :class="
                      seance.nb_jurys > 0
                        ? 'bg-secondary-subtle text-secondary'
                        : 'bg-warning-subtle text-warning'
                    "
                  >
                    {{ seance.nb_jurys }}
                  </span>
                </td>
                <td>
                  <span
                    class="badge"
                    :class="`bg-${statutSoutenanceInfo(seance.statut).variant}-subtle text-${statutSoutenanceInfo(seance.statut).variant}`"
                  >
                    {{ statutSoutenanceInfo(seance.statut).label }}
                  </span>
                </td>
                <td>
                  <span
                    class="badge"
                    :class="`bg-${statutPvInfo(seance.pv_statut).variant}-subtle text-${statutPvInfo(seance.pv_statut).variant}`"
                  >
                    {{ statutPvInfo(seance.pv_statut).label }}
                  </span>
                  <span
                    v-if="seance.pv_numero"
                    class="d-block text-muted font-monospace"
                    style="font-size: 10px"
                  >
                    {{ seance.pv_numero }}
                  </span>
                </td>
                <td class="text-end pe-3">
                  <ItemActions
                    :item="seance"
                    :label="`la soutenance de ${seance.nom}`"
                    :actions="actions"
                    @action="onAction"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <Pagination
        v-model="page"
        v-model:items-per-page="itemsPerPage"
        :total-items="triees.length"
      />
    </div>
  </div>
</template>
