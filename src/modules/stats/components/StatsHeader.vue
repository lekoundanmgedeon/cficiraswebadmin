<template>
  <div>
    <div class="row">
      <div class="col-md-12 grid-margin">
        <div class="d-flex justify-content-between flex-wrap">
          <div class="d-flex align-items-end flex-wrap">
            <div class="me-md-3 me-xl-5">
              <h2>Statistiques et Rapports</h2>
              <p class="mb-md-0">Résultats académiques : réussite, moyennes et mentions</p>
            </div>
            <div class="d-flex">
              <i class="mdi mdi-home text-muted hover-cursor"></i>
              <p class="text-muted mb-0 hover-cursor">&nbsp;/&nbsp;Statistiques&nbsp;/&nbsp;</p>
              <p class="text-primary mb-0 hover-cursor">Résultats</p>
            </div>
          </div>

          <div class="d-flex justify-content-between align-items-end flex-wrap gap-2">
            <!--
              Le calcul exige le triplet complet (classe, semestre, année) : la
              fonction serveur les demande tous les trois. Le bouton reste donc
              désactivé tant que le périmètre est partiel, avec la raison en
              info-bulle — plutôt qu'un clic qui échouerait en 400.
            -->
            <button
              class="btn btn-primary mt-2 mt-xl-0"
              :disabled="!peutGenerer || generation"
              :title="
                peutGenerer
                  ? 'Recalculer les bulletins de ce périmètre'
                  : 'Choisissez une classe, un semestre et une année'
              "
              @click="$emit('generer')"
            >
              <span
                v-if="generation"
                class="spinner-border spinner-border-sm me-1"
                role="status"
                aria-hidden="true"
              ></span>
              <i v-else class="mdi mdi-calculator me-1"></i>
              Calculer les bulletins
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="row">
      <div class="col-md-12">
        <div class="card border-0 shadow-sm rounded-4 bg-white p-3 mb-3">
          <BulletinContexte v-model="contexte" />
          <p class="text-xs text-muted mb-0">
            Sans sélection, les statistiques portent sur l'ensemble des bulletins enregistrés.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
// Le sélecteur (année → semestre → classe) vit dans `examens` : c'est lui qui
// porte la règle « un semestre appartient à une année ». La dépendance
// `stats → examens` est dirigée et déclarée, comme `notes → examens`.
import BulletinContexte from '@/modules/examens/bulletin/components/BulletinContexte.vue';

const props = defineProps({
  filtres: { type: Object, required: true },
  peutGenerer: { type: Boolean, default: false },
  generation: { type: Boolean, default: false },
});

const emit = defineEmits(['generer', 'changer-contexte']);

/**
 * `BulletinContexte` parle en `{anneeId, semestreId, classeId}` et attend une
 * chaîne vide pour « non choisi » ; le store retient `null`. La conversion se
 * fait ici, pour que ni l'un ni l'autre n'ait à connaître les conventions de son
 * voisin.
 */
const contexte = computed({
  get: () => ({
    anneeId: props.filtres.anneeId ?? '',
    semestreId: props.filtres.semestreId ?? '',
    classeId: props.filtres.classeId ?? '',
  }),
  set: (valeur) => {
    emit('changer-contexte', {
      anneeId: valeur.anneeId || null,
      semestreId: valeur.semestreId || null,
      classeId: valeur.classeId || null,
    });
  },
});
</script>

<style scoped>
.text-xs {
  font-size: 11px !important;
}
.rounded-4 {
  border-radius: 0.2rem !important;
}
</style>
