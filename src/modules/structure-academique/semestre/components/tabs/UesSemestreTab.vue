<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import ItemActions from '@/shared/components/ItemActions.vue';
import ExportMenu from '@/shared/components/ExportMenu.vue';
import EmptyState from '@/shared/components/EmptyState.vue';
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue';
import { useTableExport } from '@/shared/composables/useTableExport';
import { formatDate } from '@/shared/utils/date';
import { useModuleStore } from '@/modules/matieres/store';
import AssignationModal from '@/modules/matieres/components/AssignationModal.vue';
import { useSemestreStore } from '../../store';
import { useClasseStore } from '../../../classe/store';

/**
 * Unités d'enseignement d'un semestre, classe par classe.
 *
 * L'onglet « Niveaux » de cet écran n'avait rien à y faire : un semestre n'a pas
 * de niveau — la table `semestre` ne porte qu'un code, une année et deux dates.
 * Il cède la place à la question qui se pose vraiment ici : **ce qui est
 * enseigné pendant ce semestre**.
 *
 * ### Trois pièges du domaine, absorbés ici
 *
 * 1. **« Semestre actif » a deux sens.** `GET /semestres/courants/actifs`
 *    (`findActiveAnneeSemestres`) ne renvoie pas les semestres dont `est_actif`
 *    est vrai, mais **tous ceux de l'année académique active** — le nom de la
 *    route ment. On affiche donc le périmètre réel (l'année active) et on
 *    signale séparément les semestres réellement en cours.
 *
 * 2. **La liste des classes ne vient pas des configurations.**
 *    `v_semestre_configurations` est construite `FROM ModuleClasse` : une classe
 *    n'y apparaît qu'**après** avoir reçu sa première UE. S'en servir comme
 *    sélecteur rendrait impossible le rattachement de la première UE d'une
 *    classe. Les classes viennent donc de `GET /classes`, et les configurations
 *    servent seulement à indiquer lesquelles sont déjà pourvues.
 *
 * 3. **`v_module_classe_semestres` parle un autre vocabulaire** que
 *    `GET /modules` : `libelle`, `credits` et `heures` contre `designation`,
 *    `credit` et `volume_horaire`. On lit les deux graphies.
 *
 * Le détachement porte sur `attribution_id`, l'identifiant du **lien**
 * `ModuleClasse` : détacher une UE d'une classe ne supprime pas le module.
 */

const semestreStore = useSemestreStore();
const classeStore = useClasseStore();
const moduleStore = useModuleStore();

const { actifs, loading: semestreLoading } = storeToRefs(semestreStore);
const { items: classes } = storeToRefs(classeStore);
const { configurations, ues, loading: moduleLoading } = storeToRefs(moduleStore);

const selectedSemestreId = ref('');
const selectedClasseId = ref('');

/** Semestres réellement en cours d'abord ; à défaut, ordre chronologique. */
const semestres = computed(() =>
  [...actifs.value].sort((a, b) => {
    if (Boolean(a.est_actif) !== Boolean(b.est_actif)) return a.est_actif ? -1 : 1;
    return String(a.date_debut ?? '').localeCompare(String(b.date_debut ?? ''));
  })
);

const semestre = computed(() =>
  semestres.value.find((item) => String(item.id) === String(selectedSemestreId.value))
);

/** Les couples (semestre, classe) qui portent déjà au moins une UE. */
const classesPourvues = computed(() => {
  const pourvues = new Set();
  for (const config of configurations.value) {
    if (String(config.semestre_id) === String(selectedSemestreId.value)) {
      pourvues.add(String(config.classe_id));
    }
  }
  return pourvues;
});

const classesOptions = computed(() =>
  classes.value.map((classe) => ({
    id: classe.id,
    code: classe.code,
    libelle: [classe.code, classe.filiere_nom, classe.niveau_code].filter(Boolean).join(' — '),
    pourvue: classesPourvues.value.has(String(classe.id)),
  }))
);

const classe = computed(() =>
  classesOptions.value.find((item) => String(item.id) === String(selectedClasseId.value))
);

/** La configuration attendue par la modale d'assignation. */
const config = computed(() => {
  if (!semestre.value || !classe.value) return null;

  const source = classes.value.find((item) => String(item.id) === String(classe.value.id));
  return {
    id: `${semestre.value.id}_${classe.value.id}`,
    semestre_id: semestre.value.id,
    classe_id: classe.value.id,
    code: semestre.value.code,
    periode: semestre.value.annee_academique_code ?? '',
    filiere: source?.filiere_nom ?? '',
    niveau: source?.niveau_code ?? '',
  };
});

