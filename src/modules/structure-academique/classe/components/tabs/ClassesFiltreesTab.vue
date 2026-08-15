<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import ItemActions from '@/shared/components/ItemActions.vue';
import ExportMenu from '@/shared/components/ExportMenu.vue';
import EmptyState from '@/shared/components/EmptyState.vue';
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue';
import Pagination from '@/components/shared/Pagination.vue';
import { useTableExport } from '@/shared/composables/useTableExport';
import { usePagination } from '@/shared/composables/usePagination';
import { useClasseStore } from '../../store';
import { useClasseForm } from '../../composables/useClasseForm';
import { useFiliereStore } from '../../../filiere/store';
import { useNiveauStore } from '../../../niveau/store';

/**
 * Classes d'une filière, ou classes d'un niveau.
 *
 * Les onglets « Filières » et « Niveaux » de l'écran des classes affichaient les
 * annuaires des deux autres écrans : on y administrait des filières et des
 * niveaux, jamais des classes. Ils **filtrent** désormais les classes sur la
 * dimension choisie — c'est la question qu'on se pose depuis cet écran.
 *
 * ### Pourquoi le filtre est appliqué en mémoire
 *
 * `GET /classes/filiere/:id` et `GET /classes/niveau/:id` existent, mais elles
 * lisent `v_classes_par_filiere` / `v_classes_par_niveau`, qui ne sont que
 * `classe.*` plus une étiquette : **ni `nb_etudiants`, ni capacité comparable**.
 * Les employer afficherait un effectif de 0 partout — un chiffre faux plutôt
 * qu'un chiffre absent. `GET /classes` sert `v_classes_effectifs`, qui porte
 * `filiere_id`, `niveau_id` **et** l'effectif de l'année active : le filtre s'y
 * applique sans requête supplémentaire, et sans mentir sur les effectifs.
 *
 * Second motif : `fetchByFiliere()` / `fetchByNiveau()` **remplacent `items`**,
 * la collection que lit aussi l'onglet « Liste des classes ». Filtrer ici aurait
 * amputé la liste là-bas.
 */

const props = defineProps({
  /** Dimension du filtre : `filiere` ou `niveau`. */
  dimension: {
    type: String,
    default: 'filiere',
    validator: (valeur) => ['filiere', 'niveau'].includes(valeur),
  },
});

const classeStore = useClasseStore();
const filiereStore = useFiliereStore();
const niveauStore = useNiveauStore();
const { openEdit } = useClasseForm();

const { items: classes, loading } = storeToRefs(classeStore);
const { items: filieres } = storeToRefs(filiereStore);
const { items: niveaux } = storeToRefs(niveauStore);

const parFiliere = computed(() => props.dimension === 'filiere');
const selectedId = ref('');

/** Libellés de l'écran, seul point qui distingue vraiment les deux dimensions. */
const libelles = computed(() =>
  parFiliere.value
    ? {
        titre: 'Classes par filière',
        sousTitre: 'Choisissez une filière pour n’afficher que ses classes.',
        label: 'Filière',
        colonne: 'Niveau',
        vide: 'Aucune filière enregistrée',
        videDescription: 'Créez une filière avant de lui rattacher des classes.',
        fichier: 'classes_par_filiere',
      }
    : {
        titre: 'Classes par niveau',
        sousTitre: 'Choisissez un niveau pour n’afficher que ses classes.',
        label: 'Niveau',
        colonne: 'Filière',
        vide: 'Aucun niveau enregistré',
        videDescription: 'Créez un niveau avant de lui rattacher des classes.',
        fichier: 'classes_par_niveau',
      }
);

/** La clé de rattachement portée par chaque classe. */
const cleClasse = computed(() => (parFiliere.value ? 'filiere_id' : 'niveau_id'));

/** Nombre de classes par filière / par niveau, pour l'afficher dans le sélecteur. */
const nbClassesParId = computed(() => {
  const compteur = new Map();
  for (const classe of classes.value) {
    const cle = String(classe[cleClasse.value]);
    compteur.set(cle, (compteur.get(cle) ?? 0) + 1);
  }
  return compteur;
});

