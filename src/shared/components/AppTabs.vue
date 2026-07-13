<script setup>
import { computed, markRaw, ref, toRaw, watch } from 'vue';

/**
 * Onglets à montage paresseux.
 *
 * Remplace les 27 conteneurs d'onglets Bootstrap du projet. Le balisage
 * `data-bs-toggle="tab"` rend **tous les panneaux dans le DOM d'un coup** et se
 * contente d'en masquer certains en CSS : chaque onglet exécutait donc son
 * `onMounted` — et ses appels API — au chargement de la page, y compris ceux que
 * l'utilisateur n'ouvrait jamais. Une page à cinq onglets déclenchait cinq
 * séries de requêtes pour n'en afficher qu'une.
 *
 * Ici, seul l'onglet actif est monté. `KeepAlive` conserve ensuite les onglets
 * déjà visités : y revenir ne relance ni le rendu, ni les requêtes, et préserve
 * leur état local (filtres de recherche, pagination).
 *
 * @example
 * <AppTabs :tabs="[
 *   { id: 'liste', label: 'Liste', component: ListeTab },
 *   { id: 'stats', label: 'Statistiques', component: StatsTab },
 * ]" />
 *
 * ## Deux pièges de `KeepAlive`, tous deux corrigés ici
 *
 * **1. Un composant ne doit jamais transiter par un proxy réactif.** Dès que la
 * liste d'onglets est construite dans un `computed` — ce que font toutes les vues
 * de détail — Vue enveloppe les définitions de composants qu'elle contient :
 *
 * > *[Vue warn] Vue received a Component that was made a reactive object. […]
 * > should be avoided by marking the component with `markRaw`.*
 *
 * Ce n'est pas qu'un avertissement de performance : le composant proxifié casse
 * la mécanique de cache de `KeepAlive`. D'où le `toRaw` + `markRaw` ci-dessous.
 * Les appelants n'ont ainsi rien à savoir de tout cela.
 *
 * **2. Pas de `v-if` sur le `<component>` *à l'intérieur* du `KeepAlive`.**
 * Quand la condition est fausse, `KeepAlive` reçoit un vnode *Comment* en enfant.
 * Au changement d'onglet, son `activate` finit par appeler
 * `parentComponent.ctx.deactivate(vnode)` sur un parent qui n'est pas lui :
 *
 * ```
 * TypeError: parentComponent.ctx.deactivate is not a function
 *     at unmount → patch → sharedContext.activate
 * ```
 *
 * L'onglet cliqué ne s'affichait alors pas. La condition porte donc sur le
 * `KeepAlive` lui-même, qui ne reçoit plus qu'un vrai composant.
 */

const props = defineProps({
  /**
   * @type {import('vue').PropType<Array<{
   *   id: string,
   *   label: string,
   *   component: object,
   *   props?: Record<string, any>,
   * }>>}
   */
  tabs: { type: Array, required: true },

  /** Id de l'onglet ouvert au premier rendu. Par défaut, le premier de la liste. */
  defaultTab: { type: String, default: null },
});

const emit = defineEmits(['change']);

const activeId = ref(props.defaultTab ?? props.tabs[0]?.id);

const activeTab = computed(
  () => props.tabs.find((tab) => tab.id === activeId.value) ?? props.tabs[0]
);

/**
 * La définition du composant actif, **hors de toute réactivité**.
 *
 * `toRaw` retire l'éventuel proxy posé par un `computed` appelant, `markRaw`
 * empêche Vue d'en reposer un. Sans cela, `KeepAlive` ne sait plus reconnaître
 * ses propres composants (voir l'en-tête du fichier).
 */
const activeComponent = computed(() => {
  const component = activeTab.value?.component;
  return component ? markRaw(toRaw(component)) : null;
});

// Si la liste d'onglets change et que l'onglet courant disparaît, on se rabat
// sur le premier plutôt que de rendre un panneau vide.
watch(
  () => props.tabs,
  (tabs) => {
    if (!tabs.some((tab) => tab.id === activeId.value)) {
      activeId.value = tabs[0]?.id;
    }
  }
);

/** @param {string} id */
function select(id) {
  if (id === activeId.value) return;
  activeId.value = id;
  emit('change', id);
}
</script>

<template>
  <div>
    <ul class="nav nav-tabs px-4" role="tablist">
      <li v-for="tab in tabs" :key="tab.id" class="nav-item">
        <button
          type="button"
          role="tab"
          class="nav-link"
          :class="{ active: activeId === tab.id }"
          :aria-selected="activeId === tab.id"
          @click="select(tab.id)"
        >
          {{ tab.label }}
        </button>
      </li>
    </ul>

    <div class="tab-content p-4">
      <!-- Le `v-if` porte sur le `KeepAlive`, jamais sur le `<component>` qu'il
           enveloppe : sinon il reçoit un vnode Comment et son `activate` plante
           (voir l'en-tête). La `key` lui permet de distinguer ses caches. -->
      <KeepAlive v-if="activeComponent">
        <component :is="activeComponent" :key="activeTab.id" v-bind="activeTab.props" />
      </KeepAlive>
    </div>
  </div>
</template>

<style scoped>
/* Les onglets sont des <button> et non des <a> : on neutralise le style natif
   du bouton pour retrouver exactement l'apparence Bootstrap d'origine. */
.nav-link {
  background: none;
  border-top-color: transparent;
  border-left-color: transparent;
  border-right-color: transparent;
}
</style>