const nombre = (valeur) => Number(valeur ?? 0) || 0;

const creditUe = (ue) => nombre(ue.credits ?? ue.credit);
const heuresUe = (ue) => nombre(ue.heures ?? ue.volume_horaire);
const libelleUe = (ue) => ue.libelle ?? ue.designation ?? '—';

const totaux = computed(() => ({
  nbUes: ues.value.length,
  credits: ues.value.reduce((somme, ue) => somme + creditUe(ue), 0),
  heures: ues.value.reduce((somme, ue) => somme + heuresUe(ue), 0),
}));

const loading = computed(() => semestreLoading.value || moduleLoading.value);

const { exportToExcel, exportToPdf } = useTableExport({
  rows: computed(() =>
    ues.value.map((ue, index) => ({
      'N°': index + 1,
      Code: ue.code,
      "Unité d'enseignement": libelleUe(ue),
      Crédits: creditUe(ue),
      'Volume horaire': `${heuresUe(ue)} h`,
    }))
  ),
  title: "Unités d'enseignement du semestre",
  fileBaseName: 'ue_semestre',
  filters: () => [
    { label: 'Semestre', value: semestre.value?.code ?? '—' },
    { label: 'Classe', value: classe.value?.libelle ?? '—' },
    { label: 'Total crédits', value: totaux.value.credits },
    { label: 'Volume horaire', value: `${totaux.value.heures} h` },
  ],
});

const actions = [
  {
    key: 'detach',
    label: 'Détacher de la classe',
    icon: 'mdi-link-variant-off',
    variant: 'danger',
    confirm: {
      title: 'Détacher l’unité d’enseignement',
      message:
        'Le module sera retiré de cette classe pour ce semestre. Le module lui-même n’est pas supprimé.',
      confirmLabel: 'Détacher',
      variant: 'danger',
    },
  },
];

/** @param {{key: string, item: any}} event */
function onAction({ key, item }) {
  if (key !== 'detach') return;
  moduleStore.detachUe(item.attribution_id, selectedSemestreId.value, selectedClasseId.value);
}

onMounted(async () => {
  await Promise.all([
    semestreStore.fetchActifs(),
    classeStore.fetchAll(),
    moduleStore.fetchConfigurations(),
  ]);
});

// Un semestre en cours si le serveur en signale un, le premier de l'année sinon.
watch(
  semestres,
  (liste) => {
    if (!semestre.value) selectedSemestreId.value = liste[0]?.id ?? '';
  },
  { immediate: true }
);

// La classe suit le semestre : on ouvre d'abord une classe déjà pourvue en UE,
// puisque c'est celle qui a quelque chose à montrer.
watch(
  [classesOptions, selectedSemestreId],
  ([liste]) => {
    if (classe.value && classesPourvues.value.has(String(classe.value.id))) return;
    const pourvue = liste.find((option) => option.pourvue);
    selectedClasseId.value = pourvue?.id ?? classe.value?.id ?? liste[0]?.id ?? '';
  },
  { immediate: true }
);

// `GET /modules/configuration/details` exige les deux identifiants (400 sinon) ;
// le store se charge de ne pas partir sans eux.
watch(
  [selectedSemestreId, selectedClasseId],
  ([semestreId, classeId]) => moduleStore.fetchUes(semestreId, classeId),
  { immediate: true }
);
</script>