const options = computed(() => {
  const source = parFiliere.value
    ? filieres.value.map((filiere) => ({
        id: filiere.id,
        libelle: filiere.designation,
        detail: [filiere.code, filiere.cycle_nom].filter(Boolean).join(' · '),
      }))
    : // Un niveau n'a pas de désignation en base : son code (L1, M2…) *est* son
      // libellé, et `ordre` sa position dans le cycle.
      niveaux.value.map((niveau) => ({
        id: niveau.id,
        libelle: niveau.code,
        detail: [niveau.cycle_code, niveau.ordre ? `${niveau.ordre}e année` : null]
          .filter(Boolean)
          .join(' · '),
      }));

  return source.map((option) => ({
    ...option,
    nbClasses: nbClassesParId.value.get(String(option.id)) ?? 0,
  }));
});

const selection = computed(() =>
  options.value.find((option) => String(option.id) === String(selectedId.value))
);

const classesFiltrees = computed(() => {
  if (!selectedId.value) return [];
  return classes.value.filter(
    (classe) => String(classe[cleClasse.value]) === String(selectedId.value)
  );
});

// La page revient à 1 quand on change de filière ou de niveau : la page 3 de la
// sélection précédente n'a aucun sens pour la suivante.
const { page, itemsPerPage, startIndex, paginated } = usePagination(classesFiltrees, {
  perPage: 10,
  resetKey: () => selectedId.value,
});

const nombre = (valeur) => Number(valeur ?? 0) || 0;

const totaux = computed(() => {
  const effectif = classesFiltrees.value.reduce(
    (somme, classe) => somme + nombre(classe.nb_etudiants),
    0
  );
  const capacite = classesFiltrees.value.reduce(
    (somme, classe) => somme + nombre(classe.capacite_max),
    0
  );

  return {
    nbClasses: classesFiltrees.value.length,
    effectif,
    capacite,
    placesRestantes: Math.max(capacite - effectif, 0),
    taux: capacite > 0 ? (effectif / capacite) * 100 : 0,
  };
});

/** @param {any} classe */
const tauxClasse = (classe) => {
  const capacite = nombre(classe.capacite_max);
  return capacite > 0 ? (nombre(classe.nb_etudiants) / capacite) * 100 : 0;
};

/** @param {number} taux */
const barreTaux = (taux) => {
  if (taux >= 100) return 'bg-danger';
  if (taux >= 85) return 'bg-warning';
  if (taux >= 40) return 'bg-success';
  return 'bg-info';
};

const { exportToExcel, exportToPdf } = useTableExport({
  rows: computed(() =>
    classesFiltrees.value.map((classe, index) => ({
      'N°': index + 1,
      Code: classe.code,
      [libelles.value.colonne]: (parFiliere.value ? classe.niveau_code : classe.filiere_nom) || '—',
      Effectif: nombre(classe.nb_etudiants),
      'Capacité max': nombre(classe.capacite_max),
      Remplissage: `${tauxClasse(classe).toFixed(1)} %`,
    }))
  ),
  // La dimension est fixée par la prop, à la création de l'onglet : le titre et
  // le nom de fichier ne changent plus ensuite.
  title: libelles.value.titre,
  fileBaseName: libelles.value.fichier,
  filters: () => [
    { label: libelles.value.label, value: selection.value?.libelle ?? '—' },
    { label: 'Classes', value: totaux.value.nbClasses },
    { label: 'Effectif', value: totaux.value.effectif },
    { label: 'Capacité', value: totaux.value.capacite },
  ],
});

const actions = [
  { key: 'edit', label: 'Modifier', icon: 'mdi-pencil-outline' },
  {
    key: 'delete',
    label: 'Supprimer',
    icon: 'mdi-delete-outline',
    variant: 'danger',
    divider: true,
    confirm: { title: 'Confirmation de suppression' },
  },
];

/** @param {{key: string, item: any}} event */
function onAction({ key, item }) {
  if (key === 'edit') openEdit(item);
  if (key === 'delete') classeStore.remove(item.id);
}

onMounted(async () => {
  // Les deux listes sont servies par le cache de leur store si un autre onglet
  // les a déjà chargées : ouvrir celui-ci ne coûte alors aucune requête.
  await Promise.all([
    classeStore.fetchAll(),
    parFiliere.value ? filiereStore.fetchAll() : niveauStore.fetchAll(),
  ]);
});

// Première option sélectionnée d'office : un écran vide n'apprend rien.
watch(
  options,
  (liste) => {
    if (!selection.value) selectedId.value = liste[0]?.id ?? '';
  },
  { immediate: true }
);
</script>

