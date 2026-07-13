<script setup>
import { computed, onMounted, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useAnneeStore } from '@/modules/structure-academique/annee/store';
import { useSemestreStore } from '@/modules/structure-academique/semestre/store';
import { useClasseStore } from '@/modules/structure-academique/classe/store';

/**
 * Sélecteur du contexte d'un bulletin : **année, semestre, classe**.
 *
 * Un bulletin n'existe pas « pour une classe » : il existe pour le triplet
 * (classe, semestre, année). `GET /resultats/classes/:id/bulletins` répond
 * `400` si `semestreId` ou `anneeId` manque — les trois sélecteurs sont donc la
 * condition d'une requête valide, pas un confort d'interface.
 *
 * Un semestre appartient à une année (`semestre.annee_id`) : changer d'année
 * invalide le semestre retenu.
 */

const model = defineModel({
  type: Object,
  default: () => ({ anneeId: '', semestreId: '', classeId: '' }),
});

const anneeStore = useAnneeStore();
const semestreStore = useSemestreStore();
const classeStore = useClasseStore();

const { items: annees } = storeToRefs(anneeStore);
const { items: semestres } = storeToRefs(semestreStore);
const { items: classes } = storeToRefs(classeStore);

onMounted(() =>
  Promise.all([anneeStore.fetchAll(), semestreStore.fetchAll(), classeStore.fetchAll()])
);

/** Les semestres de l'année retenue. */
const semestresAnnee = computed(() => {
  if (!model.value.anneeId) return [];
  return semestres.value.filter((semestre) => semestre.annee_id === model.value.anneeId);
});

// Changer d'année invalide le semestre : il appartenait à l'autre année.
watch(
  () => model.value.anneeId,
  () => {
    if (model.value.semestreId) model.value = { ...model.value, semestreId: '' };
  }
);

/** @param {'anneeId'|'semestreId'|'classeId'} champ @param {Event} event */
const set = (champ, event) => {
  model.value = { ...model.value, [champ]: event.target.value };
};
</script>

<template>
  <div class="row g-3 align-items-end mb-4">
    <div class="col-md-3">
      <label class="form-label fw-bold small">Année académique</label>
      <select
        class="form-select form-select-sm"
        :value="model.anneeId"
        @change="set('anneeId', $event)"
      >
        <option value="">— Année —</option>
        <option v-for="annee in annees" :key="annee.id" :value="annee.id">
          {{ annee.code }}
        </option>
      </select>
    </div>

    <div class="col-md-3">
      <label class="form-label fw-bold small">Semestre</label>
      <select
        class="form-select form-select-sm"
        :value="model.semestreId"
        :disabled="!model.anneeId"
        @change="set('semestreId', $event)"
      >
        <option value="">— Semestre —</option>
        <option v-for="semestre in semestresAnnee" :key="semestre.id" :value="semestre.id">
          {{ semestre.code }}
        </option>
      </select>
    </div>

    <div class="col-md-4">
      <label class="form-label fw-bold small">Classe</label>
      <select
        class="form-select form-select-sm"
        :value="model.classeId"
        @change="set('classeId', $event)"
      >
        <option value="">— Classe —</option>
        <option v-for="classe in classes" :key="classe.id" :value="classe.id">
          {{ classe.code }} — {{ classe.filiere_nom }}
        </option>
      </select>
    </div>

    <div class="col-md-2">
      <slot name="actions" />
    </div>
  </div>
</template>