<template>
  <div>
    <div class="d-flex justify-content-between align-items-start mb-3 flex-wrap gap-2">
      <div>
        <h4 class="mb-1">Unités d'enseignement</h4>
        <p class="text-muted small mb-0">
          Ce qui est enseigné pendant le semestre, classe par classe. Les semestres proposés sont
          ceux de l'année académique active.
        </p>
      </div>

      <div class="d-flex gap-2">
        <ExportMenu :disabled="ues.length === 0" @excel="exportToExcel" @pdf="exportToPdf" />
        <AssignationModal :config="config" />
      </div>
    </div>

    <LoadingSpinner v-if="loading && !semestres.length" />

    <EmptyState
      v-else-if="!semestres.length"
      title="Aucun semestre sur l'année active"
      description="Créez un semestre rattaché à l'année académique active depuis l'onglet « Liste des semestres »."
    />

    <template v-else>
      <div class="row g-3 align-items-end mb-3">
        <div class="col-md-6 col-lg-4">
          <label for="semestre-select" class="form-label small fw-bold text-secondary">
            Semestre
          </label>
          <select id="semestre-select" v-model="selectedSemestreId" class="form-select">
            <option v-for="item in semestres" :key="item.id" :value="item.id">
              {{ item.code }}<template v-if="item.est_actif"> — en cours</template>
            </option>
          </select>
        </div>

        <div class="col-md-6 col-lg-5">
          <label for="classe-ue-select" class="form-label small fw-bold text-secondary">
            Classe
          </label>
          <select id="classe-ue-select" v-model="selectedClasseId" class="form-select">
            <option v-for="option in classesOptions" :key="option.id" :value="option.id">
              {{ option.libelle }}{{ option.pourvue ? '' : ' — aucune UE' }}
            </option>
          </select>
        </div>

        <div class="col-lg-3">
          <div class="d-flex flex-wrap gap-2 justify-content-lg-end">
            <span
              class="badge px-3 py-2"
              :class="
                semestre?.est_actif ? 'bg-success-subtle text-success' : 'bg-light text-dark border'
              "
            >
              {{ semestre?.est_actif ? 'Semestre en cours' : 'Semestre planifié' }}
            </span>
            <span v-if="semestre" class="badge bg-light text-dark border px-3 py-2">
              {{ formatDate(semestre.date_debut) }} → {{ formatDate(semestre.date_fin) }}
            </span>
          </div>
        </div>
      </div>

      <div v-if="ues.length" class="row g-3 mb-3">
        <div class="col-md-4">
          <div class="card border-0 shadow-sm p-3 border-start border-primary border-3">
            <span class="text-muted small fw-semibold text-uppercase d-block mb-1">
              Unités rattachées
            </span>
            <h4 class="fw-bold text-primary mb-0 font-monospace">{{ totaux.nbUes }}</h4>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card border-0 shadow-sm p-3 border-start border-success border-3">
            <span class="text-muted small fw-semibold text-uppercase d-block mb-1">
              Total crédits
            </span>
            <h4 class="fw-bold text-success mb-0 font-monospace">{{ totaux.credits }} ECTS</h4>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card border-0 shadow-sm p-3 border-start border-info border-3">
            <span class="text-muted small fw-semibold text-uppercase d-block mb-1">
              Volume horaire
            </span>
            <h4 class="fw-bold text-info mb-0 font-monospace">{{ totaux.heures }} h</h4>
          </div>
        </div>
      </div>

      <LoadingSpinner v-if="moduleLoading && !ues.length" />

      <EmptyState
        v-else-if="!classesOptions.length"
        title="Aucune classe enregistrée"
        description="Créez une classe avant de lui rattacher des unités d'enseignement."
        :size="80"
      />

      <EmptyState
        v-else-if="!ues.length"
        title="Aucune unité d'enseignement"
        :description="`Aucun module n'est rattaché à ${classe?.code ?? 'cette classe'} pour le semestre ${semestre?.code ?? ''}. Utilisez « Rattacher un module ».`"
        :size="80"
      />

      <div v-else class="table-responsive card border-0 shadow-sm">
        <table class="table table-hover align-middle mb-0">
          <thead class="table-light">
            <tr>
              <th class="ps-3" style="width: 60px">#</th>
              <th>Code</th>
              <th>Unité d'enseignement</th>
              <th class="text-center">Crédits</th>
              <th class="text-center">Volume</th>
              <th class="text-end pe-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(ue, index) in ues" :key="ue.attribution_id">
              <td class="ps-3 text-muted">{{ index + 1 }}</td>
              <td>
                <strong class="text-dark">{{ ue.code }}</strong>
              </td>
              <td class="fw-semibold text-dark">{{ libelleUe(ue) }}</td>
              <td class="text-center">
                <span class="badge bg-primary-subtle text-primary px-2 py-1 rounded">
                  {{ creditUe(ue) }} ECTS
                </span>
              </td>
              <td class="text-center">{{ heuresUe(ue) }} h</td>
              <td class="text-end pe-3">
                <ItemActions
                  :item="ue"
                  :label="libelleUe(ue)"
                  :actions="actions"
                  :loading="moduleLoading"
                  @action="onAction"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>
