<script setup>
import { computed, ref } from 'vue';
import { domaineInfo } from '../apercus';

/**
 * Les sources de données que le rôle de l'appelant permet d'interroger.
 *
 * ## Pourquoi les montrer, et sous cette forme
 *
 * Le panneau précédent disait « 20 vues, selon votre rôle » suivi de cinq
 * pastilles de domaine. C'est un compteur, pas une réponse : il ne dit ni ce
 * qu'on peut demander, ni surtout ce qu'on ne peut pas. Une question qui
 * n'aboutit pas devenait alors inexplicable.
 *
 * La liste nommée règle cela : elle se lit comme un périmètre. Vérifié sur le
 * jeu de démonstration — ADMIN 20 vues sur cinq domaines, SCOLARITE 14,
 * PEDAGOGIE 13 et **aucune source financière** : un responsable pédagogique y
 * voit du premier coup d'œil pourquoi une question sur les impayés n'aboutira
 * pas, au lieu d'attribuer le refus à une panne.
 *
 * ## Repliée par défaut
 *
 * Vingt vues avec leurs descriptions occupent un écran entier. C'est une
 * référence qu'on consulte, pas une chose qu'on lit en arrivant : l'en-tête
 * suffit tant qu'on ne la déplie pas.
 *
 * ## Ce qui n'est pas affiché
 *
 * Les colonnes, pourtant rendues par `GET /catalogue`. Elles n'apprennent rien
 * à qui pose ses questions en français, et étaler le schéma de la base à chaque
 * visite est exactement ce que le masquage du SQL cherche à éviter hors du rôle
 * ADMIN.
 */

const props = defineProps({
  /** Ce que rend `GET /catalogue` : `{ nbVues, domaines, vues }`. */
  catalogue: { type: Object, default: null },

  /**
   * Le diagnostic (`GET /sante`), utilisé comme repli.
   *
   * Il porte `sources: { nbVues, domaines }` et arrive avant le catalogue —
   * c'est ce qui permet d'annoncer le périmètre sans attendre, et de dire
   * quelque chose de juste même si le catalogue échoue.
   */
  sante: { type: Object, default: null },
});

const ouvert = ref(false);

const nbVues = computed(() => props.catalogue?.nbVues ?? props.sante?.sources?.nbVues ?? 0);

const domaines = computed(() => props.catalogue?.domaines ?? props.sante?.sources?.domaines ?? []);

/** Les vues groupées par domaine, dans l'ordre où le catalogue les donne. */
const groupes = computed(() => {
  const vues = props.catalogue?.vues ?? [];

  return domaines.value
    .map((domaine) => ({
      domaine,
      ...domaineInfo(domaine),
      vues: vues.filter((vue) => vue.domaine === domaine),
    }))
    .filter((groupe) => groupe.vues.length);
});
</script>

<template>
  <div v-if="nbVues" class="card border-0 shadow-sm">
    <button
      type="button"
      class="btn text-start w-100 d-flex align-items-center gap-2 px-3 py-2 sources-entete"
      :aria-expanded="ouvert"
      @click="ouvert = !ouvert"
    >
      <i
        class="bi text-body-secondary"
        :class="ouvert ? 'bi-chevron-down' : 'bi-chevron-right'"
      ></i>

      <span class="small fw-semibold">
        Les {{ nbVues }} sources que votre rôle permet d'interroger
      </span>

      <span class="ms-auto d-flex flex-wrap gap-1">
        <span
          v-for="domaine in domaines"
          :key="domaine"
          class="badge rounded-pill"
          :class="`bg-${domaineInfo(domaine).couleur}-subtle text-${domaineInfo(domaine).couleur}-emphasis`"
        >
          {{ domaineInfo(domaine).libelle }}
        </span>
      </span>
    </button>

    <div v-if="ouvert" class="card-body pt-0 px-3 pb-3">
      <!-- Le catalogue n'est pas encore arrivé : on a le compte et les
           domaines par `/sante`, pas le détail. Le dire vaut mieux qu'un vide
           qu'on prendrait pour une absence de sources. -->
      <p v-if="!groupes.length" class="small text-body-secondary mb-0">
        Le détail des sources n'a pas pu être chargé. Les domaines ci-dessus restent exacts.
      </p>

      <div v-for="groupe in groupes" :key="groupe.domaine" class="mt-3">
        <h6 class="small fw-bold mb-2" :class="`text-${groupe.couleur}-emphasis`">
          <i class="bi me-1" :class="groupe.icone"></i>{{ groupe.libelle }}
          <span class="text-body-secondary fw-normal">({{ groupe.vues.length }})</span>
        </h6>

        <div class="row g-2">
          <div v-for="vue in groupe.vues" :key="vue.nom" class="col-md-6 col-xl-4">
            <div class="h-100 px-2 py-2 sources-vue">
              <code class="d-block small">{{ vue.nom }}</code>
              <p class="mb-0 sources-description text-body-secondary">
                {{ vue.description || 'Sans description.' }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sources-entete {
  border: 0;
  border-radius: 0.375rem;
}

.sources-entete:hover {
  background: rgba(0, 0, 0, 0.02);
}

.sources-vue {
  background: rgba(0, 0, 0, 0.02);
  border-radius: 6px;
}

/* La description d'une vue est une glose, souvent longue : elle doit rester
   lisible sans concurrencer le nom qu'elle explique. */
.sources-description {
  font-size: 0.74rem;
  line-height: 1.35;
}
</style>