<template>
  <div>
    <div class="d-flex justify-content-between align-items-start mb-3 flex-wrap gap-2">
      <div>
        <h4 class="mb-1">{{ libelles.titre }}</h4>
        <p class="mb-0 text-muted small">{{ libelles.sousTitre }}</p>
      </div>
      <ExportMenu
        :disabled="classesFiltrees.length === 0"
        @excel="exportToExcel"
        @pdf="exportToPdf"
      />
    </div>

    <LoadingSpinner v-if="loading && !classes.length" />

    <EmptyState
      v-else-if="options.length === 0"
      :title="libelles.vide"
      :description="libelles.videDescription"
    />

    <template v-else>
      <div class="row g-3 align-items-end mb-3">
        <div class="col-md-6 col-lg-4">
          <label for="dimension-select" class="form-label small fw-bold text-secondary">
            {{ libelles.label }}
          </label>
          <select id="dimension-select" v-model="selectedId" class="form-select">
            <option v-for="option in options" :key="option.id" :value="option.id">
              {{ option.libelle
              }}<template v-if="option.detail"> — {{ option.detail }}</template> ({{
                option.nbClasses
              }}
              classe{{ option.nbClasses > 1 ? 's' : '' }})
            </option>
          </select>
        </div>

        <div class="col-md-6 col-lg-8">
          <div class="d-flex flex-wrap gap-2 justify-content-md-end">
            <span class="badge bg-primary-subtle text-primary px-3 py-2">
              {{ totaux.nbClasses }} classe(s)
            </span>
            <span class="badge bg-success-subtle text-success px-3 py-2">
              {{ totaux.effectif }} inscrit(s)
            </span>
            <span class="badge bg-info-subtle text-info px-3 py-2">
              {{ totaux.placesRestantes }} place(s) libre(s) sur {{ totaux.capacite }}
            </span>
            <span class="badge bg-light text-dark border px-3 py-2">
              remplissage {{ totaux.taux.toFixed(1) }} %
            </span>
          </div>
        </div>
      </div>

      <EmptyState
        v-if="classesFiltrees.length === 0"
        :title="`Aucune classe pour ${selection?.libelle ?? 'cette sélection'}`"
        description="Rattachez une classe depuis le bouton « Ajouter un nouveau », ou choisissez une autre entrée."
        :size="80"
      />

      <template v-else>
        <div class="table-responsive">
          <table class="table align-middle mb-0">
            <thead>
              <tr>
                <th class="ps-3">#</th>
                <th>Code</th>
                <th>{{ libelles.colonne }}</th>
                <th class="text-center">Effectif / Capacité max</th>
                <th style="min-width: 160px">Remplissage</th>
                <th class="text-end pe-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(classe, index) in paginated" :key="classe.id">
                <td class="ps-3 text-muted">{{ startIndex + index + 1 }}</td>
                <td>
                  <strong class="text-dark">{{ classe.code }}</strong>
                </td>
                <td>
                  <span class="badge bg-secondary-subtle text-secondary px-2 py-1 rounded">
                    {{ (parFiliere ? classe.niveau_code : classe.filiere_nom) || '—' }}
                  </span>
                </td>
                <td class="text-center">
                  <span class="badge bg-success-subtle text-success px-2 py-1 rounded fw-semibold">
                    {{ classe.nb_etudiants ?? 0 }} / {{ classe.capacite_max ?? 0 }}
                  </span>
                </td>
                <td>
                  <div class="d-flex align-items-center gap-2">
                    <div class="progress flex-grow-1" style="height: 6px">
                      <div
                        class="progress-bar"
                        :class="barreTaux(tauxClasse(classe))"
                        role="progressbar"
                        :style="{ width: `${Math.min(tauxClasse(classe), 100)}%` }"
                      ></div>
                    </div>
                    <small class="text-muted font-monospace">
                      {{ tauxClasse(classe).toFixed(0) }} %
                    </small>
                  </div>
                </td>
                <td class="text-end pe-3">
                  <ItemActions
                    :item="classe"
                    :label="classe.code"
                    :actions="actions"
                    @action="onAction"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <Pagination
          v-model="page"
          v-model:items-per-page="itemsPerPage"
          :total-items="classesFiltrees.length"
        />
      </template>
    </template>
  </div>
</template>
