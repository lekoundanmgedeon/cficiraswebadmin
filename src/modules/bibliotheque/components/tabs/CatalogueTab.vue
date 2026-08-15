<script setup>
import { computed, onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import ItemActions from '@/shared/components/ItemActions.vue';
import ExportMenu from '@/shared/components/ExportMenu.vue';
import EmptyState from '@/shared/components/EmptyState.vue';
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue';
import Pagination from '@/components/shared/Pagination.vue';
import { useTableExport } from '@/shared/composables/useTableExport';
import { usePagination } from '@/shared/composables/usePagination';
import { useBibliothequeStore } from '../../store';
import { useOuvrageForm } from '../../composables/useOuvrageForm';
import { disponibiliteInfo, typeOuvrageLabel, TYPES_OUVRAGE } from '../../constants';

/**
 * Le catalogue : ce que l'établissement possède, et ce qui reste en rayon.
 *
 * La disponibilité vient de la vue `v_ouvrages_catalogue`, qui la dérive des
 * compteurs. L'écran ne la recalcule pas et n'en stocke pas de copie.
 *
 * Le filtrage est appliqué **en mémoire** : le catalogue tient en une lecture,
 * mise en cache par le store, et un aller-retour réseau par frappe au clavier
 * n'apporterait rien.
 */

const store = useBibliothequeStore();
const { items: ouvrages, loading } = storeToRefs(store);
const { openCreate, openEdit } = useOuvrageForm();

const recherche = ref('');
const categorie = ref('');
const type = ref('');
const disponiblesSeulement = ref(false);

onMounted(() => store.fetchAll());

const filtres = computed(() => {
  const terme = recherche.value.trim().toLowerCase();

  return ouvrages.value.filter((ouvrage) => {
    if (categorie.value && ouvrage.categorie !== categorie.value) return false;
    if (type.value && ouvrage.type_ouvrage !== type.value) return false;
    if (disponiblesSeulement.value && Number(ouvrage.nb_disponibles) === 0) return false;
    if (!terme) return true;

    return [ouvrage.titre, ouvrage.auteur, ouvrage.cote, ouvrage.isbn]
      .filter(Boolean)
      .some((champ) => String(champ).toLowerCase().includes(terme));
  });
});

// Le catalogue grandit à chaque acquisition ; il était rendu d'un bloc. La page
// revient à 1 dès qu'un filtre change — sans quoi filtrer depuis la page 3
// laisserait devant un tableau vide.
const { page, itemsPerPage, startIndex, paginated } = usePagination(filtres, {
  perPage: 15,
  resetKey: () => [recherche.value, categorie.value, type.value, disponiblesSeulement.value],
});

const { exportToExcel, exportToPdf } = useTableExport({
  rows: computed(() =>
    filtres.value.map((ouvrage, index) => ({
      'N°': index + 1,
      Cote: ouvrage.cote,
      Titre: ouvrage.titre,
      Auteur: ouvrage.auteur,
      Type: typeOuvrageLabel(ouvrage.type_ouvrage),
      Catégorie: ouvrage.categorie || '—',
      Éditeur: ouvrage.editeur || '—',
      Année: ouvrage.annee_publication || '—',
      Disponibles: `${ouvrage.nb_disponibles} / ${ouvrage.nb_exemplaires}`,
    }))
  ),
  title: 'Catalogue de la bibliothèque',
  fileBaseName: 'catalogue_bibliotheque',
});

const actions = [
  { key: 'edit', label: 'Modifier', icon: 'mdi-pencil-outline' },
  {
    key: 'delete',
    label: 'Retirer du catalogue',
    icon: 'mdi-delete-outline',
    variant: 'danger',
    divider: true,
    confirm: {
      title: 'Retirer cet ouvrage',
      message: 'L’ouvrage sera retiré du catalogue. Cette action est définitive.',
      confirmLabel: 'Retirer',
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
        <h4 class="mb-1">Ouvrages disponibles</h4>
        <p class="mb-0 text-muted small">
          Fonds documentaire de l'établissement : livres, revues et documents acquis.
        </p>
      </div>
      <div class="d-flex gap-2">
        <ExportMenu :disabled="!filtres.length" @excel="exportToExcel" @pdf="exportToPdf" />
        <button class="btn btn-sm btn-primary" type="button" @click="openCreate">
          + Ajouter un ouvrage
        </button>
      </div>
    </div>

    <!-- Indicateurs du fonds -->
    <div class="row g-3 mb-3">
      <div class="col-6 col-lg-3">
        <div class="card border-0 shadow-sm p-3 border-start border-primary border-3">
          <span class="text-muted small text-uppercase d-block mb-1">Titres</span>
          <span class="fw-bold font-monospace fs-5">{{ store.indicateurs.nbTitres }}</span>
        </div>
      </div>
      <div class="col-6 col-lg-3">
        <div class="card border-0 shadow-sm p-3 border-start border-success border-3">
          <span class="text-muted small text-uppercase d-block mb-1">Exemplaires</span>
          <span class="fw-bold font-monospace fs-5">{{ store.indicateurs.exemplaires }}</span>
        </div>
      </div>
      <div class="col-6 col-lg-3">
        <div class="card border-0 shadow-sm p-3 border-start border-info border-3">
          <span class="text-muted small text-uppercase d-block mb-1">En rayon</span>
          <span class="fw-bold font-monospace fs-5">{{ store.indicateurs.disponibles }}</span>
        </div>
      </div>
      <div class="col-6 col-lg-3">
        <div class="card border-0 shadow-sm p-3 border-start border-warning border-3">
          <span class="text-muted small text-uppercase d-block mb-1">Titres épuisés</span>
          <span class="fw-bold font-monospace fs-5">{{ store.indisponibles.length }}</span>
        </div>
      </div>
    </div>

    <!-- Filtres -->
    <div class="row g-2 align-items-end mb-3">
      <div class="col-md-4">
        <label for="biblio-recherche" class="form-label small fw-semibold text-secondary">
          Rechercher
        </label>
        <input
          id="biblio-recherche"
          v-model="recherche"
          type="search"
          class="form-control form-control-sm"
          placeholder="Titre, auteur, cote ou ISBN"
        />
      </div>
      <div class="col-md-3">
        <label for="biblio-categorie" class="form-label small fw-semibold text-secondary">
          Catégorie
        </label>
        <select id="biblio-categorie" v-model="categorie" class="form-select form-select-sm">
          <option value="">Toutes</option>
          <option v-for="valeur in store.categories" :key="valeur" :value="valeur">
            {{ valeur }}
          </option>
        </select>
      </div>
      <div class="col-md-3">
        <label for="biblio-type" class="form-label small fw-semibold text-secondary">Type</label>
        <select id="biblio-type" v-model="type" class="form-select form-select-sm">
          <option value="">Tous</option>
          <option v-for="item in TYPES_OUVRAGE" :key="item.code" :value="item.code">
            {{ item.label }}
          </option>
        </select>
      </div>
      <div class="col-md-2">
        <div class="form-check">
          <input
            id="biblio-dispo"
            v-model="disponiblesSeulement"
            class="form-check-input"
            type="checkbox"
          />
          <label class="form-check-label small" for="biblio-dispo">En rayon seulement</label>
        </div>
      </div>
    </div>

    <LoadingSpinner v-if="loading && !ouvrages.length" />

    <EmptyState
      v-else-if="!ouvrages.length"
      title="Catalogue vide"
      description="Aucun ouvrage n'est encore enregistré. Ajoutez-en un depuis le bouton ci-dessus."
    />

    <EmptyState
      v-else-if="!filtres.length"
      title="Aucun ouvrage ne correspond"
      description="Élargissez la recherche ou retirez un filtre."
      :size="80"
    />

    <div v-else class="table-responsive card border-0 shadow-sm">
      <table class="table table-hover align-middle mb-0">
        <thead class="table-light">
          <tr>
            <th class="ps-3" style="width: 60px">#</th>
            <th>Cote</th>
            <th>Titre</th>
            <th>Auteur</th>
            <th>Type</th>
            <th class="text-center">Exemplaires</th>
            <th>Disponibilité</th>
            <th class="text-end pe-3"><span class="visually-hidden">Actions</span></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(ouvrage, index) in paginated" :key="ouvrage.id">
            <td class="ps-3 text-muted small">{{ startIndex + index + 1 }}</td>
            <td>
              <span class="badge bg-light text-dark border font-monospace">{{ ouvrage.cote }}</span>
            </td>
            <td class="fw-semibold text-dark">
              {{ ouvrage.titre }}
              <span v-if="ouvrage.annee_publication" class="text-muted small">
                ({{ ouvrage.annee_publication }})
              </span>
            </td>
            <td>{{ ouvrage.auteur }}</td>
            <td class="small text-muted">{{ typeOuvrageLabel(ouvrage.type_ouvrage) }}</td>
            <td class="text-center font-monospace">
              {{ ouvrage.nb_disponibles }} / {{ ouvrage.nb_exemplaires }}
            </td>
            <td>
              <span
                class="badge"
                :class="`bg-${disponibiliteInfo(ouvrage.disponibilite).variant}-subtle text-${disponibiliteInfo(ouvrage.disponibilite).variant}`"
              >
                {{ disponibiliteInfo(ouvrage.disponibilite).label }}
              </span>
            </td>
            <td class="text-end pe-3">
              <ItemActions
                :item="ouvrage"
                :label="ouvrage.titre"
                :actions="actions"
                @action="onAction"
              />
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
  </div>
</template>
