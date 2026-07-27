<template>
  <div class="row g-3 align-items-end mb-3">
    <div class="col-md-3">
      <label class="form-label fw-bold small">Année académique</label>
      <select class="form-select" :value="filtres.anneeId ?? ''" @change="set('anneeId', $event)">
        <option value="">Toutes les années</option>
        <option v-for="annee in annees" :key="annee.id" :value="annee.id">
          {{ annee.code }}
        </option>
      </select>
    </div>

    <div class="col-md-2">
      <label class="form-label fw-bold small">Cycle</label>
      <select class="form-select" :value="filtres.cycleId ?? ''" @change="set('cycleId', $event)">
        <option value="">Tous les cycles</option>
        <option v-for="cycle in cycles" :key="cycle.id" :value="cycle.id">
          {{ cycle.code }}
        </option>
      </select>
    </div>

    <div class="col-md-3">
      <label class="form-label fw-bold small">Filière</label>
      <select
        class="form-select"
        :value="filtres.filiereId ?? ''"
        @change="set('filiereId', $event)"
      >
        <option value="">Toutes les filières</option>
        <option v-for="filiere in filieresDuCycle" :key="filiere.id" :value="filiere.id">
          {{ filiere.designation }}
        </option>
      </select>
    </div>

    <div class="col-md-2">
      <label class="form-label fw-bold small">Classe</label>
      <select class="form-select" :value="filtres.classeId ?? ''" @change="set('classeId', $event)">
        <option value="">Toutes les classes</option>
        <option v-for="classe in classesDeLaFiliere" :key="classe.id" :value="classe.id">
          {{ classe.code }}
        </option>
      </select>
    </div>

    <div class="col-md-2">
      <label class="form-label fw-bold small">Semestre</label>
      <select
        class="form-select"
        :value="filtres.semestreId ?? ''"
        @change="set('semestreId', $event)"
      >
        <option value="">Tous les semestres</option>
        <option v-for="semestre in semestresDeLAnnee" :key="semestre.id" :value="semestre.id">
          {{ semestre.code }}
        </option>
      </select>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useAnneeStore } from '@/modules/structure-academique/annee/store';
import { useCycleStore } from '@/modules/structure-academique/cycle/store';
import { useFiliereStore } from '@/modules/structure-academique/filiere/store';
import { useClasseStore } from '@/modules/structure-academique/classe/store';
import { useSemestreStore } from '@/modules/structure-academique/semestre/store';

/**
 * Les cinq filtres de l'emploi du temps général.
 *
 * L'ancien écran servait ces listes **en dur** : « 2022-2023 », « Informatique »,
 * « LAP 1 » — des valeurs qui n'existent nulle part en base. Elles viennent
 * maintenant des référentiels.
 *
 * Les listes sont **chaînées** : les filières proposées sont celles du cycle
 * retenu, les classes celles de la filière, les semestres ceux de l'année. Sans
 * ce chaînage, on pourrait composer un périmètre vide de sens (une classe de
 * Droit dans le cycle Ingénieur) et croire à une absence de données.
 */
const props = defineProps({
  filtres: { type: Object, required: true },
});

const emit = defineEmits(['changer']);

const anneeStore = useAnneeStore();
const cycleStore = useCycleStore();
const filiereStore = useFiliereStore();
const classeStore = useClasseStore();
const semestreStore = useSemestreStore();

const { items: annees } = storeToRefs(anneeStore);
const { items: cycles } = storeToRefs(cycleStore);
const { items: filieres } = storeToRefs(filiereStore);
const { items: classes } = storeToRefs(classeStore);
const { items: semestres } = storeToRefs(semestreStore);

// Les cinq référentiels sont chargés une fois puis filtrés en mémoire : appeler
// une action de filtrage sur un store partagé écraserait ses `items`, un état
// dont dépend toute l'application (leçon du §1.4).
onMounted(() =>
  Promise.all([
    anneeStore.fetchAll(),
    cycleStore.fetchAll(),
    filiereStore.fetchAll(),
    classeStore.fetchAll(),
    semestreStore.fetchAll(),
  ])
);

const filieresDuCycle = computed(() =>
  props.filtres.cycleId
    ? filieres.value.filter((f) => f.cycle_id === props.filtres.cycleId)
    : filieres.value
);

const classesDeLaFiliere = computed(() =>
  props.filtres.filiereId
    ? classes.value.filter((c) => c.filiere_id === props.filtres.filiereId)
    : classes.value
);

const semestresDeLAnnee = computed(() =>
  props.filtres.anneeId
    ? semestres.value.filter((s) => s.annee_id === props.filtres.anneeId)
    : semestres.value
);

/**
 * Une chaîne vide veut dire « pas de restriction » : elle est convertie en
 * `null`, que le store sait ne pas transmettre.
 *
 * Changer de cycle, de filière ou d'année **invalide les filtres qui en
 * dépendent** — sans quoi on garderait une classe qui n'appartient plus à la
 * filière choisie, et la grille resterait vide sans raison visible.
 */
const set = (champ, event) => {
  const valeur = event.target.value || null;
  const modifs = { [champ]: valeur };

  if (champ === 'cycleId') Object.assign(modifs, { filiereId: null, classeId: null });
  if (champ === 'filiereId') Object.assign(modifs, { classeId: null });
  if (champ === 'anneeId') Object.assign(modifs, { semestreId: null });

  emit('changer', modifs);
};
</script>
